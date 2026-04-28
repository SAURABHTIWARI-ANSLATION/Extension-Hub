// Track active tabs with content scripts
const activeContentTabs = new Set();

// Listen for content script connections
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "contentScript") {
    const tabId = port.sender?.tab?.id;
    if (tabId) {
      activeContentTabs.add(tabId);
      port.onDisconnect.addListener(() => {
        activeContentTabs.delete(tabId);
      });
    }
  }
});

// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Relay text selection from content script to popup
  if (request.action === "textSelected" && sender.tab) {
    // Forward to popup if open
    chrome.runtime.sendMessage(request).catch(() => {
      // No popup open, ignore
    });
    sendResponse({ relayed: true });
    return true;
  }
  
  // Health check
  if (request.action === "ping") {
    sendResponse({ alive: true, time: Date.now() });
    return true;
  }
  
  return true;
});

// Ensure content script is injected when needed
chrome.action.onClicked.addListener((tab) => {
  if (tab.id && !activeContentTabs.has(tab.id)) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    }).catch(() => {});
  }
});