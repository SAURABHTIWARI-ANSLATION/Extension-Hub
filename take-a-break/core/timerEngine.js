'use strict';

// ── TimerEngine ───────────────────────────────────────────────────────────────
// Single source of truth for all scheduled alarms.
// Uses chrome.alarms (survives service worker sleep) + timestamp math.
//
// Alarm names:
//   tab:pomodoro     — fires every 15s to tick the Pomodoro
//   tab:hydration    — fires when hydration reminder is due
//   tab:eyecare      — fires when 20-20-20 check is due
//   tab:breaks       — fires when break reminder is due
//   tab:activity     — fires to check for long continuous activity

const TimerEngine = (() => {

  const PREFIX = 'tab:';

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
    // Tick every 15 seconds; timestamp math handles actual countdown
    _create(ALARMS.POMODORO, { periodInMinutes: 0.25 });
  }

  function stopPomodoro() {
    _clear(ALARMS.POMODORO);
  }

  // ── Hydration Reminder ────────────────────────────────────────────────────

  function scheduleHydration(intervalMinutes) {
    const mins = Number(intervalMinutes) || 30;
    _clear(ALARMS.HYDRATION);
    _create(ALARMS.HYDRATION, {
      delayInMinutes:  mins,
      periodInMinutes: mins,
    });
    console.log(`[TimerEngine] scheduleHydration → alarm "${ALARMS.HYDRATION}" set for every ${mins} min`);
  }

  function clearHydration() {
    _clear(ALARMS.HYDRATION);
  }

  // ── Eye Care Reminder ─────────────────────────────────────────────────────

  function scheduleEyeCare(intervalMinutes) {
    _clear(ALARMS.EYECARE);
    _create(ALARMS.EYECARE, {
      delayInMinutes: intervalMinutes,
      periodInMinutes: intervalMinutes,
    });
  }

  function clearEyeCare() {
    _clear(ALARMS.EYECARE);
  }

  // ── Break Reminder ────────────────────────────────────────────────────────

  function scheduleBreaks(intervalMinutes) {
    _clear(ALARMS.BREAKS);
    _create(ALARMS.BREAKS, {
      delayInMinutes: intervalMinutes,
      periodInMinutes: intervalMinutes,
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
    // Check every 30 min whether it's a new day
    _create(ALARMS.DAILY, { periodInMinutes: 30 });
  }

  // ── Restore all alarms on startup ─────────────────────────────────────────

  async function restoreAll(state) {
    const { pomodoro, hydration, eyeCare, breaks } = state;

    if (pomodoro && pomodoro.running) {
      startPomodoro();
    }

    // Hydration: always restore — default to 30 min if not stored
    scheduleHydration((hydration && hydration.intervalMinutes) || 30);
    console.log('[TimerEngine] restoreAll → hydration alarm restored');

    if (eyeCare && eyeCare.enabled) {
      scheduleEyeCare(eyeCare.intervalMinutes || 20);
    }
    if (breaks && breaks.enabled) {
      scheduleBreaks(breaks.intervalMinutes || 60);
    }
    startActivityMonitor();
    scheduleDailyReset();
  }

  return {
    ALARMS,
    startPomodoro, stopPomodoro,
    scheduleHydration, clearHydration,
    scheduleEyeCare, clearEyeCare,
    scheduleBreaks, clearBreaks,
    startActivityMonitor,
    scheduleDailyReset,
    restoreAll,
  };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.TimerEngine = TimerEngine;
}
