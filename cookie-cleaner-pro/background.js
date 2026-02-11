// Background service worker for Cookie Cleaner Pro

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Cookie Cleaner Pro installed');
    
    // Initialize default storage
    chrome.storage.sync.get(['whitelist', 'stats', 'settings'], (data) => {
        if (!data.whitelist) {
            chrome.storage.sync.set({
                whitelist: ['google.com', 'github.com', 'youtube.com'],
                stats: { cleaned: 0 },
                settings: {
                    autoProtect: true,
                    notifications: true
                }
            });
        }
    });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SHOW_NOTIFICATION') {
        // Create notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Cookie Cleaner Pro',
            message: request.message,
            priority: 2
        });
    }
    sendResponse({ received: true });
});

// Auto-protect visited sites (if enabled)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
        const data = await chrome.storage.sync.get(['settings', 'whitelist']);
        
        if (data.settings?.autoProtect) {
            const domain = extractDomain(tab.url);
            const whitelist = data.whitelist || [];
            
            if (!whitelist.includes(domain)) {
                whitelist.push(domain);
                await chrome.storage.sync.set({ whitelist });
                console.log(`Auto-protected: ${domain}`);
            }
        }
    }
});

// Helper function to extract domain
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace(/^www\./, '');
    } catch {
        return '';
    }
}