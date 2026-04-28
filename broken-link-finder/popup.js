// popup.js — Broken Link Finder Pro v2
// All DOM manipulation via createElement/textContent/appendChild. No innerHTML.

'use strict';

// ─── Default settings ──────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  checkExternalLinks: false,
  autoHighlight: true,
  showNotifications: false,
  timeout: 10000,
  concurrency: 8,
};

// ─── State ─────────────────────────────────────────────────────────────────────
let scanResults = [];
let bulkScanResults = {};   // keyed by page URL, value = array of link results
let activeFilter = 'all';
let settings = { ...DEFAULT_SETTINGS };
let darkMode = false;

// ─── Selectors ─────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ─── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  applyTheme(darkMode);
  await updateCurrentUrl();
  setupEventListeners();
  await loadHistory();
  setStatus('Ready', 'ready');
  // Sync any dropdowns that were pre-built by dropdown.js before settings loaded
  syncAllDropdowns();
});

function syncAllDropdowns() {
  ['exportFilter', 'bulkDepth', 'settingTimeout', 'settingConcurrency'].forEach((id) => {
    if (window.BGDropdowns) window.BGDropdowns.sync(id);
  });
}

async function loadSettings() {
  const data = await chrome.storage.sync.get(['settings', 'darkMode']);
  settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
  darkMode = data.darkMode || false;

  $('settingExternal').checked      = settings.checkExternalLinks;
  $('settingAutoHighlight').checked = settings.autoHighlight;
  $('settingNotifications').checked = settings.showNotifications;

  // Timeout select
  const timeoutEl = $('settingTimeout');
  if (timeoutEl) {
    timeoutEl.value = String(settings.timeout || DEFAULT_SETTINGS.timeout);
    if (window.BGDropdowns) window.BGDropdowns.sync('settingTimeout');
  }

  // Concurrency select
  const concEl = $('settingConcurrency');
  if (concEl) {
    concEl.value = String(settings.concurrency || DEFAULT_SETTINGS.concurrency);
    if (window.BGDropdowns) window.BGDropdowns.sync('settingConcurrency');
  }

  updateThemeIcon(darkMode);
}

async function saveSettings() {
  settings = {
    checkExternalLinks: $('settingExternal').checked,
    autoHighlight:      $('settingAutoHighlight').checked,
    showNotifications:  $('settingNotifications').checked,
    timeout:            parseInt($('settingTimeout').value, 10)     || DEFAULT_SETTINGS.timeout,
    concurrency:        parseInt($('settingConcurrency').value, 10) || DEFAULT_SETTINGS.concurrency,
  };
  await chrome.storage.sync.set({ settings, darkMode });
}

async function updateCurrentUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const el = $('currentUrl');
      el.textContent = '';
      el.textContent = tab.url.length > 60 ? tab.url.slice(0, 60) + '…' : tab.url;
      el.title = tab.url;

      const bulkInput = $('bulkUrl');
      if (bulkInput && !bulkInput.value) {
        try { bulkInput.value = new URL(tab.url).origin; } catch (_) {}
      }
    }
  } catch (_) {}
}

// ─── Event listeners ───────────────────────────────────────────────────────────
function setupEventListeners() {
  // View tabs
  document.querySelectorAll('.view-tab').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach((btn) => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  // Theme toggle
  $('themeToggle').addEventListener('click', () => {
    darkMode = !darkMode;
    applyTheme(darkMode);
    updateThemeIcon(darkMode);
    chrome.storage.sync.set({ darkMode });
  });

  // Settings toggle
  $('settingsToggle').addEventListener('click', () => {
    $('settingsPanel').classList.toggle('hidden');
  });

  // Settings checkboxes
  ['settingExternal', 'settingAutoHighlight', 'settingNotifications'].forEach((id) => {
    $(id).addEventListener('change', saveSettings);
  });

  // Settings selects — native change fires from BGDropdowns item click
  ['settingTimeout', 'settingConcurrency'].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener('change', saveSettings);
  });

  // Scan
  $('scanBtn').addEventListener('click', startScan);

  // Highlight
  $('highlightBtn').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const broken = scanResults.filter((r) => r.statusCategory === 'broken' || r.statusCategory === 'error');
      if (!broken.length) { setStatus('No broken links to highlight', 'warning'); return; }
      await chrome.tabs.sendMessage(tab.id, { action: 'highlightBroken', links: broken });
      setStatus(`Highlighted ${broken.length} broken links`, 'success');
    } catch (e) {
      setStatus('Highlight failed: ' + e.message, 'error');
    }
  });

  // Clear
  $('clearBtn').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, { action: 'clearHighlights' });
      setStatus('Highlights cleared', 'ready');
    } catch (_) {}
  });

  // Export — Page Scan
  $('exportCSV').addEventListener('click',  () => exportData('csv'));
  $('exportJSON').addEventListener('click', () => exportData('json'));
  $('exportTXT').addEventListener('click',  () => exportData('txt'));

  // Export — Bulk Scan
  $('bulkExportCSV').addEventListener('click',  () => exportBulkData('csv'));
  $('bulkExportJSON').addEventListener('click', () => exportBulkData('json'));
  $('bulkExportTXT').addEventListener('click',  () => exportBulkData('txt'));

  // Bulk scan
  $('bulkScanBtn').addEventListener('click', startBulkScan);

  // Results list — event delegation
  $('resultsList').addEventListener('click', handleResultClick);
  
  // Clear all history button
  const clearAllHistoryBtn = $('clearAllHistoryBtn');
  if (clearAllHistoryBtn) {
    clearAllHistoryBtn.addEventListener('click', clearAllHistory);
  }
}

// ─── View management ───────────────────────────────────────────────────────────
function switchView(name) {
  document.querySelectorAll('.view-tab').forEach((t) => t.classList.toggle('active', t.dataset.view === name));
  document.querySelectorAll('.view').forEach((v) => {
    const id = v.id.replace('view-', '');
    v.classList.toggle('active', id === name);
    v.classList.toggle('hidden', id !== name);
  });
  if (name === 'history') loadHistory();
}

// ─── Scanning ──────────────────────────────────────────────────────────────────
async function startScan() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) { setStatus('No active tab', 'error'); return; }

    scanResults = [];
    setStatus('Scanning…', 'scanning');
    $('scanBtn').disabled = true;
    showProgress(0, 1);
    showElement($('statsGrid'));
    showElement($('filterTabs'));
    $('exportRow').classList.add('hidden');
    $('highlightBtn').disabled = true;
    $('clearBtn').disabled = true;

    // Get links from content script
    let resp;
    try {
      resp = await chrome.tabs.sendMessage(tab.id, {
        action: 'findAllLinks',
        checkExternal: settings.checkExternalLinks,
      });
    } catch (e) {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      resp = await chrome.tabs.sendMessage(tab.id, {
        action: 'findAllLinks',
        checkExternal: settings.checkExternalLinks,
      });
    }

    const links = resp?.links || [];
    if (links.length === 0) {
      setStatus('No checkable links found', 'warning');
      $('scanBtn').disabled = false;
      hideProgress();
      updateStats([]);
      renderResults([]);
      return;
    }

    setStatus(`Checking ${links.length} links…`, 'scanning');

    // Batch-check via background — use current settings values
    const BATCH = 20;
    const allResults = [];

    for (let i = 0; i < links.length; i += BATCH) {
      const batch = links.slice(i, i + BATCH);
      const batchResp = await chrome.runtime.sendMessage({
        type: 'BATCH_CHECK',
        links: batch,
        concurrency: settings.concurrency,
        timeout: settings.timeout,
      });

      if (batchResp?.results) {
        allResults.push(...batchResp.results);
      }
      const checked = Math.min(i + BATCH, links.length);
      showProgress(checked, links.length);
      updateStats(allResults);
      renderResults(allResults);
    }

    scanResults = allResults;
    hideProgress();
    showElement($('exportRow'));
    $('highlightBtn').disabled = false;
    $('clearBtn').disabled = false;
    $('scanBtn').disabled = false;

    const broken = allResults.filter((r) => r.statusCategory === 'broken' || r.statusCategory === 'error').length;
    setStatus(`Done — ${allResults.length} links, ${broken} broken`, broken > 0 ? 'error' : 'success');

    // Save history
    try {
      const domain = new URL(tab.url).hostname;
      await chrome.runtime.sendMessage({
        type: 'SAVE_SCAN_HISTORY',
        domain,
        stats: buildStats(allResults),
      });
    } catch (_) {}

    // Auto-highlight broken
    if (settings.autoHighlight && broken > 0) {
      const brokenLinks = allResults.filter((r) => r.statusCategory === 'broken' || r.statusCategory === 'error');
      await chrome.tabs.sendMessage(tab.id, { action: 'highlightBroken', links: brokenLinks });
    }

    // Show notification if enabled
    if (settings.showNotifications) {
      try {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Scan Complete',
          message: `${allResults.length} links checked, ${broken} broken`,
        });
      } catch (_) {}
    }

  } catch (err) {
    setStatus('Scan failed: ' + err.message, 'error');
    $('scanBtn').disabled = false;
    hideProgress();
  }
}

// ─── Stats ─────────────────────────────────────────────────────────────────────
function buildStats(results) {
  const total = results.length;
  const broken = results.filter((r) => r.statusCategory === 'broken' || r.statusCategory === 'error').length;
  const redirects = results.filter((r) => r.statusCategory === 'redirect').length;
  const live = results.filter((r) => r.statusCategory === 'live').length;
  const successRate = total > 0 ? Math.round(((total - broken) / total) * 100) : 100;
  return { total, broken, redirects, live, successRate };
}

function updateStats(results) {
  const s = buildStats(results);
  $('statTotal').textContent       = s.total;
  $('statBroken').textContent      = s.broken;
  $('statRedirects').textContent   = s.redirects;
  $('statSuccessRate').textContent = s.successRate + '%';
}

// ─── Filter ────────────────────────────────────────────────────────────────────
function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('.filter-tab').forEach((t) => t.classList.toggle('active', t.dataset.filter === filter));
  renderResults(scanResults);
}

function getFilteredResults(results) {
  switch (activeFilter) {
    case 'broken':   return results.filter((r) => r.statusCategory === 'broken' || r.statusCategory === 'error');
    case 'redirect': return results.filter((r) => r.statusCategory === 'redirect');
    case 'slow':     return results.filter((r) => r.statusCategory === 'slow');
    case 'image':    return results.filter((r) => r.domType === 'image');
    case 'external': return results.filter((r) => r.linkType === 'external');
    default:         return results;
  }
}

// ─── Render results (CSP-safe) ─────────────────────────────────────────────────
function renderResults(results) {
  const list  = $('resultsList');
  const empty = $('emptyState');

  if (!results.length) {
    showElement(empty);
    list.classList.add('hidden');
    return;
  }

  const filtered = getFilteredResults(results);
  empty.classList.add('hidden');
  showElement(list);

  while (list.firstChild) list.removeChild(list.firstChild);

  if (filtered.length === 0) {
    const msg = document.createElement('div');
    msg.className   = 'no-results-msg';
    msg.textContent = 'No links match this filter.';
    list.appendChild(msg);
    return;
  }

  // Table header
  const thead = document.createElement('div');
  thead.className = 'results-thead';
  ['URL', 'Status', 'Type', 'Time', ''].forEach((col) => {
    const th = document.createElement('span');
    th.className   = 'th';
    th.textContent = col;
    thead.appendChild(th);
  });
  list.appendChild(thead);

  filtered.forEach((r) => {
    list.appendChild(buildRow(r));
  });
}

function buildRow(r) {
  const row = document.createElement('div');
  row.className    = 'result-row';
  row.dataset.url  = r.url;
  row.dataset.status = r.statusCategory;

  // URL cell
  const urlCell = document.createElement('div');
  urlCell.className = 'cell cell-url';

  if (r.tooManyRedirects) {
    const flag = document.createElement('span');
    flag.className   = 'flag-badge';
    flag.textContent = '3+ hops';
    urlCell.appendChild(flag);
  }

  const urlLink = document.createElement('a');
  urlLink.className   = 'url-link';
  urlLink.href        = '#';
  urlLink.dataset.url = r.url;
  urlLink.title       = r.url;
  urlLink.textContent = truncate(r.url, 55);
  urlCell.appendChild(urlLink);

  // Status cell
  const statusCell = document.createElement('div');
  statusCell.className = 'cell cell-status';
  const badge = document.createElement('span');
  badge.className   = 'status-badge status-' + r.statusCategory;
  badge.textContent = r.status || 'ERR';
  statusCell.appendChild(badge);

  if (r.redirectCount > 0) {
    const hops = document.createElement('span');
    hops.className   = 'hops-badge';
    hops.textContent = r.redirectCount + ' hop' + (r.redirectCount > 1 ? 's' : '');
    statusCell.appendChild(hops);
  }

  // Type cell
  const typeCell = document.createElement('div');
  typeCell.className = 'cell cell-type';
  const typeBadge = document.createElement('span');
  typeBadge.className   = 'type-badge type-' + (r.linkType || 'internal');
  typeBadge.textContent = r.linkType || 'internal';
  typeCell.appendChild(typeBadge);

  // Time cell
  const timeCell = document.createElement('div');
  timeCell.className   = 'cell cell-time';
  timeCell.textContent = r.responseTime > 0 ? formatMs(r.responseTime) : '—';

  // Actions cell
  const actCell = document.createElement('div');
  actCell.className = 'cell cell-actions';
  actCell.appendChild(makeActionBtn('open',  r.url, svgOpen()));
  actCell.appendChild(makeActionBtn('copy',  r.url, svgCopy()));
  if (r.statusCategory === 'broken' || r.statusCategory === 'error') {
    const fixBtn   = makeActionBtn('suggest', r.url, svgFix());
    fixBtn.title   = 'Suggest alternatives';
    actCell.appendChild(fixBtn);
  }

  row.appendChild(urlCell);
  row.appendChild(statusCell);
  row.appendChild(typeCell);
  row.appendChild(timeCell);
  row.appendChild(actCell);

  row.addEventListener('click', (e) => {
    if (e.target.closest('.cell-actions')) return;
    toggleExpand(row, r);
  });

  return row;
}

function toggleExpand(row, r) {
  const existing = row.nextElementSibling;
  if (existing && existing.classList.contains('expand-row')) {
    existing.remove();
    row.classList.remove('expanded');
    return;
  }
  row.classList.add('expanded');

  const exp = document.createElement('div');
  exp.className = 'expand-row';

  // Full URL
  const fullUrlWrap = document.createElement('div');
  fullUrlWrap.className = 'expand-section';
  const fullLabel = document.createElement('span');
  fullLabel.className   = 'expand-label';
  fullLabel.textContent = 'Full URL';
  const fullUrl = document.createElement('span');
  fullUrl.className   = 'expand-value';
  fullUrl.textContent = r.url;
  fullUrlWrap.appendChild(fullLabel);
  fullUrlWrap.appendChild(fullUrl);
  exp.appendChild(fullUrlWrap);

  // Redirect chain
  if (r.redirectChain && r.redirectChain.length > 0) {
    const chainWrap  = document.createElement('div');
    chainWrap.className = 'expand-section';
    const chainLabel = document.createElement('span');
    chainLabel.className   = 'expand-label';
    chainLabel.textContent = 'Redirect chain';
    chainWrap.appendChild(chainLabel);

    r.redirectChain.forEach((hop) => {
      const hopEl     = document.createElement('div');
      hopEl.className = 'redirect-hop';
      const hopStatus = document.createElement('span');
      hopStatus.className   = 'hop-status';
      hopStatus.textContent = hop.status;
      const hopArrow = document.createTextNode(' → ');
      const hopTo    = document.createElement('span');
      hopTo.className   = 'hop-url';
      hopTo.textContent = truncate(hop.to, 50);
      hopEl.appendChild(hopStatus);
      hopEl.appendChild(hopArrow);
      hopEl.appendChild(hopTo);
      chainWrap.appendChild(hopEl);
    });
    exp.appendChild(chainWrap);
  }

  // Fix suggestions
  if (r.statusCategory === 'broken' || r.statusCategory === 'error') {
    const suggestions = suggestAlternatives(r.url);
    if (suggestions.length) {
      const sugWrap  = document.createElement('div');
      sugWrap.className = 'expand-section';
      const sugLabel = document.createElement('span');
      sugLabel.className   = 'expand-label';
      sugLabel.textContent = 'Possible alternatives';
      sugWrap.appendChild(sugLabel);

      suggestions.forEach((s) => {
        const sugRow = document.createElement('div');
        sugRow.className = 'suggestion-row';
        const reason = document.createElement('span');
        reason.className   = 'suggestion-reason';
        reason.textContent = s.reason;
        const link = document.createElement('a');
        link.className      = 'suggestion-link';
        link.href           = '#';
        link.textContent    = truncate(s.url, 45);
        link.dataset.url    = s.url;
        link.addEventListener('click', (e) => {
          e.preventDefault();
          chrome.tabs.create({ url: s.url, active: false });
        });
        sugRow.appendChild(reason);
        sugRow.appendChild(link);
        sugWrap.appendChild(sugRow);
      });
      exp.appendChild(sugWrap);
    }
  }

  row.after(exp);
}

// ─── Action handlers ────────────────────────────────────────────────────────────
function handleResultClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();

  const action = btn.dataset.action;
  const url    = btn.dataset.url;

  if (action === 'open') {
    chrome.tabs.create({ url, active: false });
  } else if (action === 'copy') {
    copyTextToClipboard(url)
      .then(() => setStatus('URL copied', 'success'))
      .catch(() => setStatus('Copy failed', 'error'));
  } else if (action === 'suggest') {
    const row = btn.closest('.result-row');
    if (row) {
      const r = scanResults.find((x) => x.url === url);
      if (r) toggleExpand(row, r);
    }
  }
}

// ─── Bulk scan ─────────────────────────────────────────────────────────────────
async function startBulkScan() {
  const baseUrl = $('bulkUrl').value.trim();
  if (!baseUrl) { setStatus('Enter a URL', 'warning'); return; }

  try { new URL(baseUrl); }
  catch (_) { setStatus('Invalid URL', 'error'); return; }

  const maxDepth = parseInt($('bulkDepth').value, 10);
  $('bulkScanBtn').disabled = true;
  showElement($('bulkProgress'));
  $('bulkProgressLabel').textContent = 'Scanning…';
  $('bulkProgressFill').value = 10;
  $('bulkExportRow').classList.add('hidden');
  bulkScanResults = {};

  const bulkResultsEl = $('bulkResults');
  while (bulkResultsEl.firstChild) bulkResultsEl.removeChild(bulkResultsEl.firstChild);

  try {
    const resp = await chrome.runtime.sendMessage({
      type: 'BULK_SCAN',
      baseUrl,
      maxDepth,
      concurrency: settings.concurrency,
      timeout: settings.timeout,
    });

    if (resp?.error) throw new Error(resp.error);

    $('bulkProgressFill').value = 100;
    $('bulkProgress').classList.add('hidden');
    showElement(bulkResultsEl);

    const pages = resp?.results || {};
    if (!Object.keys(pages).length) {
      const msg = document.createElement('p');
      msg.className   = 'no-results-msg';
      msg.textContent = 'No results found.';
      bulkResultsEl.appendChild(msg);
    } else {
      bulkScanResults = pages;
      renderBulkResults(pages, bulkResultsEl);
      showElement($('bulkExportRow'));
    }
  } catch (err) {
    setStatus('Bulk scan failed: ' + err.message, 'error');
  } finally {
    $('bulkScanBtn').disabled = false;
  }
}

function renderBulkResults(pages, container) {
  for (const [pageUrl, links] of Object.entries(pages)) {
    const section   = document.createElement('div');
    section.className = 'bulk-page-section';

    const heading   = document.createElement('div');
    heading.className = 'bulk-page-heading';

    const pageTitle = document.createElement('span');
    pageTitle.className   = 'bulk-page-url';
    pageTitle.textContent = truncate(pageUrl, 50);
    pageTitle.title       = pageUrl;

    const counts      = buildStats(links);
    const countBadge  = document.createElement('span');
    countBadge.className   = 'bulk-count-badge' + (counts.broken > 0 ? ' has-broken' : '');
    countBadge.textContent = counts.broken + ' broken / ' + counts.total + ' total';

    heading.appendChild(pageTitle);
    heading.appendChild(countBadge);
    section.appendChild(heading);

    const brokenLinks = links.filter((r) => r.statusCategory === 'broken' || r.statusCategory === 'error');
    if (brokenLinks.length > 0) {
      brokenLinks.forEach((r) => section.appendChild(buildRow(r)));
    } else {
      const ok = document.createElement('div');
      ok.className   = 'bulk-all-ok';
      ok.textContent = 'All links healthy';
      section.appendChild(ok);
    }

    container.appendChild(section);
  }
}

// ─── History management (FIXED with delete functionality) ────────────────────────

async function loadHistory() {
  const list = $('historyList');
  const clearAllBtn = $('clearAllHistoryBtn');
  
  while (list.firstChild) list.removeChild(list.firstChild);

  const history = await chrome.runtime.sendMessage({ type: 'GET_SCAN_HISTORY' });
  
  if (!history || Object.keys(history).length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 48 48');
    svg.setAttribute('fill', 'none');
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', '24'); c.setAttribute('cy', '24'); c.setAttribute('r', '20');
    c.setAttribute('stroke', 'currentColor'); c.setAttribute('stroke-width', '2');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', 'M24 14v10l6 6');
    p.setAttribute('stroke', 'currentColor'); p.setAttribute('stroke-width', '2');
    p.setAttribute('stroke-linecap', 'round');
    svg.appendChild(c); svg.appendChild(p);
    const msg = document.createElement('p');
    msg.textContent = 'No scans recorded yet';
    empty.appendChild(svg);
    empty.appendChild(msg);
    list.appendChild(empty);
    if (clearAllBtn) clearAllBtn.classList.add('hidden');
    return;
  }

  if (clearAllBtn) clearAllBtn.classList.remove('hidden');
  
  // Sort domains alphabetically
  const sortedDomains = Object.keys(history).sort();
  
  for (const domain of sortedDomains) {
    const scans = history[domain];
    const section = document.createElement('div');
    section.className = 'history-domain';
    section.dataset.domain = domain;

    const domainLabel = document.createElement('div');
    domainLabel.className = 'history-domain-name';
    
    const domainText = document.createElement('span');
    domainText.className = 'history-domain-text';
    domainText.textContent = domain;
    
    const domainActions = document.createElement('div');
    domainActions.className = 'history-domain-actions';
    
    const deleteDomainBtn = document.createElement('button');
    deleteDomainBtn.className = 'history-delete-domain';
    deleteDomainBtn.title = 'Delete all history for this domain';
    deleteDomainBtn.appendChild(svgTrash());
    deleteDomainBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm(`Delete all scan history for "${domain}"?`)) {
        await deleteDomainHistory(domain);
        await loadHistory();
        setStatus(`Deleted history for ${domain}`, 'success');
      }
    });
    
    domainActions.appendChild(deleteDomainBtn);
    domainLabel.appendChild(domainText);
    domainLabel.appendChild(domainActions);
    section.appendChild(domainLabel);

    // Sort scans by time (newest first)
    const sortedScans = [...scans].sort((a, b) => b.time - a.time);
    
    sortedScans.forEach((scan) => {
      const entry = document.createElement('div');
      entry.className = 'history-entry';

      const time = document.createElement('span');
      time.className = 'history-time';
      time.textContent = formatDate(scan.time);

      const stats = document.createElement('span');
      stats.className = 'history-stats';
      
      const brokenSpan = document.createElement('span');
      brokenSpan.className = scan.broken > 0 ? 'history-broken' : 'history-ok';
      brokenSpan.textContent = scan.broken + ' broken';
      
      const totalSpan = document.createElement('span');
      totalSpan.className = 'history-total';
      totalSpan.textContent = ' / ' + scan.total + ' total';
      
      stats.appendChild(brokenSpan);
      stats.appendChild(totalSpan);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'history-delete-scan';
      deleteBtn.title = 'Delete this scan';
      deleteBtn.appendChild(svgClose());
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Delete scan from ${formatDate(scan.time)}?`)) {
          await deleteScanHistory(domain, scan.time);
          await loadHistory();
          setStatus('Scan deleted', 'success');
        }
      });

      entry.appendChild(time);
      entry.appendChild(stats);
      entry.appendChild(deleteBtn);
      section.appendChild(entry);
    });

    list.appendChild(section);
  }
}

async function deleteDomainHistory(domain) {
  const stored = await chrome.storage.local.get(['scanHistory']);
  const history = stored.scanHistory || {};
  
  if (history[domain]) {
    delete history[domain];
    await chrome.storage.local.set({ scanHistory: history });
  }
}

async function deleteScanHistory(domain, scanTime) {
  const stored = await chrome.storage.local.get(['scanHistory']);
  const history = stored.scanHistory || {};
  
  if (history[domain]) {
    history[domain] = history[domain].filter(scan => scan.time !== scanTime);
    
    // If domain has no more scans, delete the domain entry
    if (history[domain].length === 0) {
      delete history[domain];
    }
    
    await chrome.storage.local.set({ scanHistory: history });
  }
}

async function clearAllHistory() {
  if (confirm('Delete ALL scan history? This action cannot be undone.')) {
    await chrome.storage.local.set({ scanHistory: {} });
    await loadHistory();
    setStatus('All history cleared', 'success');
  }
}

// ─── Export ────────────────────────────────────────────────────────────────────

/** Resolve which page-scan records to export based on the filter dropdown. */
function getExportData() {
  const filterVal = $('exportFilter').value;
  let data = scanResults;
  if (filterVal === 'broken')   data = data.filter((r) => r.statusCategory === 'broken' || r.statusCategory === 'error');
  else if (filterVal === 'redirect') data = data.filter((r) => r.statusCategory === 'redirect');
  else if (filterVal === 'live')     data = data.filter((r) => r.statusCategory === 'live');
  return { data, filterVal };
}

/** Page-scan export entry point. */
function exportData(format) {
  const { data, filterVal } = getExportData();
  if (!data.length) { setStatus('No data to export', 'warning'); return; }

  switch (format) {
    case 'csv':  downloadBlob(buildCsv(data),              'text/csv',        'broken-links.csv');  break;
    case 'json': downloadBlob(buildJson(data, filterVal),  'application/json','broken-links.json'); break;
    case 'txt':  downloadBlob(buildTxt(data, filterVal),   'text/plain',      'broken-links.txt');  break;
  }
  setStatus('Export complete', 'success');
}

/** Bulk-scan export entry point – flattens all pages into one file. */
function exportBulkData(format) {
  if (!Object.keys(bulkScanResults).length) {
    setStatus('No bulk data to export', 'warning');
    return;
  }

  // Flatten all page results into a single array, preserving sourcePage
  const flat = Object.entries(bulkScanResults).flatMap(([pageUrl, links]) =>
    links.map((r) => ({ ...r, sourcePage: pageUrl }))
  );

  if (!flat.length) { setStatus('No data to export', 'warning'); return; }

  switch (format) {
    case 'csv':  downloadBlob(buildCsv(flat, true),              'text/csv',        'bulk-scan.csv');  break;
    case 'json': downloadBlob(buildBulkJson(bulkScanResults),     'application/json','bulk-scan.json'); break;
    case 'txt':  downloadBlob(buildBulkTxt(bulkScanResults),      'text/plain',      'bulk-scan.txt');  break;
  }
  setStatus('Bulk export complete', 'success');
}

// ── Format builders ────────────────────────────────────────────────────────────

function buildCsv(data, includeSourcePage = false) {
  const headers = [
    'URL', 'Status', 'Category', 'Type',
    'Response Time (ms)', 'Redirect Count', 'Final URL', 'Error',
    ...(includeSourcePage ? ['Source Page'] : []),
  ];
  const rows = data.map((r) => [
    csvEscape(r.url),
    r.status || '',
    r.statusCategory || '',
    r.linkType || r.domType || '',
    r.responseTime || '',
    r.redirectCount || 0,
    csvEscape(r.finalUrl || ''),
    csvEscape(r.error || ''),
    ...(includeSourcePage ? [csvEscape(r.sourcePage || '')] : []),
  ]);
  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

function buildJson(data, filter) {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    filter: filter || 'all',
    total: data.length,
    links: data.map(linkToJsonObj),
  }, null, 2);
}

function buildBulkJson(pages) {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    pages: Object.fromEntries(
      Object.entries(pages).map(([pageUrl, links]) => [
        pageUrl,
        { total: links.length, links: links.map(linkToJsonObj) },
      ])
    ),
  }, null, 2);
}

function buildTxt(data, filter) {
  const sep    = '─'.repeat(72);
  const header = [
    'BROKEN LINK FINDER PRO — EXPORT',
    `Exported : ${new Date().toLocaleString()}`,
    `Filter   : ${filter || 'all'}`,
    `Total    : ${data.length} link(s)`,
    sep,
  ].join('\n');

  const body = data.map((r, i) => {
    const lines = [
      `[${i + 1}] ${r.url}`,
      `    Status   : ${r.status || 'ERR'} (${r.statusCategory || '—'})`,
      `    Type     : ${r.linkType || r.domType || '—'}`,
      `    Time     : ${r.responseTime ? r.responseTime + ' ms' : '—'}`,
    ];
    if (r.finalUrl && r.finalUrl !== r.url) lines.push(`    Final URL: ${r.finalUrl}`);
    if (r.redirectCount > 0)               lines.push(`    Redirects: ${r.redirectCount} hop(s)`);
    if (r.error)                           lines.push(`    Error    : ${r.error}`);
    return lines.join('\n');
  });

  return [header, ...body].join('\n\n');
}

function buildBulkTxt(pages) {
  const sep    = '═'.repeat(72);
  const subSep = '─'.repeat(72);
  const lines  = [
    'BROKEN LINK FINDER PRO — BULK SCAN EXPORT',
    `Exported : ${new Date().toLocaleString()}`,
    `Pages    : ${Object.keys(pages).length}`,
    sep,
  ];

  for (const [pageUrl, links] of Object.entries(pages)) {
    const stats = buildStats(links);
    lines.push(`\nPAGE: ${pageUrl}`);
    lines.push(`Total: ${stats.total}  |  Broken: ${stats.broken}  |  Redirects: ${stats.redirects}`);
    lines.push(subSep);

    if (links.length === 0) {
      lines.push('  (no links found)');
    } else {
      links.forEach((r, i) => {
        lines.push(`  [${i + 1}] ${r.url}`);
        lines.push(`       Status: ${r.status || 'ERR'} (${r.statusCategory || '—'})  |  Type: ${r.linkType || r.domType || '—'}  |  Time: ${r.responseTime ? r.responseTime + ' ms' : '—'}`);
        if (r.finalUrl && r.finalUrl !== r.url) lines.push(`       Final : ${r.finalUrl}`);
        if (r.error)                            lines.push(`       Error : ${r.error}`);
      });
    }
  }

  return lines.join('\n');
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function linkToJsonObj(r) {
  return {
    url:           r.url,
    finalUrl:      r.finalUrl,
    status:        r.status,
    statusCategory:r.statusCategory,
    linkType:      r.linkType,
    domType:       r.domType,
    responseTime:  r.responseTime,
    redirectCount: r.redirectCount,
    redirectChain: r.redirectChain,
    error:         r.error,
  };
}

function csvEscape(val) {
  if (!val) return '""';
  return '"' + String(val).replace(/"/g, '""') + '"';
}

function downloadBlob(content, type, filename) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  chrome.downloads.download({ url, filename, saveAs: true }, () => {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

// ─── Suggestions ───────────────────────────────────────────────────────────────
function suggestAlternatives(url) {
  const suggestions = [];
  try {
    const u = new URL(url);
    if (u.pathname !== '/') suggestions.push({ url: u.origin + '/', reason: 'Domain root' });
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length > 1) {
      parts.pop();
      suggestions.push({ url: u.origin + '/' + parts.join('/') + '/', reason: 'Parent path' });
    }
    if (u.hostname.startsWith('www.')) {
      suggestions.push({ url: `${u.protocol}//${u.hostname.slice(4)}${u.pathname}`, reason: 'Without www' });
    } else {
      suggestions.push({ url: `${u.protocol}//www.${u.hostname}${u.pathname}`, reason: 'With www' });
    }
    if (u.protocol === 'http:') suggestions.push({ url: 'https://' + u.hostname + u.pathname, reason: 'Try HTTPS' });
  } catch (_) {}
  return suggestions.slice(0, 3);
}

// ─── UI helpers ────────────────────────────────────────────────────────────────
function showProgress(done, total) {
  const wrap = $('progressWrap');
  wrap.classList.remove('hidden');
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  $('progressFill').value        = pct;
  $('progressLabel').textContent = done + ' / ' + total;
}

function hideProgress() {
  $('progressWrap').classList.add('hidden');
  $('progressFill').value        = 0;
  $('progressLabel').textContent = '0 / 0';
}

function showElement(el) {
  if (el) el.classList.remove('hidden');
}

function setStatus(msg, type) {
  $('statusText').textContent = msg;
  $('statusDot').className    = 'status-dot status-' + (type || 'ready');
}

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

function updateThemeIcon(dark) {
  $('themeIconDark').classList.toggle('hidden', dark);
  $('themeIconLight').classList.toggle('hidden', !dark);
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function formatMs(ms) {
  if (!ms) return '—';
  return ms < 1000 ? ms + ' ms' : (ms / 1000).toFixed(1) + ' s';
}

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch (_) {}
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.className = 'hidden';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  if (!ok) throw new Error('copy failed');
}

// ─── SVG icon helpers ──────────────────────────────────────────────────────────
function makeActionBtn(action, url, svgEl) {
  const btn = document.createElement('button');
  btn.className      = 'action-btn';
  btn.dataset.action = action;
  btn.dataset.url    = url;
  btn.title = action === 'open' ? 'Open in new tab' : action === 'copy' ? 'Copy URL' : 'Suggest fix';
  btn.appendChild(svgEl);
  return btn;
}

function svgOpen() {
  const ns  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16'); svg.setAttribute('fill', 'currentColor');
  const p1 = document.createElementNS(ns, 'path');
  p1.setAttribute('d', 'M8.636 3.5a.5.5 0 00-.5-.5H1.5A1.5 1.5 0 000 4.5v10A1.5 1.5 0 001.5 16h10a1.5 1.5 0 001.5-1.5V7.864a.5.5 0 00-1 0V14.5a.5.5 0 01-.5.5h-10a.5.5 0 01-.5-.5v-10a.5.5 0 01.5-.5h6.636a.5.5 0 00.5-.5z');
  const p2 = document.createElementNS(ns, 'path');
  p2.setAttribute('d', 'M16 .5a.5.5 0 00-.5-.5h-5a.5.5 0 000 1h3.793L6.146 9.146a.5.5 0 10.708.708L15 1.707V5.5a.5.5 0 001 0v-5z');
  svg.appendChild(p1); svg.appendChild(p2);
  return svg;
}

function svgCopy() {
  const ns  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16'); svg.setAttribute('fill', 'currentColor');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('fill-rule', 'evenodd');
  path.setAttribute('d', 'M4 2a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V2zm2-1a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V2a1 1 0 00-1-1H6zM2 5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1v-1h1v1a2 2 0 01-2 2H2a2 2 0 01-2-2V6a2 2 0 012-2h1v1H2z');
  svg.appendChild(path);
  return svg;
}

function svgFix() {
  const ns  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16'); svg.setAttribute('fill', 'currentColor');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 01-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 01.872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 012.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 012.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 01.872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 01-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 01-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 110-5.858 2.929 2.929 0 010 5.858z');
  svg.appendChild(path);
  return svg;
}

function svgTrash() {
  const ns  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('width', '12');
  svg.setAttribute('height', '12');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M5.5 5.5A.5.5 0 016 5h4a.5.5 0 01.5.5v7a.5.5 0 01-.5.5H6a.5.5 0 01-.5-.5v-7zm2-3a.5.5 0 00-.5.5V4h3v-1a.5.5 0 00-.5-.5h-2zM4 5h8v1H4V5z');
  svg.appendChild(path);
  return svg;
}

function svgClose() {
  const ns  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('width', '12');
  svg.setAttribute('height', '12');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z');
  svg.appendChild(path);
  return svg;
}