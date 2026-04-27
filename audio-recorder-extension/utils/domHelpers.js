// utils/domHelpers.js — NO innerHTML
var DOMHelpers = {
  clearElement(el) {
    while (el && el.firstChild) el.removeChild(el.firstChild);
  },
  show(el) {
    if (!el) return;
    el.classList.remove('hidden');
    el.style.display = '';
  },
  hide(el) {
    if (!el) return;
    el.classList.add('hidden');
    el.style.display = 'none';
  }
};
