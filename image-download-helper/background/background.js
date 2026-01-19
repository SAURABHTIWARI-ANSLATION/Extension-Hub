// Background service worker for Image Download Helper

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Image Download Helper installed');
    
    // Initialize default settings
    chrome.storage.sync.set({
        folderName: '',
        filenamePattern: '{index}_{name}',
        convertWebP: 'none',
        quality: 85,
        filters: {
            minWidth: 100,
            minHeight: 100,
            fileTypes: ['jpg', 'jpeg', 'png'],
            skipAds: true,
            skipIcons: true,
            skipBlurry: false
        },
        stats: {
            totalDownloads: 0,
            totalImages: 0,
            totalSizeMB: 0
        }
    });
    
    // Create context menu
    createContextMenus();
});

// Create context menus
function createContextMenus() {
    chrome.contextMenus.removeAll(() => {
        // Download this image
        chrome.contextMenus.create({
            id: 'download-this-image',
            title: 'Download this image',
            contexts: ['image'],
            icons: {
                16: 'assets/icons/icon16.png'
            }
        });
        
        // Download all images on page
        chrome.contextMenus.create({
            id: 'download-all-images',
            title: 'Download all images on this page',
            contexts: ['page', 'selection'],
            icons: {
                16: 'assets/icons/icon16.png'
            }
        });
        
        // Separator
        chrome.contextMenus.create({
            id: 'separator-1',
            type: 'separator',
            contexts: ['image', 'page']
        });
        
        // Open Image Download Helper
        chrome.contextMenus.create({
            id: 'open-helper',
            title: 'Open Image Download Helper',
            contexts: ['image', 'page'],
            icons: {
                16: 'assets/icons/icon16.png'
            }
        });
    });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'download-this-image') {
        // Download single image
        downloadSingleImage(info.srcUrl, tab.id);
    } else if (info.menuItemId === 'download-all-images') {
        // Trigger scan and download on current tab
        chrome.tabs.sendMessage(tab.id, { action: 'scanImages' }, (response) => {
            if (response && response.images) {
                // Send images to download
                chrome.tabs.sendMessage(tab.id, {
                    action: 'downloadImages',
                    images: response.images
                });
            }
        });
    } else if (info.menuItemId === 'open-helper') {
        // Open extension popup
        chrome.action.openPopup();
    }
});

// Download single image
async function downloadSingleImage(url, tabId) {
    try {
        // Generate filename
        const filename = extractFilenameFromUrl(url);
        const folderName = 'ImageDownloads/Single';
        
        // Download using chrome.downloads API
        await chrome.downloads.download({
            url: url,
            filename: `${folderName}/${filename}`,
            saveAs: false,
            conflictAction: 'uniquify'
        });
        
        // Update stats
        updateStats(1, 100); // Estimate 100KB per image
        
        // Show notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'assets/icons/icon48.png',
            title: 'Image Downloaded',
            message: `Downloaded ${filename}`,
            priority: 1
        });
        
    } catch (error) {
        console.error('Download failed:', error);
    }
}

// Extract filename from URL
function extractFilenameFromUrl(url) {
    try {
        const parsed = new URL(url);
        const pathParts = parsed.pathname.split('/');
        let filename = pathParts[pathParts.length - 1];
        
        // Add extension if missing
        if (!filename.includes('.')) {
            const ext = getExtensionFromContentType(url);
            filename = `${filename}.${ext}`;
        }
        
        return filename;
    } catch {
        return `image_${Date.now()}.jpg`;
    }
}

// Get extension from content type
function getExtensionFromContentType(url) {
    const extensions = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/svg+xml': 'svg'
    };
    
    // This would need actual fetch to get content-type
    // For now, guess from URL
    if (url.includes('.jpg') || url.includes('.jpeg')) return 'jpg';
    if (url.includes('.png')) return 'png';
    if (url.includes('.webp')) return 'webp';
    if (url.includes('.gif')) return 'gif';
    if (url.includes('.svg')) return 'svg';
    
    return 'jpg';
}

// Update download statistics
function updateStats(imageCount, sizeKB) {
    chrome.storage.sync.get(['stats'], (result) => {
        const stats = result.stats || {
            totalDownloads: 0,
            totalImages: 0,
            totalSizeMB: 0
        };
        
        stats.totalDownloads++;
        stats.totalImages += imageCount;
        stats.totalSizeMB += sizeKB / 1024;
        
        chrome.storage.sync.set({ stats: stats });
    });
}

// Handle download events
chrome.downloads.onChanged.addListener((delta) => {
    if (delta.state && delta.state.current === 'complete') {
        // Download completed successfully
        console.log('Download completed:', delta.id);
    }
});

// Listen for messages from popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getStats') {
        chrome.storage.sync.get(['stats'], (result) => {
            sendResponse(result.stats);
        });
        return true;
    }
    
    if (request.action === 'resetStats') {
        chrome.storage.sync.set({
            stats: {
                totalDownloads: 0,
                totalImages: 0,
                totalSizeMB: 0
            }
        });
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === 'openDownloadsFolder') {
        chrome.downloads.showDefaultFolder();
        sendResponse({ success: true });
        return true;
    }
});

// Handle alarms (for scheduled tasks)
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanupOldSettings') {
        // Cleanup old temporary files or cache
        cleanupTemporaryData();
    }
});

// Cleanup temporary data
function cleanupTemporaryData() {
    // Clear old cache or temporary storage
    chrome.storage.local.remove(['tempImages', 'downloadQueue'], () => {
        console.log('Temporary data cleaned up');
    });
}

// Create cleanup alarm (runs once a week)
chrome.alarms.create('cleanupOldSettings', {
    periodInMinutes: 10080 // 7 days
});