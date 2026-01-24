// Tab Manager Pro - Main JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const tabCountEl = document.getElementById('tabCount');
    const windowCountEl = document.getElementById('windowCount');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const tabsContainer = document.getElementById('tabsContainer');
    const emptyState = document.getElementById('emptyState');
    const selectionActions = document.getElementById('selectionActions');
    const selectedCountEl = document.getElementById('selectedCount');
    const sortSelect = document.getElementById('sortBy');
    const selectAllBtn = document.getElementById('selectAll');
    
    // Action Buttons
    const closeDuplicatesBtn = document.getElementById('closeDuplicates');
    const groupByDomainBtn = document.getElementById('groupByDomain');
    const suspendInactiveBtn = document.getElementById('suspendInactive');
    const closeAllBtn = document.getElementById('closeAll');
    const saveSessionBtn = document.getElementById('saveSession');
    const muteAllBtn = document.getElementById('muteAll');
    
    // Selection Actions
    const closeSelectedBtn = document.getElementById('closeSelected');
    const groupSelectedBtn = document.getElementById('groupSelected');
    const pinSelectedBtn = document.getElementById('pinSelected');
    const clearSelectionBtn = document.getElementById('clearSelection');
    
    // Stats
    const memoryUsageEl = document.getElementById('memoryUsage');
    const cpuImpactEl = document.getElementById('cpuImpact');
    const potentialSavingsEl = document.getElementById('potentialSavings');
    const lastUpdatedEl = document.getElementById('lastUpdated');
    
    // Modals
    const loadingOverlay = document.getElementById('loadingOverlay');
    const confirmModal = document.getElementById('confirmModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalConfirm = document.getElementById('modalConfirm');
    const modalCancel = document.getElementById('modalCancel');
    
    // Footer Buttons
    const openDashboardBtn = document.getElementById('openDashboard');
    const settingsBtn = document.getElementById('settingsBtn');
    
    // State
    let allTabs = [];
    let filteredTabs = [];
    let selectedTabIds = new Set();
    let currentFilter = 'all';
    let currentSort = 'title';
    let confirmedAction = null; // MOVED HERE - Fix for error
    
    // Initialize
    loadTabs();
    updateLastUpdated();
    
    // Event Listeners
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', filterTabs);
    }
    
    // Clear search button - FIX: Check if element exists
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            if (searchInput) {
                searchInput.value = '';
                filterTabs();
            }
        });
    }
    
    // Filter buttons
    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                filterButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                filterTabs();
            });
        });
    }
    
    // Sort functionality
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            sortTabs();
            renderTabs();
        });
    }
    
    // Select all - Check if exists
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', toggleSelectAll);
    }
    
    // Quick Actions - Check if exists before adding listeners
    if (closeDuplicatesBtn) {
        closeDuplicatesBtn.addEventListener('click', closeDuplicateTabs);
    }
    
    if (groupByDomainBtn) {
        groupByDomainBtn.addEventListener('click', groupTabsByDomain);
    }
    
    if (suspendInactiveBtn) {
        suspendInactiveBtn.addEventListener('click', suspendInactiveTabs);
    }
    
    if (closeAllBtn) {
        closeAllBtn.addEventListener('click', () => showConfirm('Close All Tabs', 'Are you sure you want to close ALL tabs?', closeAllTabs));
    }
    
    if (saveSessionBtn) {
        saveSessionBtn.addEventListener('click', saveCurrentSession);
    }
    
    if (muteAllBtn) {
        muteAllBtn.addEventListener('click', toggleMuteAllTabs);
    }
    
    // Selection Actions - Check if exists
    if (closeSelectedBtn) {
        closeSelectedBtn.addEventListener('click', () => {
            if (selectedTabIds.size > 0) {
                showConfirm('Close Selected Tabs', `Close ${selectedTabIds.size} selected tabs?`, closeSelectedTabs);
            }
        });
    }
    
    if (groupSelectedBtn) {
        groupSelectedBtn.addEventListener('click', groupSelectedTabs);
    }
    
    if (pinSelectedBtn) {
        pinSelectedBtn.addEventListener('click', pinSelectedTabs);
    }
    
    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', clearSelection);
    }
    
    // Modal - Check if exists
    if (modalConfirm && modalCancel) {
        modalConfirm.addEventListener('click', executeConfirmedAction);
        modalCancel.addEventListener('click', hideModal);
    }
    
    // Footer buttons - Check if exists
    if (openDashboardBtn) {
        openDashboardBtn.addEventListener('click', function() {
            // Check if dashboard.html exists
            chrome.runtime.getPackageDirectoryEntry(function(root) {
                root.getFile('dashboard.html', {}, function(fileEntry) {
                    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
                }, function() {
                    // dashboard.html doesn't exist
                    alert('Dashboard feature coming soon!');
                });
            });
        });
    }
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            alert('Settings feature coming soon!');
        });
    }
    
    // Tab update listeners
    chrome.tabs.onCreated.addListener(handleTabChange);
    chrome.tabs.onRemoved.addListener(handleTabChange);
    chrome.tabs.onUpdated.addListener(handleTabChange);
    
    // Functions
    
    function loadTabs() {
        showLoading(true);
        
        chrome.tabs.query({}, function(tabs) {
            allTabs = tabs;
            filteredTabs = [...allTabs];
            
            updateStats();
            filterTabs();
            sortTabs();
            renderTabs();
            
            showLoading(false);
        });
    }
    
    function handleTabChange() {
        loadTabs();
    }
    
    function filterTabs() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        
        filteredTabs = allTabs.filter(tab => {
            // Apply search filter
            const matchesSearch = !searchTerm || 
                (tab.title && tab.title.toLowerCase().includes(searchTerm)) || 
                (tab.url && tab.url.toLowerCase().includes(searchTerm));
            
            // Apply type filter
            let matchesFilter = true;
            switch(currentFilter) {
                case 'pinned':
                    matchesFilter = tab.pinned;
                    break;
                case 'audio':
                    matchesFilter = tab.audible;
                    break;
                case 'duplicate':
                    // Find duplicates based on URL
                    try {
                        const url = new URL(tab.url).hostname;
                        const duplicateCount = allTabs.filter(t => {
                            try {
                                return new URL(t.url).hostname === url;
                            } catch {
                                return false;
                            }
                        }).length;
                        matchesFilter = duplicateCount > 1;
                    } catch (e) {
                        matchesFilter = false;
                    }
                    break;
            }
            
            return matchesSearch && matchesFilter;
        });
        
        renderTabs();
    }
    
    function sortTabs() {
        filteredTabs.sort((a, b) => {
            switch(currentSort) {
                case 'title':
                    return (a.title || '').localeCompare(b.title || '');
                case 'domain':
                    try {
                        const domainA = new URL(a.url).hostname;
                        const domainB = new URL(b.url).hostname;
                        return domainA.localeCompare(domainB);
                    } catch {
                        return 0;
                    }
                case 'recent':
                    return b.id - a.id; // Higher ID = more recent
                case 'oldest':
                    return a.id - b.id;
                default:
                    return 0;
            }
        });
    }
    
    function renderTabs() {
        if (!tabsContainer) return;
        
        tabsContainer.innerHTML = '';
        
        if (filteredTabs.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        filteredTabs.forEach(tab => {
            const tabElement = createTabElement(tab);
            tabsContainer.appendChild(tabElement);
        });
        
        updateSelectionUI();
    }
    
    function createTabElement(tab) {
        const div = document.createElement('div');
        div.className = 'tab-item';
        div.dataset.tabId = tab.id;
        
        if (selectedTabIds.has(tab.id)) {
            div.classList.add('selected');
        }
        
        if (tab.pinned) div.classList.add('tab-pinned');
        if (tab.audible) div.classList.add('tab-audio');
        
        let domain = '';
        try {
            const url = new URL(tab.url);
            domain = url.hostname;
        } catch (e) {
            domain = 'invalid-url';
        }
        
        div.innerHTML = `
            <div class="tab-checkbox">
                <input type="checkbox" ${selectedTabIds.has(tab.id) ? 'checked' : ''}>
            </div>
            <img src="${tab.favIconUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOCAxLjMzM0EzLjMzMyAzLjMzMyAwIDEgMSAxLjMzMyA0LjY2NiAzLjMzMyAzLjMzMyAwIDAgMSA4IDEuMzMzem0wMTIuNjY3QTQuNjY3IDQuNjY3IDAgMSAwIDE1LjMzMyA4IDQuNjY3IDQuNjY3IDAgMCAwIDggMTIuNjY3em0wIDBhNC42NjcgNC42NjcgMCAxIDAgNC42NjctNC42NjdBNC42NjcgNC42NjcgMCAwIDAgOCAxMi42Njd6IiBmaWxsPSIjNzE4MDk2Ii8+PC9zdmc+'}" 
                 class="tab-favicon" alt="Favicon">
            <div class="tab-info">
                <div class="tab-title" title="${tab.title || 'No title'}">
                    ${tab.title || 'No title'}
                </div>
                <div class="tab-url" title="${tab.url || ''}">
                    ${domain}
                </div>
                <div class="tab-meta">
                    ${tab.pinned ? '<span>Pinned</span>' : ''}
                    ${tab.audible ? '<span>Audio</span>' : ''}
                    <span>${domain}</span>
                </div>
            </div>
            <div class="tab-actions">
                <button class="tab-action-btn" title="Close tab" data-action="close">
                    <i class="fas fa-times"></i>
                </button>
                <button class="tab-action-btn" title="${tab.mutedInfo ? 'Unmute' : 'Mute'}" data-action="mute">
                    <i class="fas ${tab.mutedInfo ? 'fa-volume-mute' : 'fa-volume-up'}"></i>
                </button>
                <button class="tab-action-btn" title="${tab.pinned ? 'Unpin' : 'Pin'}" data-action="pin">
                    <i class="fas fa-thumbtack"></i>
                </button>
            </div>
        `;
        
        // Add event listeners
        const checkbox = div.querySelector('.tab-checkbox input');
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    selectedTabIds.add(tab.id);
                    div.classList.add('selected');
                } else {
                    selectedTabIds.delete(tab.id);
                    div.classList.remove('selected');
                }
                updateSelectionUI();
            });
        }
        
        // Tab click (selects tab)
        div.addEventListener('click', function(e) {
            if (!e.target.closest('.tab-checkbox') && !e.target.closest('.tab-actions')) {
                chrome.tabs.update(tab.id, { active: true });
                chrome.windows.update(tab.windowId, { focused: true });
            }
        });
        
        // Action buttons
        div.querySelectorAll('.tab-action-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const action = this.dataset.action;
                
                switch(action) {
                    case 'close':
                        chrome.tabs.remove(tab.id);
                        break;
                    case 'mute':
                        chrome.tabs.update(tab.id, { muted: !tab.mutedInfo });
                        break;
                    case 'pin':
                        chrome.tabs.update(tab.id, { pinned: !tab.pinned });
                        break;
                }
            });
        });
        
        return div;
    }
    
    function toggleSelectAll() {
        const checkboxes = document.querySelectorAll('.tab-checkbox input');
        if (checkboxes.length === 0) return;
        
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
            const tabElement = cb.closest('.tab-item');
            if (tabElement) {
                const tabId = parseInt(tabElement.dataset.tabId);
                
                if (!allChecked) {
                    selectedTabIds.add(tabId);
                    tabElement.classList.add('selected');
                } else {
                    selectedTabIds.delete(tabId);
                    tabElement.classList.remove('selected');
                }
            }
        });
        
        updateSelectionUI();
    }
    
    function updateSelectionUI() {
        if (!selectionActions || !selectedCountEl) return;
        
        const count = selectedTabIds.size;
        selectedCountEl.textContent = `${count} tab${count !== 1 ? 's' : ''} selected`;
        
        if (count > 0) {
            selectionActions.classList.add('show');
        } else {
            selectionActions.classList.remove('show');
        }
    }
    
    function clearSelection() {
        selectedTabIds.clear();
        document.querySelectorAll('.tab-checkbox input').forEach(cb => {
            cb.checked = false;
            const tabElement = cb.closest('.tab-item');
            if (tabElement) {
                tabElement.classList.remove('selected');
            }
        });
        updateSelectionUI();
    }
    
    // Quick Actions Functions
    
    async function closeDuplicateTabs() {
        showLoading(true);
        
        const urlMap = new Map();
        const duplicates = [];
        
        // Find duplicates by URL
        allTabs.forEach(tab => {
            try {
                const normalizedUrl = normalizeUrl(tab.url);
                if (urlMap.has(normalizedUrl)) {
                    duplicates.push(tab.id);
                } else {
                    urlMap.set(normalizedUrl, tab.id);
                }
            } catch (e) {
                // Skip invalid URLs
            }
        });
        
        if (duplicates.length === 0) {
            showNotification('No duplicate tabs found!');
            showLoading(false);
            return;
        }
        
        // Close duplicate tabs
        try {
            await chrome.tabs.remove(duplicates);
            showNotification(`Closed ${duplicates.length} duplicate tabs`);
        } catch (error) {
            showNotification('Error closing duplicates');
        }
        
        loadTabs();
    }
    
    function normalizeUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname + urlObj.pathname;
        } catch {
            return url;
        }
    }
    
    async function groupTabsByDomain() {
        showLoading(true);
        
        // Group tabs by domain
        const domainMap = new Map();
        
        filteredTabs.forEach(tab => {
            try {
                const url = new URL(tab.url);
                const domain = url.hostname;
                
                if (!domainMap.has(domain)) {
                    domainMap.set(domain, []);
                }
                domainMap.get(domain).push(tab.id);
            } catch (e) {
                // Invalid URL, skip
            }
        });
        
        // Create groups for domains with multiple tabs
        let groupsCreated = 0;
        
        for (const [domain, tabIds] of domainMap.entries()) {
            if (tabIds.length > 1) {
                try {
                    const groupId = await chrome.tabs.group({ tabIds });
                    await chrome.tabGroups.update(groupId, { 
                        title: domain, 
                        color: getRandomColor() 
                    });
                    groupsCreated++;
                } catch (error) {
                    console.error('Error grouping tabs:', error);
                }
            }
        }
        
        if (groupsCreated > 0) {
            showNotification(`Created ${groupsCreated} tab groups`);
        } else {
            showNotification('No tabs to group');
        }
        
        showLoading(false);
        loadTabs();
    }
    
    function getRandomColor() {
        const colors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    function suspendInactiveTabs() {
        // This would require a background script with tab discarding API
        showNotification('Tab suspension requires additional permissions and background script.');
        // Implementation would use chrome.tabs.discard()
    }
    
    function closeAllTabs() {
        showLoading(true);
        
        // Close all tabs except current one
        const tabIds = filteredTabs.map(tab => tab.id);
        
        if (tabIds.length === 0) {
            showNotification('No tabs to close');
            showLoading(false);
            return;
        }
        
        chrome.tabs.remove(tabIds, function() {
            showNotification(`Closed ${tabIds.length} tabs`);
            showLoading(false);
            loadTabs();
        });
    }
    
    function saveCurrentSession() {
        const session = {
            timestamp: Date.now(),
            tabs: filteredTabs.map(tab => ({
                url: tab.url,
                title: tab.title,
                pinned: tab.pinned
            }))
        };
        
        chrome.storage.local.set({ 
            lastSession: session,
            [`session_${Date.now()}`]: session 
        }, function() {
            showNotification('Session saved successfully!');
        });
    }
    
    function toggleMuteAllTabs() {
        const muteState = !allTabs.some(tab => tab.audible && !tab.mutedInfo);
        
        allTabs.forEach(tab => {
            if (tab.audible) {
                chrome.tabs.update(tab.id, { muted: muteState });
            }
        });
        
        showNotification(muteState ? 'All tabs muted' : 'All tabs unmuted');
        loadTabs();
    }
    
    // Selection Actions Functions
    
    function closeSelectedTabs() {
        showLoading(true);
        
        if (selectedTabIds.size === 0) {
            showNotification('No tabs selected');
            showLoading(false);
            return;
        }
        
        chrome.tabs.remove(Array.from(selectedTabIds), function() {
            showNotification(`Closed ${selectedTabIds.size} tabs`);
            selectedTabIds.clear();
            showLoading(false);
            loadTabs();
        });
    }
    
    function groupSelectedTabs() {
        if (selectedTabIds.size < 2) {
            showNotification('Select at least 2 tabs to group');
            return;
        }
        
        showLoading(true);
        
        chrome.tabs.group({ tabIds: Array.from(selectedTabIds) }, function(groupId) {
            if (chrome.runtime.lastError) {
                showNotification('Error grouping tabs');
                showLoading(false);
                return;
            }
            
            chrome.tabGroups.update(groupId, { 
                title: `${selectedTabIds.size} tabs`, 
                color: 'blue' 
            });
            
            showNotification(`Grouped ${selectedTabIds.size} tabs`);
            selectedTabIds.clear();
            showLoading(false);
            loadTabs();
        });
    }
    
    function pinSelectedTabs() {
        if (selectedTabIds.size === 0) {
            showNotification('No tabs selected');
            return;
        }
        
        const pinState = !Array.from(selectedTabIds).every(id => {
            const tab = allTabs.find(t => t.id === id);
            return tab?.pinned;
        });
        
        selectedTabIds.forEach(id => {
            chrome.tabs.update(id, { pinned: pinState });
        });
        
        showNotification(`${pinState ? 'Pinned' : 'Unpinned'} ${selectedTabIds.size} tabs`);
        selectedTabIds.clear();
        loadTabs();
    }
    
    // Stats Functions
    
    function updateStats() {
        if (!tabCountEl || !windowCountEl || !memoryUsageEl || !cpuImpactEl || !potentialSavingsEl) {
            return;
        }
        
        // Update counts
        tabCountEl.textContent = allTabs.length;
        
        // Count unique windows
        const windowIds = new Set(allTabs.map(tab => tab.windowId));
        windowCountEl.textContent = windowIds.size;
        
        // Calculate estimated memory (rough estimate: 50-100MB per tab)
        const estimatedMemory = Math.round(allTabs.length * 75);
        memoryUsageEl.textContent = `${estimatedMemory} MB`;
        
        // CPU impact (rough estimate)
        const cpuImpact = allTabs.length < 10 ? 'Low' : 
                         allTabs.length < 30 ? 'Medium' : 'High';
        cpuImpactEl.textContent = cpuImpact;
        
        // Potential savings (if duplicates are closed)
        const duplicates = findDuplicateCount();
        const potentialSavings = Math.round(duplicates * 75);
        potentialSavingsEl.textContent = `${potentialSavings} MB`;
    }
    
    function findDuplicateCount() {
        const urlMap = new Map();
        let duplicateCount = 0;
        
        allTabs.forEach(tab => {
            try {
                const normalizedUrl = normalizeUrl(tab.url);
                if (urlMap.has(normalizedUrl)) {
                    duplicateCount++;
                } else {
                    urlMap.set(normalizedUrl, true);
                }
            } catch (e) {
                // Skip invalid URLs
            }
        });
        
        return duplicateCount;
    }
    
    function updateLastUpdated() {
        if (!lastUpdatedEl) return;
        
        const now = new Date();
        lastUpdatedEl.textContent = now.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    // Modal Functions
    
    function showConfirm(title, message, action) {
        if (!modalTitle || !modalMessage || !confirmModal) {
            // If modal doesn't exist, just execute the action
            if (typeof action === 'function') {
                action();
            }
            return;
        }
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        confirmedAction = action;
        confirmModal.style.display = 'flex';
    }
    
    function hideModal() {
        if (confirmModal) {
            confirmModal.style.display = 'none';
            confirmedAction = null;
        }
    }
    
    function executeConfirmedAction() {
        if (confirmedAction && typeof confirmedAction === 'function') {
            confirmedAction();
        }
        hideModal();
    }
    
    // UI Helper Functions
    
    function showLoading(show) {
        if (!loadingOverlay) return;
        
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
    
    function showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
                if (style.parentNode) {
                    style.remove();
                }
            }, 300);
        }, 3000);
    }
});