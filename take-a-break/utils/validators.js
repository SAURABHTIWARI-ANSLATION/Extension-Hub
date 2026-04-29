'use strict';

const Validators = (() => {

  function clamp(val, min, max) {
    return Math.min(Math.max(Number(val) || min, min), max);
  }

  function toMinutes(inputEl, min, max) {
    return clamp(parseInt(inputEl.value, 10), min, max);
  }

  function toSeconds(inputEl, minMin, maxMin) {
    return toMinutes(inputEl, minMin, maxMin) * 60;
  }

  return { clamp, toMinutes, toSeconds };
})();
