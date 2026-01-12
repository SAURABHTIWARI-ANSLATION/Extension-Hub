// Background script for Quick Web Scraper extension

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === "fetchDetailPage" && message.url) {
    fetchDetailPage(message.url)
      .then((content) => sendResponse({ content }))
      .catch((e) => sendResponse({ error: e?.message || String(e) }));
    return true; // async
  }
});

async function fetchDetailPage(url) {
  const res = await fetch(url, { credentials: "omit", cache: "no-store" });
  const ct = res.headers.get("content-type") || "";
  if (!res.ok || !ct.includes("text/html")) {
    throw new Error(`Bad response: ${res.status}`);
  }
  return await res.text();
}

// Log initialization
console.log('Quick Web Scraper extension initialized');

// Set up browser action
chrome.action.onClicked.addListener((tab) => {
  // If the user clicks the icon directly (without opening popup),
  // we can open the popup programmatically
  if (!tab.url.startsWith('chrome://')) {
    chrome.action.openPopup();
  }
});

// Initialize extension
function initialize() {
  console.log('Easy Scraper extension initialized');
}

// Run initialization
initialize();