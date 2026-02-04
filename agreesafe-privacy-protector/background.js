// Background service worker for AgreeSafe Privacy Protector

let trackerStats = {};
let isEnabled = true;
let whitelist = [];

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  // Load saved settings
  chrome.storage.local.get(['isEnabled', 'whitelist', 'trackerStats'], (result) => {
    if (result.isEnabled !== undefined) {
      isEnabled = result.isEnabled;
    }
    if (result.whitelist) {
      whitelist = result.whitelist;
    }
    if (result.trackerStats) {
      trackerStats = result.trackerStats;
    }
  });
  
  console.log('AgreeSafe Privacy Protector installed');
});

// Listen for blocked requests
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((details) => {
  const url = new URL(details.request.url);
  const domain = url.hostname;
  
  // Update stats
  if (!trackerStats[domain]) {
    trackerStats[domain] = 0;
  }
  trackerStats[domain]++;
  
  // Save stats
  chrome.storage.local.set({ trackerStats });
});

// Monitor tab updates to check whitelist
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    checkWhitelist(tab.url, tabId);
  }
});

// Check if current site is whitelisted
function checkWhitelist(url, tabId) {
  try {
    const domain = new URL(url).hostname;
    const isWhitelisted = whitelist.some(w => domain.includes(w));
    
    // Update icon based on status
    updateIcon(tabId, isWhitelisted);
  } catch (e) {
    console.error('Error checking whitelist:', e);
  }
}

// Update extension icon
function updateIcon(tabId, isWhitelisted) {
  const iconPath = isWhitelisted || !isEnabled ? 'icons/icon-disabled' : 'icons/icon';
  
  chrome.action.setIcon({
    tabId: tabId,
    path: {
      16: `${iconPath}16.png`,
      32: `${iconPath}32.png`,
      48: `${iconPath}48.png`,
      128: `${iconPath}128.png`
    }
  });
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStats') {
    sendResponse({
      stats: trackerStats,
      isEnabled: isEnabled,
      whitelist: whitelist
    });
  } else if (request.action === 'toggleEnabled') {
    isEnabled = !isEnabled;
    chrome.storage.local.set({ isEnabled });
    
    // Update all tab icons
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url) {
          checkWhitelist(tab.url, tab.id);
        }
      });
    });
    
    sendResponse({ isEnabled });
  } else if (request.action === 'addToWhitelist') {
    if (!whitelist.includes(request.domain)) {
      whitelist.push(request.domain);
      chrome.storage.local.set({ whitelist });
    }
    sendResponse({ whitelist });
  } else if (request.action === 'removeFromWhitelist') {
    whitelist = whitelist.filter(d => d !== request.domain);
    chrome.storage.local.set({ whitelist });
    sendResponse({ whitelist });
  } else if (request.action === 'clearStats') {
    trackerStats = {};
    chrome.storage.local.set({ trackerStats });
    sendResponse({ success: true });
  }
  
  return true;
});

// Get total blocked count
function getTotalBlocked() {
  return Object.values(trackerStats).reduce((sum, count) => sum + count, 0);
}

// Update badge with blocked count
chrome.tabs.onActivated.addListener((activeInfo) => {
  updateBadge();
});

function updateBadge() {
  const total = getTotalBlocked();
  if (total > 0) {
    chrome.action.setBadgeText({ text: total > 999 ? '999+' : total.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Update badge periodically
setInterval(updateBadge, 5000);
