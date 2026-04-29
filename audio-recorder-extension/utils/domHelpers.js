// utils/domHelpers.js — Safe DOM manipulation helpers. No innerHTML, no eval.
/* global var */ var DOMHelpers = {
  /** Remove all child nodes from an element */
  clearElement(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  },

  /** Show an element (removes 'hidden' class and inline display:none) */
  show(el) {
    if (!el) return;
    el.classList.remove('hidden');
    el.style.display = '';
  },

  /** Hide an element (adds 'hidden' class and sets display:none) */
  hide(el) {
    if (!el) return;
    el.classList.add('hidden');
    el.style.display = 'none';
  },

  /**
   * Create a text node and append it to parent.
   * @param {Element} parent
   * @param {string}  tag
   * @param {string}  [text]
   * @param {string}  [className]
   * @returns {Element}
   */
  appendEl(parent, tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    parent.appendChild(node);
    return node;
  }
};