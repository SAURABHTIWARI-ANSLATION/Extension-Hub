// Content Script for Meeting Mode Pro
class MeetingContentScript {
    constructor() {
        this.meetingActive = false;
        this.sidebarInjected = false;
        this.originalNotifications = null;
        this.init();
    }

    async init() {
        // Listen for messages from background
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
        
        // Load initial state
        const response = await chrome.runtime.sendMessage({
            action: 'getMeetingStatus'
        });
        
        if (response?.active) {
            this.meetingActive = true;
            this.onMeetingActivated();
        }
        
        // Set up mutation observer for dynamic content
        this.setupObservers();
        
        // Add CSS for blocked notifications
        this.injectStyles();
    }

    handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'meetingModeChanged':
                this.meetingActive = request.data.active;
                if (this.meetingActive) {
                    this.onMeetingActivated();
                } else {
                    this.onMeetingDeactivated();
                }
                sendResponse({ success: true });
                break;
                
            case 'removeSidebar':
                this.removeSidebar();
                sendResponse({ success: true });
                break;
                
            case 'extractText':
                const extracted = this.extractPageText();
                sendResponse({ text: extracted });
                break;
                
            default:
                sendResponse({ error: 'Unknown action' });
        }
        return true;
    }

    onMeetingActivated() {
        console.log('Meeting Mode activated on page');
        
        // Block notifications if enabled
        this.blockNotifications();
        
        // Clean URLs if enabled and this is a sharing page
        this.cleanPageUrls();
        
        // Inject meeting sidebar
        this.injectSidebar();
        
        // Add meeting mode indicator
        this.addMeetingIndicator();
        
        // Monitor for personal content
        this.monitorForPersonalContent();
    }

    onMeetingDeactivated() {
        console.log('Meeting Mode deactivated on page');
        
        // Restore notifications
        this.restoreNotifications();
        
        // Remove sidebar
        this.removeSidebar();
        
        // Remove meeting indicator
        this.removeMeetingIndicator();
    }

    blockNotifications() {
        // Save original Notification API
        if (!this.originalNotifications) {
            this.originalNotifications = {
                Notification: window.Notification,
                permission: window.Notification?.permission,
                requestPermission: window.Notification?.requestPermission
            };
        }
        
        // Override Notification API
        window.Notification = function(title, options) {
            console.log('[Meeting Mode] Notification blocked:', title);
            
            // Still allow critical notifications (optional)
            if (options?.requireInteraction) {
                console.log('[Meeting Mode] Critical notification allowed:', title);
                if (this.originalNotifications?.Notification) {
                    return new this.originalNotifications.Notification(title, options);
                }
            }
            
            // Return dummy notification
            return {
                close: () => {},
                onclick: null,
                addEventListener: () => {},
                removeEventListener: () => {}
            };
        };
        
        // Override static properties
        window.Notification.permission = 'denied';
        window.Notification.requestPermission = () => Promise.resolve('denied');
        
        // Also block other notification methods
        this.blockWebNotifications();
        this.blockToastNotifications();
    }

    blockWebNotifications() {
        // Override service worker registration for push notifications
        const originalRegister = navigator.serviceWorker?.register;
        if (originalRegister) {
            navigator.serviceWorker.register = function() {
                console.log('[Meeting Mode] Service Worker registration blocked');
                return Promise.reject(new Error('Notifications blocked by Meeting Mode'));
            };
        }
        
    }

    blockToastNotifications() {
        // Block toast notifications (common in web apps)
        const style = document.createElement('style');
        style.id = 'meeting-mode-toast-blocker';
        style.textContent = `
            .toast, [class*="toast"], [class*="notification"], 
            .alert-notification, .snackbar, [class*="snackbar"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
            }
        `;
        document.head.appendChild(style);
    }

    restoreNotifications() {
        // Restore original Notification API
        if (this.originalNotifications?.Notification) {
            window.Notification = this.originalNotifications.Notification;
            this.originalNotifications = null;
        }
        
        // Remove toast blocker style
        const blocker = document.getElementById('meeting-mode-toast-blocker');
        if (blocker) {
            blocker.remove();
        }
        
        // Restore service worker registration
        // (This would need to track original functions)
    }

    cleanPageUrls() {
        // Clean all links on the page
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
            const originalHref = link.getAttribute('href');
            const cleaned = this.cleanUrl(originalHref);
            if (cleaned !== originalHref) {
                link.setAttribute('href', cleaned);
                link.setAttribute('data-original-url', originalHref);
                link.title = 'URL cleaned for sharing';
            }
        });
        
        // Also clean window location if it has tracking params
        if (window.location.href.includes('utm_') || 
            window.location.href.includes('fbclid') ||
            window.location.href.includes('gclid')) {
            const cleaned = this.cleanUrl(window.location.href);
            if (cleaned !== window.location.href) {
                // Update URL without reloading
                window.history.replaceState({}, document.title, cleaned);
            }
        }
    }

    cleanUrl(url) {
        try {
            // Handle relative URLs
            const absoluteUrl = new URL(url, window.location.origin);
            
            // Remove tracking parameters
            const trackingParams = [
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_term',
                'utm_content', 'fbclid', 'gclid', 'msclkid',
                'ref', 'source', 'campaign', 'medium'
            ];
            
            trackingParams.forEach(param => {
                absoluteUrl.searchParams.delete(param);
            });
            
            return absoluteUrl.toString();
        } catch (e) {
            return url;
        }
    }

    injectSidebar() {
        if (this.sidebarInjected) return;
        
        // Create sidebar container
        const sidebar = document.createElement('div');
        sidebar.id = 'meeting-mode-sidebar';
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <h3>🎯 Meeting Tools</h3>
                <button class="close-sidebar" title="Close sidebar">×</button>
            </div>
            <div class="sidebar-content">
                <div class="timer-section">
                    <div class="timer-display">00:00</div>
                    <div class="timer-controls">
                        <button class="timer-btn start">Start</button>
                        <button class="timer-btn pause">Pause</button>
                        <button class="timer-btn reset">Reset</button>
                    </div>
                </div>
                <div class="agenda-section">
                    <h4>📋 Agenda</h4>
                    <textarea class="agenda-input" placeholder="Meeting notes..."></textarea>
                    <button class="save-agenda">Save</button>
                </div>
                <div class="quick-actions">
                    <button class="action-btn" data-action="clean-url">
                        🔗 Clean URL
                    </button>
                    <button class="action-btn" data-action="extract-actions">
                        📝 Extract Actions
                    </button>
                    <button class="action-btn" data-action="screenshot">
                        📸 Screenshot
                    </button>
                </div>
                <div class="status-indicator">
                    <div class="status-dot"></div>
                    Meeting Mode Active
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = chrome.runtime.getURL('sidebar-styles.css');
        
        document.head.appendChild(style);
        document.body.appendChild(sidebar);
        
        // Add event listeners
        this.setupSidebarEvents(sidebar);
        
        this.sidebarInjected = true;
    }

    setupSidebarEvents(sidebar) {
        // Close button
        sidebar.querySelector('.close-sidebar').addEventListener('click', () => {
            this.removeSidebar();
        });
        
        // Timer buttons
        const timerDisplay = sidebar.querySelector('.timer-display');
        let timerInterval = null;
        let seconds = 0;
        
        sidebar.querySelector('.timer-btn.start').addEventListener('click', () => {
            if (!timerInterval) {
                timerInterval = setInterval(() => {
                    seconds++;
                    const hrs = Math.floor(seconds / 3600);
                    const mins = Math.floor((seconds % 3600) / 60);
                    const secs = seconds % 60;
                    timerDisplay.textContent = 
                        `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                }, 1000);
            }
        });
        
        sidebar.querySelector('.timer-btn.pause').addEventListener('click', () => {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        });
        
        sidebar.querySelector('.timer-btn.reset').addEventListener('click', () => {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            seconds = 0;
            timerDisplay.textContent = '00:00';
        });
        
        // Action buttons
        sidebar.querySelector('[data-action="clean-url"]').addEventListener('click', () => {
            chrome.runtime.sendMessage({
                action: 'cleanUrl'
            });
        });
        
        sidebar.querySelector('[data-action="extract-actions"]').addEventListener('click', () => {
            chrome.runtime.sendMessage({
                action: 'extractActionItems'
            });
        });
        
        sidebar.querySelector('[data-action="screenshot"]').addEventListener('click', () => {
            this.takeScreenshot();
        });
        
        // Save agenda
        sidebar.querySelector('.save-agenda').addEventListener('click', () => {
            const agendaText = sidebar.querySelector('.agenda-input').value;
            chrome.storage.local.set({ meetingAgenda: agendaText });
            
            // Show confirmation
            const btn = sidebar.querySelector('.save-agenda');
            const originalText = btn.textContent;
            btn.textContent = 'Saved!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
    }

    removeSidebar() {
        const sidebar = document.getElementById('meeting-mode-sidebar');
        if (sidebar) {
            sidebar.remove();
        }
        
        // Remove styles
        const styles = document.querySelectorAll('link[href*="sidebar-styles.css"]');
        styles.forEach(style => style.remove());
        
        this.sidebarInjected = false;
    }

    addMeetingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'meeting-mode-indicator';
        indicator.innerHTML = `
            <div class="indicator-content">
                <span class="indicator-icon">🎯</span>
                <span class="indicator-text">Meeting Mode Active</span>
                <button class="indicator-close" title="Deactivate">×</button>
            </div>
        `;
        
        // Add styles inline
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideIn 0.3s ease;
        `;
        
        // Add keyframes for animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            #meeting-mode-indicator .indicator-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            #meeting-mode-indicator .indicator-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
            }
            
            #meeting-mode-indicator .indicator-close:hover {
                background: rgba(255,255,255,0.2);
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(indicator);
        
        // Add close button event
        indicator.querySelector('.indicator-close').addEventListener('click', () => {
            chrome.runtime.sendMessage({
                action: 'toggleMeetingMode',
                data: { enable: false }
            });
        });
        
        // Auto-hide after 5 seconds (but stay on hover)
        setTimeout(() => {
            if (document.body.contains(indicator)) {
                indicator.style.opacity = '0.7';
                indicator.style.transform = 'translateX(calc(100% - 40px))';
                
                indicator.addEventListener('mouseenter', () => {
                    indicator.style.opacity = '1';
                    indicator.style.transform = 'translateX(0)';
                });
                
                indicator.addEventListener('mouseleave', () => {
                    indicator.style.opacity = '0.7';
                    indicator.style.transform = 'translateX(calc(100% - 40px))';
                });
            }
        }, 5000);
    }

    removeMeetingIndicator() {
        const indicator = document.getElementById('meeting-mode-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    injectStyles() {
        const styles = `
            /* Meeting Mode blocked notification styling */
            .meeting-mode-blocked-notification {
                display: none !important;
            }
            
            /* Clean URL tooltip */
            [title="URL cleaned for sharing"] {
                position: relative;
            }
            
            [title="URL cleaned for sharing"]:hover::after {
                content: "✓ Cleaned for sharing";
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: #10b981;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                white-space: nowrap;
                z-index: 1000;
            }
            
            /* Personal content warning */
            .meeting-mode-personal-warning {
                position: fixed;
                top: 50px;
                right: 10px;
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 12px;
                font-size: 12px;
                color: #92400e;
                z-index: 1000;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        styleEl.id = 'meeting-mode-styles';
        document.head.appendChild(styleEl);
    }

    setupObservers() {
        // Observe DOM changes for new notifications
        const observer = new MutationObserver((mutations) => {
            if (!this.meetingActive) return;
            
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        this.checkForNotifications(node);
                        this.checkForPersonalContent(node);
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    checkForNotifications(node) {
        // Check if node is a notification element
        const notificationSelectors = [
            '.notification', '[class*="notification"]',
            '.toast', '[class*="toast"]',
            '.alert', '[class*="alert"]',
            '.snackbar', '[class*="snackbar"]'
        ];
        
        notificationSelectors.forEach(selector => {
            const elements = node.querySelectorAll?.(selector) || [];
            if (node.matches?.(selector)) {
                elements.push(node);
            }
            
            elements.forEach(el => {
                el.style.display = 'none';
                el.classList.add('meeting-mode-blocked-notification');
            });
        });
    }

    checkForPersonalContent(node) {
        if (!this.meetingActive) return;
        
        // Check for personal/social media embeds
        const personalSelectors = [
            'iframe[src*="facebook.com"]',
            'iframe[src*="twitter.com"]',
            'iframe[src*="youtube.com"]',
            'iframe[src*="instagram.com"]',
            'iframe[src*="tiktok.com"]',
            '[data-testid*="facebook"]',
            '[data-testid*="twitter"]',
            '[class*="social-embed"]'
        ];
        
        personalSelectors.forEach(selector => {
            const elements = node.querySelectorAll?.(selector) || [];
            if (node.matches?.(selector)) {
                elements.push(node);
            }
            
            elements.forEach(el => {
                this.showPersonalContentWarning(el);
            });
        });
    }

    showPersonalContentWarning(element) {
        // Don't show duplicate warnings
        if (element.dataset.meetingModeWarned) return;
        element.dataset.meetingModeWarned = 'true';
        
        const warning = document.createElement('div');
        warning.className = 'meeting-mode-personal-warning';
        warning.innerHTML = `
            <strong>⚠️ Personal Content Detected</strong>
            <p>This content is hidden during meetings. It will be restored when Meeting Mode is turned off.</p>
            <button class="dismiss-warning">Dismiss</button>
        `;
        
        // Position near the element
        const rect = element.getBoundingClientRect();
        warning.style.top = `${rect.top + window.scrollY}px`;
        warning.style.left = `${rect.left + window.scrollX}px`;
        
        document.body.appendChild(warning);
        
        // Add dismiss button event
        warning.querySelector('.dismiss-warning').addEventListener('click', () => {
            warning.remove();
        });
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (document.body.contains(warning)) {
                warning.remove();
            }
        }, 10000);
    }

    monitorForPersonalContent() {
        // Initial check
        this.checkForPersonalContent(document.body);
        
        // Monitor scrolling for lazy-loaded content
        window.addEventListener('scroll', () => {
            if (this.meetingActive) {
                this.checkForPersonalContent(document.body);
            }
        });
    }

    extractPageText() {
        // Extract clean text from page for action item extraction
        const clone = document.body.cloneNode(true);
        
        // Remove unwanted elements
        const unwantedSelectors = [
            'script', 'style', 'nav', 'header', 'footer',
            '.ads', '[class*="ad-"]', '.sidebar', '.modal'
        ];
        
        unwantedSelectors.forEach(selector => {
            clone.querySelectorAll(selector).forEach(el => el.remove());
        });
        
        return clone.innerText
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 10000); // Limit length
    }

    takeScreenshot() {
        // This would use the screenshot API
        // For now, we'll send a message to background
        chrome.runtime.sendMessage({
            action: 'takeScreenshot'
        });
    }
}

// Initialize content script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.meetingContentScript = new MeetingContentScript();
    });
} else {
    window.meetingContentScript = new MeetingContentScript();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MeetingContentScript;
}