// DataFormat Pro - Content Script
// Detects and formats JSON/XML responses on web pages

class DataFormatPro {
    constructor() {
        this.settings = {};
        this.observer = null;
        this.currentTooltip = null;
        this.init();
    }
    
    async init() {
        await this.loadSettings();
        this.setupObserver();
        this.injectStyles();
        this.setupMessageListener();
        console.log('DataFormat Pro content script loaded');
    }
    
    async loadSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get({
                autoFormatPages: true,
                highlightPages: true,
                formatOnHover: true,
                theme: 'ocean-blue'
            }, (data) => {
                this.settings = data;
                resolve();
            });
        });
    }
    
    injectStyles() {
        // Check if styles already exist
        if (document.getElementById('dataformat-pro-styles')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'dataformat-pro-styles';
        style.textContent = `
            .dataformat-pro-button {
                position: absolute;
                top: 8px;
                right: 8px;
                background: linear-gradient(135deg, #2196F3, #42A5F5);
                color: white;
                border: none;
                border-radius: 4px;
                padding: 4px 8px;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.2s;
                z-index: 1000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            
            .dataformat-pro-button:hover {
                opacity: 1 !important;
                background: linear-gradient(135deg, #1976D2, #2196F3);
            }
            
            .dataformat-formatted {
                position: relative;
                margin: 10px 0;
                transition: background-color 0.3s;
                border-radius: 6px;
                overflow: hidden;
            }
            
            .dataformat-formatted:hover {
                background-color: rgba(33, 150, 243, 0.05);
            }
            
            .dataformat-formatted:hover .dataformat-pro-button {
                opacity: 0.8;
            }
            
            .syntax-highlighted-json,
            .syntax-highlighted-xml {
                font-family: 'Roboto Mono', 'Consolas', 'Monaco', 'Courier New', monospace;
                font-size: 13px;
                line-height: 1.5;
                padding: 12px;
                border-radius: 6px;
                background: #0D1B2A;
                border: 1px solid rgba(100, 181, 246, 0.3);
                overflow-x: auto;
                position: relative;
                margin: 0;
                color: #E3F2FD;
            }
            
            .syntax-highlighted-json .key { color: #FF79C6; }
            .syntax-highlighted-json .string { color: #F1FA8C; }
            .syntax-highlighted-json .number { color: #BD93F9; }
            .syntax-highlighted-json .boolean { color: #FF79C6; }
            .syntax-highlighted-json .null { color: #FF79C6; }
            
            .syntax-highlighted-xml .tag { color: #FF79C6; }
            .syntax-highlighted-xml .attr-name { color: #50FA7B; }
            .syntax-highlighted-xml .attr-value { color: #F1FA8C; }
            .syntax-highlighted-xml .text { color: #F8F8F2; }
            .syntax-highlighted-xml .comment { color: #6272A4; font-style: italic; }
            
            .format-tooltip {
                position: fixed;
                background: #0A3D91;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                border: 1px solid rgba(100, 181, 246, 0.3);
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.45);
                z-index: 10000;
                font-size: 12px;
                max-width: 300px;
                pointer-events: none;
                animation: fadeIn 0.2s;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            /* Theme variants */
            .theme-indigo-night .syntax-highlighted-json,
            .theme-indigo-night .syntax-highlighted-xml {
                background: #020617;
                border-color: rgba(224, 231, 255, 0.1);
                color: #E0E7FF;
            }
            
            .theme-mint-teal .syntax-highlighted-json,
            .theme-mint-teal .syntax-highlighted-xml {
                background: #1E1E1E;
                border-color: rgba(94, 234, 212, 0.3);
                color: #E0E0E0;
            }
            
            .theme-violet-glow .syntax-highlighted-json,
            .theme-violet-glow .syntax-highlighted-xml {
                background: #1C112F;
                border-color: rgba(196, 181, 253, 0.3);
                color: #F0F0F0;
            }
            
            .theme-sky-gradient .syntax-highlighted-json,
            .theme-sky-gradient .syntax-highlighted-xml {
                background: #0C2A40;
                border-color: rgba(125, 211, 252, 0.3);
                color: #F0F0F0;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupObserver() {
        if (!this.settings.autoFormatPages) return;
        
        // Clean up existing observer
        if (this.observer) {
            this.observer.disconnect();
        }
        
        // Create new observer
        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.scanNode(node);
                        } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                            // Handle text nodes directly
                            this.processTextNodeIfNeeded(node);
                        }
                    }
                }
            }
        });
        
        // Start observing
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        // Initial scan
        setTimeout(() => {
            this.scanNode(document.body);
        }, 1000); // Delay to ensure page is loaded
    }
    
    scanNode(node) {
        // Use querySelectorAll for better performance
        const textNodes = this.findTextNodes(node);
        
        // Process found nodes
        for (const textNode of textNodes) {
            this.processTextNodeIfNeeded(textNode);
        }
    }
    
    findTextNodes(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    const text = node.textContent.trim();
                    if (text.length > 50) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_REJECT;
                }
            }
        );
        
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        return textNodes;
    }
    
    processTextNodeIfNeeded(textNode) {
        const text = textNode.textContent.trim();
        
        // Check if this text node is already inside our formatted container
        if (textNode.parentElement && 
            (textNode.parentElement.classList.contains('dataformat-formatted') ||
             textNode.parentElement.closest('.dataformat-formatted'))) {
            return;
        }
        
        const isJSON = this.isJSON(text);
        const isXML = this.isXML(text);
        
        if (isJSON || isXML) {
            this.processTextNode(textNode, isJSON, isXML);
        }
    }
    
    processTextNode(textNode, isJSON, isXML) {
        const text = textNode.textContent.trim();
        const parent = textNode.parentElement;
        
        // Don't process if parent is already a code element
        if (parent && (parent.tagName === 'PRE' || parent.tagName === 'CODE')) {
            return;
        }
        
        // Create container
        const container = document.createElement('div');
        container.className = 'dataformat-formatted';
        
        // Create pre element
        const pre = document.createElement('pre');
        pre.className = isJSON ? 'syntax-highlighted-json' : 'syntax-highlighted-xml';
        pre.textContent = text;
        
        // Create button
        const button = document.createElement('button');
        button.className = 'dataformat-pro-button';
        button.textContent = isJSON ? 'Format JSON' : 'Format XML';
        button.title = 'Click to format in popup';
        button.type = 'button';
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openInPopup(text, isJSON ? 'json' : 'xml');
        });
        
        // Apply syntax highlighting if enabled
        if (this.settings.highlightPages) {
            this.highlightSyntax(pre, isJSON ? 'json' : 'xml');
        }
        
        // Add elements to container
        container.appendChild(pre);
        container.appendChild(button);
        
        // Add hover tooltip if enabled
        if (this.settings.formatOnHover) {
            container.addEventListener('mouseenter', (e) => {
                this.showTooltip(e, isJSON ? 'json' : 'xml');
            });
            
            container.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        }
        
        // Replace text node with our formatted container
        try {
            textNode.replaceWith(container);
        } catch (error) {
            console.warn('Could not replace text node:', error);
            // Try to append instead
            if (textNode.parentNode) {
                textNode.parentNode.insertBefore(container, textNode);
                textNode.remove();
            }
        }
    }
    
    highlightSyntax(element, type) {
        const text = element.textContent;
        let highlighted;
        
        if (type === 'json') {
            highlighted = text
                .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
                    let cls = 'string';
                    if (/:$/.test(match)) {
                        cls = 'key';
                        match = match.replace(/:$/, '');
                    }
                    return `<span class="${cls}">${match}</span>`;
                })
                .replace(/\b(true|false|null)\b/g, '<span class="boolean">$1</span>')
                .replace(/\b-?\d+(\.\d+)?([eE][+-]?\d+)?\b/g, '<span class="number">$&</span>')
                .replace(/[{}\[\]]/g, (match) => `<span style="color: #8BE9FD;">${match}</span>`)
                .replace(/[:,]/g, (match) => `<span style="color: #F8F8F2;">${match}</span>`);
        } else {
            highlighted = text
                .replace(/<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)/g, '&lt;$1<span class="tag">$2</span>')
                .replace(/([a-zA-Z-]+)=/g, '<span class="attr-name">$1</span>=')
                .replace(/"([^"]*)"/g, '"<span class="attr-value">$1</span>"')
                .replace(/&lt;!--[\s\S]*?--&gt;/g, '<span class="comment">$&</span>')
                .replace(/&lt;![\s\S]*?&gt;/g, '<span style="color: #8BE9FD;">$&</span>')
                .replace(/(?<=&gt;)([^&<]+)(?=&lt;)/g, '<span class="text">$1</span>')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');
        }
        
        element.innerHTML = highlighted;
    }
    
    showTooltip(event, type) {
        this.hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'format-tooltip';
        tooltip.textContent = `Click to format ${type.toUpperCase()} with DataFormat Pro`;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip near cursor
        const x = event.clientX + 15;
        const y = event.clientY + 15;
        
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        
        // Adjust if tooltip goes off screen
        const rect = tooltip.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            tooltip.style.left = `${event.clientX - rect.width - 15}px`;
        }
        if (rect.bottom > window.innerHeight) {
            tooltip.style.top = `${event.clientY - rect.height - 15}px`;
        }
        
        this.currentTooltip = tooltip;
        
        // Auto-hide tooltip after 3 seconds
        setTimeout(() => {
            this.hideTooltip();
        }, 3000);
    }
    
    hideTooltip() {
        if (this.currentTooltip && this.currentTooltip.parentNode) {
            this.currentTooltip.parentNode.removeChild(this.currentTooltip);
            this.currentTooltip = null;
        }
    }
    
    openInPopup(content, type) {
        try {
            chrome.runtime.sendMessage({
                action: 'formatInPopup',
                content: content,
                type: type
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('Could not send message:', chrome.runtime.lastError.message);
                    // Fallback: open popup directly
                    this.openPopupDirectly(content, type);
                }
            });
        } catch (error) {
            console.warn('Error sending message:', error);
            this.openPopupDirectly(content, type);
        }
    }
    
    openPopupDirectly(content, type) {
        // Create a URL with the content as a parameter
        const url = chrome.runtime.getURL(`popup.html?content=${encodeURIComponent(content)}&type=${type}`);
        
        // Open in new tab as fallback
        window.open(url, '_blank');
    }
    
    isJSON(text) {
        // Quick checks first
        const trimmed = text.trim();
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
            return false;
        }
        
        // Try to parse
        try {
            JSON.parse(text);
            return true;
        } catch {
            return false;
        }
    }
    
    isXML(text) {
        const trimmed = text.trim();
        
        // Check for XML declaration
        if (trimmed.startsWith('<?xml')) {
            return true;
        }
        
        // Check for XML-like structure
        if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
            // Check for proper tag structure
            const tags = trimmed.match(/<[^>]+>/g);
            if (!tags || tags.length === 0) {
                return false;
            }
            
            // Simple validation: check for matching tags
            const stack = [];
            for (const tag of tags) {
                if (tag.startsWith('</')) {
                    // Closing tag
                    const tagName = tag.slice(2, -1).split(' ')[0];
                    if (stack.pop() !== tagName) {
                        return false;
                    }
                } else if (!tag.endsWith('/>')) {
                    // Opening tag (not self-closing)
                    const tagName = tag.slice(1, -1).split(' ')[0];
                    if (tagName && !tagName.includes('!')) { // Skip doctype, comments
                        stack.push(tagName);
                    }
                }
            }
            
            return stack.length === 0;
        }
        
        return false;
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'themeChanged':
                    this.applyTheme(request.theme);
                    break;
                    
                case 'getPageContent':
                    this.getPageContent(sendResponse);
                    return true;
                    
                case 'formatSelectedText':
                    this.formatSelectedText(request.text, sendResponse);
                    return true;
            }
        });
    }
    
    applyTheme(theme) {
        // Update theme class on body
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);
    }
    
    getPageContent(sendResponse) {
        // Try to find JSON/XML content on the page
        const bodyText = document.body.textContent || '';
        const isJSON = this.isJSON(bodyText);
        const isXML = this.isXML(bodyText);
        
        if (isJSON || isXML) {
            sendResponse({
                content: bodyText,
                type: isJSON ? 'json' : 'xml'
            });
        } else {
            sendResponse({ content: null });
        }
    }
    
    formatSelectedText(text, sendResponse) {
        chrome.runtime.sendMessage({
            action: 'formatInPopup',
            content: text,
            type: 'auto'
        }, sendResponse);
    }
    
    // Listen for settings changes
    setupSettingsListener() {
        chrome.storage.onChanged.addListener((changes) => {
            if (changes.autoFormatPages || changes.highlightPages || changes.formatOnHover || changes.theme) {
                this.loadSettings().then(() => {
                    // Re-inject styles if they might have changed
                    this.injectStyles();
                    
                    // Re-setup observer with new settings
                    this.setupObserver();
                });
            }
        });
    }
}

// Initialize when page loads
function initializeFormatter() {
    // Check if already initialized
    if (window.dataFormatPro) {
        return;
    }
    
    // Wait a bit for page to settle
    setTimeout(() => {
        try {
            window.dataFormatPro = new DataFormatPro();
            window.dataFormatPro.setupSettingsListener();
        } catch (error) {
            console.error('Failed to initialize DataFormat Pro:', error);
        }
    }, 1000);
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFormatter);
} else {
    initializeFormatter();
}

// Also listen for dynamic content (SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        // Reinitialize on navigation (for SPAs)
        setTimeout(() => {
            if (window.dataFormatPro) {
                window.dataFormatPro.scanNode(document.body);
            }
        }, 500);
    }
}).observe(document, { subtree: true, childList: true });

// Store original fetch
const originalFetch = window.fetch;

// Override fetch to intercept API responses
window.fetch = new Proxy(originalFetch, {
    apply: function(target, thisArg, argumentsList) {
        const [url, options] = argumentsList;
        
        // Call original fetch
        const fetchPromise = target.apply(thisArg, argumentsList);
        
        return fetchPromise.then(async response => {
            // Clone response to read it without consuming
            const clonedResponse = response.clone();
            
            try {
                // Check content type
                const contentType = clonedResponse.headers.get('content-type') || '';
                const urlString = url.toString();
                
                // Check if it's JSON/XML response
                const isJson = contentType.includes('application/json') || 
                              contentType.includes('text/json') ||
                              urlString.includes('.json');
                              
                const isXml = contentType.includes('application/xml') || 
                             contentType.includes('text/xml') ||
                             urlString.includes('.xml');
                
                if (isJson || isXml) {
                    // Get response text
                    const text = await clonedResponse.text();
                    
                    // Send to background for processing
                    if (text && text.length > 0) {
                        chrome.runtime.sendMessage({
                            action: 'detectedApiResponse',
                            url: urlString,
                            contentType: contentType,
                            isJson: isJson,
                            isXml: isXml,
                            responseText: text.substring(0, 5000) // Limit size
                        }).catch(() => {
                            // Extension might not be available
                        });
                    }
                }
            } catch (error) {
                console.error('Error intercepting fetch response:', error);
            }
            
            // Return original response
            return response;
        });
    }
});

// Also intercept XMLHttpRequest
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url) {
    this._url = url;
    this._method = method;
    return originalXHROpen.apply(this, arguments);
};

XMLHttpRequest.prototype.send = function(body) {
    const xhr = this;
    const originalOnReadyStateChange = this.onreadystatechange;
    
    this.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            const contentType = xhr.getResponseHeader('content-type') || '';
            const isJson = contentType.includes('application/json') || 
                          contentType.includes('text/json');
            const isXml = contentType.includes('application/xml') || 
                         contentType.includes('text/xml');
            
            if ((isJson || isXml) && xhr.responseText) {
                try {
                    chrome.runtime.sendMessage({
                        action: 'detectedApiResponse',
                        url: xhr._url,
                        contentType: contentType,
                        isJson: isJson,
                        isXml: isXml,
                        responseText: xhr.responseText.substring(0, 5000),
                        method: xhr._method
                    }).catch(() => {
                        // Extension might not be available
                    });
                } catch (error) {
                    console.error('Error intercepting XHR response:', error);
                }
            }
        }
        
        if (originalOnReadyStateChange) {
            originalOnReadyStateChange.apply(this, arguments);
        }
    };
    
    return originalXHRSend.apply(this, arguments);
};

console.log('DataFormat Pro content script loaded with network interception');