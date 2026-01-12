// Background service worker for JobShield extension

// Ensure service worker is properly registered
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    console.log('JobShield service worker loaded successfully');
} else {
    console.error('JobShield service worker failed to load - chrome API not available');
}

class JobShieldBackground {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Verify service worker is available before proceeding
        if (!this.isServiceWorkerAvailable()) {
            console.error('Service worker not available, cannot initialize');
            return;
        }
        
        this.setupListeners();
        this.initializeStorage();
    }
    
    isServiceWorkerAvailable() {
        try {
            return typeof chrome !== 'undefined' && 
                   chrome.runtime && 
                   chrome.runtime.id && 
                   chrome.storage && 
                   chrome.tabs && 
                   chrome.action;
        } catch (error) {
            console.error('Service worker availability check failed:', error);
            return false;
        }
    }

    setupListeners() {
        // Listen for extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.onInstall();
            } else if (details.reason === 'update') {
                this.onUpdate();
            }
        });

        // Listen for messages from content scripts or popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        // Monitor tab updates for job sites
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.onPageLoad(tabId, tab);
            }
        });
    }

    async initializeStorage() {
        try {
            // Verify service worker is available
            if (!chrome.runtime || !chrome.storage) {
                throw new Error('Service worker not properly initialized');
            }
            
            // Set default settings if they don't exist
            const defaults = {
                autoScan: true,
                showBadge: true,
                enableSound: true,
                sensitivityLevel: 'medium',
                scanHistory: [],
                firstRun: true,
                version: chrome.runtime.getManifest().version
            };

            const current = await chrome.storage.local.get(null);
            const updated = { ...defaults, ...current };
            
            // Only update if there are changes
            const needsUpdate = Object.keys(defaults).some(key => 
                JSON.stringify(current[key]) !== JSON.stringify(updated[key])
            );
            
            if (needsUpdate) {
                await chrome.storage.local.set(updated);
            }
        } catch (error) {
            console.error('Storage initialization error:', error);
            // Fallback: ensure basic storage structure exists
            try {
                await chrome.storage.local.set({
                    autoScan: true,
                    showBadge: true,
                    enableSound: true,
                    sensitivityLevel: 'medium',
                    scanHistory: [],
                    firstRun: true,
                    version: chrome.runtime.getManifest().version
                });
            } catch (fallbackError) {
                console.error('Failed to set fallback storage:', fallbackError);
            }
        }
    }

    onInstall() {
        console.log('JobShield extension installed');
        
        // Show welcome page
        chrome.tabs.create({
            url: chrome.runtime.getURL('welcome.html')
        });
        
        // Set installation timestamp
        chrome.storage.local.set({
            installedAt: new Date().toISOString(),
            firstRun: true
        });
    }

    onUpdate() {
        console.log('JobShield extension updated');
        
        // Update version in storage
        chrome.storage.local.set({
            version: chrome.runtime.getManifest().version,
            updatedAt: new Date().toISOString()
        });
    }

    onPageLoad(tabId, tab) {
        // Check if it's a job-related site
        if (this.isJobSite(tab.url)) {
            this.maybeTriggerAutoScan(tabId);
        }
    }

    isJobSite(url) {
        if (!url) return false;
        
        const jobSitePatterns = [
            /linkedin\.com\/jobs/,
            /indeed\.com/,
            /glassdoor\.com\/Job/,
            /monster\.com/,
            /careerbuilder\.com/,
            /ziprecruiter\.com/,
            /dice\.com/,
            /angel\.co\/jobs/,
            /remote\.co/,
            /flexjobs\.com/,
            /upwork\.com/,
            /fiverr\.com/,
            /simplyhired\.com/,
            /jobsite\.co\.uk/,
            /totaljobs\.com/,
            /reed\.co\.uk/,
            /seek\.com\.au/,
            /jobstreet\.com/,
            /naukri\.com/,
            /hire\.com/,
            /hired\.com/,
            /\bcareers?\b/,
            /\bjobs?\b/,
            /\bhiring\b/,
            /\bemployment\b/,
            /\bpositions?\b/
        ];
        
        return jobSitePatterns.some(pattern => pattern.test(url.toLowerCase()));
    }

    async maybeTriggerAutoScan(tabId) {
        const settings = await chrome.storage.local.get(['autoScan']);
        
        if (settings.autoScan !== false) {
            // Wait for page to fully load
            setTimeout(async () => {
                try {
                    await chrome.tabs.sendMessage(tabId, {
                        action: 'analyzePage',
                        auto: true
                    });
                } catch (error) {
                    // Content script might not be ready yet
                    console.debug('Content script not ready:', error);
                }
            }, 2000);
        }
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'getSettings':
                    const settings = await chrome.storage.local.get([
                        'autoScan',
                        'showBadge',
                        'enableSound',
                        'sensitivityLevel'
                    ]);
                    sendResponse(settings);
                    break;

                case 'updateSettings':
                    await chrome.storage.local.set(message.settings);
                    sendResponse({ success: true });
                    break;

                case 'getScanHistory':
                    const history = await chrome.storage.local.get('scanHistory');
                    sendResponse(history.scanHistory || []);
                    break;

                case 'clearHistory':
                    await chrome.storage.local.set({ scanHistory: [] });
                    sendResponse({ success: true });
                    break;

                case 'reportScam':
                    await this.reportScamSite(message.data);
                    sendResponse({ success: true, reported: true });
                    break;

                case 'getBadgeStatus':
                    try {
                        const tab = await chrome.tabs.get(sender.tab.id);
                        if (tab.url && this.isJobSite(tab.url)) {
                            sendResponse({ shouldShowBadge: true });
                        } else {
                            sendResponse({ shouldShowBadge: false });
                        }
                    } catch (tabError) {
                        console.error('Error getting tab info:', tabError);
                        sendResponse({ shouldShowBadge: false });
                    }
                    break;

                default:
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Background message handler error:', error);
            sendResponse({ error: error.message });
        }
    }

    async reportScamSite(data) {
        // In a production version, this would send to a backend service
        // For now, we'll store it locally
        const reports = await chrome.storage.local.get('reportedSites');
        const reportedSites = reports.reportedSites || [];
        
        reportedSites.push({
            ...data,
            reportedAt: new Date().toISOString(),
            reporterId: await this.getAnonymousId()
        });
        
        // Keep only last 100 reports
        if (reportedSites.length > 100) {
            reportedSites.shift();
        }
        
        await chrome.storage.local.set({ reportedSites });
        
        console.log('Scam site reported:', data.url);
    }

    async getAnonymousId() {
        let id = await chrome.storage.local.get('anonymousId');
        if (!id.anonymousId) {
            id.anonymousId = 'user_' + Math.random().toString(36).substr(2, 9);
            await chrome.storage.local.set({ anonymousId: id.anonymousId });
        }
        return id.anonymousId;
    }

    // Update extension icon based on tab status
    async updateIconForTab(tabId, status) {
        // Validate status parameter and provide fallback
        if (!status || !['safe', 'suspicious', 'danger'].includes(status)) {
            status = 'safe'; // Default to safe status
        }
        
        // Check if the tab still exists before trying to update its icon
        try {
            await chrome.tabs.get(tabId);
        } catch (tabError) {
            // Tab doesn't exist, don't try to set its icon
            console.debug('Tab not found, skipping icon update:', tabId);
            return;
        }
        
        // Check if chrome API is available
        if (!chrome || !chrome.action || !chrome.runtime) {
            console.warn('Chrome API not available for icon update');
            return;
        }
        
        const iconPaths = {
            safe: {
                16: 'icons/icon16.png',
                48: 'icons/icon48.png',
                128: 'icons/icon128.png'
            },
            suspicious: {
                16: 'icons/icon_active.png',
                48: 'icons/icon_active.png',
                128: 'icons/icon_active.png'
            },
            danger: {
                16: 'icons/icon_active.png',
                48: 'icons/icon_active.png',
                128: 'icons/icon_active.png'
            }
        };
        
        try {
            chrome.action.setIcon({
                tabId: tabId,
                path: iconPaths[status]
            });
        } catch (error) {
            console.error('Error setting extension icon:', error);
            // Try with individual size as fallback
            try {
                chrome.action.setIcon({
                    tabId: tabId,
                    path: iconPaths[status]['48']
                });
            } catch (fallbackError) {
                console.error('Fallback icon setting also failed:', fallbackError);
            }
        }
    }
}

// Initialize background service worker
const backgroundService = new JobShieldBackground();

// Keep service worker alive and register it properly
chrome.runtime.onStartup.addListener(() => {
    console.log('JobShield background service started');
});

// Ensure service worker is properly registered and available
chrome.runtime.onInstalled.addListener(() => {
    console.log('JobShield service worker registered successfully');
    
    // Test storage access to ensure SW is working
    chrome.storage.local.get([]).then((result) => {
        console.log('Service worker storage access confirmed');
    }).catch((error) => {
        console.error('Service worker storage access failed:', error);
    });
});

// Handle service worker errors
chrome.runtime.onSuspend.addListener(() => {
    console.log('JobShield service worker is about to suspend');
});

// Handle uninstallation (for cleanup in production)
// Note: This requires "management" permission
// chrome.management.onUninstalled.addListener((info) => {
//     if (info.id === chrome.runtime.id) {
//         // Cleanup logic here
//     }
// });