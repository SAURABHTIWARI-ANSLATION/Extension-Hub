// utils/formatters.js — Shared formatting utilities. Single source of truth.
// Loaded as a plain <script> (no ES modules) to work in both sidebar and offscreen contexts.
/* global var */ var Formatters = {
  /**
   * Format milliseconds → HH:MM:SS
   * @param {number} ms
   * @returns {string}
   */
  formatTime(ms) {
    if (!ms && ms !== 0) return '00:00:00';
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1_000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  /**
   * Format seconds → M:SS or H:MM:SS
   * @param {number} seconds
   * @returns {string}
   */
  formatDuration(seconds) {
    if (!seconds) return '0:00';
    const total = Math.round(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  },

  /**
   * Format byte count → human-readable size
   * @param {number} bytes
   * @returns {string}
   */
  formatSize(bytes) {
    if (!bytes || bytes < 0) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  },

  /**
   * Format ISO date string → locale date + short time
   * @param {string|number|Date} date
   * @returns {string}
   */
  formatDate(date) {
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  },

  /**
   * Generate a safe, descriptive filename for a recording.
   * @param {string} siteName - page title or site identifier
   * @param {string} mode     - recording mode ('tab' | 'mic' | 'tab+mic')
   * @param {string} format   - file extension ('webm' | 'wav' | 'mp3')
   * @returns {string}
   */
  generateFilename(siteName, mode, format) {
    const d = new Date();
    const date = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-');
    const time = [
      String(d.getHours()).padStart(2, '0'),
      String(d.getMinutes()).padStart(2, '0'),
      String(d.getSeconds()).padStart(2, '0')
    ].join('-');
    const site = String(siteName || 'recording')
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 28) || 'recording';
    const safeMode = String(mode || 'tab').replace(/\+/g, '-');
    return `audio_${site}_${safeMode}_${date}_${time}.${format}`;
  }
};