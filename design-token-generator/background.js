// Background service worker - FIXED VERSION
chrome.runtime.onInstalled.addListener(() => {
  console.log('🎨 Design Token Generator installed');
});

// Optional: Add more useful background functionality
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_EXTENSION_INFO') {
    sendResponse({
      version: chrome.runtime.getManifest().version,
      name: 'Design Token Generator'
    });
  }
  return true;
});