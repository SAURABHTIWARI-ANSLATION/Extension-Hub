 console.log('JSON/XML Formatter service worker starting...');

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed/updated');
    
    // Set default settings
    chrome.storage.local.set({
        autoFormat: false,
        autoFormatPages: true,
        highlightPages: true,
        formatOnHover: true,
        defaultFormat: 'auto',
        indentSize: '4',
        sortKeys: true,
        syntaxHighlight: true,
        lineNumbers: true,
        theme: 'ocean-blue',
        recentFormats: []
    });
    
    // Create notification
    createNotification({
        title: 'JSON/XML Formatter Installed',
        message: 'Format JSON and XML responses instantly!',
        type: 'info'
    });
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);
    
    switch (request.action) {
        case 'formatInPopup':
            handleFormatInPopup(request.content, request.type, sendResponse);
            return true;
            
        case 'logFormat':
            handleLogFormat(request.data);
            break;

        case 'detectedApiResponse':
        handleDetectedApiResponse(request);
            break;    
            
        case 'getRecentFormats':
            handleGetRecentFormats(sendResponse);
            return true;
            
        case 'clearRecentFormats':
            handleClearRecentFormats(sendResponse);
            return true;
            
        case 'updateRules':
            handleUpdateRules(request.rules, sendResponse);
            return true;
    }
});

// Handle detected API response for auto-formatting
function handleDetectedApiResponse(data) {
    console.log('API Response detected:', {
        url: data.url,
        type: data.isJson ? 'JSON' : 'XML',
        length: data.responseText?.length || 0
    });
    
    // Store in recent formats
    chrome.storage.local.get(['autoFormat'], (result) => {
        if (result.autoFormat) {
            // Auto-format if enabled
            chrome.storage.local.get(['recentFormats'], (storage) => {
                const recent = storage.recentFormats || [];
                recent.unshift({
                    url: data.url,
                    type: data.isJson ? 'json' : 'xml',
                    content: data.responseText,
                    timestamp: new Date().toISOString(),
                    autoDetected: true
                });
                
                if (recent.length > 50) recent.splice(50);
                chrome.storage.local.set({ recentFormats: recent });
            });
        }
    });
}

// Handle format request from content script
function handleFormatInPopup(content, type, sendResponse) {
    try {
        // Get extension URL
        const popupUrl = chrome.runtime.getURL('popup.html');
        
        // Create data URL or store in temporary storage
        const data = { content, type, timestamp: Date.now() };
        const key = `temp_${Date.now()}`;
        
        chrome.storage.local.set({ [key]: data }, () => {
            // Open popup window
            chrome.windows.create({
                url: `${popupUrl}?data=${key}`,
                type: 'popup',
                width: 500,
                height: 700,
                focused: true
            }, (window) => {
                sendResponse({ success: true, windowId: window.id });
            });
        });
        
    } catch (error) {
        console.error('Error handling format request:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Log format activity
function handleLogFormat(data) {
    chrome.storage.local.get(['recentFormats'], (result) => {
        const recent = result.recentFormats || [];
        recent.unshift({
            ...data,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50
        if (recent.length > 50) {
            recent.splice(50);
        }
        
        chrome.storage.local.set({ recentFormats: recent });
    });
}

// Get recent formats
function handleGetRecentFormats(sendResponse) {
    chrome.storage.local.get(['recentFormats'], (result) => {
        sendResponse({ recentFormats: result.recentFormats || [] });
    });
}

// Clear recent formats
function handleClearRecentFormats(sendResponse) {
    chrome.storage.local.set({ recentFormats: [] }, () => {
        sendResponse({ success: true });
    });
}

// Handle declarativeNetRequest rules (Manifest V3 alternative)
function handleUpdateRules(rules, sendResponse) {
    if (chrome.declarativeNetRequest) {
        chrome.declarativeNetRequest.updateDynamicRules({
            addRules: rules,
            removeRuleIds: rules.map(r => r.id)
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error updating rules:', chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ success: true });
            }
        });
    } else {
        sendResponse({ success: false, error: 'declarativeNetRequest API not available' });
    }
}

// Setup default rules on install
chrome.runtime.onInstalled.addListener(() => {
    // Setup basic rules for content-type detection
    if (chrome.declarativeNetRequest) {
        chrome.declarativeNetRequest.updateDynamicRules({
            addRules: [{
                id: 1,
                priority: 1,
                action: {
                    type: 'modifyHeaders',
                    responseHeaders: [
                        {
                            header: 'x-extension-detected',
                            operation: 'set',
                            value: 'json-xml-formatter'
                        }
                    ]
                },
                condition: {
                    urlFilter: '*',
                    resourceTypes: ['xmlhttprequest', 'fetch']
                }
            }],
            removeRuleIds: [1]
        });
    }
});

// Helper Functions
function createNotification({ title, message, type = 'info' }) {
    const iconMap = {
        success: 'icons/icon128.png',
        warning: 'icons/icon128.png',
        error: 'icons/icon128.png',
        info: 'icons/icon128.png'
    };
    
    chrome.notifications.create({
        type: 'basic',
        iconUrl: iconMap[type],
        title: title,
        message: message,
        priority: 1
    }).catch(error => {
        console.log('Notification not created (might not have permission):', error);
    });
}

// Keep service worker alive - Periodic wakeup for Manifest V3
chrome.alarms.create('keepAlive', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'keepAlive') {
        console.log('Service worker keep-alive check');
    }
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
    if (changes.theme) {
        // Broadcast theme change to all tabs
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'themeChanged',
                    theme: changes.theme.newValue
                }).catch(() => {
                    // Tab might not have content script
                });
            });
        });
    }
});

// Handle context menu (alternative for auto-detection)
chrome.contextMenus.create({
    id: 'formatJsonXml',
    title: 'Format JSON/XML',
    contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'formatJsonXml' && info.selectionText) {
        chrome.tabs.sendMessage(tab.id, {
            action: 'formatSelectedText',
            text: info.selectionText
        });
    }
});