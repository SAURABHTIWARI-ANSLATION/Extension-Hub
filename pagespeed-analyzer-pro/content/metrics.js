/**
 * PageSpeed Analyzer Pro — Metrics Collector (content/metrics.js)
 *
 * Uses the native Performance API and PerformanceObserver to capture:
 *  FCP · LCP · CLS · FID · TTFB · TTI (approximation) · TBT (approximation)
 *
 * This file must be loaded BEFORE analyzer.js.
 * It exposes a single global: window.__PSA_Metrics
 */

(function installMetricsCollector() {
  'use strict';

  // Guard against double-injection
  if (window.__PSA_Metrics) return;

  // ── Internal state ────────────────────────────────────────────────────────

  const state = {
    fcp:  null,   // ms
    lcp:  null,   // ms  (latest LCP entry)
    cls:  0,      // unitless score
    fid:  null,   // ms
    ttfb: null,   // ms
    tbt:  0,      // ms  (sum of long-task excess)
    longTasks: [], // raw PerformanceLongTaskTiming entries
  };

  // ── TTFB ─────────────────────────────────────────────────────────────────
  function captureTTFB() {
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav) {
      state.ttfb = Math.round(nav.responseStart - nav.requestStart);
    }
  }

  // ── FCP ───────────────────────────────────────────────────────────────────
  const fcpObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        state.fcp = Math.round(entry.startTime);
        fcpObserver.disconnect();
      }
    }
  });
  try { fcpObserver.observe({ type: 'paint', buffered: true }); } catch (_) { /* unsupported */ }

  // ── LCP ───────────────────────────────────────────────────────────────────
  const lcpObserver = new PerformanceObserver((list) => {
    // The last entry is the most recent (and thus correct) LCP candidate
    const entries = list.getEntries();
    const last = entries[entries.length - 1];
    if (last) state.lcp = Math.round(last.startTime);
  });
  try { lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true }); } catch (_) { /* unsupported */ }

  // ── CLS ───────────────────────────────────────────────────────────────────
  // We accumulate layout-shift scores, excluding shifts with recent user input.
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        state.cls = parseFloat((state.cls + entry.value).toFixed(4));
      }
    }
  });
  try { clsObserver.observe({ type: 'layout-shift', buffered: true }); } catch (_) { /* unsupported */ }

  // ── FID ───────────────────────────────────────────────────────────────────
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (state.fid === null) {
        state.fid = Math.round(entry.processingStart - entry.startTime);
      }
    }
    fidObserver.disconnect();
  });
  try { fidObserver.observe({ type: 'first-input', buffered: true }); } catch (_) { /* unsupported */ }

  // ── Long Tasks → TBT ──────────────────────────────────────────────────────
  // TBT = sum of (task duration – 50ms) for all long tasks during [FCP, TTI]
  // We capture all long tasks; the analyzer will slice them properly.
  const ltObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      state.longTasks.push({
        start:    Math.round(entry.startTime),
        duration: Math.round(entry.duration),
        excess:   Math.round(Math.max(0, entry.duration - 50)),
      });
      state.tbt += Math.round(Math.max(0, entry.duration - 50));
    }
  });
  try { ltObserver.observe({ type: 'longtask', buffered: true }); } catch (_) { /* unsupported */ }

  // ── Public API ────────────────────────────────────────────────────────────
  window.__PSA_Metrics = {
    /**
     * Snapshot the current metric state.
     * LCP observer is disconnected here to finalise the LCP value.
     * @returns {object}
     */
    snapshot() {
      lcpObserver.disconnect();
      captureTTFB();

      // Approximate TTI: FCP + the point after which there are no long tasks
      // within a 5-second window. Simplified heuristic for content scripts.
      let tti = state.fcp;
      if (state.longTasks.length > 0) {
        const lastLT = state.longTasks[state.longTasks.length - 1];
        tti = Math.max(tti ?? 0, lastLT.start + lastLT.duration);
      }

      return {
        fcp:       state.fcp,
        lcp:       state.lcp,
        cls:       parseFloat(state.cls.toFixed(4)),
        fid:       state.fid,
        ttfb:      state.ttfb,
        tbt:       state.tbt,
        tti:       tti ? Math.round(tti) : null,
        longTasks: state.longTasks.slice(), // defensive copy
      };
    },
  };
})();
