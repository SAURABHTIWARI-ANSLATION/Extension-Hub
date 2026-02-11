class MeetingSidebar {
    constructor() {
        this.timer = {
            running: false,
            seconds: 0,
            interval: null
        };
        this.actionItems = [];
        this.init();
    }

    init() {
        this.loadAgenda();
        this.loadActionItems();
        this.setupEventListeners();
        this.updateTimerDisplay();
        console.log('Meeting Sidebar initialized');
    }

    setupEventListeners() {
        // Timer buttons
        document.getElementById('startTimer').addEventListener('click', () => {
            this.startTimer();
        });

        document.getElementById('pauseTimer').addEventListener('click', () => {
            this.pauseTimer();
        });

        document.getElementById('resetTimer').addEventListener('click', () => {
            this.resetTimer();
        });

        // Agenda buttons
        document.getElementById('saveAgenda').addEventListener('click', () => {
            this.saveAgenda();
        });

        document.getElementById('clearAgenda').addEventListener('click', () => {
            this.clearAgenda();
        });

        // Action items
        document.getElementById('extractActions').addEventListener('click', () => {
            this.extractActionItems();
        });

        // Quick actions
        document.getElementById('cleanUrlBtn').addEventListener('click', () => {
            this.cleanCurrentUrl();
        });

        document.getElementById('screenshotBtn').addEventListener('click', () => {
            this.takeScreenshot();
        });

        document.getElementById('hideTabsBtn').addEventListener('click', () => {
            this.hidePersonalTabs();
        });

        // End meeting button
        document.getElementById('endMeetingBtn').addEventListener('click', () => {
            this.endMeeting();
        });

        // Auto-save agenda on change
        document.getElementById('agendaText').addEventListener('input', () => {
            this.debouncedSave();
        });

        // Listen for messages from content script
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'updateActionItems') {
                this.addActionItems(request.items);
                sendResponse({ success: true });
            }
            return true;
        });
    }

    startTimer() {
        if (!this.timer.running) {
            this.timer.running = true;
            this.timer.interval = setInterval(() => {
                this.timer.seconds++;
                this.updateTimerDisplay();
                
                // Every minute, check for meeting end
                if (this.timer.seconds % 60 === 0) {
                    this.checkMeetingProgress();
                }
            }, 1000);
            
            document.getElementById('startTimer').textContent = 'Running';
            document.getElementById('startTimer').style.background = '#059669';
        }
    }

    pauseTimer() {
        if (this.timer.running) {
            this.timer.running = false;
            clearInterval(this.timer.interval);
            this.timer.interval = null;
            
            document.getElementById('startTimer').textContent = 'Start';
            document.getElementById('startTimer').style.background = '';
        }
    }

    resetTimer() {
        this.pauseTimer();
        this.timer.seconds = 0;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const hours = Math.floor(this.timer.seconds / 3600);
        const minutes = Math.floor((this.timer.seconds % 3600) / 60);
        const seconds = this.timer.seconds % 60;
        
        document.getElementById('timerDisplay').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    async loadAgenda() {
        const data = await chrome.storage.local.get(['meetingAgenda']);
        if (data.meetingAgenda) {
            document.getElementById('agendaText').value = data.meetingAgenda;
        }
    }

    async saveAgenda() {
        const agendaText = document.getElementById('agendaText').value;
        await chrome.storage.local.set({ meetingAgenda: agendaText });
        
        // Show confirmation
        const btn = document.getElementById('saveAgenda');
        const originalText = btn.textContent;
        btn.textContent = 'Saved!';
        btn.style.background = '#059669';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }

    clearAgenda() {
        if (confirm('Clear all agenda items?')) {
            document.getElementById('agendaText').value = '';
            chrome.storage.local.remove(['meetingAgenda']);
        }
    }

    debouncedSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(() => {
            this.saveAgenda();
        }, 1000);
    }

    async loadActionItems() {
        const data = await chrome.storage.local.get(['actionItems']);
        if (data.actionItems) {
            this.actionItems = data.actionItems;
            this.renderActionItems();
        }
    }

    renderActionItems() {
        const container = document.getElementById('actionItems');
        container.innerHTML = '';
        
        this.actionItems.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'action-item';
            li.innerHTML = `
                <input type="checkbox" class="action-checkbox" 
                       ${item.completed ? 'checked' : ''}
                       data-index="${index}">
                <span class="action-text" style="
                    text-decoration: ${item.completed ? 'line-through' : 'none'};
                    opacity: ${item.completed ? '0.6' : '1'};
                ">${item.text}</span>
                <button class="delete-action" data-index="${index}" 
                        style="background: none; border: none; color: #ef4444; cursor: pointer;">×</button>
            `;
            container.appendChild(li);
        });
        
        // Add event listeners for checkboxes
        container.querySelectorAll('.action-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.toggleActionItem(index);
            });
        });
        
        // Add event listeners for delete buttons
        container.querySelectorAll('.delete-action').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.deleteActionItem(index);
            });
        });
    }

    async extractActionItems() {
        try {
            // Send message to content script to extract action items
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab) {
                const response = await chrome.tabs.sendMessage(tab.id, {
                    action: 'extractText'
                });
                
                if (response?.text) {
                    this.parseActionItems(response.text);
                }
            }
        } catch (error) {
            console.error('Failed to extract action items:', error);
            alert('Could not extract action items from this page.');
        }
    }

    parseActionItems(text) {
        // Simple parsing logic - can be enhanced with NLP
        const sentences = text.split(/[.!?]+/);
        const actionKeywords = [
            'todo:', 'to do:', 'action:', 'need to', 'will',
            'should', 'must', 'requires', 'assign', 'follow up',
            'next step', 'action item', 'task:'
        ];
        
        const newItems = sentences
            .filter(sentence => {
                const lower = sentence.toLowerCase().trim();
                return actionKeywords.some(keyword => lower.includes(keyword)) &&
                       lower.length > 10 && lower.length < 200;
            })
            .map(sentence => ({
                text: sentence.trim(),
                completed: false,
                timestamp: new Date().toISOString(),
                source: 'extracted'
            }))
            .slice(0, 10); // Limit to 10 items
        
        this.actionItems = [...this.actionItems, ...newItems];
        this.saveActionItems();
        this.renderActionItems();
        
        if (newItems.length > 0) {
            alert(`Found ${newItems.length} action items!`);
        } else {
            alert('No action items found in page content.');
        }
    }

    toggleActionItem(index) {
        if (this.actionItems[index]) {
            this.actionItems[index].completed = !this.actionItems[index].completed;
            this.saveActionItems();
            this.renderActionItems();
        }
    }

    deleteActionItem(index) {
        this.actionItems.splice(index, 1);
        this.saveActionItems();
        this.renderActionItems();
    }

    addActionItems(items) {
        const newItems = items.map(text => ({
            text: text,
            completed: false,
            timestamp: new Date().toISOString(),
            source: 'manual'
        }));
        
        this.actionItems = [...this.actionItems, ...newItems];
        this.saveActionItems();
        this.renderActionItems();
    }

    async saveActionItems() {
        await chrome.storage.local.set({ actionItems: this.actionItems });
    }

    async cleanCurrentUrl() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab) {
                await chrome.runtime.sendMessage({
                    action: 'cleanUrl',
                    tabId: tab.id
                });
                
                alert('URL cleaned for sharing!');
            }
        } catch (error) {
            console.error('Failed to clean URL:', error);
            alert('Could not clean URL.');
        }
    }

    async takeScreenshot() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab) {
                // This requires additional permissions
                alert('Screenshot feature requires additional permissions. Check extension settings.');
                
                // Alternative: Use content script to capture visible area
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'takeScreenshot'
                });
            }
        } catch (error) {
            console.error('Failed to take screenshot:', error);
        }
    }

    async hidePersonalTabs() {
        try {
            await chrome.runtime.sendMessage({
                action: 'hidePersonalTabs'
            });
            
            alert('Personal tabs hidden!');
        } catch (error) {
            console.error('Failed to hide tabs:', error);
        }
    }

    async endMeeting() {
        if (confirm('End meeting and restore all tabs?')) {
            try {
                await chrome.runtime.sendMessage({
                    action: 'toggleMeetingMode',
                    data: { enable: false }
                });
                
                // Close sidebar
                window.close();
            } catch (error) {
                console.error('Failed to end meeting:', error);
            }
        }
    }

    checkMeetingProgress() {
        // Calculate meeting progress
        const minutes = Math.floor(this.timer.seconds / 60);
        
        // Show time check notification every 15 minutes
        if (minutes > 0 && minutes % 15 === 0) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #3b82f6;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                animation: slideUp 0.3s ease;
            `;
            notification.textContent = `Meeting in progress: ${minutes} minutes`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
        
        // Auto-extract action items at 30 minutes
        if (minutes === 30) {
            this.extractActionItems();
        }
    }
}

// Initialize sidebar
document.addEventListener('DOMContentLoaded', () => {
    window.meetingSidebar = new MeetingSidebar();
});

// Handle window close
window.addEventListener('beforeunload', () => {
    if (window.meetingSidebar?.timer?.running) {
        return 'Meeting timer is still running. Are you sure you want to close?';
    }
});