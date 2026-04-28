// background.js — Service Worker (Manifest V3)
// Uses plain functions (no ES module imports) for MV3 service worker compatibility.

// ─── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_TIMEOUT_MS    = 10_000;
const DEFAULT_CONCURRENCY   = 8;
const DEFAULT_SLOW_MS       = 3_000;
const DEFAULT_CACHE_TTL     = 5 * 60 * 1000; // 5 min
const MAX_CACHE_ENTRIES     = 2000;

// ─── URL Normalization (FIXES CSP ERROR) ──────────────────────────────────────
function normalizeUrl(url) {
  if (!url) return null;
  
  try {
    const u = new URL(url);
    
    // 🔥 Upgrade HTTP to HTTPS (fixes CSP connect-src https: error)
    if (u.protocol === 'http:') {
      u.protocol = 'https:';
    }
    
    return u.href;
  } catch {
    return null;
  }
}

function shouldSkipHttp(url) {
  // Skip HTTP URLs entirely (OPTION 2 - Smart Filter)
  if (url && url.startsWith('http://')) {
    return true;
  }
  return false;
}

// ─── In-memory cache ───────────────────────────────────────────────────────────
const linkCache = new Map();

function cacheGet(url) {
  const entry = linkCache.get(url);
  if (!entry) return null;
  if (Date.now() - entry.ts > DEFAULT_CACHE_TTL) { linkCache.delete(url); return null; }
  return entry.result;
}

function cacheSet(url, result) {
  if (linkCache.size >= MAX_CACHE_ENTRIES) {
    linkCache.delete(linkCache.keys().next().value);
  }
  linkCache.set(url, { result, ts: Date.now() });
}

function cacheClearDomain(domain) {
  for (const key of linkCache.keys()) {
    try { if (new URL(key).hostname === domain) linkCache.delete(key); }
    catch (_) { linkCache.delete(key); }
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of linkCache.entries()) {
    if (now - v.ts > DEFAULT_CACHE_TTL) linkCache.delete(k);
  }
}, 60_000);

// ─── Link checking ─────────────────────────────────────────────────────────────
const SKIP_PREFIXES = ['mailto:', 'tel:', 'javascript:', 'data:', 'blob:', 'chrome:', 'chrome-extension:'];

function shouldSkip(url) {
  if (!url || url === '#') return true;
  for (const s of SKIP_PREFIXES) if (url.startsWith(s)) return true;
  // Skip HTTP URLs (CSP compliance)
  if (shouldSkipHttp(url)) return true;
  return false;
}

async function doFetch(url, method, timeoutMs) {
  // Normalize URL first (HTTP → HTTPS)
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) {
    return {
      url, finalUrl: url,
      status: 0, ok: false,
      responseTime: 0,
      redirectChain: [],
      redirectCount: 0,
      tooManyRedirects: false,
      networkError: true,
      timedOut: false,
      error: 'Invalid URL',
      skippedDueToCSP: url?.startsWith('http://')
    };
  }

  const timeout = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  const t0 = Date.now();

  try {
    const resp = await fetch(normalizedUrl, { method, signal: ctrl.signal, redirect: 'manual' });
    clearTimeout(timer);
    const responseTime = Date.now() - t0;

    const redirectChain = [];
    let finalUrl = normalizedUrl;
    let finalStatus = resp.status;
    let hops = 0;
    let curr = resp;
    let currUrl = normalizedUrl;

    while (curr.status >= 300 && curr.status < 400 && hops < 8) {
      const loc = curr.headers.get('location');
      if (!loc) break;
      try {
        const nextUrl = new URL(loc, currUrl).href;
        const normalizedNextUrl = normalizeUrl(nextUrl);
        if (!normalizedNextUrl) break;
        
        redirectChain.push({ from: currUrl, to: normalizedNextUrl, status: curr.status });
        currUrl = normalizedNextUrl;
        finalUrl = normalizedNextUrl;
        hops++;
        const c2 = new AbortController();
        const t2 = setTimeout(() => c2.abort(), timeout);
        curr = await fetch(normalizedNextUrl, { method: 'HEAD', signal: c2.signal, redirect: 'manual' })
          .catch(() => ({ status: 0, headers: new Headers() }));
        clearTimeout(t2);
        finalStatus = curr.status;
      } catch (_) { break; }
    }

    return {
      url, finalUrl,
      status: finalStatus,
      ok: finalStatus >= 200 && finalStatus < 400,
      responseTime,
      redirectChain,
      redirectCount: redirectChain.length,
      tooManyRedirects: redirectChain.length > 3,
      networkError: false,
      timedOut: false,
      upgradedToHttps: url !== normalizedUrl
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      url, finalUrl: normalizedUrl,
      status: 0, ok: false,
      responseTime: Date.now() - t0,
      redirectChain: [],
      redirectCount: 0,
      tooManyRedirects: false,
      networkError: true,
      timedOut: err.name === 'AbortError',
      error: err.message,
      upgradedToHttps: url !== normalizedUrl
    };
  }
}

async function checkLinkStatus(url, timeoutMs) {
  if (shouldSkip(url)) {
    // Special handling for HTTP URLs
    if (url && url.startsWith('http://')) {
      return { 
        url, 
        skipped: true, 
        ok: false, 
        status: null, 
        responseTime: 0, 
        redirectChain: [],
        reason: 'HTTP URLs are blocked by CSP. Upgrade to HTTPS.',
        statusCategory: 'blocked'
      };
    }
    return { url, skipped: true, ok: true, status: null, responseTime: 0, redirectChain: [] };
  }

  const cached = cacheGet(url);
  if (cached) return cached;

  let result = await doFetch(url, 'HEAD', timeoutMs);
  if (result.status === 405 || result.networkError) {
    const r2 = await doFetch(url, 'GET', timeoutMs);
    if (!r2.networkError || result.networkError) result = r2;
  }

  cacheSet(url, result);
  return result;
}

function classifyStatus(r, slowMs) {
  const threshold = Number.isFinite(slowMs) && slowMs > 0 ? slowMs : DEFAULT_SLOW_MS;
  if (r.skipped) {
    if (r.reason === 'HTTP URLs are blocked by CSP. Upgrade to HTTPS.') return 'blocked';
    return 'skipped';
  }
  if (r.networkError && !r.status) return r.timedOut ? 'slow' : 'error';
  const s = r.status;
  if (s >= 200 && s < 300) return r.responseTime > threshold ? 'slow' : 'live';
  if (s >= 300 && s < 400) return 'redirect';
  if (s === 404 || s === 410) return 'broken';
  if (s >= 400 && s < 500) return 'broken';
  if (s >= 500) return 'server_error';
  return 'error';
}

// ─── Scan history ──────────────────────────────────────────────────────────────
async function saveScanHistory(domain, stats) {
  const stored = await chrome.storage.local.get(['scanHistory']);
  const history = stored.scanHistory || {};
  if (!history[domain]) history[domain] = [];
  history[domain].unshift({
    time: Date.now(),
    total: stats.total,
    broken: stats.broken,
    live: stats.live,
    redirects: stats.redirects,
  });
  history[domain] = history[domain].slice(0, 10);
  await chrome.storage.local.set({ scanHistory: history });
}

// ─── Install / context menus ───────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['settings'], (data) => {
    if (!data.settings) {
      chrome.storage.sync.set({
        settings: {
          autoHighlight: true,
          showNotifications: false,
          checkExternalLinks: false,
          timeout: DEFAULT_TIMEOUT_MS,
          concurrency: DEFAULT_CONCURRENCY,
        },
      });
    }
  });

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'scanPage', title: 'Scan page for broken links', contexts: ['page'] });
    chrome.contextMenus.create({ id: 'scanLink', title: 'Check this link', contexts: ['link'] });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let targetTab = tab;
  if (!targetTab?.id) {
    const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
    targetTab = active;
  }
  if (!targetTab?.id) return;

  if (info.menuItemId === 'scanPage') {
    chrome.tabs.sendMessage(targetTab.id, { action: 'findAllLinks' });
  } else if (info.menuItemId === 'scanLink') {
    const result = await checkLinkStatus(info.linkUrl, DEFAULT_TIMEOUT_MS);
    
    let message = `${info.linkUrl}\n`;
    if (result.upgradedToHttps) {
      message += `⚠️ Upgraded from HTTP to HTTPS\n`;
    }
    if (result.skipped && result.reason) {
      message += `🚫 ${result.reason}\n`;
    } else {
      message += `Status: ${result.ok ? 'Working' : 'Broken'} (${result.status || 'ERR'})\n`;
    }
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Link Check Result',
      message: message,
    });
  }
});

// ─── Message handler ───────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.type === 'CHECK_LINK') {
    const timeout = request.timeout || DEFAULT_TIMEOUT_MS;
    checkLinkStatus(request.url, timeout)
      .then((r) => sendResponse({ ...r, statusCategory: classifyStatus(r) }))
      .catch((e) => sendResponse({ ok: false, status: 0, error: e.message }));
    return true;
  }

  if (request.type === 'BATCH_CHECK') {
    const links       = Array.isArray(request.links) ? request.links : [];
    const concurrency = Number.isFinite(request.concurrency) ? request.concurrency : DEFAULT_CONCURRENCY;
    const timeout     = Number.isFinite(request.timeout) ? request.timeout : DEFAULT_TIMEOUT_MS;
    batchCheck(links, concurrency, timeout)
      .then((results) => sendResponse({ results }))
      .catch((e) => sendResponse({ error: e.message }));
    return true;
  }

  if (request.type === 'SAVE_SCAN_HISTORY') {
    saveScanHistory(request.domain, request.stats)
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (request.type === 'GET_SCAN_HISTORY') {
    chrome.storage.local.get(['scanHistory'], (data) => {
      sendResponse(data.scanHistory || {});
    });
    return true;
  }

  if (request.type === 'CLEAR_CACHE') {
    if (request.domain) cacheClearDomain(request.domain);
    else linkCache.clear();
    sendResponse({ ok: true });
    return false;
  }

  if (request.type === 'BULK_SCAN') {
    const concurrency = Number.isFinite(request.concurrency) ? request.concurrency : DEFAULT_CONCURRENCY;
    const timeout     = Number.isFinite(request.timeout)     ? request.timeout     : DEFAULT_TIMEOUT_MS;
    handleBulkScan(request.baseUrl, request.maxDepth || 2, concurrency, timeout)
      .then((results) => sendResponse({ results }))
      .catch((e) => sendResponse({ error: e.message }));
    return true;
  }

  sendResponse({ error: 'Unknown request type' });
  return false;
});

// ─── Batch check ───────────────────────────────────────────────────────────────
async function batchCheck(links, concurrency, timeout) {
  const results = new Array(links.length);
  let idx = 0;

  async function worker() {
    while (idx < links.length) {
      const i = idx++;
      const r = await checkLinkStatus(links[i].url, timeout);
      results[i] = { ...links[i], ...r, statusCategory: classifyStatus(r) };
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, links.length || 1) }, worker));
  return results;
}

// ─── Bulk crawl ────────────────────────────────────────────────────────────────
async function handleBulkScan(baseUrl, maxDepth, concurrency, timeout) {
  const visited = new Set();
  const pageResults = {};

  async function crawl(url, depth) {
    if (depth > maxDepth || visited.has(url)) return;
    visited.add(url);

    try {
      const normalizedUrl = normalizeUrl(url);
      if (!normalizedUrl) return;
      
      const resp = await fetch(normalizedUrl);
      const html = await resp.text();
      const links = extractLinks(html, url);
      const results = await batchCheck(links.map((u) => ({ url: u })), concurrency, timeout);

      pageResults[url] = results.map((r) => ({
        ...r,
        statusCategory: classifyStatus(r),
        sourcePage: url,
      }));

      for (const r of pageResults[url]) {
        if (r.ok) {
          try {
            const u = new URL(r.url);
            const b = new URL(baseUrl);
            if (u.hostname === b.hostname) await crawl(r.url, depth + 1);
          } catch (_) {}
        }
      }
    } catch (_) {}
  }

  await crawl(baseUrl, 0);
  return pageResults;
}

function extractLinks(html, base) {
  const links = new Set();
  const re = /href=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const abs = new URL(m[1], base).href;
      if (abs.startsWith('http')) {
        // Store original but will be normalized when checked
        links.add(abs);
      }
    } catch (_) {}
  }
  return [...links];
}