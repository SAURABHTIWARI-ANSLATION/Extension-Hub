/**
 * PageSpeed Analyzer Pro — DOM Scanner Utilities (utils/domScanner.js)
 *
 * CSP-safe DOM manipulation helpers.
 * RULE: No innerHTML, no eval, no template literals into DOM.
 * All elements created via document.createElement + .textContent / .setAttribute.
 */

'use strict';

// ── Element Factory ──────────────────────────────────────────────────────────

/**
 * Create a DOM element with optional classes, attributes, and text.
 * @param {string} tag
 * @param {object} opts
 * @param {string|string[]} [opts.cls]
 * @param {object}          [opts.attrs]
 * @param {string}          [opts.text]
 * @param {string}          [opts.ariaLabel]
 * @returns {HTMLElement}
 */
export function el(tag, opts = {}) {
  const node = document.createElement(tag);

  if (opts.cls) {
    const classes = Array.isArray(opts.cls) ? opts.cls : [opts.cls];
    node.classList.add(...classes.filter(Boolean));
  }

  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) {
      node.setAttribute(k, v);
    }
  }

  if (opts.text !== undefined) {
    node.textContent = opts.text;
  }

  if (opts.ariaLabel) {
    node.setAttribute('aria-label', opts.ariaLabel);
  }

  return node;
}

/** Append multiple children to a parent node */
export function appendAll(parent, ...children) {
  for (const child of children) {
    if (child) parent.appendChild(child);
  }
  return parent;
}

/** Remove all children from a node */
export function clearNode(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

// ── Score Gauge (SVG) ────────────────────────────────────────────────────────

/**
 * Builds an SVG gauge for the overall performance score.
 * Fully DOM-constructed, no innerHTML.
 * @param {number|null} score  0–100
 * @param {string} color
 * @returns {SVGSVGElement}
 */
export function buildScoreGauge(score, color) {
  const ns  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 120 120');
  svg.setAttribute('width',   '120');
  svg.setAttribute('height',  '120');
  svg.setAttribute('role',    'img');
  svg.setAttribute('aria-label', `Performance score: ${score ?? 'unknown'}`);

  const cx = 60, cy = 60, r = 50;
  const strokeWidth = 10;

  // Background track
  const track = document.createElementNS(ns, 'circle');
  track.setAttribute('cx',           String(cx));
  track.setAttribute('cy',           String(cy));
  track.setAttribute('r',            String(r));
  track.setAttribute('fill',         'none');
  track.setAttribute('stroke',       'var(--clr-border)');
  track.setAttribute('stroke-width', String(strokeWidth));
  svg.appendChild(track);

  // Score arc
  if (score !== null && score !== undefined) {
    const pct          = Math.min(100, Math.max(0, score)) / 100;
    const circumference = 2 * Math.PI * r;
    const dash          = pct * circumference;
    const gap           = circumference - dash;

    const arc = document.createElementNS(ns, 'circle');
    arc.setAttribute('cx',                String(cx));
    arc.setAttribute('cy',                String(cy));
    arc.setAttribute('r',                 String(r));
    arc.setAttribute('fill',              'none');
    arc.setAttribute('stroke',            color);
    arc.setAttribute('stroke-width',      String(strokeWidth));
    arc.setAttribute('stroke-linecap',    'round');
    arc.setAttribute('stroke-dasharray',  `${dash} ${gap}`);
    arc.setAttribute('stroke-dashoffset', String(circumference * 0.25)); // Start from top
    arc.setAttribute('transform',         `rotate(-90 ${cx} ${cy})`);
    svg.appendChild(arc);
  }

  // Score text
  const text = document.createElementNS(ns, 'text');
  text.setAttribute('x',            String(cx));
  text.setAttribute('y',            String(cy + 8));
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill',         'var(--clr-text-primary)');
  text.setAttribute('font-size',    '28');
  text.setAttribute('font-weight',  '700');
  text.setAttribute('font-family',  'Manrope, sans-serif');
  text.textContent = score !== null ? String(Math.round(score)) : '—';
  svg.appendChild(text);

  return svg;
}

// ── Metric Card ──────────────────────────────────────────────────────────────

/**
 * Builds a metric card element.
 * @param {string} label
 * @param {string} value    Formatted value string
 * @param {string} rating   'good' | 'average' | 'poor' | 'unknown'
 * @param {string} abbr
 * @returns {HTMLElement}
 */
export function buildMetricCard(label, value, rating, abbr) {
  const card = el('div', { cls: ['metric-card', `metric-card--${rating}`] });

  const header = el('div', { cls: 'metric-card__header' });
  const abbrev = el('span', { cls: 'metric-card__abbr', text: abbr });
  const dot    = el('span', { cls: ['metric-dot', `metric-dot--${rating}`] });
  appendAll(header, abbrev, dot);

  const val   = el('div', { cls: 'metric-card__value', text: value });
  const lbl   = el('div', { cls: 'metric-card__label', text: label });

  appendAll(card, header, val, lbl);
  return card;
}

// ── Suggestion Item ──────────────────────────────────────────────────────────

/**
 * Builds a collapsible suggestion row.
 * @param {object} s  Suggestion object
 * @returns {HTMLElement}
 */
export function buildSuggestionItem(s) {
  const item = el('div', { cls: ['suggestion', `suggestion--${s.impact}`, `suggestion--${s.category}`] });

  const header = el('div', { cls: 'suggestion__header' });

  const badge = el('span', {
    cls:  ['impact-badge', `impact-badge--${s.impact}`],
    text: s.impact.toUpperCase(),
  });
  const title = el('span', { cls: 'suggestion__title', text: s.title });
  const arrow = el('span', { cls: 'suggestion__arrow', text: '›' });

  appendAll(header, badge, title, arrow);

  const body = el('div', { cls: 'suggestion__body' });
  const desc = el('p', { cls: 'suggestion__desc', text: s.description });
  body.appendChild(desc);

  if (s.fix) {
    const fixLabel = el('div', { cls: 'suggestion__fix-label', text: 'How to fix' });
    const fixText  = el('pre', { cls: 'suggestion__fix', text: s.fix });
    appendAll(body, fixLabel, fixText);
  }

  // Toggle expand on click
  let expanded = false;
  header.addEventListener('click', () => {
    expanded = !expanded;
    body.classList.toggle('suggestion__body--open', expanded);
    arrow.textContent = expanded ? '⌄' : '›';
  });

  appendAll(item, header, body);
  return item;
}

// ── Resource Row ─────────────────────────────────────────────────────────────

/**
 * Builds a resource list row.
 * @param {object} r  Resource entry
 * @param {Function} formatBytes
 * @param {Function} formatMs
 * @returns {HTMLElement}
 */
export function buildResourceRow(r, formatBytes, formatMs) {
  const row = el('div', { cls: ['resource-row', r.renderBlocking ? 'resource-row--blocking' : ''] });

  // Truncate long URLs for display
  const urlText = r.url.length > 60 ? '…' + r.url.slice(-57) : r.url;

  const name = el('span', {
    cls:   'resource-row__name',
    text:  urlText,
    attrs: { title: r.url },
  });

  const size = el('span', {
    cls:  'resource-row__size',
    text: formatBytes(r.decodedSize || r.transferSize),
  });

  const dur = el('span', {
    cls:  'resource-row__dur',
    text: formatMs(r.durationMs),
  });

  appendAll(row, name, size, dur);

  if (r.renderBlocking) {
    const tag = el('span', { cls: 'resource-row__blocking', text: 'blocking' });
    row.appendChild(tag);
  }

  return row;
}

// ── Tab Navigation ───────────────────────────────────────────────────────────

/**
 * Wires up tab buttons to show/hide panels.
 * @param {NodeList|HTMLElement[]} buttons
 * @param {NodeList|HTMLElement[]} panels
 */
export function wireTabNav(buttons, panels) {
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      buttons.forEach((b) => b.classList.remove('tab-btn--active'));
      panels.forEach((p) => p.classList.remove('tab-panel--active'));

      btn.classList.add('tab-btn--active');
      const panel = document.getElementById(`panel-${target}`);
      if (panel) panel.classList.add('tab-panel--active');
    });
  });
}
