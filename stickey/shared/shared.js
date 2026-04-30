(() => {
  const HAS_DOM = typeof document !== 'undefined' && typeof Node !== 'undefined';
  const BRAND = {
    primary: '#2563EB',
    background: '#FFFFFF',
    text: '#111111',
    subtext: '#6B7280',
    border: '#E5E7EB'
  };

  const STORAGE_KEYS = {
    allAnnotations: 'stickey_allAnnotations', // { [id]: Annotation }
    pageMap: 'stickey_pageMap', // { [pageKey]: string[] }
    settings: 'stickey_settings',
    migrated: 'stickey_migrated_v1'
  };

  function nowIso() {
    return new Date().toISOString();
  }

  function createId(prefix) {
    const rand = Math.random().toString(36).slice(2, 10);
    return `${prefix}_${Date.now()}_${rand}`;
  }

  function normalizePageUrl(url) {
    try {
      const u = new URL(url);
      return `${u.origin}${u.pathname}`;
    } catch {
      return '';
    }
  }

  function getPageKeyFromUrl(url) {
    return normalizePageUrl(url);
  }

  function extractTags(text) {
    const matches = String(text || '').match(/#[a-zA-Z][a-zA-Z0-9_-]*/g) || [];
    return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))];
  }

  function clampNumber(value, min, max) {
    const num = Number(value);
    if (!Number.isFinite(num)) return min;
    return Math.max(min, Math.min(max, num));
  }

  function isEditableTarget(target) {
    if (!HAS_DOM) return false;
    if (!target) return false;
    const el = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
    if (!el) return false;
    if (el.isContentEditable) return true;
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    return tag === 'input' || tag === 'textarea' || tag === 'select';
  }

  function xpathForNode(node) {
    if (!HAS_DOM) return null;
    if (!node) return null;
    const isText = node.nodeType === Node.TEXT_NODE;
    const base = isText ? node.parentNode : node;
    if (!base || base.nodeType !== Node.ELEMENT_NODE) return null;

    const elementPath = () => {
      if (base.id) return `//*[@id="${base.id}"]`;
      const parts = [];
      let cur = base;
      while (cur && cur.nodeType === Node.ELEMENT_NODE) {
        if (cur === document.documentElement) {
          parts.unshift('html[1]');
          break;
        }
        let index = 1;
        let sibling = cur.previousSibling;
        while (sibling) {
          if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === cur.nodeName) index += 1;
          sibling = sibling.previousSibling;
        }
        const tag = cur.nodeName.toLowerCase();
        parts.unshift(`${tag}[${index}]`);
        cur = cur.parentNode;
      }
      return `/${parts.join('/')}`;
    };

    const basePath = elementPath();
    if (!isText) return basePath;

    let textIndex = 1;
    let sib = node.previousSibling;
    while (sib) {
      if (sib.nodeType === Node.TEXT_NODE) textIndex += 1;
      sib = sib.previousSibling;
    }
    return `${basePath}/text()[${textIndex}]`;
  }

  function nodeFromXPath(xpath) {
    if (!HAS_DOM) return null;
    if (!xpath) return null;
    try {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue || null;
    } catch {
      return null;
    }
  }

  const Stickey = (globalThis.Stickey ||= {});
  Stickey.BRAND = BRAND;
  Stickey.KEYS = STORAGE_KEYS;
  Stickey.utils = {
    nowIso,
    createId,
    normalizePageUrl,
    getPageKeyFromUrl,
    extractTags,
    clampNumber,
    isEditableTarget,
    xpathForNode,
    nodeFromXPath
  };
})();
