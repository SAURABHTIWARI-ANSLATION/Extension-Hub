class JobShieldPopup {
    constructor() {
        this.initializeElements();
        this.loadSettings();
        this.setupEventListeners();
        this.analyzeCurrentTab();
    }

    initializeElements() {
        // Status elements
        this.statusContainer = document.getElementById('statusContainer');
        this.statusIcon = document.getElementById('statusIcon');
        this.statusTitle = document.getElementById('statusTitle');
        this.scoreFill = document.getElementById('scoreFill');
        this.scoreLabel = document.getElementById('scoreLabel');
        this.flagsList = document.getElementById('flagsList');
        this.domainInfo = document.getElementById('domainInfo');
        this.analysisTime = document.getElementById('analysisTime');
        this.wordsScanned = document.getElementById('wordsScanned');

        // Buttons
        this.rescanBtn = document.getElementById('rescanBtn');
        this.viewHistoryBtn = document.getElementById('viewHistoryBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');

        // Modals
        this.historyModal = document.getElementById('historyModal');
        this.settingsModal = document.getElementById('settingsModal');
        this.historyList = document.getElementById('historyList');

        // Settings
        this.autoScan = document.getElementById('autoScan');
        this.showBadge = document.getElementById('showBadge');
        this.enableSound = document.getElementById('enableSound');
        this.sensitivityLevel = document.getElementById('sensitivityLevel');

        // Close buttons
        this.closeButtons = document.querySelectorAll('.close-modal');
    }

    async loadSettings() {
        const settings = await chrome.storage.local.get([
            'autoScan',
            'showBadge',
            'enableSound',
            'sensitivityLevel',
            'scanHistory'
        ]);

        if (this.autoScan) this.autoScan.checked = settings.autoScan !== false;
        if (this.showBadge) this.showBadge.checked = settings.showBadge !== false;
        if (this.enableSound) this.enableSound.checked = settings.enableSound !== false;
        if (this.sensitivityLevel) this.sensitivityLevel.value = settings.sensitivityLevel || 'medium';
    }

    setupEventListeners() {
        if (this.rescanBtn) this.rescanBtn.addEventListener('click', () => this.analyzeCurrentTab());
        if (this.viewHistoryBtn) this.viewHistoryBtn.addEventListener('click', () => this.showHistory());
        if (this.settingsBtn) this.settingsBtn.addEventListener('click', () => this.showSettings());
        if (this.clearHistoryBtn) this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

        // Close modals when clicking X
        this.closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.historyModal.classList.remove('active');
                this.settingsModal.classList.remove('active');
                setTimeout(() => {
                    this.historyModal.style.display = 'none';
                    this.settingsModal.style.display = 'none';
                }, 300);
            });
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.historyModal) {
                this.historyModal.classList.remove('active');
                setTimeout(() => this.historyModal.style.display = 'none', 300);
            }
            if (e.target === this.settingsModal) {
                this.settingsModal.classList.remove('active');
                setTimeout(() => this.settingsModal.style.display = 'none', 300);
            }
        });

        // Save settings when changed
        if (this.autoScan) this.autoScan.addEventListener('change', () => this.saveSettings());
        if (this.showBadge) this.showBadge.addEventListener('change', () => this.saveSettings());
        if (this.enableSound) this.enableSound.addEventListener('change', () => this.saveSettings());
        if (this.sensitivityLevel) this.sensitivityLevel.addEventListener('change', () => this.saveSettings());
    }

    async saveSettings() {
        await chrome.storage.local.set({
            autoScan: this.autoScan.checked,
            showBadge: this.showBadge.checked,
            enableSound: this.enableSound.checked,
            sensitivityLevel: this.sensitivityLevel.value
        });
    }

    getIcon(type) {
        const icons = {
            spinner: `<svg class="status-svg spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>`,
            check: `<svg class="status-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>`,
            alert: `<svg class="status-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>`,
            x: `<svg class="status-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>`
        };
        return icons[type] || icons.alert;
    }

    async analyzeCurrentTab() {
        try {
            this.showLoadingState();

            // Check if service worker is available
            if (!chrome.runtime || !chrome.tabs) {
                this.showError('Extension service not available');
                return;
            }

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab?.url) {
                this.showError('Cannot analyze this page');
                return;
            }

            // Check if the tab is a valid web page
            if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) {
                this.showError('Cannot analyze this page');
                return;
            }

            try {
                const response = await chrome.tabs.sendMessage(tab.id, {
                    action: 'analyzePage',
                    sensitivity: this.sensitivityLevel.value
                });

                if (response) {
                    if (response.error) {
                        console.error('Content script error:', response.error);
                        this.showError('Content script error: ' + response.error);
                        return;
                    }
                    this.updateUI(response);
                    await this.saveToHistory(response, tab.url);
                } else {
                    this.showError('No response from content script');
                    this.injectAndRetry(tab);
                }
            } catch (error) {
                console.debug('Tab message error:', error);
                this.injectAndRetry(tab);
            }
        } catch (error) {
            console.error('Analysis error:', error);
            this.showError('Error analyzing page');
        }
    }

    async injectAndRetry(tab) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });

            await new Promise(resolve => setTimeout(resolve, 500));

            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'analyzePage',
                sensitivity: this.sensitivityLevel.value
            });

            if (response) {
                if (response.error) {
                    this.showError('Content script error: ' + response.error);
                    return;
                }
                this.updateUI(response);
                await this.saveToHistory(response, tab.url);
            } else {
                this.showError('No response from content script');
            }
        } catch (injectError) {
            console.error('Failed to inject content script:', injectError);
            this.showError('Cannot analyze this page - content script unavailable');
        }
    }

    showLoadingState() {
        this.statusIcon.innerHTML = this.getIcon('spinner');
        this.statusContainer.className = 'status-card scanning';
        this.statusTitle.textContent = 'Analyzing Page...';
        this.scoreFill.style.width = '0%';
        this.scoreLabel.textContent = '0/100';
        this.flagsList.innerHTML = `
            <li class="no-flags-state">
                ${this.getIcon('spinner')}
                <span>Scanning for red flags...</span>
            </li>`;

        // Add spin animation style
        if (!document.getElementById('spin-style')) {
            const style = document.createElement('style');
            style.id = 'spin-style';
            style.textContent = `
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
            `;
            document.head.appendChild(style);
        }
    }

    showError(message) {
        this.statusIcon.innerHTML = this.getIcon('alert');
        this.statusContainer.className = 'status-card warning';
        this.statusTitle.textContent = message;
        this.scoreFill.style.width = '0%';
        this.scoreLabel.textContent = 'Error';
        this.flagsList.innerHTML = `
            <li class="no-flags-state">
                ${this.getIcon('alert')}
                <span>Unable to scan this page</span>
            </li>`;
    }

    updateUI(data) {
        const status = this.calculateStatus(data.riskScore);
        const statusConfig = {
            safe: { icon: 'check', class: 'safe', title: 'Safe Job Posting' },
            suspicious: { icon: 'alert', class: 'warning', title: 'Suspicious Content Found' },
            danger: { icon: 'x', class: 'danger', title: 'Likely Scam Detected' }
        }[status] || { icon: 'alert', class: 'warning', title: 'Unknown Status' };

        // Update status
        this.statusIcon.innerHTML = this.getIcon(statusConfig.icon);
        this.statusContainer.className = `status-card ${statusConfig.class}`;
        this.statusTitle.textContent = statusConfig.title;

        // Update risk score
        this.scoreFill.style.width = `${data.riskScore}%`;
        this.scoreLabel.textContent = `${Math.round(data.riskScore)}/100`;
        this.scoreFill.style.backgroundColor = status === 'safe' ? 'var(--success)' :
            status === 'suspicious' ? 'var(--warning)' : 'var(--danger)';

        // Update detected flags
        if (data.redFlags.length > 0) {
            this.flagsList.innerHTML = data.redFlags.map(flag => {
                const levelClass = {
                    high: 'risk-high',
                    medium: 'risk-medium',
                    low: 'risk-low'
                }[flag.level] || 'risk-low';

                return `
                    <li class="${levelClass}">
                        <strong>${flag.type}:</strong> ${flag.description}
                    </li>
                `;
            }).join('');
        } else {
            this.flagsList.innerHTML = `
                <li class="no-flags-state">
                    ${this.getIcon('check')}
                    <span>No suspicious content detected</span>
                </li>`;
        }

        // Update page info
        this.domainInfo.textContent = data.domain || 'Unknown';
        this.analysisTime.textContent = `${data.analysisTime}ms`;
        this.wordsScanned.textContent = data.wordsScanned.toLocaleString();

        // Update extension icon
        this.updateExtensionIcon(status);

        // Play warning sound if enabled and risky
        if (this.enableSound.checked && status !== 'safe') {
            this.playWarningSound(status);
        }
    }

    calculateStatus(score) {
        if (score < 30) return 'safe';
        if (score < 70) return 'suspicious';
        return 'danger';
    }

    updateExtensionIcon(status) {
        if (!status || !['safe', 'suspicious', 'danger'].includes(status)) {
            status = 'safe';
        }

        if (!chrome || !chrome.action) return;

        const iconPaths = {
            safe: { 16: 'icons/icon16.png', 48: 'icons/icon48.png', 128: 'icons/icon128.png' },
            suspicious: { 16: 'icons/icon_active.png', 48: 'icons/icon_active.png', 128: 'icons/icon_active.png' },
            danger: { 16: 'icons/icon_active.png', 48: 'icons/icon_active.png', 128: 'icons/icon_active.png' }
        };

        try {
            chrome.action.setIcon({ path: iconPaths[status] });
        } catch (error) {
            console.error('Error setting extension icon:', error);
        }
    }

    playWarningSound(status) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (status === 'danger') {
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        } else if (status === 'suspicious') {
            oscillator.frequency.setValueAtTime(329.63, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        }
    }

    async saveToHistory(data, url) {
        const history = await chrome.storage.local.get('scanHistory');
        const scanHistory = history.scanHistory || [];

        const historyEntry = {
            url,
            domain: data.domain,
            riskScore: data.riskScore,
            status: this.calculateStatus(data.riskScore),
            redFlags: data.redFlags.length,
            timestamp: new Date().toISOString(),
            flags: data.redFlags.map(f => f.type)
        };

        scanHistory.unshift(historyEntry);

        if (scanHistory.length > 50) {
            scanHistory.pop();
        }

        await chrome.storage.local.set({ scanHistory });
    }

    async showHistory() {
        const history = await chrome.storage.local.get('scanHistory');
        const scanHistory = history.scanHistory || [];

        if (scanHistory.length === 0) {
            this.historyList.innerHTML = '<div class="no-history">No scan history yet</div>';
        } else {
            this.historyList.innerHTML = scanHistory.map(entry => {
                const date = new Date(entry.timestamp);
                return `
                    <div class="history-item ${entry.status}">
                        <div class="history-domain">${entry.domain || 'Unknown Domain'}</div>
                        <div class="history-date">${date.toLocaleString()}</div>
                        <div class="history-flags">
                            <strong>Risk:</strong> ${Math.round(entry.riskScore)}/100
                            ${entry.flags.length > 0 ? `<br><strong>Flags:</strong> ${entry.flags.join(', ')}` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }

        this.historyModal.style.display = 'flex';
        // Add timeout to allow display:flex to apply before adding active class for transition
        setTimeout(() => this.historyModal.classList.add('active'), 10);
    }

    showSettings() {
        this.settingsModal.style.display = 'flex';
        setTimeout(() => this.settingsModal.classList.add('active'), 10);
    }

    async clearHistory() {
        if (confirm('Are you sure you want to clear all scan history?')) {
            await chrome.storage.local.set({ scanHistory: [] });
            this.historyList.innerHTML = '<div class="no-history">No scan history yet</div>';
            this.historyModal.classList.remove('active');
            setTimeout(() => this.historyModal.style.display = 'none', 300);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JobShieldPopup();
});