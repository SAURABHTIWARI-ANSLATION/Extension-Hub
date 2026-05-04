// background.js - Service worker for Live Web Editor (toolbar-free version)

const editModeByTabId = new Map();

function canMessageTab(tab) {
  if (!tab || typeof tab.id !== "number") return false;
  const url = tab.url || "";
  return url && !url.startsWith("chrome://") && !url.startsWith("chrome-extension://") && !url.startsWith("edge://");
}

function sendMessageToTab(tab, message) {
  if (!canMessageTab(tab)) return;
  chrome.tabs.sendMessage(tab.id, message).catch(() => {});
}

// ── Context Menu Setup ──

function createContextMenuItem(options) {
  chrome.contextMenus.create(options, () => {
    if (!chrome.runtime.lastError) return;
    console.warn(`Context menu "${options.id}" was not created: ${chrome.runtime.lastError.message}`);
  });
}

function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      console.warn(`Context menus were not reset: ${chrome.runtime.lastError.message}`);
    }

    createContextMenuItem({
      id: "lwe-save-selection",
      title: "Save Selection for Editing",
      contexts: ["selection"]
    });

    createContextMenuItem({
      id: "lwe-toggle-edit-mode",
      title: "Toggle Edit Mode",
      contexts: ["page", "selection"]
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenus();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab) return;

  if (info.menuItemId === "lwe-save-selection") {
    // Save the current selection in the content script
    sendMessageToTab(tab, { action: "saveSelectionFromContextMenu" });
  }

  if (info.menuItemId === "lwe-toggle-edit-mode") {
    sendMessageToTab(tab, { action: "toggleEditMode" });
  }
});

// ── Keyboard Shortcut ──

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-edit-mode") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) sendMessageToTab(tabs[0], { action: "toggleEditMode" });
    });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  editModeByTabId.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") editModeByTabId.delete(tabId);
});

// ── Message Relay ──

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "setEditModeState") {
    const tabId = sender.tab && typeof sender.tab.id === "number" ? sender.tab.id : null;
    if (tabId !== null) editModeByTabId.set(tabId, !!message.editMode);
    sendResponse({ success: true });
  }
});
