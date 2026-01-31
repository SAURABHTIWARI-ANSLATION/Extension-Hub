chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;

  // Block restricted URLs where scripts cannot be injected
  const restrictedProtocols = ["chrome://", "chrome-extension://", "edge://", "about:", "https://chrome.google.com/webstore"];
  if (restrictedProtocols.some(p => tab.url.startsWith(p))) {
    console.warn("Cannot run on restricted page:", tab.url);
    return;
  }

  // 1. Check if content script is already alive
  const alive = await new Promise(resolve => {
    chrome.tabs.sendMessage(tab.id, { action: "PING" }, (response) => {
      if (chrome.runtime.lastError) resolve(false);
      else resolve(response === "PONG");
    });
  });

  if (alive) {
    chrome.tabs.sendMessage(tab.id, { action: "TOGGLE" });
  } else {
    // 2. Not alive, inject and then toggle
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
      
      // Wait a moment for initialization
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, { action: "TOGGLE" });
      }, 200);
    } catch (err) {
      console.error("Failed to inject script:", err);
    }
  }
});
