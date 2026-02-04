// Initialize when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    // Initialize storage with empty array if not exists
    chrome.storage.sync.get(['quickLinks'], (result) => {
        if (!result.quickLinks) {
            chrome.storage.sync.set({ quickLinks: [] });
        }
    });

    // Create context menu item
    chrome.contextMenus.create({
        id: "addToLinkManager",
        title: "Add to Link Manager",
        contexts: ["page", "link"]
    });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "addToLinkManager") {
        const url = info.linkUrl || info.pageUrl;
        const title = info.selectionText || tab.title;

        // Get category based on URL
        let category = 'general';
        if (url.includes('mail') || url.includes('calendar') || url.includes('docs')) {
            category = 'work';
        } else if (url.includes('facebook') || url.includes('twitter') || url.includes('instagram')) {
            category = 'social';
        } else if (url.includes('amazon') || url.includes('flipkart') || url.includes('shop')) {
            category = 'shopping';
        } else if (url.includes('youtube') || url.includes('netflix') || url.includes('spotify')) {
            category = 'entertainment';
        }

        // Get existing links
        chrome.storage.sync.get(['quickLinks'], (result) => {
            const links = result.quickLinks || [];
            
            // Check if link already exists
            const exists = links.some(link => link.url === url);
            if (!exists) {
                links.push({
                    title: title,
                    url: url,
                    category: category,
                    dateAdded: new Date().toISOString()
                });
                
                chrome.storage.sync.set({ quickLinks: links }, () => {
                    // Show notification
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon128.png',
                        title: 'Link Added',
                        message: `"${title.substring(0, 30)}..." added to Link Manager`
                    });
                });
            }
        });
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getLinks') {
        chrome.storage.sync.get(['quickLinks'], (result) => {
            sendResponse({ links: result.quickLinks || [] });
        });
        return true; // Will respond asynchronously
    }
});