// Background service worker for Broken Link Finder

// Store for bulk scan data
let scanCache = new Map();

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Broken Link Finder installed');
    
    // Set default settings
    chrome.storage.sync.get(['settings'], (data) => {
        if (!data.settings) {
            chrome.storage.sync.set({
                settings: {
                    autoHighlight: true,
                    showNotifications: true,
                    checkExternalLinks: false,
                    bulkScanMode: false,
                    timeout: 10000
                }
            });
        }
    });
    
    // Create context menu items
    chrome.contextMenus.create({
        id: 'scanPage',
        title: 'Scan this page for broken links',
        contexts: ['page']
    });
    
    chrome.contextMenus.create({
        id: 'scanLink',
        title: 'Check this link',
        contexts: ['link']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    // 👉 FIX: Ensure we always have a valid tab
    let targetTab = tab;

    if (!targetTab || typeof targetTab.id !== 'number') {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        targetTab = activeTab;
    }

    if (!targetTab || typeof targetTab.id !== 'number') {
        console.error('No valid tab found for scanning');
        return;
    }

    if (info.menuItemId === 'scanPage') {
        chrome.tabs.sendMessage(targetTab.id, { action: 'findAllLinks' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Failed to send message:', chrome.runtime.lastError);
            }
        });
    } 
    else if (info.menuItemId === 'scanLink') {
        checkSingleLink(info.linkUrl).then(result => {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'Link Check Result',
                message: `${info.linkUrl}\nStatus: ${result.ok ? '✅ Working' : '❌ Broken'}`
            });
        });
    }
});

// Add site-specific cache
let siteCache = new Map();

// Add function to clear cache for specific site
function clearSiteCache(url) {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        
        // Clear all entries from this domain
        for (const [key] of scanCache.entries()) {
            try {
                const cachedUrlObj = new URL(key);
                if (cachedUrlObj.hostname === domain) {
                    scanCache.delete(key);
                }
            } catch (e) {
                // Invalid URL in cache, remove it
                scanCache.delete(key);
            }
        }
        
        console.log(`Cleared cache for domain: ${domain}`);
    } catch (error) {
        console.error('Error clearing site cache:', error);
    }
}


// Modify the message listener to clear cache
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CHECK_LINK') {
        // Check link status with proper CORS handling
        checkLinkStatus(request.url)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({
                ok: false,
                status: 0,
                error: error.message,
                statusText: 'Check Failed'
            }));
        return true;
    }
    
    if (request.type === 'SHOW_NOTIFICATION') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: request.title || 'Broken Link Finder',
            message: request.message,
            priority: 2
        });
        sendResponse({ success: true });
    }
    
    if (request.type === 'BULK_SCAN') {
        handleBulkScan(request.url, request.depth)
            .then(results => sendResponse(results))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }
    
    if (request.type === 'PAGE_LOAD_SCAN') {
        console.log('Auto-scan triggered for:', request.url);
        sendResponse({ received: true });
    }
    
    // NEW: Clear cache for specific site
    if (request.type === 'CLEAR_SITE_CACHE') {
        clearSiteCache(request.url);
        sendResponse({ success: true });
        return true;
    }
});


// Check a single link status - FIXED VERSION
async function checkLinkStatus(url) {
    try {
        // Skip certain URL schemes
        if (url.startsWith('mailto:') || url.startsWith('tel:') || 
            url.startsWith('javascript:') || url.startsWith('#') || url === '') {
            return { ok: true, status: 'skipped', statusText: 'Skipped', url: url };
        }
        
        // Check cache first
        const cacheKey = url;
        const cached = scanCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < 300000)) { // 5 minute cache
            return cached.result;
        }
        
        // Make request with timeout - FIXED: Try HEAD first, then GET
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        try {
            // Try HEAD request first (faster)
            const headResponse = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Broken Link Finder Extension)'
                }
            });
            
            clearTimeout(timeout);
            
            const result = {
                ok: headResponse.ok,
                status: headResponse.status,
                statusText: headResponse.statusText,
                url: url
            };
            
            // Cache the result
            scanCache.set(cacheKey, {
                result: result,
                timestamp: Date.now()
            });
            
            // Limit cache size
            if (scanCache.size > 1000) {
                const oldestKey = Array.from(scanCache.keys())[0];
                scanCache.delete(oldestKey);
            }
            
            return result;
            
        } catch (headError) {
            // If HEAD fails, try GET (some servers block HEAD)
            clearTimeout(timeout);
            const getController = new AbortController();
            const getTimeout = setTimeout(() => getController.abort(), 10000);
            
            try {
                const getResponse = await fetch(url, {
                    method: 'GET',
                    signal: getController.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Broken Link Finder Extension)'
                    }
                });
                
                clearTimeout(getTimeout);
                
                const result = {
                    ok: getResponse.ok,
                    status: getResponse.status,
                    statusText: getResponse.statusText,
                    url: url
                };
                
                // Cache the result
                scanCache.set(cacheKey, {
                    result: result,
                    timestamp: Date.now()
                });
                
                return result;
                
            } catch (getError) {
                clearTimeout(getTimeout);
                throw getError;
            }
        }
        
    } catch (error) {
        console.log(`Failed to check ${url}:`, error.message);
        
        // Provide more specific error messages
        let statusText = 'Network Error';
        let status = 0;
        
        if (error.name === 'AbortError') {
            statusText = 'Timeout (>10s)';
        } else if (error.message.includes('Failed to fetch')) {
            statusText = 'Connection Failed';
        } else if (error.message.includes('CORS')) {
            statusText = 'CORS Error';
        }
        
        return {
            ok: false,
            status: status,
            error: error.message,
            statusText: statusText,
            url: url
        };
    }
}

// Check single link (for context menu)
async function checkSingleLink(url) {
    return await checkLinkStatus(url);
}

// Handle bulk website scan
async function handleBulkScan(baseUrl, maxDepth = 2) {
    const visited = new Set();
    const results = [];
    
    async function crawl(url, depth) {
        if (depth > maxDepth || visited.has(url)) return;
        
        visited.add(url);
        
        try {
            // Fetch the page
            const response = await fetch(url);
            const html = await response.text();
            
            // Parse links (simplified - in real app use proper parser)
            const links = extractLinks(html, baseUrl);
            
            // Check each link
            for (const link of links) {
                const result = await checkLinkStatus(link);
                results.push({
                    url: link,
                    status: result.status,
                    ok: result.ok,
                    sourcePage: url
                });
                
                // Recursively crawl internal links
                if (result.ok && isInternalLink(link, baseUrl) && depth < maxDepth) {
                    await crawl(link, depth + 1);
                }
            }
            
        } catch (error) {
            console.error(`Failed to crawl ${url}:`, error);
        }
    }
    
    await crawl(baseUrl, 0);
    return results;
}

// Helper functions
function extractLinks(html, baseUrl) {
    const links = [];
    const regex = /href=["']([^"']+)["']/gi;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
        let url = match[1];
        
        // Convert relative URLs to absolute
        try {
            if (url.startsWith('/')) {
                url = new URL(url, baseUrl).href;
            } else if (!url.startsWith('http')) {
                url = new URL(url, baseUrl).href;
            }
            links.push(url);
        } catch (e) {
            // Invalid URL, skip
        }
    }
    
    return [...new Set(links)]; // Remove duplicates
}

function isInternalLink(url, baseUrl) {
    try {
        const urlObj = new URL(url);
        const baseObj = new URL(baseUrl);
        return urlObj.hostname === baseObj.hostname;
    } catch {
        return false;
    }
}

// Clean up old cache entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of scanCache.entries()) {
        if (now - value.timestamp > 300000) { // 5 minutes
            scanCache.delete(key);
        }
    }
}, 60000); // Run every minute