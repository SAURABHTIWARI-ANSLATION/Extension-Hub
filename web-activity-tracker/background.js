// background.js - Tracks active tab time for Chrome extension
const STORAGE_KEYS = {
  sessionState: "sessionState",
  siteLimits: "siteLimits",
  timeData: "timeData"
};

let activeSession = null;
let intervalId = null;
let alertCooldown = {};

// Update active session every second
function startTracking() {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(async () => {
    // FIX: Check if activeSession exists AND has required properties
    if (!activeSession || !activeSession.domain || !activeSession.startTime) return;
    
    const now = Date.now();
    const elapsed = Math.floor((now - activeSession.startTime) / 1000);
    if (elapsed >= 10) { // Update storage every 10 seconds
      await saveCurrentSession();
    }
  }, 1000);
}

async function saveCurrentSession() {
  // FIX: Comprehensive null check before accessing properties
  if (!activeSession) {
    console.log("No active session to save");
    return;
  }
  
  if (!activeSession.domain) {
    console.log("Active session missing domain");
    return;
  }
  
  if (!activeSession.startTime || typeof activeSession.startTime !== 'number') {
    console.log("Active session missing or invalid startTime");
    return;
  }
  
  try {
    const data = await chrome.storage.local.get([STORAGE_KEYS.timeData]);
    const timeData = data[STORAGE_KEYS.timeData] || {};
    const today = new Date().toISOString().split("T")[0];
    
    if (!timeData[today]) timeData[today] = {};
    
    // Calculate current session duration
    const now = Date.now();
    const duration = Math.floor((now - activeSession.startTime) / 1000);
    
    if (duration > 0) {
      timeData[today][activeSession.domain] = (timeData[today][activeSession.domain] || 0) + duration;
      await chrome.storage.local.set({ [STORAGE_KEYS.timeData]: timeData });
      
      // Reset session start time
      activeSession.startTime = now;
      await chrome.storage.local.set({ [STORAGE_KEYS.sessionState]: activeSession });
    }
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

// Handle tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    await updateActiveTab(tab);
  } catch (error) {
    console.error("Error getting tab:", error);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    updateActiveTab(tab);
  }
});

async function updateActiveTab(tab) {
  // FIX: Check if tab and url exist
  if (!tab || !tab.url) {
    await clearActiveSession();
    return;
  }
  
  // Check if URL is valid (http or https)
  if (!tab.url.startsWith('http')) {
    await clearActiveSession();
    return;
  }
  
  const domain = normalizeDomain(tab.url);
  if (!domain) {
    await clearActiveSession();
    return;
  }
  
  // Save previous session before switching
  if (activeSession && activeSession.domain && activeSession.startTime && activeSession.domain !== domain) {
    await saveCurrentSession();
  }
  
  // Start new session
  activeSession = {
    domain: domain,
    startTime: Date.now()
  };
  
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.sessionState]: activeSession });
  } catch (error) {
    console.error("Error saving session state:", error);
  }
}

async function clearActiveSession() {
  activeSession = null;
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.sessionState]: null });
  } catch (error) {
    console.error("Error clearing session state:", error);
  }
}

function normalizeDomain(url) {
  try {
    const p = new URL(url);
    if (!/^https?:$/.test(p.protocol)) return null;
    return p.hostname.replace(/^www\./, '');
  } catch (error) {
    console.error("Error normalizing domain:", error);
    return null;
  }
}

// Check limits and show notifications
async function checkLimits() {
  try {
    const data = await chrome.storage.local.get([STORAGE_KEYS.siteLimits, STORAGE_KEYS.timeData]);
    const limits = data[STORAGE_KEYS.siteLimits] || {};
    const timeData = data[STORAGE_KEYS.timeData] || {};
    const today = new Date().toISOString().split("T")[0];
    const todayData = timeData[today] || {};
    
    for (const [domain, limitMin] of Object.entries(limits)) {
      const spentSec = todayData[domain] || 0;
      const limitSec = limitMin * 60;
      
      // FIX: Check if notification permission is granted and cooldown
      if (spentSec >= limitSec && !alertCooldown[domain]) {
        alertCooldown[domain] = Date.now();
        
        // Check if notifications permission is granted
        const hasPermission = await chrome.permissions.contains({
          permissions: ['notifications']
        });
        
        if (hasPermission) {
          // Send notification
          chrome.notifications.create(`limit-${domain}-${Date.now()}`, {
            type: "basic",
            iconUrl: "icons/icons128.png",
            title: "Time Limit Reached",
            message: `You've spent ${Math.floor(spentSec / 60)} minutes on ${domain}. Your limit was ${limitMin} minutes.`,
            priority: 2
          }, (notificationId) => {
            if (chrome.runtime.lastError) {
              console.error("Notification error:", chrome.runtime.lastError);
            }
          });
        }
        
        // Clear cooldown after 5 minutes
        setTimeout(() => {
          delete alertCooldown[domain];
        }, 300000);
      }
    }
  } catch (error) {
    console.error("Error checking limits:", error);
  }
}

// Run limit check every 30 seconds
setInterval(checkLimits, 30000);

// Start tracking
startTracking();

// Save session when browser closes or extension unloads
chrome.runtime.onSuspend.addListener(async () => {
  // FIX: Check if activeSession exists and has required properties
  if (activeSession && activeSession.domain && activeSession.startTime && typeof activeSession.startTime === 'number') {
    await saveCurrentSession();
  }
});

// Also save when idle state changes
chrome.idle.onStateChanged.addListener(async (newState) => {
  // FIX: Check if activeSession exists and has required properties
  if ((newState === 'locked' || newState === 'idle') && 
      activeSession && 
      activeSession.domain && 
      activeSession.startTime && 
      typeof activeSession.startTime === 'number') {
    await saveCurrentSession();
  }
});

// Add listener for when Chrome starts up
chrome.runtime.onStartup.addListener(async () => {
  console.log("Extension starting up");
  try {
    const data = await chrome.storage.local.get([STORAGE_KEYS.sessionState]);
    if (data[STORAGE_KEYS.sessionState]) {
      activeSession = data[STORAGE_KEYS.sessionState];
      // Validate the restored session
      if (!activeSession.domain || !activeSession.startTime || typeof activeSession.startTime !== 'number') {
        activeSession = null;
        await chrome.storage.local.set({ [STORAGE_KEYS.sessionState]: null });
      }
    }
  } catch (error) {
    console.error("Error restoring session:", error);
    activeSession = null;
  }
});

// Error handling for uncaught promise rejections
self.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});