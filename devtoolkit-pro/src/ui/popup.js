// popup.js — Main popup controller (ES Module, Manifest V3 compatible)
// No eval(), no innerHTML, no inline event handlers, no CDN dependencies.

import { TOOL_GROUPS, getAllTools, findTools } from '../services/toolRegistry.js';
import { storageService } from '../services/storageService.js';
import { toolService } from '../services/toolService.js';

// ── DOM helpers (CSP-safe) ────────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function el(tag, classes = [], attrs = {}) {
  const e = document.createElement(tag);
  if (classes.length) e.classList.add(...classes);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

function txt(str) { return document.createTextNode(str); }

function debounce(fn, wait = 120) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// SVG helper (avoids innerHTML)
function svgEl(tag, attrs = {}, children = []) {
  const ns = 'http://www.w3.org/2000/svg';
  const node = document.createElementNS(ns, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  for (const c of children) node.appendChild(c);
  return node;
}

function buildIcon(def, size = 14) {
  const svg = svgEl('svg', {
    width: String(size),
    height: String(size),
    viewBox: def.viewBox || '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': def.strokeWidth || '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  });
  for (const child of def.children || []) {
    svg.appendChild(svgEl(child.tag, child.attrs || {}));
  }
  return svg;
}

function buildPinIcon(filled) {
  const svg = svgEl('svg', { width: '11', height: '11', viewBox: '0 0 24 24', fill: filled ? 'currentColor' : 'none', stroke: 'currentColor', 'stroke-width': '2' });
  svg.appendChild(svgEl('path', { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' }));
  return svg;
}

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  activeGroup: TOOL_GROUPS[0].id,
  activeTools: {},
  pinnedTools: [],
  darkMode: false,
  searchQuery: '',
  resultPanelData: null,
  resultPanelTool: null
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const container = $('#toast-container');
  const toast = el('div', ['toast', `toast-${type}`]);
  toast.appendChild(txt(msg));
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ── Page info bar ─────────────────────────────────────────────────────────────
async function updatePageInfo() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab) return resolve();
      const urlEl = $('#page-url');
      const statusEl = $('#page-status');
      while (urlEl.firstChild) urlEl.removeChild(urlEl.firstChild);
      while (statusEl.firstChild) statusEl.removeChild(statusEl.firstChild);
      try {
        const u = new URL(tab.url);
        urlEl.appendChild(txt(u.hostname + u.pathname.substring(0, 20)));
      } catch {
        urlEl.appendChild(txt(tab.url.substring(0, 40)));
      }
      statusEl.appendChild(txt('● Connected'));
      resolve();
    });
  });
}

// ── Dark mode ─────────────────────────────────────────────────────────────────
async function initDarkMode() {
  state.darkMode = await storageService.getDarkMode();
  applyDarkMode();
  $('#btn-dark-mode').addEventListener('click', toggleDarkMode);
}

function applyDarkMode() {
  document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
}

async function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  await storageService.setDarkMode(state.darkMode);
  applyDarkMode();
}

// ── Pinned Tools ──────────────────────────────────────────────────────────────
async function loadPinnedTools() {
  state.pinnedTools = await storageService.getPinnedTools();
  renderPinnedTools();
}

function renderPinnedTools() {
  const section = $('#pinned-section');
  const grid = $('#pinned-tools');
  while (grid.firstChild) grid.removeChild(grid.firstChild);

  if (state.pinnedTools.length === 0) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  const allTools = getAllTools();
  for (const toolId of state.pinnedTools) {
    const tool = allTools.find(t => t.id === toolId);
    if (!tool) continue;
    const item = el('div', ['tool-grid-item']);
    if (state.activeTools[toolId]) item.classList.add('active-tool');
    const label = el('span', ['tool-grid-label']);
    label.appendChild(txt(tool.label));
    item.appendChild(label);
    item.addEventListener('click', () => handleToolAction(tool));
    grid.appendChild(item);
  }
}

// ── Group Tabs ────────────────────────────────────────────────────────────────
function renderGroupTabs() {
  const tabsEl = $('#group-tabs');
  const panelsEl = $('#group-panels');

  for (const group of TOOL_GROUPS) {
    // Tab
    const tab = el('button', ['group-tab']);
    tab.setAttribute('data-group', group.id);
    if (group.id === state.activeGroup) tab.classList.add('active');

    const iconWrapper = el('span');
    iconWrapper.appendChild(buildIcon(group.icon));
    tab.appendChild(iconWrapper);
    tab.appendChild(txt(group.label));
    tab.addEventListener('click', () => setActiveGroup(group.id));
    tabsEl.appendChild(tab);

    // Panel
    const panel = el('div', ['group-panel']);
    panel.setAttribute('data-panel', group.id);
    if (group.id === state.activeGroup) panel.classList.add('active');

    // Special rendering for some groups
    if (group.id === 'responsive') {
      panel.appendChild(buildViewportPanel(group));
    } else {
      const list = el('div', ['tool-list']);
      for (const tool of group.tools) {
        list.appendChild(buildToolItem(tool));
      }
      panel.appendChild(list);
    }

    panelsEl.appendChild(panel);
  }
}

function setActiveGroup(groupId) {
  state.activeGroup = groupId;
  $$('.group-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-group') === groupId);
  });
  $$('.group-panel').forEach(p => {
    p.classList.toggle('active', p.getAttribute('data-panel') === groupId);
  });
}

// ── Tool Item ─────────────────────────────────────────────────────────────────
function buildToolItem(tool) {
  const isActive = !!state.activeTools[tool.id];
  const isPinned = state.pinnedTools.includes(tool.id);

  const item = el('div', ['tool-item']);
  if (isActive) item.classList.add('active-tool');

  const info = el('div', ['tool-item-info']);
  const label = el('span', ['tool-item-label']);
  label.appendChild(txt(tool.label));
  const desc = el('span', ['tool-item-desc']);
  desc.appendChild(txt(tool.description));
  info.appendChild(label);
  info.appendChild(desc);
  item.appendChild(info);

  const actions = el('div', ['tool-item-actions']);

  // Pin button
  const pinBtn = el('button', ['pin-btn']);
  if (isPinned) pinBtn.classList.add('pinned');
  pinBtn.setAttribute('title', isPinned ? 'Unpin tool' : 'Pin tool');
  pinBtn.appendChild(buildPinIcon(isPinned));
  pinBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePin(tool.id, pinBtn);
  });
  actions.appendChild(pinBtn);

  if (tool.toggle) {
    // Toggle switch
    const wrapper = el('label', ['toggle-switch']);
    const input = el('input', [], { type: 'checkbox' });
    if (isActive) input.setAttribute('checked', '');
    const track = el('span', ['toggle-track']);
    wrapper.appendChild(input);
    wrapper.appendChild(track);
    input.addEventListener('change', () => handleToolToggle(tool, input.checked, item));
    actions.appendChild(wrapper);
  } else {
    // Run button
    const runBtn = el('button', ['run-btn']);
    runBtn.appendChild(txt('Run'));
    runBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleToolAction(tool);
    });
    actions.appendChild(runBtn);
    item.addEventListener('click', () => handleToolAction(tool));
  }

  item.appendChild(actions);
  return item;
}

async function togglePin(toolId, btn) {
  if (state.pinnedTools.includes(toolId)) {
    await storageService.unpinTool(toolId);
    state.pinnedTools = state.pinnedTools.filter(id => id !== toolId);
    btn.classList.remove('pinned');
  } else {
    await storageService.pinTool(toolId);
    state.pinnedTools.push(toolId);
    btn.classList.add('pinned');
  }
  while (btn.firstChild) btn.removeChild(btn.firstChild);
  btn.appendChild(buildPinIcon(btn.classList.contains('pinned')));
  renderPinnedTools();
}

// ── Tool Execution ────────────────────────────────────────────────────────────
async function handleToolToggle(tool, active, itemEl) {
  try {
    state.activeTools[tool.id] = active;
    itemEl.classList.toggle('active-tool', active);
    await storageService.setToolActive(tool.id, active);
    await executeTool(tool, active);
    showToast(`${tool.label} ${active ? 'enabled' : 'disabled'}`);
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
    // Revert toggle
    state.activeTools[tool.id] = !active;
    itemEl.classList.toggle('active-tool', !active);
  }
}

async function handleToolAction(tool) {
  try {
    const result = await executeTool(tool, true);
    if (result !== undefined && result !== null && typeof result === 'object') {
      showResultPanel(tool.label, tool.id, result);
    } else if (typeof result === 'number') {
      showToast(`${tool.label}: ${result} found`);
    } else {
      showToast(`${tool.label} executed`);
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

async function executeTool(tool, active) {
  switch (tool.id) {
    case 'disableCSS':         return toolService.disableCSS(active);
    case 'disableJS':          return toolService.disableJS(active);
    case 'disableImages':      return toolService.disableImages(active);
    case 'editPageMode':       return toolService.editPageMode(active);
    case 'outlineElements':    return toolService.outlineElements(active);
    case 'showBlockElements':  return toolService.showBlockElements(active);
    case 'showElementInfo':    return toolService.showElementInfo(active);
    case 'viewSource':         return toolService.viewSource();
    case 'clearCacheAndCookies': return toolService.clearCacheAndCookies().then(() => showToast('Cache & cookies cleared'));

    case 'showFormDetails':    return toolService.showFormDetails(active);
    case 'showHiddenFields':   return toolService.showHiddenFields(active);
    case 'autoFillForms':      return toolService.autoFillForms();
    case 'enableDisabledFields': return toolService.enableDisabledFields(active);
    case 'removeMaxlength':    return toolService.removeMaxlength(active);

    case 'showAltAttributes':  return toolService.showAltAttributes(active);
    case 'highlightHeadings':  return toolService.highlightHeadings(active);
    case 'showLinkDetails':    return toolService.showLinkDetails(active);
    case 'highlightBrokenImages': {
      const count = await toolService.highlightBrokenImages();
      showToast(`${count} broken image(s) highlighted`);
      return;
    }
    case 'inspectMetadata':    return toolService.inspectMetadata();

    case 'metaTagChecker':     return toolService.metaTagChecker();
    case 'headingStructure':   return toolService.headingStructure();
    case 'imageAltAudit':      return toolService.imageAltAudit();

    case 'contrastChecker':    return toolService.contrastChecker?.(active);
    case 'missingAriaLabels':  return toolService.missingAriaLabels();
    case 'focusOrderVisualize': return toolService.focusOrderVisualize(active);

    case 'viewCookies':        return toolService.getCookies();
    case 'deleteCookies':      return handleDeleteAllCookies();
    case 'viewLocalStorage':   return toolService.getLocalStorage();
    case 'viewSessionStorage': return toolService.getSessionStorage();
    case 'clearSiteStorage':   return toolService.clearSiteStorage().then(() => showToast('Site storage cleared'));

    case 'resourceCount':      return toolService.getResourceCount();
    case 'scriptList':         return toolService.getScriptList();
    case 'stylesheetList':     return toolService.getStylesheetList();
    case 'pageSnapshot':       return toolService.pageSnapshot();

    case 'viewport375':        return toolService.resizeViewport(375, 812);
    case 'viewport768':        return toolService.resizeViewport(768, 1024);
    case 'viewport1024':       return toolService.resizeViewport(1024, 768);
    case 'viewport1440':       return toolService.resizeViewport(1440, 900);
    case 'viewportCustom': {
      showToast('Use Responsive tab for custom size', 'info');
      return;
    }

    default:
      showToast(`Tool not yet implemented: ${tool.id}`, 'info');
  }
}

async function handleDeleteAllCookies() {
  const cookies = await toolService.getCookies();
  const tab = await toolService.getActiveTab();
  if (!tab) return;
  const url = tab.url;
  await Promise.all(cookies.map(c => toolService.deleteCookie(url, c.name)));
  showToast(`${cookies.length} cookie(s) deleted`);
}

// ── Result Panel ──────────────────────────────────────────────────────────────
function showResultPanel(title, toolId, data) {
  state.resultPanelData = data;
  state.resultPanelTool = toolId;

  const panel = $('#result-panel');
  const titleEl = $('#result-panel-title');
  while (titleEl.firstChild) titleEl.removeChild(titleEl.firstChild);
  titleEl.appendChild(txt(title));

  const body = $('#result-panel-body');
  while (body.firstChild) body.removeChild(body.firstChild);
  body.appendChild(buildResultContent(toolId, data));

  panel.hidden = false;
}

function buildResultContent(toolId, data) {
  const container = el('div');

  if (toolId === 'metaTagChecker') {
    const table = el('table', ['result-table']);
    const thead = el('thead');
    const headerRow = el('tr');
    ['Tag', 'Value', 'Status'].forEach(h => {
      const th = el('th'); th.appendChild(txt(h)); headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = el('tbody');
    for (const [key, info] of Object.entries(data)) {
      const row = el('tr');
      const keyTd = el('td'); keyTd.appendChild(txt(key));
      const valTd = el('td'); valTd.appendChild(txt(info.value?.substring(0, 60) || '—'));
      const statusTd = el('td');
      const statusSpan = el('span', [info.ok ? 'status-ok' : 'status-err']);
      statusSpan.appendChild(txt(info.ok ? 'OK' : 'Missing'));
      statusTd.appendChild(statusSpan);
      row.appendChild(keyTd); row.appendChild(valTd); row.appendChild(statusTd);
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    container.appendChild(table);
    return container;
  }

  if (toolId === 'headingStructure') {
    if (!data.length) { container.appendChild(txt('No headings found.')); return container; }
    for (const h of data) {
      const item = el('div', ['heading-tree-item']);
      const indent = parseInt(h.tag[1]) - 1;
      item.style.paddingLeft = (indent * 12) + 'px';
      const tag = el('span', ['heading-tag', `h${h.tag[1]}-tag`]);
      tag.appendChild(txt(h.tag));
      const text = el('span', ['heading-text']);
      text.appendChild(txt(h.text || '(empty)'));
      item.appendChild(tag);
      item.appendChild(text);
      container.appendChild(item);
    }
    return container;
  }

  if (toolId === 'imageAltAudit') {
    const grid = el('div', ['stat-grid']);
    const stats = [
      { label: 'Total Images', value: data.total },
      { label: 'Has Alt Text', value: data.ok },
      { label: 'Missing Alt', value: data.missing.length },
      { label: 'Empty Alt', value: data.empty.length }
    ];
    for (const s of stats) {
      const card = el('div', ['stat-card']);
      const val = el('div', ['stat-value']); val.appendChild(txt(String(s.value)));
      const lbl = el('div', ['stat-label']); lbl.appendChild(txt(s.label));
      card.appendChild(val); card.appendChild(lbl);
      grid.appendChild(card);
    }
    container.appendChild(grid);
    if (data.missing.length) {
      const sec = el('div', ['result-section', 'result-section-spaced']);
      const title = el('div', ['result-section-title']); title.appendChild(txt('Missing Alt'));
      sec.appendChild(title);
      for (const src of data.missing) {
        const item = el('span', ['url-item']); item.appendChild(txt(src));
        sec.appendChild(item);
      }
      container.appendChild(sec);
    }
    return container;
  }

  if (toolId === 'resourceCount') {
    const grid = el('div', ['stat-grid']);
    for (const [key, val] of Object.entries(data)) {
      const card = el('div', ['stat-card']);
      const v = el('div', ['stat-value']); v.appendChild(txt(String(val)));
      const l = el('div', ['stat-label']); l.appendChild(txt(key));
      card.appendChild(v); card.appendChild(l);
      grid.appendChild(card);
    }
    container.appendChild(grid);
    return container;
  }

  if (toolId === 'scriptList' || toolId === 'stylesheetList') {
    if (!data.length) { container.appendChild(txt('None found.')); return container; }
    for (const url of data) {
      const item = el('span', ['url-item']); item.appendChild(txt(url));
      container.appendChild(item);
    }
    return container;
  }

  if (toolId === 'viewCookies') {
    if (!data.length) { container.appendChild(txt('No cookies found.')); return container; }
    const table = el('table', ['result-table']);
    const thead = el('thead');
    const hr = el('tr');
    ['Name', 'Value', 'Action'].forEach(h => {
      const th = el('th'); th.appendChild(txt(h)); hr.appendChild(th);
    });
    thead.appendChild(hr); table.appendChild(thead);
    const tbody = el('tbody');
    for (const cookie of data) {
      const row = el('tr');
      const nameTd = el('td'); nameTd.appendChild(txt(cookie.name));
      const valTd = el('td'); valTd.appendChild(txt((cookie.value || '').substring(0, 30)));
      const actTd = el('td');
      const delBtn = el('button', ['delete-cookie-btn']);
      delBtn.appendChild(txt('Delete'));
      delBtn.addEventListener('click', async () => {
        const tab = await toolService.getActiveTab();
        if (tab) {
          await toolService.deleteCookie(tab.url, cookie.name);
          row.remove();
          showToast(`Cookie "${cookie.name}" deleted`);
        }
      });
      actTd.appendChild(delBtn);
      row.appendChild(nameTd); row.appendChild(valTd); row.appendChild(actTd);
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    container.appendChild(table);
    return container;
  }

  if (toolId === 'viewLocalStorage' || toolId === 'viewSessionStorage') {
    const entries = Object.entries(data);
    if (!entries.length) { container.appendChild(txt('Storage is empty.')); return container; }
    for (const [key, val] of entries) {
      const pair = el('div', ['result-kv-pair']);
      const k = el('div', ['result-kv-key']); k.appendChild(txt(key));
      const v = el('div', ['result-kv-val']); v.appendChild(txt((val || '').substring(0, 80)));
      pair.appendChild(k); pair.appendChild(v);
      container.appendChild(pair);
    }
    return container;
  }

  if (toolId === 'inspectMetadata') {
    const kvPair = (k, v) => {
      const pair = el('div', ['result-kv-pair']);
      const key = el('div', ['result-kv-key']); key.appendChild(txt(k));
      const val = el('div', ['result-kv-val']); val.appendChild(txt(v || '—'));
      pair.appendChild(key); pair.appendChild(val);
      return pair;
    };
    container.appendChild(kvPair('Title', data.title));
    container.appendChild(kvPair('Canonical', data.canonical));
    for (const [k, v] of Object.entries(data.metas)) {
      container.appendChild(kvPair(k, v));
    }
    return container;
  }

  if (toolId === 'missingAriaLabels') {
    if (!data.length) { container.appendChild(txt('No issues found.')); return container; }
    const table = el('table', ['result-table']);
    const thead = el('thead');
    const hr = el('tr');
    ['Tag', 'ID', 'Type'].forEach(h => {
      const th = el('th'); th.appendChild(txt(h)); hr.appendChild(th);
    });
    thead.appendChild(hr); table.appendChild(thead);
    const tbody = el('tbody');
    for (const issue of data) {
      const row = el('tr');
      [issue.tag, issue.id || '—', issue.type || '—'].forEach(v => {
        const td = el('td'); td.appendChild(txt(v)); row.appendChild(td);
      });
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    container.appendChild(table);
    return container;
  }

  if (toolId === 'pageSnapshot') {
    const pre = el('pre', ['result-pre']);
    pre.appendChild(txt(JSON.stringify(data, null, 2).substring(0, 2000)));
    container.appendChild(pre);
    return container;
  }

  // Generic key-value fallback
  if (typeof data === 'object') {
    for (const [key, val] of Object.entries(data)) {
      const pair = el('div', ['result-kv-pair']);
      const k = el('div', ['result-kv-key']); k.appendChild(txt(key));
      const v = el('div', ['result-kv-val']); v.appendChild(txt(String(val ?? '—').substring(0, 80)));
      pair.appendChild(k); pair.appendChild(v);
      container.appendChild(pair);
    }
    return container;
  }

  container.appendChild(txt(String(data)));
  return container;
}

// ── Viewport Panel ────────────────────────────────────────────────────────────
function buildViewportPanel(group) {
  const container = el('div');

  const presets = [
    { label: 'Mobile', size: '375', w: 375, h: 812 },
    { label: 'Tablet', size: '768', w: 768, h: 1024 },
    { label: 'Laptop', size: '1024', w: 1024, h: 768 },
    { label: 'Desktop', size: '1440', w: 1440, h: 900 }
  ];

  const grid = el('div', ['viewport-presets']);
  for (const preset of presets) {
    const btn = el('button', ['viewport-btn']);
    const size = el('div', ['viewport-size']); size.appendChild(txt(preset.size));
    const name = el('div', ['viewport-name']); name.appendChild(txt(preset.label));
    btn.appendChild(size); btn.appendChild(name);
    btn.addEventListener('click', () => {
      toolService.resizeViewport(preset.w, preset.h);
      showToast(`Resized to ${preset.size}px`);
    });
    grid.appendChild(btn);
  }
  container.appendChild(grid);

  const customRow = el('div', ['custom-viewport-row']);
  const wInput = el('input', ['viewport-input'], { type: 'number', placeholder: 'Width' });
  const hInput = el('input', ['viewport-input'], { type: 'number', placeholder: 'Height' });
  const applyBtn = el('button', ['viewport-apply-btn']);
  applyBtn.appendChild(txt('Apply'));
  applyBtn.addEventListener('click', () => {
    const w = parseInt(wInput.value);
    const h = parseInt(hInput.value);
    if (w > 0) {
      toolService.resizeViewport(w, h || 900);
      showToast(`Resized to ${w}×${h || 900}px`);
    }
  });
  customRow.appendChild(wInput);
  customRow.appendChild(txt('×'));
  customRow.appendChild(hInput);
  customRow.appendChild(applyBtn);
  container.appendChild(customRow);

  return container;
}

// ── Search ────────────────────────────────────────────────────────────────────
function initSearch() {
  const input = $('#search-input');
  input.addEventListener('input', debounce(() => {
    state.searchQuery = input.value.trim();
    renderSearchResults();
  }, 80));
}

function renderSearchResults() {
  const resultsEl = $('#search-results');
  const groupsEl = $('#groups-container');
  const listEl = $('#search-results-list');
  while (listEl.firstChild) listEl.removeChild(listEl.firstChild);

  if (!state.searchQuery) {
    resultsEl.hidden = true;
    groupsEl.hidden = false;
    return;
  }

  resultsEl.hidden = false;
  groupsEl.hidden = true;

  const results = findTools(state.searchQuery);
  if (!results.length) {
    const empty = el('div', ['search-empty']);
    empty.appendChild(txt('No tools match your search.'));
    listEl.appendChild(empty);
    return;
  }

  for (const tool of results) {
    const item = buildToolItem(tool);
    // Add group badge
    const badge = el('span', ['command-item-group']);
    badge.classList.add('search-group-badge');
    badge.appendChild(txt(tool.groupLabel));
    item.insertBefore(badge, item.firstChild);
    listEl.appendChild(item);
  }
}

// ── Command Palette ───────────────────────────────────────────────────────────
let commandHighlightIndex = -1;

function initCommandPalette() {
  $('#btn-command').addEventListener('click', openCommandPalette);
  $('#command-backdrop').addEventListener('click', closeCommandPalette);

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openCommandPalette();
    }
    if (e.key === 'Escape') closeCommandPalette();
  });

  $('#command-input').addEventListener('input', debounce(renderCommandList, 80));
  $('#command-input').addEventListener('keydown', handleCommandKeyNav);
}

function openCommandPalette() {
  $('#command-palette').hidden = false;
  $('#command-input').focus();
  renderCommandList();
}

function closeCommandPalette() {
  $('#command-palette').hidden = true;
  $('#command-input').value = '';
  commandHighlightIndex = -1;
}

function renderCommandList() {
  const query = $('#command-input').value.trim();
  const list = $('#command-list');
  while (list.firstChild) list.removeChild(list.firstChild);
  commandHighlightIndex = -1;

  const tools = query ? findTools(query) : getAllTools();
  if (!tools.length) {
    const empty = el('div', ['command-empty']);
    empty.appendChild(txt('No results found.'));
    list.appendChild(empty);
    return;
  }

  for (const tool of tools) {
    const item = el('div', ['command-item']);
    item.setAttribute('data-tool-id', tool.id);

    const badge = el('span', ['command-item-group']);
    badge.appendChild(txt(tool.groupLabel));

    const label = el('div', ['command-item-label']);
    label.appendChild(txt(tool.label));

    const desc = el('div', ['command-item-desc']);
    desc.appendChild(txt(tool.description));

    item.appendChild(badge);
    const textWrap = el('div');
    textWrap.classList.add('command-text-wrap');
    textWrap.appendChild(label);
    textWrap.appendChild(desc);
    item.appendChild(textWrap);

    item.addEventListener('click', () => {
      closeCommandPalette();
      handleToolAction(tool);
    });

    list.appendChild(item);
  }
}

function handleCommandKeyNav(e) {
  const items = $$('.command-item');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    commandHighlightIndex = Math.min(commandHighlightIndex + 1, items.length - 1);
    updateCommandHighlight(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    commandHighlightIndex = Math.max(commandHighlightIndex - 1, 0);
    updateCommandHighlight(items);
  } else if (e.key === 'Enter' && commandHighlightIndex >= 0) {
    items[commandHighlightIndex]?.click();
  }
}

function updateCommandHighlight(items) {
  items.forEach((item, i) => item.classList.toggle('highlighted', i === commandHighlightIndex));
  items[commandHighlightIndex]?.scrollIntoView({ block: 'nearest' });
}

// ── Result Panel Close ────────────────────────────────────────────────────────
function initResultPanel() {
  const closePanel = () => { $('#result-panel').hidden = true; };
  $('#result-panel-close').addEventListener('click', closePanel);
  // Wire up secondary close button and done button if present
  const closeX = document.getElementById('result-panel-close-x');
  if (closeX) closeX.addEventListener('click', closePanel);
  const doneBtn = document.getElementById('result-done-btn');
  if (doneBtn) doneBtn.addEventListener('click', closePanel);

  $('#result-export-btn').addEventListener('click', () => {
    if (!state.resultPanelData) return;
    const json = JSON.stringify(state.resultPanelData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wdt-${state.resultPanelTool || 'data'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ── Active Tool State ─────────────────────────────────────────────────────────
async function loadActiveTools() {
  state.activeTools = await storageService.getActiveTools();
}

// ── Main Init ─────────────────────────────────────────────────────────────────
async function init() {
  await Promise.all([
    loadActiveTools(),
    loadPinnedTools(),
    initDarkMode(),
    updatePageInfo()
  ]);

  renderGroupTabs();
  initSearch();
  initCommandPalette();
  initResultPanel();
}

document.addEventListener('DOMContentLoaded', init);
