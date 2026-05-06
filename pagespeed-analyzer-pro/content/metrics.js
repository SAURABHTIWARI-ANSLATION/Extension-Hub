/**
 * PageSpeed Analyzer Pro — Metrics Collector (content/metrics.js) v1.1.0
 *
 */

(function installMetricsCollector() {
  'use strict';

  // ── Double-injection guard ────────────────────────────────────────────────
  if (window.__PSA_Metrics) return;

  // ── Internal mutable state ────────────────────────────────────────────────
  const state = {
    fcp:        null,   // ms  — First Contentful Paint
    lcp:        null,   // ms  — Largest Contentful Paint (last candidate)
    cls:        0,      // unitless — Cumulative Layout Shift
    fid:        null,   // ms  — First Input Delay (legacy)
    inp:        null,   // ms  — Interaction to Next Paint (CWV 2024)
    ttfb:       null,   // ms  — Time to First Byte
    tbt:        0,      // ms  — Total Blocking Time (sum of long-task excess)
    longTasks:  [],     // raw long-task descriptors
    snapshotted: false, // true after snapshot() finalises state
    frozen:     null,   // cached frozen result after first snapshot()
  };

  // Active observers — kept so snapshot() can disconnect them all at once
  const observers = [];
  function observe(type, callback, options = {}) {
    try {
      const obs = new PerformanceObserver(callback);
      obs.observe({ type, buffered: true, ...options });
      observers.push(obs);
      return obs;
    } catch (_) {
      return null; // Gracefully degrade for unsupported entry types
    }
  }

  // ── TTFB (synchronous — always available after navigation) ───────────────
  function captureTTFB() {
    if (state.ttfb !== null) return;
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav) {
      // responseStart – requestStart gives network+server time
      state.ttfb = Math.round(Math.max(0, nav.responseStart - nav.requestStart));
    }
  }

  // ── FCP ───────────────────────────────────────────────────────────────────
  observe('paint', (list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint' && state.fcp === null) {
        state.fcp = Math.round(entry.startTime);
      }
    }
  });

  // ── LCP ───────────────────────────────────────────────────────────────────
  // The LAST entry before user interaction or page hide is the definitive LCP.
  observe('largest-contentful-paint', (list) => {
    const entries = list.getEntries();
    const last = entries[entries.length - 1];
    if (last) state.lcp = Math.round(last.startTime);
  });

  // ── CLS ───────────────────────────────────────────────────────────────────
  // Accumulate layout-shift values, ignoring shifts following recent user input.
  observe('layout-shift', (list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        state.cls = parseFloat((state.cls + entry.value).toFixed(4));
      }
    }
  });

  // ── FID (First Input Delay — legacy, kept for compatibility) ─────────────
  observe('first-input', (list) => {
    for (const entry of list.getEntries()) {
      if (state.fid === null) {
        state.fid = Math.round(entry.processingStart - entry.startTime);
      }
    }
  });

  // ── INP (Interaction to Next Paint — Core Web Vital from 2024) ───────────
  // INP = ~98th percentile of interaction latency.
  // We approximate this by sampling and computing the percentile at snapshot().
  const inpSamples = [];
  const INP_SAMPLE_CAP = 200;
  observe('event', (list) => {
    for (const entry of list.getEntries()) {
      // Only pointer/keyboard events count toward INP
      if (entry.duration >= 40) { // Filter noise below 40ms
        inpSamples.push(Math.round(entry.duration));
        if (inpSamples.length > INP_SAMPLE_CAP) inpSamples.shift();
      }
    }
  }, { durationThreshold: 40 });

  // ── Long Tasks → TBT ──────────────────────────────────────────────────────
  // TBT = sum of (task_duration − 50ms) for all long tasks during [FCP, TTI].
  // We collect all long tasks; the final TTI window is applied in snapshot().
  observe('longtask', (list) => {
    for (const entry of list.getEntries()) {
      const excess = Math.round(Math.max(0, entry.duration - 50));
      state.longTasks.push({
        start:    Math.round(entry.startTime),
        duration: Math.round(entry.duration),
        excess,
      });
      state.tbt += excess;
    }
  });

  // ── Public API ────────────────────────────────────────────────────────────
  window.__PSA_Metrics = Object.freeze({
    /**
     * Finalise and return the current metric snapshot.
     *
     * Idempotent: after the first call all observers are disconnected and
     * the same frozen result is returned on subsequent calls.
     *
     * @returns {Readonly<object>}
     */
    snapshot() {
      if (state.snapshotted) return state.frozen;

      state.snapshotted = true;

      // Disconnect all observers to finalise values
      for (const obs of observers) {
        try { obs.disconnect(); } catch (_) {}
      }

      captureTTFB();

      // ── Compute INP (approximate 98th percentile) ─────────────────────
      if (inpSamples.length) {
        const sorted = inpSamples.slice().sort((a, b) => a - b);
        const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.98));
        state.inp = sorted[idx];
      } else {
        state.inp = null;
      }

      // ── Compute TTI approximation ──────────────────────────────────────
      // Heuristic: the end of the last long task after FCP within a 5-second
      // quiet window. This is a simplified version of the Lighthouse algorithm.
      let tti = state.fcp ?? 0;
      if (state.longTasks.length > 0) {
        const last = state.longTasks[state.longTasks.length - 1];
        tti = Math.max(tti, last.start + last.duration);
      }

      // ── Recompute TBT within [FCP, TTI] window ────────────────────────
      // (Re-sum to respect the proper window now that we have final FCP/TTI)
      let tbtInWindow = 0;
      const fcpMs  = state.fcp ?? 0;
      const ttiMs  = tti;
      for (const t of state.longTasks) {
        if (t.start >= fcpMs && (t.start + t.duration) <= (ttiMs + 5000)) {
          tbtInWindow += t.excess;
        }
      }

      state.frozen = Object.freeze({
        fcp:        state.fcp,
        lcp:        state.lcp,
        cls:        parseFloat(state.cls.toFixed(4)),
        fid:        state.fid,
        inp:        state.inp,
        ttfb:       state.ttfb,
        tbt:        tbtInWindow,
        tti:        tti > 0 ? Math.round(tti) : null,
        longTasks:  Object.freeze(state.longTasks.slice()),
      });

      return state.frozen;
    },
  });
})();
