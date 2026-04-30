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
  const resultsEl = document.getElementById('results');
  const chips = Array.from(document.querySelectorAll('.chip'));

  let currentTab = null;
  let filterType = 'all';

  function setFilter(next) {
    filterType = next;
    chips.forEach((c) => (c.dataset.active = c.dataset.type === next ? 'true' : 'false'));
    runSearch();
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => setFilter(chip.dataset.type));
  });

  queryInput.addEventListener('input', () => runSearch());

  newNoteBtn.addEventListener('click', async () => {
    const tabId = currentTab?.id;
    if (!tabId) return;
    await chrome.tabs.sendMessage(tabId, { action: 'stickey_createNote' }).catch(() => {});
    window.close();
  });

  togglePanelBtn.addEventListener('click', async () => {
    const tabId = currentTab?.id;
    if (!tabId) return;
    await chrome.tabs.sendMessage(tabId, { action: 'stickey_togglePanel' }).catch(() => {});
    window.close();
  });

  openGraphBtn.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ action: 'stickey_openGraph' });
    window.close();
  });

  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    currentTab = tabs?.[0] || null;
    await refreshStats();
    await runSearch();
  });

  async function refreshStats() {
    const resp = await chrome.runtime.sendMessage({ action: 'stickey_getAllAnnotations' });
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
    const resp = await chrome.runtime.sendMessage({
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

    const snippet = document.createElement('div');
    snippet.className = 'result-snippet';
    snippet.textContent = r.snippet || '';

    row.appendChild(top);
    row.appendChild(snippet);

    row.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ action: 'stickey_navigateTo', id: r.id });
      window.close();
    });

    return row;
  }
});

