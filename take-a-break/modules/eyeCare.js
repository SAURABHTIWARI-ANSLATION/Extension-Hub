'use strict';

// ── Eye Care Module ───────────────────────────────────────────────────────────
// Implements the 20-20-20 rule: every 20 minutes, look at something
// 20 feet away for 20 seconds to reduce eye strain.

const EyeCareModule = (() => {

  async function onAlarm() {
    const [pomodoro, eyeCare] = await Promise.all([
      StorageService.getWithDefaults('pomodoro'),
      StorageService.getWithDefaults('eyeCare'),
    ]);

    if (!eyeCare.enabled) return;
    if (!Scheduler.canFireEyeCare(pomodoro)) return;

    NotificationService.show('tab:eyecare', {
      title:   '20-20-20 Eye Break',
      message: 'Look at something 20 feet away for 20 seconds to rest your eyes.',
      priority: 1,
    });
  }

  async function setEnabled(enabled) {
    const eyeCare = await StorageService.getWithDefaults('eyeCare');
    eyeCare.enabled = enabled;
    await StorageService.setKey('eyeCare', eyeCare);

    if (enabled) {
      TimerEngine.scheduleEyeCare(eyeCare.intervalMinutes || 20);
    } else {
      TimerEngine.clearEyeCare();
    }
    return { ok: true };
  }

  async function setInterval(minutes) {
    const eyeCare = await StorageService.getWithDefaults('eyeCare');
    eyeCare.intervalMinutes = minutes;
    await StorageService.setKey('eyeCare', eyeCare);
    if (eyeCare.enabled) TimerEngine.scheduleEyeCare(minutes);
    return { ok: true };
  }

  return { onAlarm, setEnabled, setInterval };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.EyeCareModule = EyeCareModule;
}
