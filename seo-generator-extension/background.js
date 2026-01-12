/* -------------------------------------------------
   SEO Analyzer Pro – Background Service Worker
   Simple Version
-------------------------------------------------- */

let seoReport = null;

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  console.log("SEO Analyzer Pro installed");
  // Set default settings
  chrome.storage.sync.set({
    autoAnalyze: false,
    showNotifications: true,
    saveHistory: true,
    theme: 'light'
  });
});

// Message Handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received:", message.type);
  
  switch (message.type) {
    case 'SEO_DATA':
      console.log("SEO data received:", message.data);
      seoReport = message.data;
      seoReport.receivedAt = new Date().toISOString();
      sendResponse({ success: true });
      return true;
      
    case 'GET_SEO_REPORT':
      console.log("Sending SEO report:", seoReport);
      sendResponse(seoReport);
      return true;
      
    case 'CLEAR_CACHE':
      seoReport = null;
      sendResponse({ success: true });
      return true;
      
    default:
      console.warn("Unknown message type:", message.type);
      sendResponse({ error: "Unknown message type" });
      return false;
  }
});

console.log('SEO Analyzer Pro Background Service Worker started');