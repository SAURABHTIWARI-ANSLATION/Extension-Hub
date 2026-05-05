/**
 * PageSpeed Analyzer Pro — Performance Helpers (utils/performanceHelpers.js)
 * Pure utility functions — no DOM access, no side effects.
 */

'use strict';

// ── Formatting ────────────────────────────────────────────────────────────────

/** Format milliseconds to human-readable string */
export function formatMs(ms) {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/** Format bytes to human-readable string */
export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i     = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Format a CLS score */
export function formatCLS(cls) {
  if (cls === null || cls === undefined) return '—';
  return cls.toFixed(3);
}

// ── Rating helpers ────────────────────────────────────────────────────────────

/** Returns 'good' | 'average' | 'poor' | 'unknown' */
export function ratingClass(rating) {
  const map = {
    good:    'rating-good',
    average: 'rating-avg',
    poor:    'rating-poor',
    unknown: 'rating-unknown',
  };
  return map[rating] ?? 'rating-unknown';
}

/** Returns a colour HEX for a rating */
export function ratingColor(rating) {
  const map = {
    good:    '#0CCE6B',
    average: '#FFA400',
    poor:    '#FF4E42',
    unknown: '#888888',
  };
  return map[rating] ?? map.unknown;
}

/** Convert 0–100 score to rating string */
export function scoreToRating(score) {
  if (score === null || score === undefined) return 'unknown';
  if (score >= 90) return 'good';
  if (score >= 50) return 'average';
  return 'poor';
}

/** Returns an emoji indicator for a rating */
export function ratingEmoji(rating) {
  const map = { good: '✓', average: '~', poor: '✗', unknown: '?' };
  return map[rating] ?? '?';
}

// ── Score arc path (SVG gauge) ────────────────────────────────────────────────

/**
 * Returns SVG arc path `d` attribute for a gauge arc from startAngle to endAngle.
 * @param {number} cx - center x
 * @param {number} cy - center y
 * @param {number} r  - radius
 * @param {number} startDeg - start angle in degrees (0 = top)
 * @param {number} endDeg   - end angle in degrees
 */
export function arcPath(cx, cy, r, startDeg, endDeg) {
  const toRad = (d) => (d - 90) * (Math.PI / 180);
  const x1    = cx + r * Math.cos(toRad(startDeg));
  const y1    = cy + r * Math.sin(toRad(startDeg));
  const x2    = cx + r * Math.cos(toRad(endDeg));
  const y2    = cy + r * Math.sin(toRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

// ── Metric metadata ───────────────────────────────────────────────────────────

export const METRIC_META = {
  fcp:  { label: 'First Contentful Paint',   abbr: 'FCP',  unit: 'ms',  format: formatMs  },
  lcp:  { label: 'Largest Contentful Paint', abbr: 'LCP',  unit: 'ms',  format: formatMs  },
  cls:  { label: 'Cumulative Layout Shift',  abbr: 'CLS',  unit: '',    format: formatCLS },
  fid:  { label: 'First Input Delay',        abbr: 'FID',  unit: 'ms',  format: formatMs  },
  ttfb: { label: 'Time to First Byte',       abbr: 'TTFB', unit: 'ms',  format: formatMs  },
  tbt:  { label: 'Total Blocking Time',      abbr: 'TBT',  unit: 'ms',  format: formatMs  },
  tti:  { label: 'Time to Interactive',      abbr: 'TTI',  unit: 'ms',  format: formatMs  },
};

export const CATEGORY_META = {
  performance:     { label: 'Performance',     icon: '⚡' },
  images:          { label: 'Images',          icon: '🖼' },
  network:         { label: 'Network',         icon: '🌐' },
  seo:             { label: 'SEO',             icon: '🔍' },
  security:        { label: 'Security',        icon: '🔒' },
  accessibility:   { label: 'Accessibility',   icon: '♿' },
  'best-practices': { label: 'Best Practices', icon: '✅' },
};
