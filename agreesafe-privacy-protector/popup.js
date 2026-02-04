// Popup JavaScript for AgreeSafe Privacy Protector

let currentDomain = '';

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  setupEventListeners();
  getCurrentTab();
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById('toggleProtection').addEventListener('change', toggleProtection);
  document.getElementById('whitelistBtn').addEventListener('click', toggleWhitelist);
  document.getElementById('clearStats').addEventListener('click', clearStats);
}

// Load stats from background
function loadStats() {
  chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
    if (response) {
      updateUI(response);
    }
  });
}

// Update UI with stats
function updateUI(data) {
  const { stats, isEnabled, whitelist } = data;
  
  // Update protection status
  const statusText = document.getElementById('statusText');
  const toggleSwitch = document.getElementById('toggleProtection');
  
  if (isEnabled) {
    statusText.textContent = 'Active';
    statusText.classList.remove('disabled');
    toggleSwitch.checked = true;
  } else {
    statusText.textContent = 'Disabled';
    statusText.classList.add('disabled');
    toggleSwitch.checked = false;
  }
  
  // Calculate total blocked
  const totalBlocked = Object.values(stats).reduce((sum, count) => sum + count, 0);
  const sitesProtected = Object.keys(stats).length;
  
  document.getElementById('totalBlocked').textContent = totalBlocked.toLocaleString();
  document.getElementById('sitesProtected').textContent = sitesProtected.toLocaleString();
  
  // Update tracker list
  updateTrackerList(stats);
  
  // Update whitelist
  updateWhitelistUI(whitelist);
}

// Update tracker list
function updateTrackerList(stats) {
  const trackerList = document.getElementById('trackerList');
  
  if (Object.keys(stats).length === 0) {
    trackerList.innerHTML = '<div class="empty-state">No trackers blocked yet</div>';
    return;
  }
  
  // Sort by count (descending)
  const sortedTrackers = Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Show top 10
  
  trackerList.innerHTML = sortedTrackers
    .map(([domain, count]) => `
      <div class="tracker-item">
        <span class="tracker-domain" title="${domain}">${domain}</span>
        <span class="tracker-count">${count}</span>
      </div>
    `)
    .join('');
}

// Update whitelist UI
function updateWhitelistUI(whitelist) {
  const whitelistList = document.getElementById('whitelistList');
  
  if (whitelist.length === 0) {
    whitelistList.innerHTML = '<div class="empty-state">No whitelisted sites</div>';
    return;
  }
  
  whitelistList.innerHTML = whitelist
    .map(domain => `
      <div class="whitelist-item">
        <span class="tracker-domain" title="${domain}">${domain}</span>
        <button class="btn-remove" data-domain="${domain}">✕</button>
      </div>
    `)
    .join('');
  
  // Add event listeners to remove buttons
  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const domain = e.target.getAttribute('data-domain');
      removeFromWhitelist(domain);
    });
  });
}

// Get current tab
function getCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url) {
      try {
        const url = new URL(tabs[0].url);
        currentDomain = url.hostname;
        document.getElementById('currentSite').textContent = currentDomain;
        
        // Check if current site is whitelisted
        chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
          if (response && response.whitelist) {
            updateWhitelistButton(response.whitelist.includes(currentDomain));
          }
        });
      } catch (e) {
        document.getElementById('currentSite').textContent = 'Invalid URL';
      }
    }
  });
}

// Update whitelist button
function updateWhitelistButton(isWhitelisted) {
  const btn = document.getElementById('whitelistBtn');
  const text = document.getElementById('whitelistText');
  
  if (isWhitelisted) {
    text.textContent = 'Remove from Whitelist';
    btn.classList.add('remove');
  } else {
    text.textContent = 'Add to Whitelist';
    btn.classList.remove('remove');
  }
}

// Toggle protection
function toggleProtection() {
  chrome.runtime.sendMessage({ action: 'toggleEnabled' }, (response) => {
    if (response) {
      loadStats();
    }
  });
}

// Toggle whitelist
function toggleWhitelist() {
  if (!currentDomain) return;
  
  chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
    if (response && response.whitelist) {
      const isWhitelisted = response.whitelist.includes(currentDomain);
      
      if (isWhitelisted) {
        removeFromWhitelist(currentDomain);
      } else {
        addToWhitelist(currentDomain);
      }
    }
  });
}

// Add to whitelist
function addToWhitelist(domain) {
  chrome.runtime.sendMessage({ 
    action: 'addToWhitelist', 
    domain: domain 
  }, (response) => {
    if (response) {
      loadStats();
      updateWhitelistButton(true);
    }
  });
}

// Remove from whitelist
function removeFromWhitelist(domain) {
  chrome.runtime.sendMessage({ 
    action: 'removeFromWhitelist', 
    domain: domain 
  }, (response) => {
    if (response) {
      loadStats();
      if (domain === currentDomain) {
        updateWhitelistButton(false);
      }
    }
  });
}

// Clear stats
function clearStats() {
  if (confirm('Are you sure you want to clear all statistics?')) {
    chrome.runtime.sendMessage({ action: 'clearStats' }, (response) => {
      if (response && response.success) {
        loadStats();
      }
    });
  }
}

// Refresh stats every 2 seconds
setInterval(loadStats, 2000);
