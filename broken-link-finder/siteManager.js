// Site Manager - Ensures clean separation between sites
class SiteManager {
    constructor() {
        this.currentSite = null;
        this.siteData = new Map();
    }
    
    setCurrentSite(url) {
        try {
            const urlObj = new URL(url);
            this.currentSite = urlObj.hostname;
            
            // Clear any data from previous site
            this.clearPreviousSiteData();
            
            console.log(`Switched to site: ${this.currentSite}`);
            return this.currentSite;
        } catch (error) {
            console.error('Error setting current site:', error);
            return null;
        }
    }
    
    clearPreviousSiteData() {
        // Clear background script cache for old site
        if (this.currentSite) {
            chrome.runtime.sendMessage({
                type: 'CLEAR_SITE_CACHE',
                url: `https://${this.currentSite}`
            });
        }
        
        // Clear any stored highlights
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'clearHighlights' });
            }
        });
        
        // Clear popup results
        if (typeof clearPreviousResults === 'function') {
            clearPreviousResults();
        }
    }
    
    isSameSite(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname === this.currentSite;
        } catch {
            return false;
        }
    }
    
    getSiteData() {
        if (!this.currentSite) return null;
        return this.siteData.get(this.currentSite) || {
            scanResults: [],
            stats: {
                total: 0,
                broken: 0,
                successRate: 100,
                seoScore: 100
            },
            highlights: []
        };
    }
    
    setSiteData(data) {
        if (!this.currentSite) return;
        this.siteData.set(this.currentSite, data);
    }
}

// Initialize site manager
const siteManager = new SiteManager();

// Export for use in popup.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SiteManager, siteManager };
} else {
    window.siteManager = siteManager;
}