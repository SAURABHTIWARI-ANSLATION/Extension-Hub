// utils/validator.js — URLBurst
"use strict";

const Validator = (() => {
  const DOMAIN_REGEX = /^(https?:\/\/)?((localhost|(\d{1,3}\.){3}\d{1,3})|([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})(:\d{1,5})?(\/[^\s]*)?(\?[^\s]*)?(#[^\s]*)?$/i;

  function isValidURL(str) {
    if (!str || typeof str !== "string") return false;
    const clean = str.trim().replace(/^["'`]|["'`]$/g, "");
    if (!clean) return false;
    if (!DOMAIN_REGEX.test(clean)) return false;
    const withProto = clean.includes("://") ? clean : "https://" + clean;
    try {
      const u = new URL(withProto);
      if (u.protocol !== "http:" && u.protocol !== "https:") return false;
      const host = u.hostname;
      const isLocalhost = host === "localhost";
      const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
      const hasTLD = host.includes(".");
      if (!isLocalhost && !isIP && !hasTLD) return false;
      return true;
    } catch { return false; }
  }

  function classifyLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return { type: "empty", value: trimmed };
    if (isValidURL(trimmed)) return { type: "valid", value: trimmed };
    const embedded = extractURLsFromText(trimmed);
    if (embedded.length) return { type: "valid", value: embedded[0] };
    return { type: "invalid", value: trimmed };
  }

  function analyzeLines(lines) {
    const results = { valid: [], invalid: [], empty: [], duplicates: [] };
    const seen = new Set();
    lines.forEach((line) => {
      const c = classifyLine(line);
      if (c.type === "empty") { results.empty.push(c.value); return; }
      if (c.type === "valid") {
        const n = normalizeURL(c.value);
        if (seen.has(n)) { results.duplicates.push(n); }
        else { seen.add(n); results.valid.push(n); }
      } else { results.invalid.push(c.value); }
    });
    return results;
  }

  function normalizeURL(url) {
    if (!url || typeof url !== "string") return "";
    let u = url.trim().replace(/^["'`]|["'`]$/g, "");
    if (!u.includes("://")) u = "https://" + u;
    try { return new URL(u).href; } catch { return u; }
  }

  function extractURLsFromText(text) {
    if (!text) return [];
    const pat = /https?:\/\/([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}(:\d{1,5})?(\/[^\s,;'"<>()\[\]{}]*)?(\?[^\s,;'"<>()\[\]{}]*)?(#[^\s,;'"<>()\[\]{}]*)?/gi;
    const localPat = /https?:\/\/(localhost|(\d{1,3}\.){3}\d{1,3})(:\d{1,5})?(\/[^\s]*)?/gi;
    return [...new Set([...(text.match(pat) || []), ...(text.match(localPat) || [])])];
  }

  function findDuplicateIndices(lines) {
    const seen = new Map();
    const dupeIndices = new Set();
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed || !isValidURL(trimmed)) return;
      const n = normalizeURL(trimmed);
      if (seen.has(n)) { dupeIndices.add(idx); dupeIndices.add(seen.get(n)); }
      else { seen.set(n, idx); }
    });
    return dupeIndices;
  }

  return { isValidURL, classifyLine, analyzeLines, normalizeURL, extractURLsFromText, findDuplicateIndices };
})();

if (typeof module !== "undefined") module.exports = Validator;
