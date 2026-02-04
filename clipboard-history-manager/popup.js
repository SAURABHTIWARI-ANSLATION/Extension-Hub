// Clipboard History Manager - Popup Script
document.addEventListener('DOMContentLoaded', function() {
    let clipboardItems = [];
    let filteredItems = [];
    let settings = {
        autoSave: true,
        maxItems: 50,
        notifications: true,
        encryption: false,
        clearOnExit: false
    };

    // Initialize
    init();

    // Initialize function
    async function init() {
        await loadSettings();
        await loadClipboardHistory();
        setupEventListeners();
        renderClipboardList();
        updateStats();
    }

    // Load settings from storage
    async function loadSettings() {
        const data = await chrome.storage.local.get(['clipboardSettings']);
        if (data.clipboardSettings) {
            settings = { ...settings, ...data.clipboardSettings };
            applySettings();
        }
    }

    // Load clipboard history
    async function loadClipboardHistory() {
        const data = await chrome.storage.local.get(['clipboardHistory', 'totalSaves']);
        clipboardItems = data.clipboardHistory || [];
        document.getElementById('totalSaves').textContent = data.totalSaves || 0;
    }

    // Setup event listeners
    function setupEventListeners() {
        // Search
        document.getElementById('searchInput').addEventListener('input', filterItems);
        
        // Filter button
        document.getElementById('filterBtn').addEventListener('click', toggleFilterPanel);
        
        // Filter checkboxes
        document.querySelectorAll('.filter-option input').forEach(checkbox => {
            checkbox.addEventListener('change', filterItems);
        });
        
        // Clear all button
        document.getElementById('clearAllBtn').addEventListener('click', clearAllItems);
        
        // Test copy button
        document.getElementById('testCopyBtn').addEventListener('click', addTestItems);
        
        // Quick action buttons
        document.getElementById('pinModeBtn').addEventListener('click', () => filterByType('pinned'));
        document.getElementById('frequentBtn').addEventListener('click', () => filterByType('frequent'));
        document.getElementById('recentBtn').addEventListener('click', () => filterByType('recent'));
        
        // Settings
        document.getElementById('settingsBtn').addEventListener('click', openSettings);
        document.getElementById('saveSettings').addEventListener('click', saveSettings);
        document.getElementById('resetSettings').addEventListener('click', resetSettings);
        document.querySelector('.close-btn').addEventListener('click', closeSettings);
        
        // Close modal on outside click
        document.getElementById('settingsModal').addEventListener('click', function(e) {
            if (e.target === this) closeSettings();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }

    // Render clipboard items
    function renderClipboardList(items = clipboardItems) {
        const listContainer = document.getElementById('clipboardList');
        const emptyState = document.getElementById('emptyState');
        
        if (items.length === 0) {
            listContainer.innerHTML = '';
            emptyState.classList.add('active');
            return;
        }
        
        emptyState.classList.remove('active');
        listContainer.innerHTML = '';
        
        items.forEach((item, index) => {
            const itemElement = createClipboardItem(item, index);
            listContainer.appendChild(itemElement);
        });
    }

    // Create clipboard item element
    function createClipboardItem(item, index) {
        const div = document.createElement('div');
        div.className = 'clipboard-item';
        div.dataset.index = index;
        
        const typeClass = `type-${item.type || 'text'}`;
        const typeLabel = getTypeLabel(item.type);
        const contentPreview = item.content.length > 150 
            ? item.content.substring(0, 150) + '...' 
            : item.content;
        
        const timeAgo = getTimeAgo(item.timestamp);
        
        div.innerHTML = `
            <div class="clipboard-header">
                <span class="clipboard-type ${typeClass}">${typeLabel}</span>
                <div class="clipboard-actions">
                    <button class="icon-btn small pin-btn" title="${item.pinned ? 'Unpin' : 'Pin'}">
                        <i class="fas${item.pinned ? ' fa-star' : ' fa-star'}"></i>
                    </button>
                    <button class="icon-btn small delete-btn" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="clipboard-content" title="${item.content}">
                ${escapeHtml(contentPreview)}
            </div>
            <div class="clipboard-meta">
                <div class="clipboard-time">
                    <i class="far fa-clock"></i> ${timeAgo}
                </div>
                <div class="clipboard-usage">
                    <i class="fas fa-mouse-pointer"></i> ${item.usageCount || 0}
                </div>
            </div>
        `;
        
        // Add click event to copy AND PASTE
        div.addEventListener('click', async (e) => {
            if (!e.target.closest('.clipboard-actions')) {
                // First copy to clipboard
                await copyToClipboard(item.content);
                incrementUsageCount(index);
                showNotification('Copied to clipboard!');
                
                // Then auto-paste into active text field
                await autoPasteToActiveField(item.content);
                
                // Close popup after 500ms (give time for paste)
                setTimeout(() => window.close(), 500);
            }
        });

        // Auto-paste text into active field
        async function autoPasteToActiveField(text) {
            try {
                // Get the active tab
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                
                // Execute script in active tab to paste the text
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (textToPaste) => {
                        // Find active element
                        const activeElement = document.activeElement;
                        
                        // Check if it's an input field
                        const isInputField = activeElement && 
                            (activeElement.tagName === 'INPUT' || 
                            activeElement.tagName === 'TEXTAREA' ||
                            activeElement.isContentEditable ||
                            activeElement.getAttribute('contenteditable') === 'true');
                        
                        if (isInputField) {
                            // Save current selection
                            const start = activeElement.selectionStart;
                            const end = activeElement.selectionEnd;
                            
                            // Insert text at cursor position
                            const currentValue = activeElement.value || activeElement.textContent || activeElement.innerText;
                            const newValue = currentValue.substring(0, start) + 
                                            textToPaste + 
                                            currentValue.substring(end);
                            
                            // Update field
                            if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
                                activeElement.value = newValue;
                                
                                // Dispatch input event
                                const inputEvent = new Event('input', { bubbles: true });
                                activeElement.dispatchEvent(inputEvent);
                            } else {
                                // For contenteditable
                                activeElement.textContent = newValue;
                                
                                // Dispatch input event
                                const inputEvent = new Event('input', { bubbles: true });
                                activeElement.dispatchEvent(inputEvent);
                            }
                            
                            // Set cursor after pasted text
                            const newCursorPos = start + textToPaste.length;
                            activeElement.setSelectionRange(newCursorPos, newCursorPos);
                            activeElement.focus();
                            
                            return { success: true, pasted: true };
                        }
                        
                        return { success: true, pasted: false };
                    },
                    args: [text]
                });
                
            } catch (error) {
                console.log('Auto-paste failed:', error);
                return { success: false, error: error.message };
            }
        }
                
        // Add pin button event
        const pinBtn = div.querySelector('.pin-btn');
        pinBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePin(index);
        });
        
        // Add delete button event
        const deleteBtn = div.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteItem(index);
        });
        
        return div;
    }

    // Copy text to clipboard
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            
            // Send message to background to update usage
            chrome.runtime.sendMessage({
                action: 'copyItem',
                text: text
            });
            
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        }
    }

    // Filter items based on search and filters
    function filterItems() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const showText = document.getElementById('filterText').checked;
        const showLinks = document.getElementById('filterLinks').checked;
        const showCode = document.getElementById('filterCode').checked;
        const todayOnly = document.getElementById('filterToday').checked;
        
        filteredItems = clipboardItems.filter(item => {
            // Type filter
            if (item.type === 'text' && !showText) return false;
            if (item.type === 'link' && !showLinks) return false;
            if (item.type === 'code' && !showCode) return false;
            
            // Date filter
            if (todayOnly) {
                const today = new Date().toDateString();
                const itemDate = new Date(item.timestamp).toDateString();
                if (itemDate !== today) return false;
            }
            
            // Search filter
            if (searchTerm) {
                return item.content.toLowerCase().includes(searchTerm);
            }
            
            return true;
        });
        
        renderClipboardList(filteredItems);
        updateStats();
    }

    // Toggle filter panel
    function toggleFilterPanel() {
        const panel = document.getElementById('filterPanel');
        panel.classList.toggle('active');
    }

    // Filter by type
    function filterByType(type) {
        // Update active button
        document.querySelectorAll('.action-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        switch(type) {
            case 'pinned':
                filteredItems = clipboardItems.filter(item => item.pinned);
                break;
            case 'frequent':
                filteredItems = [...clipboardItems]
                    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
                    .slice(0, 20);
                break;
            case 'recent':
                filteredItems = [...clipboardItems]
                    .sort((a, b) => b.timestamp - a.timestamp);
                break;
        }
        
        renderClipboardList(filteredItems);
    }

    // Toggle pin
    function togglePin(index) {
        const item = clipboardItems[index];
        item.pinned = !item.pinned;
        saveClipboardHistory();
        renderClipboardList(filteredItems.length > 0 ? filteredItems : clipboardItems);
    }

    // Delete item
    function deleteItem(index) {
        clipboardItems.splice(index, 1);
        saveClipboardHistory();
        renderClipboardList(filteredItems.length > 0 ? filteredItems : clipboardItems);
        updateStats();
        showNotification('Item deleted');
    }

    // Clear all items
    async function clearAllItems() {
        if (confirm('Are you sure you want to clear all clipboard history?')) {
            clipboardItems = [];
            await chrome.storage.local.set({ clipboardHistory: [] });
            renderClipboardList();
            updateStats();
            showNotification('All items cleared');
        }
    }

    // Add test items for demo
    function addTestItems() {
        const testItems = [
            {
                content: 'https://github.com/user/awesome-project',
                type: 'link',
                timestamp: Date.now() - 3600000
            },
            {
                content: 'npm install clipboard-history-manager',
                type: 'code',
                timestamp: Date.now() - 7200000
            },
            {
                content: 'Important meeting at 3 PM tomorrow with the design team',
                type: 'text',
                timestamp: Date.now() - 10800000,
                pinned: true
            },
            {
                content: 'const API_KEY = "sk_test_1234567890";',
                type: 'code',
                timestamp: Date.now() - 14400000
            },
            {
                content: 'https://stackoverflow.com/questions/1234567/how-to-fix-this-issue',
                type: 'link',
                timestamp: Date.now() - 18000000
            }
        ];
        
        clipboardItems = [...testItems, ...clipboardItems].slice(0, settings.maxItems);
        saveClipboardHistory();
        renderClipboardList();
        updateStats();
        showNotification('Demo items added');
    }

    // Increment usage count
    function incrementUsageCount(index) {
        if (clipboardItems[index]) {
            clipboardItems[index].usageCount = (clipboardItems[index].usageCount || 0) + 1;
            clipboardItems[index].lastUsed = Date.now();
            saveClipboardHistory();
        }
    }

    // Update statistics
    function updateStats() {
        const items = filteredItems.length > 0 ? filteredItems : clipboardItems;
        document.getElementById('itemCount').textContent = items.length;
    }

    // Save clipboard history
    async function saveClipboardHistory() {
        await chrome.storage.local.set({ 
            clipboardHistory: clipboardItems 
        });
    }

    // Open settings modal
    function openSettings() {
        const modal = document.getElementById('settingsModal');
        document.getElementById('autoSave').checked = settings.autoSave;
        document.getElementById('maxItems').value = settings.maxItems;
        document.getElementById('notifications').checked = settings.notifications;
        document.getElementById('encryption').checked = settings.encryption;
        document.getElementById('clearOnExit').checked = settings.clearOnExit;
        modal.classList.add('active');
    }

    // Close settings modal
    function closeSettings() {
        document.getElementById('settingsModal').classList.remove('active');
    }

    // Save settings
    async function saveSettings() {
        settings.autoSave = document.getElementById('autoSave').checked;
        settings.maxItems = parseInt(document.getElementById('maxItems').value);
        settings.notifications = document.getElementById('notifications').checked;
        settings.encryption = document.getElementById('encryption').checked;
        settings.clearOnExit = document.getElementById('clearOnExit').checked;
        
        await chrome.storage.local.set({ clipboardSettings: settings });
        applySettings();
        closeSettings();
        showNotification('Settings saved');
    }

    // Reset settings
    function resetSettings() {
        settings = {
            autoSave: true,
            maxItems: 50,
            notifications: true,
            encryption: false,
            clearOnExit: false
        };
        
        document.getElementById('autoSave').checked = true;
        document.getElementById('maxItems').value = 50;
        document.getElementById('notifications').checked = true;
        document.getElementById('encryption').checked = false;
        document.getElementById('clearOnExit').checked = false;
    }

    // Apply settings
    function applySettings() {
        // Trim items if maxItems changed
        if (clipboardItems.length > settings.maxItems) {
            clipboardItems = clipboardItems.slice(0, settings.maxItems);
            saveClipboardHistory();
            renderClipboardList();
        }
    }

    // Show notification
    function showNotification(message) {
        if (!settings.notifications) return;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(79, 195, 247, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Handle keyboard shortcuts
    function handleKeyboardShortcuts(e) {
        // Ctrl+F to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        
        // Escape to close
        if (e.key === 'Escape') {
            if (document.getElementById('settingsModal').classList.contains('active')) {
                closeSettings();
            } else {
                window.close();
            }
        }
    }

    // Utility functions
    function getTypeLabel(type) {
        const labels = {
            'text': 'Text',
            'link': 'Link',
            'code': 'Code',
            'image': 'Image'
        };
        return labels[type] || 'Text';
    }

    function getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});