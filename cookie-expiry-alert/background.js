// Background service worker for monitoring cookie expiration

let monitoringInterval = null;
let cookieCache = new Map();

// Default settings
const DEFAULT_SETTINGS = {
  alertThresholds: [
    { time: 24 * 60 * 60, label: '24 hours' },
    { time: 60 * 60, label: '1 hour' },
    { time: 15 * 60, label: '15 minutes' },
    { time: 5 * 60, label: '5 minutes' }
  ],
  enabled: true,
  checkInterval: 60000 // Check every minute
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Cookie Expiry Alert installed');
  
  // Set default settings
  const result = await chrome.storage.local.get('settings');
  if (!result.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
  
  // Start monitoring
  startMonitoring();
});

// Start monitoring when service worker starts
startMonitoring();

// Function to start monitoring cookies
function startMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }
  
  // Initial check
  checkAllCookies();
  
  // Set up periodic checking
  monitoringInterval = setInterval(() => {
    checkAllCookies();
  }, DEFAULT_SETTINGS.checkInterval);
}

// Check all cookies for expiration
async function checkAllCookies() {
  try {
    const settings = await getSettings();
    if (!settings.enabled) return;
    
    const allCookies = await chrome.cookies.getAll({});
    const now = Date.now();
    
    for (const cookie of allCookies) {
      if (!cookie.expirationDate) continue; // Session cookie
      
      const expirationTime = cookie.expirationDate * 1000; // Convert to milliseconds
      const timeUntilExpiry = expirationTime - now;
      
      // Check if cookie is about to expire
      if (timeUntilExpiry > 0) {
        checkCookieExpiration(cookie, timeUntilExpiry, settings);
      }
    }
  } catch (error) {
    console.error('Error checking cookies:', error);
  }
}

// Check individual cookie expiration and send alerts
function checkCookieExpiration(cookie, timeUntilExpiry, settings) {
  const cookieId = `${cookie.domain}_${cookie.name}`;
  const timeInSeconds = Math.floor(timeUntilExpiry / 1000);
  
  for (const threshold of settings.alertThresholds) {
    const alertKey = `${cookieId}_${threshold.time}`;
    
    // Check if we're within the threshold window (±30 seconds tolerance)
    if (Math.abs(timeInSeconds - threshold.time) < 30) {
      // Check if we haven't already sent this alert
      if (!cookieCache.has(alertKey)) {
        sendExpiryNotification(cookie, threshold.label, timeUntilExpiry);
        cookieCache.set(alertKey, true);
        
        // Clean up old cache entries after alert is sent
        setTimeout(() => {
          cookieCache.delete(alertKey);
        }, 120000); // Clear after 2 minutes
      }
    }
  }
}

// Send notification about cookie expiration
function sendExpiryNotification(cookie, timeLabel, timeUntilExpiry) {
  const minutes = Math.floor(timeUntilExpiry / 60000);
  const hours = Math.floor(minutes / 60);
  
  let timeMessage;
  if (hours >= 24) {
    timeMessage = `in ${Math.floor(hours / 24)} day(s)`;
  } else if (hours >= 1) {
    timeMessage = `in ${hours} hour(s)`;
  } else {
    timeMessage = `in ${minutes} minute(s)`;
  }
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Cookie Expiring Soon! 🍪',
    message: `Cookie "${cookie.name}" from ${cookie.domain} will expire ${timeMessage}`,
    priority: 2,
    requireInteraction: minutes < 15
  });
}

// Get settings from storage
async function getSettings() {
  const result = await chrome.storage.local.get('settings');
  return result.settings || DEFAULT_SETTINGS;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCookies') {
    getAllCookiesWithExpiry().then(sendResponse);
    return true;
  } else if (request.action === 'updateSettings') {
    chrome.storage.local.set({ settings: request.settings }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Get all cookies with expiry information
async function getAllCookiesWithExpiry() {
  const allCookies = await chrome.cookies.getAll({});
  const now = Date.now();
  
  const cookiesWithExpiry = allCookies.map(cookie => {
    let timeUntilExpiry = null;
    let expiryStatus = 'session';
    
    if (cookie.expirationDate) {
      const expirationTime = cookie.expirationDate * 1000;
      timeUntilExpiry = expirationTime - now;
      
      if (timeUntilExpiry <= 0) {
        expiryStatus = 'expired';
      } else if (timeUntilExpiry < 5 * 60 * 1000) {
        expiryStatus = 'critical';
      } else if (timeUntilExpiry < 60 * 60 * 1000) {
        expiryStatus = 'warning';
      } else if (timeUntilExpiry < 24 * 60 * 60 * 1000) {
        expiryStatus = 'soon';
      } else {
        expiryStatus = 'ok';
      }
    }
    
    return {
      name: cookie.name,
      domain: cookie.domain,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      expirationDate: cookie.expirationDate,
      timeUntilExpiry,
      expiryStatus
    };
  });
  
  return cookiesWithExpiry;
}

// Listen for cookie changes
chrome.cookies.onChanged.addListener((changeInfo) => {
  if (!changeInfo.removed) {
    // Cookie was added or updated, check it immediately
    checkAllCookies();
  }
});
