// popup.js — Enhanced Logic

// --- State ---
let isScraping = false;
let collectedData = [];
let currentTab = 'scrape';

// --- DOM Elements ---
const els = {
  navItems: document.querySelectorAll('.nav-item'),
  tabContents: document.querySelectorAll('.tab-content'),
  
  // Scrape Tab
  btnStart: document.getElementById('btn-start'),
  btnStop: document.getElementById('btn-stop'),
  statusIndicator: document.getElementById('status-indicator'),
  statusHeading: document.getElementById('status-heading'),
  statusDetails: document.getElementById('status-details'),
  scrapeType: document.getElementById('scrape-type'),
  scrapeSpeed: document.getElementById('scrape-speed'),
  resultsArea: document.getElementById('results-area'),
  resultCount: document.getElementById('result-count'),
  btnViewResults: document.getElementById('btn-view-results'),
  btnExportJson: document.getElementById('btn-export-json'),
  btnExportCsv: document.getElementById('btn-export-csv'),
  
  // History Tab
  historyList: document.getElementById('history-list'),
  btnClearHistory: document.getElementById('btn-clear-history'),
  
  // Settings Tab
  settingAutoscroll: document.getElementById('setting-autoscroll'),
  settingWaitIdle: document.getElementById('setting-wait-idle'),
  settingJsonPretty: document.getElementById('setting-json-pretty'),
  settingIncludeMeta: document.getElementById('setting-include-meta')
};

// --- Initialization ---
function init() {
  loadSettings();
  setupTabs();
  setupEventListeners();
  loadHistory();
  
  // Check if we have data in memory/storage from a recent scrape
  chrome.storage.local.get(['lastScrape'], (result) => {
    if (result.lastScrape) {
      collectedData = result.lastScrape;
      updateResultsUI();
    }
  });
}

// --- Tabs Logic ---
function setupTabs() {
  els.navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  currentTab = tabName;
  
  // Update Nav
  els.navItems.forEach(btn => {
    if (btn.dataset.tab === tabName) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  
  // Update Content
  els.tabContents.forEach(section => {
    if (section.id === `tab-${tabName}`) section.classList.add('active');
    else section.classList.remove('active');
  });
  
  if (tabName === 'history') loadHistory();
}

// --- Settings Logic ---
function loadSettings() {
  chrome.storage.local.get(['scraperSettings'], (result) => {
    const s = result.scraperSettings || {};
    if (s.autoscroll !== undefined) els.settingAutoscroll.checked = s.autoscroll;
    if (s.waitIdle !== undefined) els.settingWaitIdle.checked = s.waitIdle;
    if (s.jsonPretty !== undefined) els.settingJsonPretty.checked = s.jsonPretty;
    if (s.includeMeta !== undefined) els.settingIncludeMeta.checked = s.includeMeta;
  });
}

function saveSettings() {
  const settings = {
    autoscroll: els.settingAutoscroll.checked,
    waitIdle: els.settingWaitIdle.checked,
    jsonPretty: els.settingJsonPretty.checked,
    includeMeta: els.settingIncludeMeta.checked
  };
  chrome.storage.local.set({ scraperSettings: settings });
}

// --- Event Listeners ---
function setupEventListeners() {
  // Scrape Controls
  els.btnStart.addEventListener('click', startScraping);
  els.btnStop.addEventListener('click', stopScraping);
  
  // Export
  els.btnExportJson.addEventListener('click', () => exportData('json'));
  els.btnExportCsv.addEventListener('click', () => exportData('csv'));
  els.btnViewResults.addEventListener('click', openPreview);
  
  // History
  els.btnClearHistory.addEventListener('click', clearHistory);
  
  // Settings Change
  [els.settingAutoscroll, els.settingWaitIdle, els.settingJsonPretty, els.settingIncludeMeta]
    .forEach(el => el.addEventListener('change', saveSettings));
}

// --- Scraping Logic ---

async function ensureContentScript(tabId) {
  try {
    // Try sending a ping message
    await chrome.tabs.sendMessage(tabId, { action: "ping" });
    console.log("Content script is alive.");
    return true;
  } catch (error) {
    console.log("Ping failed, injecting script...");
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
      // Wait for script to initialize and verify with another ping
      await new Promise(r => setTimeout(r, 300));
      await chrome.tabs.sendMessage(tabId, { action: "ping" });
      console.log("Content script injected and verified.");
      return true;
    } catch (injectionError) {
      console.error("Injection/Verification failed:", injectionError);
      return false;
    }
  }
}

function startScraping() {
  if (isScraping) return;
  
  isScraping = true;
  collectedData = [];
  updateUIState('scraping');
  
  const type = els.scrapeType.value;
  const speed = els.scrapeSpeed.value;
  
  // Get active tab
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab) {
      updateUIState('error', 'No active tab found');
      return;
    }
    
    // Ensure connection
    const connected = await ensureContentScript(activeTab.id);
    if (!connected) {
      updateUIState('error', "Could not connect to page. Try refreshing the tab.");
      return;
    }

    // Send message to content script
    chrome.tabs.sendMessage(activeTab.id, {
      action: "startScraping",
      scrapeType: type,
      scrapeSpeed: speed,
      settings: {
        autoscroll: els.settingAutoscroll.checked,
        waitIdle: els.settingWaitIdle.checked
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        updateUIState('error', "Connection lost. Please refresh the page.");
        return;
      }
      
      if (response && response.success) {
        // Data received immediately (synchronous/simple scraping)
        handleScrapeResult(response.data, activeTab.url);
      } else if (response && response.error) {
        updateUIState('error', response.error);
      }
    });
  });
}

function stopScraping() {
  isScraping = false;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "stopScraping" });
    }
  });
  updateUIState('ready');
}

function handleScrapeResult(data, url) {
  isScraping = false;
  collectedData = data || [];
  
  // Save to current session
  chrome.storage.local.set({ lastScrape: collectedData });
  
  // Add to History
  addToHistory(collectedData, url);
  
  updateResultsUI();
  updateUIState('ready');
  els.statusHeading.textContent = "Success!";
  els.statusDetails.textContent = `Scraped ${collectedData.length} item(s).`;
}

// --- UI Updates ---
function updateUIState(state, message = "") {
  // Reset classes
  els.statusIndicator.className = 'status-indicator';
  els.btnStart.disabled = false;
  els.btnStop.disabled = true;
  
  switch (state) {
    case 'ready':
      els.statusIndicator.classList.add('ready');
      els.statusHeading.textContent = "Ready";
      els.statusDetails.textContent = "Waiting to start...";
      break;
    case 'scraping':
      els.statusIndicator.classList.add('scraping');
      els.statusHeading.textContent = "Scraping...";
      els.statusDetails.textContent = "Processing page content";
      els.btnStart.disabled = true;
      els.btnStop.disabled = false;
      break;
    case 'error':
      els.statusIndicator.classList.add('error');
      els.statusHeading.textContent = "Error";
      els.statusDetails.textContent = message;
      isScraping = false;
      break;
  }
}

function updateResultsUI() {
  const count = collectedData.length;
  els.resultCount.textContent = count;
  
  if (count > 0) {
    els.resultsArea.classList.remove('hidden');
  } else {
    els.resultsArea.classList.add('hidden');
  }
}

// --- Export & Preview ---
function openPreview() {
  // Save current data to 'scrapedData' for the preview page
  chrome.storage.local.set({ scrapedData: collectedData }, () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('preview.html') });
  });
}

function exportData(format) {
  if (!collectedData.length) return;
  
  let content = "";
  let type = "";
  let ext = "";
  
  if (format === 'json') {
    const pretty = els.settingJsonPretty.checked;
    content = JSON.stringify(collectedData, null, pretty ? 2 : 0);
    type = "application/json";
    ext = "json";
  } else if (format === 'csv') {
    content = jsonToCsv(collectedData);
    type = "text/csv";
    ext = "csv";
  }
  
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `uscraper-export-${timestamp}.${ext}`;
  
  chrome.downloads.download({ url, filename, saveAs: true });
}

function jsonToCsv(json) {
  if (!json || !json.length) return "";
  
  // Flatten objects if needed or just take top level keys
  // For this extension, our data structure might be complex (nested objects).
  // We'll flatten the first level.
  
  const items = Array.isArray(json) ? json : [json];
  if (items.length === 0) return "";

  // Collect all unique keys
  const keys = new Set();
  items.forEach(item => Object.keys(item).forEach(k => keys.add(k)));
  const headers = Array.from(keys);
  
  const csvRows = [headers.map(h => `"${h}"`).join(',')];
  
  items.forEach(item => {
    const row = headers.map(header => {
      let val = item[header];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') val = JSON.stringify(val).replace(/"/g, '""');
      else val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    });
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
}

// --- History Management ---
function addToHistory(data, url) {
  chrome.storage.local.get(['scrapeHistory'], (result) => {
    const history = result.scrapeHistory || [];
    
    const newItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      url: url,
      itemCount: data.length,
      dataSummary: data.length > 0 ? (data[0].title || "No Title") : "Empty"
    };
    
    // Prepend and limit to 20
    history.unshift(newItem);
    if (history.length > 20) history.pop();
    
    chrome.storage.local.set({ scrapeHistory: history }, () => {
      if (currentTab === 'history') loadHistory();
    });
  });
}

function loadHistory() {
  chrome.storage.local.get(['scrapeHistory'], (result) => {
    const history = result.scrapeHistory || [];
    els.historyList.innerHTML = '';
    
    if (history.length === 0) {
      els.historyList.innerHTML = '<div class="empty-state">No history yet.</div>';
      return;
    }
    
    history.forEach(item => {
      const date = new Date(item.timestamp).toLocaleString();
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <div class="history-info">
          <span class="history-url" title="${item.url}">${item.url}</span>
          <div class="history-meta">${date} • ${item.itemCount} items</div>
        </div>
        <div class="history-actions">
          <button class="btn-icon" title="Load" data-id="${item.id}">📂</button>
        </div>
      `;
      
      // Load button click
      div.querySelector('button').addEventListener('click', () => {
        // In a real app we'd store the full data in history, but here we might just have summary.
        // If we want to load full data, we should have stored it. 
        // For now, let's assume we can't fully "restore" the data unless we saved it all.
        // Let's check if we saved it?
        // Actually, `addToHistory` didn't save the full data payload to avoid storage limits (5MB local storage limit).
        // If we want to support "Export old history", we need to store it.
        // Let's assume for this task we just show history metadata.
        alert("History restoration requires persistent storage (IndexedDB). Currently showing metadata only.");
      });
      
      els.historyList.appendChild(div);
    });
  });
}

function clearHistory() {
  if (confirm("Are you sure you want to clear all history?")) {
    chrome.storage.local.set({ scrapeHistory: [] }, () => {
      loadHistory();
    });
  }
}

// --- Message Listener ---
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "scrapingProgress" && message.progress) {
    const { step, current, total } = message.progress;
    const percent = Math.round((current / total) * 100);
    if (els.statusDetails) {
      els.statusDetails.textContent = `${step}... ${percent}%`;
    }
  }
});

// Run
init();
