/**
 * PageSpeed Analyzer Pro — Service Worker (MV3)
 *
 * Responsibilities:
 *  - Route messages between popup ↔ content scripts
 *  - Persist analysis results per tab in a bounded LRU cache
 *  - Manage badge text (score indicator)
 *  - Handle tab lifecycle (cleanup stale results)
 */

'use strict';

// ── Constants ────────────────────────────────────────────────────────────────
const CACHE_MAX_TABS = 50;   // Maximum number of tab results to keep in memory
const BADGE_COLORS = {
  good:    '#0CCE6B',   // ≥ 90
  average: '#FFA400',  // 50–89
  poor:    '#FF4E42',  // < 50
};

// ── In-memory result store (tab-keyed) ───────────────────────────────────────
/** @type {Map<number, {score: number, data: object, ts: number}>} */
const resultCache = new Map();

// ── Badge helpers ─────────────────────────────────────────────────────────────
function scoreToBadgeColor(score) {
  if (score >= 90) return BADGE_COLORS.good;
  if (score >= 50) return BADGE_COLORS.average;
  return BADGE_COLORS.poor;
}

function updateBadge(tabId, score) {
  const text  = score !== null ? String(Math.round(score)) : '';
  const color = score !== null ? scoreToBadgeColor(score) : '#888888';
  chrome.action.setBadgeText({ tabId, text });
  chrome.action.setBadgeBackgroundColor({ tabId, color });
}

function clearBadge(tabId) {
  chrome.action.setBadgeText({ tabId, text: '' });
}

// ── Cache management ──────────────────────────────────────────────────────────
function cacheResult(tabId, payload) {
  // Evict oldest entry if at capacity
  if (resultCache.size >= CACHE_MAX_TABS) {
    const oldest = [...resultCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) resultCache.delete(oldest[0]);
  }
  resultCache.set(tabId, { ...payload, ts: Date.now() });
}

function getCachedResult(tabId) {
  return resultCache.get(tabId) ?? null;
}

// ── Message handling ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  switch (type) {

    // Content script → SW: analysis complete
    case 'ANALYSIS_COMPLETE': {
      const tabId = sender.tab?.id;
      if (!tabId) break;
      cacheResult(tabId, payload);
      updateBadge(tabId, payload.score ?? null);
      // Notify any open popup for this tab
      chrome.runtime.sendMessage({ type: 'ANALYSIS_READY', tabId, payload }).catch(() => {
        // Popup may not be open — ignore the error
      });
      sendResponse({ ok: true });
      break;
    }

    // Popup → SW: request cached result for current tab
    case 'GET_CACHED_RESULT': {
      const { tabId } = payload;
      const cached = getCachedResult(tabId);
      sendResponse({ ok: true, cached });
      break;
    }

    // Popup → SW: trigger a fresh analysis on the active tab
    case 'TRIGGER_ANALYSIS': {
      const { tabId } = payload;
      chrome.tabs.sendMessage(tabId, { type: 'RUN_ANALYSIS' }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script not injected yet — inject it
          chrome.scripting.executeScript({
            target: { tabId },
            files: ['content/metrics.js', 'content/analyzer.js'],
          }).then(() => {
            // Small delay to let the script initialise
            setTimeout(() => {
              chrome.tabs.sendMessage(tabId, { type: 'RUN_ANALYSIS' });
            }, 300);
          }).catch((err) => {
            console.error('[PSA] Script injection failed:', err.message);
          });
        }
      });
      sendResponse({ ok: true });
      break;
    }

    default:
      break;
  }

  // Return true only for async responders — the switch above is synchronous
  // for all current cases, so we return false.
  return false;
});

// ── Tab lifecycle cleanup ─────────────────────────────────────────────────────
chrome.tabs.onRemoved.addListener((tabId) => {
  resultCache.delete(tabId);
  clearBadge(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  // Clear stale results when a new page starts loading
  if (changeInfo.status === 'loading' && changeInfo.url) {
    resultCache.delete(tabId);
    clearBadge(tabId);
  }
});

// ── Installation / startup ────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.storage.local.set({
      settings: {
        autoScan: false,
        darkMode: true,
        exportFormat: 'json',
      },
    });
  }
});

console.log('[PSA] Service worker initialised');
