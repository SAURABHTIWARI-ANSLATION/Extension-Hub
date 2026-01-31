// content.js — Runs inside the webpage context

(() => {
  function collectPerformanceData() {
    try {
      const resources = performance.getEntriesByType("resource") || [];
      const navigationEntry = performance.getEntriesByType("navigation")[0];

      const totalTransfer = resources.reduce(
        (sum, r) => sum + (r.transferSize || 0),
        0
      );

      const loadTime = navigationEntry
        ? Math.round(navigationEntry.loadEventEnd)
        : performance.timing
        ? performance.timing.loadEventEnd - performance.timing.navigationStart
        : null;

      return {
        url: location.href,
        title: document.title,
        domCount: document.getElementsByTagName("*").length,
        requests: resources.length,
        loadTime,
        transferSizeKB: Math.round(totalTransfer / 1024),
        timestamp: Date.now()
      };
    } catch (err) {
      return { error: err.message };
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === "ANALYZE_PAGE") {
      const data = collectPerformanceData();
      sendResponse(data);
    }
  });
})();
