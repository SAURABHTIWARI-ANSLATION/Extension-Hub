/**
 * ui/popup.js — CSS Specificity Calculator v2.1
 */

import { calculate, compare }         from '../services/specificityService.js';
import { el, append, clear, setVisible, debounce } from '../utils/domHelpers.js';
import { getTheme, setTheme, getHistory, addToHistory } from '../services/storageService.js';

// ── DOM cache ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// Inputs
const sel1  = $('selector1');
const sel2  = $('selector2');
const badge1 = $('badge1');
const badge2 = $('badge2');
const error1 = $('error1');
const error2 = $('error2');

// Buttons
const calcBtn   = $('calculateBtn');
const clearBtn  = $('clearBtn');
const exampBtn  = $('exampleBtn');
const copyBtn   = $('copyResultsBtn');
const copyText  = $('copyBtnText');          // BUG FIX #4: separate text span
const themeBtn  = $('themeToggleBtn');
const infoBtn   = $('infoBtn');
const closeInfo = $('closeInfoBtn');
const guideBtn  = $('toggleGuideBtn');
const whyToggle = $('whyToggle');

// Sections
const resultsSection = $('resultsSection');
const compBlock      = $('comparisonBlock');
const guideBody      = $('guideBody');
const infoModal      = $('infoModal');
const historyDrop    = $('historyDropdown');
const appMain        = document.querySelector('.app-main'); // BUG FIX #12

// Result 1
const r1Sel   = $('result1Selector');
const r1Tuple = $('result1Tuple');
const hints1  = $('hints1');
const bar1    = $('bar1');
const vals1   = $('values1');
const det1    = $('details1');
const result1 = $('result1');

// Result 2
const r2Sel   = $('result2Selector');
const r2Tuple = $('result2Tuple');
const hints2  = $('hints2');
const bar2    = $('bar2');
const vals2   = $('values2');
const det2    = $('details2');
const result2 = $('result2');

// Winner
const winnerBanner = $('winnerBanner');
const winnerLabel  = $('winnerLabel');
const winnerDetail = $('winnerDetail');
const winnerIcon   = $('winnerIcon');
const whyBody      = $('whyBody');

// Status
const statusDot  = $('statusDot');
const statusText = $('statusText');

// ── State ──────────────────────────────────────────────────────
let currentResults = null;
let guideOpen      = false;
let whyOpen        = false;
let statusTimer    = null;

// ── Boot ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Theme
  const theme = await getTheme();
  applyTheme(theme);

  // Wire events
  themeBtn.addEventListener('click', toggleTheme);

  infoBtn.addEventListener('click',   () => setVisible(infoModal, true, 'flex'));
  closeInfo.addEventListener('click', () => setVisible(infoModal, false));
  infoModal.addEventListener('click', e => { if (e.target === infoModal) setVisible(infoModal, false); });

  calcBtn.addEventListener('click', runCalculate);
  clearBtn.addEventListener('click', clearAll);
  exampBtn.addEventListener('click', loadExample);
  copyBtn.addEventListener('click', copyResults);

  guideBtn.addEventListener('click', toggleGuide);
  whyToggle.addEventListener('click', toggleWhy);   // BUG FIX #3

  // Live debounced calculation
  const debouncedCalc = debounce(runCalculate, 320);
  sel1.addEventListener('input', () => { updateBadge(sel1, badge1, error1); debouncedCalc(); });
  sel2.addEventListener('input', () => { updateBadge(sel2, badge2, error2); debouncedCalc(); });

  sel1.addEventListener('keydown', e => { if (e.key === 'Enter') runCalculate(); });
  sel2.addEventListener('keydown', e => { if (e.key === 'Enter') runCalculate(); });

  // History
  sel1.addEventListener('focus', () => openHistory(sel1));
  sel2.addEventListener('focus', () => openHistory(sel2));
  document.addEventListener('click', e => {
    if (!historyDrop.contains(e.target) && e.target !== sel1 && e.target !== sel2) {
      setVisible(historyDrop, false);
    }
  });

  setStatus('ready', 'Ready — enter a CSS selector');
}

// ── Theme ──────────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

async function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  await setTheme(next);
}

// ── History Dropdown ───────────────────────────────────────────
// BUG FIX #2 & #12: positioned relative to appMain, outside any overflow:hidden card
async function openHistory(inputEl) {
  const history = await getHistory();
  if (!history.length) { setVisible(historyDrop, false); return; }

  clear(historyDrop);

  // Header row
  const hdr = el('div', { cls: 'history-header', text: 'Recent' });
  historyDrop.appendChild(hdr);

  history.forEach(sel => {
    const row  = el('div', { cls: 'history-item' });
    row.setAttribute('role', 'option');
    row.setAttribute('tabindex', '0');

    // Clock icon (CSP-safe SVG via DOM, no data: URL)
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '11');
    svg.setAttribute('height', '11');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.classList.add('history-item-icon');

    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', '12'); circle.setAttribute('cy', '12'); circle.setAttribute('r', '10');
    const poly = document.createElementNS(ns, 'polyline');
    poly.setAttribute('points', '12 6 12 12 16 14');
    svg.appendChild(circle); svg.appendChild(poly);

    const txt = el('span', { text: sel });
    append(row, svg, txt);

    const choose = e => {
      e.preventDefault();
      inputEl.value = sel;
      updateBadge(inputEl, inputEl === sel1 ? badge1 : badge2, inputEl === sel1 ? error1 : error2);
      setVisible(historyDrop, false);
      runCalculate();
    };
    row.addEventListener('mousedown', choose);
    row.addEventListener('keydown', e => { if (e.key === 'Enter') choose(e); });
    historyDrop.appendChild(row);
  });

  // Position relative to appMain using input's bounding rect
  const inputRect  = inputEl.getBoundingClientRect();
  const mainRect   = appMain.getBoundingClientRect();
  historyDrop.style.top  = (inputRect.bottom - mainRect.top + appMain.scrollTop + 3) + 'px';
  setVisible(historyDrop, true);
}

// ── Live Badge ─────────────────────────────────────────────────
function updateBadge(inputEl, badgeEl, errorEl) {
  const val = inputEl.value.trim();
  errorEl.textContent = '';
  inputEl.classList.remove('is-error');
  badgeEl.classList.remove('visible');

  if (!val) return;

  try {
    const { specificity: [a, b, c, d] } = calculate(val);
    badgeEl.textContent = `(${a},${b},${c},${d})`;
    badgeEl.classList.add('visible');
  } catch (e) {
    inputEl.classList.add('is-error');
    errorEl.textContent = e.message;
  }
}

// ── Calculate ──────────────────────────────────────────────────
function runCalculate() {
  const s1 = sel1.value.trim();
  const s2 = sel2.value.trim();

  if (!s1) {
    setVisible(resultsSection, false);
    if (s2) setStatus('error', 'Fill Selector 1 first');
    return;
  }

  let spec1, spec2, hasError = false;

  try {
    spec1 = calculate(s1);
    error1.textContent = '';
    sel1.classList.remove('is-error');
  } catch (e) {
    sel1.classList.add('is-error');
    error1.textContent = e.message;
    setStatus('error', e.message);
    setVisible(resultsSection, false);
    hasError = true;
  }

  if (s2) {
    try {
      spec2 = calculate(s2);
      error2.textContent = '';
      sel2.classList.remove('is-error');
    } catch (e) {
      sel2.classList.add('is-error');
      error2.textContent = e.message;
      setStatus('error', e.message);
      hasError = true;
    }
  }

  if (hasError) return;

  currentResults = { spec1, spec2: spec2 || null };
  if (s1) addToHistory(s1);
  if (s2) addToHistory(s2);

  renderAll(spec1, spec2 || null);
  setStatus('success', spec2 ? 'Comparison complete' : 'Specificity calculated');
}

// ── Render ─────────────────────────────────────────────────────
function renderAll(spec1, spec2) {
  setVisible(resultsSection, true);

  // BUG FIX #8: control borders explicitly
  renderCard(spec1, { selEl: r1Sel, tupleEl: r1Tuple, hintsEl: hints1, barEl: bar1, valsEl: vals1, detEl: det1 });

  if (spec2) {
    setVisible(compBlock, true);
    renderCard(spec2, { selEl: r2Sel, tupleEl: r2Tuple, hintsEl: hints2, barEl: bar2, valsEl: vals2, detEl: det2 });

    const cmp = compare(spec1, spec2);
    applyWinnerState(cmp);
    renderWinnerBanner(cmp);
    // result1 has border-bottom since comparison is below it
    result1.classList.remove('no-border');
    result2.classList.add('no-border'); // last result before winner banner
  } else {
    setVisible(compBlock, false);
    result1.classList.add('no-border');  // only card, no border needed
    result1.classList.remove('is-winner', 'is-loser', 'is-draw');
  }

  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderCard(spec, { selEl, tupleEl, hintsEl, barEl, valsEl, detEl }) {
  const [a, b, c, d] = spec.specificity;

  selEl.textContent   = spec.selector;
  tupleEl.textContent = `(${a},${b},${c},${d})`;

  // Hints
  clear(hintsEl);
  spec.hints.forEach(({ type, label, detail }) => {
    const chip = el('span', { cls: ['hint-chip', type], text: label });
    chip.setAttribute('title', detail);
    hintsEl.appendChild(chip);
  });

  renderBar(barEl, spec.specificity);
  renderValues(valsEl, spec.specificity);
  renderBreakdown(detEl, spec);
}

// BUG FIX #6 & #15: bar with zero state + values always aligned to 4 boxes
function renderBar(container, [a, b, c, d]) {
  clear(container);
  const total = a + b + c + d;

  if (total === 0) {
    container.classList.add('is-zero');
    return;
  }
  container.classList.remove('is-zero');

  const segments = [
    { val: a, color: 'var(--color-inline)',  label: 'I'  },
    { val: b, color: 'var(--color-id)',      label: 'ID' },
    { val: c, color: 'var(--color-class)',   label: 'C'  },
    { val: d, color: 'var(--color-element)', label: 'E'  },
  ];

  segments.forEach(({ val, color, label }) => {
    if (val <= 0) return;
    const pct = Math.max((val / total) * 100, 7);
    const seg = el('div', { cls: 'spec-segment', text: label, style: { background: color, width: `${pct}%` } });
    container.appendChild(seg);
  });
}

// 4 boxes always shown (zero shows as "0" in that box)
function renderValues(container, [a, b, c, d]) {
  clear(container);
  const COLORS = ['var(--color-inline)', 'var(--color-id)', 'var(--color-class)', 'var(--color-element)'];
  const LABELS = ['Inline', 'IDs', 'Classes', 'Elements'];

  [a, b, c, d].forEach((val, i) => {
    const box = el('div', { cls: 'spec-val-box' });
    const num = el('span', { cls: 'spec-val-num', text: String(val), style: { color: COLORS[i] } });
    const lbl = el('span', { cls: 'spec-val-lbl', text: LABELS[i] });
    append(box, num, lbl);
    container.appendChild(box);
  });
}

// BUG FIX #7: no Numeric Score row; full-width layout, no orphan
function renderBreakdown(container, spec) {
  clear(container);
  const { breakdown, specificity: [a, b, c, d] } = spec;

  const rows = [];

  if (a > 0) rows.push({ label: 'Inline',   val: a, detail: 'style="" attribute' });
  if (b > 0) rows.push({ label: 'IDs',       val: b, detail: breakdown.ids.slice(0, 4).join('  ') });
  if (c > 0) {
    const parts = [];
    if (breakdown.classes.length)       parts.push(breakdown.classes.slice(0, 3).join('  '));
    if (breakdown.attributes.length)    parts.push(breakdown.attributes.slice(0, 2).join('  '));
    if (breakdown.pseudoClasses.length) parts.push(breakdown.pseudoClasses.slice(0, 3).join('  '));
    rows.push({ label: 'Classes / Attr / Pseudo', val: c, detail: parts.join('   ') || `${c} selector${c > 1 ? 's' : ''}` });
  }
  if (d > 0) {
    const parts = [];
    if (breakdown.elements.length)      parts.push(breakdown.elements.slice(0, 4).join('  '));
    if (breakdown.pseudoElements.length) parts.push(breakdown.pseudoElements.slice(0, 2).join('  '));
    rows.push({ label: 'Elements', val: d, detail: parts.join('   ') || `${d} element${d > 1 ? 's' : ''}` });
  }

  if (rows.length === 0) {
    // Zero specificity — show one row
    rows.push({ label: 'No specificity weight', val: 0, detail: 'Universal selector (*) contributes 0' });
  }

  rows.forEach(({ label, val, detail }) => {
    const item = el('div', { cls: 'bd-item' });
    append(item,
      el('div', { cls: 'bd-label',  text: label }),
      el('div', { cls: 'bd-val',   text: String(val) }),
      el('div', { cls: 'bd-detail', text: detail })
    );
    container.appendChild(item);
  });
}

// BUG FIX #8: apply winner/loser classes cleanly
function applyWinnerState(cmp) {
  result1.classList.remove('is-winner', 'is-loser', 'is-draw');
  result2.classList.remove('is-winner', 'is-loser', 'is-draw');
  if (cmp.winner === 1)      { result1.classList.add('is-winner'); result2.classList.add('is-loser'); }
  else if (cmp.winner === 2) { result2.classList.add('is-winner'); result1.classList.add('is-loser'); }
  else                       { result1.classList.add('is-draw');   result2.classList.add('is-draw');  }
}

// BUG FIX #9: winner banner gets .is-win or .is-draw, never ambiguous
function renderWinnerBanner(cmp) {
  winnerBanner.classList.remove('is-win', 'is-draw');

  if (cmp.winner !== 0) {
    winnerBanner.classList.add('is-win');
    winnerIcon.textContent = '🏆';
  } else {
    winnerBanner.classList.add('is-draw');
    winnerIcon.textContent = '⚖️';
  }

  winnerLabel.textContent  = cmp.label;
  winnerDetail.textContent = cmp.detail;
  whyBody.textContent      = cmp.why;

  // Reset why state on each render
  whyOpen = false;
  setVisible(whyBody, false);
  whyToggle.setAttribute('aria-expanded', 'false');
  const toggleTxtEl = whyToggle.querySelector('.why-toggle-text');
  if (toggleTxtEl) toggleTxtEl.textContent = 'Why does this win?';
}

// BUG FIX #3: toggle uses aria-expanded state + CSS, no DOM destruction
function toggleWhy() {
  whyOpen = !whyOpen;
  setVisible(whyBody, whyOpen);
  whyToggle.setAttribute('aria-expanded', String(whyOpen));
  const toggleTxtEl = whyToggle.querySelector('.why-toggle-text');
  if (toggleTxtEl) toggleTxtEl.textContent = whyOpen ? 'Hide explanation' : 'Why does this win?';
}

// ── Guide ──────────────────────────────────────────────────────
function toggleGuide() {
  guideOpen = !guideOpen;
  setVisible(guideBody, guideOpen);
  guideBtn.setAttribute('aria-expanded', String(guideOpen));
}

// ── Clear ──────────────────────────────────────────────────────
function clearAll() {
  sel1.value = ''; sel2.value = '';

  [badge1, badge2].forEach(b => { b.textContent = ''; b.classList.remove('visible'); });
  [error1, error2].forEach(e => { e.textContent = ''; });
  [sel1, sel2].forEach(i => i.classList.remove('is-error'));

  setVisible(resultsSection, false);
  currentResults = null;
  setStatus('ready', 'Ready — enter a CSS selector');
}

// ── Examples ───────────────────────────────────────────────────
function loadExample() {
  const EXAMPLES = [
    ['#header nav ul li a',          'body .container .nav a'],
    ['.btn-primary:hover',           'button[type="submit"]'],
    ['div.content > p:first-child',  'section p:first-of-type'],
    ['#app .card.active::before',    '.card.active::before'],
    ['*',                            'html body div span'],
    ['form input[type="text"]:focus','input.form-control'],
  ];
  const pair = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
  sel1.value = pair[0];
  sel2.value = pair[1];
  updateBadge(sel1, badge1, error1);
  updateBadge(sel2, badge2, error2);
  runCalculate();
}

// ── Copy ───────────────────────────────────────────────────────
// BUG FIX #4: text span kept separate, icon SVG never touched
async function copyResults() {
  if (!currentResults) { setStatus('error', 'Nothing to copy'); return; }

  const { spec1, spec2 } = currentResults;
  const lines = [
    'CSS Specificity Results',
    '=======================',
    '',
    `Selector 1 : ${spec1.selector}`,
    `Specificity: (${spec1.specificity.join(',')})`,
    `Score      : ${spec1.score}`,
  ];

  if (spec2) {
    lines.push('');
    lines.push(`Selector 2 : ${spec2.selector}`);
    lines.push(`Specificity: (${spec2.specificity.join(',')})`);
    lines.push(`Score      : ${spec2.score}`);
    lines.push('');
    const cmp = compare(spec1, spec2);
    lines.push(`Result     : ${cmp.label}`);
    lines.push(`Reason     : ${cmp.detail}`);
  }

  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    copyText.textContent = 'Copied!';
    setStatus('success', 'Copied to clipboard');
    setTimeout(() => {
      copyText.textContent = 'Copy';
      setStatus('ready', 'Ready');
    }, 1800);
  } catch {
    setStatus('error', 'Copy failed — use Ctrl+C');
  }
}

// ── Status ─────────────────────────────────────────────────────
function setStatus(type, message) {
  clearTimeout(statusTimer);
  statusDot.className  = `status-dot ${type}`;
  statusText.textContent = message;
  if (type !== 'ready') {
    statusTimer = setTimeout(() => setStatus('ready', 'Ready'), 4000);
  }
}
