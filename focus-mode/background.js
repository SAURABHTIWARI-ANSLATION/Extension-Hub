function isWithinTime(start, end) {
  const now = new Date();
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const s = new Date(); s.setHours(sh, sm, 0);
  const e = new Date(); e.setHours(eh, em, 0);
  return now >= s && now <= e;
}

// reset blockCount daily
chrome.runtime.onStartup.addListener(resetIfNewDay);
chrome.runtime.onInstalled.addListener(resetIfNewDay);

function resetIfNewDay() {
  chrome.storage.sync.get(["lastReset"], res => {
    const today = new Date().toDateString();
    if (res.lastReset !== today) {
      chrome.storage.sync.set({ blockCount: 0, lastReset: today });
    }
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.url || changeInfo.status !== "complete") return;

  chrome.storage.sync.get(["blocked","focusOn","startTime","endTime","emergencyUntil","blockCount"], (res) => {
    const now = Date.now();
    if (!res.focusOn || now < (res.emergencyUntil||0)) return;
    if (!isWithinTime(res.startTime||"09:00", res.endTime||"18:00")) return;

    (res.blocked||[]).forEach(site => {
      if (tab.url.includes(site)) {
        chrome.storage.sync.set({ blockCount:(res.blockCount||0)+1 });
        chrome.tabs.update(tabId,{url:chrome.runtime.getURL("blocked.html")});
      }
    });
  });
});
