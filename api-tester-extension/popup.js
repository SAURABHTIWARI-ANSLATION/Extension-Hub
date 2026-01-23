// ============================================
// API TESTER PRO - ENHANCED WITH THEME SYSTEM
// ============================================

// Theme management and settings
let extensionSettings = {
    theme: 'ocean-blue',
    autoFormat: true,
    showResponseTime: true,
    autoCopy: false,
    historyLimit: 20,
    requestTimeout: 60,
    defaultContentType: 'application/json'
};

let requestHistory = [];
let currentResponse = null;
let abortController = null;

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const methodSelect = document.getElementById('method');
    const urlInput = document.getElementById('url');
    const sendBtn = document.getElementById('send');
    const headersContainer = document.getElementById('headersContainer');
    const addHeaderBtn = document.getElementById('addHeader');
    const toggleHeadersBtn = document.getElementById('toggleHeaders');
    const toggleBodyBtn = document.getElementById('toggleBody');
    const bodyContainer = document.getElementById('bodyContainer');
    const bodyTypeSelect = document.getElementById('bodyType');
    const requestBody = document.getElementById('requestBody');
    const statusCode = document.getElementById('statusCode');
    const statusText = document.getElementById('statusText');
    const responseTime = document.getElementById('responseTime');
    const responseSize = document.getElementById('responseSize');
    const responseBody = document.getElementById('responseBody');
    const responseHeaders = document.getElementById('responseHeaders');
    const rawResponse = document.getElementById('rawResponse');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const formatJsonBtn = document.getElementById('formatJson');
    const copyResponseBtn = document.getElementById('copyResponse');
    const clearResponseBtn = document.getElementById('clearResponse');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistory');
    const loadingOverlay = document.getElementById('loading');
    const settingsBtn = document.getElementById('settingsBtn');
    
    // Initialize
    loadExtensionSettings();
    loadHistory();
    updateBodyVisibility();
    
    // Event Listeners
    
    // Send Request
    sendBtn.addEventListener('click', sendRequest);
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendRequest();
    });
    
    // Method change updates body visibility
    methodSelect.addEventListener('change', updateBodyVisibility);
    
    // Toggle sections
    toggleHeadersBtn.addEventListener('click', function() {
        toggleSection(headersContainer, this);
    });
    
    toggleBodyBtn.addEventListener('click', function() {
        toggleSection(bodyContainer, this);
    });
    
    // Add header row
    addHeaderBtn.addEventListener('click', addHeaderRow);
    
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Response actions
    formatJsonBtn.addEventListener('click', formatJsonResponse);
    copyResponseBtn.addEventListener('click', copyResponse);
    clearResponseBtn.addEventListener('click', clearResponse);
    
    // History
    clearHistoryBtn.addEventListener('click', clearHistory);
    
    // Settings button
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            chrome.runtime.openOptionsPage();
        });
    }
    
    // Listen for settings updates
    chrome.runtime.onMessage.addListener(function(message) {
        if (message.action === 'settingsUpdated') {
            extensionSettings = message.settings;
            applyTheme(extensionSettings.theme);
            updateUIWithSettings();
        }
    });
    
    // Functions
    
    // Theme and Settings Functions
    function loadExtensionSettings() {
        chrome.storage.local.get(['extensionSettings'], function(result) {
            if (result.extensionSettings) {
                extensionSettings = {...extensionSettings, ...result.extensionSettings};
                applyTheme(extensionSettings.theme);
                updateUIWithSettings();
            }
        });
    }
    
    function applyTheme(themeName) {
        document.body.setAttribute('data-theme', themeName);
        
        // Update theme indicator
        const themeNames = {
            'ocean-blue': 'Ocean Blue',
            'mint-teal': 'Mint Teal', 
            'indigo-night': 'Indigo Night',
            'sky-gradient': 'Sky Gradient',
            'violet-glow': 'Violet Glow'
        };
        
        const themeColors = {
            'ocean-blue': '#2196F3',
            'mint-teal': '#14B8A6',
            'indigo-night': '#6366F1',
            'sky-gradient': '#38BDF8',
            'violet-glow': '#8B5CF6'
        };
        
        const indicator = document.querySelector('.theme-indicator');
        if (indicator) {
            indicator.querySelector('.theme-name').textContent = themeNames[themeName];
            indicator.querySelector('.theme-dot').style.background = themeColors[themeName];
        }
    }
    
    function updateUIWithSettings() {
        // Update default Content-Type header if it exists
        const contentTypeInput = document.querySelector('.header-value[value="application/json"]');
        if (contentTypeInput && extensionSettings.defaultContentType !== 'application/json') {
            contentTypeInput.value = extensionSettings.defaultContentType;
        }
        
        // Update history limit if needed
        if (requestHistory.length > extensionSettings.historyLimit && extensionSettings.historyLimit > 0) {
            requestHistory = requestHistory.slice(0, extensionSettings.historyLimit);
            saveHistory();
            renderHistory();
        }
    }
    
    function updateBodyVisibility() {
        const method = methodSelect.value;
        const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);
        if (!hasBody) {
            bodyContainer.classList.add('collapsed');
            if (toggleBodyBtn) toggleBodyBtn.textContent = '[+]';
        } else {
            bodyContainer.classList.remove('collapsed');
            if (toggleBodyBtn) toggleBodyBtn.textContent = '[-]';
        }
    }
    
    function toggleSection(section, button) {
        section.classList.toggle('collapsed');
        button.textContent = section.classList.contains('collapsed') ? '[+]' : '[-]';
    }
    
    function addHeaderRow() {
        const row = document.createElement('div');
        row.className = 'header-row';
        row.innerHTML = `
            <input type="text" class="header-key theme-input" placeholder="Header name">
            <input type="text" class="header-value theme-input" placeholder="Header value">
            <button class="remove-header theme-secondary-btn">✕</button>
        `;
        headersContainer.appendChild(row);
        
        // Add remove functionality
        row.querySelector('.remove-header').addEventListener('click', function() {
            row.remove();
        });
    }
    
    function getHeaders() {
        const headers = {};
        const rows = headersContainer.querySelectorAll('.header-row');
        rows.forEach(row => {
            const key = row.querySelector('.header-key').value.trim();
            const value = row.querySelector('.header-value').value.trim();
            if (key && value) {
                headers[key] = value;
            }
        });
        return headers;
    }
    
    async function sendRequest() {
        const method = methodSelect.value;
        const url = urlInput.value.trim();
        
        if (!url) {
            showNotification('Please enter a URL', 'error');
            return;
        }
        
        // Validate URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            showNotification('URL must start with http:// or https://', 'error');
            return;
        }
        
        // Cancel previous request if exists
        if (abortController) {
            abortController.abort();
        }
        
        abortController = new AbortController();
        const timeoutId = extensionSettings.requestTimeout ? 
            setTimeout(() => {
                abortController.abort();
                showNotification(`Request timeout after ${extensionSettings.requestTimeout} seconds`, 'error');
            }, extensionSettings.requestTimeout * 1000) : null;
        
        // Show loading
        loadingOverlay.style.display = 'flex';
        
        const headers = getHeaders();
        const startTime = Date.now();
        
        let options = {
            method: method,
            headers: headers,
            signal: abortController.signal
        };
        
        // Add body for POST, PUT, PATCH
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            const bodyType = bodyTypeSelect.value;
            const bodyText = requestBody.value.trim();
            
            if (bodyText) {
                if (bodyType === 'json') {
                    try {
                        JSON.parse(bodyText);
                        options.body = bodyText;
                        if (!headers['Content-Type']) {
                            headers['Content-Type'] = 'application/json';
                        }
                    } catch (e) {
                        showNotification('Invalid JSON format in request body', 'error');
                        loadingOverlay.style.display = 'none';
                        if (timeoutId) clearTimeout(timeoutId);
                        return;
                    }
                } else if (bodyType === 'text') {
                    options.body = bodyText;
                    if (!headers['Content-Type']) {
                        headers['Content-Type'] = 'text/plain';
                    }
                } else if (bodyType === 'form') {
                    const formData = new URLSearchParams();
                    bodyText.split('\n').forEach(line => {
                        const [key, value] = line.split('=');
                        if (key && value) formData.append(key.trim(), value.trim());
                    });
                    options.body = formData.toString();
                    if (!headers['Content-Type']) {
                        headers['Content-Type'] = 'application/x-www-form-urlencoded';
                    }
                }
            }
        }
        
        try {
            const response = await fetch(url, options);
            const endTime = Date.now();
            const responseTimeMs = endTime - startTime;
            
            const responseText = await response.text();
            const responseSizeBytes = new Blob([responseText]).size;
            
            // Store response for later use
            currentResponse = {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                body: responseText,
                time: responseTimeMs,
                size: responseSizeBytes
            };
            
            // Update UI
            updateResponseUI();
            
            // Auto-copy if enabled and successful
            if (extensionSettings.autoCopy && response.status >= 200 && response.status < 300) {
                try {
                    await navigator.clipboard.writeText(responseText);
                    showNotification('Response copied to clipboard', 'success');
                } catch (copyError) {
                    console.log('Auto-copy failed:', copyError);
                }
            }
            
            // Add to history
            addToHistory({
                method: method,
                url: url,
                status: response.status,
                time: responseTimeMs,
                timestamp: new Date().toLocaleTimeString()
            });
            
        } catch (error) {
            // Show error in response
            const errorTime = Date.now() - startTime;
            currentResponse = {
                status: 0,
                statusText: 'Error',
                headers: new Headers(),
                body: `Error: ${error.name === 'AbortError' ? 'Request timeout' : error.message}`,
                time: errorTime,
                size: 0
            };
            updateResponseUI();
            
            addToHistory({
                method: method,
                url: url,
                status: 0,
                time: errorTime,
                timestamp: new Date().toLocaleTimeString(),
                error: error.name === 'AbortError' ? 'Timeout' : error.message
            });
            
            if (error.name !== 'AbortError') {
                showNotification(`Request failed: ${error.message}`, 'error');
            }
            
        } finally {
            // Hide loading
            loadingOverlay.style.display = 'none';
            if (timeoutId) clearTimeout(timeoutId);
            abortController = null;
        }
    }
    
    function updateResponseUI() {
        if (!currentResponse) return;
    
        // Status code with colors
        statusCode.textContent = currentResponse.status;
        statusCode.className = 'status-code'; // Reset classes
        
        if (currentResponse.status === 0) {
            statusCode.classList.add('error');
            statusText.textContent = 'Network Error';
        } else if (currentResponse.status >= 200 && currentResponse.status < 300) {
            statusCode.classList.add('success');
            statusText.textContent = currentResponse.statusText || 'OK';
        } else if (currentResponse.status === 403) {
            statusCode.classList.add('error');
            statusText.textContent = 'Forbidden (Cloudflare)';
        } else if (currentResponse.status === 404) {
            statusCode.classList.add('error');
            statusText.textContent = 'Not Found';
        } else {
            statusCode.classList.add('info');
            statusText.textContent = currentResponse.statusText || 'Error';
        }
        
        // Show/hide response time based on settings
        if (extensionSettings.showResponseTime) {
            responseTime.textContent = currentResponse.time;
            responseTime.parentElement.style.display = 'block';
        } else {
            responseTime.parentElement.style.display = 'none';
        }
        
        // Update size
        const size = currentResponse.size;
        responseSize.textContent = size < 1024 ? 
            `${size} B` : 
            size < 1024 * 1024 ? 
            `${(size / 1024).toFixed(2)} KB` : 
            `${(size / (1024 * 1024)).toFixed(2)} MB`;
        
        // Update response body with auto-formatting if enabled
        try {
            const parsed = JSON.parse(currentResponse.body);
            responseBody.textContent = extensionSettings.autoFormat ? 
                JSON.stringify(parsed, null, 2) : 
                JSON.stringify(parsed);
        } catch {
            responseBody.textContent = currentResponse.body;
        }
        
        // Update headers
        const headersObj = {};
        if (currentResponse.headers && currentResponse.headers.forEach) {
            currentResponse.headers.forEach((value, key) => {
                headersObj[key] = value;
            });
        }
        responseHeaders.textContent = JSON.stringify(headersObj, null, 2);
        
        // Update raw response
        rawResponse.textContent = currentResponse.body;
        
        // Switch to body tab
        switchTab('body');
    }
    
    function switchTab(tabName) {
        // Update tabs
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update tab contents
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Tab');
        });
    }
    
    function formatJsonResponse() {
        try {
            const parsed = JSON.parse(responseBody.textContent);
            responseBody.textContent = JSON.stringify(parsed, null, 2);
            showNotification('JSON formatted successfully', 'success');
        } catch {
            showNotification('Response is not valid JSON', 'error');
        }
    }
    
    async function copyResponse() {
        try {
            await navigator.clipboard.writeText(responseBody.textContent);
            showNotification('Response copied to clipboard!', 'success');
        } catch (error) {
            showNotification('Failed to copy response', 'error');
        }
    }
    
    function clearResponse() {
        responseBody.textContent = '';
        responseHeaders.textContent = '';
        rawResponse.textContent = '';
        statusCode.textContent = '-';
        statusText.textContent = '';
        responseTime.textContent = '-';
        responseSize.textContent = '-';
        currentResponse = null;
        statusCode.className = 'status-code';
    }
    
    function addToHistory(request) {
        requestHistory.unshift(request);
        
        // Apply history limit from settings
        const limit = extensionSettings.historyLimit;
        if (limit > 0 && requestHistory.length > limit) {
            requestHistory = requestHistory.slice(0, limit);
        }
        
        saveHistory();
        renderHistory();
    }
    
    function renderHistory() {
        historyList.innerHTML = '';
        
        if (requestHistory.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <div>No requests in history</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 5px;">
                        Your requests will appear here
                    </div>
                </div>
            `;
            return;
        }
        
        requestHistory.forEach((req, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div>
                    <span class="history-method">${req.method}</span>
                    <span class="history-url" title="${req.url}">${req.url.length > 40 ? req.url.substring(0, 40) + '...' : req.url}</span>
                    <span class="history-status ${req.status >= 200 && req.status < 300 ? 'success' : ''}">
                        ${req.status || 'ERR'}
                    </span>
                </div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:5px;">
                    ${req.timestamp} • ${req.time}ms
                    ${req.error ? ` • ${req.error}` : ''}
                </div>
            `;
            
            item.addEventListener('click', function() {
                loadRequestFromHistory(req);
            });
            
            historyList.appendChild(item);
        });
    }
    
    function loadRequestFromHistory(request) {
        methodSelect.value = request.method;
        urlInput.value = request.url;
        updateBodyVisibility();
        
        // Scroll to top and focus URL
        urlInput.focus();
        window.scrollTo(0, 0);
        
        showNotification('Request loaded from history', 'info');
    }
    
    function saveHistory() {
        chrome.storage.local.set({ apiTesterHistory: requestHistory });
    }
    
    function loadHistory() {
        chrome.storage.local.get(['apiTesterHistory'], function(result) {
            requestHistory = result.apiTesterHistory || [];
            renderHistory();
        });
    }
    
    function clearHistory() {
        if (requestHistory.length === 0) {
            showNotification('History is already empty', 'info');
            return;
        }
        
        if (confirm('Clear all request history?')) {
            requestHistory = [];
            saveHistory();
            renderHistory();
            showNotification('History cleared', 'success');
        }
    }
    
    function showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
        
        // Click to dismiss
        notification.addEventListener('click', function() {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        });
    }
    
    function getNotificationIcon(type) {
        switch(type) {
            case 'success': return '✓';
            case 'error': return '✕';
            case 'warning': return '⚠';
            case 'info': return 'ℹ';
            default: return '•';
        }
    }
    
    // Initialize default header row
    addHeaderRow();
    
    // Add sample JSON for POST requests
    requestBody.value = '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}';
    
    // Add notification styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--header-bg);
            color: var(--text-primary);
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            transform: translateX(150%);
            transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            max-width: 300px;
            border-left: 4px solid var(--primary-color);
            cursor: pointer;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification-success {
            border-left-color: var(--success-color);
        }
        
        .notification-error {
            border-left-color: var(--error-color);
        }
        
        .notification-warning {
            border-left-color: var(--warning-color);
        }
        
        .notification-info {
            border-left-color: var(--info-color);
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .notification-icon {
            font-weight: bold;
            font-size: 16px;
        }
        
        .notification-message {
            font-size: 14px;
            flex: 1;
        }
        
        .empty-history {
            text-align: center;
            padding: 30px 20px;
            color: var(--text-muted);
            font-size: 14px;
        }
        
        .empty-history div:first-child {
            margin-bottom: 8px;
            font-size: 16px;
        }
    `;
    document.head.appendChild(style);
});