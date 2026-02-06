// Popup script
let currentTabId = null;
let recordingStartTime = null;
let timerInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  initExtension();
  setupEventListeners();
});

function initExtension() {
  loadStatus();
  loadHistory();
  getCurrentTab();
}

function setupEventListeners() {
  document.getElementById('startBtn').addEventListener('click', startRecording);
  document.getElementById('stopBtn').addEventListener('click', stopRecording);
  document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
}

function getCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      currentTabId = tabs[0].id;
      const tabName = tabs[0].title || tabs[0].url;
      document.getElementById('currentTab').textContent = 
        tabName.length > 50 ? tabName.substring(0, 47) + '...' : tabName;
    } else {
      document.getElementById('currentTab').textContent = 'No active tab found';
    }
  });
}

function loadStatus() {
  chrome.runtime.sendMessage({ action: 'status' }, (response) => {
    updateUI(response);
  });
}

function updateUI(status) {
  const statusElement = document.getElementById('status');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const timerElement = document.getElementById('timer');
  
  if (status && status.recording) {
    // Recording is active
    statusElement.className = 'status status-recording';
    statusElement.querySelector('.status-text').textContent = 'Recording';
    startBtn.disabled = true;
    stopBtn.disabled = false;
    
    // Start timer if not already running
    if (!timerInterval) {
      recordingStartTime = Date.now();
      startTimer();
    }
  } else {
    // Not recording
    statusElement.className = 'status status-ready';
    statusElement.querySelector('.status-text').textContent = 'Ready';
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    // Stop timer
    stopTimer();
    timerElement.textContent = '00:00:00';
  }
}

function startTimer() {
  stopTimer(); // Clear any existing timer
  
  // Set initial time immediately
  if (recordingStartTime) {
    updateTimerDisplay();
  }
  
  // Update every second
  timerInterval = setInterval(updateTimerDisplay, 1000);
}

function updateTimerDisplay() {
  if (recordingStartTime) {
    const elapsed = Date.now() - recordingStartTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    document.getElementById('timer').textContent = 
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  recordingStartTime = null;
}

async function startRecording() {
  if (!currentTabId) {
    alert('Please refresh the popup or navigate to a tab with audio.');
    return;
  }
  
  // Check if the tab has audio playing
  try {
    const tab = await chrome.tabs.get(currentTabId);
    if (tab.audible === false) {
      const result = confirm('The current tab is not producing audio. Are you sure you want to record?');
      if (!result) {
        return;
      }
    }
  } catch (error) {
    console.warn('Could not check if tab is audible:', error);
  }
  
  // Update UI immediately
  document.getElementById('status').className = 'status status-recording';
  document.getElementById('status').querySelector('.status-text').textContent = 'Starting...';
  document.getElementById('startBtn').disabled = true;
  
  chrome.runtime.sendMessage({ 
    action: 'start', 
    tabId: currentTabId 
  }, (response) => {
    if (response && response.success) {
      loadStatus();
      showNotification('Recording started!', 'success');
    } else {
      updateUI({ recording: false });
      showNotification('Failed to start: ' + (response?.error || 'Unknown error'), 'error');
    }
  });
}

function stopRecording() {
  document.getElementById('status').querySelector('.status-text').textContent = 'Stopping...';
  document.getElementById('stopBtn').disabled = true;
  
  chrome.runtime.sendMessage({ action: 'stop' }, (response) => {
    if (response && response.success) {
      updateUI({ recording: false });
      showNotification('Recording saved!', 'success');
      setTimeout(loadHistory, 1000); // Wait a bit then refresh history
    } else {
      updateUI({ recording: false });
      showNotification('Failed to stop: ' + (response?.error || 'Unknown error'), 'error');
    }
  });
}

function loadHistory() {
  chrome.runtime.sendMessage({ action: 'getHistory' }, (recordings) => {
    const container = document.getElementById('historyList');
    
    if (!recordings || recordings.length === 0) {
      container.innerHTML = '<div class="empty-history">No recordings yet</div>';
      return;
    }
    
    container.innerHTML = recordings.map(rec => {
      const date = new Date(rec.timestamp);
      const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const sizeMB = (rec.size / 1024 / 1024).toFixed(2);
      
      return `
        <div class="history-item" title="${rec.filename}">
          <div class="history-filename">${rec.filename}</div>
          <div class="history-details">
            <span>${sizeMB} MB</span>
            <span>${formattedDate}</span>
          </div>
        </div>
      `;
    }).join('');
  });
}

function clearHistory() {
  if (confirm('Clear all recording history?')) {
    chrome.storage.local.set({ recordings: [] }, () => {
      loadHistory();
      showNotification('History cleared', 'info');
    });
  }
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);

  // Handle fallback save from background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveRecordingFallback') {
      console.log('Popup: Handling fallback save for:', request.filename);
      
      // Create download link
      const dataUrl = `data:audio/webm;base64,${request.data}`;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = request.filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show notification
      showNotification('Recording saved via fallback method', 'success');
      
      // Save to history
      setTimeout(loadHistory, 1000);
    }
  });
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Auto-refresh status every 2 seconds
setInterval(loadStatus, 2000);