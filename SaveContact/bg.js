// Create context menu on install or update
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "save_contact",
      title: "Save to contacts queue",
      contexts: ["selection"],
    });
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "save_contact") return;
  if (!tab?.id) return;

  chrome.tabs.sendMessage(
    tab.id,
    { action: "saveSelection", selectionText: info.selectionText || "" },
    () => {
      // Suppress error if content script not available on some pages
      if (chrome.runtime.lastError) {
        console.debug("Message failed:", chrome.runtime.lastError.message);
      }
    }
  );
});
