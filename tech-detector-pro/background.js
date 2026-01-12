// Tech Detector Pro - Background Service Worker
console.log('Tech Detector Pro background service worker started');

// Store for tech data
let techDataCache = new Map();

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  console.log('Tech Detector Pro installed');
  
  // Set default settings
  chrome.storage.sync.set({
    autoScan: false,
    showNotifications: true,
    saveHistory: true,
    detailedScan: true
  });
});

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received:', message.type);
  
  try {
    switch (message.type) {
      case 'TECH_DATA':
        handleTechData(message.data, sender.tab?.id);
        sendResponse({ success: true });
        break;
        
      case 'GET_TECH_DATA':
        const data = techDataCache.get(sender.tab?.id);
        sendResponse(data || null);
        break;
        
      case 'CLEAR_CACHE':
        techDataCache.clear();
        sendResponse({ success: true });
        break;
        
      default:
        console.warn('Unknown message type:', message.type);
        sendResponse({ error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Message handler error:', error);
    sendResponse({ error: error.message });
  }
  
  return true; // Keep message channel open for async response
});

function handleTechData(data, tabId) {
  if (!data || !tabId) return;
  
  try {
    // Add metadata
    data.cachedAt = new Date().toISOString();
    data.tabId = tabId;
    
    // Cache the data
    techDataCache.set(tabId, data);
    
    console.log(`Tech data cached for tab ${tabId}:`, {
      url: data.url,
      techCount: countTechnologies(data.technologies)
    });
    
    // Show notification if enabled
    chrome.storage.sync.get(['showNotifications'], (result) => {
      if (result.showNotifications) {
        const techCount = countTechnologies(data.technologies);
        
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Tech Detector Pro',
          message: `Found ${techCount} technologies on this page`,
          priority: 1
        });
      }
    });
  } catch (error) {
    console.error('Error handling tech data:', error);
  }
}

// Helper function to count technologies
function countTechnologies(technologies) {
  if (!technologies || typeof technologies !== 'object') {
    return 0;
  }
  
  return Object.values(technologies)
    .filter(arr => Array.isArray(arr))
    .reduce((sum, arr) => sum + arr.length, 0);
}

// Clear cache when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (techDataCache.has(tabId)) {
    techDataCache.delete(tabId);
    console.log(`Cleared tech cache for closed tab ${tabId}`);
  }
});

// Clear cache when tab URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && techDataCache.has(tabId)) {
    techDataCache.delete(tabId);
    console.log(`Cleared tech cache for tab ${tabId} (URL changed)`);
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked for tab:', tab.id);
});