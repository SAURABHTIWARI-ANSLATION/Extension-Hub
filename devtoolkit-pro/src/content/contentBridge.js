// contentBridge.js — Lightweight bridge for receiving tool dispatch events

(function () {
  if (window.__WDT_BRIDGE_LOADED__) return;
  window.__WDT_BRIDGE_LOADED__ = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "PING") {
      sendResponse({ ready: true });
    }
  });
})();
