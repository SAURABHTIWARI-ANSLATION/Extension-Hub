'use strict';

// ── DOM Helpers ───────────────────────────────────────────────────────────────
// CSP-safe DOM creation. Zero innerHTML, zero eval.

const DOM = (() => {

  const svgNS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs = {}, children = []) {
    const elem = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class')       elem.className = v;
      else if (k === 'text')   elem.textContent = v;
      else if (k === 'for')    elem.htmlFor = v;
      else                     elem.setAttribute(k, v);
    }
    for (const child of children) {
      if (child) elem.appendChild(child);
    }
    return elem;
  }

  function svgEl(tag, attrs = {}) {
    const elem = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      elem.setAttribute(k, v);
    }
    return elem;
  }

  function makeSvg(w, h, children = []) {
    const svg = svgEl('svg', {
      viewBox: `0 0 ${w} ${h}`,
      fill: 'currentColor',
      width: w,
      height: h,
      xmlns: svgNS,
    });
    for (const c of children) svg.appendChild(c);
    return svg;
  }

  function makePlayIcon() {
    const poly = svgEl('polygon', { points: '4,2 14,8 4,14' });
    return makeSvg(18, 16, [poly]);
  }

  function makePauseIcon() {
    const r1 = svgEl('rect', { x: '2', y: '2', width: '5', height: '12', rx: '1.5' });
    const r2 = svgEl('rect', { x: '11', y: '2', width: '5', height: '12', rx: '1.5' });
    return makeSvg(18, 16, [r1, r2]);
  }

  function get(id) {
    return document.getElementById(id);
  }

  function setText(id, text) {
    const elem = get(id);
    if (elem) elem.textContent = text;
  }

  function setAttr(id, attr, value) {
    const elem = get(id);
    if (elem) elem.setAttribute(attr, value);
  }

  function replaceChildren(elem, ...children) {
    // Use native replaceChildren if available, otherwise manual clear
    if (elem.replaceChildren) {
      elem.replaceChildren(...children);
    } else {
      while (elem.firstChild) elem.removeChild(elem.firstChild);
      for (const c of children) elem.appendChild(c);
    }
  }

  return { el, svgEl, makeSvg, makePlayIcon, makePauseIcon, get, setText, setAttr, replaceChildren };
})();
