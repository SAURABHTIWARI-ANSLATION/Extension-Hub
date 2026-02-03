// Background service worker for Just Read extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Just Read extension installed');
    
    // Set default settings
    chrome.storage.sync.set({
        darkMode: false,
        serifFont: false,
        fontSize: 'medium',
        lineHeight: '1.6',
        autoDarkMode: false,
        removeImages: false,
        removeAds: true,
        removeSidebars: true,
        keepLinks: true,
        autoEnable: false,
        themeColor: '#4285f4',
        contentSelectors: 'article, .post-content, .story, #main-content',
        excludeDomains: ''
    });
});

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle-reading-mode') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleReadingMode' });
            }
        });
    }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSettings') {
        chrome.storage.sync.get([
            'darkMode', 'serifFont', 'fontSize', 'lineHeight', 'autoDarkMode',
            'removeImages', 'removeAds', 'removeSidebars', 'keepLinks',
            'themeColor', 'contentSelectors'
        ], (result) => {
            sendResponse(result);
        });
        return true; // Will respond asynchronously
    }
});

// Update extension icon based on active state
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.storage.local.get(['activeTabs'], (result) => {
        const activeTabs = result.activeTabs || {};
        const isActive = activeTabs[activeInfo.tabId];
        
        updateIcon(isActive);
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        chrome.storage.local.get(['activeTabs'], (result) => {
            const activeTabs = result.activeTabs || {};
            const isActive = activeTabs[tabId];
            
            updateIcon(isActive);
        });
    }
});

function updateIcon(isActive) {
    const iconPath = isActive 
        ? { path: 'icons/icon-active.png' }
        : { path: {
                16: 'icons/icon16.png',
                48: 'icons/icon48.png',
                128: 'icons/icon128.png'
            }
        };
    
    chrome.action.setIcon(iconPath);
}