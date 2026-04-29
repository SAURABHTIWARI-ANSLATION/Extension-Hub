'use strict';

// ── StorageService ────────────────────────────────────────────────────────────
// Single source of truth for all chrome.storage interactions.
// Uses chrome.storage.local for performance; data persists across sessions.

const StorageService = (() => {

  const DEFAULTS = {
    // --- Pomodoro ---
    pomodoro: {
      mode: 'work',       // 'work' | 'shortBreak' | 'longBreak' | 'deepWork'
      running: false,
      startedAt: null,
      totalTime: 25 * 60,
      timeLeft: 25 * 60,
      session: 0,
      completedToday: 0,
      deepWorkActive: false,
    },

    // --- Pomodoro settings ---
    pomodoroSettings: {
      workTime: 25 * 60,
      shortBreak: 5 * 60,
      longBreak: 15 * 60,
      deepWorkTime: 90 * 60,
      longBreakInterval: 4,
      autoStart: false,
    },

    // --- Hydration ---
    hydration: {
      consumed: 0,
      goal: 3000,
      streak: 0,
      lastDate: '',
      intervalMinutes: 30,
      quietEnabled: false,
      quietStart: '22:00',
      quietEnd: '07:00',
      logs: [],   // [{time: timestamp, amount: 250}]
    },

    // --- Eye care ---
    eyeCare: {
      enabled: true,
      intervalMinutes: 20,
    },

    // --- Breaks ---
    breaks: {
      enabled: true,
      intervalMinutes: 60,
    },

    // --- Analytics ---
    analytics: {
      focusMinutesToday: 0,
      breaksToday: 0,
      hydrationToday: 0,
      lastAnalyticsDate: '',
      weeklyFocus: [],      // last 7 days [minutes]
      weeklyHydration: [],  // last 7 days [ml]
    },

    // --- App state ---
    appState: {
      mode: 'auto',   // 'auto' | 'work' | 'relax'
      lastActivity: null,
      onboarded: false,
    },
  };

  async function get(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, resolve);
    });
  }

  async function set(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });
  }

  async function getKey(key) {
    const result = await get([key]);
    return result[key] ?? null;
  }

  async function setKey(key, value) {
    return set({ [key]: value });
  }

  async function getWithDefaults(key) {
    const result = await getKey(key);
    if (result === null) return DEFAULTS[key] ?? null;
    // Deep merge with defaults so new fields always exist
    if (typeof DEFAULTS[key] === 'object' && !Array.isArray(DEFAULTS[key])) {
      return Object.assign({}, DEFAULTS[key], result);
    }
    return result;
  }

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

// Export for service worker context
if (typeof globalThis !== 'undefined') {
  globalThis.StorageService = StorageService;
}
