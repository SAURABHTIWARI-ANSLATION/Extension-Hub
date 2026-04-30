'use strict';

// ── TimerEngine ───────────────────────────────────────────────────────────────
// Single source of truth for all scheduled alarms.
// Uses chrome.alarms (survives service worker sleep) + timestamp math.
//
// Alarm names (all prefixed "tab:"):
//   tab:pomodoro  — ticks every 15 s to drive the Pomodoro countdown
//   tab:hydration — fires when a hydration reminder is due
//   tab:eyecare   — fires when a 20-20-20 check is due
//   tab:breaks    — fires when a break reminder is due
//   tab:activity  — fires every 5 min to detect long continuous sessions
//   tab:daily     — fires every 30 min to check for a new calendar day

const TimerEngine = (() => {

  const ALARMS = {
    POMODORO:  'tab:pomodoro',
    HYDRATION: 'tab:hydration',
    EYECARE:   'tab:eyecare',
    BREAKS:    'tab:breaks',
    ACTIVITY:  'tab:activity',
    DAILY:     'tab:daily',
  };

  // ── Internal helpers ──────────────────────────────────────────────────────

  function _create(name, opts) {
    chrome.alarms.create(name, opts);
  }

  function _clear(name) {
    chrome.alarms.clear(name);
  }

  // ── Pomodoro Timer ────────────────────────────────────────────────────────

  function startPomodoro() {
    // Tick every 15 seconds; timestamp arithmetic handles the actual countdown
    _create(ALARMS.POMODORO, { periodInMinutes: 0.25 });
  }

  function stopPomodoro() {
    _clear(ALARMS.POMODORO);
  }

  // ── Hydration Reminder ────────────────────────────────────────────────────

  /**
   * Schedule (or re-schedule) the hydration alarm.
   * Hydration is always scheduled — it defaults to 30 min if not configured.
   */
  function scheduleHydration(intervalMinutes) {
    const mins = Math.max(1, Number(intervalMinutes) || 30);
    _clear(ALARMS.HYDRATION);
    _create(ALARMS.HYDRATION, {
      delayInMinutes:  mins,
      periodInMinutes: mins,
    });
    console.log(`[TimerEngine] Hydration alarm set — every ${mins} min`);
  }

  function clearHydration() {
    _clear(ALARMS.HYDRATION);
  }

  // ── Eye Care Reminder ─────────────────────────────────────────────────────

  function scheduleEyeCare(intervalMinutes) {
    const mins = Math.max(1, Number(intervalMinutes) || 20);
    _clear(ALARMS.EYECARE);
    _create(ALARMS.EYECARE, {
      delayInMinutes:  mins,
      periodInMinutes: mins,
    });
  }

  function clearEyeCare() {
    _clear(ALARMS.EYECARE);
  }

  // ── Break Reminder ────────────────────────────────────────────────────────

  function scheduleBreaks(intervalMinutes) {
    const mins = Math.max(1, Number(intervalMinutes) || 60);
    _clear(ALARMS.BREAKS);
    _create(ALARMS.BREAKS, {
      delayInMinutes:  mins,
      periodInMinutes: mins,
    });
  }

  function clearBreaks() {
    _clear(ALARMS.BREAKS);
  }

  // ── Activity Monitor ──────────────────────────────────────────────────────

  function startActivityMonitor() {
    _create(ALARMS.ACTIVITY, { periodInMinutes: 5 });
  }

  // ── Daily Reset ───────────────────────────────────────────────────────────

  function scheduleDailyReset() {
    // Poll every 30 min; the handler checks whether the calendar date has changed
    _create(ALARMS.DAILY, { periodInMinutes: 30 });
  }

  // ── Restore all alarms on service-worker revival ──────────────────────────

  async function restoreAll(state) {
    const { pomodoro, hydration, eyeCare, breaks } = state;

    if (pomodoro && pomodoro.running) {
      startPomodoro();
    }

    // Hydration: always restore — health reminders don't need an opt-in flag
    scheduleHydration((hydration && hydration.intervalMinutes) || 30);

    if (eyeCare && eyeCare.enabled) {
      scheduleEyeCare(eyeCare.intervalMinutes || 20);
    }

    if (breaks && breaks.enabled) {
      scheduleBreaks(breaks.intervalMinutes || 60);
    }

    startActivityMonitor();
    scheduleDailyReset();
    console.log('[TimerEngine] All alarms restored on startup');
  }

  return {
    ALARMS,
    startPomodoro, stopPomodoro,
    scheduleHydration, clearHydration,
    scheduleEyeCare,  clearEyeCare,
    scheduleBreaks,   clearBreaks,
    startActivityMonitor,
    scheduleDailyReset,
    restoreAll,
  };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.TimerEngine = TimerEngine;
}
