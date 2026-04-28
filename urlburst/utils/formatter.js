// utils/formatter.js — URLBurst
"use strict";

const Formatter = (() => {
  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function reverseArray(arr) { return [...arr].reverse(); }

  function groupByHost(urls) {
    const groups = new Map();
    urls.forEach((url) => {
      try {
        const host = new URL(url).hostname;
        if (!groups.has(host)) groups.set(host, []);
        groups.get(host).push(url);
      } catch {
        if (!groups.has("_invalid")) groups.set("_invalid", []);
        groups.get("_invalid").push(url);
      }
    });
    return groups;
  }

  function groupByTLD(urls) {
    const groups = new Map();
    urls.forEach((url) => {
      try {
        const host = new URL(url).hostname;
        const parts = host.split(".");
        const tld = parts.length >= 2 ? "." + parts[parts.length - 1] : "_other";
        if (!groups.has(tld)) groups.set(tld, []);
        groups.get(tld).push(url);
      } catch {
        if (!groups.has("_invalid")) groups.set("_invalid", []);
        groups.get("_invalid").push(url);
      }
    });
    return groups;
  }

  function toSearchQuery(text, engine = "https://www.google.com/search?q=") {
    return engine + encodeURIComponent(text.trim());
  }

  function formatTimestamp(date = new Date()) {
    return date.toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  function parseCSV(text) {
    const urls = [];
    text.split(/\r?\n/).forEach((line) => {
      line.split(",").forEach((part) => {
        const t = part.replace(/^["']|["']$/g, "").trim();
        if (t) urls.push(t);
      });
    });
    return urls;
  }

  function sanitizeFilename(name) {
    return name
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
      .replace(/\.{2,}/g, ".")
      .slice(0, 100)
      .trim() || "export";
  }

  function getDomain(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); }
    catch { return url; }
  }

  function getFaviconURL(url) {
    try {
      const u = new URL(url);
      return u.origin + "/favicon.ico";
    } catch { return ""; }
  }

  return {
    shuffleArray, reverseArray,
    groupByHost, groupByTLD,
    toSearchQuery, formatTimestamp,
    parseCSV, sanitizeFilename,
    getDomain, getFaviconURL
  };
})();

if (typeof module !== "undefined") module.exports = Formatter;
