'use strict';

// ── Breaks Module ─────────────────────────────────────────────────────────────
// Triggers break suggestions after long work sessions,
// independent of the Pomodoro cycle.

const BreaksModule = (() => {

  const BREAK_MESSAGES = [
    'Stand up and stretch for 2 minutes.',
    'Take a short walk — even 3 minutes helps.',
    'Roll your shoulders and neck gently.',
    'Look away from the screen and breathe deeply.',
    'Do a quick set of desk stretches.',
  ];

  async function onAlarm() {
    const [pomodoro, breaks] = await Promise.all([
      StorageService.getWithDefaults('pomodoro'),
      StorageService.getWithDefaults('breaks'),
    ]);

    if (!breaks.enabled) return;
    if (!Scheduler.canFireBreak(pomodoro)) return;

    // Update analytics
    const analytics = await StorageService.getWithDefaults('analytics');
    analytics.breaksToday = (analytics.breaksToday || 0) + 1;
    await StorageService.setKey('analytics', analytics);

    const message = BREAK_MESSAGES[Math.floor(Math.random() * BREAK_MESSAGES.length)];

    NotificationService.show('tab:breaks', {
      title: 'Time for a quick break',
      message,
      priority: 1,
    });
  }

  async function setEnabled(enabled) {
    const breaks = await StorageService.getWithDefaults('breaks');
    breaks.enabled = enabled;
    await StorageService.setKey('breaks', breaks);
    if (enabled) {
      TimerEngine.scheduleBreaks(breaks.intervalMinutes || 60);
    } else {
      TimerEngine.clearBreaks();
    }
    return { ok: true };
  }

  async function setInterval(minutes) {
    const breaks = await StorageService.getWithDefaults('breaks');
    breaks.intervalMinutes = minutes;
    await StorageService.setKey('breaks', breaks);
    if (breaks.enabled) TimerEngine.scheduleBreaks(minutes);
    return { ok: true };
  }

  return { onAlarm, setEnabled, setInterval };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.BreaksModule = BreaksModule;
}
