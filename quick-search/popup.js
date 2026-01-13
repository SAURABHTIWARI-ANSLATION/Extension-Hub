// popup.js - Extension popup functionality

document.addEventListener('DOMContentLoaded', function() {
  // Get search history from storage
  chrome.storage.local.get(['searchHistory', 'customEngines'], function(data) {
    const history = data.searchHistory || [];
    const customEngines = data.customEngines || [];
    
    // Display recent searches if any
    if (history.length > 0) {
      displayRecentSearches(history);
    }
    
    // Display custom engines if any
    if (customEngines.length > 0) {
      displayCustomEngines(customEngines);
    }
  });
  
  // Add Custom Engine Button
  document.getElementById('addCustomEngineBtn').addEventListener('click', function() {
    const engineName = document.getElementById('engineName').value.trim();
    const engineUrl = document.getElementById('engineUrl').value.trim();
    
    if (!engineName || !engineUrl) {
      alert('Please enter both name and URL');
      return;
    }
    
    if (!engineUrl.includes('%s')) {
      alert('URL must contain %s as placeholder for search text');
      return;
    }
    
    const newEngine = {
      id: engineName.toLowerCase().replace(/\s+/g, '-'),
      name: engineName,
      url: engineUrl,
      icon: '🔗'
    };
    
    chrome.storage.local.get(['customEngines'], function(data) {
      const engines = data.customEngines || [];
      engines.push(newEngine);
      
      chrome.storage.local.set({ customEngines: engines }, function() {
        alert('Custom engine added!');
        document.getElementById('engineName').value = '';
        document.getElementById('engineUrl').value = '';
        displayCustomEngines(engines);
      });
    });
  });
  
  // Clear History Button
  document.getElementById('clearHistoryBtn').addEventListener('click', function() {
    if (confirm('Clear all search history?')) {
      chrome.storage.local.set({ searchHistory: [] }, function() {
        document.getElementById('historyList').innerHTML = '<p style="color:#666;text-align:center;">No recent searches</p>';
      });
    }
  });
  
  // Test Custom Search
  document.getElementById('testCustomBtn').addEventListener('click', function() {
    const testUrl = document.getElementById('engineUrl').value.trim();
    const testText = "test search";
    
    if (!testUrl) {
      alert('Please enter a URL first');
      return;
    }
    
    let finalUrl = testUrl;
    if (testUrl.includes('%s')) {
      finalUrl = testUrl.replace('%s', encodeURIComponent(testText));
    }
    
    // Open test search in new tab
    chrome.tabs.create({ url: finalUrl });
  });
});

function displayRecentSearches(history) {
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';
  
  // Show only last 5 searches
  const recent = history.slice(-5).reverse();
  
  recent.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="history-text">${item.text.substring(0, 30)}${item.text.length > 30 ? '...' : ''}</div>
      <div class="history-engine">${item.engine}</div>
      <div class="history-time">${formatTime(item.timestamp)}</div>
    `;
    
    // Click to search again
    div.addEventListener('click', function() {
      searchAgain(item.text, item.engine);
    });
    
    historyList.appendChild(div);
  });
}

function displayCustomEngines(engines) {
  const customList = document.getElementById('customEnginesList');
  customList.innerHTML = '';
  
  engines.forEach(engine => {
    const div = document.createElement('div');
    div.className = 'custom-engine-item';
    div.innerHTML = `
      <span class="engine-icon">${engine.icon || '🔗'}</span>
      <span class="engine-name">${engine.name}</span>
      <button class="remove-engine" data-id="${engine.id}">×</button>
    `;
    
    customList.appendChild(div);
    
    // Remove button event
    div.querySelector('.remove-engine').addEventListener('click', function(e) {
      e.stopPropagation();
      removeCustomEngine(engine.id);
    });
    
    // Click to use engine
    div.addEventListener('click', function() {
      // Get current tab and selected text
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'useCustomEngine',
          engine: engine
        });
      });
    });
  });
}

function removeCustomEngine(engineId) {
  chrome.storage.local.get(['customEngines'], function(data) {
    const engines = data.customEngines || [];
    const filtered = engines.filter(engine => engine.id !== engineId);
    
    chrome.storage.local.set({ customEngines: filtered }, function() {
      displayCustomEngines(filtered);
    });
  });
}

function searchAgain(text, engine) {
  const searchUrls = {
    google: `https://www.google.com/search?q=${encodeURIComponent(text)}`,
    youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(text)}`,
    wikipedia: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(text)}`,
    amazon: `https://www.amazon.com/s?k=${encodeURIComponent(text)}`,
    github: `https://github.com/search?q=${encodeURIComponent(text)}`,
    stackoverflow: `https://stackoverflow.com/search?q=${encodeURIComponent(text)}`,
    twitter: `https://twitter.com/search?q=${encodeURIComponent(text)}`,
    reddit: `https://www.reddit.com/search/?q=${encodeURIComponent(text)}`,
    translate: `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(text)}`,
    images: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(text)}`
  };
  
  if (searchUrls[engine]) {
    chrome.tabs.create({ url: searchUrls[engine] });
  }
}

function formatTime(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = now - then;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}