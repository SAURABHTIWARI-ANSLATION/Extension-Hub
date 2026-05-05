/**
 * PageSpeed Analyzer Pro — Performance Helpers (utils/performanceHelpers.js) v1.1.0
 */

'use strict';

// ── Formatting ────────────────────────────────────────────────────────────────

/** Format milliseconds to a human-readable string (rounds to nearest ms, shows 2dp for seconds) */
export function formatMs(ms) {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/** Format bytes to a human-readable string (B → KB → MB → GB) */
export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 B';
  if (bytes < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(3, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Format a CLS score (3 decimal places) */
export function formatCLS(cls) {
  if (cls === null || cls === undefined) return '—';
  return cls.toFixed(3);
}

/** Format a score to a compact string */
export function formatScore(score) {
  if (score === null || score === undefined) return '—';
  return String(Math.round(score));
}

/** Format a timestamp to a locale time string */
export function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Rating helpers ────────────────────────────────────────────────────────────

/** Maps a rating string to its CSS class name */
export function ratingClass(rating) {
  const map = {
    good:    'rating-good',
    average: 'rating-avg',
    poor:    'rating-poor',
    unknown: 'rating-unknown',
  };
  return map[rating] ?? 'rating-unknown';
}

/** Maps a rating string to its brand colour hex */
export function ratingColor(rating) {
  const map = {
    good:    '#0CCE6B',
    average: '#FFA400',
    poor:    '#FF4E42',
    unknown: '#888888',
  };
  return map[rating] ?? map.unknown;
}

/** Convert a 0–100 score to a rating string */
export function scoreToRating(score) {
  if (score === null || score === undefined) return 'unknown';
  if (score >= 90) return 'good';
  if (score >= 50) return 'average';
  return 'poor';
}

/** Returns a visual emoji for a rating */
export function ratingEmoji(rating) {
  const map = { good: 'OK', average: 'AVG', poor: 'POOR', unknown: 'NA' };
  return map[rating] ?? 'NA';
}

// ── Metric metadata ────────────────────────────────────────────────────────────

export const METRIC_META = {
  fcp:  {
    label:  'First Contentful Paint',
    abbr:   'FCP',
    unit:   'ms',
    format: formatMs,
    description: 'Time until the first content element (text, image) is rendered.',
  },
  lcp:  {
    label:  'Largest Contentful Paint',
    abbr:   'LCP',
    unit:   'ms',
    format: formatMs,
    description: 'Time until the largest visible content element is rendered. Core Web Vital.',
  },
  cls:  {
    label:  'Cumulative Layout Shift',
    abbr:   'CLS',
    unit:   '',
    format: formatCLS,
    description: 'Total unexpected layout shift score. Core Web Vital.',
  },
  inp:  {
    label:  'Interaction to Next Paint',
    abbr:   'INP',
    unit:   'ms',
    format: formatMs,
    description: 'Responsiveness to user interactions. Core Web Vital (2024).',
  },
  ttfb: {
    label:  'Time to First Byte',
    abbr:   'TTFB',
    unit:   'ms',
    format: formatMs,
    description: 'Time from request start until the first byte of the response is received.',
  },
  tbt:  {
    label:  'Total Blocking Time',
    abbr:   'TBT',
    unit:   'ms',
    format: formatMs,
    description: 'Total time the main thread was blocked by long tasks after FCP.',
  },
  tti:  {
    label:  'Time to Interactive',
    abbr:   'TTI',
    unit:   'ms',
    format: formatMs,
    description: 'Time until the page is reliably responsive to user input.',
  },
  fid:  {
    label:  'First Input Delay',
    abbr:   'FID',
    unit:   'ms',
    format: formatMs,
    description: 'Delay from first user interaction to browser response (legacy metric).',
  },
};

export const CATEGORY_META = {
  performance:       { label: 'Performance',     icon: '' },
  images:            { label: 'Images',          icon: '' },
  network:           { label: 'Network',         icon: '' },
  seo:               { label: 'SEO',             icon: '' },
  security:          { label: 'Security',        icon: '' },
  accessibility:     { label: 'Accessibility',   icon: '' },
  'best-practices':  { label: 'Best Practices',  icon: '' },
};
