'use strict';

// ── Scheduler ─────────────────────────────────────────────────────────────────
// Decides whether a given alert should fire based on the current system state.
//
// Priority order (high → low): pomodoro > break > eyecare > hydration
//
// Rules:
//   - During focus (pomodoro running in work mode) → suppress eyecare only
//   - Hydration fires always except during user-configured quiet hours
//   - Quiet hours → suppress hydration
//   - canFireBreak → skip only if pomodoro is already in a break phase

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

    // Handle overnight spans (e.g. 22:00 → 07:00)
    if (startMins > endMins) {
      return nowMins >= startMins || nowMins <= endMins;
    }
    return nowMins >= startMins && nowMins <= endMins;
  }

  // ── Decision functions ────────────────────────────────────────────────────

  /**
   * Pomodoro session-end: always fires — highest priority event.
   */
  function canFirePomodoro() {
    return true;
  }

  /**
   * Break reminder: suppressed only when pomodoro is already in a break phase
   * (break is already covered by the pomodoro cycle itself).
   */
  function canFireBreak(pomodoro) {
    if (
      pomodoro &&
      pomodoro.running &&
      (pomodoro.mode === 'shortBreak' || pomodoro.mode === 'longBreak')
    ) {
      return false;
    }
    return true;
  }

  /**
   * Eye care reminder: suppressed during active focus sessions so the user
   * isn't interrupted mid-flow, but fires freely during breaks.
   */
  function canFireEyeCare(pomodoro) {
    if (pomodoro && pomodoro.running && pomodoro.mode === 'work') return false;
    if (pomodoro && pomodoro.deepWorkActive) return false;
    return true;
  }

  /**
   * Hydration reminder: health-critical — only suppressed by quiet hours.
   * Focus mode, deep work, and goal completion no longer block it.
   * Staying hydrated matters regardless of productivity state.
   */
  function canFireHydration(hydration) {
    if (_inQuietHours(hydration)) {
      console.log('[Scheduler] Hydration blocked — quiet hours active');
      return false;
    }
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
