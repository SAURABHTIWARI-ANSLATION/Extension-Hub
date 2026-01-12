// content.js — Enhanced FULL PAGE deep scraper with autoscroll + idle wait + speed control
(() => {
  let isScrapingActive = false;
  let scrapedItems = [];
  let currentScrapeType = "full-page";
  let currentScrapeSpeed = "medium";

  // Speed settings (delay in ms)
  const speedSettings = {
    slow: 1000,
    medium: 500,
    fast: 200
  };

  // Messaging helpers
  function sendMessage(payload) {
    try { chrome.runtime.sendMessage(payload); } catch (e) {}
  }
  function sendProgress(current, total) {
    sendMessage({ action: "scrapingProgress", progress: { current, total } });
  }

  // ===== Utilities =====
  const text = (el) => (el ? (el.textContent || "").trim() : "");
  const getAttr = (el, a) => (el ? el.getAttribute(a) || "" : "");

  // Visibility check
  function isVisible(el) {
    if (!el || el.nodeType !== 1) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    if (rect.bottom < 0 || rect.top > (window.innerHeight || 0) + 200) {
      // allow offscreen a bit for virtualized lists
    }
    return true;
  }

  // Text walker (captures visible text nodes, includes shadow DOM)
  function collectVisibleText(root = document) {
    const chunks = [];

    function walk(node) {
      // Traverse shadow DOM if present
      if (node && node.shadowRoot) {
        walk(node.shadowRoot);
      }

      // For roles/regions that often contain dynamic content
      if (
        node instanceof Element &&
        ["main","article","section","div"].includes(node.tagName.toLowerCase())
      ) {
        const role = (node.getAttribute("role") || "").toLowerCase();
        const isFeed = role === "feed" || role === "log" || role === "main" || role === "region";
        if (isFeed && isVisible(node)) {
          const tw = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
            acceptNode: (t) => {
              const parent = t.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              if (!isVisible(parent)) return NodeFilter.FILTER_REJECT;
              const val = (t.nodeValue || "").replace(/\s+/g, " ").trim();
              if (val.length < 2) return NodeFilter.FILTER_REJECT;
              return NodeFilter.FILTER_ACCEPT;
            }
          });
          let n;
          while ((n = tw.nextNode())) {
            chunks.push((n.nodeValue || "").replace(/\s+/g, " ").trim());
          }
        }
      }
    }

    walk(document.documentElement);

    // fallback: whole doc tree (still visibility aware)
    const twAll = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT, {
      acceptNode: (t) => {
        const p = t.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (!isVisible(p)) return NodeFilter.FILTER_REJECT;
        const s = (t.nodeValue || "").replace(/\s+/g, " ").trim();
        if (s.length < 2) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let n;
    while ((n = twAll.nextNode())) {
      const s = (n.nodeValue || "").replace(/\s+/g, " ").trim();
      chunks.push(s);
      if (chunks.length > 20000) break; // hard cap to avoid runaway on huge pages
    }

    // de-dup neighboring repeats
    const result = [];
    for (let i = 0; i < chunks.length; i++) {
      if (i === 0 || chunks[i] !== chunks[i - 1]) result.push(chunks[i]);
    }
    return result.join("\n");
  }

  // Parse LD+JSON safely
  function parseLdJson(doc) {
    return Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
      .map((s) => {
        try { return JSON.parse(s.textContent || "{}"); } catch { return null; }
      })
      .filter(Boolean);
  }

  // Extract full page structured object
  function extractFullPage(doc, url) {
    const meta = {};
    doc.querySelectorAll("meta[name], meta[property]").forEach((m) => {
      const k = (m.getAttribute("name") || m.getAttribute("property") || "").toLowerCase();
      if (k) meta[k] = getAttr(m, "content");
    });

    const headings = Array.from(doc.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((h) => ({
      tag: h.tagName.toLowerCase(),
      text: text(h).slice(0, 500)
    }));

    const paragraphs = Array.from(doc.querySelectorAll("p"))
      .map((p) => text(p))
      .filter((t) => t && t.split(" ").length >= 5)
      .slice(0, 500);

    const lists = Array.from(doc.querySelectorAll("ul,ol")).slice(0, 100).map((list) => {
      const items = Array.from(list.querySelectorAll(":scope > li")).map((li) => text(li)).filter(Boolean);
      return items.slice(0, 300);
    });

    const tables = Array.from(doc.querySelectorAll("table")).slice(0, 50).map((table) => {
      const rows = Array.from(table.querySelectorAll("tr")).map((tr) =>
        Array.from(tr.querySelectorAll("th,td")).map((td) => text(td))
      );
      return rows.slice(0, 400);
    });

    const images = Array.from(doc.images)
      .slice(0, 500)
      .map((img) => ({ src: img.src, alt: img.alt || "" }));

    const allLinks = Array.from(doc.querySelectorAll("a[href]"))
      .map((a) => a.href)
      .filter((h) => h && h.startsWith("http"))
      .slice(0, 4000);

    const origin = new URL(url).origin;
    const internal = allLinks.filter((h) => h.startsWith(origin));
    const external = allLinks.filter((h) => !h.startsWith(origin));

    const ldjson = parseLdJson(doc);

    const title = (doc.querySelector("h1") && text(doc.querySelector("h1"))) || doc.title || "";
    const description = meta["description"] || meta["og:description"] || "";

    // big visible text blob (chat-like UIs benefit)
    const fullText = collectVisibleText(doc);

    // quick "cards" from repeated items (optional)
    const quickItems = extractCardsLite(doc).slice(0, 200);

    // Extract forms
    const forms = Array.from(doc.querySelectorAll("form")).map((form) => {
      const inputs = Array.from(form.querySelectorAll("input, textarea, select")).map((input) => ({
        name: input.name || "",
        type: input.type || "",
        placeholder: input.placeholder || "",
        required: input.required || false
      }));
      return {
        action: form.action || "",
        method: form.method || "GET",
        inputs
      };
    });

    // Extract iframes
    const iframes = Array.from(doc.querySelectorAll("iframe")).map((iframe) => ({
      src: iframe.src || "",
      title: iframe.title || "",
      width: iframe.width || "",
      height: iframe.height || ""
    }));

    // Extract videos
    const videos = Array.from(doc.querySelectorAll("video")).map((video) => {
      const sources = Array.from(video.querySelectorAll("source")).map((source) => ({
        src: source.src || "",
        type: source.type || ""
      }));
      return {
        src: video.src || "",
        poster: video.poster || "",
        sources,
        controls: video.controls || false,
        autoplay: video.autoplay || false
      };
    });

    // Extract audio
    const audios = Array.from(doc.querySelectorAll("audio")).map((audio) => {
      const sources = Array.from(audio.querySelectorAll("source")).map((source) => ({
        src: source.src || "",
        type: source.type || ""
      }));
      return {
        src: audio.src || "",
        sources,
        controls: audio.controls || false,
        autoplay: audio.autoplay || false
      };
    });

    return {
      url,
      title,
      description,
      meta,
      headings,
      paragraphs,
      lists,
      tables,
      images,
      links: { internal, external },
      ldjson,
      fullText,          // <— THE BIG ONE for "same-to-same description"
      quickItems,
      forms,
      iframes,
      videos,
      audios,
      scrapedAt: new Date().toISOString()
    };
  }

  // Lightweight repeated cards finder
  function extractCardsLite(doc) {
    const candidates = Array.from(doc.querySelectorAll(
      [
        "article",
        "li",
        "div[class*='card']",
        "div[class*='item']",
        "div[class*='product']",
        "div[class*='listing']",
        "div[class*='result']",
        "div[data-testid*='card']"
      ].join(",")
    ));
    const uniq = new Set();
    const items = [];

    const pickTitle = (el) =>
      text(el.querySelector("h1")) || text(el.querySelector("h2")) || text(el.querySelector("h3")) ||
      getAttr(el.querySelector("a[title]"), "title") || "";

    const pickDesc = (el) => {
      const d = text(el.querySelector("p")) || text(el.querySelector("[data-description]")) || "";
      return d;
    };

    const pickLink = (el) => {
      const a = el.querySelector("a[href]") || el.closest("a[href]") || document.querySelector("link[rel='canonical']");
      return a ? a.href : location.href;
    };

    const pickImage = (el) => {
      const img = el.querySelector("img") || el.querySelector("[data-src]");
      return img ? img.src || getAttr(img, "data-src") : "";
    };

    for (const el of candidates) {
      if (!isVisible(el)) continue;
      const title = pickTitle(el);
      const url = pickLink(el);
      const image = pickImage(el);
      const description = pickDesc(el);
      const key = `${title}|${url}|${image}`.slice(0, 520);
      if (!title && !image && !description) continue;
      if (uniq.has(key)) continue;
      uniq.add(key);
      items.push({ title, description, url, image, containerTag: el.tagName.toLowerCase() });
      if (items.length >= 2000) break;
    }
    return items;
  }

  // Extract list items (existing functionality)
  function extractListItems(doc) {
    // This would implement the existing list scraping logic
    // For now, we'll just return the full page data as a simplified approach
    return [extractFullPage(doc, location.href)];
  }

  // Extract detail pages (existing functionality)
  function extractDetailPages(doc) {
    // This would implement the existing detail page scraping logic
    // For now, we'll just return the full page data as a simplified approach
    return [extractFullPage(doc, location.href)];
  }

  // Auto-scroll to bottom (to load infinite content)
  async function autoScroll(maxSteps = 40, stepPx = 1200, pauseMs = 400) {
    // Adjust pause based on speed setting
    const adjustedPause = speedSettings[currentScrapeSpeed] || pauseMs;
    
    let lastY = -1;
    for (let i = 0; i < maxSteps; i++) {
      if (!isScrapingActive) return;
      window.scrollBy(0, stepPx);
      await new Promise(r => setTimeout(r, adjustedPause));
      const y = window.scrollY;
      if (y === lastY) break; // reached bottom
      lastY = y;
    }
    // scroll back to top for extraction if needed
    window.scrollTo({ top: 0 });
  }

  // Wait for "DOM idle" (no mutations for a short window)
  async function waitForDomIdle(timeoutMs = 8000, quietMs = 800) {
    // Adjust quiet time based on speed setting
    const adjustedQuiet = Math.max(200, speedSettings[currentScrapeSpeed] || quietMs);
    const adjustedTimeout = Math.min(15000, timeoutMs + (speedSettings.slow - speedSettings[currentScrapeSpeed]));
    
    return new Promise((resolve) => {
      let timer = null;
      let done = false;
      const start = Date.now();

      const settle = () => {
        if (done) return;
        done = true;
        obs.disconnect();
        resolve();
      };

      const obs = new MutationObserver(() => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          if (Date.now() - start >= 50 && !done) settle();
        }, adjustedQuiet);
      });

      obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });

      // safety timeout
      setTimeout(() => settle(), adjustedTimeout);
      // kick initial quiet window
      timer = setTimeout(() => settle(), adjustedQuiet);
    });
  }

  // Master scraping flow
  async function performScraping() {
    try {
      isScrapingActive = true;
      scrapedItems = [];
      
      // Different progress steps based on scrape type
      let totalSteps = 3;
      if (currentScrapeType === "detail") {
        totalSteps = 5; // More steps for detail scraping
      }
      
      sendProgress(0, totalSteps);

      // 1) Scroll to load dynamic/infinite content
      await autoScroll(50, 1400, 350);
      if (!isScrapingActive) return;
      sendProgress(1, totalSteps);

      // 2) Wait DOM idle (for SPA/chat to settle)
      await waitForDomIdle(10000, 900);
      if (!isScrapingActive) return;
      sendProgress(2, totalSteps);

      // 3) Extract data based on scrape type
      let data;
      switch (currentScrapeType) {
        case "list":
          data = extractListItems(document);
          break;
        case "detail":
          data = extractDetailPages(document);
          break;
        case "full-page":
        default:
          data = [extractFullPage(document, location.href)];
          break;
      }
      
      scrapedItems = data;
      sendMessage({ action: "dataScraped", data: data });
      chrome.storage?.local?.set({ scrapedData: scrapedItems });
      sendProgress(totalSteps, totalSteps);

      sendMessage({ action: "scrapingComplete" });
    } catch (e) {
      sendMessage({ action: "scrapingError", error: e?.message || String(e) });
      sendMessage({ action: "scrapingComplete" });
    } finally {
      isScrapingActive = false;
    }
  }

  // Public commands
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.action === "startScraping") {
      // Set scrape type and speed from message
      currentScrapeType = msg.scrapeType || "full-page";
      currentScrapeSpeed = msg.scrapeSpeed || "medium";
      
      // Start scraping
      performScraping();
      sendResponse({ ok: true });
      return true;
    }
    if (msg?.action === "stopScraping") {
      isScrapingActive = false;
      sendResponse({ ok: true });
      return true;
    }
    if (msg?.action === "getPreviewData") {
      sendResponse({ data: scrapedItems || [] });
      return true;
    }
  });
})();