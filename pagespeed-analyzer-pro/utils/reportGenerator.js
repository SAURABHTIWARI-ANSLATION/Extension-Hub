/**
 * PageSpeed Analyzer Pro — Report Generator (utils/reportGenerator.js) v1.1.0
 */

'use strict';

// ── Report builder ────────────────────────────────────────────────────────────

/**
 * Builds a clean, portable report object from analysis payload.
 * @param {object} payload  Raw analysis result from analyzer.js
 * @returns {object|null}
 */
export function buildReport(payload) {
  if (!payload) return null;

  return {
    meta: {
      generator:  'PageSpeed Analyzer Pro v1.1.0',
      analyzedAt: new Date(payload.timestamp).toISOString(),
      url:        payload.url,
      title:      payload.title,
    },
    score: payload.score,
    grade: scoreToGrade(payload.score),

    metrics: {
      fcp:  { value: payload.metrics?.fcp,  rating: payload.metricRatings?.fcp  },
      lcp:  { value: payload.metrics?.lcp,  rating: payload.metricRatings?.lcp  },
      cls:  { value: payload.metrics?.cls,  rating: payload.metricRatings?.cls  },
      inp:  { value: payload.metrics?.inp,  rating: payload.metricRatings?.inp  },
      fid:  { value: payload.metrics?.fid,  rating: payload.metricRatings?.fid  },
      ttfb: { value: payload.metrics?.ttfb, rating: payload.metricRatings?.ttfb },
      tbt:  { value: payload.metrics?.tbt,  rating: payload.metricRatings?.tbt  },
      tti:  { value: payload.metrics?.tti,  rating: payload.metricRatings?.tti  },
    },

    networkTiming: payload.networkTiming,
    resources:     payload.resources,
    seo:           payload.seo,
    bestPractices: payload.bestPractices,

    suggestions: (payload.suggestions ?? []).map((s) => ({
      category:    s.category,
      impact:      s.impact,
      title:       s.title,
      description: s.description,
      fix:         s.fix,
    })),

    summary: buildTextSummary(payload),
  };
}

// ── Grade helper ──────────────────────────────────────────────────────────────

function scoreToGrade(score) {
  if (score === null || score === undefined) return 'N/A';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// ── Text summary ──────────────────────────────────────────────────────────────

function buildTextSummary(payload) {
  const lines = [];
  const hr = '─'.repeat(50);

  lines.push('PageSpeed Analyzer Pro — Analysis Report');
  lines.push(hr);
  lines.push(`URL      : ${payload.url}`);
  lines.push(`Title    : ${payload.title || '—'}`);
  lines.push(`Analyzed : ${new Date(payload.timestamp).toLocaleString()}`);
  lines.push(`Score    : ${payload.score ?? 'N/A'}/100 (Grade ${scoreToGrade(payload.score)})`);
  lines.push('');
  lines.push('Core Web Vitals');
  lines.push(hr);

  const m = payload.metrics ?? {};
  const r = payload.metricRatings ?? {};

  const pad = (s, n) => s.padEnd(n);
  lines.push(`${pad('FCP',  6)}: ${(m.fcp  != null ? m.fcp  + 'ms' : '—').padStart(8)}  [${r.fcp  ?? '?'}]`);
  lines.push(`${pad('LCP',  6)}: ${(m.lcp  != null ? m.lcp  + 'ms' : '—').padStart(8)}  [${r.lcp  ?? '?'}]`);
  lines.push(`${pad('CLS',  6)}: ${(m.cls  != null ? m.cls.toFixed(3) : '—').padStart(8)}  [${r.cls  ?? '?'}]`);
  lines.push(`${pad('INP',  6)}: ${(m.inp  != null ? m.inp  + 'ms' : '—').padStart(8)}  [${r.inp  ?? '?'}]`);
  lines.push(`${pad('TTFB', 6)}: ${(m.ttfb != null ? m.ttfb + 'ms' : '—').padStart(8)}  [${r.ttfb ?? '?'}]`);
  lines.push(`${pad('TBT',  6)}: ${(m.tbt  != null ? m.tbt  + 'ms' : '—').padStart(8)}  [${r.tbt  ?? '?'}]`);
  lines.push(`${pad('TTI',  6)}: ${(m.tti  != null ? m.tti  + 'ms' : '—').padStart(8)}  [${r.tti  ?? '?'}]`);

  if (payload.networkTiming) {
    const nt = payload.networkTiming;
    lines.push('');
    lines.push('Network Timing');
    lines.push(hr);
    lines.push(`DNS       : ${nt.dnsMs}ms`);
    lines.push(`Connect   : ${nt.connectMs}ms`);
    lines.push(`TLS       : ${nt.tlsMs}ms`);
    lines.push(`DOM Load  : ${nt.domLoadMs}ms`);
    lines.push(`Page Load : ${nt.windowLoadMs}ms`);
    lines.push(`Protocol  : ${nt.protocol}`);
  }

  lines.push('');
  lines.push('SEO Checks');
  lines.push(hr);
  const seo = payload.seo ?? {};
  lines.push(`Title          : ${seo.title ? `"${seo.title}" (${seo.titleLength} chars)` : 'Missing'}`);
  lines.push(`Meta Desc      : ${seo.metaDescription ? `${seo.metaDescLength} chars` : 'Missing'}`);
  lines.push(`H1 Headings    : ${seo.headings?.h1 ?? 0}`);
  lines.push(`Canonical      : ${seo.canonical || 'Missing'}`);
  lines.push(`Structured Data: ${seo.structuredData ?? 0} schema(s)`);

  lines.push('');
  lines.push(`Issues & Suggestions (${(payload.suggestions ?? []).length} total)`);
  lines.push(hr);

  const sug = (payload.suggestions ?? []).slice(0, 15);
  sug.forEach((s, i) => {
    lines.push(`${i + 1}. [${s.impact.toUpperCase().padEnd(6)}] [${s.category}] ${s.title}`);
    if (s.description) {
      lines.push(`   ${s.description.slice(0, 120)}${s.description.length > 120 ? '…' : ''}`);
    }
    lines.push('');
  });

  lines.push(hr);
  lines.push('Generated by PageSpeed Analyzer Pro v1.1.0');

  return lines.join('\n');
}

// ── HTML Report builder ───────────────────────────────────────────────────────

/**
 * Builds a printable HTML string for the report.
 * Uses inline styles (no external CSS) for portability.
 * Safe: built via string template, not via innerHTML on an existing document.
 *
 * @param {object} payload
 * @returns {string}  Complete HTML document string
 */
export function buildHTMLReport(payload) {
  const m = payload.metrics ?? {};
  const r = payload.metricRatings ?? {};
  const sug = (payload.suggestions ?? []).slice(0, 20);

  const scoreColor = payload.score >= 90 ? '#0CCE6B'
    : payload.score >= 50 ? '#FFA400'
    : '#FF4E42';

  const metricRow = (key, label, value, rating) => {
    const c = rating === 'good' ? '#0CCE6B'
      : rating === 'average' ? '#FFA400'
      : rating === 'poor'    ? '#FF4E42'
      : '#888';
    return `<tr>
      <td style="padding:6px 12px;font-weight:600;">${label}</td>
      <td style="padding:6px 12px;">${value ?? '—'}</td>
      <td style="padding:6px 12px;color:${c};font-weight:700;text-transform:uppercase;">${rating ?? '—'}</td>
    </tr>`;
  };

  const sugRow = (s) => {
    const c = s.impact === 'high' ? '#FF4E42' : s.impact === 'medium' ? '#FFA400' : '#0CCE6B';
    return `<div style="margin-bottom:12px;padding:12px;border-left:4px solid ${c};background:#f8f8f8;border-radius:4px;">
      <strong style="color:${c};">[${s.impact.toUpperCase()}]</strong>
      <strong> ${escapeHtml(s.title)}</strong>
      <p style="margin:4px 0 0;font-size:13px;color:#555;">${escapeHtml(s.description)}</p>
    </div>`;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PageSpeed Report — ${escapeHtml(payload.url)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body{font-family:system-ui,sans-serif;max-width:860px;margin:40px auto;padding:20px;color:#1a1a1a;}
    h1{font-size:24px;margin-bottom:4px;}
    h2{font-size:18px;margin:24px 0 8px;border-bottom:2px solid #eee;padding-bottom:4px;}
    table{width:100%;border-collapse:collapse;font-size:14px;}
    tr:nth-child(even){background:#f5f5f5;}
    .score{font-size:64px;font-weight:700;line-height:1;}
    .meta{font-size:13px;color:#666;margin-bottom:16px;}
    @media print{body{margin:0;}}
  </style>
</head>
<body>
  <h1>PageSpeed Analyzer Pro</h1>
  <div class="meta">
    <strong>${escapeHtml(payload.url)}</strong><br>
    Analyzed at ${new Date(payload.timestamp).toLocaleString()}
  </div>
  <div class="score" style="color:${scoreColor};">${Math.round(payload.score ?? 0)}</div>
  <div style="font-size:14px;color:#666;margin-top:4px;">Performance Score / Grade ${scoreToGrade(payload.score)}</div>

  <h2>Core Web Vitals</h2>
  <table>
    <thead><tr style="background:#f0f0f0;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">
      <th style="padding:6px 12px;text-align:left;">Metric</th>
      <th style="padding:6px 12px;text-align:left;">Value</th>
      <th style="padding:6px 12px;text-align:left;">Rating</th>
    </tr></thead>
    <tbody>
      ${metricRow('fcp',  'First Contentful Paint',   m.fcp  != null ? m.fcp  + 'ms' : '—', r.fcp)}
      ${metricRow('lcp',  'Largest Contentful Paint',  m.lcp  != null ? m.lcp  + 'ms' : '—', r.lcp)}
      ${metricRow('cls',  'Cumulative Layout Shift',   m.cls  != null ? m.cls.toFixed(3) : '—', r.cls)}
      ${metricRow('inp',  'Interaction to Next Paint', m.inp  != null ? m.inp  + 'ms' : '—', r.inp)}
      ${metricRow('ttfb', 'Time to First Byte',        m.ttfb != null ? m.ttfb + 'ms' : '—', r.ttfb)}
      ${metricRow('tbt',  'Total Blocking Time',       m.tbt  != null ? m.tbt  + 'ms' : '—', r.tbt)}
      ${metricRow('tti',  'Time to Interactive',       m.tti  != null ? m.tti  + 'ms' : '—', r.tti)}
    </tbody>
  </table>

  <h2>Issues & Suggestions (${sug.length})</h2>
  ${sug.map(sugRow).join('')}

  <p style="margin-top:32px;font-size:12px;color:#999;">
    Generated by PageSpeed Analyzer Pro v1.1.0 — ${new Date().toISOString()}
  </p>
</body>
</html>`;
}

// ── Escape helper (for HTML report — NOT used on existing DOM) ────────────────

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Download helpers ──────────────────────────────────────────────────────────

/**
 * Trigger a browser file download using a Blob URL.
 * @param {string} filename
 * @param {string} content
 * @param {string} mimeType
 */
export function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  // Append → click → remove is required for Firefox compatibility
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a short delay to guarantee download has started
  setTimeout(() => URL.revokeObjectURL(url), 15_000);
}

/** Build a sanitised filename component from a URL hostname. */
function hostnameSlug(urlStr) {
  try {
    return new URL(urlStr).hostname.replace(/[^a-z0-9]/gi, '-').slice(0, 30);
  } catch {
    return 'unknown';
  }
}

/**
 * Export analysis result as a structured JSON report file.
 * @param {object} payload
 */
export function exportJSON(payload) {
  const report  = buildReport(payload);
  const content = JSON.stringify(report, null, 2);
  const date    = new Date().toISOString().slice(0, 10);
  downloadFile(`psa-report-${hostnameSlug(payload.url)}-${date}.json`, content, 'application/json');
}

/**
 * Export analysis result as a plain-text report file.
 * @param {object} payload
 */
export function exportText(payload) {
  const report = buildReport(payload);
  const date   = new Date().toISOString().slice(0, 10);
  downloadFile(`psa-report-${hostnameSlug(payload.url)}-${date}.txt`, report.summary, 'text/plain');
}

/**
 * Export analysis result as a printable HTML report.
 * Opens in a new tab where the user can File → Print → Save as PDF.
 * @param {object} payload
 */
export function exportHTML(payload) {
  const html = buildHTMLReport(payload);
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(`psa-report-${hostnameSlug(payload.url)}-${date}.html`, html, 'text/html');
}
