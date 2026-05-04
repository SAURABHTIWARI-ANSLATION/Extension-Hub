// Background service worker for PiP Master
let currentPiPTabId = null;

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-pip') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab && tab.id) {
        // Check if tab is valid (not chrome:// or chrome-extension://)
        if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))) {
          console.log('Cannot use PiP on this page');
          return;
        }
        
        // Try to send message to content script
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: 'togglePiP' });
          if (response && response.success) {
            if (response.isActive) {
              currentPiPTabId = tab.id;
            } else {
              currentPiPTabId = null;
            }
          }
        } catch (error) {
          // Content script not loaded, inject it
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['content.css']
          });
          
          // Try again after injection
          setTimeout(async () => {
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'togglePiP' });
            if (response && response.success && response.isActive) {
              currentPiPTabId = tab.id;
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Background error:', error);
    }
  }
});

// Listen for tab updates to re-inject if needed
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    try {
      await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    } catch (error) {
      // Script not loaded, will be loaded when needed
    }
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('PiP Master installed successfully');
  
  if (details.reason === 'install') {
    console.log('Welcome to PiP Master! Use Ctrl+Shift+P to toggle Picture-in-Picture mode.');
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'pipStateChanged') {
    if (message.isActive) {
      currentPiPTabId = sender.tab.id;
    } else if (currentPiPTabId === sender.tab.id) {
      currentPiPTabId = null;
    }
    sendResponse({ received: true });
  }
  return true;
});