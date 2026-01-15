document.addEventListener('DOMContentLoaded', function() {
  const highlightToggle = document.getElementById('highlightToggle');
  const colorButtons = document.querySelectorAll('.color-btn');
  const clearPageBtn = document.getElementById('clearPageBtn');
  const exportBtn = document.getElementById('exportBtn');
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');
  const highlightsList = document.getElementById('highlightsList');
  const autoRestore = document.getElementById('autoRestore');
  const showTooltip = document.getElementById('showTooltip');

  let currentColor = 'yellow';
  let currentTabId = null;

  // Helper function for status color
  function getStatusColor(colorName) {
    const colors = {
      yellow: '#fbbf24',
      green: '#34d399',
      blue: '#60a5fa',
      pink: '#f472b6',
      red: '#f87171'
    };
    return colors[colorName] || '#fbbf24';
  }

  // Get current tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    currentTabId = tabs[0].id;
    updatePopup();
  });

  // Load settings
  chrome.storage.sync.get(['highlightColor', 'autoRestore', 'showTooltip'], function(data) {
    currentColor = data.highlightColor || 'yellow';
    autoRestore.checked = data.autoRestore !== false;
    showTooltip.checked = data.showTooltip !== false;
    
    // Update status with current color
    statusText.textContent = `Color: ${currentColor}`;
    statusIndicator.style.background = getStatusColor(currentColor);
    
    // Activate current color button
    colorButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.color === currentColor) {
        btn.classList.add('active');
      }
    });
  });

  // Update popup with current page highlights
  function updatePopup() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const url = tabs[0].url;
      
      chrome.storage.local.get(['highlights'], function(data) {
        const highlights = data.highlights || {};
        const pageHighlights = highlights[url] || [];
        
        updateStatus(pageHighlights.length);
        updateHighlightsList(pageHighlights);
      });
    });
  }

  function updateStatus(count) {
    if (count > 0) {
      statusText.textContent = `${count} highlight${count === 1 ? '' : 's'} on page`;
      statusIndicator.style.background = '#4ade80';
    } else {
      statusText.textContent = `Color: ${currentColor}`;
      statusIndicator.style.background = getStatusColor(currentColor);
    }
  }

  function updateHighlightsList(highlights) {
    if (highlights.length === 0) {
      highlightsList.innerHTML = '<p class="empty-state">No highlights yet on this page</p>';
      return;
    }
    
    highlightsList.innerHTML = '';
    highlights.forEach((highlight, index) => {
      const div = document.createElement('div');
      div.className = 'highlight-item';
      div.innerHTML = `
        <div class="highlight-text" title="${highlight.text}">
          ${highlight.text.substring(0, 50)}${highlight.text.length > 50 ? '...' : ''}
          <span class="highlight-color" style="color: ${getStatusColor(highlight.color)}; font-size: 10px; margin-left: 5px;">●</span>
        </div>
        <div class="highlight-actions">
          <button class="view-highlight" data-index="${index}" title="View">👁️</button>
          <button class="remove-highlight" data-index="${index}" title="Remove">🗑️</button>
        </div>
      `;
      highlightsList.appendChild(div);
    });
    
    // Add event listeners
    document.querySelectorAll('.view-highlight').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.dataset.index);
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'scrollToHighlight',
            index: index
          });
        });
      });
    });
    
    document.querySelectorAll('.remove-highlight').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.dataset.index);
        removeHighlight(index);
      });
    });
  }

  function removeHighlight(index) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const url = tabs[0].url;
      
      chrome.storage.local.get(['highlights'], function(data) {
        const highlights = data.highlights || {};
        if (highlights[url]) {
          highlights[url].splice(index, 1);
          chrome.storage.local.set({highlights}, function() {
            updatePopup();
            // Update page highlights
            chrome.tabs.sendMessage(tabs[0].id, {action: 'refreshHighlights'});
          });
        }
      });
    });
  }

  // Toggle highlight mode
  highlightToggle.addEventListener('change', function() {
    const enabled = this.checked;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'setHighlightMode',
        enabled: enabled
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.log('Please refresh the page for highlight mode');
        }
      });
    });
  });

  // Color selection - FIXED for instant switching
  colorButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      colorButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentColor = this.dataset.color;
      
      // Save to storage
      chrome.storage.sync.set({highlightColor: currentColor});
      
      // Update status immediately
      statusText.textContent = `Color: ${currentColor}`;
      statusIndicator.style.background = getStatusColor(currentColor);
      
      // Send color update to content script with confirmation
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'setHighlightColor',
            color: currentColor,
            immediate: true  // Flag for immediate application
          }, function(response) {
            if (chrome.runtime.lastError) {
              console.log('Content script not ready. Color will apply on next highlight.');
              // Store in session for when content script loads
              chrome.storage.session.set({pendingColor: currentColor});
            } else {
              console.log('Color changed to:', currentColor);
            }
          });
        }
      });
      
      // Also broadcast to all tabs for consistent experience
      chrome.tabs.query({}, function(allTabs) {
        allTabs.forEach(tab => {
          if (tab.id !== currentTabId) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'setHighlightColor',
              color: currentColor
            }).catch(() => {
              // Ignore errors for tabs without content script
            });
          }
        });
      });
    });
  });

  // Clear page highlights
  clearPageBtn.addEventListener('click', function() {
    if (confirm('Clear all highlights on this page?')) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const url = tabs[0].url;
        
        chrome.storage.local.get(['highlights'], function(data) {
          const highlights = data.highlights || {};
          delete highlights[url];
          chrome.storage.local.set({highlights}, function() {
            updatePopup();
            chrome.tabs.sendMessage(tabs[0].id, {action: 'clearHighlights'});
          });
        });
      });
    }
  });

  // Export highlights
  exportBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const url = tabs[0].url;
      
      chrome.storage.local.get(['highlights'], function(data) {
        const highlights = data.highlights || {};
        const pageHighlights = highlights[url] || [];
        
        const exportData = {
          url: url,
          exportedAt: new Date().toISOString(),
          highlights: pageHighlights
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `highlights_${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      });
    });
  });

  // Settings
  autoRestore.addEventListener('change', function() {
    chrome.storage.sync.set({autoRestore: this.checked});
  });

  showTooltip.addEventListener('change', function() {
    const enabled = this.checked;
    chrome.storage.sync.set({showTooltip: enabled});
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'setShowTooltip',
        enabled: enabled
      });
    });
  });

  // Initialize
  updatePopup();
  
  // Check for pending color changes
  chrome.storage.session.get(['pendingColor'], function(data) {
    if (data.pendingColor) {
      currentColor = data.pendingColor;
      chrome.storage.session.remove(['pendingColor']);
      
      // Update UI
      colorButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.color === currentColor) {
          btn.classList.add('active');
        }
      });
      statusText.textContent = `Color: ${currentColor}`;
      statusIndicator.style.background = getStatusColor(currentColor);
    }
  });
});