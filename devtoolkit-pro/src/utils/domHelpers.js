// domHelpers.js — CSP-safe DOM utilities (no innerHTML, no eval)

export function createElement(tag, options = {}) {
  const el = document.createElement(tag);
  if (options.classes) el.classList.add(...options.classes);
  if (options.text) el.textContent = options.text;
  if (options.attrs) {
    for (const [key, val] of Object.entries(options.attrs)) {
      el.setAttribute(key, val);
    }
  }
  if (options.style) Object.assign(el.style, options.style);
  if (options.children) options.children.forEach(c => el.appendChild(c));
  return el;
}

export function injectStyle(id, css) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

export function removeStyle(id) {
  document.getElementById(id)?.remove();
}

export function createOverlayBadge(text, options = {}) {
  const badge = document.createElement('span');
  badge.textContent = text;
  Object.assign(badge.style, {
    position: 'absolute',
    fontSize: '10px',
    fontFamily: 'monospace',
    padding: '1px 5px',
    borderRadius: '2px',
    zIndex: '2147483646',
    pointerEvents: 'none',
    ...options.style
  });
  return badge;
}
