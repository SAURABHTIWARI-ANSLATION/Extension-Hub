// background.js
"use strict";

chrome.runtime.onInstalled.addListener(() => {
  console.log("URLBurst installed.");
});

const OBO_ALARM = "obo_tick";

async function oboStart(urls, waitSeconds) {
  const win = await chrome.windows.create({
    url: urls[0],
    type: "normal",
    state: "maximized",
    focused: true
  });

  const tabId = win.tabs[0].id;

  await chrome.storage.local.set({
    obo: { urls, waitSeconds, index: 0, windowId: win.id, tabId, running: true, paused: false }
  });

  notifyPopup({ action: "OBO_PROGRESS", index: 0, total: urls.length, url: urls[0] });
  chrome.alarms.create(OBO_ALARM, { delayInMinutes: waitSeconds / 60 });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== OBO_ALARM) return;
  const { obo } = await chrome.storage.local.get("obo");
  if (!obo || !obo.running || obo.paused) return;

  const nextIndex = obo.index + 1;
  if (nextIndex >= obo.urls.length) {
    await chrome.storage.local.set({ obo: { ...obo, running: false } });
    notifyPopup({ action: "OBO_DONE", total: obo.urls.length });
    return;
  }

  try {
    await chrome.tabs.update(obo.tabId, { url: obo.urls[nextIndex] });
  } catch (e) {
    await chrome.storage.local.set({ obo: { ...obo, running: false } });
    notifyPopup({ action: "OBO_STOPPED" });
    return;
  }

  await chrome.storage.local.set({ obo: { ...obo, index: nextIndex } });
  notifyPopup({ action: "OBO_PROGRESS", index: nextIndex, total: obo.urls.length, url: obo.urls[nextIndex] });
  chrome.alarms.create(OBO_ALARM, { delayInMinutes: obo.waitSeconds / 60 });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Only accept messages from this extension itself
  if (!sender || sender.id !== chrome.runtime.id) return;
  if (msg.action === "OBO_START") {
    oboStart(msg.urls, msg.waitSeconds).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.action === "OBO_PAUSE") {
    chrome.storage.local.get("obo", ({ obo }) => {
      if (!obo) return;
      chrome.alarms.clear(OBO_ALARM);
      chrome.storage.local.set({ obo: { ...obo, paused: true } }, () => sendResponse({ ok: true }));
    });
    return true;
  }
  if (msg.action === "OBO_RESUME") {
    chrome.storage.local.get("obo", ({ obo }) => {
      if (!obo) return;
      chrome.storage.local.set({ obo: { ...obo, paused: false } }, () => {
        chrome.alarms.create(OBO_ALARM, { delayInMinutes: obo.waitSeconds / 60 });
        sendResponse({ ok: true });
      });
    });
    return true;
  }
  if (msg.action === "OBO_PREV") {
    chrome.storage.local.get("obo", async ({ obo }) => {
      if (!obo || !obo.running) return;
      const idx = Math.max(0, obo.index - 1);
      chrome.alarms.clear(OBO_ALARM);
      try { await chrome.tabs.update(obo.tabId, { url: obo.urls[idx] }); } catch(e) {}
      await chrome.storage.local.set({ obo: { ...obo, index: idx, paused: false } });
      chrome.alarms.create(OBO_ALARM, { delayInMinutes: obo.waitSeconds / 60 });
      notifyPopup({ action: "OBO_PROGRESS", index: idx, total: obo.urls.length, url: obo.urls[idx] });
      sendResponse({ ok: true });
    });
    return true;
  }
  if (msg.action === "OBO_NEXT") {
    chrome.storage.local.get("obo", async ({ obo }) => {
      if (!obo || !obo.running) return;
      chrome.alarms.clear(OBO_ALARM);
      const idx = obo.index + 1;
      if (idx >= obo.urls.length) {
        await chrome.storage.local.set({ obo: { ...obo, running: false } });
        notifyPopup({ action: "OBO_DONE", total: obo.urls.length });
        sendResponse({ ok: true });
        return;
      }
      try { await chrome.tabs.update(obo.tabId, { url: obo.urls[idx] }); } catch(e) {}
      await chrome.storage.local.set({ obo: { ...obo, index: idx, paused: false } });
      chrome.alarms.create(OBO_ALARM, { delayInMinutes: obo.waitSeconds / 60 });
      notifyPopup({ action: "OBO_PROGRESS", index: idx, total: obo.urls.length, url: obo.urls[idx] });
      sendResponse({ ok: true });
    });
    return true;
  }
  if (msg.action === "OBO_STOP") {
    chrome.alarms.clear(OBO_ALARM);
    chrome.storage.local.set({ obo: null }, () => sendResponse({ ok: true }));
    return true;
  }
  if (msg.action === "OBO_STATUS") {
    chrome.storage.local.get("obo", ({ obo }) => sendResponse({ obo }));
    return true;
  }
});

function notifyPopup(msg) {
  chrome.runtime.sendMessage(msg).catch(() => {});
}
