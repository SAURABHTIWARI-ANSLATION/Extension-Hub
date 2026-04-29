'use strict';

// ── Scheduler ─────────────────────────────────────────────────────────────────
// Decides whether a given alert should fire based on the current system state.
//
// Priority order: pomodoro > break > eyecare > hydration
//
// Rules:
//   - During focus (pomodoro running) → suppress eyecare & hydration
//   - During a break → allow hydration, suppress eyecare
//   - Quiet hours → suppress hydration
//   - Goal reached → suppress hydration

const Scheduler = (() => {

  // ── Quiet Hours ───────────────────────────────────────────────────────────

  function _inQuietHours(hydration) {
    if (!hydration.quietEnabled) return false;
    const { quietStart, quietEnd } = hydration;
    if (!quietStart || !quietEnd) return false;

    const now = new Date();
    const [sh, sm] = quietStart.split(':').map(Number);
    const [eh, em] = quietEnd.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins   = eh * 60 + em;
    const nowMins   = now.getHours() * 60 + now.getMinutes();

    if (startMins <= endMins) {
      return nowMins >= startMins && nowMins <= endMins;
    }
    return nowMins >= startMins || nowMins <= endMins;
  }

  // ── Decision functions ────────────────────────────────────────────────────

  /**
   * Can a pomodoro session-end notification fire?
   * Always yes — it's the highest priority event.
   */
  function canFirePomodoro() {
    return true;
  }

  /**
   * Can a break reminder fire?
   * Yes, unless a pomodoro break is already active (handled by pomodoro itself).
   */
  function canFireBreak(pomodoro) {
    // If pomodoro is in a break phase, the break is already covered
    if (pomodoro && pomodoro.running &&
       (pomodoro.mode === 'shortBreak' || pomodoro.mode === 'longBreak')) {
      return false;
    }
    return true;
  }

  /**
   * Can an eye care reminder fire?
   * Suppress during active focus sessions (pomodoro running in work mode).
   */
  function canFireEyeCare(pomodoro) {
    if (pomodoro && pomodoro.running && pomodoro.mode === 'work') {
      return false;
    }
    return true;
  }

  /**
   * Can a hydration reminder fire?
   * - ONLY suppressed during quiet hours
   * - Always fires during focus, deep work, breaks, and even after goal is met
   *   (hydration is health-critical — it should never be silently blocked)
   *
   * NOTE: Focus-mode and goal-completion suppression have been intentionally
   * removed. Staying hydrated matters regardless of Pomodoro state.
   */
  function canFireHydration(pomodoro, hydration) {
    // Only hard block: user-configured quiet hours (e.g. sleeping)
    if (_inQuietHours(hydration)) {
      console.log('[Scheduler] canFireHydration → blocked by quiet hours');
      return false;
    }

    console.log('[Scheduler] canFireHydration → ALLOWED');
    return true;
  }

  return {
    canFirePomodoro,
    canFireBreak,
    canFireEyeCare,
    canFireHydration,
  };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.Scheduler = Scheduler;
}
