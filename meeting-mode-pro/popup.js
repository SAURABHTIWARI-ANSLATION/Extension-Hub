class MeetingMode {
    constructor() {
        this.isActive = false;
        this.hiddenTabs = new Set();
        this.settings = {
            autoHideNotifications: true,
            autoCleanUrls: true,
            timerSound: true,
            actionExtraction: true,
            personalDomains: [
                'facebook.com', 'instagram.com', 'twitter.com',
                'youtube.com', 'netflix.com', 'reddit.com',
                'whatsapp.com', 'tiktok.com', 'pinterest.com'
            ],
            workDomains: [
                'docs.google.com', 'github.com', 'gitlab.com',
                'notion.so', 'figma.com', 'slack.com',
                'teams.microsoft.com', 'zoom.us', 'meet.google.com'
            ]
        };
        this.meetingTimer = {
            active: false,
            remaining: 0,
            interval: null
        };
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.loadState();
        this.updateUI();
        this.setupEventListeners();
        this.startTabMonitoring();
        console.log('Meeting Mode Pro initialized');
    }

    async loadSettings() {
        const saved = await chrome.storage.local.get(['meetingModeSettings']);
        if (saved.meetingModeSettings) {
            this.settings = { ...this.settings, ...saved.meetingModeSettings };
        }
        this.updateSettingsUI();
    }

    async loadState() {
        const saved = await chrome.storage.local.get(['meetingModeActive', 'hiddenTabs']);
        this.isActive = saved.meetingModeActive || false;
        this.hiddenTabs = new Set(saved.hiddenTabs || []);
        this.updateToggleUI();
    }

    updateUI() {
        this.updateTabCounts();
        this.updateTimerUI();
    }

    updateToggleUI() {
        const toggle = document.getElementById('meetingToggle');
        const statusIndicator = document.getElementById('statusIndicator');
        
        if (toggle) {
            toggle.checked = this.isActive;
        }
        
        if (statusIndicator) {
            statusIndicator.classList.toggle('active', this.isActive);
            const statusText = statusIndicator.querySelector('.status-text');
            if (statusText) {
                statusText.textContent = this.isActive ? 'Active' : 'Inactive';
            }
        }
    }

    updateSettingsUI() {
        document.getElementById('autoHideNotifications').checked = this.settings.autoHideNotifications;
        document.getElementById('autoCleanUrls').checked = this.settings.autoCleanUrls;
        document.getElementById('timerSound').checked = this.settings.timerSound;
        document.getElementById('actionExtraction').checked = this.settings.actionExtraction;
    }

    setupEventListeners() {
        // Meeting toggle
        document.getElementById('meetingToggle').addEventListener('change', (e) => {
            this.toggleMeetingMode(e.target.checked);
        });

        // Control buttons
        document.getElementById('hidePersonalBtn').addEventListener('click', () => {
            this.hidePersonalTabs();
        });

        document.getElementById('cleanUrlBtn').addEventListener('click', () => {
            this.cleanCurrentUrl();
        });

        document.getElementById('timerBtn').addEventListener('click', () => {
            this.showTimerModal();
        });

        document.getElementById('agendaBtn').addEventListener('click', () => {
            this.showAgendaModal();
        });

        // Settings
        document.getElementById('autoHideNotifications').addEventListener('change', (e) => {
            this.updateSetting('autoHideNotifications', e.target.checked);
        });

        document.getElementById('autoCleanUrls').addEventListener('change', (e) => {
            this.updateSetting('autoCleanUrls', e.target.checked);
        });

        document.getElementById('timerSound').addEventListener('change', (e) => {
            this.updateSetting('timerSound', e.target.checked);
        });

        document.getElementById('actionExtraction').addEventListener('change', (e) => {
            this.updateSetting('actionExtraction', e.target.checked);
        });

        // Advanced settings
        document.getElementById('advancedSettings').addEventListener('click', () => {
            this.openAdvancedSettings();
        });

         // Privacy Policy Button
        document.getElementById('privacyPolicyBtn').addEventListener('click', () => {
            chrome.tabs.create({
                url: chrome.runtime.getURL('privacy-policy.html')
            });
        });

        // Footer buttons
        document.getElementById('helpBtn').addEventListener('click', () => {
            this.openHelp();
        });

        document.getElementById('feedbackBtn').addEventListener('click', () => {
            this.openFeedback();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'M') {
                this.toggleMeetingMode(!this.isActive);
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                this.cleanCurrentUrl();
            }
        });

        // Modal events
        this.setupModalEvents();
    }

    setupModalEvents() {
        // Agenda modal
        const agendaModal = document.getElementById('agendaModal');
        const cancelAgenda = document.getElementById('cancelAgenda');
        const saveAgenda = document.getElementById('saveAgenda');

        document.getElementById('agendaBtn').addEventListener('click', () => {
            agendaModal.classList.add('active');
            this.loadAgenda();
        });

        cancelAgenda.addEventListener('click', () => {
            agendaModal.classList.remove('active');
        });

        saveAgenda.addEventListener('click', () => {
            this.saveAgenda();
            agendaModal.classList.remove('active');
        });

        // Timer modal
        const timerModal = document.getElementById('timerModal');
        const startTimer = document.getElementById('startTimer');
        const pauseTimer = document.getElementById('pauseTimer');
        const resetTimer = document.getElementById('resetTimer');

        document.getElementById('timerBtn').addEventListener('click', () => {
            timerModal.classList.add('active');
        });

        cancelAgenda.addEventListener('click', () => {
            timerModal.classList.remove('active');
        });

        startTimer.addEventListener('click', () => {
            this.startMeetingTimer();
        });

        pauseTimer.addEventListener('click', () => {
            this.pauseMeetingTimer();
        });

        resetTimer.addEventListener('click', () => {
            this.resetMeetingTimer();
        });

        // Time input validation
        document.getElementById('hours').addEventListener('input', (e) => {
            this.updateTimeDisplay();
        });

        document.getElementById('minutes').addEventListener('input', (e) => {
            this.updateTimeDisplay();
        });
    }

    async toggleMeetingMode(enable) {
        this.isActive = enable;
        
        await chrome.storage.local.set({ 
            meetingModeActive: this.isActive 
        });

        this.updateToggleUI();

        if (enable) {
            await this.activateMeetingMode();
            this.showNotification('Meeting Mode Activated', 'Personal tabs are now hidden');
        } else {
            await this.deactivateMeetingMode();
            this.showNotification('Meeting Mode Deactivated', 'All tabs restored');
        }

        this.updateTabCounts();
    }

    async activateMeetingMode() {
        // Hide personal tabs
        await this.hidePersonalTabs();
        
        // Hide notifications if enabled
        if (this.settings.autoHideNotifications) {
            await this.hideNotifications();
        }
        
        // Start meeting timer
        this.startMeetingTimer(60); // Default 60 minutes
        
        // Inject sidebar
        await this.injectMeetingSidebar();
        
        // Send message to background
        chrome.runtime.sendMessage({
            action: 'meetingModeActivated',
            data: { active: true }
        });
    }

    async deactivateMeetingMode() {
        // Restore hidden tabs
        await this.restoreHiddenTabs();
        
        // Remove sidebar
        await this.removeMeetingSidebar();
        
        // Stop timer
        this.stopMeetingTimer();
        
        // Send message to background
        chrome.runtime.sendMessage({
            action: 'meetingModeDeactivated',
            data: { active: false }
        });
    }

    async hidePersonalTabs() {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        const tabsToHide = [];
        
        for (const tab of tabs) {
            if (this.isPersonalTab(tab.url)) {
                tabsToHide.push(tab.id);
                this.hiddenTabs.add(tab.id);
            }
        }
        
        if (tabsToHide.length > 0) {
            await chrome.tabs.hide(tabsToHide);
            await chrome.storage.local.set({ 
                hiddenTabs: Array.from(this.hiddenTabs) 
            });
            
            this.updateTabCounts();
            this.showNotification(`${tabsToHide.length} tabs hidden`, 'Personal content is now hidden');
        }
    }

    isPersonalTab(url) {
        if (!url) return false;
        
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        
        return this.settings.personalDomains.some(domain => 
            hostname.includes(domain.toLowerCase())
        );
    }

    isWorkTab(url) {
        if (!url) return false;
        
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        
        return this.settings.workDomains.some(domain => 
            hostname.includes(domain.toLowerCase())
        );
    }

    async restoreHiddenTabs() {
        const tabsToShow = Array.from(this.hiddenTabs);
        
        if (tabsToShow.length > 0) {
            await chrome.tabs.show(tabsToShow);
            this.hiddenTabs.clear();
            await chrome.storage.local.set({ hiddenTabs: [] });
            
            this.updateTabCounts();
        }
    }

    async cleanCurrentUrl() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab && tab.url) {
            const cleanedUrl = this.cleanUrl(tab.url);
            
            if (cleanedUrl !== tab.url) {
                await chrome.tabs.update(tab.id, { url: cleanedUrl });
                this.showNotification('URL Cleaned', 'Tracking parameters removed');
            }
        }
    }

    cleanUrl(url) {
        try {
            const urlObj = new URL(url);
            
            // Remove common tracking parameters
            const trackingParams = [
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_term',
                'utm_content', 'fbclid', 'gclid', 'msclkid',
                'ref', 'source', 'campaign', 'medium'
            ];
            
            trackingParams.forEach(param => {
                urlObj.searchParams.delete(param);
            });
            
            // Clean fragment if it contains tracking
            if (urlObj.hash.includes('?')) {
                urlObj.hash = '';
            }
            
            return urlObj.toString();
        } catch (e) {
            return url;
        }
    }

    async updateTabCounts() {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        
        let workCount = 0;
        let personalCount = 0;
        let hiddenCount = this.hiddenTabs.size;
        
        tabs.forEach(tab => {
            if (this.isWorkTab(tab.url)) {
                workCount++;
            } else if (this.isPersonalTab(tab.url)) {
                personalCount++;
            }
        });
        
        // Update UI
        document.getElementById('tabCount').textContent = hiddenCount;
        document.getElementById('workTabCount').textContent = workCount;
        document.getElementById('personalTabCount').textContent = personalCount;
        
        // Calculate time saved (1 minute per hidden tab)
        const timeSaved = hiddenCount;
        document.getElementById('timeSaved').textContent = `${timeSaved}m`;
    }

    async hideNotifications() {
        // This would require additional permissions and implementation
        // For now, we'll just show a notification
        this.showNotification('Notifications Hidden', 'All notifications are temporarily disabled');
    }

    async injectMeetingSidebar() {
        // Inject sidebar into all tabs
        const tabs = await chrome.tabs.query({});
        
        for (const tab of tabs) {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
            } catch (e) {
                // Some tabs might not allow scripting
                console.log(`Could not inject sidebar into tab ${tab.id}:`, e.message);
            }
        }
    }

    async removeMeetingSidebar() {
        // Send message to all tabs to remove sidebar
        const tabs = await chrome.tabs.query({});
        
        for (const tab of tabs) {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'removeSidebar'
                });
            } catch (e) {
                // Tab might not have content script
            }
        }
    }

    showTimerModal() {
        document.getElementById('timerModal').classList.add('active');
    }

    updateTimeDisplay() {
        const hours = parseInt(document.getElementById('hours').value) || 0;
        const minutes = parseInt(document.getElementById('minutes').value) || 0;
        
        const totalSeconds = (hours * 3600) + (minutes * 60);
        this.meetingTimer.remaining = totalSeconds;
        
        const display = this.formatTime(totalSeconds);
        document.getElementById('timeRemaining').textContent = display;
    }

    startMeetingTimer(durationMinutes = null) {
        if (durationMinutes) {
            this.meetingTimer.remaining = durationMinutes * 60;
        }
        
        this.meetingTimer.active = true;
        
        if (this.meetingTimer.interval) {
            clearInterval(this.meetingTimer.interval);
        }
        
        this.meetingTimer.interval = setInterval(() => {
            this.meetingTimer.remaining--;
            
            if (this.meetingTimer.remaining <= 0) {
                this.stopMeetingTimer();
                this.showTimerComplete();
                return;
            }
            
            this.updateTimerUI();
        }, 1000);
        
        this.updateTimerUI();
    }

    pauseMeetingTimer() {
        this.meetingTimer.active = false;
        if (this.meetingTimer.interval) {
            clearInterval(this.meetingTimer.interval);
            this.meetingTimer.interval = null;
        }
        this.updateTimerUI();
    }

    resetMeetingTimer() {
        this.pauseMeetingTimer();
        this.meetingTimer.remaining = 0;
        this.updateTimerUI();
    }

    stopMeetingTimer() {
        this.pauseMeetingTimer();
        this.meetingTimer.remaining = 0;
        this.updateTimerUI();
    }

    updateTimerUI() {
        const timerElement = document.getElementById('meetingTimer');
        const timerText = timerElement.querySelector('.timer-text');
        
        if (this.meetingTimer.active && this.meetingTimer.remaining > 0) {
            const timeStr = this.formatTime(this.meetingTimer.remaining);
            timerText.textContent = `Meeting: ${timeStr}`;
            timerElement.style.background = '#dbeafe';
            timerElement.style.color = '#1d4ed8';
        } else {
            timerText.textContent = 'No active meeting';
            timerElement.style.background = '';
            timerElement.style.color = '';
        }
    }

    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    showTimerComplete() {
        this.showNotification('Meeting Time Complete', 'Your scheduled meeting time has ended');
        
        if (this.settings.timerSound) {
            this.playSound();
        }
    }

    playSound() {
        // Play notification sound
        const audio = new Audio(chrome.runtime.getURL('assets/notification-sound.mp3'));
        audio.play().catch(() => {
            // Fallback to beep if audio file not found
            console.log('\u0007'); // Terminal bell
        });
    }

    showAgendaModal() {
        document.getElementById('agendaModal').classList.add('active');
    }

    async loadAgenda() {
        const saved = await chrome.storage.local.get(['meetingAgenda']);
        const agendaText = document.getElementById('agendaText');
        agendaText.value = saved.meetingAgenda || '';
    }

    async saveAgenda() {
        const agendaText = document.getElementById('agendaText').value;
        await chrome.storage.local.set({ meetingAgenda: agendaText });
        this.showNotification('Agenda Saved', 'Meeting agenda has been saved');
    }

    async updateSetting(key, value) {
        this.settings[key] = value;
        await chrome.storage.local.set({ 
            meetingModeSettings: this.settings 
        });
    }

    openAdvancedSettings() {
        chrome.tabs.create({
            url: chrome.runtime.getURL('options.html')
        });
    }

    openHelp() {
        chrome.tabs.create({
            url: 'https://github.com/yourusername/meeting-mode-pro/wiki'
        });
    }

    openFeedback() {
        chrome.tabs.create({
            url: 'https://forms.gle/your-feedback-form'
        });
    }

    showNotification(title, message) {
        if (!('Notification' in window)) return;
        
        if (Notification.permission === 'granted') {
            new Notification(title, { body: message, icon: 'icons/icon128.png' });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body: message, icon: 'icons/icon128.png' });
                }
            });
        }
    }

    startTabMonitoring() {
        // Monitor tab changes
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (this.isActive && changeInfo.url) {
                this.handleTabUpdate(tabId, changeInfo.url);
            }
        });

        chrome.tabs.onCreated.addListener((tab) => {
            if (this.isActive) {
                this.handleNewTab(tab);
            }
        });
    }

    handleTabUpdate(tabId, newUrl) {
        if (this.isPersonalTab(newUrl)) {
            // Auto-hide new personal tabs
            chrome.tabs.hide(tabId);
            this.hiddenTabs.add(tabId);
            this.updateTabCounts();
        }
    }

    handleNewTab(tab) {
        if (this.isPersonalTab(tab.url)) {
            chrome.tabs.hide(tab.id);
            this.hiddenTabs.add(tab.id);
            this.updateTabCounts();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.meetingMode = new MeetingMode();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MeetingMode;
}