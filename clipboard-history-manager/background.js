// Background Service Worker
let clipboardHistory = [];
let totalSaves = 0;
const MAX_ITEMS = 50;

// Initialize
chrome.runtime.onInstalled.addListener(() => {
    console.log('Clipboard History Manager installed');
    
    try {
        // Create context menu
        chrome.contextMenus.create({
            id: "saveToClipboard",
            title: "Save to Clipboard History",
            contexts: ["selection"]
        });
    } catch (error) {
        console.log('Context menu creation failed (might be duplicate):', error);
    }
    
    // Load existing data
    chrome.storage.local.get(['clipboardHistory', 'totalSaves'], (data) => {
        clipboardHistory = data.clipboardHistory || [];
        totalSaves = data.totalSaves || 0;
        console.log(`Loaded ${clipboardHistory.length} items from history`);
    });
});

// Listen for copy events from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request.action);
    
    if (request.action === 'saveClipboard') {
        saveToHistory(request.text, request.type);
        sendResponse({ success: true });
        return true; // Important for async response
    }
    
    if (request.action === 'copyItem') {
        updateUsageCount(request.text);
        sendResponse({ success: true });
        return true;
    }
    
    sendResponse({ success: false, error: 'Unknown action' });
    return true;
});

// Save text to history
function saveToHistory(text, type = 'text') {
    if (!text || text.trim() === '') {
        console.log('Empty text, not saving');
        return;
    }
    
    console.log(`Saving to history: ${text.substring(0, 50)}...`);
    
    // Check for duplicates (avoid saving same text within 5 minutes)
    const fiveMinutesAgo = Date.now() - 300000;
    const duplicate = clipboardHistory.find(item => 
        item.content === text && item.timestamp > fiveMinutesAgo
    );
    
    if (duplicate) {
        duplicate.timestamp = Date.now();
        duplicate.usageCount = (duplicate.usageCount || 0) + 1;
        console.log('Updated duplicate item');
    } else {
        // Create new item
        const newItem = {
            content: text,
            type: detectType(text),
            timestamp: Date.now(),
            usageCount: 1,
            pinned: false
        };
        
        // Add to beginning of array
        clipboardHistory.unshift(newItem);
        
        // Trim to max items
        if (clipboardHistory.length > MAX_ITEMS) {
            clipboardHistory = clipboardHistory.slice(0, MAX_ITEMS);
            console.log(`Trimmed to ${MAX_ITEMS} items`);
        }
        
        totalSaves++;
        console.log('Added new item, total saves:', totalSaves);
    }
    
    // Save to storage
    chrome.storage.local.set({
        clipboardHistory: clipboardHistory,
        totalSaves: totalSaves
    }, () => {
        console.log('Saved to storage successfully');
    });
    
    // Show notification if enabled
    chrome.storage.local.get(['clipboardSettings'], (data) => {
        if (data.clipboardSettings?.notifications !== false && chrome.notifications) {
            try {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'Clipboard Saved',
                    message: `Saved: ${text.substring(0, 30)}...`,
                    priority: 1
                });
            } catch (notifError) {
                console.log('Notification failed:', notifError);
            }
        }
    });
}

// Update usage count when item is copied
function updateUsageCount(text) {
    const item = clipboardHistory.find(item => item.content === text);
    if (item) {
        item.usageCount = (item.usageCount || 0) + 1;
        item.lastUsed = Date.now();
        
        chrome.storage.local.set({
            clipboardHistory: clipboardHistory
        }, () => {
            console.log(`Updated usage count for: ${text.substring(0, 30)}...`);
        });
    }
}

// Detect type of content
function detectType(text) {
    if (text.startsWith('http://') || text.startsWith('https://')) {
        return 'link';
    } else if (text.includes('function') || text.includes('const ') || 
               text.includes('let ') || text.includes('var ') ||
               text.includes('{') || text.includes('}') ||
               text.includes('=') || text.includes(';')) {
        return 'code';
    } else if (text.includes('data:image') || text.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return 'image';
    } else if (text.match(/^\d{10,}$/) || text.match(/[a-f0-9]{32}/i)) {
        return 'hash';
    }
    return 'text';
}

// Context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "saveToClipboard" && info.selectionText) {
        console.log('Context menu save:', info.selectionText.substring(0, 30));
        saveToHistory(info.selectionText);
    }
});

// Keyboard command
chrome.commands.onCommand.addListener((command) => {
    console.log('Command received:', command);
    
    if (command === "copy-to-history") {
        // Get selected text from active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                console.log('No active tab found');
                return;
            }
            
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: getSelectedText
            }, (results) => {
                if (chrome.runtime.lastError) {
                    console.log('Scripting error:', chrome.runtime.lastError);
                    return;
                }
                
                if (results && results[0] && results[0].result) {
                    saveToHistory(results[0].result);
                } else {
                    console.log('No text selected');
                }
            });
        });
    }
});

// Function to get selected text
function getSelectedText() {
    return window.getSelection().toString();
}

// Listen for system clipboard changes (requires additional permissions)
// Note: This API is experimental and might not work in all browsers
if (chrome.clipboard && chrome.clipboard.onClipboardDataChanged) {
    chrome.clipboard.onClipboardDataChanged.addListener(() => {
        console.log('Clipboard changed (system level)');
        // We can't read clipboard content directly due to security
    });
}

// Optional: Clear old items periodically
function cleanupOldItems() {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const initialLength = clipboardHistory.length;
    
    clipboardHistory = clipboardHistory.filter(item => 
        item.pinned || item.timestamp > oneWeekAgo
    );
    
    if (initialLength !== clipboardHistory.length) {
        console.log(`Cleaned up ${initialLength - clipboardHistory.length} old items`);
        chrome.storage.local.set({ clipboardHistory: clipboardHistory });
    }
}

// Run cleanup every hour
setInterval(cleanupOldItems, 60 * 60 * 1000);