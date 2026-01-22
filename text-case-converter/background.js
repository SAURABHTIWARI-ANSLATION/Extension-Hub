// Simple background script for messaging
console.log('Background script loaded');

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received:', request.action, 'from:', sender.tab?.url);
  
  // Relay messages from content script to popup
  if (request.action === "textSelected" && sender.tab) {
    // Forward to popup if it's listening
    chrome.runtime.sendMessage(request);
    sendResponse({ relayed: true });
    return true;
  }
  
  // Handle ping requests
  if (request.action === "ping") {
    sendResponse({ alive: true, time: Date.now() });
    return true;
  }
  
  return true;
});