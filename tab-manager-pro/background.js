// Background script for Tab Manager Pro
// Handles auto-suspend and other background tasks

// Auto-suspend inactive tabs after 30 minutes
const SUSPEND_TIMEOUT = 30 * 60 * 1000; // 30 minutes
let lastActiveTime = Date.now();

// Track tab activity
chrome.tabs.onActivated.addListener(() => {
    lastActiveTime = Date.now();
});

chrome.tabs.onUpdated.addListener(() => {
    lastActiveTime = Date.now();
});

// Check for inactive tabs periodically
setInterval(() => {
    const inactiveTime = Date.now() - lastActiveTime;
    
    if (inactiveTime > SUSPEND_TIMEOUT) {
        suspendInactiveTabs();
    }
}, 60000); // Check every minute

async function suspendInactiveTabs() {
    try {
        const tabs = await chrome.tabs.query({});
        const currentTab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
        
        for (const tab of tabs) {
            // Don't suspend current tab or pinned tabs
            if (tab.id !== currentTab.id && !tab.pinned) {
                // Use tab discarding API if available
                if (chrome.tabs.discard) {
                    chrome.tabs.discard(tab.id);
                }
            }
        }
    } catch (error) {
        console.error('Error suspending tabs:', error);
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'suspendInactive') {
        suspendInactiveTabs();
        sendResponse({ success: true });
    }
});