document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const elements = {
        blockInput: document.getElementById('blockInput'),
        addBlockBtn: document.getElementById('addBlockBtn'),
        blockList: document.getElementById('blockList'),
        blockCount: document.getElementById('blockCount'),
        importBtn: document.getElementById('importBtn'),
        exportBtn: document.getElementById('exportBtn'),
        clearAllBtn: document.getElementById('clearAllBtn')
    };

    // State
    let blockedUrls = [];

    // Initialize
    loadBlockList();

    // Event Listeners
    elements.addBlockBtn.addEventListener('click', addBlockUrl);
    elements.blockInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addBlockUrl();
    });
    elements.importBtn.addEventListener('click', importBlockList);
    elements.exportBtn.addEventListener('click', exportBlockList);
    elements.clearAllBtn.addEventListener('click', clearBlockList);

    // Functions
    function loadBlockList() {
        chrome.storage.local.get({blockedUrls: []}, function(data) {
            blockedUrls = data.blockedUrls;
            renderBlockList();
        });
    }

    function renderBlockList() {
        elements.blockList.innerHTML = '';
        elements.blockCount.textContent = blockedUrls.length;

        if (blockedUrls.length === 0) {
            elements.blockList.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <p>No URLs blocked yet</p>
                    <p style="font-size: var(--font-size-sm); margin-top: var(--space-xs);">
                        Add URLs above to start blocking unsafe websites
                    </p>
                </div>
            `;
            return;
        }

        blockedUrls.forEach((url, index) => {
            const blockItem = document.createElement('div');
            blockItem.className = 'block-item';
            blockItem.innerHTML = `
                <div class="block-info">
                    <div class="block-url">${truncateUrl(url, 50)}</div>
                </div>
                <div class="block-actions">
                    <button class="icon-btn view" title="View URL" data-url="${url}">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                    </button>
                    <button class="icon-btn delete" title="Remove from block list" data-index="${index}">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
            `;

            // Add event listeners for actions
            const deleteBtn = blockItem.querySelector('.delete');
            const viewBtn = blockItem.querySelector('.view');

            deleteBtn.addEventListener('click', () => removeBlockUrl(index));
            viewBtn.addEventListener('click', (e) => {
                const url = e.target.closest('.view').dataset.url;
                window.open(url, '_blank');
            });

            elements.blockList.appendChild(blockItem);
        });
    }

    function addBlockUrl() {
        const url = elements.blockInput.value.trim();
        if (!url) return;

        // Validate URL
        if (!isValidUrl(url) && !isValidDomain(url)) {
            alert('Please enter a valid URL or domain (e.g., https://example.com or example.com)');
            return;
        }

        // Normalize URL
        const normalizedUrl = normalizeUrl(url);

        // Check if already blocked
        if (blockedUrls.includes(normalizedUrl)) {
            alert('This URL is already in the block list');
            return;
        }

        // Add to block list
        blockedUrls.push(normalizedUrl);
        saveBlockList();

        // Clear input
        elements.blockInput.value = '';
        elements.blockInput.focus();

        // Show confirmation
        showNotification(`Added ${truncateUrl(normalizedUrl, 30)} to block list`);
    }

    function removeBlockUrl(index) {
        if (confirm('Remove this URL from block list?')) {
            const removedUrl = blockedUrls[index];
            blockedUrls.splice(index, 1);
            saveBlockList();
            showNotification(`Removed ${truncateUrl(removedUrl, 30)} from block list`);
        }
    }

    function saveBlockList() {
        chrome.storage.local.set({blockedUrls: blockedUrls}, () => {
            renderBlockList();
        });
    }

    function importBlockList() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    if (!Array.isArray(importedData.urls)) {
                        throw new Error('Invalid file format');
                    }

                    if (confirm(`Import ${importedData.urls.length} URLs to block list?`)) {
                        // Merge with existing, avoiding duplicates
                        importedData.urls.forEach(url => {
                            const normalizedUrl = normalizeUrl(url);
                            if (!blockedUrls.includes(normalizedUrl)) {
                                blockedUrls.push(normalizedUrl);
                            }
                        });
                        
                        saveBlockList();
                        showNotification(`Imported ${importedData.urls.length} URLs to block list`);
                    }
                } catch (error) {
                    alert('Error importing block list: Invalid file format');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    function exportBlockList() {
        const exportData = {
            exportedAt: new Date().toISOString(),
            count: blockedUrls.length,
            urls: blockedUrls
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `url-safety-block-list-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('Block list exported successfully');
    }

    function clearBlockList() {
        if (blockedUrls.length === 0) {
            alert('Block list is already empty');
            return;
        }

        if (confirm(`Are you sure you want to clear all ${blockedUrls.length} blocked URLs? This cannot be undone.`)) {
            blockedUrls = [];
            saveBlockList();
            showNotification('Block list cleared');
        }
    }

    // Helper Functions
    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    function isValidDomain(domain) {
        // Simple domain validation
        const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
        return domainRegex.test(domain);
    }

    function normalizeUrl(url) {
        try {
            const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
            return urlObj.href.toLowerCase();
        } catch {
            return url.toLowerCase();
        }
    }

    function truncateUrl(url, maxLength) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength - 3) + '...';
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--theme-header-bg);
            color: var(--text-primary);
            padding: 12px 20px;
            border-radius: var(--border-radius-md);
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
});