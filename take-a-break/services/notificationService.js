'use strict';

// ── NotificationService ───────────────────────────────────────────────────────
// Thin wrapper around chrome.notifications.
// Prevents duplicate IDs and enforces a minimum gap between notifications.

const NotificationService = (() => {

  const MIN_GAP_MS = 8000;  // Minimum ms between any two notifications
  let _lastShownAt = 0;

  function _gapElapsed() {
    return Date.now() - _lastShownAt >= MIN_GAP_MS;
  }

  /**
   * Show a notification. Auto-clears any existing notification with the same id.
   *
   * @param {string}  id     - Unique notification identifier
   * @param {object}  opts   - { title, message, iconUrl?, priority? }
   * @param {boolean} force  - Skip gap check (use for session-complete events)
   */
  function show(id, opts, force = false) {
    if (!force && !_gapElapsed()) return;

    // Clear same-id notification first (avoids Chrome's "update vs create" quirk)
    chrome.notifications.clear(id, () => {
      chrome.notifications.create(id, {
        type:     'basic',
        iconUrl:  opts.iconUrl || 'icons/icon48.png',
        title:    opts.title   || 'Take a Break',
        message:  opts.message || '',
        priority: opts.priority ?? 1,
      });
      _lastShownAt = Date.now();
    });
  }

  function clear(id) {
    chrome.notifications.clear(id);
  }

  return { show, clear };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.NotificationService = NotificationService;
}
