/**
 * domHelpers.js
*/
export function el(tag, { cls, text, attrs, style } = {}) {
  const node = document.createElement(tag);
  if (cls) {
    (Array.isArray(cls) ? cls : [cls]).forEach(c => c && node.classList.add(c));
  }
  if (text !== undefined) node.textContent = text;
  if (attrs) Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (style) Object.assign(node.style, style);
  return node;
}

/**
 * Append multiple children to a parent. Accepts nested arrays.
 */
export function append(parent, ...children) {
  children.flat(Infinity).filter(Boolean).forEach(c => parent.appendChild(c));
  return parent;
}

/**
 * Remove all children from a node.
 */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/**
 * Show or hide a node via display style.
 */
export function setVisible(node, visible, displayType = 'block') {
  node.style.display = visible ? displayType : 'none';
}

/**
 * Create a text node (CSP-safe alternative to textContent for inline mixing).
 */
export function txt(str) {
  return document.createTextNode(str);
}

/**
 * Debounce: returns a function that delays fn by ms after last call.
 */
export function debounce(fn, ms) {
  let timer;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}
