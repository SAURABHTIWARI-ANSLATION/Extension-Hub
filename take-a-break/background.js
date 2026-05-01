'use strict';

// ── Take a Break — Background Service Worker ──────────────────────────────────
// All modules are imported in dependency order.
// This file is the single entry point for all background logic.

importScripts(
  'services/storageService.js',
  'services/notificationService.js',
  'core/timerEngine.js',
  'core/scheduler.js',
  'modules/pomodoro.js',
  'modules/hydration.js',
  'modules/eyeCare.js',
  'modules/breaks.js',
);

// ── Install ───────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  await StorageService.initDefaults();
  const state = await StorageService.get(['pomodoro', 'hydration', 'eyeCare', 'breaks']);
  TimerEngine.scheduleDailyReset();
  TimerEngine.startActivityMonitor();
  await HydrationModule.dailyReset();

  // Hydration alarm: ALWAYS schedule — it's health-critical and independent
  // of any other module state. Default to 30 min if not yet configured.
  const hydration = await StorageService.getWithDefaults('hydration');
  const hydrationInterval = hydration.intervalMinutes || 30;
  TimerEngine.scheduleHydration(hydrationInterval);
  console.log('[Background] Hydration alarm scheduled on install, interval:', hydrationInterval, 'min');

  const eyeCare = await StorageService.getWithDefaults('eyeCare');
  if (eyeCare.enabled) TimerEngine.scheduleEyeCare(eyeCare.intervalMinutes || 20);

  const breaks = await StorageService.getWithDefaults('breaks');
  if (breaks.enabled) TimerEngine.scheduleBreaks(breaks.intervalMinutes || 60);
});

// ── Startup (service worker revival) ─────────────────────────────────────────

chrome.runtime.onStartup.addListener(async () => {
  await HydrationModule.dailyReset();
  const [pomodoro, hydration, eyeCare, breaks] = await Promise.all([
    StorageService.getWithDefaults('pomodoro'),
    StorageService.getWithDefaults('hydration'),
    StorageService.getWithDefaults('eyeCare'),
    StorageService.getWithDefaults('breaks'),
  ]);
  await TimerEngine.restoreAll({ pomodoro, hydration, eyeCare, breaks });
});

// ── Alarm Router ──────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('[Background] Alarm fired:', alarm.name, 'at', new Date().toLocaleTimeString());

  switch (alarm.name) {

    case TimerEngine.ALARMS.POMODORO:
      await PomodoroModule.onTick();
      break;

    case TimerEngine.ALARMS.HYDRATION:
      console.log('[Background] → routing to HydrationModule.onAlarm()');
      await HydrationModule.onAlarm();
      break;

    case 'tab:hydration:snooze':
      // Snooze expired — open the alert window again
      console.log('[Background] → snooze expired, routing to HydrationModule.onAlarm()');
      await HydrationModule.onAlarm();
      break;

    case TimerEngine.ALARMS.EYECARE:
      await EyeCareModule.onAlarm();
      break;

    case TimerEngine.ALARMS.BREAKS:
      await BreaksModule.onAlarm();
      break;

    case TimerEngine.ALARMS.DAILY:
      await HydrationModule.dailyReset();
      await _updateAnalyticsDaily();
      break;

    case TimerEngine.ALARMS.ACTIVITY:
      await _checkActivity();
      break;
  }
});

// ── Message Router (from popup) ───────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!sender || sender.id !== chrome.runtime.id) return;

  _handleMessage(msg).then(sendResponse).catch((err) => {
    console.error('[Take a Break] message error:', err);
    sendResponse({ ok: false, error: err.message });
  });
  return true; // keep channel open for async response
});

async function _handleMessage(msg) {
  switch (msg.action) {

    // Pomodoro
    case 'pomodoro:start':      return PomodoroModule.start();
    case 'pomodoro:pause':      return PomodoroModule.pause();
    case 'pomodoro:reset':      return PomodoroModule.reset();
    case 'pomodoro:switchMode': return PomodoroModule.switchMode(msg.mode);
    case 'pomodoro:deepWork':   return PomodoroModule.startDeepWork();
    case 'pomodoro:settings':   return PomodoroModule.updateSettings(msg.settings);

    // Hydration
    case 'hydration:log':       return HydrationModule.logDrink(msg.amount || 250);
    case 'hydration:settings':  return HydrationModule.updateSettings(msg.settings);

    // Eye care
    case 'eyecare:toggle':      return EyeCareModule.setEnabled(msg.enabled);
    case 'eyecare:interval':    return EyeCareModule.setInterval(msg.minutes);

    // Breaks
    case 'breaks:toggle':       return BreaksModule.setEnabled(msg.enabled);
    case 'breaks:interval':     return BreaksModule.setInterval(msg.minutes);

    default:
      return { ok: false, error: `Unknown action: ${msg.action}` };
  }
}

// ── Activity Detection ────────────────────────────────────────────────────────

async function _checkActivity() {
  const appState = await StorageService.getWithDefaults('appState');
  const pomodoro = await StorageService.getWithDefaults('pomodoro');

  if (!appState.lastActivity) return;

  const idleMs = Date.now() - appState.lastActivity;
  const idleMinutes = idleMs / 60000;

  // If user hasn't used the extension UI in 2+ hours and Pomodoro is running,
  // suggest a break
  if (idleMinutes > 120 && pomodoro.running && pomodoro.mode === 'work') {
    if (Scheduler.canFireBreak(pomodoro)) {
      NotificationService.show('tab:activity', {
        title: 'Long session detected',
        message: 'You have been working for a while. Consider taking a break.',
        priority: 1,
      });
    }
  }
}

// ── Daily Analytics Update ────────────────────────────────────────────────────

async function _updateAnalyticsDaily() {
  const analytics = await StorageService.getWithDefaults('analytics');
  const today = new Date().toDateString();

  if (analytics.lastAnalyticsDate === today) return;

  // Roll today's stats into weekly arrays (keep 7 days)
  const wf = analytics.weeklyFocus || [];
  const wh = analytics.weeklyHydration || [];
  wf.push(analytics.focusMinutesToday || 0);
  wh.push(analytics.hydrationToday || 0);
  if (wf.length > 7) wf.shift();
  if (wh.length > 7) wh.shift();

  analytics.weeklyFocus = wf;
  analytics.weeklyHydration = wh;
  analytics.focusMinutesToday = 0;
  analytics.breaksToday = 0;
  analytics.hydrationToday = 0;
  analytics.lastAnalyticsDate = today;

  await StorageService.setKey('analytics', analytics);
}
