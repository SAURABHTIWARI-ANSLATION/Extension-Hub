// Prompt Optimizer Background Service Worker

console.log('Prompt Optimizer service worker loading...');

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
    console.log('Prompt Optimizer extension installed');
    
    // Initialize storage with default values
    chrome.storage.local.set({
        promptSettings: {
            addContext: true,
            improveTone: true,
            addExamples: false,
            specifyFormat: true
        },
        optimizationHistory: [],
        stats: {
            promptsOptimized: 0,
            timeSaved: 0
        }
    });
    
    // Create context menu items
    try {
        chrome.contextMenus.create({
            id: 'optimize-selection',
            title: 'Optimize with Prompt Optimizer',
            contexts: ['selection']
        });
        
        console.log('Context menu created');
    } catch (error) {
        console.log('Context menu error:', error);
    }
});

// Handle context menu clicks
chrome.contextMenus?.onClicked?.addListener((info, tab) => {
    if (info.menuItemId === 'optimize-selection' && info.selectionText && tab?.id) {
        // Store the selected text
        chrome.storage.local.set({lastSelection: info.selectionText}, () => {
            // Open the popup
            chrome.action.openPopup();
        });
    }
});

// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received:', request.action);
    
    if (request.action === 'getStats') {
        chrome.storage.local.get(['stats'], (data) => {
            sendResponse(data.stats || {promptsOptimized: 0, timeSaved: 0});
        });
        return true;
    }
    
    if (request.action === 'incrementStats') {
        chrome.storage.local.get(['stats'], (data) => {
            const stats = data.stats || {promptsOptimized: 0, timeSaved: 0};
            stats.promptsOptimized += request.count || 1;
            stats.timeSaved += request.minutes || 3;
            chrome.storage.local.set({stats});
            sendResponse(stats);
        });
        return true;
    }
    
    sendResponse({received: true});
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
    if (command === '_execute_action') {
        console.log('Keyboard shortcut triggered');
    }
});

// Keep service worker alive
let keepAliveInterval = setInterval(() => {
    // Periodic activity to keep service worker alive
    console.log('Prompt Optimizer service worker active');
}, 30000);

// Clean up
chrome.runtime.onSuspend.addListener(() => {
    clearInterval(keepAliveInterval);
    console.log('Service worker suspending');
});