'use strict';

// ── Hydration Module ──────────────────────────────────────────────────────────

const HydrationModule = (() => {

  // Track the alert window by ID so we never scan all windows on every alarm.
  // Reset to null when the user closes the window (via onRemoved listener).
  let _alertWindowId = null;

  // ── Alarm handler ─────────────────────────────────────────────────────────

  async function onAlarm() {
    console.log('[HydrationModule] Alarm fired at', new Date().toLocaleTimeString());

    const hydration = await StorageService.getWithDefaults('hydration');
    const allowed   = Scheduler.canFireHydration(hydration);

    if (!allowed) {
      console.log('[HydrationModule] Alert suppressed (quiet hours)');
      return;
    }

    // If the Pomodoro "break over" popup is open, defer hydration so the user
    // doesn't get two popups at the same time.
    if (await _isPomodoroBreakPopupOpen()) {
      console.log('[HydrationModule] Deferred (pomodoro popup open)');
      chrome.alarms.create('tab:hydration:snooze', { delayInMinutes: 5 });
      return;
    }

    await _openAlertWindow();
  }

  // ── Alert window management ───────────────────────────────────────────────

  /**
   * Opens the floating hydration-alert popup.
   * - If our tracked window is still open → focus it (no duplicate).
   * - If it was closed (stale ID) → fall through to create a new one.
   * - Safety scan catches orphaned windows after a service-worker restart.
   */
  async function _openAlertWindow() {
    // 1. Try to reuse the tracked window
    if (_alertWindowId !== null) {
      try {
        await chrome.windows.get(_alertWindowId);
        await chrome.windows.update(_alertWindowId, { focused: true });
        console.log('[HydrationModule] Focused existing alert window', _alertWindowId);
        return;
      } catch (_) {
        // Window was closed; clear stale ID and continue
        _alertWindowId = null;
      }
    }

    // 2. Safety scan: catch orphaned alert.html popups after SW restart
    try {
      const popups = await chrome.windows.getAll({ populate: true, windowTypes: ['popup'] });
      const orphan = popups.find(w =>
        w.tabs && w.tabs.some(t => t.url && t.url.includes('alert.html'))
      );
      if (orphan) {
        _alertWindowId = orphan.id;
        await chrome.windows.update(orphan.id, { focused: true });
        console.log('[HydrationModule] Re-adopted orphan alert window', orphan.id);
        return;
      }
    } catch (err) {
      console.warn('[HydrationModule] Window scan error:', err);
    }

    // 3. Create a fresh popup window
    try {
      const win = await chrome.windows.create({
        url:     chrome.runtime.getURL('alert.html'),
        type:    'popup',
        width:   380,
        height:  420,
        focused: true,
      });
      _alertWindowId = win.id;
      console.log('[HydrationModule] Created alert window', win.id);

      // Auto-clear ID when window is closed by the user
      chrome.windows.onRemoved.addListener(function _onClose(closedId) {
        if (closedId === _alertWindowId) {
          _alertWindowId = null;
          chrome.windows.onRemoved.removeListener(_onClose);
          console.log('[HydrationModule] Alert window closed');
        }
      });
    } catch (err) {
      console.error('[HydrationModule] Failed to open alert window:', err);
    }
  }

  async function _isPomodoroBreakPopupOpen() {
    try {
      const popups = await chrome.windows.getAll({ populate: true, windowTypes: ['popup'] });
      return popups.some(w =>
        w.tabs && w.tabs.some(t => t.url && t.url.includes('pomodoro-alert.html'))
      );
    } catch (_) {
      return false;
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async function logDrink(amountMl = 250) {
    const hydration = await StorageService.getWithDefaults('hydration');
    hydration.consumed = (hydration.consumed || 0) + amountMl;

    if (!Array.isArray(hydration.logs)) hydration.logs = [];
    hydration.logs.push({ time: Date.now(), amount: amountMl });

    // Keep only today's log entries
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    hydration.logs = hydration.logs.filter(l => l.time >= todayStart.getTime());

    await StorageService.setKey('hydration', hydration);
    return { ok: true, consumed: hydration.consumed };
  }

  async function updateSettings(newSettings) {
    const hydration = await StorageService.getWithDefaults('hydration');
    Object.assign(hydration, newSettings);
    await StorageService.setKey('hydration', hydration);

    if (newSettings.intervalMinutes) {
      TimerEngine.scheduleHydration(newSettings.intervalMinutes);
    }
    return { ok: true };
  }

  async function dailyReset() {
    const hydration = await StorageService.getWithDefaults('hydration');
    const today = new Date().toDateString();
    if (hydration.lastDate === today) return;

    const metGoal = (hydration.consumed || 0) >= (hydration.goal || 3000);
    hydration.streak  = metGoal ? (hydration.streak || 0) + 1 : 0;
    hydration.consumed = 0;
    hydration.logs    = [];
    hydration.lastDate = today;
    await StorageService.setKey('hydration', hydration);
    console.log('[HydrationModule] Daily reset — streak:', hydration.streak);
  }

  return { onAlarm, logDrink, updateSettings, dailyReset };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.HydrationModule = HydrationModule;
}
