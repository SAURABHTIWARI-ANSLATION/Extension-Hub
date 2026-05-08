// validators.js — Input validation utilities

export function isValidUrl(str) {
  try { new URL(str); return true; }
  catch { return false; }
}

export function isValidDimension(val) {
  const n = parseInt(val);
  return !isNaN(n) && n > 0 && n < 10000;
}

export function sanitizeText(str) {
  // No innerHTML usage — this just enforces clean strings
  return String(str).replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
}

export function truncate(str, max = 80) {
  return str.length > max ? str.substring(0, max) + '…' : str;
}
