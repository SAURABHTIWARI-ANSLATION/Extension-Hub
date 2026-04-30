/* global Stickey */

(() => {
  // ─── Safe element builder (no innerHTML, CSP-safe) ─────────────
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (k === 'class') node.className = String(v);
      else if (k === 'text') node.textContent = String(v);
      else if (k === 'dataset' && v && typeof v === 'object') {
        Object.entries(v).forEach(([dk, dv]) => {
          if (dv === undefined || dv === null) return;
          node.dataset[dk] = String(dv);
        });
      } else if (k.startsWith('on') && typeof v === 'function') {
        node.addEventListener(k.slice(2), v);
      } else {
        node.setAttribute(k, String(v));
      }
    });
    children.forEach((c) => { if (c) node.appendChild(c); });
    return node;
  }

  // ─── SVG Icons — all CSP-safe, no innerHTML ────────────────────
  function svgIcon(name, opts = {}) {
    const ns = 'http://www.w3.org/2000/svg';
    const size = opts.size || 16;
    const sw = opts.strokeWidth || 1.6;

    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', String(sw));
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');

    const p = (d) => {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      svg.appendChild(path);
    };
    const line = (x1, y1, x2, y2) => {
      const l = document.createElementNS(ns, 'line');
      l.setAttribute('x1', x1); l.setAttribute('y1', y1);
      l.setAttribute('x2', x2); l.setAttribute('y2', y2);
      svg.appendChild(l);
    };
    const rect = (x, y, w, h, rx = 0) => {
      const r = document.createElementNS(ns, 'rect');
      r.setAttribute('x', x); r.setAttribute('y', y);
      r.setAttribute('width', w); r.setAttribute('height', h);
      if (rx) r.setAttribute('rx', rx);
      svg.appendChild(r);
    };
    const circle = (cx, cy, r) => {
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
      svg.appendChild(c);
    };

    switch (name) {
      case 'panel':
        rect(2, 2, 12, 12, 2);
        line(2, 6, 14, 6);
        break;
      case 'note':
        rect(4, 2, 8, 12, 1.5);
        line(6, 5.5, 10, 5.5);
        line(6, 8, 9, 8);
        break;
      case 'close':
        p('M4 4l8 8 M12 4L4 12');
        break;
      case 'link':
        p('M6.5 8a1.5 1.5 0 0 1 1.5-1.5H11a1.5 1.5 0 0 1 0 3H8A1.5 1.5 0 0 1 6.5 8z');
        p('M9.5 8a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1 0-3h3A1.5 1.5 0 0 1 9.5 8z');
        break;
      case 'highlight':
        p('M4 12l2-2 6-6 2 2-6 6-2 2-2-2z');
        line(9, 3, 13, 7);
        line(4, 12, 4, 14);
        break;
      case 'add':
        line(8, 3, 8, 13);
        line(3, 8, 13, 8);
        break;
      case 'graph':
        circle(4, 8, 2);
        circle(12, 4, 2);
        circle(12, 12, 2);
        line('5.8', '7.1', '10.2', '4.9');
        line('5.8', '8.9', '10.2', '11.1');
        break;
      case 'trash':
        p('M3 5h10M5 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M7 8v4M9 8v4');
        rect(4, 5, 8, 8, 1);
        break;
      case 'convert':
        p('M4 4h5l3 3v5H4z');
        p('M9 4v3h3');
        break;
      default:
        // Fallback: plus icon
        line(8, 3, 8, 13);
        line(3, 8, 13, 8);
    }

    return svg;
  }

  Stickey.dom = { el, svgIcon };
})();
