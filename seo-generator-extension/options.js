// options.js
document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  chrome.storage.sync.get({
    autoAnalyze: false,
    showNotifications: true,
    saveHistory: true,
    exportDetailed: false
  }, (items) => {
    document.getElementById('autoAnalyze').checked = items.autoAnalyze;
    document.getElementById('showNotifications').checked = items.showNotifications;
    document.getElementById('saveHistory').checked = items.saveHistory;
    document.getElementById('exportDetailed').checked = items.exportDetailed;
  });
  
  // Save settings
  document.getElementById('save').addEventListener('click', () => {
    const settings = {
      autoAnalyze: document.getElementById('autoAnalyze').checked,
      showNotifications: document.getElementById('showNotifications').checked,
      saveHistory: document.getElementById('saveHistory').checked,
      exportDetailed: document.getElementById('exportDetailed').checked
    };
    
    chrome.storage.sync.set(settings, () => {
      alert('Settings saved!');
    });
  });
});