document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  setupEventListeners();
  loadRecentTemplates();
  setupAutoResponder();
});

function loadStats() {
  chrome.storage.sync.get(['templates'], (result) => {
    const templateCount = (result.templates || []).length;
    document.getElementById('templateCount').textContent = templateCount;
  });
  
  // Load usage stats
  chrome.storage.local.get(['usageStats'], (result) => {
    const usedToday = result.usageStats?.today || 0;
    document.getElementById('usedToday').textContent = usedToday;
  });
}

function loadRecentTemplates() {
  chrome.storage.sync.get(['templates'], (result) => {
    const templates = result.templates || [];
    const recentTemplates = templates.slice(0, 3);
    
    const container = document.getElementById('recentTemplatesList');
    container.innerHTML = '';
    
    if (recentTemplates.length === 0) {
      container.innerHTML = `
        <div style="
          color: #6b7280; 
          font-size: 13px; 
          text-align: center; 
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
        ">
          No templates yet. Create your first one!
        </div>
      `;
      return;
    }
    
    recentTemplates.forEach(template => {
      const item = document.createElement('div');
      item.className = 'template-item';
      item.innerHTML = `
        <div class="template-name">${template.name}</div>
        <div class="template-preview">${template.content.substring(0, 60)}...</div>
      `;
      
      item.addEventListener('click', () => {
        // Send message to active tab to insert template
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'INSERT_TEMPLATE',
              templateId: template.id
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.log('Could not send message to tab:', chrome.runtime.lastError.message);
                // Show error message
                const errorMsg = document.createElement('div');
                errorMsg.style.cssText = `
                  position: fixed;
                  top: 10px;
                  right: 10px;
                  background: #ef4444;
                  color: white;
                  padding: 10px 15px;
                  border-radius: 6px;
                  z-index: 10000;
                `;
                errorMsg.textContent = 'Please open LinkedIn/Twitter messages first';
                document.body.appendChild(errorMsg);
                setTimeout(() => errorMsg.remove(), 3000);
              }
            });
          }
        });
      });
      
      container.appendChild(item);
    });
  });
}

function setupEventListeners() {
  // Open templates panel
  document.getElementById('openPanelBtn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'SHOW_TEMPLATES_PANEL'
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Could not send message:', chrome.runtime.lastError.message);
            alert('Please open LinkedIn, Twitter, or Facebook messages first!');
          } else {
            // Close popup after clicking
            window.close();
          }
        });
      } else {
        alert('Please open a social media messaging page first!');
      }
    });
  });
  
  // Create template
  document.getElementById('createTemplateBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });
  
  // Settings
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });
  
  // Help
  document.getElementById('helpBtn').addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://example.com/help' // Replace with your help URL
    });
    window.close();
  });
}

function setupAutoResponder() {
  chrome.storage.sync.get(['autoResponder'], (result) => {
    const toggle = document.getElementById('autoResponderToggle');
    if (toggle) {
      toggle.checked = result.autoResponder || false;
      
      toggle.addEventListener('change', () => {
        chrome.runtime.sendMessage({
          type: 'TOGGLE_AUTO_RESPONDER'
        }, (response) => {
          console.log('Auto-responder toggled:', response?.enabled);
        });
      });
    }
  });
}