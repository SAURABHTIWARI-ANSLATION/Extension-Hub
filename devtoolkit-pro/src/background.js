// background.js — Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    darkMode: false,
    pinnedTools: [],
    toolShortcuts: {}
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CLEAR_BROWSING_DATA") {
    chrome.browsingData.remove(
      { since: 0 },
      { cache: true, cookies: true, localStorage: true, sessionStorage: true },
      () => sendResponse({ success: true })
    );
    return true;
  }

  if (message.type === "GET_COOKIES") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const url = new URL(tabs[0].url);
        chrome.cookies.getAll({ domain: url.hostname }, (cookies) => {
          sendResponse({ cookies });
        });
      }
    });
    return true;
  }

  if (message.type === "DELETE_COOKIE") {
    chrome.cookies.remove({ url: message.url, name: message.name }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
