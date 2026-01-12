// popup.js — Enhanced UI: start, track progress, preview, export

let isScraping = false;
let collected = [];

const scrapeBtn = document.getElementById("start-scrape");
const stopBtn = document.getElementById("stop-scrape");
const statusText = document.getElementById("status-text");
const statusIndicator = document.getElementById("status-indicator");
const progressFill = document.getElementById("progress-fill");
const exportJsonBtn = document.getElementById("export-json");
const exportCsvBtn = document.getElementById("export-csv");
const clearDataBtn = document.getElementById("clear-data");
const previewBtn = document.getElementById("preview-data");
const resultCount = document.getElementById("result-count");
const resultsContainer = document.getElementById("results-container");
const scrapeType = document.getElementById("scrape-type");
const scrapeSpeed = document.getElementById("scrape-speed");

// Save user preferences
function savePreferences() {
  const preferences = {
    scrapeType: scrapeType.value,
    scrapeSpeed: scrapeSpeed.value
  };
  chrome.storage.local.set({ scraperPreferences: preferences });
}

// Load user preferences
function loadPreferences() {
  chrome.storage.local.get(['scraperPreferences'], function(result) {
    if (result.scraperPreferences) {
      const prefs = result.scraperPreferences;
      if (prefs.scrapeType) {
        scrapeType.value = prefs.scrapeType;
      }
      if (prefs.scrapeSpeed) {
        scrapeSpeed.value = prefs.scrapeSpeed;
      }
    }
  });
}

// Update progress bar
function updateProgressBar(percent) {
  progressFill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

// Update scraping progress
function updateScrapingProgress(progress) {
  const total = Math.max(1, progress.total || 1);
  const current = Math.min(progress.current || 0, total);
  const percent = Math.round((current / total) * 100);
  statusText.textContent = `Scraping: ${current}/${total} (${percent}%)`;
  updateProgressBar(percent);
}

// Set status to idle
function setStatusIdle() {
  statusText.textContent = "Ready to scrape";
  statusIndicator.className = "status-ready";
  updateProgressBar(0);
}

// Set status to scraping
function setStatusScraping() {
  statusIndicator.className = "status-scraping";
  scrapeBtn.disabled = true;
  stopBtn.disabled = false;
}

// Set status to complete
function setStatusComplete() {
  statusIndicator.className = "status-complete";
  statusText.textContent = "Scraping complete";
  scrapeBtn.disabled = false;
  stopBtn.disabled = true;
}

// Set status to error
function setStatusError(error) {
  statusIndicator.className = "status-error";
  statusText.textContent = `Error: ${error}`;
  scrapeBtn.disabled = false;
  stopBtn.disabled = true;
}

// Update result count
function updateResultCount() {
  resultCount.textContent = `(${collected.length})`;
  
  // Enable/disable buttons based on data availability
  const hasData = collected.length > 0;
  exportJsonBtn.disabled = !hasData;
  exportCsvBtn.disabled = !hasData;
  clearDataBtn.disabled = !hasData;
  previewBtn.disabled = !hasData;
}

// Render preview of scraped data
function renderPreview() {
  if (collected.length === 0) {
    resultsContainer.innerHTML = '<p class="no-results">No data scraped yet</p>';
    return;
  }

  // Show a sample of the data
  const sample = collected[0];
  resultsContainer.innerHTML = '';
  
  const pre = document.createElement("pre");
  pre.className = 'preview-content';
  pre.textContent = JSON.stringify(sample, null, 2);
  resultsContainer.appendChild(pre);
}

// Get active tab
function getActiveTab(cb) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => cb(tabs[0]));
}

// Start scraping
scrapeBtn.addEventListener("click", () => {
  if (isScraping) return;
  
  isScraping = true;
  collected = [];
  setStatusScraping();
  updateResultCount();
  
  // Save preferences
  savePreferences();
  
  getActiveTab((tab) => {
    chrome.tabs.sendMessage(tab.id, { 
      action: "startScraping",
      scrapeType: scrapeType.value,
      scrapeSpeed: scrapeSpeed.value
    }, () => {
      if (chrome.runtime.lastError) {
        setStatusError(chrome.runtime.lastError.message);
        isScraping = false;
      }
    });
  });
});

// Stop scraping
stopBtn.addEventListener("click", () => {
  if (!isScraping) return;
  
  isScraping = false;
  stopBtn.disabled = true;
  
  getActiveTab((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "stopScraping" }, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      }
    });
  });
});

// Preview data in new tab
previewBtn.addEventListener("click", () => {
  // Save current data to storage
  chrome.storage.local.set({ scrapedData: collected }, () => {
    // Open preview page in new tab
    chrome.tabs.create({ url: chrome.runtime.getURL('preview.html') });
  });
});

// Clear data
clearDataBtn.addEventListener("click", () => {
  collected = [];
  chrome.storage.local.remove(["scrapedData"]);
  updateResultCount();
  resultsContainer.innerHTML = '<p class="no-results">Data cleared</p>';
  setStatusIdle();
});

// Export as JSON
exportJsonBtn.addEventListener("click", () => {
  if (!collected.length) return;
  
  const blob = new Blob([JSON.stringify(collected, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const filename = `easy-scraper-data-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  
  chrome.downloads.download({ url, filename, saveAs: true });
});

// Export as CSV
exportCsvBtn.addEventListener("click", () => {
  if (!collected.length) return;
  
  // Convert JSON to CSV
  function jsonToCsv(jsonData) {
    if (!jsonData || jsonData.length === 0) return "";
    
    // Get all unique keys from all objects
    const allKeys = new Set();
    jsonData.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });
    
    const keys = Array.from(allKeys);
    const csvRows = [];
    
    // Add header row
    csvRows.push(keys.map(key => `"${key}"`).join(","));
    
    // Add data rows
    jsonData.forEach(item => {
      const values = keys.map(key => {
        const value = item[key];
        if (value === null || value === undefined) return '""';
        if (typeof value === "object") return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    });
    
    return csvRows.join("\n");
  }
  
  const csvContent = jsonToCsv(collected);
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const filename = `easy-scraper-data-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
  
  chrome.downloads.download({ url, filename, saveAs: true });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.action === "dataScraped" && Array.isArray(msg.data)) {
    collected.push(...msg.data);
    updateResultCount();
    renderPreview();
  }
  
  if (msg?.action === "scrapingProgress" && msg.progress) {
    updateScrapingProgress(msg.progress);
  }
  
  if (msg?.action === "scrapingError" && msg.error) {
    setStatusError(msg.error);
    isScraping = false;
    stopBtn.disabled = true;
    scrapeBtn.disabled = false;
  }
  
  if (msg?.action === "scrapingComplete") {
    isScraping = false;
    stopBtn.disabled = true;
    scrapeBtn.disabled = false;
    setStatusComplete();
    
    // Pull from storage if needed
    if (!collected.length) {
      chrome.storage?.local?.get(["scrapedData"], (obj) => {
        if (obj?.scrapedData?.length) {
          collected = obj.scrapedData;
          updateResultCount();
          renderPreview();
        }
      });
    }
  }
});

// Initialize
function init() {
  setStatusIdle();
  updateResultCount();
  loadPreferences();
  
  // Load any previously scraped data
  chrome.storage?.local?.get(["scrapedData"], (obj) => {
    if (obj?.scrapedData?.length) {
      collected = obj.scrapedData;
      updateResultCount();
      renderPreview();
    }
  });
  
  // Add event listeners to save preferences when changed
  scrapeType.addEventListener('change', savePreferences);
  scrapeSpeed.addEventListener('change', savePreferences);
}

init();