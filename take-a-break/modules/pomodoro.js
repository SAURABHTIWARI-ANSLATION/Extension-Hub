'use strict';

// ── Pomodoro Module ───────────────────────────────────────────────────────────
// Handles Pomodoro session state transitions and session-complete side effects.

const PomodoroModule = (() => {

  // Called by background when the pomodoro alarm fires
  async function onTick() {
    const [pomodoroRaw, settingsRaw] = await Promise.all([
      StorageService.getWithDefaults('pomodoro'),
      StorageService.getWithDefaults('pomodoroSettings'),
    ]);

    const pomodoro = pomodoroRaw;
    const settings = settingsRaw;

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
    pomodoro.running = false;
    pomodoro.startedAt = null;

    if (pomodoro.mode === 'work' || pomodoro.mode === 'deepWork') {
      pomodoro.session += 1;
      pomodoro.completedToday += 1;

      // Update analytics
      const analytics = await StorageService.getWithDefaults('analytics');
      analytics.focusMinutesToday += Math.round(pomodoro.totalTime / 60);
      await StorageService.setKey('analytics', analytics);

      const isLongBreak = pomodoro.session % settings.longBreakInterval === 0;
      pomodoro.mode = isLongBreak ? 'longBreak' : 'shortBreak';
      pomodoro.totalTime = isLongBreak ? settings.longBreak : settings.shortBreak;

      NotificationService.show('tab:pomodoro:end', {
        title: 'Focus session complete',
        message: isLongBreak
          ? 'Excellent work. Time for a 15-minute break.'
          : 'Good work. Take a 5-minute break.',
        priority: 2,
      }, true);

    } else {
      // Coming back from a break
      pomodoro.mode = 'work';
      pomodoro.totalTime = settings.workTime;
      pomodoro.deepWorkActive = false;

      // Trigger hydration alert window on break end (great timing)
      const hydration = await StorageService.getWithDefaults('hydration');
      if (Scheduler.canFireHydration(pomodoro, hydration)) {
        // Open the floating water alert popup
        const windows = await chrome.windows.getAll({ populate: true, windowTypes: ['popup'] });
        const alreadyOpen = windows.some(w =>
          w.tabs && w.tabs.some(t => t.url && t.url.includes('alert.html'))
        );
        if (!alreadyOpen) {
          chrome.windows.create({ url: 'alert.html', type: 'popup', width: 380, height: 420, focused: true });
        }
      } else {
        NotificationService.show('tab:pomodoro:end', {
          title: 'Break over',
          message: 'Ready to focus? Start your next session.',
          priority: 1,
        });
      }

      if (settings.autoStart) {
        pomodoro.running = true;
        pomodoro.startedAt = Date.now();
        TimerEngine.startPomodoro();
      }
    }

    pomodoro.timeLeft = pomodoro.totalTime;
    await StorageService.setKey('pomodoro', pomodoro);
  }

  // ── Controls (called from popup via messages) ─────────────────────────────

  async function start() {
    const pomodoro = await StorageService.getWithDefaults('pomodoro');
    pomodoro.running = true;
    pomodoro.startedAt = Date.now() - (pomodoro.totalTime - pomodoro.timeLeft) * 1000;
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
    pomodoro.running = false;
    pomodoro.startedAt = null;
    TimerEngine.stopPomodoro();
    await StorageService.setKey('pomodoro', pomodoro);
    return { ok: true };
  }

  async function reset() {
    const settings = await StorageService.getWithDefaults('pomodoroSettings');
    const pomodoro = await StorageService.getWithDefaults('pomodoro');
    TimerEngine.stopPomodoro();
    pomodoro.running = false;
    pomodoro.startedAt = null;
    pomodoro.mode = 'work';
    pomodoro.totalTime = settings.workTime;
    pomodoro.timeLeft = settings.workTime;
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

    pomodoro.running = false;
    pomodoro.startedAt = null;
    pomodoro.mode = mode;
    pomodoro.totalTime = timeMap[mode] ?? settings.workTime;
    pomodoro.timeLeft = pomodoro.totalTime;
    pomodoro.deepWorkActive = mode === 'deepWork';
    await StorageService.setKey('pomodoro', pomodoro);
    return { ok: true };
  }

  async function startDeepWork() {
    await switchMode('deepWork');
    await start();
    return { ok: true };
  }

  async function updateSettings(newSettings) {
    const settings = await StorageService.getWithDefaults('pomodoroSettings');
    Object.assign(settings, newSettings);
    await StorageService.setKey('pomodoroSettings', settings);

    // If not running, update current timer to reflect new settings
    const pomodoro = await StorageService.getWithDefaults('pomodoro');
    if (!pomodoro.running) {
      const timeMap = {
        work:       settings.workTime,
        shortBreak: settings.shortBreak,
        longBreak:  settings.longBreak,
        deepWork:   settings.deepWorkTime,
      };
      pomodoro.totalTime = timeMap[pomodoro.mode] ?? settings.workTime;
      pomodoro.timeLeft = pomodoro.totalTime;
      await StorageService.setKey('pomodoro', pomodoro);
    }
    return { ok: true };
  }

  return { onTick, start, pause, reset, switchMode, startDeepWork, updateSettings };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.PomodoroModule = PomodoroModule;
}
