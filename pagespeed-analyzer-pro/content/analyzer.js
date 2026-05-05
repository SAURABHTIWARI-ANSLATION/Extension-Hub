/**
 * PageSpeed Analyzer Pro — Main Analyzer (content/analyzer.js)
 *
 * Runs inside the page context. Performs:
 *  1. Resource analysis  (images, scripts, stylesheets, fonts, XHR)
 *  2. DOM / SEO audit    (meta tags, headings, alt attributes, links)
 *  3. Render-blocking detection
 *  4. Composites a 0–100 performance score
 *  5. Generates actionable suggestions
 *  6. Sends results to the service worker
 *
 * Dependencies: content/metrics.js must be loaded first (window.__PSA_Metrics)
 */

(function installAnalyzer() {
  'use strict';

  // Guard against double-injection
  if (window.__PSA_Analyzer_Installed) return;
  window.__PSA_Analyzer_Installed = true;

  // ── Thresholds (Google Lighthouse 10 calibrated values) ─────────────────────
  const THRESHOLDS = {
    fcp:  { good: 1800,  poor: 3000  },  // ms
    lcp:  { good: 2500,  poor: 4000  },  // ms
    cls:  { good: 0.1,   poor: 0.25  },  // unitless
    fid:  { good: 100,   poor: 300   },  // ms
    ttfb: { good: 800,   poor: 1800  },  // ms
    tbt:  { good: 200,   poor: 600   },  // ms
    tti:  { good: 3800,  poor: 7300  },  // ms
  };

  // Lighthouse scoring weights (sum = 1.0)
  const WEIGHTS = {
    fcp:  0.10,
    lcp:  0.25,
    cls:  0.15,
    fid:  0.10,
    tbt:  0.30,
    tti:  0.10,
  };

  // ── Scoring helpers ──────────────────────────────────────────────────────────

  /**
   * Maps a raw metric value to a 0–1 sub-score using log-normal distribution
   * approximation (simplified piecewise linear for performance).
   */
  function metricScore(value, { good, poor }) {
    if (value === null || value === undefined) return null;
    if (value <= good) return 1;
    if (value >= poor) return 0;
    // Linear interpolation in the "needs improvement" band
    return 1 - (value - good) / (poor - good);
  }

  /** Applies Lighthouse-style log-normal curve to convert 0–1 to 0–100 */
  function curveScore(linear) {
    if (linear === null) return null;
    // Piecewise: top and bottom are compressed, middle is nearly linear
    if (linear >= 0.9) return Math.round(90 + linear * 10);
    return Math.round(linear * 100);
  }

  function computeOverallScore(metrics) {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const [key, weight] of Object.entries(WEIGHTS)) {
      const raw = metrics[key];
      if (raw === null || raw === undefined) continue;
      const linear = metricScore(raw, THRESHOLDS[key]);
      if (linear === null) continue;
      weightedSum  += linear * weight;
      totalWeight  += weight;
    }

    if (totalWeight === 0) return 50; // fallback
    return Math.min(100, Math.max(0, Math.round((weightedSum / totalWeight) * 100)));
  }

  function ratingFor(value, key) {
    if (value === null || value === undefined) return 'unknown';
    const t = THRESHOLDS[key];
    if (!t) return 'unknown';
    if (value <= t.good) return 'good';
    if (value <= t.poor) return 'average';
    return 'poor';
  }

  // ── Resource Analysis ────────────────────────────────────────────────────────

  function analyzeResources() {
    const entries = performance.getEntriesByType('resource');
    const resources = {
      images:      [],
      scripts:     [],
      stylesheets: [],
      fonts:       [],
      xhr:         [],
      other:       [],
      totals: { count: 0, transferBytes: 0, durationMs: 0 },
    };

    for (const entry of entries) {
      const r = {
        url:          entry.name,
        type:         entry.initiatorType,
        durationMs:   Math.round(entry.duration),
        transferSize: entry.transferSize || 0,
        encodedSize:  entry.encodedBodySize || 0,
        decodedSize:  entry.decodedBodySize || 0,
        startTime:    Math.round(entry.startTime),
        renderBlocking: false, // enriched below
      };

      resources.totals.count       += 1;
      resources.totals.transferBytes += r.transferSize;
      resources.totals.durationMs  += r.durationMs;

      switch (entry.initiatorType) {
        case 'img':    resources.images.push(r);      break;
        case 'script': resources.scripts.push(r);     break;
        case 'css':    resources.stylesheets.push(r); break;
        case 'link':
          if (entry.name.match(/\.(woff2?|ttf|otf|eot)/i)) {
            resources.fonts.push(r);
          } else if (entry.name.match(/\.css/i)) {
            resources.stylesheets.push(r);
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

    // Mark render-blocking: scripts/stylesheets loaded synchronously before FCP
    const fcp = window.__PSA_Metrics?.snapshot()?.fcp ?? Infinity;
    for (const s of resources.scripts) {
      if (s.startTime < fcp && s.durationMs > 0) s.renderBlocking = true;
    }
    for (const s of resources.stylesheets) {
      if (s.startTime < fcp) s.renderBlocking = true;
    }

    // Sort each category by size descending
    const bySize = (a, b) => b.decodedSize - a.decodedSize;
    resources.images.sort(bySize);
    resources.scripts.sort(bySize);
    resources.stylesheets.sort(bySize);
    resources.fonts.sort(bySize);

    return resources;
  }

  // ── DOM Resource Hints ───────────────────────────────────────────────────────

  function scanDOMResources() {
    const scripts    = Array.from(document.querySelectorAll('script[src]'));
    const links      = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const images     = Array.from(document.querySelectorAll('img'));

    const renderBlockingScripts = scripts.filter(
      (s) => !s.defer && !s.async && !s.type?.includes('module')
    );
    const largeImagesWithoutDimensions = images.filter(
      (img) => !img.width && !img.height && !img.hasAttribute('width') && !img.hasAttribute('height')
    );
    const imagesWithoutAlt = images.filter((img) => !img.alt);
    const imagesWithLazyLoad = images.filter((img) => img.loading === 'lazy');

    return {
      totalImages:              images.length,
      imagesWithoutAlt:         imagesWithoutAlt.length,
      imagesWithLazyLoad:       imagesWithLazyLoad.length,
      largeImagesNoDimensions:  largeImagesWithoutDimensions.length,
      renderBlockingScripts:    renderBlockingScripts.length,
      renderBlockingStylesheets: links.length,
      scriptDetails: renderBlockingScripts.slice(0, 10).map((s) => ({
        src:   s.src,
        defer: s.defer,
        async: s.async,
        type:  s.type || 'text/javascript',
      })),
    };
  }

  // ── SEO Audit ────────────────────────────────────────────────────────────────

  function auditSEO() {
    const title       = document.title || '';
    const metaDesc    = document.querySelector('meta[name="description"]');
    const canonical   = document.querySelector('link[rel="canonical"]');
    const ogTitle     = document.querySelector('meta[property="og:title"]');
    const ogDesc      = document.querySelector('meta[property="og:description"]');
    const ogImage     = document.querySelector('meta[property="og:image"]');
    const viewport    = document.querySelector('meta[name="viewport"]');
    const robots      = document.querySelector('meta[name="robots"]');
    const charset     = document.querySelector('meta[charset]') || document.querySelector('meta[http-equiv="Content-Type"]');

    // Headings
    const headings = {};
    for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
      headings[tag] = document.querySelectorAll(tag).length;
    }

    // Structured data
    const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

    // Links
    const allLinks      = document.querySelectorAll('a[href]');
    const externalLinks = Array.from(allLinks).filter(
      (a) => a.hostname && a.hostname !== location.hostname
    );
    const nofollowLinks = Array.from(allLinks).filter(
      (a) => (a.rel || '').includes('nofollow')
    );

    return {
      title:             title,
      titleLength:       title.length,
      metaDescription:   metaDesc?.content || null,
      metaDescLength:    metaDesc?.content?.length ?? 0,
      canonical:         canonical?.href || null,
      viewport:          viewport?.content || null,
      robots:            robots?.content || null,
      hasCharset:        !!charset,
      openGraph: {
        title:  ogTitle?.content  || null,
        desc:   ogDesc?.content   || null,
        image:  ogImage?.content  || null,
      },
      headings,
      structuredData:    jsonLdScripts.length,
      totalLinks:        allLinks.length,
      externalLinks:     externalLinks.length,
      nofollowLinks:     nofollowLinks.length,
    };
  }

  // ── Best Practices Audit ─────────────────────────────────────────────────────

  function auditBestPractices() {
    const isHTTPS      = location.protocol === 'https:';
    const hasDoctype   = document.doctype !== null;
    const htmlLang     = document.documentElement.lang || null;
    const faviconLink  = document.querySelector('link[rel*="icon"]');
    const consoleErrors = []; // Cannot access console errors from content script directly
    const touchIcons   = document.querySelectorAll('link[rel="apple-touch-icon"]').length;
    const themeColor   = document.querySelector('meta[name="theme-color"]')?.content || null;
    const hasManifest  = !!document.querySelector('link[rel="manifest"]');
    const deprecatedTags = ['center', 'font', 'marquee', 'blink', 'frame', 'frameset'].reduce(
      (acc, tag) => { acc[tag] = document.querySelectorAll(tag).length; return acc; }, {}
    );
    const totalDeprecated = Object.values(deprecatedTags).reduce((a, b) => a + b, 0);

    return {
      isHTTPS,
      hasDoctype,
      htmlLang,
      hasFavicon:       !!faviconLink,
      hasAppleTouchIcon: touchIcons > 0,
      themeColor,
      hasManifest,
      deprecatedTags,
      totalDeprecated,
    };
  }

  // ── Suggestions Engine ───────────────────────────────────────────────────────

  /**
   * Generates structured suggestions from analysis results.
   * Each suggestion: { id, category, impact, title, description, fix }
   */
  function generateSuggestions({ metrics, resources, seo, bestPractices, domResources }) {
    const suggestions = [];
    let _id = 0;
    const suggest = (category, impact, title, description, fix) => {
      suggestions.push({ id: _id++, category, impact, title, description, fix });
    };

    // ── Performance suggestions ─────────────────────────────────────────────
    if (metrics.lcp !== null && metrics.lcp > THRESHOLDS.lcp.good) {
      suggest(
        'performance', metrics.lcp > THRESHOLDS.lcp.poor ? 'high' : 'medium',
        'Improve Largest Contentful Paint (LCP)',
        `LCP is ${metrics.lcp}ms. Google recommends ≤ 2500ms. A slow LCP hurts user perception and SEO ranking.`,
        'Optimise your hero image (use WebP/AVIF, preload it), eliminate render-blocking resources, and use a CDN.'
      );
    }

    if (metrics.cls !== null && metrics.cls > THRESHOLDS.cls.good) {
      suggest(
        'performance', metrics.cls > THRESHOLDS.cls.poor ? 'high' : 'medium',
        'Reduce Cumulative Layout Shift (CLS)',
        `CLS score is ${metrics.cls}. Acceptable is ≤ 0.1. Layout shifts frustrate users and lower engagement.`,
        'Set explicit width/height on images and embeds. Avoid inserting content above existing content. Use CSS transform for animations.'
      );
    }

    if (metrics.fcp !== null && metrics.fcp > THRESHOLDS.fcp.good) {
      suggest(
        'performance', metrics.fcp > THRESHOLDS.fcp.poor ? 'high' : 'medium',
        'Optimise First Contentful Paint (FCP)',
        `FCP is ${metrics.fcp}ms. Target: ≤ 1800ms. Slow FCP signals that the server or critical resources are bottlenecking render.`,
        'Reduce server response time (TTFB), eliminate render-blocking CSS/JS, inline critical CSS, and use resource hints (preload, preconnect).'
      );
    }

    if (metrics.tbt !== null && metrics.tbt > THRESHOLDS.tbt.good) {
      suggest(
        'performance', metrics.tbt > THRESHOLDS.tbt.poor ? 'high' : 'medium',
        'Reduce Total Blocking Time (TBT)',
        `TBT is ${metrics.tbt}ms (target ≤ 200ms). Long tasks on the main thread delay interactivity.`,
        'Break up long JavaScript tasks using setTimeout/scheduler.postTask. Defer non-critical JS. Move heavy computation to Web Workers.'
      );
    }

    if (metrics.ttfb !== null && metrics.ttfb > THRESHOLDS.ttfb.good) {
      suggest(
        'performance', metrics.ttfb > THRESHOLDS.ttfb.poor ? 'high' : 'medium',
        'Improve Time to First Byte (TTFB)',
        `TTFB is ${metrics.ttfb}ms. Good TTFB is ≤ 800ms. This indicates slow server processing or a missing CDN.`,
        'Use a CDN with edge caching, enable HTTP/2 or HTTP/3, implement server-side caching, and reduce redirect chains.'
      );
    }

    // ── Image suggestions ───────────────────────────────────────────────────
    const largeImages = resources.images.filter((img) => img.decodedSize > 100 * 1024);
    if (largeImages.length > 0) {
      suggest(
        'images', 'high',
        `Compress ${largeImages.length} oversized image${largeImages.length > 1 ? 's' : ''}`,
        `${largeImages.length} image${largeImages.length > 1 ? 's exceed' : ' exceeds'} 100 KB. Large images are the most common cause of slow LCP.`,
        'Convert to WebP or AVIF (30–50% smaller). Use responsive images with srcset. Implement lazy loading for off-screen images.'
      );
    }

    if (domResources.imagesWithoutAlt > 0) {
      suggest(
        'accessibility', 'medium',
        `Add alt text to ${domResources.imagesWithoutAlt} image${domResources.imagesWithoutAlt > 1 ? 's' : ''}`,
        'Images without alt attributes hurt accessibility (WCAG 2.1) and lose image search indexing opportunities.',
        'Add descriptive alt attributes: <img src="..." alt="Descriptive text about the image">. Use alt="" for purely decorative images.'
      );
    }

    if (domResources.largeImagesNoDimensions > 0) {
      suggest(
        'performance', 'medium',
        'Specify width/height on images to prevent layout shift',
        `${domResources.largeImagesNoDimensions} image${domResources.largeImagesNoDimensions > 1 ? 's' : ''} lack explicit dimensions, causing layout shifts (CLS) as they load.`,
        'Always set width and height attributes: <img src="..." width="800" height="450" alt="...">. Or use CSS aspect-ratio.'
      );
    }

    if (resources.images.length > 0 && domResources.imagesWithLazyLoad < resources.images.length - 3) {
      suggest(
        'performance', 'low',
        'Enable lazy loading for below-the-fold images',
        'Off-screen images are downloaded eagerly, wasting bandwidth and competing with critical resources.',
        'Add loading="lazy" to images not visible in the initial viewport: <img loading="lazy" src="..." alt="...">.'
      );
    }

    // ── Script suggestions ──────────────────────────────────────────────────
    if (domResources.renderBlockingScripts > 0) {
      suggest(
        'performance', 'high',
        `${domResources.renderBlockingScripts} render-blocking script${domResources.renderBlockingScripts > 1 ? 's' : ''} detected`,
        'Synchronous scripts in <head> pause HTML parsing and delay FCP/LCP. Each one adds hundreds of ms to page load.',
        'Add async or defer attribute to non-critical scripts. Use type="module" for ES modules (deferred by default).\n\nExample: <script src="app.js" defer></script>'
      );
    }

    if (resources.scripts.some((s) => s.decodedSize > 500 * 1024)) {
      suggest(
        'performance', 'high',
        'Large JavaScript bundles detected',
        'JavaScript bundles > 500 KB significantly increase parse/compile time, especially on mobile.',
        'Use code splitting (dynamic import()), tree-shaking, and bundle analysis tools like webpack-bundle-analyzer. Target < 150 KB per route.'
      );
    }

    // ── Network suggestions ─────────────────────────────────────────────────
    const slowRequests = resources.xhr.filter((r) => r.durationMs > 2000);
    if (slowRequests.length > 0) {
      suggest(
        'network', 'medium',
        `${slowRequests.length} slow API request${slowRequests.length > 1 ? 's' : ''} (> 2 seconds)`,
        'Slow network requests block rendering and interaction, increasing TBT and TTI.',
        'Implement request caching (HTTP Cache-Control, Service Worker). Use pagination/virtualisation for large datasets. Consider GraphQL to reduce over-fetching.'
      );
    }

    if (resources.totals.count > 80) {
      suggest(
        'network', 'medium',
        `High resource count (${resources.totals.count} requests)`,
        'Too many HTTP requests increase connection overhead even on HTTP/2.',
        'Bundle CSS and JS. Use CSS sprites or icon fonts. Inline small SVGs. Audit and remove unused third-party scripts.'
      );
    }

    // ── SEO suggestions ─────────────────────────────────────────────────────
    if (!seo.title || seo.titleLength < 10) {
      suggest('seo', 'high', 'Missing or very short page title',
        'The <title> tag is a primary ranking signal and the text shown in search results.',
        'Add a descriptive title of 50–60 characters: <title>Primary Keyword — Brand Name</title>'
      );
    } else if (seo.titleLength > 60) {
      suggest('seo', 'low', 'Page title too long (will be truncated in SERPs)',
        `Title is ${seo.titleLength} chars. Google truncates titles > ~60 characters in search results.`,
        'Shorten your title to 50–60 characters. Keep primary keywords near the beginning.'
      );
    }

    if (!seo.metaDescription) {
      suggest('seo', 'high', 'Missing meta description',
        'Meta descriptions appear as the snippet in search results and significantly influence click-through rates.',
        'Add: <meta name="description" content="Compelling 150–160 character description of the page.">'
      );
    } else if (seo.metaDescLength > 160) {
      suggest('seo', 'low', 'Meta description too long',
        `Description is ${seo.metaDescLength} chars. Google truncates at ~160 characters.`,
        'Trim your meta description to 150–160 characters for full display in SERPs.'
      );
    }

    if (seo.headings.h1 === 0) {
      suggest('seo', 'high', 'No H1 heading found',
        'H1 is the most important on-page SEO signal. Search engines use it to understand page topic.',
        'Add exactly one H1 tag per page: <h1>Your Primary Keyword Here</h1>'
      );
    } else if (seo.headings.h1 > 1) {
      suggest('seo', 'medium', `Multiple H1 headings (${seo.headings.h1} found)`,
        'Having multiple H1 tags dilutes the topical signal and confuses crawlers.',
        'Use a single H1 for the main topic. Use H2–H6 for sub-sections.'
      );
    }

    if (!seo.viewport) {
      suggest('seo', 'high', 'Missing viewport meta tag',
        'Without a viewport meta tag, mobile browsers render the page at desktop width, harming UX and mobile rankings.',
        'Add: <meta name="viewport" content="width=device-width, initial-scale=1">'
      );
    }

    if (!seo.canonical) {
      suggest('seo', 'low', 'No canonical tag',
        'Without a canonical tag, duplicate content across URLs can split ranking signals.',
        'Add: <link rel="canonical" href="https://example.com/current-page/">'
      );
    }

    if (!seo.openGraph.title || !seo.openGraph.image) {
      suggest('seo', 'low', 'Incomplete Open Graph tags',
        'Open Graph tags control how pages appear when shared on social media.',
        'Add og:title, og:description, og:image (1200×630px), and og:url meta tags.'
      );
    }

    // ── Best Practices ──────────────────────────────────────────────────────
    if (!bestPractices.isHTTPS) {
      suggest('security', 'high', 'Page served over HTTP (not HTTPS)',
        'HTTP is insecure and causes Chrome to show a "Not secure" warning. Also a Google ranking factor.',
        'Obtain a free TLS certificate from Let\'s Encrypt and redirect all HTTP → HTTPS.'
      );
    }

    if (!bestPractices.htmlLang) {
      suggest('accessibility', 'medium', 'Missing lang attribute on <html>',
        'Screen readers need the lang attribute to use correct pronunciation rules.',
        'Add: <html lang="en"> (use the appropriate BCP47 language code).'
      );
    }

    if (bestPractices.totalDeprecated > 0) {
      const tagList = Object.entries(bestPractices.deprecatedTags)
        .filter(([, count]) => count > 0)
        .map(([tag, count]) => `<${tag}> ×${count}`)
        .join(', ');
      suggest('best-practices', 'low', 'Deprecated HTML elements detected',
        `Found: ${tagList}. Deprecated elements may render inconsistently and signal poor code quality.`,
        'Replace deprecated elements with modern CSS equivalents.'
      );
    }

    if (!bestPractices.hasFavicon) {
      suggest('best-practices', 'low', 'No favicon configured',
        'Favicons appear in browser tabs and bookmark lists — a small but visible polish signal.',
        'Add: <link rel="icon" type="image/svg+xml" href="/favicon.svg"> (prefer SVG for crispness at all sizes).'
      );
    }

    // Sort by impact: high → medium → low
    const impactOrder = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => (impactOrder[a.impact] ?? 3) - (impactOrder[b.impact] ?? 3));

    return suggestions;
  }

  // ── Main Analysis Runner ─────────────────────────────────────────────────────

  function runAnalysis() {
    // Use requestIdleCallback if available, otherwise run immediately
    const run = () => {
      try {
        const metrics      = window.__PSA_Metrics ? window.__PSA_Metrics.snapshot() : {};
        const resources    = analyzeResources();
        const domResources = scanDOMResources();
        const seo          = auditSEO();
        const bestPractices = auditBestPractices();
        const score        = computeOverallScore(metrics);
        const suggestions  = generateSuggestions({ metrics, resources, seo, bestPractices, domResources });

        // Build metric ratings
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
          resources:   {
            summary: resources.totals,
            images:      resources.images.slice(0, 20),
            scripts:     resources.scripts.slice(0, 20),
            stylesheets: resources.stylesheets.slice(0, 20),
            fonts:       resources.fonts.slice(0, 20),
            xhr:         resources.xhr.slice(0, 20),
          },
          domResources,
          seo,
          bestPractices,
          suggestions,
        };

        // Send to service worker
        chrome.runtime.sendMessage({ type: 'ANALYSIS_COMPLETE', payload });
      } catch (err) {
        console.error('[PSA] Analysis error:', err.message, err.stack);
        chrome.runtime.sendMessage({
          type:    'ANALYSIS_COMPLETE',
          payload: { error: err.message, score: null, url: location.href, timestamp: Date.now() },
        });
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(run, { timeout: 3000 });
    } else {
      setTimeout(run, 100);
    }
  }

  // ── Message listener (from popup or service worker) ──────────────────────────
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'RUN_ANALYSIS') {
      runAnalysis();
      sendResponse({ ok: true });
    }
    return false;
  });

  // ── Auto-run after page is fully loaded ─────────────────────────────────────
  if (document.readyState === 'complete') {
    // Page already loaded — wait a tick for metrics observers to settle
    setTimeout(runAnalysis, 500);
  } else {
    window.addEventListener('load', () => setTimeout(runAnalysis, 500), { once: true });
  }
})();
