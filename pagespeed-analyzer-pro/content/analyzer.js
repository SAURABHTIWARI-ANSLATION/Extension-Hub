/**
 * PageSpeed Analyzer Pro — Main Analyzer (content/analyzer.js) v1.1.0
 *
 */

(function installAnalyzer() {
  'use strict';

  // ── Double-injection guard ────────────────────────────────────────────────
  if (window.__PSA_Analyzer_Installed) return;
  window.__PSA_Analyzer_Installed = true;

  // ── Thresholds (Google Lighthouse 10 / CWV 2024 values) ─────────────────
  const THRESHOLDS = {
    fcp:  { good: 1800,  poor: 3000  },   // ms
    lcp:  { good: 2500,  poor: 4000  },   // ms
    cls:  { good: 0.1,   poor: 0.25  },   // unitless
    fid:  { good: 100,   poor: 300   },   // ms (legacy)
    inp:  { good: 200,   poor: 500   },   // ms (INP — CWV 2024)
    ttfb: { good: 800,   poor: 1800  },   // ms
    tbt:  { good: 200,   poor: 600   },   // ms
    tti:  { good: 3800,  poor: 7300  },   // ms
  };

  // Lighthouse 10 scoring weights (sum = 1.0)
  const WEIGHTS = {
    fcp:  0.10,
    lcp:  0.25,
    cls:  0.15,
    inp:  0.10,   // replaces fid weight in modern scoring
    tbt:  0.30,
    tti:  0.10,
  };

  // ── Scoring helpers ───────────────────────────────────────────────────────

  /**
   * Maps a raw metric value to a 0–1 linear score using piecewise interpolation.
   * Values at or below the "good" threshold score 1.0.
   * Values at or above the "poor" threshold score 0.
   * Values in-between are linearly interpolated.
   */
  function metricScore(value, { good, poor }) {
    if (value === null || value === undefined) return null;
    if (value <= good) return 1;
    if (value >= poor) return 0;
    return 1 - (value - good) / (poor - good);
  }

  /** Compute a Lighthouse-style 0–100 weighted composite score. */
  function computeOverallScore(metrics) {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const [key, weight] of Object.entries(WEIGHTS)) {
      const raw = metrics[key];
      if (raw === null || raw === undefined) continue;
      const t = THRESHOLDS[key];
      if (!t) continue;
      const linear = metricScore(raw, t);
      if (linear === null) continue;
      weightedSum  += linear * weight;
      totalWeight  += weight;
    }

    if (totalWeight === 0) return null; // No reliable metrics captured
    return Math.min(100, Math.max(0, Math.round((weightedSum / totalWeight) * 100)));
  }

  /** Returns 'good' | 'average' | 'poor' | 'unknown' for a metric value. */
  function ratingFor(value, key) {
    if (value === null || value === undefined) return 'unknown';
    const t = THRESHOLDS[key];
    if (!t) return 'unknown';
    if (value <= t.good)  return 'good';
    if (value <= t.poor)  return 'average';
    return 'poor';
  }

  // ── Resource Analysis ─────────────────────────────────────────────────────
  /**
   * Analyses all PerformanceResourceTiming entries.
   * BUG FIX: Accepts pre-computed fcp value instead of calling snapshot() again.
   *
   * @param {number|null} fcpMs — FCP in ms (from the single snapshot() call)
   */
  function analyzeResources(fcpMs) {
    const entries = performance.getEntriesByType('resource');
    const resources = {
      images:      [],
      scripts:     [],
      stylesheets: [],
      fonts:       [],
      xhr:         [],
      other:       [],
      totals: {
        count:         0,
        transferBytes: 0,
        decodedBytes:  0,
        durationMs:    0,
        cachedCount:   0,
      },
    };

    const fcpCutoff = fcpMs ?? Infinity;

    for (const entry of entries) {
      const transferSize = entry.transferSize  || 0;
      const decodedSize  = entry.decodedBodySize || 0;
      const isCached     = transferSize === 0 && decodedSize > 0;

      const r = {
        url:            entry.name,
        type:           entry.initiatorType,
        durationMs:     Math.round(entry.duration),
        transferSize,
        encodedSize:    entry.encodedBodySize  || 0,
        decodedSize,
        startTime:      Math.round(entry.startTime),
        renderBlocking: false,   // enriched below
        cached:         isCached,
        protocol:       entry.nextHopProtocol || 'unknown',
      };

      resources.totals.count         += 1;
      resources.totals.transferBytes += transferSize;
      resources.totals.decodedBytes  += decodedSize;
      resources.totals.durationMs    += r.durationMs;
      if (isCached) resources.totals.cachedCount += 1;

      switch (entry.initiatorType) {
        case 'img':
          resources.images.push(r);
          break;
        case 'script':
          resources.scripts.push(r);
          // Render-blocking: synchronous script that completed before FCP
          if (r.startTime < fcpCutoff && r.durationMs > 0) r.renderBlocking = true;
          break;
        case 'css':
          resources.stylesheets.push(r);
          r.renderBlocking = r.startTime < fcpCutoff;
          break;
        case 'link':
          if (/\.(woff2?|ttf|otf|eot)/i.test(entry.name)) {
            resources.fonts.push(r);
          } else if (/\.css/i.test(entry.name)) {
            resources.stylesheets.push(r);
            r.renderBlocking = r.startTime < fcpCutoff;
          } else {
            resources.other.push(r);
          }
          break;
        case 'xmlhttprequest':
        case 'fetch':
          resources.xhr.push(r);
          break;
        default:
          resources.other.push(r);
      }
    }

    // Sort each category by decoded size descending (largest first)
    const bySize = (a, b) => b.decodedSize - a.decodedSize;
    resources.images.sort(bySize);
    resources.scripts.sort(bySize);
    resources.stylesheets.sort(bySize);
    resources.fonts.sort(bySize);
    resources.xhr.sort((a, b) => b.durationMs - a.durationMs); // XHR by slowest first

    return resources;
  }

  // ── DOM Resource Scan ─────────────────────────────────────────────────────
  function scanDOMResources() {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const links   = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const images  = Array.from(document.querySelectorAll('img'));

    // Render-blocking: synchronous scripts not deferred, async, or modules
    const renderBlockingScripts = scripts.filter(
      (s) => !s.defer && !s.async && !s.type?.includes('module')
    );

    // Resource hints
    const preloads     = document.querySelectorAll('link[rel="preload"]').length;
    const preconnects  = document.querySelectorAll('link[rel="preconnect"]').length;
    const prefetches   = document.querySelectorAll('link[rel="prefetch"]').length;

    const imagesWithoutAlt   = images.filter((img) => !img.alt && img.alt !== '');
    const imagesWithLazyLoad = images.filter((img) => img.loading === 'lazy');
    const imagesNoDimensions = images.filter(
      (img) => !img.hasAttribute('width') || !img.hasAttribute('height')
    );
    const imagesWithDecoding = images.filter((img) => img.decoding === 'async');

    return {
      totalImages:               images.length,
      imagesWithoutAlt:          imagesWithoutAlt.length,
      imagesWithLazyLoad:        imagesWithLazyLoad.length,
      largeImagesNoDimensions:   imagesNoDimensions.length,
      imagesWithAsyncDecoding:   imagesWithDecoding.length,
      renderBlockingScripts:     renderBlockingScripts.length,
      renderBlockingStylesheets: links.length,
      resourceHints:             { preloads, preconnects, prefetches },
      scriptDetails: renderBlockingScripts.slice(0, 10).map((s) => ({
        src:   s.src,
        defer: s.defer,
        async: s.async,
        type:  s.type || 'text/javascript',
      })),
    };
  }

  // ── Network Timing Analysis ───────────────────────────────────────────────
  function analyzeNetwork() {
    const nav = performance.getEntriesByType('navigation')[0];
    if (!nav) return null;

    return {
      dnsMs:        Math.round(nav.domainLookupEnd - nav.domainLookupStart),
      connectMs:    Math.round(nav.connectEnd - nav.connectStart),
      tlsMs:        nav.secureConnectionStart > 0
        ? Math.round(nav.connectEnd - nav.secureConnectionStart)
        : 0,
      requestMs:    Math.round(nav.responseStart - nav.requestStart),
      responseMs:   Math.round(nav.responseEnd - nav.responseStart),
      domLoadMs:    Math.round(nav.domContentLoadedEventEnd - nav.startTime),
      windowLoadMs: Math.round(nav.loadEventEnd - nav.startTime),
      protocol:     nav.nextHopProtocol || 'unknown',
      transferSize: nav.transferSize || 0,
      decodedSize:  nav.decodedBodySize || 0,
    };
  }

  // ── SEO Audit ─────────────────────────────────────────────────────────────
  function auditSEO() {
    const title    = document.title || '';
    const metaDesc = document.querySelector('meta[name="description"]');
    const canonical = document.querySelector('link[rel="canonical"]');
    const viewport  = document.querySelector('meta[name="viewport"]');
    const robots    = document.querySelector('meta[name="robots"]');
    const charset   = document.querySelector('meta[charset]')
                    || document.querySelector('meta[http-equiv="Content-Type"]');

    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc  = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const ogUrl   = document.querySelector('meta[property="og:url"]');

    const twitterCard  = document.querySelector('meta[name="twitter:card"]');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterImage = document.querySelector('meta[name="twitter:image"]');

    // Heading counts
    const headings = {};
    for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
      headings[tag] = document.querySelectorAll(tag).length;
    }

    // Structured data
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]').length;

    // Links
    const allLinks = document.querySelectorAll('a[href]');
    const externalLinks = Array.from(allLinks).filter(
      (a) => a.hostname && a.hostname !== location.hostname
    ).length;
    const nofollowLinks = Array.from(allLinks).filter(
      (a) => (a.rel || '').includes('nofollow')
    ).length;

    return {
      title,
      titleLength:      title.length,
      metaDescription:  metaDesc?.content || null,
      metaDescLength:   metaDesc?.content?.length ?? 0,
      canonical:        canonical?.href || null,
      viewport:         viewport?.content || null,
      robots:           robots?.content || null,
      hasCharset:       !!charset,
      openGraph: {
        title:  ogTitle?.content  || null,
        desc:   ogDesc?.content   || null,
        image:  ogImage?.content  || null,
        url:    ogUrl?.content    || null,
      },
      twitter: {
        card:  twitterCard?.content  || null,
        title: twitterTitle?.content || null,
        image: twitterImage?.content || null,
      },
      headings,
      structuredData:  jsonLdScripts,
      totalLinks:      allLinks.length,
      externalLinks,
      nofollowLinks,
    };
  }

  // ── Best Practices Audit ──────────────────────────────────────────────────
  function auditBestPractices() {
    const isHTTPS     = location.protocol === 'https:';
    const hasDoctype  = document.doctype !== null;
    const htmlLang    = document.documentElement.lang || null;
    const touchIcons  = document.querySelectorAll('link[rel="apple-touch-icon"]').length;
    const themeColor  = document.querySelector('meta[name="theme-color"]')?.content || null;
    const hasManifest = !!document.querySelector('link[rel="manifest"]');
    const hasFavicon  = !!document.querySelector('link[rel*="icon"]');

    // Deprecated HTML tags
    const DEPRECATED = ['center', 'font', 'marquee', 'blink', 'frame', 'frameset', 'strike', 'big', 'tt'];
    const deprecatedTags = {};
    let totalDeprecated = 0;
    for (const tag of DEPRECATED) {
      const count = document.querySelectorAll(tag).length;
      if (count > 0) { deprecatedTags[tag] = count; totalDeprecated += count; }
    }

    // Passive event listeners (can't detect from content script — noted as unknown)
    // ARIA roles
    const hasMainLandmark = !!document.querySelector('main, [role="main"]');
    const hasNavLandmark  = !!document.querySelector('nav, [role="navigation"]');

    return {
      isHTTPS,
      hasDoctype,
      htmlLang,
      hasFavicon,
      hasAppleTouchIcon: touchIcons > 0,
      themeColor,
      hasManifest,
      deprecatedTags,
      totalDeprecated,
      hasMainLandmark,
      hasNavLandmark,
    };
  }

  // ── Suggestions Engine ────────────────────────────────────────────────────
  /**
   * Generates structured suggestions from all analysis results.
   * Each suggestion: { id, category, impact, title, description, fix }
   * Sorted: high → medium → low impact.
   */
  function generateSuggestions({ metrics, resources, seo, bestPractices, domResources, networkTiming }) {
    const suggestions = [];
    let _id = 0;

    const suggest = (category, impact, title, description, fix = null) => {
      suggestions.push({ id: _id++, category, impact, title, description, fix });
    };

    // ── Core Web Vitals ─────────────────────────────────────────────────────
    if (metrics.lcp !== null && metrics.lcp > THRESHOLDS.lcp.good) {
      suggest(
        'performance',
        metrics.lcp > THRESHOLDS.lcp.poor ? 'high' : 'medium',
        'Improve Largest Contentful Paint (LCP)',
        `LCP is ${metrics.lcp}ms. Google recommends ≤ 2500ms for a "Good" rating. Slow LCP directly impacts user perception and Core Web Vitals ranking signals.`,
        'Preload your hero image: <link rel="preload" as="image" href="hero.webp">\n'
        + 'Convert images to WebP/AVIF (30–50% smaller).\n'
        + 'Use a CDN and eliminate render-blocking resources before LCP element.'
      );
    }

    if (metrics.cls !== null && metrics.cls > THRESHOLDS.cls.good) {
      suggest(
        'performance',
        metrics.cls > THRESHOLDS.cls.poor ? 'high' : 'medium',
        'Reduce Cumulative Layout Shift (CLS)',
        `CLS score is ${metrics.cls.toFixed(3)} (target ≤ 0.1). Layout shifts frustrate users and lower engagement.`,
        'Set explicit width/height on images and embeds.\n'
        + 'Reserve space for ads/embeds with min-height.\n'
        + 'Use CSS transform instead of top/left for animations.\n'
        + 'Avoid inserting DOM content above existing content.'
      );
    }

    if (metrics.inp !== null && metrics.inp > THRESHOLDS.inp.good) {
      suggest(
        'performance',
        metrics.inp > THRESHOLDS.inp.poor ? 'high' : 'medium',
        'Improve Interaction to Next Paint (INP)',
        `INP is ${metrics.inp}ms. Good INP is ≤ 200ms. INP replaced FID as a Core Web Vital in 2024 — it measures responsiveness to all user interactions.`,
        'Break up long event handlers with scheduler.yield() or setTimeout.\n'
        + 'Move heavy computation to Web Workers.\n'
        + 'Avoid large DOM trees (keep nodes < 1500 total).\n'
        + 'Use requestAnimationFrame for visual updates.'
      );
    }

    if (metrics.fcp !== null && metrics.fcp > THRESHOLDS.fcp.good) {
      suggest(
        'performance',
        metrics.fcp > THRESHOLDS.fcp.poor ? 'high' : 'medium',
        'Optimise First Contentful Paint (FCP)',
        `FCP is ${metrics.fcp}ms (target ≤ 1800ms). FCP marks when the first content element appears — a slow FCP signals server or critical-path bottlenecks.`,
        'Inline critical CSS (<style> in <head>).\n'
        + 'Use <link rel="preconnect"> for third-party origins.\n'
        + 'Reduce TTFB (server caching, CDN).\n'
        + 'Eliminate render-blocking scripts with defer/async.'
      );
    }

    if (metrics.tbt !== null && metrics.tbt > THRESHOLDS.tbt.good) {
      suggest(
        'performance',
        metrics.tbt > THRESHOLDS.tbt.poor ? 'high' : 'medium',
        'Reduce Total Blocking Time (TBT)',
        `TBT is ${metrics.tbt}ms (target ≤ 200ms). Long tasks on the main thread delay all user interactions — a key proxy for TTI and INP.`,
        'Split long tasks using setTimeout(fn, 0) or scheduler.postTask().\n'
        + 'Move heavy computation to a Web Worker:\n'
        + '  const worker = new Worker("worker.js");\n'
        + '  worker.postMessage(data);\n'
        + 'Audit and remove unused third-party scripts.'
      );
    }

    if (metrics.ttfb !== null && metrics.ttfb > THRESHOLDS.ttfb.good) {
      suggest(
        'performance',
        metrics.ttfb > THRESHOLDS.ttfb.poor ? 'high' : 'medium',
        'Improve Time to First Byte (TTFB)',
        `TTFB is ${metrics.ttfb}ms (target ≤ 800ms). TTFB indicates slow server processing, no CDN, or excessive redirect chains.`,
        'Deploy a CDN with edge caching close to your users.\n'
        + 'Enable HTTP/2 or HTTP/3 on your server.\n'
        + 'Implement full-page caching (e.g., Redis, Varnish, Cloudflare).\n'
        + 'Reduce redirect chains — each redirect adds a full round-trip.'
      );
    }

    // ── Image suggestions ───────────────────────────────────────────────────
    const largeImages = resources.images.filter((img) => img.decodedSize > 100_000);
    if (largeImages.length > 0) {
      const totalBytes = largeImages.reduce((s, img) => s + img.decodedSize, 0);
      const totalKB    = Math.round(totalBytes / 1024);
      suggest(
        'images', 'high',
        `Compress ${largeImages.length} oversized image${largeImages.length > 1 ? 's' : ''} (${totalKB} KB total)`,
        `${largeImages.length} image${largeImages.length > 1 ? 's exceed' : ' exceeds'} 100 KB. `
        + `Large images are the most common cause of slow LCP and wasted bandwidth.`,
        'Convert to WebP or AVIF (30–50% smaller with equivalent quality).\n'
        + 'Use srcset for responsive images:\n'
        + '  <img src="img.webp" srcset="img-400.webp 400w, img-800.webp 800w"\n'
        + '       sizes="(max-width: 600px) 400px, 800px" alt="...">\n'
        + 'Implement lazy loading for off-screen images.'
      );
    }

    if (domResources.imagesWithoutAlt > 0) {
      suggest(
        'accessibility', 'medium',
        `${domResources.imagesWithoutAlt} image${domResources.imagesWithoutAlt > 1 ? 's' : ''} missing alt text`,
        'Images without alt text fail WCAG 2.1 Level A and miss image search indexing opportunities. Screen readers cannot describe them.',
        'Add descriptive alt attributes:\n'
        + '  <img src="photo.jpg" alt="Team photo at 2024 conference">\n'
        + 'For purely decorative images: alt="" (empty, not missing).'
      );
    }

    if (domResources.largeImagesNoDimensions > 5) {
      suggest(
        'performance', 'medium',
        `${domResources.largeImagesNoDimensions} images lack explicit dimensions (CLS risk)`,
        'Images without width/height attributes cause layout shifts as they load, increasing CLS.',
        'Always specify dimensions:\n'
        + '  <img src="..." width="800" height="450" alt="...">\n'
        + 'Or use CSS aspect-ratio:\n'
        + '  img { aspect-ratio: 16/9; width: 100%; }'
      );
    }

    const lazyRatio = domResources.imagesWithLazyLoad / Math.max(1, domResources.totalImages);
    if (domResources.totalImages > 3 && lazyRatio < 0.5) {
      suggest(
        'performance', 'low',
        'Enable lazy loading for off-screen images',
        `Only ${domResources.imagesWithLazyLoad} of ${domResources.totalImages} images use lazy loading. `
        + `Off-screen images compete with critical resources during page load.`,
        'Add loading="lazy" to images not in the initial viewport:\n'
        + '  <img loading="lazy" src="photo.jpg" alt="...">\n'
        + 'Note: Do NOT lazy-load images above the fold (LCP candidate).'
      );
    }

    // ── Script suggestions ──────────────────────────────────────────────────
    if (domResources.renderBlockingScripts > 0) {
      suggest(
        'performance', 'high',
        `${domResources.renderBlockingScripts} render-blocking script${domResources.renderBlockingScripts > 1 ? 's' : ''} detected`,
        `${domResources.renderBlockingScripts} synchronous script${domResources.renderBlockingScripts > 1 ? 's' : ''} `
        + `in <head> pause HTML parsing and delay FCP. Each can add 100–500ms to load time.`,
        'Add defer or async to non-critical scripts:\n'
        + '  <script src="analytics.js" defer></script>\n'
        + '  <script src="widget.js" async></script>\n'
        + 'Use type="module" for ES modules (deferred by default).\n'
        + 'Move <script> tags to the end of <body> as a last resort.'
      );
    }

    const largeBundles = resources.scripts.filter((s) => s.decodedSize > 500_000);
    if (largeBundles.length > 0) {
      suggest(
        'performance', 'high',
        `${largeBundles.length} large JavaScript bundle${largeBundles.length > 1 ? 's' : ''} detected (> 500 KB)`,
        `Bundles larger than 500 KB have significant parse and compile costs, especially on mid-range mobile devices.`,
        'Use code splitting with dynamic imports:\n'
        + '  const module = await import("./heavy-feature.js");\n'
        + 'Enable tree-shaking in your bundler (webpack, Rollup, Vite).\n'
        + 'Target < 150 KB per route after gzip.'
      );
    }

    // ── Resource hints ──────────────────────────────────────────────────────
    if (domResources.resourceHints.preloads === 0 && resources.images.length > 0) {
      suggest(
        'performance', 'low',
        'No <link rel="preload"> hints found',
        'Preload hints tell the browser to fetch critical resources early, before they are discovered in HTML/CSS.',
        '<link rel="preload" as="image" href="hero.webp"> (above the fold images)\n'
        + '<link rel="preload" as="font" href="font.woff2" crossorigin> (self-hosted fonts)\n'
        + '<link rel="preload" as="style" href="critical.css">'
      );
    }

    // ── Network suggestions ─────────────────────────────────────────────────
    const slowXHR = resources.xhr.filter((r) => r.durationMs > 2000);
    if (slowXHR.length > 0) {
      suggest(
        'network', 'medium',
        `${slowXHR.length} slow API call${slowXHR.length > 1 ? 's' : ''} (> 2 seconds)`,
        'Slow network requests block rendering and increase TBT and TTI. Even non-render-blocking requests compete for bandwidth.',
        'Cache API responses with appropriate Cache-Control headers.\n'
        + 'Implement a Service Worker for network-first or cache-first strategies.\n'
        + 'Paginate/virtualise large data sets. Consider GraphQL to reduce over-fetching.'
      );
    }

    if (resources.totals.count > 80) {
      suggest(
        'network', 'medium',
        `High HTTP request count (${resources.totals.count} requests)`,
        `Too many requests increase overhead even on HTTP/2 (connection overhead, header compression limits). `
        + `Target < 50 requests for the critical path.`,
        'Bundle JS/CSS. Inline small SVGs. Use CSS sprites for icons.\n'
        + 'Audit third-party scripts — each external domain adds a DNS + TLS cost.'
      );
    }

    if (networkTiming && networkTiming.dnsMs > 200) {
      suggest(
        'network', 'low',
        `Slow DNS lookup (${networkTiming.dnsMs}ms)`,
        'DNS resolution time adds latency before any connection can be made. Target < 20ms.',
        'Use a fast DNS provider (Cloudflare 1.1.1.1, Google 8.8.8.8).\n'
        + 'Preconnect to critical third-party origins:\n'
        + '  <link rel="preconnect" href="https://fonts.googleapis.com">'
      );
    }

    // ── SEO suggestions ─────────────────────────────────────────────────────
    if (!seo.title || seo.titleLength < 10) {
      suggest('seo', 'high', 'Missing or very short page title',
        'The <title> tag is the most important on-page SEO signal and the text shown in search results.',
        '<title>Primary Keyword — Brand Name</title>\n'
        + 'Aim for 50–60 characters. Front-load primary keywords.'
      );
    } else if (seo.titleLength > 60) {
      suggest('seo', 'low', `Page title too long (${seo.titleLength} chars — will be truncated)`,
        'Google truncates titles beyond ~60 characters in SERPs, hiding key information from searchers.',
        'Shorten to 50–60 characters. Keep primary keywords near the beginning.'
      );
    }

    if (!seo.metaDescription) {
      suggest('seo', 'high', 'Missing meta description',
        'Meta descriptions influence click-through rates from search results. Without one, Google auto-generates a snippet from page content.',
        '<meta name="description" content="Compelling 150–160 character description of the page content.">'
      );
    } else if (seo.metaDescLength > 160) {
      suggest('seo', 'low', `Meta description too long (${seo.metaDescLength} chars)`,
        'Google truncates meta descriptions at ~160 characters.',
        'Trim your meta description to 150–160 characters.'
      );
    }

    if (seo.headings.h1 === 0) {
      suggest('seo', 'high', 'No H1 heading found',
        'H1 is the primary on-page SEO signal for topic relevance. Every page should have exactly one H1.',
        '<h1>Your Primary Keyword — Page Topic</h1>'
      );
    } else if (seo.headings.h1 > 1) {
      suggest('seo', 'medium', `Multiple H1 headings (${seo.headings.h1} found)`,
        'Multiple H1 tags dilute the topical signal and confuse both users and search crawlers.',
        'Use a single H1 for the main topic. Use H2–H6 for sub-sections.'
      );
    }

    if (!seo.viewport) {
      suggest('seo', 'high', 'Missing viewport meta tag',
        'Without a viewport tag, mobile browsers render at desktop width. This hurts mobile UX and mobile-first indexing.',
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
      );
    }

    if (!seo.canonical) {
      suggest('seo', 'low', 'No canonical tag',
        'Without canonicals, duplicate content across URLs (e.g., trailing slashes, query params) can split ranking signals.',
        '<link rel="canonical" href="https://example.com/current-page/">'
      );
    }

    const ogComplete = seo.openGraph.title && seo.openGraph.image && seo.openGraph.desc;
    if (!ogComplete) {
      suggest('seo', 'low', 'Incomplete Open Graph tags',
        'Open Graph tags control how pages appear when shared on social media (title, description, preview image).',
        '<meta property="og:title" content="Page Title">\n'
        + '<meta property="og:description" content="Description...">\n'
        + '<meta property="og:image" content="https://example.com/og-image.jpg">\n'
        + '<meta property="og:url" content="https://example.com/current-page/">\n'
        + 'Image should be 1200×630px.'
      );
    }

    if (!seo.twitter.card) {
      suggest('seo', 'low', 'Missing Twitter/X Card tags',
        'Twitter Card tags control how links appear when shared on X (Twitter).',
        '<meta name="twitter:card" content="summary_large_image">\n'
        + '<meta name="twitter:title" content="Page Title">\n'
        + '<meta name="twitter:image" content="https://example.com/twitter-image.jpg">'
      );
    }

    if (seo.structuredData === 0) {
      suggest('seo', 'low', 'No structured data (JSON-LD) found',
        'Structured data enables rich results in Google Search (star ratings, FAQ dropdowns, breadcrumbs).',
        '<script type="application/ld+json">\n'
        + '{"@context":"https://schema.org","@type":"WebPage","name":"Page Title"}\n'
        + '</script>'
      );
    }

    // ── Security & Best Practices ───────────────────────────────────────────
    if (!bestPractices.isHTTPS) {
      suggest('security', 'high', 'Page served over HTTP (not HTTPS)',
        'HTTP exposes users to man-in-the-middle attacks. Chrome shows "Not secure" warnings. HTTPS is a Google ranking factor.',
        'Obtain a free TLS certificate from Let\'s Encrypt (certbot) and redirect all HTTP → HTTPS:\n'
        + 'Strict-Transport-Security: max-age=31536000; includeSubDomains'
      );
    }

    if (!bestPractices.htmlLang) {
      suggest('accessibility', 'medium', 'Missing lang attribute on <html>',
        'Screen readers need the lang attribute to select correct pronunciation rules. Required for WCAG 2.1 Level A.',
        '<html lang="en">  (use the appropriate BCP 47 language code)'
      );
    }

    if (bestPractices.totalDeprecated > 0) {
      const tagList = Object.entries(bestPractices.deprecatedTags)
        .map(([tag, count]) => `<${tag}> ×${count}`)
        .join(', ');
      suggest('best-practices', 'low', 'Deprecated HTML elements detected',
        `Found: ${tagList}. Deprecated elements may render inconsistently across browsers and indicate unmaintained markup.`,
        'Replace with modern CSS equivalents:\n'
        + '<center> → CSS text-align: center\n'
        + '<font> → CSS font-family / color\n'
        + '<marquee> → CSS animation'
      );
    }

    if (!bestPractices.hasFavicon) {
      suggest('best-practices', 'low', 'No favicon configured',
        'Favicons appear in browser tabs and bookmarks. Missing one is a visible polish gap.',
        '<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n'
        + '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">'
      );
    }

    if (!bestPractices.hasManifest) {
      suggest('best-practices', 'low', 'No Web App Manifest linked',
        'A Web App Manifest enables "Add to Home Screen" on mobile and Progressive Web App features.',
        '<link rel="manifest" href="/manifest.json">'
      );
    }

    // Sort by impact priority: high → medium → low
    const ORDER = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => (ORDER[a.impact] ?? 3) - (ORDER[b.impact] ?? 3));

    return suggestions;
  }

  // ── Main Analysis Runner ──────────────────────────────────────────────────
  function runAnalysis() {
    const execute = () => {
      try {
        // ── CRITICAL FIX: snapshot() is called EXACTLY ONCE ──────────────
        // Previous version called it inside analyzeResources(), which
        // disconnected the LCP observer before the main call below. Now we
        // call it once here and pass the frozen result to sub-functions.
        const metrics = window.__PSA_Metrics
          ? window.__PSA_Metrics.snapshot()
          : {};

        const resources    = analyzeResources(metrics.fcp ?? null);
        const domResources = scanDOMResources();
        const networkTiming = analyzeNetwork();
        const seo           = auditSEO();
        const bestPractices = auditBestPractices();
        const score         = computeOverallScore(metrics);
        const suggestions   = generateSuggestions({
          metrics, resources, seo, bestPractices, domResources, networkTiming,
        });

        // Build per-metric ratings
        const metricRatings = {};
        for (const key of Object.keys(THRESHOLDS)) {
          metricRatings[key] = ratingFor(metrics[key], key);
        }

        const payload = {
          url:         location.href,
          title:       document.title,
          timestamp:   Date.now(),
          score,
          metrics,
          metricRatings,
          resources: {
            summary:     resources.totals,
            images:      resources.images.slice(0, 20),
            scripts:     resources.scripts.slice(0, 20),
            stylesheets: resources.stylesheets.slice(0, 20),
            fonts:       resources.fonts.slice(0, 20),
            xhr:         resources.xhr.slice(0, 20),
          },
          networkTiming,
          domResources,
          seo,
          bestPractices,
          suggestions,
        };

        chrome.runtime.sendMessage({ type: 'ANALYSIS_COMPLETE', payload });
      } catch (err) {
        chrome.runtime.sendMessage({
          type:    'ANALYSIS_COMPLETE',
          payload: {
            error:     err?.message ? String(err.message) : 'Analysis failed',
            score:     null,
            url:       location.href,
            timestamp: Date.now(),
          },
        });
      }
    };

    // Run during browser idle time to avoid impacting page performance
    if ('requestIdleCallback' in window) {
      requestIdleCallback(execute, { timeout: 4000 });
    } else {
      setTimeout(execute, 150);
    }
  }

  // ── Message listener (from popup or service worker) ───────────────────────
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'RUN_ANALYSIS') {
      runAnalysis();
      sendResponse({ ok: true });
    }
    return false;
  });

  // ── Auto-run based on stored settings ────────────────────────────────────
  // We read the autoScan setting before deciding whether to run automatically.
  function maybeAutoRun() {
    chrome.storage.local.get('settings', ({ settings }) => {
      if (settings?.autoScan === true) {
        setTimeout(runAnalysis, 600);
      }
    });
  }

  if (document.readyState === 'complete') {
    maybeAutoRun();
  } else {
    window.addEventListener('load', maybeAutoRun, { once: true });
  }
})();
