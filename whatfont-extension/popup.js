console.log('WhatFont popup loaded');

// DOM Elements
const elements = {
    toggleHover: null,
    startBtn: null,
    stopBtn: null,
    clearBtn: null,
    modeOptions: null,
    fontsList: null,
    currentFontSection: null,
    currentPreview: null,
    currentDetails: null,
    detectedSection: null,
    showDownload: null,
    showCSS: null,
    highlightText: null,
    panelPosition: null
};

// State
const state = {
    isActive: false,
    detectionMode: 'hover',
    detectedFonts: [],
    currentFont: null
};

// ⭐ CRITICAL FIX: Register message listener IMMEDIATELY (before DOMContentLoaded)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('🔔 Popup received message:', request.action, request);
    
    if (request.action === 'fontDetected') {
        console.log('✅ Font detected:', request.fontInfo.family);
        
        // Add to detected fonts
        addDetectedFont(request.fontInfo);
        
        // Show in UI if elements are ready
        if (elements.fontsList) {
            updateFontsList();
            showCurrentFont(request.fontInfo);
        }
        
        sendResponse({received: true});
    }
    
    return false;
});

// Initialize popup
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing popup...');
    
    // Get all DOM elements
    initializeElements();
    
    // Load saved state
    loadState();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check if content script is ready
    checkContentScriptStatus();
    
    console.log('Popup initialized');
    console.log('Current detected fonts:', state.detectedFonts.length);
});

// Initialize DOM element references
function initializeElements() {
    elements.toggleHover = document.getElementById('toggleHover');
    elements.startBtn = document.getElementById('startBtn');
    elements.stopBtn = document.getElementById('stopBtn');
    elements.clearBtn = document.getElementById('clearBtn');
    elements.modeOptions = document.querySelectorAll('.mode-option');
    elements.fontsList = document.getElementById('fontsList');
    elements.currentFontSection = document.getElementById('currentFontSection');
    elements.currentPreview = document.getElementById('currentPreview');
    elements.currentDetails = document.getElementById('currentDetails');
    elements.detectedSection = document.getElementById('detectedSection');
    elements.showDownload = document.getElementById('showDownload');
    elements.showCSS = document.getElementById('showCSS');
    elements.highlightText = document.getElementById('highlightText');
    elements.panelPosition = document.getElementById('panelPosition');
}

// Load state from storage
function loadState() {
    chrome.storage.local.get([
        'whatFontActive', 
        'detectionMode', 
        'detectedFonts',
        'showDownload',
        'showCSS',
        'highlightText',
        'panelPosition'
    ], function(data) {
        console.log('📦 Loaded state from storage:', data);
        
        // Set state
        state.isActive = data.whatFontActive || false;
        state.detectionMode = data.detectionMode || 'hover';
        state.detectedFonts = data.detectedFonts || [];
        
        console.log('📊 Total fonts in storage:', state.detectedFonts.length);
        
        // Update UI
        elements.toggleHover.checked = state.isActive;
        setActiveMode(state.detectionMode);
        updateButtonStates();
        updateFontsList(); // This will now show fonts
        
        // Set settings
        if (elements.showDownload) elements.showDownload.checked = data.showDownload !== false;
        if (elements.showCSS) elements.showCSS.checked = data.showCSS !== false;
        if (elements.highlightText) elements.highlightText.checked = data.highlightText || false;
        if (elements.panelPosition) elements.panelPosition.value = data.panelPosition || 'top-right';
    });
}

// Setup all event listeners
function setupEventListeners() {
    // Toggle
    elements.toggleHover?.addEventListener('change', handleToggleChange);
    
    // Buttons
    elements.startBtn?.addEventListener('click', handleStartClick);
    elements.stopBtn?.addEventListener('click', handleStopClick);
    elements.clearBtn?.addEventListener('click', handleClearClick);
    
    // Mode options
    elements.modeOptions?.forEach(option => {
        option.addEventListener('click', handleModeClick);
    });
    
    // Settings
    elements.showDownload?.addEventListener('change', saveSettings);
    elements.showCSS?.addEventListener('change', saveSettings);
    elements.highlightText?.addEventListener('change', saveSettings);
    elements.panelPosition?.addEventListener('change', saveSettings);
}

// Check if content script is ready
async function checkContentScriptStatus() {
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        if (!tab?.id) {
            console.log('No active tab');
            return;
        }
        
        // Check if URL is valid for extension
        if (tab.url?.startsWith('chrome://') || 
            tab.url?.startsWith('chrome-extension://') ||
            tab.url?.startsWith('edge://')) {
            console.log('⚠️ Cannot work on this page');
            return;
        }
        
        // Ping content script
        const response = await sendToContentScript({action: 'ping'});
        
        if (response && response.status === 'alive') {
            console.log('✅ Content script is ready');
            
            // If was active, reactivate
            if (state.isActive) {
                await sendToContentScript({
                    action: 'activateFontDetection',
                    mode: state.detectionMode
                });
            }
        } else {
            console.log('⚠️ Content script not responding');
        }
        
    } catch (error) {
        console.log('❌ Content script check failed:', error.message);
    }
}

// Event Handlers
async function handleToggleChange(e) {
    state.isActive = e.target.checked;
    updateButtonStates();
    saveState();
    
    if (state.isActive) {
        const success = await sendToContentScript({
            action: 'activateFontDetection',
            mode: state.detectionMode
        });
        
        if (!success) {
            alert('⚠️ Please refresh the page first!');
            e.target.checked = false;
            state.isActive = false;
        }
    } else {
        await sendToContentScript({
            action: 'deactivateFontDetection'
        });
    }
}

async function handleStartClick() {
    state.isActive = true;
    elements.toggleHover.checked = true;
    updateButtonStates();
    saveState();
    
    const success = await sendToContentScript({
        action: 'activateFontDetection',
        mode: state.detectionMode
    });
    
    if (!success) {
        alert('⚠️ Please refresh the page first!');
        state.isActive = false;
        elements.toggleHover.checked = false;
        updateButtonStates();
    }
}

async function handleStopClick() {
    state.isActive = false;
    elements.toggleHover.checked = false;
    updateButtonStates();
    saveState();
    
    await sendToContentScript({
        action: 'deactivateFontDetection'
    });
}

function handleClearClick() {
    console.log('🗑️ Clearing all fonts');
    state.detectedFonts = [];
    state.currentFont = null;
    updateFontsList();
    hideCurrentFont();
    saveState();
}

async function handleModeClick(e) {
    const button = e.currentTarget;
    state.detectionMode = button.dataset.mode;
    setActiveMode(state.detectionMode);
    saveState();
    
    console.log('🔄 Mode changed to:', state.detectionMode);
    
    if (state.isActive) {
        await sendToContentScript({
            action: 'changeDetectionMode',
            mode: state.detectionMode
        });
    }
}

// Helper Functions
async function sendToContentScript(message) {
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        if (!tab?.id) {
            console.log('No active tab');
            return false;
        }
        
        const response = await chrome.tabs.sendMessage(tab.id, message);
        console.log('✉️ Message sent:', message.action, '→ Response:', response);
        return response;
        
    } catch (error) {
        console.log('❌ Failed to send message:', error.message);
        return false;
    }
}

function setActiveMode(mode) {
    elements.modeOptions?.forEach(option => {
        option.classList.toggle('active', option.dataset.mode === mode);
    });
}

function updateButtonStates() {
    if (state.isActive) {
        elements.startBtn.disabled = true;
        elements.stopBtn.disabled = false;
        elements.startBtn.style.opacity = '0.6';
        elements.stopBtn.style.opacity = '1';
    } else {
        elements.startBtn.disabled = false;
        elements.stopBtn.disabled = true;
        elements.startBtn.style.opacity = '1';
        elements.stopBtn.style.opacity = '0.6';
    }
}

function saveState() {
    console.log('💾 Saving state, fonts count:', state.detectedFonts.length);
    chrome.storage.local.set({
        whatFontActive: state.isActive,
        detectionMode: state.detectionMode,
        detectedFonts: state.detectedFonts
    }, () => {
        console.log('✅ State saved to storage');
    });
}

function saveSettings() {
    const settings = {
        showDownload: elements.showDownload?.checked,
        showCSS: elements.showCSS?.checked,
        highlightText: elements.highlightText?.checked,
        panelPosition: elements.panelPosition?.value
    };
    
    chrome.storage.local.set(settings);
    
    // Update content script
    sendToContentScript({
        action: 'updateSettings',
        settings: settings
    });
}

function addDetectedFont(fontInfo) {
    // Check if already exists (same family, size, weight)
    const exists = state.detectedFonts.some(f => 
        f.family === fontInfo.family && 
        f.size === fontInfo.size && 
        f.weight === fontInfo.weight
    );
    
    if (!exists) {
        console.log('➕ Adding new font:', fontInfo.family, fontInfo.size, fontInfo.weight);
        state.detectedFonts.push(fontInfo);
        
        // Keep only last 50 fonts (increased from 20)
        if (state.detectedFonts.length > 50) {
            state.detectedFonts.shift();
        }
        
        // Save immediately
        saveState();
    } else {
        console.log('⏭️ Font already exists, skipping');
    }
}

function updateFontsList() {
    if (!elements.fontsList) {
        console.log('⚠️ fontsList element not found');
        return;
    }
    
    console.log('🔄 Updating fonts list, total:', state.detectedFonts.length);
    
    elements.fontsList.innerHTML = '';
    
    if (state.detectedFonts.length === 0) {
        elements.fontsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-font"></i>
                <p>No fonts detected yet</p>
                <small>Enable detection and hover over text</small>
            </div>
        `;
        return;
    }
    
    // Show last 10 detected fonts (increased from 5)
    const recent = state.detectedFonts.slice(-10).reverse();
    
    console.log('📝 Showing', recent.length, 'recent fonts');
    
    recent.forEach((font, index) => {
        const item = document.createElement('div');
        item.className = 'font-item';
        item.innerHTML = `
            <div class="font-name">${escapeHtml(font.family)}</div>
            <div class="font-stats">
                <span>${escapeHtml(font.size)}</span>
                <span>${escapeHtml(font.weight)}</span>
            </div>
        `;
        
        item.addEventListener('click', () => {
            console.log('👆 Font clicked:', font.family);
            showCurrentFont(font);
        });
        
        elements.fontsList.appendChild(item);
    });
}

function showCurrentFont(font) {
    console.log('👁️ Showing font details:', font.family);
    
    state.currentFont = font;
    elements.currentFontSection?.classList.remove('hidden');
    elements.detectedSection?.classList.add('hidden');
    
    // Update preview
    if (elements.currentPreview) {
        elements.currentPreview.textContent = 'Aa Bb Cc 123';
        elements.currentPreview.style.fontFamily = font.family;
        elements.currentPreview.style.fontSize = '32px';
        elements.currentPreview.style.fontWeight = font.weight;
        elements.currentPreview.style.fontStyle = font.style;
    }
    
    // Update details
    if (elements.currentDetails) {
        elements.currentDetails.innerHTML = `
            <div class="detail-item">
                <div class="detail-label">Font Family</div>
                <div class="detail-value">${escapeHtml(font.family)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Size</div>
                <div class="detail-value">${escapeHtml(font.size)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Weight</div>
                <div class="detail-value">${escapeHtml(font.weight)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Style</div>
                <div class="detail-value">${escapeHtml(font.style)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Line Height</div>
                <div class="detail-value">${escapeHtml(font.lineHeight || 'normal')}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Color</div>
                <div class="detail-value">
                    <span style="display: inline-block; width: 12px; height: 12px; 
                         background: ${escapeHtml(font.color)}; border-radius: 50%; 
                         border: 1px solid #ccc; margin-right: 6px;"></span>
                    ${escapeHtml(font.color)}
                </div>
            </div>
        `;
        
        // Add CSS code if enabled
        if (elements.showCSS?.checked) {
            const cssItem = document.createElement('div');
            cssItem.className = 'detail-item';
            cssItem.style.gridColumn = '1 / -1';
            cssItem.innerHTML = `
                <div class="detail-label">CSS Code</div>
                <div class="detail-value" style="font-family: monospace; font-size: 11px; 
                     background: #f5f5f5; padding: 8px; border-radius: 4px; margin-top: 4px;">
                    font-family: ${escapeHtml(font.family)};<br>
                    font-size: ${escapeHtml(font.size)};<br>
                    font-weight: ${escapeHtml(font.weight)};<br>
                    font-style: ${escapeHtml(font.style)};
                </div>
            `;
            elements.currentDetails.appendChild(cssItem);
        }
        
        // Add download link if enabled
        if (elements.showDownload?.checked) {
            const downloadItem = document.createElement('div');
            downloadItem.className = 'detail-item';
            downloadItem.style.gridColumn = '1 / -1';
            downloadItem.innerHTML = `
                <div class="detail-label">Find Font</div>
                <div class="detail-value">
                    <a href="https://fonts.google.com/?query=${encodeURIComponent(font.family)}" 
                       target="_blank" style="color: var(--theme-primary-btn-start); 
                       text-decoration: none; font-weight: 500;">
                       🔗 Search on Google Fonts
                    </a>
                </div>
            `;
            elements.currentDetails.appendChild(downloadItem);
        }
    }
}

function hideCurrentFont() {
    elements.currentFontSection?.classList.add('hidden');
    elements.detectedSection?.classList.remove('hidden');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Back button functionality
document.addEventListener('DOMContentLoaded', () => {
    elements.currentFontSection?.addEventListener('click', (e) => {
        if (e.target === elements.currentFontSection || 
            e.target.closest('.section-title')) {
            hideCurrentFont();
        }
    });
});

console.log('✅ popup.js loaded and ready');