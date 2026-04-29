'use strict';

// ── Hydration Module ──────────────────────────────────────────────────────────

const HydrationModule = (() => {

  // Track the alert window by ID so we can reuse/focus it instead of scanning
  // all open windows on every alarm tick.
  let _alertWindowId = null;

  async function onAlarm() {
    console.log('[HydrationModule] onAlarm fired at', new Date().toLocaleTimeString());

    const [pomodoro, hydration] = await Promise.all([
      StorageService.getWithDefaults('pomodoro'),
      StorageService.getWithDefaults('hydration'),
    ]);

    const allowed = Scheduler.canFireHydration(pomodoro, hydration);
    console.log('[HydrationModule] Scheduler.canFireHydration →', allowed, { pomodoro, hydration });

    if (!allowed) {
      console.log('[HydrationModule] Alert suppressed by scheduler.');
      return;
    }

    await _openAlertWindow();
  }

  // Opens the floating water-alert popup window.
  // • If a window is already open → bring it to front (no duplicate).
  // • If the tracked window was closed → open a fresh one.
  // • Only ONE alert window exists at any time.
  async function _openAlertWindow() {
    console.log('[HydrationModule] _openAlertWindow called, tracked ID:', _alertWindowId);

    // 1. Try to reuse the tracked window
    if (_alertWindowId !== null) {
      try {
        const existing = await chrome.windows.get(_alertWindowId);
        // Window still exists — focus it and bail out
        await chrome.windows.update(_alertWindowId, { focused: true });
        console.log('[HydrationModule] Reused existing alert window', _alertWindowId);
        return;
      } catch (_err) {
        // Window was closed by the user — clear the stale ID and fall through
        console.log('[HydrationModule] Tracked window gone, opening fresh one');
        _alertWindowId = null;
      }
    }

    // 2. Safety scan: make sure no orphaned alert.html popup slipped through
    //    (e.g. after a service-worker restart that cleared _alertWindowId)
    try {
      const allPopups = await chrome.windows.getAll({ populate: true, windowTypes: ['popup'] });
      const orphan = allPopups.find(win =>
        win.tabs && win.tabs.some(tab => tab.url && tab.url.includes('alert.html'))
      );
      if (orphan) {
        _alertWindowId = orphan.id;
        await chrome.windows.update(orphan.id, { focused: true });
        console.log('[HydrationModule] Found orphan alert window', orphan.id, '— focused it');
        return;
      }
    } catch (err) {
      console.warn('[HydrationModule] Window scan failed:', err);
    }

    // 3. Create a brand new popup window
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

      // Clear the tracked ID when the window is closed by the user
      chrome.windows.onRemoved.addListener(function _onClose(closedId) {
        if (closedId === _alertWindowId) {
          _alertWindowId = null;
          console.log('[HydrationModule] Alert window closed by user');
          chrome.windows.onRemoved.removeListener(_onClose);
        }
      });
    } catch (err) {
      console.error('[HydrationModule] Failed to create alert window:', err);
    }
  }

  async function logDrink(amountMl = 250) {
    const hydration = await StorageService.getWithDefaults('hydration');
    hydration.consumed = (hydration.consumed || 0) + amountMl;

    // Log entry
    if (!Array.isArray(hydration.logs)) hydration.logs = [];
    hydration.logs.push({ time: Date.now(), amount: amountMl });

    // Keep only today's logs
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

    // Reschedule alarm with new interval
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
    hydration.streak = metGoal ? (hydration.streak || 0) + 1 : 0;
    hydration.consumed = 0;
    hydration.logs = [];
    hydration.lastDate = today;
    await StorageService.setKey('hydration', hydration);
  }

  return { onAlarm, logDrink, updateSettings, dailyReset };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.HydrationModule = HydrationModule;
}
