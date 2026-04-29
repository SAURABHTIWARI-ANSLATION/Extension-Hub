'use strict';

// ── Pomodoro Module ───────────────────────────────────────────────────────────
// Handles Pomodoro session state transitions and session-complete side effects.

const PomodoroModule = (() => {

  // Called by background every 15 s when the pomodoro alarm fires
  async function onTick() {
    const [pomodoro, settings] = await Promise.all([
      StorageService.getWithDefaults('pomodoro'),
      StorageService.getWithDefaults('pomodoroSettings'),
    ]);

    if (!pomodoro.running || !pomodoro.startedAt) return;

    const elapsed = Math.floor((Date.now() - pomodoro.startedAt) / 1000);
    pomodoro.timeLeft = Math.max(0, pomodoro.totalTime - elapsed);

    if (pomodoro.timeLeft <= 0) {
      await _handleSessionComplete(pomodoro, settings);
    } else {
      await StorageService.setKey('pomodoro', pomodoro);
    }
  }

  async function _handleSessionComplete(pomodoro, settings) {
    TimerEngine.stopPomodoro();
    pomodoro.running   = false;
    pomodoro.startedAt = null;

    if (pomodoro.mode === 'work' || pomodoro.mode === 'deepWork') {
      pomodoro.session        += 1;
      pomodoro.completedToday += 1;

      // Analytics: track actual minutes worked (accounts for deep work / custom durations)
      const analytics = await StorageService.getWithDefaults('analytics');
      analytics.focusMinutesToday = (analytics.focusMinutesToday || 0) +
        Math.round(pomodoro.totalTime / 60);
      await StorageService.setKey('analytics', analytics);

      const isLongBreak = pomodoro.session % settings.longBreakInterval === 0;
      pomodoro.mode      = isLongBreak ? 'longBreak' : 'shortBreak';
      pomodoro.totalTime = isLongBreak ? settings.longBreak : settings.shortBreak;

      NotificationService.show('tab:pomodoro:end', {
        title:   'Focus session complete! 🎉',
        message: isLongBreak
          ? 'Excellent work. Enjoy a well-earned 15-minute break.'
          : 'Good work! Take a 5-minute break.',
        priority: 2,
      }, true);

    } else {
      // Break phase ended → queue next work session
      pomodoro.mode          = 'work';
      pomodoro.totalTime     = settings.workTime;
      pomodoro.deepWorkActive = false;

      // Open the hydration alert window on break end — great time to drink
      // Use HydrationModule directly so window-dedup logic is reused
      await HydrationModule.onAlarm();

      if (settings.autoStart) {
        pomodoro.running   = true;
        pomodoro.startedAt = Date.now();
        TimerEngine.startPomodoro();
      } else {
        NotificationService.show('tab:pomodoro:break-end', {
          title:   'Break over',
          message: 'Ready to focus? Start your next session.',
          priority: 1,
        });
      }
    }

    pomodoro.timeLeft = pomodoro.totalTime;
    await StorageService.setKey('pomodoro', pomodoro);
  }

  // ── Controls (called from popup via messages) ─────────────────────────────

  async function start() {
    const pomodoro = await StorageService.getWithDefaults('pomodoro');
    pomodoro.running   = true;
    // Resume from remaining time if paused; otherwise start fresh
    pomodoro.startedAt = Date.now() - (pomodoro.totalTime - (pomodoro.timeLeft || pomodoro.totalTime)) * 1000;
    TimerEngine.startPomodoro();
    await StorageService.setKey('pomodoro', pomodoro);
    return { ok: true };
  }

  async function pause() {
    const pomodoro = await StorageService.getWithDefaults('pomodoro');
    if (pomodoro.running && pomodoro.startedAt) {
      const elapsed = Math.floor((Date.now() - pomodoro.startedAt) / 1000);
      pomodoro.timeLeft = Math.max(0, pomodoro.totalTime - elapsed);
    }
    pomodoro.running   = false;
    pomodoro.startedAt = null;
    TimerEngine.stopPomodoro();
    await StorageService.setKey('pomodoro', pomodoro);
    return { ok: true };
  }

  async function reset() {
    const [settings] = await Promise.all([
      StorageService.getWithDefaults('pomodoroSettings'),
    ]);
    const pomodoro = await StorageService.getWithDefaults('pomodoro');
    TimerEngine.stopPomodoro();
    pomodoro.running        = false;
    pomodoro.startedAt      = null;
    pomodoro.mode           = 'work';
    pomodoro.totalTime      = settings.workTime;
    pomodoro.timeLeft       = settings.workTime;
    pomodoro.deepWorkActive = false;
    await StorageService.setKey('pomodoro', pomodoro);
    return { ok: true };
  }

  async function switchMode(mode) {
    const settings = await StorageService.getWithDefaults('pomodoroSettings');
    const pomodoro = await StorageService.getWithDefaults('pomodoro');
    TimerEngine.stopPomodoro();

    const timeMap = {
      work:       settings.workTime,
      shortBreak: settings.shortBreak,
      longBreak:  settings.longBreak,
      deepWork:   settings.deepWorkTime,
    };

    pomodoro.running        = false;
    pomodoro.startedAt      = null;
    pomodoro.mode           = mode;
    pomodoro.totalTime      = timeMap[mode] ?? settings.workTime;
    pomodoro.timeLeft       = pomodoro.totalTime;
    pomodoro.deepWorkActive = (mode === 'deepWork');
    await StorageService.setKey('pomodoro', pomodoro);
    return { ok: true };
  }

  async function startDeepWork() {
    await switchMode('deepWork');
    return start();
  }

  async function updateSettings(newSettings) {
    const settings = await StorageService.getWithDefaults('pomodoroSettings');
    Object.assign(settings, newSettings);
    await StorageService.setKey('pomodoroSettings', settings);

    // If the timer isn't running, sync the displayed time to the new setting
    const pomodoro = await StorageService.getWithDefaults('pomodoro');
    if (!pomodoro.running) {
      const timeMap = {
        work:       settings.workTime,
        shortBreak: settings.shortBreak,
        longBreak:  settings.longBreak,
        deepWork:   settings.deepWorkTime,
      };
      pomodoro.totalTime = timeMap[pomodoro.mode] ?? settings.workTime;
      pomodoro.timeLeft  = pomodoro.totalTime;
      await StorageService.setKey('pomodoro', pomodoro);
    }
    return { ok: true };
  }

  return { onTick, start, pause, reset, switchMode, startDeepWork, updateSettings };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.PomodoroModule = PomodoroModule;
}
