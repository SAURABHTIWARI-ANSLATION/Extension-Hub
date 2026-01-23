// Default settings
const defaultSettings = {
  fullscreen: false,
  clearHistory: true,
  closeOriginalTab: false
};

// Initialize settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("settings", (res) => {
    if (!res.settings) {
      chrome.storage.local.set({ settings: defaultSettings });
    }
  });

  // Context menu
  chrome.contextMenus.create({
    id: "open-incognito",
    title: "Open this tab in incognito",
    contexts: ["page"]
  });
});

// Handle context menu
chrome.contextMenus.onClicked.addListener(() => {
  openCurrentTabInIncognito();
});

// Handle popup + shortcut
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "OPEN_INCOGNITO") {
    openCurrentTabInIncognito();
  }
});

// Keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-incognito") {
    openCurrentTabInIncognito();
  }
});

function openCurrentTabInIncognito() {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab) return;

    chrome.storage.local.get("settings", (res) => {
      const settings = res.settings || defaultSettings;

      chrome.windows.create(
        {
          incognito: true,
          url: tab.url,
          state: settings.fullscreen ? "fullscreen" : "normal"
        },
        () => {
          if (settings.clearHistory) {
            chrome.history.deleteUrl({ url: tab.url });
          }

          if (settings.closeOriginalTab) {
            chrome.tabs.remove(tab.id);
          }
        }
      );
    });
  });
}
