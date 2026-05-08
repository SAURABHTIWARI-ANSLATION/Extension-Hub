// Background service worker for My Web Library extension
// Security hardened version

// Initialize extension on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('My Web Library extension installed');
  
  // Initialize storage if empty
  chrome.storage.local.get(['webLibrary'], (result) => {
    if (!result.webLibrary) {
      chrome.storage.local.set({ webLibrary: [] });
    }
  });
  
  // Initialize settings
  chrome.storage.local.get(['librarySettings'], (result) => {
    if (!result.librarySettings) {
      chrome.storage.local.set({ 
        librarySettings: {
          autoTag: true,
          saveScreenshot: false,
          defaultView: 'save'
        }
      });
    }
  });
});

// Handle keyboard shortcuts
if (chrome.commands) {
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'save-to-library') {
      chrome.action.openPopup().catch(err => {
        console.error('Failed to open popup:', err);
      });
    }
  });
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentTab') {
    chrome.tabs.query({ active: true, currentWindow: true })
      .then(tabs => {
        if (tabs && tabs[0]) {
          sendResponse({ tab: tabs[0] });
        } else {
          sendResponse({ error: 'No active tab found' });
        }
      })
      .catch(err => {
        sendResponse({ error: err.message });
      });
    return true;
  }
  
  // Add validation for other messages
  if (request.action === 'validateUrl') {
    const url = request.url;
    const isValid = url && (url.startsWith('https://') || url.startsWith('http://'));
    sendResponse({ isValid });
    return true;
  }
  
  return false;
});

// Keep service worker alive with heartbeats
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'keepAlive') {
    port.onDisconnect.addListener(() => {});
    port.postMessage({ type: 'connected' });
  }
});