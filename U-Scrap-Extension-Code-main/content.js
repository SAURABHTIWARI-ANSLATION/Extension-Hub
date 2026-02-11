// content.js — Deep & Powerful Web Scraper
(() => {
  // --- Configuration & State ---
  const CONFIG = {
    SCROLL_DELAY: 500,
    MAX_SCROLLS: 20, // Limit auto-scroll to avoid infinite loops
    MIN_TEXT_LENGTH: 3,
    TIMEOUT: 15000, // 15s timeout for operations
    MAX_PARAGRAPHS: 1000,
    MAX_HEADINGS: 500,
    MAX_VIDEOS: 100,
    MAX_AUDIOS: 50,
    MAX_TABLES: 20,
    MAX_FORMS: 50,
    MAX_EMAILS: 100,
    EMAIL_SCAN_TEXT_LIMIT: 500000 // 500KB text limit for email regex
  };

  let state = {
    isScraping: false,
    scrolledCount: 0,
    activeIntervals: [],
    activeTimeouts: []
  };

  // --- Core Utilities ---

  /**
   * Safe text extraction with whitespace normalization
   */
  const getText = (el) => {
    if (!el) return "";
    // Handle inputs/textareas
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return el.value || "";
    // Handle images with alt
    if (el.tagName === 'IMG') return el.alt || "";

    return (el.innerText || el.textContent || "")
      .replace(/[\n\r\t]+/g, " ") // Replace newlines/tabs with space
      .replace(/\s{2,}/g, " ")   // Collapse multiple spaces
      .trim();
  };

  /**
   * Check if an element is genuinely visible to the user
   */
  const isVisible = (el) => {
    if (!el) return false;
    // Fast checks
    if (el.style && (el.style.display === 'none' || el.style.visibility === 'hidden')) return false;
    if (el.hasAttribute('hidden')) return false;

    // Expensive check
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight * 2; // Allow some off-screen buffer
  };

  /**
   * Get absolute URL from relative path
   */
  const getAbsoluteUrl = (url) => {
    if (!url) return "";
    try {
      return new URL(url, window.location.href).href;
    } catch (e) {
      return url;
    }
  };

  // --- Deep Extraction Modules ---

  const Extractors = {

    /**
     * Extract Page Metadata (SEO, OpenGraph, Twitter, JSON-LD)
     */
    metadata: (doc) => {
      const meta = {
        title: doc.title,
        url: window.location.href,
        domain: window.location.hostname,
        description: "",
        keywords: [],
        author: "",
        openGraph: {},
        twitter: {},
        jsonLd: []
      };

      // Standard Meta Tags
      const descEl = doc.querySelector('meta[name="description"]');
      if (descEl) meta.description = descEl.content;

      const keywordsEl = doc.querySelector('meta[name="keywords"]');
      if (keywordsEl) meta.keywords = keywordsEl.content.split(',').map(k => k.trim());

      const authorEl = doc.querySelector('meta[name="author"]');
      if (authorEl) meta.author = authorEl.content;

      // OpenGraph & Twitter
      doc.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').forEach(tag => {
        const key = tag.getAttribute('property') || tag.getAttribute('name');
        const value = tag.getAttribute('content');
        if (key && value) {
          if (key.startsWith('og:')) meta.openGraph[key.replace('og:', '')] = value;
          if (key.startsWith('twitter:')) meta.twitter[key.replace('twitter:', '')] = value;
        }
      });

      // JSON-LD Structured Data
      doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
        try {
          const json = JSON.parse(script.textContent);
          meta.jsonLd.push(json);
        } catch (e) {
          // Ignore parse errors
        }
      });

      return meta;
    },

    /**
     * Extract Main Content Text (Smart heuristic)
     */
    content: (doc) => {
      // Try to find the main article/content container
      const candidates = ['article', 'main', '[role="main"]', '#content', '.content', '.post', '.article'];
      let mainEl = null;

      for (const selector of candidates) {
        const el = doc.querySelector(selector);
        if (el && isVisible(el) && el.innerText.length > 200) {
          mainEl = el;
          break;
        }
      }

      // Fallback to body if no main container found
      const target = mainEl || doc.body;

      // Extract paragraphs (performance limit: max 1000)
      const paragraphs = Array.from(target.querySelectorAll('p'))
        .filter(p => isVisible(p))
        .map(p => getText(p))
        .filter(t => t.length > CONFIG.MIN_TEXT_LENGTH)
        .slice(0, CONFIG.MAX_PARAGRAPHS);

      // Extract headers (performance limit: max 500)
      const headings = Array.from(target.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .filter(h => isVisible(h))
        .map(h => ({
          tag: h.tagName.toLowerCase(),
          text: getText(h)
        }))
        .slice(0, CONFIG.MAX_HEADINGS);

      return {
        hasMainContainer: !!mainEl,
        headings,
        paragraphs,
        fullText: getText(target).substring(0, 50000) // Limit to 50k chars
      };
    },

    /**
     * Extract Links (Internal, External, Social, Emails)
     */
    links: (doc) => {
      const allLinks = Array.from(doc.querySelectorAll('a[href]'));
      const origin = window.location.origin;

      const internal = new Set();
      const external = new Set();
      const social = new Set();
      const emails = new Set();
      const phones = new Set();

      // Common social domains
      const socialDomains = ['facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'youtube.com', 'pinterest.com', 'tiktok.com'];

      allLinks.forEach(a => {
        const href = a.href.trim();
        if (!href || href.startsWith('javascript:')) return;

        if (href.startsWith('mailto:')) {
          emails.add(href.replace('mailto:', ''));
        } else if (href.startsWith('tel:')) {
          phones.add(href.replace('tel:', ''));
        } else {
          try {
            const urlObj = new URL(href);
            if (socialDomains.some(d => urlObj.hostname.includes(d))) {
              social.add(href);
            } else if (urlObj.origin === origin) {
              internal.add(href);
            } else {
              external.add(href);
            }
          } catch (e) {
            // Invalid URL
          }
        }
      });

      // Regex for emails in text (with performance safeguard)
      const text = doc.body.innerText;
      // Only scan for emails if text is reasonable length (prevent regex freeze)
      if (text.length < CONFIG.EMAIL_SCAN_TEXT_LIMIT) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const foundEmails = text.match(emailRegex) || [];
        foundEmails.slice(0, CONFIG.MAX_EMAILS).forEach(e => emails.add(e));
      }

      return {
        internal: Array.from(internal).slice(0, 500),
        external: Array.from(external).slice(0, 500),
        social: Array.from(social),
        emails: Array.from(emails),
        phones: Array.from(phones)
      };
    },

    /**
     * Extract Media (Images, Videos, Audios)
     */
    media: (doc) => {
      const images = Array.from(doc.querySelectorAll('img'))
        .filter(img => isVisible(img) && img.naturalWidth > 50 && img.naturalHeight > 50)
        .map(img => ({
          src: getAbsoluteUrl(img.currentSrc || img.src || img.dataset.src), // Handle lazy load
          alt: img.alt || "",
          width: img.naturalWidth,
          height: img.naturalHeight
        })).slice(0, 100);

      const videos = Array.from(doc.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]'))
        .map(v => ({
          src: getAbsoluteUrl(v.src || v.currentSrc),
          poster: getAbsoluteUrl(v.poster),
          type: v.tagName.toLowerCase()
        }))
        .slice(0, CONFIG.MAX_VIDEOS);

      const audios = Array.from(doc.querySelectorAll('audio'))
        .map(a => ({
          src: getAbsoluteUrl(a.src || a.currentSrc)
        }))
        .slice(0, CONFIG.MAX_AUDIOS);

      return { images, videos, audios };
    },

    /**
     * Extract Tables
     */
    tables: (doc) => {
      return Array.from(doc.querySelectorAll('table'))
        .slice(0, CONFIG.MAX_TABLES)
        .map(table => {
          const rows = Array.from(table.querySelectorAll('tr'));
          return rows.map(row => {
            return Array.from(row.querySelectorAll('td, th')).map(cell => getText(cell));
          }).filter(row => row.some(cell => cell)); // Remove empty rows
        })
        .filter(table => table.length > 0);
    },

    /**
     * Extract Forms (Inputs)
     */
    forms: (doc) => {
      return Array.from(doc.querySelectorAll('form'))
        .slice(0, CONFIG.MAX_FORMS)
        .map(form => ({
          action: form.action,
          method: form.method,
          inputs: Array.from(form.querySelectorAll('input, select, textarea')).map(input => ({
            name: input.name || input.id,
            type: input.type,
            placeholder: input.placeholder,
            required: input.required
          }))
        }));
    }
  };

  // --- Main Logic ---

  /**
   * Run the full extraction process
   */
  async function performDeepScrape(settings = {}) {
    console.log("Starting Deep Scrape...");

    // Helper to send progress
    const reportProgress = (step, percent) => {
      chrome.runtime.sendMessage({
        action: "scrapingProgress",
        progress: { current: percent, total: 100, step }
      }).catch(() => { }); // Ignore errors if popup closed
    };

    // Timeout safeguard: abort scraping if it takes too long
    const timeoutPromise = new Promise((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Scraping timeout: operation took longer than 15 seconds'));
      }, CONFIG.TIMEOUT);
      state.activeTimeouts.push(timeoutId);
    });

    const scrapePromise = (async () => {
      reportProgress("Initializing", 10);

      // Auto-scroll if requested
      if (settings.autoscroll) {
        reportProgress("Auto-scrolling", 20);
        await autoScroll();
      }

      reportProgress("Analyzing DOM", 40);
      const doc = document;

      // Run all extractors
      const data = {
        ...Extractors.metadata(doc),
        ...Extractors.content(doc),
        links: Extractors.links(doc),
        ...Extractors.media(doc),
        tables: Extractors.tables(doc),
        forms: Extractors.forms(doc),
        scrapedAt: new Date().toISOString()
      };

      reportProgress("Finalizing", 90);
      console.log("Deep Scrape Complete:", data);

      reportProgress("Complete", 100);
      return data;
    })();

    // Race between scrape and timeout
    return await Promise.race([scrapePromise, timeoutPromise]);
  }

  /**
   * Auto-scroll helper
   */
  async function autoScroll() {
    return new Promise((resolve) => {
      let totalHeight = 0;
      let distance = 100;
      let scrolls = 0;

      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        scrolls++;

        // Strictly enforce MAX_SCROLLS limit (prevent infinite scroll)
        if (totalHeight >= scrollHeight || scrolls >= CONFIG.MAX_SCROLLS) {
          clearInterval(timer);
          // Remove from active intervals
          const index = state.activeIntervals.indexOf(timer);
          if (index > -1) state.activeIntervals.splice(index, 1);
          window.scrollTo(0, 0); // Return to top
          resolve();
        }
      }, 100);

      // Track interval for cleanup
      state.activeIntervals.push(timer);
    });
  }

  // --- Message Listener ---

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Ping for connection check
    if (request.action === "ping") {
      sendResponse({ status: "alive" });
      return;
    }

    if (request.action === "startScraping") {
      if (state.isScraping) {
        sendResponse({ error: "Scraping already in progress" });
        return;
      }

      state.isScraping = true;

      // Use setTimeout to allow the response to return 'true' first (async pattern)
      performDeepScrape(request.settings || {})
        .then(data => {
          state.isScraping = false;
          sendResponse({ success: true, data: [data] }); // Wrap in array to match expected format
        })
        .catch(err => {
          state.isScraping = false;
          console.error("Scraping Failed:", err);
          sendResponse({ success: false, error: err.message });
        });

      return true; // Indicates we will respond asynchronously
    }

    if (request.action === "stopScraping") {
      state.isScraping = false;

      // Cancel all active intervals and timeouts
      state.activeIntervals.forEach(clearInterval);
      state.activeTimeouts.forEach(clearTimeout);
      state.activeIntervals = [];
      state.activeTimeouts = [];

      sendResponse({ success: true });
    }
  });

  console.log("U-Scraper: Deep Content Script Loaded");

})();
