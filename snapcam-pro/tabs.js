// tabs.js — Main navigation tab switching for SnapCam Pro
// CSP-safe: no eval, no inline handlers, no dynamic code

(function () {
  'use strict';

  var mainTabs  = Array.from(document.querySelectorAll('.main-tab'));
  var tabPanels = Array.from(document.querySelectorAll('.tab-panel'));

  function switchMainTab(targetId) {
    mainTabs.forEach(function (tab) {
      var isActive = tab.dataset.tab === targetId;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });
    tabPanels.forEach(function (panel) {
      panel.hidden = panel.id !== 'tab-' + targetId;
    });
  }

  mainTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      switchMainTab(tab.dataset.tab);
    });
  });

  // Sync library count badge when popup.js updates the gallery
  // Uses a MutationObserver so it stays decoupled from popup.js
  var libraryCount = document.getElementById('libraryCount');
  var navLibCount  = document.getElementById('navLibCount');

  if (libraryCount && navLibCount) {
    var observer = new MutationObserver(function () {
      var text = libraryCount.textContent || '';
      var match = text.match(/\d+/);
      var count = match ? parseInt(match[0], 10) : 0;
      navLibCount.textContent = count > 0 ? String(count) : '0';
      navLibCount.classList.toggle('has-items', count > 0);
    });
    observer.observe(libraryCount, { childList: true, characterData: true, subtree: true });
  }

  // Expose switcher so popup.js can switch to library tab after a capture
  window.snapcamSwitchTab = switchMainTab;
}());
