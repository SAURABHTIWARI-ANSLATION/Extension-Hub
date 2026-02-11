// options.js

// Elements
const els = {
  navItems: document.querySelectorAll('.nav-item'),
  tabContents: document.querySelectorAll('.tab-content'),
  historyList: document.getElementById('history-list'),
  btnClearHistory: document.getElementById('btn-clear-history'),
  btnSaveSettings: document.getElementById('btn-save-settings'),

  // Settings
  settingAutoscroll: document.getElementById('setting-autoscroll'),
  settingWaitIdle: document.getElementById('setting-wait-idle'),
  settingJsonPretty: document.getElementById('setting-json-pretty'),
  settingIncludeMeta: document.getElementById('setting-include-meta'),
  settingNotifications: document.getElementById('setting-notifications')
};

// Default Settings
const DEFAULT_SETTINGS = {
  autoscroll: true,
  waitIdle: true,
  jsonPretty: true,
  includeMeta: true,
  notifications: true
};

// Initialize
function init() {
  setupTabs();
  loadSettings();
  loadHistory();
  setupEventListeners();
}

function setupTabs() {
  els.navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  els.navItems.forEach(btn => {
    if (btn.dataset.tab === tabName) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  els.tabContents.forEach(section => {
    if (section.id === `tab-${tabName}`) section.classList.add('active');
    else section.classList.remove('active');
  });

  if (tabName === 'history') loadHistory();
}

// --- History Management ---

function loadHistory() {
  chrome.storage.local.get(['scrapeHistory'], (result) => {
    const history = result.scrapeHistory || [];
    renderHistory(history);
  });
}

function renderHistory(history) {
  els.historyList.innerHTML = '';

  if (history.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No history yet. Start scraping!';
    els.historyList.appendChild(emptyState);
    return;
  }

  // Sort by newest first
  history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  history.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';

    const date = new Date(item.timestamp).toLocaleString();

    // Create history-info container
    const infoDiv = document.createElement('div');
    infoDiv.className = 'history-info';

    const urlLink = document.createElement('a');
    urlLink.href = item.url;
    urlLink.target = '_blank';
    urlLink.rel = 'noopener noreferrer'; // Security: prevent tabnabbing
    urlLink.className = 'history-url';
    urlLink.title = item.title || item.url;
    urlLink.textContent = item.title || item.url; // Safe: using textContent

    const metaDiv = document.createElement('div');
    metaDiv.className = 'history-meta';
    metaDiv.textContent = `${date} • ${item.itemCount || 0} items`; // Safe: template only uses trusted data

    infoDiv.appendChild(urlLink);
    infoDiv.appendChild(metaDiv);

    // Create history-actions container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'history-actions';
    // Future: Add 'View' button if we store full data

    div.appendChild(infoDiv);
    div.appendChild(actionsDiv);

    els.historyList.appendChild(div);
  });
}

function clearHistory() {
  if (confirm('Are you sure you want to clear all history?')) {
    chrome.storage.local.set({ scrapeHistory: [] }, () => {
      loadHistory();
    });
  }
}

// --- Settings Management ---

function loadSettings() {
  chrome.storage.local.get(['scraperSettings'], (result) => {
    const settings = { ...DEFAULT_SETTINGS, ...result.scraperSettings };

    els.settingAutoscroll.checked = settings.autoscroll;
    els.settingWaitIdle.checked = settings.waitIdle;
    els.settingJsonPretty.checked = settings.jsonPretty;
    els.settingIncludeMeta.checked = settings.includeMeta;
    if (els.settingNotifications) els.settingNotifications.checked = settings.notifications;
  });
}

function saveSettings() {
  const settings = {
    autoscroll: els.settingAutoscroll.checked,
    waitIdle: els.settingWaitIdle.checked,
    jsonPretty: els.settingJsonPretty.checked,
    includeMeta: els.settingIncludeMeta.checked,
    notifications: els.settingNotifications ? els.settingNotifications.checked : true
  };

  chrome.storage.local.set({ scraperSettings: settings }, () => {
    // Show feedback
    const originalText = els.btnSaveSettings.innerText;
    els.btnSaveSettings.innerText = 'Saved!';
    setTimeout(() => {
      els.btnSaveSettings.innerText = originalText;
    }, 1500);
  });
}

function setupEventListeners() {
  els.btnClearHistory.addEventListener('click', clearHistory);
  els.btnSaveSettings.addEventListener('click', saveSettings);

  // Auto-save on toggle? Maybe better to have explicit save for Options page
  // But for better UX let's keep explicit Save button as main action
}

// Run
document.addEventListener('DOMContentLoaded', init);
