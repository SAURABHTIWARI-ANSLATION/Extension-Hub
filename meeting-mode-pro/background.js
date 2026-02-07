// Service Worker for Meeting Mode Pro
class BackgroundService {
    constructor() {
        this.meetingActive = false;
        this.hiddenTabs = new Set();
        this.scheduledMeetings = [];
        this.notificationBlocked = false;
        this.init();
    }

    async init() {
        console.log('Meeting Mode Pro Service Worker Started');
        
        await this.loadState();
        this.setupMessageListener();
        this.setupTabListeners();
        this.setupAlarms();
        this.setupContextMenus();
        
        // Check for meeting calendar integration
        this.checkCalendarIntegration();
    }

    async loadState() {
        const data = await chrome.storage.local.get([
            'meetingModeActive',
            'hiddenTabs',
            'scheduledMeetings',
            'settings'
        ]);
        
        this.meetingActive = data.meetingModeActive || false;
        this.hiddenTabs = new Set(data.hiddenTabs || []);
        this.scheduledMeetings = data.scheduledMeetings || [];
        this.settings = data.settings || this.getDefaultSettings();
    }

    getDefaultSettings() {
        return {
            autoDetectMeetings: true,
            calendarIntegration: true,
            hideNotifications: true,
            cleanUrls: true,
            meetingReminders: true,
            actionExtraction: true,
            privacyLevel: 'standard', // standard, strict, custom
            whitelistDomains: [],
            blacklistDomains: []
        };
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'toggleMeetingMode':
                    this.toggleMeetingMode(request.data.enable);
                    sendResponse({ success: true });
                    break;
                    
                case 'hidePersonalTabs':
                    this.hidePersonalTabs();
                    sendResponse({ success: true });
                    break;
                    
                case 'cleanUrl':
                    this.cleanCurrentUrl(sender.tab?.id);
                    sendResponse({ success: true });
                    break;
                    
                case 'getMeetingStatus':
                    sendResponse({
                        active: this.meetingActive,
                        hiddenCount: this.hiddenTabs.size,
                        nextMeeting: this.getNextMeeting()
                    });
                    break;
                    
                case 'scheduleMeeting':
                    this.scheduleMeeting(request.data);
                    sendResponse({ success: true });
                    break;
                    
                case 'extractActionItems':
                    this.extractActionItems(sender.tab?.id);
                    sendResponse({ success: true });
                    break;
                    
                case 'updateSettings':
                    this.updateSettings(request.data);
                    sendResponse({ success: true });
                    break;
                    
                default:
                    sendResponse({ error: 'Unknown action' });
            }
            return true; // Keep message channel open for async
        });
    }

    setupTabListeners() {
        // Monitor tab creation
        chrome.tabs.onCreated.addListener((tab) => {
            if (this.meetingActive && this.isPersonalTab(tab.url)) {
                this.handleNewPersonalTab(tab);
            }
        });

        // Monitor tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.url && this.meetingActive) {
                this.handleTabUrlChange(tabId, changeInfo.url);
            }
        });

        // Monitor tab removal
        chrome.tabs.onRemoved.addListener((tabId) => {
            this.hiddenTabs.delete(tabId);
            this.saveHiddenTabs();
        });

        // Monitor window focus for automatic detection
        chrome.windows.onFocusChanged.addListener((windowId) => {
            if (windowId !== chrome.windows.WINDOW_ID_NONE) {
                this.checkForMeetingContext();
            }
        });
    }

    setupAlarms() {
        // Clear expired alarms
        chrome.alarms.clearAll();

        // Schedule regular checks
        chrome.alarms.create('meetingCheck', { periodInMinutes: 1 });
        chrome.alarms.create('calendarSync', { periodInMinutes: 5 });
        chrome.alarms.create('cleanup', { periodInMinutes: 30 });

        chrome.alarms.onAlarm.addListener((alarm) => {
            switch (alarm.name) {
                case 'meetingCheck':
                    this.checkForMeetingContext();
                    break;
                case 'calendarSync':
                    this.syncWithCalendar();
                    break;
                case 'cleanup':
                    this.cleanupOldData();
                    break;
            }
        });
    }

    setupContextMenus() {
        // Clear existing menus
        chrome.contextMenus.removeAll();

        // Create context menu for URL cleaning
        chrome.contextMenus.create({
            id: 'cleanUrl',
            title: 'Clean URL for sharing',
            contexts: ['link', 'page', 'selection']
        });

        // Create context menu for meeting mode
        chrome.contextMenus.create({
            id: 'toggleMeetingMode',
            title: 'Toggle Meeting Mode',
            contexts: ['page', 'browser_action']
        });

        // Create context menu for action extraction
        chrome.contextMenus.create({
            id: 'extractActionItems',
            title: 'Extract Action Items',
            contexts: ['page', 'selection']
        });

        // Handle context menu clicks
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            this.handleContextMenuClick(info, tab);
        });
    }

    async toggleMeetingMode(enable) {
        this.meetingActive = enable;
        
        await chrome.storage.local.set({ 
            meetingModeActive: this.meetingActive 
        });

        if (enable) {
            await this.activateMeetingMode();
        } else {
            await this.deactivateMeetingMode();
        }

        // Notify all tabs about state change
        this.broadcastStateChange();
    }

    async activateMeetingMode() {
        console.log('Activating Meeting Mode');
        
        // Hide personal tabs
        await this.hidePersonalTabs();
        
        // Block notifications if enabled
        if (this.settings.hideNotifications) {
            await this.blockNotifications();
        }
        
        // Set up meeting timer
        this.startMeetingTimer();
        
        // Update badge
        this.updateExtensionBadge(true);
        
        // Create notification
        this.createNotification({
            title: 'Meeting Mode Activated',
            message: 'Personal tabs hidden and notifications blocked',
            type: 'info'
        });
    }

    async deactivateMeetingMode() {
        console.log('Deactivating Meeting Mode');
        
        // Restore hidden tabs
        await this.restoreHiddenTabs();
        
        // Unblock notifications
        await this.unblockNotifications();
        
        // Stop timer
        this.stopMeetingTimer();
        
        // Update badge
        this.updateExtensionBadge(false);
        
        // Create notification
        this.createNotification({
            title: 'Meeting Mode Deactivated',
            message: 'All tabs restored',
            type: 'info'
        });
    }

    async hidePersonalTabs() {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        const personalDomains = this.getPersonalDomains();
        const tabsToHide = [];

        for (const tab of tabs) {
            if (tab.url && this.isDomainInList(tab.url, personalDomains)) {
                tabsToHide.push(tab.id);
                this.hiddenTabs.add(tab.id);
            }
        }

        if (tabsToHide.length > 0) {
            await chrome.tabs.hide(tabsToHide);
            await this.saveHiddenTabs();
            
            this.createNotification({
                title: `${tabsToHide.length} tabs hidden`,
                message: 'Personal content is now hidden from view',
                type: 'success'
            });
        }
    }

    async restoreHiddenTabs() {
        const tabsToShow = Array.from(this.hiddenTabs);
        
        if (tabsToShow.length > 0) {
            await chrome.tabs.show(tabsToShow);
            this.hiddenTabs.clear();
            await this.saveHiddenTabs();
        }
    }

    isDomainInList(url, domainList) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();
            
            return domainList.some(domain => 
                hostname.includes(domain.toLowerCase()) ||
                hostname.endsWith(`.${domain.toLowerCase()}`)
            );
        } catch {
            return false;
        }
    }

    getPersonalDomains() {
        const defaultDomains = [
            'facebook.com', 'instagram.com', 'twitter.com',
            'tiktok.com', 'snapchat.com', 'reddit.com',
            'youtube.com', 'netflix.com', 'hulu.com',
            'twitch.tv', 'pinterest.com', 'tumblr.com',
            '9gag.com', 'buzzfeed.com', 'gaming'
        ];
        
        return [...defaultDomains, ...(this.settings.blacklistDomains || [])];
    }

    getWorkDomains() {
        const defaultDomains = [
            'docs.google.com', 'github.com', 'gitlab.com',
            'notion.so', 'figma.com', 'slack.com',
            'teams.microsoft.com', 'zoom.us', 'meet.google.com',
            'asana.com', 'trello.com', 'jira.com',
            'confluence.atlassian.com', 'calendar.google.com'
        ];
        
        return [...defaultDomains, ...(this.settings.whitelistDomains || [])];
    }

    async handleNewPersonalTab(tab) {
        if (this.isDomainInList(tab.url, this.getPersonalDomains())) {
            await chrome.tabs.hide(tab.id);
            this.hiddenTabs.add(tab.id);
            await this.saveHiddenTabs();
            
            // Send notification to popup to update count
            this.sendToPopup('tabHidden', { tabId: tab.id });
        }
    }

    async handleTabUrlChange(tabId, newUrl) {
        if (this.isDomainInList(newUrl, this.getPersonalDomains())) {
            if (!this.hiddenTabs.has(tabId)) {
                await chrome.tabs.hide(tabId);
                this.hiddenTabs.add(tabId);
                await this.saveHiddenTabs();
                
                this.sendToPopup('tabHidden', { tabId });
            }
        } else if (this.hiddenTabs.has(tabId)) {
            // If tab is no longer personal, show it
            await chrome.tabs.show(tabId);
            this.hiddenTabs.delete(tabId);
            await this.saveHiddenTabs();
            
            this.sendToPopup('tabShown', { tabId });
        }
    }

    async saveHiddenTabs() {
        await chrome.storage.local.set({
            hiddenTabs: Array.from(this.hiddenTabs)
        });
    }

    async blockNotifications() {
        if (this.settings.hideNotifications) {
            // This is a conceptual implementation
            // In reality, you'd need to intercept notification API calls
            this.notificationBlocked = true;
            
            // Inject content script to block notifications
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => {
                            // Override Notification API
                            const originalNotification = window.Notification;
                            window.Notification = function(title, options) {
                                console.log('Notification blocked by Meeting Mode:', title);
                                return {
                                    close: () => {},
                                    onclick: null
                                };
                            };
                            window.Notification.permission = 'denied';
                            window.Notification.requestPermission = () => Promise.resolve('denied');
                            
                            // Store original for restoration
                            window._originalNotification = originalNotification;
                        }
                    });
                } catch (e) {
                    // Some tabs might not allow scripting
                }
            }
        }
    }

    async unblockNotifications() {
        // Restore original Notification API
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        if (window._originalNotification) {
                            window.Notification = window._originalNotification;
                            delete window._originalNotification;
                        }
                    }
                });
            } catch (e) {
                // Some tabs might not allow scripting
            }
        }
        
        this.notificationBlocked = false;
    }

    startMeetingTimer(durationMinutes = 60) {
        // Set alarm for meeting end
        const endTime = Date.now() + (durationMinutes * 60 * 1000);
        
        chrome.alarms.create('meetingEnd', {
            when: endTime
        });
        
        // Store timer info
        this.meetingTimer = {
            startTime: Date.now(),
            endTime: endTime,
            duration: durationMinutes
        };
        
        chrome.storage.local.set({ meetingTimer: this.meetingTimer });
    }

    stopMeetingTimer() {
        chrome.alarms.clear('meetingEnd');
        this.meetingTimer = null;
        chrome.storage.local.remove('meetingTimer');
    }

    updateExtensionBadge(active) {
        if (active) {
            chrome.action.setBadgeText({ text: 'ON' });
            chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
            chrome.action.setIcon({
                path: {
                    "16": "icons/icon-active-16.png",
                    "32": "icons/icon-active-32.png",
                    "48": "icons/icon-active-48.png",
                    "128": "icons/icon-active-128.png"
                }
            });
        } else {
            chrome.action.setBadgeText({ text: '' });
            chrome.action.setIcon({
                path: {
                    "16": "icons/icon16.png",
                    "32": "icons/icon32.png",
                    "48": "icons/icon48.png",
                    "128": "icons/icon128.png"
                }
            });
        }
    }

    createNotification({ title, message, type = 'info' }) {
        const iconMap = {
            info: 'icons/icon48.png',
            success: 'icons/success-48.png',
            warning: 'icons/warning-48.png',
            error: 'icons/error-48.png'
        };

        chrome.notifications.create({
            type: 'basic',
            iconUrl: iconMap[type] || iconMap.info,
            title: title,
            message: message,
            priority: 2
        });
    }

    async cleanCurrentUrl(tabId) {
        if (!tabId) {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            tabId = tab?.id;
        }
        
        if (tabId) {
            const tab = await chrome.tabs.get(tabId);
            if (tab.url) {
                const cleanedUrl = this.cleanUrl(tab.url);
                if (cleanedUrl !== tab.url) {
                    await chrome.tabs.update(tabId, { url: cleanedUrl });
                    
                    this.createNotification({
                        title: 'URL Cleaned',
                        message: 'Tracking parameters removed for sharing',
                        type: 'success'
                    });
                }
            }
        }
    }

    cleanUrl(url) {
        try {
            const urlObj = new URL(url);
            
            // Remove tracking parameters
            const trackingParams = [
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_term',
                'utm_content', 'fbclid', 'gclid', 'msclkid',
                'ref', 'source', 'campaign', 'medium', 'tracking',
                'affiliate', 'clickId', 'sessionId'
            ];
            
            trackingParams.forEach(param => {
                urlObj.searchParams.delete(param);
            });
            
            // Clean fragment
            if (urlObj.hash) {
                const hash = urlObj.hash;
                if (hash.includes('utm_') || hash.includes('ref=')) {
                    urlObj.hash = '';
                }
            }
            
            return urlObj.toString();
        } catch (e) {
            return url;
        }
    }

    broadcastStateChange() {
        // Send message to all tabs
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                try {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'meetingModeChanged',
                        data: { active: this.meetingActive }
                    });
                } catch (e) {
                    // Tab might not have content script
                }
            });
        });
        
        // Send to popup if open
        this.sendToPopup('stateChanged', { active: this.meetingActive });
    }

    sendToPopup(action, data) {
        chrome.runtime.sendMessage({
            action: action,
            data: data
        }).catch(() => {
            // Popup not open
        });
    }

    async checkForMeetingContext() {
        if (!this.settings.autoDetectMeetings) return;

        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0) return;

        const activeTab = tabs[0];
        const isMeetingTab = this.isDomainInList(activeTab.url, [
            'zoom.us', 'meet.google.com', 'teams.microsoft.com',
            'webex.com', 'gotomeeting.com', 'bluejeans.com',
            'whereby.com', 'zoho.com/meeting'
        ]);

        if (isMeetingTab && !this.meetingActive) {
            // Suggest activating meeting mode
            this.createNotification({
                title: 'Meeting Detected',
                message: 'Click to activate Meeting Mode',
                type: 'info',
                requireInteraction: true
            });
        }
    }

    async syncWithCalendar() {
        if (!this.settings.calendarIntegration) return;

        try {
            // This would integrate with Google Calendar API
            // For now, we'll simulate with stored meetings
            const now = new Date();
            const upcoming = this.scheduledMeetings.filter(meeting => {
                const meetingTime = new Date(meeting.startTime);
                const timeDiff = meetingTime - now;
                return timeDiff > 0 && timeDiff < 30 * 60 * 1000; // Next 30 minutes
            });

            if (upcoming.length > 0 && !this.meetingActive) {
                this.createNotification({
                    title: 'Upcoming Meeting',
                    message: `${upcoming[0].title} starts in ${Math.round((upcoming[0].startTime - now) / 60000)} minutes`,
                    type: 'warning'
                });
            }
        } catch (error) {
            console.error('Calendar sync error:', error);
        }
    }

    scheduleMeeting(meetingData) {
        this.scheduledMeetings.push({
            ...meetingData,
            id: Date.now().toString(),
            created: new Date().toISOString()
        });
        
        chrome.storage.local.set({ scheduledMeetings: this.scheduledMeetings });
        
        // Schedule alarm for meeting start
        const startTime = new Date(meetingData.startTime).getTime();
        if (startTime > Date.now()) {
            chrome.alarms.create(`meeting_${meetingData.id}`, {
                when: startTime - 5 * 60 * 1000 // 5 minutes before
            });
        }
    }

    async extractActionItems(tabId) {
        if (!tabId) {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            tabId = tab?.id;
        }
        
        if (tabId) {
            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: () => {
                        // Extract action items from page text
                        const text = document.body.innerText;
                        const actionKeywords = [
                            'action:', 'todo:', 'to do:', 'need to',
                            'will', 'should', 'must', 'requires',
                            'assign', 'follow up', 'next steps'
                        ];
                        
                        const sentences = text.split(/[.!?]+/);
                        const actionItems = sentences.filter(sentence => {
                            const lower = sentence.toLowerCase();
                            return actionKeywords.some(keyword => lower.includes(keyword));
                        }).slice(0, 10); // Limit to 10 items
                        
                        return actionItems.map(item => item.trim());
                    }
                });
                
                if (results[0]?.result?.length > 0) {
                    const actionItems = results[0].result;
                    await chrome.storage.local.set({
                        extractedActions: {
                            timestamp: new Date().toISOString(),
                            url: (await chrome.tabs.get(tabId)).url,
                            items: actionItems
                        }
                    });
                    
                    this.createNotification({
                        title: 'Action Items Extracted',
                        message: `${actionItems.length} items found and saved`,
                        type: 'success'
                    });
                }
            } catch (error) {
                console.error('Action extraction error:', error);
            }
        }
    }

    handleContextMenuClick(info, tab) {
        switch (info.menuItemId) {
            case 'cleanUrl':
                if (info.linkUrl) {
                    this.cleanUrlAndCopy(info.linkUrl);
                } else {
                    this.cleanCurrentUrl(tab.id);
                }
                break;
                
            case 'toggleMeetingMode':
                this.toggleMeetingMode(!this.meetingActive);
                break;
                
            case 'extractActionItems':
                this.extractActionItems(tab.id);
                break;
        }
    }

    async cleanUrlAndCopy(url) {
        const cleaned = this.cleanUrl(url);
        await navigator.clipboard.writeText(cleaned);
        
        this.createNotification({
            title: 'URL Copied',
            message: 'Cleaned URL copied to clipboard',
            type: 'success'
        });
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        chrome.storage.local.set({ settings: this.settings });
        
        // Apply settings changes
        if (newSettings.hideNotifications !== undefined) {
            if (this.meetingActive) {
                if (newSettings.hideNotifications) {
                    this.blockNotifications();
                } else {
                    this.unblockNotifications();
                }
            }
        }
    }

    checkCalendarIntegration() {
        // Check if calendar integration is possible
        // This would check for OAuth tokens, etc.
        console.log('Calendar integration check');
    }

    getNextMeeting() {
        const now = new Date();
        const upcoming = this.scheduledMeetings
            .filter(m => new Date(m.startTime) > now)
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        
        return upcoming[0] || null;
    }

    async cleanupOldData() {
        // Clean up old extracted actions
        const data = await chrome.storage.local.get(['extractedActions']);
        if (data.extractedActions) {
            const age = Date.now() - new Date(data.extractedActions.timestamp).getTime();
            if (age > 7 * 24 * 60 * 60 * 1000) { // 7 days
                await chrome.storage.local.remove(['extractedActions']);
            }
        }
        
        // Clean up old meetings
        const now = new Date();
        const oldCount = this.scheduledMeetings.length;
        this.scheduledMeetings = this.scheduledMeetings.filter(meeting => {
            const meetingTime = new Date(meeting.startTime);
            return meetingTime > now || (now - meetingTime) < 24 * 60 * 60 * 1000; // Keep if in next 24 hours
        });
        
        if (oldCount !== this.scheduledMeetings.length) {
            await chrome.storage.local.set({ scheduledMeetings: this.scheduledMeetings });
        }
    }
}

// Initialize service worker
const service = new BackgroundService();

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // First time installation
        chrome.tabs.create({
            url: chrome.runtime.getURL('welcome.html')
        });
        
        // Set default settings
        chrome.storage.local.set({
            settings: service.getDefaultSettings(),
            meetingModeActive: false,
            hiddenTabs: [],
            scheduledMeetings: []
        });
    } else if (details.reason === 'update') {
        // Extension updated
        console.log('Meeting Mode Pro updated to version', chrome.runtime.getManifest().version);
    }
});

// Handle alarm for meeting end
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'meetingEnd') {
        service.createNotification({
            title: 'Meeting Time Complete',
            message: 'Scheduled meeting time has ended',
            type: 'warning'
        });
        
        // Auto-deactivate if in strict mode
        if (service.settings.privacyLevel === 'strict') {
            service.toggleMeetingMode(false);
        }
    } else if (alarm.name.startsWith('meeting_')) {
        const meetingId = alarm.name.replace('meeting_', '');
        const meeting = service.scheduledMeetings.find(m => m.id === meetingId);
        if (meeting) {
            service.createNotification({
                title: 'Meeting Starting Soon',
                message: `${meeting.title} starts in 5 minutes`,
                type: 'info',
                requireInteraction: true
            });
            
            // Auto-activate if enabled
            if (service.settings.autoDetectMeetings) {
                service.toggleMeetingMode(true);
            }
        }
    }
});

// Handle uninstall
chrome.runtime.setUninstallURL('https://forms.gle/your-uninstall-feedback-form');

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundService;
}