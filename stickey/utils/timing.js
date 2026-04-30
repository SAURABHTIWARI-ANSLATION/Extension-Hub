/* global Stickey */

(() => {
  function debounce(fn, ms) {
    let t = 0;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  Stickey.timing = { debounce };
})();

