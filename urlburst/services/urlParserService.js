// services/urlParserService.js — URLBurst
"use strict";

const URLParserService = (() => {
  // Parse input text → final URL array applying all settings
  function parseInput(text, settings) {
    if (!text || !text.trim()) return [];

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let urls = [];
    const searchFallbacks = [];

    lines.forEach((line) => {
      // Skip comment-style lines
      if (line.startsWith("#")) return;

      if (Validator.isValidURL(line)) {
        urls.push(Validator.normalizeURL(line));
      } else {
        // Try extracting embedded URLs from mixed text
        const embedded = Validator.extractURLsFromText(line);
        if (embedded.length) {
          urls.push(...embedded.map(Validator.normalizeURL));
        } else if (settings.handleNonURLs && line.length > 1) {
          searchFallbacks.push(Formatter.toSearchQuery(line));
        }
      }
    });

    // Deduplication (before limit so we keep the right count)
    if (settings.ignoreDuplicates) {
      const seen = new Set();
      urls = urls.filter((u) => {
        if (seen.has(u)) return false;
        seen.add(u);
        return true;
      });
    }

    // Order
    if (settings.reverseOrder) urls = Formatter.reverseArray(urls);
    if (settings.randomOrder)  urls = Formatter.shuffleArray(urls);

    // Limit
    if (settings.limitEnabled && settings.limitCount > 0) {
      urls = urls.slice(0, settings.limitCount);
    }

    return [...urls, ...searchFallbacks];
  }

  // Quick stats (used by debounced stats bar)
  function getStats(text) {
    if (!text || !text.trim()) return { valid: [], invalid: [], empty: [], duplicates: [] };
    return Validator.analyzeLines(text.split(/\r?\n/));
  }

  // Remove non-URLs and deduplicate
  function cleanup(text) {
    if (!text) return "";
    const seen = new Set();
    const cleaned = [];
    text.split(/\r?\n/).forEach((line) => {
      const t = line.trim();
      if (!t || !Validator.isValidURL(t)) return;
      const n = Validator.normalizeURL(t);
      if (!seen.has(n)) { seen.add(n); cleaned.push(n); }
    });
    return cleaned.join("\n");
  }

  return { parseInput, getStats, cleanup };
})();

if (typeof module !== "undefined") module.exports = URLParserService;
