try {
  importScripts('../shared/shared.js');
} catch (err) {
  importScripts(chrome.runtime.getURL('shared/shared.js'));
}

/* global Stickey */

const KEYS = Stickey.KEYS;
const utils = Stickey.utils;

const DEFAULT_SETTINGS = {
  highlightColor: 'yellow',
  toolbarOnSelection: true,
  showHoverCard: true
};

chrome.runtime.onInstalled.addListener(async (details) => {
  await ensureDefaults();
  await createContextMenus();
  console.log('[Stickey] Installed:', details.reason);
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-panel') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'stickey_togglePanel' });
  } catch {
    // Content script may not be injected (e.g., chrome://)
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId === 'stickey_add_note') {
    chrome.tabs.sendMessage(tab.id, { action: 'stickey_createNote' }).catch(() => {});
    return;
  }
  if (info.menuItemId === 'stickey_highlight_selection') {
    chrome.tabs.sendMessage(tab.id, { action: 'stickey_highlightSelection' }).catch(() => {});
    return;
  }
  if (info.menuItemId === 'stickey_open_graph') {
    await openGraphView();
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg, sender)
    .then((res) => sendResponse(res))
    .catch((err) => {
      console.error('[Stickey] Message error:', err);
      sendResponse({ success: false, error: err?.message || String(err) });
    });
  return true;
});

async function ensureDefaults() {
  const { [KEYS.settings]: settings } = await chrome.storage.local.get(KEYS.settings);
  if (!settings) {
    await chrome.storage.local.set({ [KEYS.settings]: DEFAULT_SETTINGS });
  }

  const { [KEYS.allAnnotations]: allAnnotations } = await chrome.storage.local.get(KEYS.allAnnotations);
  const { [KEYS.pageMap]: pageMap } = await chrome.storage.local.get(KEYS.pageMap);
  if (!allAnnotations) await chrome.storage.local.set({ [KEYS.allAnnotations]: {} });
  if (!pageMap) await chrome.storage.local.set({ [KEYS.pageMap]: {} });
}

async function createContextMenus() {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: 'stickey_root', title: 'Stickey', contexts: ['all'] });
  chrome.contextMenus.create({
    id: 'stickey_highlight_selection',
    parentId: 'stickey_root',
    title: 'Highlight selection',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'stickey_add_note',
    parentId: 'stickey_root',
    title: 'Add note',
    contexts: ['page', 'selection']
  });
  chrome.contextMenus.create({
    id: 'stickey_open_graph',
    parentId: 'stickey_root',
    title: 'Open graph',
    contexts: ['all']
  });
}

async function openGraphView() {
  const url = chrome.runtime.getURL('graph/graph.html');
  await chrome.tabs.create({ url });
}

async function handleMessage(msg, sender) {
  const action = msg?.action;
  if (!action) return { success: false, error: 'Missing action' };

  switch (action) {
    case 'stickey_getSettings': {
      const { [KEYS.settings]: settings } = await chrome.storage.local.get(KEYS.settings);
      return { success: true, settings: { ...DEFAULT_SETTINGS, ...(settings || {}) } };
    }
    case 'stickey_updateSettings': {
      const next = msg.settings || {};
      const { [KEYS.settings]: settings } = await chrome.storage.local.get(KEYS.settings);
      await chrome.storage.local.set({
        [KEYS.settings]: { ...DEFAULT_SETTINGS, ...(settings || {}), ...next }
      });
      return { success: true };
    }
    case 'stickey_getAnnotationsForPage': {
      const pageUrl = msg.pageUrl || '';
      const pageKey = utils.getPageKeyFromUrl(pageUrl);
      const [{ [KEYS.allAnnotations]: allAnnotations = {} }, { [KEYS.pageMap]: pageMap = {} }] =
        await Promise.all([chrome.storage.local.get(KEYS.allAnnotations), chrome.storage.local.get(KEYS.pageMap)]);

      const ids = (pageMap[pageKey] || []).slice();
      const annotations = {};
      ids.forEach((id) => {
        if (allAnnotations[id]) annotations[id] = allAnnotations[id];
      });
      return { success: true, pageKey, ids, annotations };
    }
    case 'stickey_getAllAnnotations': {
      const { [KEYS.allAnnotations]: allAnnotations = {}, [KEYS.pageMap]: pageMap = {} } =
        await chrome.storage.local.get([KEYS.allAnnotations, KEYS.pageMap]);
      return { success: true, allAnnotations, pageMap };
    }
    case 'stickey_upsertAnnotation': {
      const annotation = sanitizeAnnotation(msg.annotation, sender);
      if (!annotation) return { success: false, error: 'Invalid annotation' };
      const pageKey = utils.getPageKeyFromUrl(annotation.pageUrl || '');

      const { [KEYS.allAnnotations]: allAnnotations = {}, [KEYS.pageMap]: pageMap = {} } =
        await chrome.storage.local.get([KEYS.allAnnotations, KEYS.pageMap]);

      allAnnotations[annotation.id] = annotation;
      if (pageKey) {
        if (!pageMap[pageKey]) pageMap[pageKey] = [];
        if (!pageMap[pageKey].includes(annotation.id)) pageMap[pageKey].push(annotation.id);
      }
      await chrome.storage.local.set({ [KEYS.allAnnotations]: allAnnotations, [KEYS.pageMap]: pageMap });
      return { success: true, annotation };
    }
    case 'stickey_deleteAnnotation': {
      const id = String(msg.id || '');
      const { [KEYS.allAnnotations]: allAnnotations = {}, [KEYS.pageMap]: pageMap = {} } =
        await chrome.storage.local.get([KEYS.allAnnotations, KEYS.pageMap]);

      const existing = allAnnotations[id];
      if (!existing) return { success: true };

      delete allAnnotations[id];
      for (const key of Object.keys(pageMap)) {
        pageMap[key] = (pageMap[key] || []).filter((x) => x !== id);
        if (pageMap[key].length === 0) delete pageMap[key];
      }
      // Remove links pointing to deleted id
      for (const ann of Object.values(allAnnotations)) {
        if (!Array.isArray(ann.linkedIds)) continue;
        ann.linkedIds = ann.linkedIds.filter((x) => x !== id);
      }

      await chrome.storage.local.set({ [KEYS.allAnnotations]: allAnnotations, [KEYS.pageMap]: pageMap });
      return { success: true };
    }
    case 'stickey_setLink': {
      const idA = String(msg.idA || '');
      const idB = String(msg.idB || '');
      const linked = Boolean(msg.linked);
      if (!idA || !idB || idA === idB) return { success: false, error: 'Invalid ids' };

      const { [KEYS.allAnnotations]: allAnnotations = {} } = await chrome.storage.local.get(KEYS.allAnnotations);
      const a = allAnnotations[idA];
      const b = allAnnotations[idB];
      if (!a || !b) return { success: false, error: 'Missing annotation' };

      a.linkedIds = Array.isArray(a.linkedIds) ? a.linkedIds : [];
      b.linkedIds = Array.isArray(b.linkedIds) ? b.linkedIds : [];

      if (linked) {
        if (!a.linkedIds.includes(idB)) a.linkedIds.push(idB);
        if (!b.linkedIds.includes(idA)) b.linkedIds.push(idA);
      } else {
        a.linkedIds = a.linkedIds.filter((x) => x !== idB);
        b.linkedIds = b.linkedIds.filter((x) => x !== idA);
      }

      a.updatedAt = utils.nowIso();
      b.updatedAt = utils.nowIso();
      allAnnotations[idA] = a;
      allAnnotations[idB] = b;
      await chrome.storage.local.set({ [KEYS.allAnnotations]: allAnnotations });
      return { success: true };
    }
    case 'stickey_search': {
      const query = String(msg.query || '').trim().toLowerCase();
      const filterType = msg.filterType === 'note' || msg.filterType === 'highlight' ? msg.filterType : 'all';
      const tag = String(msg.tag || '').trim().toLowerCase();

      const { [KEYS.allAnnotations]: allAnnotations = {} } = await chrome.storage.local.get(KEYS.allAnnotations);
      const results = [];
      for (const ann of Object.values(allAnnotations)) {
        if (filterType !== 'all' && ann.type !== filterType) continue;
        if (tag && !(ann.tags || []).includes(tag)) continue;

        const haystack = annotationSearchText(ann);
        if (!query || haystack.includes(query)) {
          results.push({
            id: ann.id,
            type: ann.type,
            pageUrl: ann.pageUrl,
            pageTitle: ann.pageTitle,
            updatedAt: ann.updatedAt,
            snippet: makeSnippet(ann, query)
          });
        }
      }

      results.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
      return { success: true, results: results.slice(0, 200) };
    }
    case 'stickey_openGraph': {
      await openGraphView();
      return { success: true };
    }
    case 'stickey_navigateTo': {
      const id = String(msg.id || '');
      const { [KEYS.allAnnotations]: allAnnotations = {} } = await chrome.storage.local.get(KEYS.allAnnotations);
      const ann = allAnnotations[id];
      if (!ann?.pageUrl) return { success: false, error: 'Missing pageUrl' };

      const tabs = await chrome.tabs.query({ url: ann.pageUrl + '*' });
      if (tabs.length > 0) {
        await chrome.tabs.update(tabs[0].id, { active: true });
        chrome.tabs.sendMessage(tabs[0].id, { action: 'stickey_focusAnnotation', id }).catch(() => {});
      } else {
        const tab = await chrome.tabs.create({ url: ann.pageUrl });
        const tabId = tab?.id;
        if (tabId) {
          // Best-effort: focus after page loads
          const listener = (updatedTabId, info) => {
            if (updatedTabId !== tabId) return;
            if (info.status !== 'complete') return;
            chrome.tabs.sendMessage(tabId, { action: 'stickey_focusAnnotation', id }).catch(() => {});
            chrome.tabs.onUpdated.removeListener(listener);
          };
          chrome.tabs.onUpdated.addListener(listener);
        }
      }
      return { success: true };
    }
    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
}

function annotationSearchText(ann) {
  const pieces = [];
  pieces.push(ann.type || '');
  pieces.push(ann.pageTitle || '');
  pieces.push(ann.pageUrl || '');
  pieces.push((ann.tags || []).map((t) => `#${t}`).join(' '));
  if (ann.type === 'note') {
    pieces.push(ann.note?.title || '');
    pieces.push(ann.note?.content || '');
  } else if (ann.type === 'highlight') {
    pieces.push(ann.highlight?.exactText || '');
    pieces.push(ann.highlight?.comment || '');
  }
  return pieces.join(' ').toLowerCase();
}

function makeSnippet(ann, query) {
  const raw =
    ann.type === 'note'
      ? `${ann.note?.title || ''} ${ann.note?.content || ''}`.trim()
      : `${ann.highlight?.exactText || ''} ${ann.highlight?.comment || ''}`.trim();
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!query) return text.slice(0, 120);
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return text.slice(0, 120);
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + query.length + 60);
  return text.slice(start, end);
}

function sanitizeColor(color, fallback) {
  const c = String(color || '').toLowerCase();
  const allowed = ['yellow', 'pink', 'blue', 'green', 'orange', 'purple'];
  return allowed.includes(c) ? c : fallback;
}

function sanitizeAnnotation(annotation, sender) {
  if (!annotation || typeof annotation !== 'object') return null;
  if (!annotation.id || typeof annotation.id !== 'string') return null;
  if (annotation.type !== 'note' && annotation.type !== 'highlight') return null;

  const pageUrl = String(annotation.pageUrl || sender?.tab?.url || '');
  const pageTitle = String(annotation.pageTitle || sender?.tab?.title || '');
  const base = {
    id: annotation.id,
    type: annotation.type,
    pageUrl,
    pageTitle,
    createdAt: annotation.createdAt || utils.nowIso(),
    updatedAt: utils.nowIso(),
    tags: Array.isArray(annotation.tags) ? annotation.tags.slice(0, 30) : [],
    linkedIds: Array.isArray(annotation.linkedIds) ? annotation.linkedIds.slice(0, 100) : []
  };

  if (annotation.type === 'note') {
    const note = annotation.note || {};
    return {
      ...base,
      note: {
        title: String(note.title || '').slice(0, 120),
        content: String(note.content || '').slice(0, 10000),
        position: {
          x: utils.clampNumber(note.position?.x ?? 120, 0, 1000000),
          y: utils.clampNumber(note.position?.y ?? 120, 0, 1000000)
        },
        size: {
          w: utils.clampNumber(note.size?.w ?? 320, 200, 900),
          h: utils.clampNumber(note.size?.h ?? 220, 140, 900)
        },
        minimized: Boolean(note.minimized),
        anchorId: note.anchorId ? String(note.anchorId) : null,
        color: sanitizeColor(note.color, 'yellow'),
        pinned: Boolean(note.pinned),
        z: utils.clampNumber(note.z ?? 0, 0, 60000)
      }
    };
  }

  const highlight = annotation.highlight || {};
  const selectors = highlight.selectors || {};
  return {
    ...base,
    highlight: {
      color: sanitizeColor(highlight.color, 'yellow'),
      exactText: String(highlight.exactText || '').slice(0, 4000),
      comment: String(highlight.comment || '').slice(0, 2000),
      selectors: {
        startXPath: selectors.startXPath ? String(selectors.startXPath) : null,
        startOffset: utils.clampNumber(selectors.startOffset ?? 0, 0, 1000000),
        endXPath: selectors.endXPath ? String(selectors.endXPath) : null,
        endOffset: utils.clampNumber(selectors.endOffset ?? 0, 0, 1000000)
      }
    }
  };
}
