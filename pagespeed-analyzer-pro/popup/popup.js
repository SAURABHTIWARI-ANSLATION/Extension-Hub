/**
 * PageSpeed Analyzer Pro — Popup Controller (popup/popup.js)
 *
 * Entry point for the extension popup.
 * - Requests analysis from the active tab
 * - Receives results via chrome.runtime messaging
 * - Renders all UI panels using DOM utilities (strict CSP)
 * - Manages settings, theme, export
 */

import {
  formatMs, formatBytes, formatCLS,
  ratingClass, ratingColor, scoreToRating,
  METRIC_META, CATEGORY_META,
} from '../utils/performanceHelpers.js';

import {
  el, appendAll, clearNode,
  buildScoreGauge, buildMetricCard,
  buildSuggestionItem, buildResourceRow,
  wireTabNav,
} from '../utils/domScanner.js';

import { exportJSON, exportText } from '../utils/reportGenerator.js';

'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
let currentTabId   = null;
let currentPayload = null;
let currentFilter  = 'all';
let currentRTab    = 'images';
let settings       = { autoScan: false, darkMode: false };

// ── DOM references ─────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const DOM = {
  stateLoading:     $('state-loading'),
  stateError:       $('state-error'),
  stateEmpty:       $('state-empty'),
  resultsPanel:     $('results-panel'),
  currentUrl:       $('current-url'),
  errorMessage:     $('error-message'),
  scoreGauge:       $('score-gauge'),
  scoreRatingText:  $('score-rating-text'),
  scoreTimestamp:   $('score-timestamp'),
  metricsGrid:      $('metrics-grid'),
  suggestionsList:  $('suggestions-list'),
  resourceList:     $('resource-list'),
  resourceTotals:   $('resource-totals'),
  seoGrid:          $('seo-grid'),
  settingsOverlay:  $('settings-overlay'),
  settingAutoscan:  $('setting-autoscan'),
  settingDarkmode:  $('setting-darkmode'),
  btnReanalyse:     $('btn-reanalyse'),
  btnRetryError:    $('btn-retry-error'),
  btnTheme:         $('btn-theme'),
  btnSettings:      $('btn-settings'),
  btnCloseSettings: $('btn-close-settings'),
  btnSaveSettings:  $('btn-save-settings'),
  btnExportJson:    $('btn-export-json'),
  btnExportTxt:     $('btn-export-txt'),
  footerVersion:    $('footer-version'),
};

// ── State transitions ─────────────────────────────────────────────────────────
const ALL_STATES = ['state-loading', 'state-error', 'state-empty', 'results-panel'];

function showState(activeId) {
  ALL_STATES.forEach((id) => {
    const el = $(id);
    if (el) el.classList.toggle('state-panel--hidden', id !== activeId);
  });
}

// ── Theme ─────────────────────────────────────────────────────────────────────
function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  DOM.btnTheme.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
}

// ── Initialise ────────────────────────────────────────────────────────────────
async function init() {
  // Load settings
  const stored = await chrome.storage.local.get('settings');
  if (stored.settings) settings = { ...settings, ...stored.settings };

  applyTheme(settings.darkMode);
  DOM.settingDarkmode.checked  = settings.darkMode;
  DOM.settingAutoscan.checked  = settings.autoScan;

  // Version label
  try {
    const v = chrome.runtime.getManifest().version;
    if (DOM.footerVersion) DOM.footerVersion.textContent = `v${v}`;
  } catch (_) {}

  // Wire tab navigation
  const tabBtns   = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  wireTabNav(tabBtns, tabPanels);

  // Wire resource sub-tab
  document.querySelectorAll('.sub-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sub-tab-btn').forEach((b) => b.classList.remove('sub-tab-btn--active'));
      btn.classList.add('sub-tab-btn--active');
      currentRTab = btn.dataset.rtab;
      if (currentPayload) renderResourcePanel(currentPayload.resources);
    });
  });

  // Wire filter buttons
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');
      currentFilter = btn.dataset.filter;
      if (currentPayload) renderSuggestions(currentPayload.suggestions);
    });
  });

  // Button events
  DOM.btnReanalyse.addEventListener('click', triggerAnalysis);
  DOM.btnRetryError.addEventListener('click', triggerAnalysis);
  DOM.btnTheme.addEventListener('click', () => {
    settings.darkMode = !settings.darkMode;
    applyTheme(settings.darkMode);
    DOM.settingDarkmode.checked = settings.darkMode;
    chrome.storage.local.set({ settings }).catch(() => {});
  });
  DOM.btnSettings.addEventListener('click',      () => DOM.settingsOverlay.classList.remove('state-panel--hidden'));
  DOM.btnCloseSettings.addEventListener('click', () => DOM.settingsOverlay.classList.add('state-panel--hidden'));
  DOM.btnSaveSettings.addEventListener('click',  saveSettings);
  DOM.btnExportJson.addEventListener('click',    () => currentPayload && exportJSON(currentPayload));
  DOM.btnExportTxt.addEventListener('click',     () => currentPayload && exportText(currentPayload));

  // Get the active tab and start
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) { showState('state-empty'); return; }

    currentTabId = tab.id;

    // Restrict analysis to http/https pages
    if (!tab.url || !tab.url.startsWith('http')) {
      showState('state-empty');
      return;
    }

    // Truncate URL display
    DOM.currentUrl.textContent = tab.url.length > 55
      ? tab.url.slice(0, 52) + '…'
      : tab.url;
    DOM.currentUrl.title = tab.url;

    // Check if we already have a cached result
    chrome.runtime.sendMessage(
      { type: 'GET_CACHED_RESULT', payload: { tabId: currentTabId } },
      (response) => {
        if (chrome.runtime.lastError) { triggerAnalysis(); return; }
        if (response?.cached) {
          currentPayload = response.cached;
          renderResults(response.cached);
        } else {
          triggerAnalysis();
        }
      }
    );
  } catch (err) {
    showState('state-error');
    DOM.errorMessage.textContent = err.message;
  }
}

// ── Analysis trigger ──────────────────────────────────────────────────────────
function triggerAnalysis() {
  showState('state-loading');
  chrome.runtime.sendMessage({
    type:    'TRIGGER_ANALYSIS',
    payload: { tabId: currentTabId },
  });
}

// ── Listen for results ────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'ANALYSIS_READY' && message.tabId === currentTabId) {
    currentPayload = message.payload;
    if (message.payload.error) {
      showState('state-error');
      DOM.errorMessage.textContent = message.payload.error;
    } else {
      renderResults(message.payload);
    }
  }
});

// ── Render ────────────────────────────────────────────────────────────────────
function renderResults(payload) {
  showState('results-panel');
  renderScoreSection(payload);
  renderMetricsPanel(payload);
  renderSuggestions(payload.suggestions ?? []);
  renderResourcePanel(payload.resources ?? {});
  renderSEOPanel(payload.seo ?? {}, payload.bestPractices ?? {});
}

// ── Score section ─────────────────────────────────────────────────────────────
function renderScoreSection(payload) {
  const score  = payload.score ?? null;
  const rating = scoreToRating(score);
  const color  = ratingColor(rating);

  clearNode(DOM.scoreGauge);
  DOM.scoreGauge.appendChild(buildScoreGauge(score, color));

  const labels = { good: 'Good', average: 'Needs Improvement', poor: 'Poor', unknown: 'Unknown' };
  DOM.scoreRatingText.textContent  = labels[rating] ?? '—';
  DOM.scoreRatingText.className    = `score-meta__rating ${ratingClass(rating)}`;

  const ts = payload.timestamp
    ? new Date(payload.timestamp).toLocaleTimeString()
    : '—';
  DOM.scoreTimestamp.textContent = `Analysed at ${ts}`;
}

// ── Metrics panel ─────────────────────────────────────────────────────────────
function renderMetricsPanel(payload) {
  const grid    = DOM.metricsGrid;
  const metrics = payload.metrics ?? {};
  const ratings = payload.metricRatings ?? {};

  clearNode(grid);

  for (const [key, meta] of Object.entries(METRIC_META)) {
    const rawValue = metrics[key];
    const rating   = ratings[key] ?? 'unknown';
    const display  = meta.format(rawValue);

    const card = buildMetricCard(meta.label, display, rating, meta.abbr);
    card.setAttribute('role', 'listitem');
    grid.appendChild(card);
  }
}

// ── Suggestions panel ─────────────────────────────────────────────────────────
function renderSuggestions(suggestions) {
  const list = DOM.suggestionsList;
  clearNode(list);

  const filtered = currentFilter === 'all'
    ? suggestions
    : suggestions.filter((s) => s.category === currentFilter);

  if (filtered.length === 0) {
    const empty = el('div', { cls: 'empty-msg', text: currentFilter === 'all' ? 'No issues found.' : 'No issues in this category.' });
    list.appendChild(empty);
    return;
  }

  for (const s of filtered) {
    const item = buildSuggestionItem(s);
    item.setAttribute('role', 'listitem');
    list.appendChild(item);
  }
}

// ── Resources panel ───────────────────────────────────────────────────────────
function renderResourcePanel(resources) {
  const list = DOM.resourceList;
  clearNode(list);

  // Update totals
  if (resources.summary) {
    const t = resources.summary;
    DOM.resourceTotals.textContent =
      `${t.count} requests · ${formatBytes(t.transferBytes)} transferred`;
  }

  const items = resources[currentRTab] ?? [];
  if (items.length === 0) {
    const empty = el('div', { cls: 'empty-msg', text: `No ${currentRTab} found.` });
    list.appendChild(empty);
    return;
  }

  for (const r of items) {
    const row = buildResourceRow(r, formatBytes, formatMs);
    row.setAttribute('role', 'listitem');
    list.appendChild(row);
  }
}

// ── SEO panel ─────────────────────────────────────────────────────────────────
function renderSEOPanel(seo, bp) {
  const grid = DOM.seoGrid;
  clearNode(grid);

  // Build checklist items
  const checks = [
    {
      label:  'Page Title',
      pass:   !!seo.title && seo.titleLength >= 10 && seo.titleLength <= 60,
      warn:   !!seo.title && (seo.titleLength < 10 || seo.titleLength > 60),
      detail: seo.title
        ? `"${seo.title.slice(0, 40)}${seo.title.length > 40 ? '…' : ''}" (${seo.titleLength} chars)`
        : 'Missing',
    },
    {
      label:  'Meta Description',
      pass:   !!seo.metaDescription && seo.metaDescLength >= 50 && seo.metaDescLength <= 160,
      warn:   !!seo.metaDescription && (seo.metaDescLength < 50 || seo.metaDescLength > 160),
      detail: seo.metaDescription
        ? `${seo.metaDescLength} characters`
        : 'Missing',
    },
    {
      label:  'Canonical URL',
      pass:   !!seo.canonical,
      detail: seo.canonical ? seo.canonical.slice(0, 40) + (seo.canonical.length > 40 ? '…' : '') : 'Missing',
    },
    {
      label:  'Viewport Meta',
      pass:   !!seo.viewport,
      detail: seo.viewport || 'Missing',
    },
    {
      label:  'H1 Heading',
      pass:   seo.headings?.h1 === 1,
      warn:   seo.headings?.h1 > 1,
      detail: seo.headings?.h1 === 0
        ? 'No H1 found'
        : seo.headings?.h1 > 1
        ? `${seo.headings.h1} H1 tags (should be 1)`
        : '1 H1 found',
    },
    {
      label:  'Open Graph',
      pass:   !!(seo.openGraph?.title && seo.openGraph?.image),
      warn:   !!(seo.openGraph?.title && !seo.openGraph?.image),
      detail: seo.openGraph?.title ? 'Partial / Complete' : 'Missing',
    },
    {
      label:  'Structured Data',
      pass:   seo.structuredData > 0,
      detail: seo.structuredData > 0 ? `${seo.structuredData} schema found` : 'None found',
    },
    {
      label:  'HTTPS',
      pass:   bp.isHTTPS,
      detail: bp.isHTTPS ? 'Secure' : 'Not secure',
    },
    {
      label:  'HTML lang',
      pass:   !!bp.htmlLang,
      detail: bp.htmlLang || 'Missing',
    },
    {
      label:  'Charset',
      pass:   !!seo.hasCharset,
      detail: seo.hasCharset ? 'Declared' : 'Missing',
    },
    {
      label:  'Favicon',
      pass:   bp.hasFavicon,
      detail: bp.hasFavicon ? 'Found' : 'Missing',
    },
    {
      label:  'Web App Manifest',
      pass:   bp.hasManifest,
      detail: bp.hasManifest ? 'Found' : 'Not linked',
    },
  ];

  for (const check of checks) {
    const row = el('div', {
      cls:   ['seo-check', check.pass ? 'seo-check--pass' : check.warn ? 'seo-check--warn' : 'seo-check--fail'],
      attrs: { role: 'listitem' },
    });

    const icon   = el('span', { cls: 'seo-check__icon', text: check.pass ? 'OK' : check.warn ? 'WARN' : 'FAIL' });
    const label  = el('span', { cls: 'seo-check__label', text: check.label });
    const detail = el('span', { cls: 'seo-check__detail', text: check.detail });

    appendAll(row, icon, label, detail);
    grid.appendChild(row);
  }

  // Headings structure
  const headingsSection = el('div', { cls: 'seo-headings' });
  const hTitle = el('div', { cls: 'seo-headings__title', text: 'Heading Structure' });
  headingsSection.appendChild(hTitle);

  const headings = seo.headings ?? {};
  for (const [tag, count] of Object.entries(headings)) {
    if (count === 0) continue;
    const row  = el('div', { cls: 'seo-headings__row' });
    const tagEl = el('span', { cls: 'seo-headings__tag', text: tag.toUpperCase() });
    const cnt   = el('span', { cls: 'seo-headings__count', text: String(count) });
    const bar   = el('div',  { cls: 'seo-headings__bar' });
    bar.style.width = `${Math.min(100, count * 10)}%`;
    appendAll(row, tagEl, cnt, bar);
    headingsSection.appendChild(row);
  }

  grid.appendChild(headingsSection);
}

// ── Settings ──────────────────────────────────────────────────────────────────
async function saveSettings() {
  settings.autoScan = DOM.settingAutoscan.checked;
  settings.darkMode = DOM.settingDarkmode.checked;
  applyTheme(settings.darkMode);
  await chrome.storage.local.set({ settings });
  DOM.settingsOverlay.classList.add('state-panel--hidden');
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
