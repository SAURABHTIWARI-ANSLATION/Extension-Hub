// content.js — Improved link detection + CSP-safe highlighting

let highlightedElements = new Map();
const STYLE_ID = 'blf-highlight-styles';

// ─── Message router ────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    switch (request.action) {
      case 'findAllLinks': {
        const links = findAllLinks(request.checkExternal);
        sendResponse({ links, pageOrigin: window.location.origin });
        break;
      }
      case 'highlightBroken':
        highlightLinks(request.links);
        sendResponse({ success: true, count: highlightedElements.size });
        break;
      case 'clearHighlights':
        clearHighlights();
        sendResponse({ success: true });
        break;
      case 'getPageInfo':
        sendResponse(getPageInfo());
        break;
      default:
        sendResponse({ error: 'Unknown action' });
    }
  } catch (err) {
    sendResponse({ error: err.message });
  }
  return true;
});

// ─── Link discovery ────────────────────────────────────────────────────────────
function findAllLinks(checkExternal = false) {
  const links = [];
  const seen = new Set();

  function addLink(url, domType, text) {
    try {
      if (!url || url === '#' || url.startsWith('javascript:') || url.startsWith('data:')) return;
      const abs = new URL(url, window.location.href).href;
      if (seen.has(abs)) return;
      const external = isExternal(abs);
      if (!checkExternal && external) return;
      seen.add(abs);
      // linkType drives the External filter tab and the type badge in the popup.
      // For anchor links: 'external' | 'internal'. For resource assets: use the domType.
      const linkType = (domType === 'anchor')
        ? (external ? 'external' : 'internal')
        : domType;
      links.push({ url: abs, domType, linkType, text: (text || '').trim().slice(0, 80) });
    } catch (_) {}
  }

  // Anchors
  document.querySelectorAll('a[href]').forEach((a) => {
    addLink(
      a.getAttribute('href'),
      'anchor',
      a.textContent || a.title || a.getAttribute('aria-label') || ''
    );
  });

  // Images
  document.querySelectorAll('img[src]').forEach((img) => {
    addLink(img.getAttribute('src'), 'image', img.alt || img.title || '');
  });

  // Scripts
  document.querySelectorAll('script[src]').forEach((s) => {
    addLink(s.getAttribute('src'), 'script', 'script');
  });

  // Stylesheets
  document.querySelectorAll('link[rel="stylesheet"][href]').forEach((l) => {
    addLink(l.getAttribute('href'), 'stylesheet', 'stylesheet');
  });

  return links;
}

function isExternal(url) {
  try {
    return new URL(url).hostname !== window.location.hostname;
  } catch (_) { return false; }
}

// ─── Highlighting ──────────────────────────────────────────────────────────────
function highlightLinks(brokenLinks) {
  clearHighlights();
  if (!Array.isArray(brokenLinks) || brokenLinks.length === 0) return;

  injectHighlightStyles();

  brokenLinks.forEach((link) => {
    if (!link?.url) return;
    const elements = resolveElements(link.url);
    elements.forEach((el) => {
      if (highlightedElements.has(el)) return;
      applyHighlight(el, link);
    });
  });
}

function resolveElements(url) {
  const found = [];
  const escaped = CSS.escape(url);

  [`a[href="${escaped}"]`, `img[src="${escaped}"]`,
   `script[src="${escaped}"]`, `link[href="${escaped}"]`].forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => found.push(el));
  });

  // Fallback: match by normalized pathname
  if (found.length === 0) {
    try {
      const target = new URL(url);
      document.querySelectorAll('a[href]').forEach((a) => {
        try {
          if (new URL(a.href).pathname === target.pathname) found.push(a);
        } catch (_) {}
      });
    } catch (_) {}
  }

  return [...new Set(found)];
}

function applyHighlight(el, link) {
  el.classList.add('blf-broken');
  el.dataset.blfUrl = link.url;
  el.dataset.blfStatus = link.status || '0';

  const tip = document.createElement('div');
  tip.className = 'blf-tooltip';

  const urlLine = document.createElement('div');
  urlLine.className = 'blf-tip-url';
  urlLine.textContent = link.url.length > 60 ? link.url.slice(0, 60) + '…' : link.url;

  const meta = document.createElement('div');
  meta.className = 'blf-tip-meta';
  const statusSpan = document.createElement('span');
  statusSpan.textContent = 'Status: ' + (link.status || 'ERR');
  meta.appendChild(statusSpan);

  if (link.responseTime) {
    meta.appendChild(document.createTextNode(' · '));
    const timeSpan = document.createElement('span');
    timeSpan.textContent = link.responseTime + ' ms';
    meta.appendChild(timeSpan);
  }

  tip.appendChild(urlLine);
  tip.appendChild(meta);
  el.appendChild(tip);

  highlightedElements.set(el, true);
}

function clearHighlights() {
  highlightedElements.forEach((_meta, el) => {
    el.classList.remove('blf-broken');
    delete el.dataset.blfUrl;
    delete el.dataset.blfStatus;

    const tip = el.querySelector('.blf-tooltip');
    if (tip) el.removeChild(tip);
  });
  highlightedElements.clear();

  const style = document.getElementById(STYLE_ID);
  if (style) style.remove();
}

function injectHighlightStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .blf-broken {
      outline: 2px solid #ef4444 !important;
      outline-offset: 2px !important;
      background-color: rgba(239,68,68,0.08) !important;
      position: relative !important;
      border-radius: 2px !important;
    }
    .blf-broken[href] {
      text-decoration: line-through !important;
      text-decoration-color: #ef4444 !important;
    }
    .blf-tooltip {
      display: none;
      position: absolute;
      bottom: calc(100% + 6px);
      left: 0;
      background: #111827;
      color: #f9fafb;
      border: 1px solid #374151;
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 11px;
      font-family: system-ui, sans-serif;
      white-space: nowrap;
      z-index: 2147483647;
      pointer-events: none;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      max-width: 320px;
    }
    .blf-broken:hover > .blf-tooltip {
      display: block;
    }
    .blf-tip-url { color: #f9fafb; font-weight: 600; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; }
    .blf-tip-meta { color: #9ca3af; font-size: 10px; }
  `;
  document.head.appendChild(style);
}

// ─── Page info ─────────────────────────────────────────────────────────────────
function getPageInfo() {
  return {
    url: window.location.href,
    title: document.title,
    totalLinks: document.querySelectorAll('a[href]').length,
  };
}

// ─── SPA navigation cleanup ────────────────────────────────────────────────────
let lastHref = location.href;
new MutationObserver(() => {
  if (location.href !== lastHref) { lastHref = location.href; clearHighlights(); }
}).observe(document, { subtree: true, childList: true });

window.addEventListener('beforeunload', clearHighlights);