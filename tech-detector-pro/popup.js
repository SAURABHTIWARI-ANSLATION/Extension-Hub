// Tech Detector Pro - Popup Script (Debug Version)
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Popup loaded');
  initialize();
});

let currentTechData = null;
let scanHistory = [];

async function initialize() {
  console.log('🔧 Initializing...');

  // Get current tab URL
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('📍 Current tab:', tab);

    if (!tab?.url) {
      console.error('❌ No tab URL found');
      document.getElementById('currentUrl').textContent = 'No URL found';
      return;
    }

    document.getElementById('currentUrl').textContent = tab.url;
    console.log('✅ URL set:', tab.url);
  } catch (error) {
    console.error('❌ Error getting tab:', error);
    document.getElementById('currentUrl').textContent = 'Error: ' + error.message;
  }

  // Load history
  try {
    const result = await chrome.storage.local.get(['scanHistory']);
    if (result.scanHistory) {
      scanHistory = result.scanHistory;
      updateHistoryList();
      console.log('📚 History loaded:', scanHistory.length, 'items');
    }
  } catch (error) {
    console.error('❌ Error loading history:', error);
  }

  // Setup event listeners
  setupEventListeners();

  // Auto-scan if enabled
  try {
    const settings = await chrome.storage.sync.get(['autoScan']);
    if (settings.autoScan) {
      console.log('🔄 Auto-scan enabled');
      startScan();
    }
  } catch (error) {
    console.error('❌ Error checking auto-scan:', error);
  }
}

function setupEventListeners() {
  // Scan buttons
  document.getElementById('scanBtn').addEventListener('click', () => {
    console.log('🔘 Scan button clicked');
    startScan();
  });

  document.getElementById('rescanBtn').addEventListener('click', () => {
    console.log('🔘 Rescan button clicked');
    startScan();
  });

  // Export buttons
  document.getElementById('copyBtn').addEventListener('click', copyReport);
  document.getElementById('downloadBtn').addEventListener('click', downloadReport);
  document.getElementById('shareBtn').addEventListener('click', shareReport);

  // Category filters
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterTechnologies(btn.dataset.category);
    });
  });

  console.log('✅ Event listeners setup complete');
}

async function startScan() {
  console.log('🔍 Starting scan...');
  showLoading(true);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      throw new Error('No active tab found');
    }

    console.log('📋 Tab ID:', tab.id);
    console.log('🌐 Tab URL:', tab.url);

    // Check if we can inject scripts
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      throw new Error('Cannot scan Chrome internal pages');
    }

    // Execute content script if not already
    console.log('💉 Injecting content script...');
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      console.log('✅ Content script injected');
    } catch (injectError) {
      console.warn('⚠️ Content script injection error (might be already loaded):', injectError);
    }

    // Wait a bit for script to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test if content script is loaded
    console.log('🏓 Sending PING to content script...');
    try {
      const pingResponse = await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
      console.log('✅ Content script responded:', pingResponse);
    } catch (pingError) {
      console.error('❌ Content script not responding:', pingError);
      throw new Error('Content script failed to load. Please refresh the page and try again.');
    }

    // Request tech detection
    console.log('📡 Requesting tech detection...');
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'DETECT_TECHNOLOGIES'
    });

    console.log('📦 Received response:', response);

    if (response?.success && response?.data) {
      console.log('✅ Tech data received:', response.data);
      currentTechData = response.data;
      displayResults(response.data);
      saveToHistory(tab.url, response.data);
      showLoading(false);
    } else if (response?.error) {
      throw new Error(response.message || 'Detection failed');
    } else {
      throw new Error('Invalid response from content script');
    }

  } catch (error) {
    console.error('❌ Scan error:', error);
    showError('Failed to scan: ' + error.message);
    showLoading(false);
  }
}

function displayResults(techData) {
  console.log('🎨 Displaying results:', techData);

  const resultsSection = document.getElementById('results');
  const loadingSection = document.getElementById('loading');

  loadingSection?.classList.remove('active');
  resultsSection?.classList.add('active');

  // Safety check
  if (!techData || !techData.technologies || typeof techData.technologies !== "object") {
    console.warn("⚠️ No technologies data found:", techData);

    document.getElementById('techCount').textContent = "0";
    displayTechnologies({});
    updateSummary({ technologies: {} });
    return;
  }

  // Count technologies
  const totalTechs = Object.values(techData.technologies)
    .filter(Array.isArray)
    .reduce((sum, arr) => sum + arr.length, 0);

  console.log('📊 Total technologies found:', totalTechs);
  document.getElementById('techCount').textContent = totalTechs;

  // Display all technologies
  displayTechnologies(techData.technologies);

  // Update summary
  updateSummary(techData);
}

function displayTechnologies(technologies) {
  console.log('📋 Displaying technology list:', technologies);

  const techList = document.getElementById('techList');
  // Clear existing content safely
  techList.replaceChildren();

  const allTechs = Object.entries(technologies).flatMap(([category, techs]) =>
    techs.map(tech => {
      if (typeof tech === 'string') {
        return {
          id: tech.toLowerCase().replace(/\s+/g, '_'),
          name: tech,
          category,
          version: null,
          confidence: 'high'
        };
      }
      return { ...tech, category };
    })
  );

  console.log('🔢 Total tech items:', allTechs.length);

  if (allTechs.length === 0) {
    // Create empty state using DOM methods
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';

    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.textContent = '🔍';

    const message = document.createElement('p');
    message.textContent = 'No technologies detected on this page';

    const hint = document.createElement('p');
    hint.style.fontSize = '12px';
    hint.style.color = '#999';
    hint.style.marginTop = '8px';
    hint.textContent = 'This might be a static page or patterns didn\'t match.';

    emptyState.appendChild(icon);
    emptyState.appendChild(message);
    emptyState.appendChild(hint);
    techList.appendChild(emptyState);
    return;
  }

  allTechs.forEach(tech => {
    const techElement = createTechElement(tech);
    techList.appendChild(techElement);
  });

  console.log('✅ Technology list rendered');
}

function createTechElement(tech) {
  const div = document.createElement('div');
  div.className = 'tech-item';
  div.dataset.category = tech.category;

  // Create tech icon
  const techIcon = document.createElement('div');
  techIcon.className = 'tech-icon';
  techIcon.textContent = getCategoryIcon(tech.category);

  // Create tech content container
  const techContent = document.createElement('div');
  techContent.className = 'tech-content';

  // Create tech name
  const techName = document.createElement('div');
  techName.className = 'tech-name';
  techName.textContent = tech.name;

  // Create metadata container
  const metaContainer = document.createElement('div');

  // Add category
  const categorySpan = document.createElement('span');
  categorySpan.className = 'tech-category';
  categorySpan.textContent = tech.category;
  metaContainer.appendChild(categorySpan);

  // Add version if available
  if (tech.version) {
    const versionSpan = document.createElement('span');
    versionSpan.className = 'tech-version';
    versionSpan.textContent = `v${tech.version}`;
    metaContainer.appendChild(versionSpan);
  }

  // Add confidence badge if available
  if (tech.confidence) {
    const confidenceSpan = document.createElement('span');
    confidenceSpan.className = 'tech-confidence';
    confidenceSpan.title = 'Detection confidence';
    confidenceSpan.textContent = tech.confidence;
    metaContainer.appendChild(confidenceSpan);
  }

  // Assemble the structure
  techContent.appendChild(techName);
  techContent.appendChild(metaContainer);
  div.appendChild(techIcon);
  div.appendChild(techContent);

  return div;
}

function filterTechnologies(category) {
  console.log('🔍 Filtering by category:', category);

  const techItems = document.querySelectorAll('.tech-item');

  techItems.forEach(item => {
    if (category === 'all' || item.dataset.category === category) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

function updateSummary(techData) {
  const summaryGrid = document.getElementById('summaryGrid');
  const technologies = techData.technologies;

  const countTechs = (arr) => {
    if (!Array.isArray(arr)) return 0;
    return arr.length;
  };

  const summaryItems = [
    { label: 'Frontend', value: countTechs(technologies.frontend), icon: '🎨' },
    { label: 'Backend', value: countTechs(technologies.backend), icon: '⚙️' },
    { label: 'CMS', value: countTechs(technologies.cms), icon: '📝' },
    { label: 'Analytics', value: countTechs(technologies.analytics), icon: '📊' },
    { label: 'Hosting', value: countTechs(technologies.hosting), icon: '☁️' },
    { label: 'Libraries', value: countTechs(technologies.libraries), icon: '📚' },
    {
      label: 'Total',
      value: Object.values(technologies).reduce((sum, arr) => sum + countTechs(arr), 0),
      icon: '🔧'
    }
  ];

  // Clear and rebuild using DOM methods
  summaryGrid.replaceChildren();

  summaryItems.forEach(item => {
    const summaryItem = document.createElement('div');
    summaryItem.className = 'summary-item';

    const label = document.createElement('div');
    label.className = 'summary-label';
    label.textContent = `${item.icon} ${item.label}`;

    const value = document.createElement('div');
    value.className = 'summary-value';
    value.textContent = item.value.toString();

    summaryItem.appendChild(label);
    summaryItem.appendChild(value);
    summaryGrid.appendChild(summaryItem);
  });
}

function getCategoryIcon(category) {
  const icons = {
    frontend: '🎨',
    backend: '⚙️',
    cms: '📝',
    analytics: '📊',
    hosting: '☁️',
    libraries: '📚',
    other: '🔧'
  };
  return icons[category] || '🔍';
}

function showLoading(show) {
  const loading = document.getElementById('loading');
  const scanBtn = document.getElementById('scanBtn');

  if (show) {
    loading.classList.add('active');
    scanBtn.disabled = true;
    document.getElementById('results').classList.remove('active');
  } else {
    loading.classList.remove('active');
    scanBtn.disabled = false;
  }
}

function showError(message) {
  console.error('💥 Error:', message);
  alert(`❌ Error: ${message}`);
}

async function saveToHistory(url, techData) {
  try {
    const entry = {
      url,
      timestamp: new Date().toISOString(),
      techCount: Object.values(techData.technologies).flat().length,
      categories: Object.keys(techData.technologies).filter(cat =>
        techData.technologies[cat]?.length > 0
      )
    };

    scanHistory.unshift(entry);

    // Keep only last 3 entries
    if (scanHistory.length > 3) {
      scanHistory = scanHistory.slice(0, 3);
    }

    await chrome.storage.local.set({ scanHistory });
    updateHistoryList();

    console.log('💾 History saved (last 3 only)');
  } catch (error) {
    console.error('❌ Error saving history:', error);
  }
}

function updateHistoryList() {
  const historyList = document.getElementById('historyList');

  if (scanHistory.length === 0) {
    // Create empty state using DOM methods
    historyList.replaceChildren();

    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';

    const message = document.createElement('p');
    message.textContent = 'No scan history yet';

    emptyState.appendChild(message);
    historyList.appendChild(emptyState);
    return;
  }

  // Show only last 3 scans
  const recentHistory = scanHistory.slice(0, 3);

  // Clear and rebuild using DOM methods
  historyList.replaceChildren();

  recentHistory.forEach((entry, index) => {
    const date = new Date(entry.timestamp);
    const timeAgo = getTimeAgo(date);

    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.dataset.index = index.toString();

    const urlDiv = document.createElement('div');
    urlDiv.className = 'history-url';
    try {
      urlDiv.textContent = new URL(entry.url).hostname;
    } catch (e) {
      urlDiv.textContent = entry.url;
    }

    const techsDiv = document.createElement('div');
    techsDiv.className = 'history-techs';
    techsDiv.textContent = `${entry.techCount} techs`;

    const timeDiv = document.createElement('div');
    timeDiv.className = 'history-time';
    timeDiv.style.fontSize = '11px';
    timeDiv.style.color = '#9ca3af';
    timeDiv.style.marginTop = '2px';
    timeDiv.textContent = timeAgo;

    historyItem.appendChild(urlDiv);
    historyItem.appendChild(techsDiv);
    historyItem.appendChild(timeDiv);

    // Add click listener
    historyItem.addEventListener('click', () => loadHistoryItem(index));

    historyList.appendChild(historyItem);
  });
}

// Helper function to show time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function loadHistoryItem(index) {
  const entry = scanHistory[index];
  alert(`Scan from ${new Date(entry.timestamp).toLocaleString()}\nURL: ${entry.url}\nFound ${entry.techCount} technologies in categories: ${entry.categories.join(', ')}`);
}

async function copyReport() {
  if (!currentTechData) {
    showError('No scan results to copy');
    return;
  }

  const reportText = buildReportText(currentTechData);

  try {
    await navigator.clipboard.writeText(reportText);
    showNotification('✅ Report copied to clipboard!');
  } catch (error) {
    showError('Failed to copy: ' + error.message);
  }
}

async function downloadReport() {
  if (!currentTechData) {
    showError('No scan results to download');
    return;
  }

  const reportData = {
    ...currentTechData,
    exportedAt: new Date().toISOString(),
    tool: 'Tech Detector Pro'
  };

  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `tech-report-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showNotification('📥 Report downloaded!');
}

function shareReport() {
  if (!currentTechData) {
    showError('No scan results to share');
    return;
  }

  const techCount = Object.values(currentTechData.technologies).flat().length;
  const mainTechs = Object.entries(currentTechData.technologies)
    .filter(([_, techs]) => techs.length > 0)
    .map(([cat, techs]) => `${cat}: ${techs.length}`)
    .join(', ');

  const shareText = `🔍 Tech Detector Pro found ${techCount} technologies on this page:\n${mainTechs}`;

  if (navigator.share) {
    navigator.share({
      title: 'Technology Stack Report',
      text: shareText,
      url: currentTechData.url
    });
  } else {
    navigator.clipboard.writeText(shareText + '\nURL: ' + currentTechData.url);
    showNotification('✅ Share text copied to clipboard!');
  }
}

function buildReportText(techData) {
  let text = `TECH DETECTOR PRO REPORT\n`;
  text += `========================\n`;
  text += `URL: ${techData.url}\n`;
  text += `Scan Date: ${new Date().toLocaleString()}\n`;

  const totalTechs = Object.values(techData.technologies).reduce((sum, arr) =>
    sum + (Array.isArray(arr) ? arr.length : 0), 0
  );
  text += `Total Technologies: ${totalTechs}\n\n`;

  Object.entries(techData.technologies).forEach(([category, techs]) => {
    if (Array.isArray(techs) && techs.length > 0) {
      text += `${category.toUpperCase()} (${techs.length}):\n`;
      techs.forEach(tech => {
        const techName = typeof tech === 'string' ? tech : tech.name;
        const techVersion = typeof tech === 'string' ? null : tech.version;
        text += `  • ${techName}`;
        if (techVersion) text += ` v${techVersion}`;
        text += '\n';
      });
      text += '\n';
    }
  });

  text += `========================\n`;
  text += `Generated by Tech Detector Pro v1.0`;

  return text;
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #10b981;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Animation styles
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

console.log('✅ Popup script loaded');