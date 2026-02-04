// Popup script for Cookie Expiry Alert

let allCookies = [];
let currentFilter = 'all';
let updateInterval = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadCookies();
  setupEventListeners();
  
  // Update countdown every second
  updateInterval = setInterval(updateCountdowns, 1000);
});

// Load settings from storage
async function loadSettings() {
  const result = await chrome.storage.local.get('settings');
  const settings = result.settings;
  
  if (settings) {
    document.getElementById('enableToggle').checked = settings.enabled;
    updateToggleLabel(settings.enabled);
  }
}

// Load cookies from background script
async function loadCookies() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getCookies' });
    allCookies = response || [];
    displayCookies();
    updateStats();
  } catch (error) {
    console.error('Error loading cookies:', error);
    document.getElementById('cookieList').innerHTML = 
      '<div class="no-cookies">Error loading cookies. Please try again.</div>';
  }
}

// Display cookies in the list
function displayCookies() {
  const cookieList = document.getElementById('cookieList');
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  
  let filteredCookies = allCookies.filter(cookie => {
    // Apply search filter
    const matchesSearch = cookie.name.toLowerCase().includes(searchTerm) || 
                         cookie.domain.toLowerCase().includes(searchTerm);
    
    if (!matchesSearch) return false;
    
    // Apply status filter
    if (currentFilter === 'all') return true;
    return cookie.expiryStatus === currentFilter;
  });
  
  if (filteredCookies.length === 0) {
    cookieList.innerHTML = '<div class="no-cookies">No cookies found matching your filters.</div>';
    return;
  }
  
  // Sort by time until expiry (critical first)
  filteredCookies.sort((a, b) => {
    if (a.expiryStatus === 'session') return 1;
    if (b.expiryStatus === 'session') return -1;
    if (!a.timeUntilExpiry) return 1;
    if (!b.timeUntilExpiry) return -1;
    return a.timeUntilExpiry - b.timeUntilExpiry;
  });
  
  cookieList.innerHTML = filteredCookies.map(cookie => createCookieElement(cookie)).join('');
}

// Create HTML element for a cookie
function createCookieElement(cookie) {
  const statusLabel = getStatusLabel(cookie.expiryStatus);
  const expiryText = getExpiryText(cookie);
  const countdown = getCountdown(cookie.timeUntilExpiry);
  const badges = getCookieBadges(cookie);
  
  return `
    <div class="cookie-item ${cookie.expiryStatus}">
      <div class="cookie-header">
        <div class="cookie-name">${escapeHtml(cookie.name)}</div>
        <div class="cookie-status ${cookie.expiryStatus}">${statusLabel}</div>
      </div>
      <div class="cookie-domain">🌐 ${escapeHtml(cookie.domain)}</div>
      <div class="cookie-expiry">${expiryText}</div>
      ${countdown ? `<div class="cookie-countdown">${countdown}</div>` : ''}
      <div class="cookie-details">
        ${badges}
      </div>
    </div>
  `;
}

// Get status label text
function getStatusLabel(status) {
  const labels = {
    'critical': '⚠️ Critical',
    'warning': '⏰ Warning',
    'soon': '📅 Soon',
    'ok': '✅ OK',
    'session': '🔄 Session',
    'expired': '❌ Expired'
  };
  return labels[status] || status;
}

// Get expiry text
function getExpiryText(cookie) {
  if (cookie.expiryStatus === 'session') {
    return '📌 Session cookie (expires when browser closes)';
  }
  
  if (!cookie.expirationDate) {
    return '📌 No expiration date';
  }
  
  const date = new Date(cookie.expirationDate * 1000);
  return `⏱️ Expires: ${date.toLocaleString()}`;
}

// Get countdown text
function getCountdown(timeUntilExpiry) {
  if (!timeUntilExpiry || timeUntilExpiry <= 0) return null;
  
  const seconds = Math.floor(timeUntilExpiry / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h remaining`;
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m remaining`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s remaining`;
  } else {
    return `${seconds}s remaining`;
  }
}

// Get cookie badges
function getCookieBadges(cookie) {
  const badges = [];
  
  if (cookie.secure) badges.push('<span class="cookie-badge">🔒 Secure</span>');
  if (cookie.httpOnly) badges.push('<span class="cookie-badge">🚫 HttpOnly</span>');
  badges.push(`<span class="cookie-badge">📁 ${escapeHtml(cookie.path)}</span>`);
  
  return badges.join('');
}

// Update countdowns for all cookies
function updateCountdowns() {
  const now = Date.now();
  allCookies = allCookies.map(cookie => {
    if (cookie.expirationDate) {
      const expirationTime = cookie.expirationDate * 1000;
      cookie.timeUntilExpiry = expirationTime - now;
      
      // Update status based on new time
      if (cookie.timeUntilExpiry <= 0) {
        cookie.expiryStatus = 'expired';
      } else if (cookie.timeUntilExpiry < 5 * 60 * 1000) {
        cookie.expiryStatus = 'critical';
      } else if (cookie.timeUntilExpiry < 60 * 60 * 1000) {
        cookie.expiryStatus = 'warning';
      } else if (cookie.timeUntilExpiry < 24 * 60 * 60 * 1000) {
        cookie.expiryStatus = 'soon';
      } else {
        cookie.expiryStatus = 'ok';
      }
    }
    return cookie;
  });
  
  displayCookies();
  updateStats();
}

// Update statistics
function updateStats() {
  const total = allCookies.length;
  const expiringSoon = allCookies.filter(c => 
    c.expiryStatus === 'critical' || c.expiryStatus === 'warning'
  ).length;
  
  document.getElementById('totalCount').textContent = total;
  document.getElementById('expiringSoon').textContent = expiringSoon;
}

// Setup event listeners
function setupEventListeners() {
  // Toggle monitoring
  document.getElementById('enableToggle').addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    const result = await chrome.storage.local.get('settings');
    const settings = result.settings || {};
    settings.enabled = enabled;
    
    await chrome.runtime.sendMessage({ 
      action: 'updateSettings', 
      settings 
    });
    
    updateToggleLabel(enabled);
  });
  
  // Search
  document.getElementById('searchInput').addEventListener('input', () => {
    displayCookies();
  });
  
  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      displayCookies();
    });
  });
  
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    document.getElementById('cookieList').innerHTML = '<div class="loading">Refreshing cookies...</div>';
    await loadCookies();
  });
  
  // Settings button
  document.getElementById('settingsBtn').addEventListener('click', () => {
    alert('Settings panel coming soon! Current features:\n\n✅ Real-time monitoring\n✅ Automatic alerts\n✅ Multiple alert thresholds\n✅ Search & filter\n\nCustomizable settings will be added in the next update.');
  });
}

// Update toggle label
function updateToggleLabel(enabled) {
  document.getElementById('toggleLabel').textContent = enabled ? 'Enabled' : 'Disabled';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Cleanup on popup close
window.addEventListener('beforeunload', () => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});
