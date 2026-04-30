/* global Stickey */

document.addEventListener('DOMContentLoaded', () => {
  const utils = Stickey.utils;

  const totalCount = document.getElementById('totalCount');
  const pageCount = document.getElementById('pageCount');
  const linkCount = document.getElementById('linkCount');
  const newNoteBtn = document.getElementById('newNoteBtn');
  const togglePanelBtn = document.getElementById('togglePanelBtn');
  const openGraphBtn = document.getElementById('openGraphBtn');
  const queryInput = document.getElementById('queryInput');
  const clearQueryBtn = document.getElementById('clearQueryBtn');
  const bannerEl = document.getElementById('banner');
  const resultsEl = document.getElementById('results');
  const chips = Array.from(document.querySelectorAll('.chip'));

  let currentTab = null;
  let filterType = 'all';

  function showBanner(text, tone = 'error') {
    if (!bannerEl) return;
    bannerEl.hidden = false;
    bannerEl.dataset.tone = tone;
    bannerEl.textContent = text;
  }

  function hideBanner() {
    if (!bannerEl) return;
    bannerEl.hidden = true;
    bannerEl.textContent = '';
    bannerEl.dataset.tone = '';
  }

  async function safeRuntimeMessage(payload) {
    if (!chrome?.runtime?.id) return null;
    try {
      return await chrome.runtime.sendMessage(payload);
    } catch {
      return null;
    }
  }

  async function ensureContentScript(tabId) {
    if (!chrome?.scripting) return false;
    try {
      await chrome.scripting.insertCSS({ target: { tabId }, files: ['content/content.css'] });
    } catch {
      // ignore (might already be inserted)
    }
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['shared/shared.js', 'utils/domHelpers.js', 'content/content.js']
      });
      return true;
    } catch {
      return false;
    }
  }

  async function sendToTabWithInject(tabId, message) {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (err) {
      const msg = String(err?.message || err || '');
      const canRetry =
        msg.includes('Receiving end does not exist') ||
        msg.includes('Could not establish connection') ||
        msg.includes('The message port closed');
      if (!canRetry) throw err;

      const injected = await ensureContentScript(tabId);
      if (!injected) throw err;

      return await chrome.tabs.sendMessage(tabId, message);
    }
  }

  function setFilter(next) {
    filterType = next;
    chips.forEach((c) => {
      const active = c.dataset.type === next;
      c.dataset.active = active ? 'true' : 'false';
      c.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    runSearch();
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => setFilter(chip.dataset.type));
  });

  function syncClear() {
    const has = Boolean(String(queryInput.value || '').trim());
    if (clearQueryBtn) clearQueryBtn.hidden = !has;
    if (!has) hideBanner();
  }

  queryInput.addEventListener('input', () => {
    syncClear();
    runSearch();
  });
  queryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      queryInput.value = '';
      syncClear();
      runSearch();
      e.preventDefault();
    }
  });
  clearQueryBtn?.addEventListener('click', () => {
    queryInput.value = '';
    syncClear();
    runSearch();
    queryInput.focus();
  });

  newNoteBtn.addEventListener('click', async () => {
    const tabId = currentTab?.id;
    if (!tabId) return;
    hideBanner();
    try {
      await sendToTabWithInject(tabId, { action: 'stickey_createNote' });
      window.close();
    } catch {
      showBanner('Can’t add a note on this page. Open any normal website tab (http/https) and try again.');
    }
  });

  togglePanelBtn.addEventListener('click', async () => {
    const tabId = currentTab?.id;
    if (!tabId) return;
    hideBanner();
    try {
      await sendToTabWithInject(tabId, { action: 'stickey_togglePanel' });
      window.close();
    } catch {
      showBanner('Can’t open the panel on this page. Open any normal website tab (http/https) and try again.');
    }
  });

  openGraphBtn.addEventListener('click', async () => {
    await safeRuntimeMessage({ action: 'stickey_openGraph' });
    window.close();
  });

  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    currentTab = tabs?.[0] || null;
    await refreshStats();
    syncClear();
    await runSearch();
  });

  async function refreshStats() {
    const resp = await safeRuntimeMessage({ action: 'stickey_getAllAnnotations' });
    const all = resp?.allAnnotations || {};
    const pageMap = resp?.pageMap || {};
    const total = Object.keys(all).length;
    totalCount.textContent = String(total);

    let links = 0;
    const seen = new Set();
    Object.entries(all).forEach(([id, ann]) => {
      (ann.linkedIds || []).forEach((other) => {
        const key = [id, other].sort().join('::');
        if (seen.has(key)) return;
        seen.add(key);
        links += 1;
      });
    });
    linkCount.textContent = String(links);

    const url = currentTab?.url || '';
    const pageKey = utils.getPageKeyFromUrl(url);
    pageCount.textContent = String((pageMap[pageKey] || []).length);
  }

  async function runSearch() {
    const query = String(queryInput.value || '');
    const resp = await safeRuntimeMessage({
      action: 'stickey_search',
      query,
      filterType
    });

    const results = resp?.results || [];
    resultsEl.textContent = '';

    if (!results.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = query.trim() ? 'No results.' : 'Search notes and highlights across all pages.';
      resultsEl.appendChild(empty);
      return;
    }

    results.forEach((r) => resultsEl.appendChild(buildResult(r)));
  }

  function formatWhen(iso) {
    const ts = Date.parse(iso || '');
    if (!Number.isFinite(ts)) return '';
    const delta = Date.now() - ts;
    const sec = Math.round(delta / 1000);
    if (sec < 60) return 'now';
    const min = Math.round(sec / 60);
    if (min < 60) return `${min}m`;
    const hr = Math.round(min / 60);
    if (hr < 48) return `${hr}h`;
    const day = Math.round(hr / 24);
    if (day < 10) return `${day}d`;
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function buildResult(r) {
    const row = document.createElement('div');
    row.className = 'result';

    const top = document.createElement('div');
    top.className = 'result-top';

    const type = document.createElement('span');
    type.className = 'result-type';
    type.textContent = r.type === 'note' ? 'Note' : 'Highlight';

    const host = document.createElement('span');
    host.className = 'result-host';
    try {
      host.textContent = new URL(r.pageUrl).hostname;
    } catch {
      host.textContent = String(r.pageUrl || '').slice(0, 40);
    }

    top.appendChild(type);
    top.appendChild(host);

    const meta = document.createElement('span');
    meta.className = 'result-meta';
    meta.textContent = formatWhen(r.updatedAt);
    top.appendChild(meta);

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'result-del';
    del.textContent = 'Delete';
    del.title = 'Delete annotation';
    del.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await safeRuntimeMessage({ action: 'stickey_deleteAnnotation', id: r.id });
      const tabUrl = currentTab?.url || '';
      if (utils.getPageKeyFromUrl(tabUrl) && utils.getPageKeyFromUrl(tabUrl) === utils.getPageKeyFromUrl(r.pageUrl || '')) {
        await chrome.tabs.sendMessage(currentTab.id, { action: 'stickey_removeAnnotationLocal', id: r.id }).catch(() => {});
      }
      await refreshStats();
      await runSearch();
    });
    top.appendChild(del);

    const page = document.createElement('div');
    page.className = 'result-page';
    page.textContent = String(r.pageTitle || r.pageUrl || '').trim() || 'Untitled page';

    const snippet = document.createElement('div');
    snippet.className = 'result-snippet';
    snippet.textContent = r.snippet || '';

    row.appendChild(top);
    row.appendChild(page);
    row.appendChild(snippet);

    row.addEventListener('click', async () => {
      await safeRuntimeMessage({ action: 'stickey_navigateTo', id: r.id });
      window.close();
    });

    return row;
  }
});
