// WhatFont Background Service Worker
console.log('WhatFont background service worker loaded');

// Keep service worker alive
let keepAlive;

function startKeepAlive() {
  if (keepAlive) return;
  keepAlive = setInterval(() => {
    chrome.storage.local.get('keepAlive', () => {});
  }, 20000);
}

startKeepAlive();

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('WhatFont installed:', details.reason);
  
  // Initialize default settings
  chrome.storage.local.set({
    whatFontActive: false,
    detectionMode: 'hover',
    detectedFonts: [],
    showDownload: true,
    showCSS: true,
    highlightText: false,
    panelPosition: 'top-right'
  });
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  switch (request.action) {
    case 'fontDetected':
      // Forward font detection to popup if it's open
      chrome.runtime.sendMessage(request).catch(() => {
        console.log('Popup not open, storing font detection');
      });
      sendResponse({success: true});
      break;
      
    case 'getActiveTab':
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        sendResponse({tab: tabs[0]});
      });
      return true; // Keep channel open for async response
      
    case 'ping':
      sendResponse({status: 'alive'});
      break;
      
    default:
      sendResponse({success: false, error: 'Unknown action'});
  }
  
  return false;
});

// Inject content script when tabs are updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if URL is accessible
    if (!tab.url.startsWith('chrome://') && 
        !tab.url.startsWith('chrome-extension://') &&
        !tab.url.startsWith('edge://')) {
      
      chrome.storage.local.get(['whatFontActive', 'detectionMode'], (data) => {
        if (data.whatFontActive) {
          // Re-activate detection on page load
          chrome.tabs.sendMessage(tabId, {
            action: 'activateFontDetection',
            mode: data.detectionMode || 'hover'
          }).catch((err) => {
            console.log('Could not activate on tab:', err.message);
          });
        }
      });
    }
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked for tab:', tab.id);
});

console.log('WhatFont background service worker initialized');