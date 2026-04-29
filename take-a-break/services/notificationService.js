'use strict';

// ── NotificationService ───────────────────────────────────────────────────────
// Prevents duplicate notifications and enforces priority ordering.

const NotificationService = (() => {

  // Track in-flight notification IDs to prevent dupes
  const _active = new Set();

  // Minimum gap between any two notifications (ms)
  const MIN_GAP_MS = 8000;
  let _lastNotifiedAt = 0;

  function _canNotify() {
    return Date.now() - _lastNotifiedAt >= MIN_GAP_MS;
  }

  /**
   * Create a notification, auto-clearing any previous one with the same id.
   * @param {string} id        - Unique notification ID
   * @param {object} opts      - chrome.notifications.create options (title, message, iconUrl)
   * @param {boolean} force    - Bypass gap check (for critical events)
   */
  function show(id, opts, force = false) {
    if (!force && !_canNotify()) return;

    // Clear any existing notification with same id before creating
    chrome.notifications.clear(id, () => {
      chrome.notifications.create(id, {
        type: 'basic',
        iconUrl: opts.iconUrl || 'icons/icon48.png',
        title: opts.title || 'Take a Break',
        message: opts.message || '',
        priority: opts.priority ?? 1,
        ...opts,
      });
      _active.add(id);
      _lastNotifiedAt = Date.now();
    });
  }

  function clear(id) {
    chrome.notifications.clear(id);
    _active.delete(id);
  }

  function clearAll() {
    for (const id of _active) {
      chrome.notifications.clear(id);
    }
    _active.clear();
  }

  return { show, clear, clearAll };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.NotificationService = NotificationService;
}
