// Record session progress and update storage
async function recordSession() {
  const now = Date.now();
  const data = await chrome.storage.local.get(["sessionState", "timeData"]);
  let timeData = data.timeData || {};
  let session = data.sessionState || null;

  if (session && session.startTime) {
    const timeSpent = Math.floor((now - session.startTime) / 1000);

    // Safety check: cap single sessions at 2 hours to avoid glitches
    if (timeSpent > 0 && timeSpent < 7200) {
      const today = new Date().toISOString().split("T")[0];
      const domain = session.domain;

      if (!timeData[today]) timeData[today] = {};
      if (!timeData[today][domain]) timeData[today][domain] = 0;

      timeData[today][domain] += timeSpent;
    }
  }
  return timeData;
}

// Handle tab/URL transitions
async function handleTabChange(tabId) {
  const timeData = await recordSession();
  const now = Date.now();
  let nextSession = null;

  if (tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab.url && tab.url.startsWith("http")) {
        const domain = new URL(tab.url).hostname.replace("www.", "");
        nextSession = { startTime: now, domain: domain };
      }
    } catch (e) {
      nextSession = null;
    }
  }

  await chrome.storage.local.set({ timeData, sessionState: nextSession });
}

// Listeners

// Listen for tab changes
chrome.tabs.onActivated.addListener((info) => handleTabChange(info.tabId));
chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
  if (change.url && tab.active) handleTabChange(tabId);
});

// Periodically record session time every 15 seconds
setInterval(async () => {
  const data = await chrome.storage.local.get(["sessionState"]);
  if (data.sessionState && data.sessionState.startTime) {
    // This will update the timeData with the time spent so far
    await chrome.storage.local.set({ timeData: await recordSession() });
    // Also update the session startTime to now to avoid double-counting
    const now = Date.now();
    await chrome.storage.local.set({
      sessionState: { ...data.sessionState, startTime: now },
    });
  }
}, 15000); // 15 seconds

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    handleTabChange(null);
  } else {
    chrome.tabs.query({ active: true, windowId }, (tabs) => {
      if (tabs[0]) handleTabChange(tabs[0].id);
    });
  }
});

// Alarm to prevent data loss during Service Worker suspension
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("pulse", { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) handleTabChange(tabs[0].id);
  });
});
