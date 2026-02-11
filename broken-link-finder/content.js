// Content script for Broken Link Finder

// Store highlighted elements
let highlightedElements = new Map();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        switch (request.action) {
            case 'findAllLinks':
                const links = findAllLinks(request.checkExternal);
                sendResponse({ links: links });
                break;
                
            case 'highlightBroken':
                highlightBrokenLinks(request.links);
                sendResponse({ success: true, count: highlightedElements.size });
                break;
                
            case 'clearHighlights':
                clearHighlights();
                sendResponse({ success: true });
                break;
                
            case 'getPageInfo':
                sendResponse(getPageInfo());
                break;
                
            default:
                sendResponse({ error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Content script error:', error);
        sendResponse({ error: error.message });
    }
    return true; // Required for async response
});

// Find all links on the page
function findAllLinks(checkExternal = false) {
    const links = [];
    const seenUrls = new Set();
    
    try {
        // Find all anchor tags
        const anchorTags = document.querySelectorAll('a[href]');
        anchorTags.forEach(tag => {
            try {
                let url = tag.href;
                if (!url || url === '#' || url.startsWith('javascript:')) {
                    return;
                }
                
                // Normalize URL
                url = normalizeUrl(url);
                
                // Skip if external links shouldn't be checked
                if (!checkExternal && isExternalLink(url)) {
                    return;
                }
                
                // Skip if already seen
                if (seenUrls.has(url)) {
                    return;
                }
                
                seenUrls.add(url);
                links.push({
                    url: url,
                    text: tag.textContent.trim() || tag.innerText.trim() || tag.title || tag.getAttribute('aria-label') || '',
                    element: null, // Can't send DOM elements
                    type: 'link'
                });
            } catch (e) {
                // Skip invalid URLs
            }
        });
        
        // Find image links
        const imgTags = document.querySelectorAll('img[src]');
        imgTags.forEach(tag => {
            try {
                let url = tag.src;
                if (!url) return;
                
                url = normalizeUrl(url);
                
                if (!checkExternal && isExternalLink(url)) {
                    return;
                }
                
                if (seenUrls.has(url)) {
                    return;
                }
                
                seenUrls.add(url);
                links.push({
                    url: url,
                    text: tag.alt || tag.title || `Image: ${url.split('/').pop()}`,
                    element: null,
                    type: 'image'
                });
            } catch (e) {
                // Skip invalid URLs
            }
        });
        
        // Find script and link tags (optional)
        const resourceTags = document.querySelectorAll('script[src], link[href]');
        resourceTags.forEach(tag => {
            try {
                const url = tag.src || tag.href;
                if (!url) return;
                
                if (!checkExternal && isExternalLink(url)) {
                    return;
                }
                
                if (seenUrls.has(url)) {
                    return;
                }
                
                seenUrls.add(url);
                links.push({
                    url: url,
                    text: tag.tagName.toLowerCase(),
                    element: null,
                    type: 'resource'
                });
            } catch (e) {
                // Skip invalid URLs
            }
        });
        
    } catch (error) {
        console.error('Error finding links:', error);
    }
    
    return links;
}

// Highlight broken links on the page - IMPROVED VERSION
function highlightBrokenLinks(brokenLinks) {
    // Clear existing highlights first
    clearHighlights();
    
    if (!Array.isArray(brokenLinks) || brokenLinks.length === 0) {
        console.log('No broken links to highlight');
        return;
    }
    
    console.log(`Attempting to highlight ${brokenLinks.length} broken links`);
    
    // Create styles for highlighting
    createHighlightStyles();
    
    let highlightedCount = 0;
    
    brokenLinks.forEach(link => {
        if (!link || !link.url) return;
        
        try {
            // Try multiple strategies to find the element
            const elements = findElementsByUrl(link.url);
            
            if (elements.length === 0) {
                // Try to find partial matches (URLs with fragments, query params, etc.)
                const partialElements = findPartialUrlMatches(link.url);
                elements.push(...partialElements);
            }
            
            elements.forEach(element => {
                // Skip if already highlighted
                if (element.classList.contains('broken-link-highlighted')) {
                    return;
                }
                
                // Apply highlight
                applyHighlight(element, link);
                highlightedCount++;
            });
        } catch (error) {
            console.error('Error highlighting link:', link.url, error);
        }
    });
    
    console.log(`Successfully highlighted ${highlightedCount} elements`);
    
    // Dispatch event that highlighting is complete
    document.dispatchEvent(new CustomEvent('brokenLinksHighlighted', {
        detail: { count: highlightedCount }
    }));
}

// Find elements by URL using multiple strategies
function findElementsByUrl(url) {
    const elements = [];
    
    try {
        // Strategy 1: Exact match with CSS.escape
        const escapedUrl = CSS.escape(url);
        const exactSelectors = [
            `a[href="${escapedUrl}"]`,
            `a[href="${escapedUrl}/"]`,
            `img[src="${escapedUrl}"]`,
            `link[href="${escapedUrl}"]`,
            `script[src="${escapedUrl}"]`,
            `source[src="${escapedUrl}"]`
        ];
        
        exactSelectors.forEach(selector => {
            const found = document.querySelectorAll(selector);
            found.forEach(el => elements.push(el));
        });
        
        // Strategy 2: Attribute contains URL (for relative/absolute mismatches)
        if (elements.length === 0) {
            const urlObj = new URL(url, window.location.origin);
            const path = urlObj.pathname;
            
            const containsSelectors = [
                `a[href*="${CSS.escape(path)}"]`,
                `img[src*="${CSS.escape(path)}"]`
            ];
            
            containsSelectors.forEach(selector => {
                const found = document.querySelectorAll(selector);
                found.forEach(el => {
                    try {
                        const elUrl = normalizeUrl(el.href || el.src);
                        if (elUrl === url) {
                            elements.push(el);
                        }
                    } catch (e) {
                        // Skip invalid URLs
                    }
                });
            });
        }
        
    } catch (error) {
        console.warn('Error finding elements by URL:', url, error);
    }
    
    return [...new Set(elements)]; // Remove duplicates
}

// Find partial URL matches
function findPartialUrlMatches(url) {
    const elements = [];
    
    try {
        const urlObj = new URL(url, window.location.origin);
        const baseUrl = urlObj.origin + urlObj.pathname;
        
        // Look for elements with the same base URL
        const allLinks = document.querySelectorAll('a[href], img[src]');
        allLinks.forEach(element => {
            try {
                const elementUrl = normalizeUrl(element.href || element.src);
                const elementUrlObj = new URL(elementUrl, window.location.origin);
                const elementBaseUrl = elementUrlObj.origin + elementUrlObj.pathname;
                
                if (elementBaseUrl === baseUrl) {
                    elements.push(element);
                }
            } catch (e) {
                // Skip invalid URLs
            }
        });
    } catch (error) {
        console.warn('Error finding partial matches:', error);
    }
    
    return elements;
}

// Apply highlight to a single element
function applyHighlight(element, link) {
    // Store original attributes
    const originalClass = element.className;
    const originalStyle = element.style.cssText;
    
    // Add highlight class
    element.classList.add('broken-link-highlighted');
    
    // Store original data
    element.dataset.originalClass = originalClass;
    element.dataset.originalStyle = originalStyle;
    element.dataset.brokenUrl = link.url;
    element.dataset.brokenStatus = link.status;
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'broken-link-tooltip';
    tooltip.textContent = `Broken (${link.status})`;
    
    // Position tooltip
    element.style.position = 'relative';
    
    // Insert tooltip as first child
    if (element.firstChild) {
        element.insertBefore(tooltip, element.firstChild);
    } else {
        element.appendChild(tooltip);
    }
    
    // Add hover events
    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
    
    // Add click to remove highlight (Ctrl/Cmd + Click)
    element.addEventListener('click', removeHighlightOnClick);
    
    // Store in map
    highlightedElements.set(element, {
        originalClass,
        originalStyle,
        tooltip,
        link
    });
}

// Show tooltip
function showTooltip(e) {
    const tooltip = e.currentTarget.querySelector('.broken-link-tooltip');
    if (tooltip) {
        tooltip.style.display = 'block';
        
        // Position tooltip above element
        const rect = e.currentTarget.getBoundingClientRect();
        tooltip.style.top = `${-tooltip.offsetHeight - 5}px`;
        tooltip.style.left = '0';
    }
}

// Hide tooltip
function hideTooltip(e) {
    const tooltip = e.currentTarget.querySelector('.broken-link-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

// Remove highlight on Ctrl/Cmd + Click
function removeHighlightOnClick(e) {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        
        const element = e.currentTarget;
        const data = highlightedElements.get(element);
        
        if (data) {
            // Restore original state
            element.className = data.originalClass;
            element.style.cssText = data.originalStyle;
            
            // Remove tooltip
            if (data.tooltip && data.tooltip.parentNode === element) {
                element.removeChild(data.tooltip);
            }
            
            // Remove event listeners
            element.removeEventListener('mouseenter', showTooltip);
            element.removeEventListener('mouseleave', hideTooltip);
            element.removeEventListener('click', removeHighlightOnClick);
            
            // Remove from map
            highlightedElements.delete(element);
        }
    }
}

// Clear all highlights
function clearHighlights() {
    highlightedElements.forEach((data, element) => {
        // Restore original state
        element.className = data.originalClass;
        element.style.cssText = data.originalStyle;
        
        // Remove tooltip
        if (data.tooltip && data.tooltip.parentNode === element) {
            element.removeChild(data.tooltip);
        }
        
        // Remove event listeners
        element.removeEventListener('mouseenter', showTooltip);
        element.removeEventListener('mouseleave', hideTooltip);
        element.removeEventListener('click', removeHighlightOnClick);
        
        // Clean up data attributes
        delete element.dataset.originalClass;
        delete element.dataset.originalStyle;
        delete element.dataset.brokenUrl;
        delete element.dataset.brokenStatus;
    });
    
    highlightedElements.clear();
    
    // Remove global styles
    removeHighlightStyles();
}

// Create highlight styles
function createHighlightStyles() {
    if (document.getElementById('broken-link-highlight-styles')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'broken-link-highlight-styles';
    style.textContent = `
        .broken-link-highlighted {
            outline: 3px solid #ef4444 !important;
            outline-offset: 2px !important;
            background-color: rgba(239, 68, 68, 0.1) !important;
            position: relative !important;
            z-index: 9999 !important;
            border-radius: 2px !important;
            transition: all 0.2s ease !important;
        }
        
        .broken-link-highlighted:hover {
            outline-width: 4px !important;
            background-color: rgba(239, 68, 68, 0.15) !important;
            box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.3) !important;
        }
        
        .broken-link-highlighted a, 
        .broken-link-highlighted img {
            position: relative !important;
            z-index: 10000 !important;
        }
        
        .broken-link-tooltip {
            position: absolute;
            background: #ef4444;
            color: white;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            z-index: 10001;
            display: none;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .broken-link-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 10px;
            border-width: 5px;
            border-style: solid;
            border-color: #ef4444 transparent transparent transparent;
        }
        
        /* Special handling for different element types */
        .broken-link-highlighted[href] {
            text-decoration: line-through !important;
            text-decoration-color: #ef4444 !important;
            text-decoration-thickness: 2px !important;
        }
        
        .broken-link-highlighted img {
            filter: grayscale(50%) brightness(0.9) !important;
            opacity: 0.9 !important;
        }
    `;
    
    document.head.appendChild(style);
}

// Remove highlight styles
function removeHighlightStyles() {
    const style = document.getElementById('broken-link-highlight-styles');
    if (style && style.parentNode) {
        style.parentNode.removeChild(style);
    }
}

// Helper function to normalize URL
function normalizeUrl(url) {
    try {
        if (!url || url.trim() === '') return '';
        
        // Handle relative URLs
        if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
            url = new URL(url, window.location.origin).href;
        }
        
        // Remove fragments and trailing slashes for comparison
        const urlObj = new URL(url);
        let normalized = `${urlObj.origin}${urlObj.pathname}`;
        
        // Remove trailing slash unless it's the root
        if (normalized.endsWith('/') && normalized !== urlObj.origin + '/') {
            normalized = normalized.slice(0, -1);
        }
        
        return normalized;
    } catch (e) {
        return url; // Return original if URL parsing fails
    }
}

// Helper functions
function isExternalLink(url) {
    try {
        const currentHost = window.location.hostname;
        const linkHost = new URL(url, window.location.href).hostname;
        return linkHost !== currentHost && linkHost !== '';
    } catch {
        return false;
    }
}

function getPageInfo() {
    return {
        url: window.location.href,
        title: document.title,
        totalLinks: document.querySelectorAll('a[href]').length
    };
}

// Auto-scan on page load (optional - can be enabled in settings)
try {
    chrome.storage.sync.get(['settings'], (data) => {
        if (data.settings && data.settings.autoScan) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const links = findAllLinks(false);
                    chrome.runtime.sendMessage({
                        type: 'PAGE_LOAD_SCAN',
                        url: window.location.href,
                        linkCount: links.length
                    });
                }, 3000);
            });
        }
    });
} catch (error) {
    console.error('Auto-scan setup failed:', error);
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    clearHighlights();
});

// Listen for page changes (SPA support)
let lastUrl = window.location.href;
new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        clearHighlights(); // Clear highlights on page navigation
    }
}).observe(document, { subtree: true, childList: true });