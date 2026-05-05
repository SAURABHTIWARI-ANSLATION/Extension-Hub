/**
 * PageSpeed Analyzer Pro — Service Worker (MV3) v1.1.0
 *
 */

'use strict';

// ── Constants ────────────────────────────────────────────────────────────────
const CACHE_MAX_TABS    = 50;  // Maximum tab entries in in-memory cache
const HISTORY_MAX_SCANS = 5;   // Maximum scan history entries per tab

const BADGE_COLORS = {
  good:    '#0CCE6B',   // ≥ 90
  average: '#FFA400',  // 50–89
  poor:    '#FF4E42',  // < 50
  neutral: '#888888',  // no data
};

// ── In-memory result cache (tab-keyed, LRU) ──────────────────────────────────
/** @type {Map<number, {score: number, data: object, ts: number}>} */
const resultCache = new Map();

// ── In-memory scan history (tab-keyed) ──────────────────────────────────────
/** @type {Map<number, Array<{score: number, timestamp: number, url: string}>>} */
const scanHistory = new Map();

// ── Badge helpers ─────────────────────────────────────────────────────────────
function scoreToBadgeColor(score) {
  if (score >= 90) return BADGE_COLORS.good;
  if (score >= 50) return BADGE_COLORS.average;
  return BADGE_COLORS.poor;
}

function updateBadge(tabId, score) {
  const text  = score !== null && score !== undefined ? String(Math.round(score)) : '';
  const color = score !== null && score !== undefined
    ? scoreToBadgeColor(score)
    : BADGE_COLORS.neutral;

  chrome.action.setBadgeText({ tabId, text }).catch(() => {});
  chrome.action.setBadgeBackgroundColor({ tabId, color }).catch(() => {});
}

function clearBadge(tabId) {
  chrome.action.setBadgeText({ tabId, text: '' }).catch(() => {});
}

// ── LRU cache management ──────────────────────────────────────────────────────
function cacheResult(tabId, payload) {
  // Evict the oldest entry when at capacity
  if (resultCache.size >= CACHE_MAX_TABS) {
    let oldest = null;
    let oldestTs = Infinity;
    for (const [id, entry] of resultCache) {
      if (entry.ts < oldestTs) { oldest = id; oldestTs = entry.ts; }
    }
    if (oldest !== null) resultCache.delete(oldest);
  }
  resultCache.set(tabId, { ...payload, ts: Date.now() });
}

function getCachedResult(tabId) {
  return resultCache.get(tabId) ?? null;
}

// ── Scan history management ───────────────────────────────────────────────────
function recordHistory(tabId, payload) {
  if (!payload || payload.error) return;

  const existing = scanHistory.get(tabId) ?? [];
  const entry = {
    score:     payload.score,
    timestamp: payload.timestamp,
    url:       payload.url,
    metrics:   payload.metrics,
  };

  // Prepend newest; keep only HISTORY_MAX_SCANS entries
  const updated = [entry, ...existing].slice(0, HISTORY_MAX_SCANS);
  scanHistory.set(tabId, updated);
}

function getHistory(tabId) {
  return scanHistory.get(tabId) ?? [];
}

// ── Message handling ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  switch (type) {

    // ── Content script → SW: analysis complete ────────────────────────────
    case 'ANALYSIS_COMPLETE': {
      const tabId = sender.tab?.id;
      if (!tabId) { sendResponse({ ok: false, error: 'no tab id' }); break; }

      cacheResult(tabId, payload);
      recordHistory(tabId, payload);
      updateBadge(tabId, payload.score ?? null);

      // Notify any open popup (fire-and-forget — popup may not be open)
      chrome.runtime.sendMessage({
        type:    'ANALYSIS_READY',
        tabId,
        payload,
        history: getHistory(tabId),
      }).catch(() => { /* popup closed — expected */ });

      sendResponse({ ok: true });
      break;
    }

    // ── Popup → SW: get cached result for current tab ─────────────────────
    case 'GET_CACHED_RESULT': {
      const { tabId } = payload;
      const cached  = getCachedResult(tabId);
      const history = getHistory(tabId);
      sendResponse({ ok: true, cached, history });
      break;
    }

    // ── Popup → SW: trigger a fresh analysis on the active tab ────────────
    case 'TRIGGER_ANALYSIS': {
      const { tabId } = payload;

      // Try to message the already-injected content script first
      chrome.tabs.sendMessage(tabId, { type: 'RUN_ANALYSIS' }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script not yet present — inject it
          chrome.scripting.executeScript({
            target: { tabId },
            files:  ['content/metrics.js', 'content/analyzer.js'],
          })
          .then(() => {
            // Brief grace period for observers to register
            setTimeout(() => {
              chrome.tabs.sendMessage(tabId, { type: 'RUN_ANALYSIS' }).catch(() => {});
            }, 400);
          })
          .catch((err) => {
            // Report failure back to the popup (prevents infinite loading state)
            chrome.runtime.sendMessage({
              type:  'ANALYSIS_READY',
              tabId,
              payload: {
                error:     'Cannot analyse this page (script injection blocked).',
                score:     null,
                url:       '',
                timestamp: Date.now(),
              },
            }).catch(() => {});
          });
        }
      });

      sendResponse({ ok: true });
      break;
    }

    // ── Popup → SW: retrieve scan history ────────────────────────────────
    case 'GET_HISTORY': {
      const { tabId } = payload;
      sendResponse({ ok: true, history: getHistory(tabId) });
      break;
    }

    // ── Popup → SW: clear history for tab ────────────────────────────────
    case 'CLEAR_HISTORY': {
      const { tabId } = payload;
      scanHistory.delete(tabId);
      sendResponse({ ok: true });
      break;
    }

    default:
      // Unknown message type — no response needed
      break;
  }

  // Return false: all current handlers respond synchronously.
  // If you add an async branch, return true from that case block.
  return false;
});

// ── Tab lifecycle cleanup ─────────────────────────────────────────────────────
chrome.tabs.onRemoved.addListener((tabId) => {
  resultCache.delete(tabId);
  scanHistory.delete(tabId);
  clearBadge(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  // Clear stale results when a new navigation begins
  if (changeInfo.status === 'loading' && changeInfo.url) {
    resultCache.delete(tabId);
    // Preserve history across navigations (intentional — lets users compare)
    clearBadge(tabId);
  }
});

// ── Installation / startup ────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.storage.local.set({
      settings: {
        autoScan:     false,
        darkMode:     false,
        exportFormat: 'json',
      },
    });
  }
});
