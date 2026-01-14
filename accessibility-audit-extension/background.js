// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log('🚀 Accessibility Score Calculator installed');
  chrome.storage.local.set({ 
    accessibilityReports: [],
    lastScan: null,
    settings: {
      wcagVersion: '2.1',
      scoreThreshold: 70,
      autoScan: false
    }
  });
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch(message.type) {
    case 'SAVE_REPORT':
      saveReport(message.data);
      break;
    case 'GET_REPORTS':
      getReports(sendResponse);
      return true; // Async response
    case 'CLEAR_REPORTS':
      clearReports(sendResponse);
      return true;
    case 'OPEN_SCANNER':
      // Open popup programmatically
      chrome.action.openPopup();
      break;
    case 'OPEN_DASHBOARD':
      // Open dashboard page
      chrome.tabs.create({
        url: chrome.runtime.getURL('dashboard.html')
      });
      break;
  }
});

async function saveReport(report) {
  const data = await chrome.storage.local.get(['accessibilityReports']);
  const reports = data.accessibilityReports || [];
  reports.unshift({
    ...report,
    id: Date.now(),
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 50 reports
  const updatedReports = reports.slice(0, 50);
  
  await chrome.storage.local.set({ 
    accessibilityReports: updatedReports,
    lastScan: new Date().toISOString()
  });
  
  // Notify popup if open
  chrome.runtime.sendMessage({
    type: 'NEW_REPORT',
    data: report
  });
}

async function getReports(callback) {
  const data = await chrome.storage.local.get(['accessibilityReports', 'lastScan']);
  callback({
    reports: data.accessibilityReports || [],
    lastScan: data.lastScan
  });
}

async function clearReports(callback) {
  await chrome.storage.local.set({ 
    accessibilityReports: [],
    lastScan: null
  });
  callback({ success: true });
}