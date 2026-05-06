/**
 * PageSpeed Analyzer Pro — DOM Scanner Utilities (utils/domScanner.js) v1.1.0
 */

'use strict';

// ── Element Factory ───────────────────────────────────────────────────────────

/**
 * Create a DOM element with optional classes, attributes, and text.
 *
 * @param {string} tag
 * @param {object} [opts]
 * @param {string|string[]} [opts.cls]
 * @param {Record<string,string>} [opts.attrs]
 * @param {string} [opts.text]
 * @param {string} [opts.ariaLabel]
 * @param {string} [opts.title]
 * @returns {HTMLElement}
 */
export function el(tag, opts = {}) {
  const node = document.createElement(tag);

  if (opts.cls) {
    const raw = Array.isArray(opts.cls) ? opts.cls : [opts.cls];
    const tokens = raw
      .flatMap((c) => String(c).split(/\s+/g))
      .map((c) => c.trim())
      .filter(Boolean);
    if (tokens.length) node.classList.add(...tokens);
  }

  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) {
      node.setAttribute(k, String(v));
    }
  }

  if (opts.text !== undefined) {
    node.textContent = opts.text;
  }

  if (opts.ariaLabel) {
    node.setAttribute('aria-label', opts.ariaLabel);
  }

  if (opts.title) {
    node.setAttribute('title', opts.title);
  }

  return node;
}

/**
 * Create an SVG element in the SVG namespace.
 * @param {string} tag
 * @param {Record<string,string>} [attrs]
 * @returns {SVGElement}
 */
export function svgEl(tag, attrs = {}) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) {
    node.setAttribute(k, String(v));
  }
  return node;
}

/** Append multiple children to a parent node in a single pass. */
export function appendAll(parent, ...children) {
  for (const child of children) {
    if (child != null) parent.appendChild(child);
  }
  return parent;
}

/** Remove all children from a node (faster than innerHTML = ''). */
export function clearNode(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

// ── Score Gauge (SVG) ─────────────────────────────────────────────────────────

/**
 * Builds an animated SVG gauge for the overall performance score.
 *
 * BUG FIX: The arc now uses ONLY stroke-dashoffset to position the start at
 * 12 o'clock. The previous version also had a rotate(-90°) transform which
 * shifted the arc an additional 90°, making it start from 9 o'clock (left).
 *
 * How it works:
 *  - SVG strokes are drawn clockwise starting at 3 o'clock (right).
 *  - stroke-dasharray: [visible, hidden] draws a `visible`-length arc segment.
 *  - stroke-dashoffset = C × 0.25 shifts the pattern backward by ¼ circumference,
 *    moving the start point from 3 o'clock → 12 o'clock (top). No transform needed.
 *
 * @param {number|null} score  0–100 performance score
 * @param {string}      color  Stroke colour hex
 * @returns {SVGSVGElement}
 */
export function buildScoreGauge(score, color) {
  const cx = 60, cy = 60, r = 48;
  const strokeWidth   = 9;
  const circumference = 2 * Math.PI * r;   // ≈ 301.6

  const svg = svgEl('svg', {
    viewBox:    '0 0 120 120',
    width:      '120',
    height:     '120',
    role:       'img',
    'aria-label': `Performance score: ${score ?? 'unknown'}`,
  });

  // ── Background track (full circle) ─────────────────────────────────────
  svg.appendChild(svgEl('circle', {
    cx:            String(cx),
    cy:            String(cy),
    r:             String(r),
    fill:          'none',
    stroke:        'var(--clr-border)',
    'stroke-width': String(strokeWidth),
  }));

  // ── Score arc ───────────────────────────────────────────────────────────
  if (score !== null && score !== undefined) {
    const pct  = Math.min(100, Math.max(0, score)) / 100;
    const dash = pct * circumference;
    const gap  = circumference - dash;

    // FIX: Only dashoffset to place start at top. No transform attribute.
    svg.appendChild(svgEl('circle', {
      cx:                   String(cx),
      cy:                   String(cy),
      r:                    String(r),
      fill:                 'none',
      stroke:               color,
      'stroke-width':       String(strokeWidth),
      'stroke-linecap':     'round',
      'stroke-dasharray':   `${dash.toFixed(2)} ${gap.toFixed(2)}`,
      'stroke-dashoffset':  String((circumference * 0.25).toFixed(2)),
      // NO transform here — that was the bug
    }));
  }

  // ── Score text ──────────────────────────────────────────────────────────
  svg.appendChild(svgEl('text', {
    x:              String(cx),
    y:              String(cy + 8),
    'text-anchor':  'middle',
    fill:           'var(--clr-text-primary)',
    'font-size':    '26',
    'font-weight':  '700',
    'font-family':  'Manrope, system-ui, sans-serif',
  }));

  // Set textContent via the DOM (not setAttribute — text nodes belong on <text>)
  svg.querySelector('text').textContent =
    score !== null && score !== undefined ? String(Math.round(score)) : '—';

  return svg;
}

// ── Mini Score Bar (for history comparison) ───────────────────────────────────

/**
 * Builds a compact horizontal score bar for history rows.
 * @param {number|null} score  0–100
 * @param {string}      color  Bar fill colour
 * @returns {HTMLElement}
 */
export function buildScoreBar(score, color) {
  const wrap = el('div', { cls: 'score-bar' });
  const fill = el('div', { cls: 'score-bar__fill' });
  const pct  = score !== null ? `${Math.min(100, Math.max(0, score))}%` : '0%';
  fill.style.width      = pct;
  fill.style.background = color;
  wrap.appendChild(fill);
  return wrap;
}

// ── Metric Card ───────────────────────────────────────────────────────────────

/**
 * Builds a metric card element with rating colour coding.
 *
 * @param {string} label    Human-readable metric name
 * @param {string} value    Formatted value string
 * @param {string} rating   'good' | 'average' | 'poor' | 'unknown'
 * @param {string} abbr     Short abbreviation (FCP, LCP, etc.)
 * @param {string} [desc]   Optional tooltip description
 * @returns {HTMLElement}
 */
export function buildMetricCard(label, value, rating, abbr, desc) {
  const card = el('div', {
    cls:   ['metric-card', `metric-card--${rating}`],
    attrs: { role: 'listitem' },
    title: desc || label,
  });

  const header = el('div', { cls: 'metric-card__header' });
  const abbrev = el('span', { cls: 'metric-card__abbr', text: abbr });
  const dot    = el('span', { cls: ['metric-dot', `metric-dot--${rating}`] });
  appendAll(header, abbrev, dot);

  const val = el('div', { cls: 'metric-card__value', text: value });
  const lbl = el('div', { cls: 'metric-card__label', text: label });

  appendAll(card, header, val, lbl);
  return card;
}

// ── Suggestion Item ───────────────────────────────────────────────────────────

/**
 * Builds a collapsible, accessible suggestion row.
 *
 * @param {object} s  Suggestion { id, category, impact, title, description, fix }
 * @returns {HTMLElement}
 */
export function buildSuggestionItem(s) {
  const itemId = `suggestion-body-${s.id}`;

  const item = el('div', {
    cls:   ['suggestion', `suggestion--${s.impact}`, `suggestion--${s.category}`],
    attrs: { role: 'listitem' },
  });

  // ── Header (always visible, acts as button) ─────────────────────────────
  const header = el('div', {
    cls:   'suggestion__header',
    attrs: {
      role:            'button',
      tabindex:        '0',
      'aria-expanded': 'false',
      'aria-controls': itemId,
    },
  });

  const catIcon = el('span', {
    cls:  'suggestion__cat-icon',
    text: _catIcon(s.category),
    attrs: { 'aria-hidden': 'true' },
  });

  const badge = el('span', {
    cls:  ['impact-badge', `impact-badge--${s.impact}`],
    text: s.impact.toUpperCase(),
  });

  const title = el('span', { cls: 'suggestion__title', text: s.title });

  const arrow = el('span', {
    cls:  'suggestion__arrow',
    text: '›',
    attrs: { 'aria-hidden': 'true' },
  });

  appendAll(header, catIcon, badge, title, arrow);

  // ── Body (expandable) ───────────────────────────────────────────────────
  const body = el('div', {
    cls:   'suggestion__body',
    attrs: { id: itemId, role: 'region', hidden: '' },
  });

  const desc = el('p', { cls: 'suggestion__desc', text: s.description });
  body.appendChild(desc);

  if (s.fix) {
    const fixLabel = el('div', { cls: 'suggestion__fix-label', text: 'How to fix' });
    const fixPre   = el('pre', { cls: 'suggestion__fix', text: s.fix });
    appendAll(body, fixLabel, fixPre);
  }

  // ── Expand/collapse toggle ──────────────────────────────────────────────
  let expanded = false;
  const toggle = () => {
    expanded = !expanded;
    if (expanded) {
      body.removeAttribute('hidden');
    } else {
      body.setAttribute('hidden', '');
    }
    header.setAttribute('aria-expanded', String(expanded));
    arrow.textContent = expanded ? '⌄' : '›';
  };

  header.addEventListener('click', toggle);
  header.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });

  appendAll(item, header, body);
  return item;
}

function _catIcon(category) {
  const icons = {
    performance:      'PERF',
    images:           'IMG',
    network:          'NET',
    seo:              'SEO',
    security:         'SEC',
    accessibility:    'A11Y',
    'best-practices': 'BEST',
  };
  return icons[category] ?? 'NOTE';
}

// ── Resource Row ──────────────────────────────────────────────────────────────

/**
 * Builds a resource list row (name, size, load time, blocking badge).
 *
 * @param {object}   r            Resource entry
 * @param {Function} formatBytes  Byte formatter
 * @param {Function} formatMs     Duration formatter
 * @returns {HTMLElement}
 */
export function buildResourceRow(r, formatBytes, formatMs) {
  const row = el('div', {
    cls:   ['resource-row', r.renderBlocking ? 'resource-row--blocking' : '', r.cached ? 'resource-row--cached' : ''],
    attrs: { role: 'listitem' },
  });

  const urlText = r.url.length > 58 ? '…' + r.url.slice(-55) : r.url;

  const name = el('span', {
    cls:   'resource-row__name',
    text:  urlText,
    title: r.url,
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
    row.appendChild(el('span', { cls: 'resource-row__tag resource-row__tag--blocking', text: 'blocking' }));
  }
  if (r.cached) {
    row.appendChild(el('span', { cls: 'resource-row__tag resource-row__tag--cached', text: 'cached' }));
  }

  return row;
}

// ── Network Timing Row ────────────────────────────────────────────────────────

/**
 * Builds a single network timing metric row.
 * @param {string} label
 * @param {number|string} value
 * @returns {HTMLElement}
 */
export function buildNetworkRow(label, value) {
  const row  = el('div', { cls: 'network-row' });
  const lbl  = el('span', { cls: 'network-row__label', text: label });
  const val  = el('span', { cls: 'network-row__value', text: String(value) });
  appendAll(row, lbl, val);
  return row;
}

// ── Tab Navigation ────────────────────────────────────────────────────────────

/**
 * Wires up tab buttons to show/hide associated panels.
 * Follows WAI-ARIA Tabs pattern.
 *
 * @param {NodeList|HTMLElement[]} buttons  Elements with data-tab attribute
 * @param {NodeList|HTMLElement[]} panels   Panel elements with id="panel-{tab}"
 */
export function wireTabNav(buttons, panels) {
  const btnArray   = Array.from(buttons);
  const panelArray = Array.from(panels);

  btnArray.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      btnArray.forEach((b) => {
        b.classList.remove('tab-btn--active');
        b.setAttribute('aria-selected', 'false');
      });
      panelArray.forEach((p) => p.classList.remove('tab-panel--active'));

      btn.classList.add('tab-btn--active');
      btn.setAttribute('aria-selected', 'true');

      const panel = document.getElementById(`panel-${target}`);
      if (panel) panel.classList.add('tab-panel--active');
    });

    // Keyboard navigation (← →)
    btn.addEventListener('keydown', (e) => {
      const idx = btnArray.indexOf(btn);
      if (e.key === 'ArrowRight' && idx < btnArray.length - 1) {
        btnArray[idx + 1].focus();
        btnArray[idx + 1].click();
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        btnArray[idx - 1].focus();
        btnArray[idx - 1].click();
      }
    });
  });
}
