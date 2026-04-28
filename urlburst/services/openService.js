// services/openService.js — URLBurst
"use strict";

const OpenService = (() => {
  let _cancel = false;
  let _isRunning = false;

  function cancel() {
    _cancel = true;
    // Do NOT set _isRunning here; let the caller handle UI state
  }

  function isRunning() { return _isRunning; }

  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  const MAX_SAFE_TABS = 200; // hard safety cap

  async function openTabs(urls, settings, onProgress, onDone) {
    if (_isRunning) return; // prevent double-execution
    _cancel = false;
    _isRunning = true;

    const safeURLs = urls.slice(0, MAX_SAFE_TABS);
    const delayMs = Math.max(0, (parseFloat(settings.delay) || 0) * 1000);

    try {
      if (settings.openMode === "group") {
        await openGrouped(safeURLs, settings, delayMs, onProgress);
      } else if (delayMs === 0) {
        // Open All: launch every tab at the same time
        await openParallel(safeURLs, settings, onProgress);
      } else {
        await openSequential(safeURLs, settings, delayMs, onProgress);
      }
    } finally {
      _isRunning = false;
      if (onDone) onDone(_cancel ? -1 : safeURLs.length);
    }
  }

  async function openParallel(urls, settings, onProgress) {
    // Open all URLs simultaneously — no delay between tabs
    let completed = 0;
    await Promise.all(
      urls.map(async (url) => {
        if (_cancel) return;
        try {
          if (settings.openMode === "window") {
            await chrome.windows.create({ url, focused: !settings.inactiveLoad });
          } else {
            await chrome.tabs.create({ url, active: !settings.inactiveLoad });
          }
        } catch (err) {
          console.warn("[URLBurst] Failed to open tab:", url, err);
        }
        completed++;
        if (onProgress) onProgress(completed, urls.length);
      })
    );
  }

  async function openSequential(urls, settings, delayMs, onProgress) {
    for (let i = 0; i < urls.length; i++) {
      if (_cancel) break;
      if (onProgress) onProgress(i + 1, urls.length);

      try {
        if (settings.openMode === "window") {
          await chrome.windows.create({ url: urls[i], focused: !settings.inactiveLoad });
        } else {
          await chrome.tabs.create({ url: urls[i], active: !settings.inactiveLoad });
        }
      } catch (err) {
        console.warn("[URLBurst] Failed to open tab:", urls[i], err);
        // Continue; don't abort whole batch on one bad URL
      }

      if (i < urls.length - 1 && delayMs > 0) await sleep(delayMs);
    }
  }

  async function openGrouped(urls, settings, delayMs, onProgress) {
    const groupBy = settings.groupBy || "domain"; // "domain" | "tld"
    const groups = groupBy === "tld"
      ? Formatter.groupByTLD(urls)
      : Formatter.groupByHost(urls);

    let opened = 0;
    for (const [label, groupURLs] of groups.entries()) {
      if (_cancel) break;
      const ids = [];
      for (const url of groupURLs) {
        if (_cancel) break;
        opened++;
        if (onProgress) onProgress(opened, urls.length);
        try {
          const tab = await chrome.tabs.create({ url, active: !settings.inactiveLoad });
          ids.push(tab.id);
        } catch (err) {
          console.warn("[URLBurst] Failed to open tab:", url, err);
        }
        if (delayMs > 0) await sleep(delayMs);
      }
      if (ids.length > 0) {
        try {
          const gid = await chrome.tabs.group({ tabIds: ids });
          const title = label.startsWith("_") ? "Other" : label.replace(/^www\./, "");
          await chrome.tabGroups.update(gid, { title });
        } catch (_) { /* tabGroups may not be available in all contexts */ }
      }
    }
  }

  async function getCurrentTabURLs() {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    return tabs
      .map((t) => t.url)
      .filter((u) => u && !u.startsWith("chrome://") && !u.startsWith("about:") && !u.startsWith("chrome-extension://"));
  }

  return { openTabs, cancel, isRunning, getCurrentTabURLs, MAX_SAFE_TABS };
})();

if (typeof module !== "undefined") module.exports = OpenService;
