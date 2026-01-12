// URL Safety Preview - Background Service Worker
// Using Indigo Night Theme Colors

console.log('URL Safety Preview service worker starting...');

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed/updated');
    
    // Set default settings with theme colors
    chrome.storage.local.set({
        autoCheck: true,
        checkShortened: true,
        warnHttp: true,
        saveHistory: true,
        clearOnExit: false,
        telemetry: false,
        blockedUrls: [],
        history: [],
        theme: 'indigo-night'
    });
    
    // Create notification
    createNotification({
        title: 'URL Safety Preview Installed',
        message: 'Your browsing is now protected! Click the shield icon to start.',
        type: 'success'
    });
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);
    
    switch (request.action) {
        case 'analyzeUrlInPopup':
            handleAnalyzeUrl(request.url, sendResponse);
            return true; // Keep channel open
            
        case 'checkBlocked':
            handleCheckBlocked(request.url, sendResponse);
            return true;
            
        case 'logEvent':
            handleLogEvent(request.event, request.data);
            break;
            
        case 'getSettings':
            chrome.storage.local.get(null, sendResponse);
            return true;
    }
});

// Handle URL analysis request
async function handleAnalyzeUrl(url, sendResponse) {
    try {
        const analysis = await performSafetyAnalysis(url);
        sendResponse({ success: true, data: analysis });
    } catch (error) {
        console.error('Analysis error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Check if URL is blocked
function handleCheckBlocked(url, sendResponse) {
    chrome.storage.local.get(['blockedUrls'], (data) => {
        const blockedUrls = data.blockedUrls || [];
        const isBlocked = blockedUrls.some(blockedUrl => 
            url.toLowerCase().includes(blockedUrl.toLowerCase())
        );
        sendResponse({ blocked: isBlocked });
    });
}

// Log events (for telemetry if enabled)
function handleLogEvent(event, data) {
    chrome.storage.local.get(['telemetry'], (settings) => {
        if (settings.telemetry) {
            // In production, send to analytics service
            console.log('Event logged:', event, data);
        }
    });
}

// Perform safety analysis
async function performSafetyAnalysis(url) {
    // This is where you would integrate with real APIs:
    // 1. Google Safe Browsing API
    // 2. VirusTotal API
    // 3. URLScan.io API
    // 4. PhishTank API
    
    // For demo, simulate API calls
    const results = await Promise.allSettled([
        simulateGoogleSafeBrowsing(url),
        simulateVirusTotal(url),
        simulateDomainReputation(url)
    ]);
    
    // Calculate composite score
    const score = calculateCompositeScore(results);
    
    return {
        url,
        score,
        status: getSafetyStatus(score),
        analysisTime: new Date().toISOString(),
        details: {
            safeBrowsing: results[0].status === 'fulfilled' ? results[0].value : 'Unknown',
            malwareScan: results[1].status === 'fulfilled' ? results[1].value : 'Unknown',
            reputation: results[2].status === 'fulfilled' ? results[2].value : 'Unknown'
        }
    };
}

// Simulated API calls
async function simulateGoogleSafeBrowsing(url) {
    await delay(300);
    const threats = ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'];
    const randomThreat = Math.random() > 0.85 ? threats[Math.floor(Math.random() * threats.length)] : 'NONE';
    return { threat: randomThreat, lastUpdated: new Date().toISOString() };
}

async function simulateVirusTotal(url) {
    await delay(400);
    const positives = Math.floor(Math.random() * 3);
    const total = 65;
    return { positives, total, scanDate: new Date().toISOString() };
}

async function simulateDomainReputation(url) {
    await delay(200);
    const domain = new URL(url).hostname;
    const reputationScore = Math.floor(Math.random() * 100);
    const age = Math.floor(Math.random() * 3650); // Up to 10 years
    return { domain, reputationScore, ageInDays: age };
}

// Calculate composite safety score
function calculateCompositeScore(results) {
    let score = 100;
    
    results.forEach(result => {
        if (result.status === 'fulfilled') {
            const value = result.value;
            
            if (value.threat && value.threat !== 'NONE') {
                score -= 40;
            }
            
            if (value.positives && value.positives > 0) {
                score -= (value.positives / value.total) * 30;
            }
            
            if (value.reputationScore) {
                score = (score + value.reputationScore) / 2;
            }
        } else {
            score -= 5; // Penalize for failed API calls
        }
    });
    
    // Ensure score is within bounds
    return Math.max(0, Math.min(100, Math.round(score)));
}

// Helper functions
function getSafetyStatus(score) {
    if (score >= 80) return { level: 'SAFE', color: '#10B981' };
    if (score >= 60) return { level: 'CAUTION', color: '#F59E0B' };
    return { level: 'DANGEROUS', color: '#EF4444' };
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createNotification({ title, message, type = 'info' }) {
    const iconMap = {
        success: 'icons/icon128.png',
        warning: 'icons/icon128.png',
        danger: 'icons/icon128.png',
        info: 'icons/icon128.png'
    };
    
    chrome.notifications.create({
        type: 'basic',
        iconUrl: iconMap[type],
        title: title,
        message: message,
        priority: 1
    });
}

// Intercept navigation to blocked URLs
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    if (details.frameId === 0) { // Main frame only
        chrome.storage.local.get(['blockedUrls'], (data) => {
            const blockedUrls = data.blockedUrls || [];
            const currentUrl = details.url.toLowerCase();
            
            const isBlocked = blockedUrls.some(blockedUrl => {
                try {
                    const blocked = new URL(blockedUrl);
                    const current = new URL(currentUrl);
                    
                    // Check exact match or domain match
                    return currentUrl === blockedUrl.toLowerCase() || 
                           current.hostname === blocked.hostname;
                } catch {
                    // Fallback to string inclusion
                    return currentUrl.includes(blockedUrl.toLowerCase());
                }
            });
            
            if (isBlocked) {
                // Cancel navigation and redirect to blocked page
                chrome.tabs.update(details.tabId, {
                    url: chrome.runtime.getURL(`blocked.html?url=${encodeURIComponent(details.url)}`)
                });
                
                // Log the block
                chrome.storage.local.get(['history'], (storage) => {
                    const history = storage.history || [];
                    history.push({
                        type: 'BLOCKED',
                        url: details.url,
                        timestamp: new Date().toISOString(),
                        reason: 'User blocked URL'
                    });
                    chrome.storage.local.set({ history: history.slice(-100) });
                });
            }
        });
    }
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
    console.log('Extension started on browser startup');
});

// Cleanup on uninstall
chrome.runtime.setUninstallURL('https://forms.gle/your-uninstall-survey-link');