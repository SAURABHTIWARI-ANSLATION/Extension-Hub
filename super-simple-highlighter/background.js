// Background service worker for Simple Highlighter

// Set up context menu
chrome.runtime.onInstalled.addListener(() => {
  console.log('Simple Highlighter installed');
  
  // Create context menu
  chrome.contextMenus.create({
    id: 'toggle-highlight',
    title: 'Toggle Highlight Mode',
    contexts: ['all']
  });
  
  // Set default settings
  chrome.storage.sync.set({
    highlightColor: 'yellow',
    autoRestore: true,
    showTooltip: true
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'toggle-highlight') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'setHighlightMode',
      enabled: true
    });
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-highlight') {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'setHighlightMode',
          enabled: true
        });
      }
    });
  }
});

// Handle tab updates to restore highlights
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if auto-restore is enabled
    chrome.storage.sync.get(['autoRestore'], (data) => {
      if (data.autoRestore !== false) {
        // Give page time to load completely
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {
            action: 'refreshHighlights'
          }).catch(() => {
            // Content script might not be ready yet
          });
        }, 1000);
      }
    });
  }
});