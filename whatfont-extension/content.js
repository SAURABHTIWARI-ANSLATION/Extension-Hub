console.log('🚀 WhatFont content script loaded - v3.0');

let isActive = false;
let detectionMode = 'hover';
let currentElement = null;
let fontPanel = null;
let isInitialized = false;

// Initialize content script
function initializeContentScript() {
    if (isInitialized) return;
    
    console.log('⚙️ Initializing WhatFont content script');
    
    // Inject styles for font detection
    const style = document.createElement('style');
    style.textContent = `
        .whatfont-highlight {
            position: relative;
        }
        
        .whatfont-highlight::after {
            content: '';
            position: absolute;
            top: -4px;
            left: -4px;
            right: -4px;
            bottom: -4px;
            border: 2px solid #8B5CF6;
            border-radius: 4px;
            pointer-events: none;
            z-index: 2147483646;
            background: rgba(139, 92, 246, 0.1);
        }
        
        #whatfont-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #6D28D9 0%, #A78BFA 100%);
            color: white;
            padding: 16px;
            border-radius: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            z-index: 2147483647;
            box-shadow: 0 10px 40px rgba(109, 40, 217, 0.3);
            border: 2px solid rgba(199, 183, 253, 0.5);
            max-width: 300px;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            display: none;
        }
    `;
    document.head.appendChild(style);
    
    isInitialized = true;
    console.log('✅ Content script initialized');
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Content script received:', request.action);
    
    // Initialize if not already
    if (!isInitialized) {
        initializeContentScript();
    }
    
    // Always send an immediate response
    switch (request.action) {
        case 'activateFontDetection':
            isActive = true;
            detectionMode = request.mode || 'hover';
            activateDetection();
            sendResponse({success: true, mode: detectionMode});
            break;
            
        case 'deactivateFontDetection':
            isActive = false;
            deactivateDetection();
            sendResponse({success: true});
            break;
            
        case 'changeDetectionMode':
            detectionMode = request.mode;
            updateDetectionMode();
            sendResponse({success: true, mode: detectionMode});
            break;
            
        case 'ping':
            sendResponse({status: 'alive', initialized: isInitialized});
            break;
            
        case 'getState':
            sendResponse({isActive, detectionMode, initialized: isInitialized});
            break;
            
        default:
            sendResponse({success: false, error: 'Unknown action'});
    }
    
    return false;
});

// Activate font detection
function activateDetection() {
    console.log('🎯 Activating font detection with mode:', detectionMode);
    
    // Create font panel if it doesn't exist
    if (!fontPanel) {
        createFontPanel();
    }
    
    // Remove existing event listeners first
    deactivateDetection(true);
    
    // Add event listeners based on mode
    switch (detectionMode) {
        case 'hover':
            document.addEventListener('mouseover', handleMouseOver, {capture: true});
            document.addEventListener('mouseout', handleMouseOut, {capture: true});
            console.log('✅ Hover mode activated');
            break;
            
        case 'click':
            document.addEventListener('click', handleClick, {capture: true});
            console.log('✅ Click mode activated');
            break;
            
        case 'scan':
            console.log('🔍 Starting scan mode...');
            setTimeout(scanAllFonts, 100);
            break;
    }
    
    // Change cursor
    document.body.style.cursor = 'crosshair';
    console.log('✅ Font detection activated');
}

// Deactivate font detection
function deactivateDetection(skipLog = false) {
    if (!skipLog) {
        console.log('⏹️ Deactivating font detection');
    }
    
    // Remove event listeners
    document.removeEventListener('mouseover', handleMouseOver, {capture: true});
    document.removeEventListener('mouseout', handleMouseOut, {capture: true});
    document.removeEventListener('click', handleClick, {capture: true});
    
    // Remove font panel
    if (fontPanel) {
        fontPanel.style.display = 'none';
    }
    
    // Reset cursor
    document.body.style.cursor = 'auto';
    
    // Remove highlights
    removeHighlights();
}

// Update detection mode
function updateDetectionMode() {
    if (!isActive) return;
    
    console.log('🔄 Updating detection mode to:', detectionMode);
    
    // Remove existing listeners
    document.removeEventListener('mouseover', handleMouseOver, {capture: true});
    document.removeEventListener('mouseout', handleMouseOut, {capture: true});
    document.removeEventListener('click', handleClick, {capture: true});
    
    // Add new listeners based on mode
    switch (detectionMode) {
        case 'hover':
            document.addEventListener('mouseover', handleMouseOver, {capture: true});
            document.addEventListener('mouseout', handleMouseOut, {capture: true});
            break;
            
        case 'click':
            document.addEventListener('click', handleClick, {capture: true});
            break;
            
        case 'scan':
            scanAllFonts();
            break;
    }
}

// Create font display panel
function createFontPanel() {
    if (fontPanel) return;
    
    fontPanel = document.createElement('div');
    fontPanel.id = 'whatfont-panel';
    
    document.body.appendChild(fontPanel);
    console.log('📦 Font panel created');
}

// Show font panel with info
function showFontPanel(element, fontInfo) {
    if (!fontPanel) {
        createFontPanel();
    }
    
    const rect = element.getBoundingClientRect();
    const panelWidth = 300;
    const panelHeight = 180;
    
    // Position panel near element
    let top = rect.top + window.scrollY - panelHeight - 10;
    let left = rect.left + window.scrollX;
    
    // Adjust if panel goes off screen
    if (top < 20) top = rect.bottom + window.scrollY + 10;
    if (left + panelWidth > window.innerWidth) left = window.innerWidth - panelWidth - 20;
    
    fontPanel.style.top = top + 'px';
    fontPanel.style.left = left + 'px';
    
    // Update panel content
    fontPanel.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
            <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 8px; 
                 display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 20px;">🔤</span>
            </div>
            <div>
                <div style="font-weight: bold; font-size: 16px;">${fontInfo.family}</div>
                <div style="font-size: 12px; opacity: 0.9;">WhatFont detected</div>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
            <div>
                <div style="font-size: 11px; opacity: 0.7;">Size</div>
                <div style="font-weight: 500;">${fontInfo.size}</div>
            </div>
            <div>
                <div style="font-size: 11px; opacity: 0.7;">Weight</div>
                <div style="font-weight: 500;">${fontInfo.weight}</div>
            </div>
            <div>
                <div style="font-size: 11px; opacity: 0.7;">Style</div>
                <div style="font-weight: 500;">${fontInfo.style}</div>
            </div>
            <div>
                <div style="font-size: 11px; opacity: 0.7;">Color</div>
                <div style="font-weight: 500; display: flex; align-items: center; gap: 4px;">
                    <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; 
                          background: ${fontInfo.color}; border: 1px solid white;"></span>
                    ${fontInfo.color}
                </div>
            </div>
        </div>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.2); 
             font-size: 12px; opacity: 0.8;">
            ${detectionMode === 'hover' ? 'Hover' : 'Click'} on text to detect fonts
        </div>
    `;
    
    fontPanel.style.display = 'block';
    
    // Highlight element if enabled
    const highlightEnabled = false; // You can enable this from settings
    if (highlightEnabled) {
        highlightElement(element);
    }
    
    // Send to popup - CRITICAL FOR POPUP TO RECEIVE
    console.log('📤 Sending font to popup:', fontInfo.family, fontInfo.size);
    try {
        chrome.runtime.sendMessage({
            action: 'fontDetected',
            fontInfo: fontInfo
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.log('⚠️ Popup not open or error:', chrome.runtime.lastError.message);
            } else {
                console.log('✅ Font sent to popup successfully:', response);
            }
        });
    } catch (error) {
        console.log('❌ Could not send font info:', error);
    }
}

// Hide font panel
function hideFontPanel() {
    if (fontPanel) {
        fontPanel.style.display = 'none';
    }
    removeHighlights();
}

// Handle mouse over
function handleMouseOver(event) {
    if (!isActive || detectionMode !== 'hover') return;
    
    const element = event.target;
    if (element === currentElement || !element.textContent?.trim()) return;
    
    // Skip non-text elements
    if (['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT'].includes(element.tagName)) return;
    
    currentElement = element;
    const fontInfo = getFontInfo(element);
    showFontPanel(element, fontInfo);
}

// Handle mouse out
function handleMouseOut(event) {
    if (!isActive || detectionMode !== 'hover') return;
    
    if (currentElement && !currentElement.contains(event.relatedTarget)) {
        currentElement = null;
        hideFontPanel();
    }
}

// Handle click
function handleClick(event) {
    if (!isActive || detectionMode !== 'click') return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const element = event.target;
    
    // Skip non-text elements
    if (!element.textContent?.trim()) return;
    if (['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT'].includes(element.tagName)) return;
    
    const fontInfo = getFontInfo(element);
    showFontPanel(element, fontInfo);
    
    // Hide after 3 seconds
    setTimeout(() => {
        hideFontPanel();
    }, 3000);
}

// Get font information from element
function getFontInfo(element) {
    const computedStyle = window.getComputedStyle(element);
    
    return {
        family: computedStyle.fontFamily.split(',')[0].replace(/["']/g, '').trim(),
        size: computedStyle.fontSize,
        weight: computedStyle.fontWeight,
        style: computedStyle.fontStyle,
        lineHeight: computedStyle.lineHeight,
        color: computedStyle.color,
        text: element.textContent?.substring(0, 50) + (element.textContent?.length > 50 ? '...' : ''),
        element: {
            tag: element.tagName.toLowerCase(),
            className: element.className,
            id: element.id
        }
    };
}

// Highlight element
function highlightElement(element) {
    element.style.outline = '2px solid #8B5CF6';
    element.style.outlineOffset = '2px';
    element.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
}

// Remove highlights
function removeHighlights() {
    const highlighted = document.querySelectorAll('[style*="outline: 2px solid #8B5CF6"]');
    highlighted.forEach(el => {
        el.style.outline = '';
        el.style.outlineOffset = '';
        el.style.backgroundColor = '';
    });
}

// Scan all fonts on page
function scanAllFonts() {
    if (!isActive || detectionMode !== 'scan') return;
    
    console.log('🔍 Starting font scan...');
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, li, td, th, button, input, textarea, label');
    const fonts = new Set();
    const uniqueFonts = [];
    let processedCount = 0;
    
    textElements.forEach(element => {
        if (element.textContent?.trim() && element.offsetWidth > 0 && element.offsetHeight > 0) {
            // Skip hidden or tiny elements
            if (element.offsetWidth < 10 || element.offsetHeight < 10) return;
            
            const fontInfo = getFontInfo(element);
            const fontKey = `${fontInfo.family}|${fontInfo.size}|${fontInfo.weight}|${fontInfo.style}`;
            
            if (!fonts.has(fontKey)) {
                fonts.add(fontKey);
                uniqueFonts.push(fontInfo);
                processedCount++;
                
                console.log(`📝 Found font #${processedCount}:`, fontInfo.family, fontInfo.size, fontInfo.weight);
                
                // Send each unique font to popup
                try {
                    chrome.runtime.sendMessage({
                        action: 'fontDetected',
                        fontInfo: fontInfo
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            // Popup might be closed, that's okay
                        }
                    });
                } catch (error) {
                    console.log('⚠️ Could not send font during scan');
                }
            }
        }
    });
    
    console.log(`✅ Scan complete: Found ${fonts.size} unique fonts`);
    
    // Show summary panel
    if (fontPanel) {
        fontPanel.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 12px;">🔍</div>
                <div style="font-weight: bold; font-size: 18px; margin-bottom: 8px;">
                    Scan Complete!
                </div>
                <div style="font-size: 32px; font-weight: bold; margin: 12px 0; color: #FFD700;">
                    ${fonts.size}
                </div>
                <div style="font-size: 14px; margin-bottom: 12px;">
                    unique fonts detected
                </div>
                <div style="font-size: 12px; opacity: 0.8; padding-top: 12px; 
                     border-top: 1px solid rgba(255,255,255,0.2);">
                    Check the extension popup for full list
                </div>
            </div>
        `;
        fontPanel.style.display = 'block';
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            hideFontPanel();
        }, 4000);
    }
}

// Initialize when script loads
initializeContentScript();
console.log('✅ WhatFont content script ready');