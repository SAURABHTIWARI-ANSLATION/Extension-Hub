// popup.js - UPDATED with clickable URL links

// DOM Elements
const scanBtn = document.getElementById('scanBtn');
const highlightBtn = document.getElementById('highlightBtn');
const clearBtn = document.getElementById('clearBtn');
const exportCSV = document.getElementById('exportCSV');
const exportJSON = document.getElementById('exportJSON');
const copyAll = document.getElementById('copyAll');
const currentUrl = document.getElementById('currentUrl');
const resultsBody = document.getElementById('resultsBody');
const refreshBtn = document.getElementById('refreshBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');

// Stats Elements
const totalLinksEl = document.getElementById('totalLinks');
const brokenLinksEl = document.getElementById('brokenLinks');
const successRateEl = document.getElementById('successRate');
const seoScoreEl = document.getElementById('seoScore');
const seoTrend = document.getElementById('seoTrend');
const brokenCount = document.getElementById('brokenCount');
const successProgressBar = document.getElementById('successProgressBar');

// Settings Elements
const autoHighlight = document.getElementById('autoHighlight');
const showNotifications = document.getElementById('showNotifications');
const checkExternalLinks = document.getElementById('checkExternalLinks');
const bulkScanMode = document.getElementById('bulkScanMode');

// Progress Elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// Debug: Log any missing critical elements
const requiredElements = {
    scanBtn, highlightBtn, clearBtn, currentUrl, resultsBody,
    totalLinksEl, brokenLinksEl, successRateEl, seoScoreEl
};

for (const [name, element] of Object.entries(requiredElements)) {
    if (!element) {
        console.error(`Missing required element: ${name}`);
    }
}

// State
let scanResults = [];
let currentStats = {
    total: 0,
    broken: 0,
    successRate: 100,
    seoScore: 100
};
let settings = {};
let isScanning = false;

// Initialize
document.addEventListener('DOMContentLoaded', init);

// Modify the init function to clear on load
async function init() {
    try {
        // Clear any previous results immediately
        clearPreviousResults();
        
        // Load settings
        const data = await chrome.storage.sync.get(['settings']);
        settings = data.settings || {
            autoHighlight: true,
            showNotifications: true,
            checkExternalLinks: false,
            bulkScanMode: false
        };
        
        // Apply settings
        autoHighlight.checked = settings.autoHighlight;
        showNotifications.checked = settings.showNotifications;
        checkExternalLinks.checked = settings.checkExternalLinks;
        bulkScanMode.checked = settings.bulkScanMode;
        
        // Get current tab URL
        await updateCurrentUrl();
        
        // Clear any stored scan data for this session
        chrome.storage.local.remove(['lastScan'], () => {
            console.log('Cleared previous scan data');
        });
        
        // Setup event listeners
        setupEventListeners();
        
        showStatus('Ready to scan', 'ready');
    } catch (error) {
        console.error('Initialization error:', error);
        showStatus('Error initializing extension', 'error');
    }
}

// Add this new function to clear old results
function clearPreviousResults() {
    scanResults = [];
    currentStats = {
        total: 0,
        broken: 0,
        successRate: 100,
        seoScore: 100
    };
    
    // Update UI with empty state
    if (totalLinksEl) totalLinksEl.textContent = '0';
    if (brokenLinksEl) brokenLinksEl.textContent = '0';
    if (successRateEl) successRateEl.textContent = '100%';
    if (seoScoreEl) seoScoreEl.textContent = '100';
    if (brokenCount) brokenCount.textContent = '0';
    if (successProgressBar) successProgressBar.style.width = '100%';
    if (seoTrend) {
        seoTrend.textContent = 'Excellent';
        seoTrend.style.color = 'var(--success)';
    }
    
    // Clear results table
    if (resultsBody) {
        resultsBody.innerHTML = `
            <div class="empty-state-premium">
                <div class="empty-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>Ready to Scan</h3>
                <p>Click "Scan Page" to analyze all links on this webpage</p>
                <div class="empty-features">
                    <div class="feature-item">
                        <i class="fas fa-check-circle"></i>
                        <span>Instant Analysis</span>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-check-circle"></i>
                        <span>Visual Highlighting</span>
                    </div>
                    <div class="featureItem">
                        <i class="fas fa-check-circle"></i>
                        <span>Detailed Reports</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Clear any existing highlights on the page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'clearHighlights' });
        }
    });
}

function setupEventListeners() {
    // Scan button
    if (scanBtn) {
        scanBtn.addEventListener('click', startScan);
    }
    
    // Refresh button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            location.reload();
        });
    }
    
    // Settings button
    if (settingsBtn && settingsPanel) {
        settingsBtn.addEventListener('click', () => {
            settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    // Highlight button
    if (highlightBtn) {
        highlightBtn.addEventListener('click', async () => {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                const brokenLinks = scanResults.filter(r => !r.ok);
                
                if (brokenLinks.length === 0) {
                    showStatus('No broken links to highlight', 'warning');
                    return;
                }
                
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'highlightBroken',
                    links: brokenLinks
                });
                
                showStatus(`Highlighted ${brokenLinks.length} broken links`, 'success');
            } catch (error) {
                console.error('Highlight error:', error);
                showStatus('Failed to highlight links', 'error');
            }
        });
    }
    
    // Clear highlights
    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                await chrome.tabs.sendMessage(tab.id, { action: 'clearHighlights' });
                showStatus('Highlights cleared', 'success');
            } catch (error) {
                console.error('Clear error:', error);
                showStatus('Failed to clear highlights', 'error');
            }
        });
    }
    
    // Export buttons
    if (exportCSV) exportCSV.addEventListener('click', exportToCSV);
    if (exportJSON) exportJSON.addEventListener('click', exportToJSON);
    if (copyAll) copyAll.addEventListener('click', copyResultsToClipboard);
    
    // Settings changes
    if (autoHighlight) autoHighlight.addEventListener('change', saveSettings);
    if (showNotifications) showNotifications.addEventListener('change', saveSettings);
    if (checkExternalLinks) checkExternalLinks.addEventListener('change', saveSettings);
    if (bulkScanMode) bulkScanMode.addEventListener('change', saveSettings);
}

async function updateCurrentUrl() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
            const url = new URL(tab.url);
            currentUrl.textContent = url.hostname;
        } else {
            currentUrl.textContent = 'Cannot access URL';
        }
    } catch (error) {
        console.error('URL update error:', error);
        currentUrl.textContent = 'Error loading URL';
    }
}

async function startScan() {
    if (isScanning) {
        showStatus('Scan already in progress', 'warning');
        return;
    }

    // Clear previous results before starting new scan
    clearPreviousResults();
    
    isScanning = true;
    showStatus('Scanning page for links...', 'scanning');
    showProgress(0);
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab || !tab.id) {
            throw new Error('No active tab found');
        }
        
        // Execute content script to find links
        const response = await chrome.tabs.sendMessage(tab.id, { 
            action: 'findAllLinks',
            checkExternal: checkExternalLinks.checked
        });
        
        if (!response || !response.links || response.links.length === 0) {
            showStatus('No links found on this page', 'warning');
            isScanning = false;
            hideProgress();
            return;
        }
        
        showStatus(`Found ${response.links.length} links, checking status...`, 'scanning');
        
        // Check each link
        scanResults = [];
        let checkedCount = 0;
        const totalLinks = response.links.length;
        
        // Process links in batches for better performance
        const batchSize = 5;
        for (let i = 0; i < totalLinks; i += batchSize) {
            const batch = response.links.slice(i, Math.min(i + batchSize, totalLinks));
            const batchPromises = batch.map(link => checkLinkStatus(link));
            const batchResults = await Promise.all(batchPromises);
            
            scanResults.push(...batchResults);
            checkedCount += batchResults.length;
            
            const progress = Math.round((checkedCount / totalLinks) * 100);
            showProgress(progress);
            
            // Update UI incrementally
            if (checkedCount % 10 === 0 || checkedCount === totalLinks) {
                calculateStatistics();
                updateResultsTable();
            }
        }
        
        // Final statistics calculation
        calculateStatistics();
        updateResultsTable();
        
        // Save only stats (not full results to avoid quota issues)
        try {
            await chrome.storage.sync.set({
                lastScan: {
                    stats: currentStats,
                    timestamp: Date.now(),
                    url: tab.url,
                    brokenCount: currentStats.broken
                }
            });
        } catch (storageError) {
            console.warn('Failed to save scan stats:', storageError);
            // Continue anyway - not critical
        }
        
        // Auto-highlight if enabled
        if (autoHighlight.checked && currentStats.broken > 0) {
            const brokenLinks = scanResults.filter(r => !r.ok);
            await chrome.tabs.sendMessage(tab.id, {
                action: 'highlightBroken',
                links: brokenLinks
            });
        }
        
        // Show notification if enabled
        if (showNotifications.checked && currentStats.broken > 0) {
            chrome.runtime.sendMessage({
                type: 'SHOW_NOTIFICATION',
                title: 'Scan Complete',
                message: `Found ${currentStats.broken} broken link${currentStats.broken !== 1 ? 's' : ''} on this page`
            });
        }
        
        const statusMsg = currentStats.broken === 0 
            ? 'Scan complete! No broken links found' 
            : `Scan complete! Found ${currentStats.broken} broken link${currentStats.broken !== 1 ? 's' : ''}`;
        
        showStatus(statusMsg, currentStats.broken === 0 ? 'success' : 'warning');
        
        // Hide progress after 2 seconds
        setTimeout(() => {
            hideProgress();
        }, 2000);
        
    } catch (error) {
        console.error('Scan error:', error);
        showStatus('Error scanning page: ' + error.message, 'error');
        hideProgress();
    } finally {
        isScanning = false;
    }
}

async function checkLinkStatus(link) {
    try {
        // Skip mailto:, tel:, javascript: links
        if (link.url.startsWith('mailto:') || 
            link.url.startsWith('tel:') || 
            link.url.startsWith('javascript:') ||
            link.url.startsWith('#')) {
            return {
                ...link,
                status: 'skipped',
                ok: true,
                error: null
            };
        }
        
        // Use background script for CORS
        const response = await chrome.runtime.sendMessage({
            type: 'CHECK_LINK',
            url: link.url
        });
        
        return {
            ...link,
            status: response.status || 0,
            ok: response.ok || false,
            error: response.error || null,
            statusText: response.statusText || 'Error'
        };
        
    } catch (error) {
        console.error('Link check error:', link.url, error);
        return {
            ...link,
            status: 0,
            ok: false,
            error: error.message,
            statusText: 'Network Error'
        };
    }
}

function calculateStatistics() {
    const total = scanResults.length;
    const broken = scanResults.filter(r => !r.ok && r.status !== 'skipped').length;
    const successRate = total > 0 ? Math.round(((total - broken) / total) * 100) : 100;
    
    // Calculate SEO score (0-100)
    let seoScore = 100;
    if (broken > 0) {
        const brokenRatio = broken / total;
        seoScore = Math.max(0, Math.round(100 - (brokenRatio * 100)));
        
        if (broken > 10) seoScore = Math.max(0, seoScore - 10);
        if (broken > 20) seoScore = Math.max(0, seoScore - 20);
    }
    
    currentStats = { total, broken, successRate, seoScore };
    updateUI();
}

function updateUI() {
    // Update statistics (with null checks)
    if (totalLinksEl) totalLinksEl.textContent = currentStats.total;
    if (brokenLinksEl) brokenLinksEl.textContent = currentStats.broken;
    if (successRateEl) successRateEl.textContent = `${currentStats.successRate}%`;
    if (seoScoreEl) seoScoreEl.textContent = currentStats.seoScore;
    if (brokenCount) brokenCount.textContent = currentStats.broken;
    
    // Update progress bar
    if (successProgressBar) {
        successProgressBar.style.width = `${currentStats.successRate}%`;
    }
    
    // Update SEO trend text
    if (seoTrend) {
        if (currentStats.seoScore >= 90) {
            seoTrend.textContent = 'Excellent';
            seoTrend.style.color = 'var(--success)';
        } else if (currentStats.seoScore >= 70) {
            seoTrend.textContent = 'Good';
            seoTrend.style.color = 'var(--info)';
        } else if (currentStats.seoScore >= 50) {
            seoTrend.textContent = 'Fair';
            seoTrend.style.color = 'var(--warning)';
        } else {
            seoTrend.textContent = 'Poor';
            seoTrend.style.color = 'var(--danger)';
        }
    }
    
    // Update results table
    updateResultsTable();
}

// FIXED: updateResultsTable with clickable URL links
function updateResultsTable() {
    if (!resultsBody) {
        console.error('resultsBody element not found');
        return;
    }
    
    const brokenResults = scanResults.filter(r => !r.ok && r.status !== 'skipped');
    
    if (brokenResults.length === 0) {
        resultsBody.innerHTML = `
            <div class="empty-state-premium">
                <div class="empty-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>All Links Healthy!</h3>
                <p>No broken links detected on this page. Great job!</p>
                <div class="empty-features">
                    <div class="feature-item">
                        <i class="fas fa-check-circle"></i>
                        <span>100% Success Rate</span>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-check-circle"></i>
                        <span>SEO Optimized</span>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    resultsBody.innerHTML = brokenResults.map(result => {
        const statusClass = `status-${result.status}`;
        const displayUrl = result.url.length > 60 ? result.url.substring(0, 60) + '...' : result.url;
        const displayText = (result.text || '(no text)').length > 40 
            ? result.text.substring(0, 40) + '...' 
            : (result.text || '(no text)');
        
        return `
            <div class="result-item broken" data-url="${escapeHtml(result.url)}">
                <!-- FIX: Clickable URL column - entire span is clickable -->
                <span class="col-url">
                    <a href="#" class="url-link" data-url="${escapeHtml(result.url)}" title="Click to open: ${escapeHtml(result.url)}">
                        <i class="fas fa-external-link-alt" style="font-size: 10px; margin-right: 4px; color: var(--primary);"></i>
                        ${escapeHtml(displayUrl)}
                    </a>
                </span>
                
                <span class="col-status">
                    <span class="status-badge ${statusClass}">
                        ${result.status === 0 ? 'ERR' : result.status}
                    </span>
                </span>
                
                <span class="col-text" title="${escapeHtml(result.text || '')}">
                    ${escapeHtml(displayText)}
                </span>
                
                <span class="col-actions">
                    <button class="action-icon" data-action="open" data-url="${escapeHtml(result.url)}" title="Open Link in New Tab">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                    <button class="action-icon" data-action="copy" data-url="${escapeHtml(result.url)}" title="Copy URL">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="action-icon" data-action="test" data-url="${escapeHtml(result.url)}" title="Test Link Again">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </span>
            </div>
        `;
    }).join('');
    
    // Add event delegation for action buttons AND URL links
    attachUrlLinkListeners();
}

// NEW: Add click listeners for URL links
function attachUrlLinkListeners() {
    if (!resultsBody) return;
    
    // Remove old listeners if exists
    resultsBody.removeEventListener('click', handleUrlClick);
    
    // Add new listener for URL links
    resultsBody.addEventListener('click', handleUrlClick);
}

// NEW: Handle URL link clicks
function handleUrlClick(e) {
    const urlLink = e.target.closest('.url-link');
    if (!urlLink) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const url = urlLink.dataset.url;
    if (url) {
        chrome.tabs.create({ url: url, active: false });
        showStatus('Opening link in new tab...', 'info');
    }
}

// FIXED: handleActionClick with more actions
function handleActionClick(e) {
    const button = e.target.closest('.action-icon');
    if (!button) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const action = button.dataset.action;
    const url = button.dataset.url;
    
    switch (action) {
        case 'open':
            chrome.tabs.create({ url: url, active: false });
            showStatus('Opening link in new tab...', 'info');
            break;
            
        case 'copy':
            navigator.clipboard.writeText(url).then(() => {
                showStatus('URL copied to clipboard!', 'success');
            }).catch(err => {
                console.error('Copy failed:', err);
                showStatus('Failed to copy URL', 'error');
            });
            break;
            
        case 'test':
            // Re-test a single broken link
            retestLink(url, button);
            break;
    }
}

// NEW: Retest a single link
async function retestLink(url, buttonElement) {
    try {
        // Show loading state
        const originalHtml = buttonElement.innerHTML;
        buttonElement.innerHTML = '<i class="fas fa-spinner fa-pulse"></i>';
        buttonElement.disabled = true;
        
        const response = await chrome.runtime.sendMessage({
            type: 'CHECK_LINK',
            url: url
        });
        
        // Update the result in scanResults
        const resultIndex = scanResults.findIndex(r => r.url === url);
        if (resultIndex !== -1) {
            scanResults[resultIndex] = {
                ...scanResults[resultIndex],
                status: response.status || 0,
                ok: response.ok || false,
                error: response.error || null,
                statusText: response.statusText || 'Error'
            };
        }
        
        // Recalculate statistics and update table
        calculateStatistics();
        updateResultsTable();
        
        showStatus(`Link test complete: ${response.ok ? 'Working' : 'Broken'}`, 
                  response.ok ? 'success' : 'warning');
        
        // Restore button
        buttonElement.innerHTML = originalHtml;
        buttonElement.disabled = false;
        
    } catch (error) {
        console.error('Retest error:', error);
        showStatus('Failed to retest link', 'error');
        
        // Restore button
        buttonElement.innerHTML = '<i class="fas fa-sync-alt"></i>';
        buttonElement.disabled = false;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function exportToCSV() {
    const brokenLinks = scanResults.filter(r => !r.ok && r.status !== 'skipped');
    
    if (brokenLinks.length === 0) {
        showStatus('No broken links to export', 'warning');
        return;
    }
    
    const headers = ['URL', 'Status', 'Status Text', 'Link Text', 'Type', 'Error'];
    const rows = brokenLinks.map(r => [
        `"${(r.url || '').replace(/"/g, '""')}"`,
        r.status,
        `"${(r.statusText || '').replace(/"/g, '""')}"`,
        `"${(r.text || '').replace(/"/g, '""')}"`,
        `"${(r.type || 'link').replace(/"/g, '""')}"`,
        `"${(r.error || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
    
    downloadFile(csvContent, 'broken-links.csv', 'text/csv');
    showStatus('CSV exported successfully', 'success');
}

function exportToJSON() {
    const brokenLinks = scanResults.filter(r => !r.ok && r.status !== 'skipped');
    
    if (brokenLinks.length === 0) {
        showStatus('No broken links to export', 'warning');
        return;
    }
    
    const data = {
        scanDate: new Date().toISOString(),
        url: currentUrl.textContent,
        stats: currentStats,
        brokenLinks: brokenLinks
    };
    
    downloadFile(JSON.stringify(data, null, 2), 'broken-links.json', 'application/json');
    showStatus('JSON exported successfully', 'success');
}

function copyResultsToClipboard() {
    const brokenLinks = scanResults.filter(r => !r.ok && r.status !== 'skipped');
    
    if (brokenLinks.length === 0) {
        showStatus('No broken links to copy', 'warning');
        return;
    }
    
    const text = brokenLinks
        .map(r => `${r.url} - ${r.status} ${r.statusText || ''}`)
        .join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
        showStatus('Copied to clipboard', 'success');
    }).catch(err => {
        console.error('Copy failed:', err);
        showStatus('Failed to copy', 'error');
    });
}

function downloadFile(content, filename, type) {
    try {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        
        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error('Download error:', chrome.runtime.lastError);
                showStatus('Download failed', 'error');
            }
            // Clean up the blob URL after a delay
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
    } catch (error) {
        console.error('File download error:', error);
        showStatus('Failed to create download', 'error');
    }
}

function showStatus(message, type = 'info') {
    if (!statusText) {
        console.warn('statusText element not found');
        return;
    }
    
    statusText.textContent = message;
    
    if (!statusIndicator) return;
    
    const statusDot = statusIndicator.querySelector('.status-dot');
    if (!statusDot) return;
    
    // Update dot color based on status
    if (type === 'error') {
        statusDot.style.background = 'var(--danger)';
    } else if (type === 'success') {
        statusDot.style.background = 'var(--success)';
    } else if (type === 'warning') {
        statusDot.style.background = 'var(--warning)';
    } else if (type === 'scanning') {
        statusDot.style.background = 'var(--info)';
    } else {
        statusDot.style.background = 'var(--success)';
    }
}

function showProgress(percent) {
    if (!progressSection || !progressFill || !progressText) return;
    
    progressSection.style.display = 'block';
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${percent}%`;
}

function hideProgress() {
    if (!progressSection) return;
    progressSection.style.display = 'none';
}

async function saveSettings() {
    settings = {
        autoHighlight: autoHighlight.checked,
        showNotifications: showNotifications.checked,
        checkExternalLinks: checkExternalLinks.checked,
        bulkScanMode: bulkScanMode.checked
    };
    
    try {
        await chrome.storage.sync.set({ settings });
        showStatus('Settings saved', 'success');
    } catch (error) {
        console.error('Settings save error:', error);
        showStatus('Failed to save settings', 'error');
    }
}

// ===== FIX: Missing function that popup expects =====
function attachActionButtonListeners() {
  console.log('attachActionButtonListeners() called (stub)');

  // If you later want to add real behavior, you can modify this
  document.querySelectorAll('.result-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      console.log('Result action clicked:', e.target);
    });
  });
}
