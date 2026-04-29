'use strict';

// ── StorageService ────────────────────────────────────────────────────────────
// Single source of truth for all chrome.storage interactions.
// Uses chrome.storage.local for performance; data persists across sessions.

const StorageService = (() => {

  const DEFAULTS = {

    // ── Pomodoro runtime state ────────────────────────────────────────────────
    pomodoro: {
      mode:           'work',   // 'work' | 'shortBreak' | 'longBreak' | 'deepWork'
      running:        false,
      startedAt:      null,     // Date.now() when current session started
      totalTime:      25 * 60,  // seconds for the current phase
      timeLeft:       25 * 60,
      session:        0,        // sessions since last long break
      completedToday: 0,        // work/deepWork sessions finished today
      deepWorkActive: false,
    },

    // ── Pomodoro settings ─────────────────────────────────────────────────────
    pomodoroSettings: {
      workTime:          25 * 60,
      shortBreak:         5 * 60,
      longBreak:         15 * 60,
      deepWorkTime:      90 * 60,
      longBreakInterval: 4,
      autoStart:         false,
    },

    // ── Hydration ─────────────────────────────────────────────────────────────
    hydration: {
      consumed:       0,
      goal:           3000,
      streak:         0,
      lastDate:       '',
      intervalMinutes: 30,
      quietEnabled:   false,
      quietStart:     '22:00',
      quietEnd:       '07:00',
      logs:           [],  // [{ time: timestamp, amount: ml }]
    },

    // ── Eye care ──────────────────────────────────────────────────────────────
    eyeCare: {
      enabled:         true,
      intervalMinutes: 20,
    },

    // ── Breaks ────────────────────────────────────────────────────────────────
    breaks: {
      enabled:         true,
      intervalMinutes: 60,
    },

    // ── Analytics ─────────────────────────────────────────────────────────────
    analytics: {
      focusMinutesToday:  0,
      breaksToday:        0,
      hydrationToday:     0,
      lastAnalyticsDate:  '',
      weeklyFocus:        [],  // last 7 days [minutes/day]
      weeklyHydration:    [],  // last 7 days [ml/day]
    },

    // ── App state ─────────────────────────────────────────────────────────────
    appState: {
      lastActivity: null,
      onboarded:    false,
    },
  };

  // ── Core read/write ───────────────────────────────────────────────────────

  async function get(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }

  async function set(data) {
    return new Promise((resolve) => chrome.storage.local.set(data, resolve));
  }

  async function getKey(key) {
    const result = await get([key]);
    return result[key] ?? null;
  }

  async function setKey(key, value) {
    return set({ [key]: value });
  }

  /**
   * Retrieve a key, merging stored data with DEFAULTS so every field exists.
   * Newly added default fields automatically appear without migration code.
   */
  async function getWithDefaults(key) {
    const stored = await getKey(key);
    const def    = DEFAULTS[key];

    if (stored === null) return def ?? null;

    // Deep-merge only plain objects (not arrays)
    if (def && typeof def === 'object' && !Array.isArray(def)) {
      return Object.assign({}, def, stored);
    }
    return stored;
  }

  /**
   * Write defaults for any key that has never been stored.
   * Called once on install; safe to call multiple times.
   */
  async function initDefaults() {
    const existing = await get(Object.keys(DEFAULTS));
    const toSet = {};
    for (const key of Object.keys(DEFAULTS)) {
      if (existing[key] === undefined) {
        toSet[key] = DEFAULTS[key];
      }
    }
    if (Object.keys(toSet).length) await set(toSet);
  }

  return { get, set, getKey, setKey, getWithDefaults, initDefaults, DEFAULTS };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.StorageService = StorageService;
}
