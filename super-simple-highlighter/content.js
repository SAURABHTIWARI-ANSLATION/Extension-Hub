// Super Simple Highlighter - Content Script
class SimpleHighlighter {
  constructor() {
    this.highlights = [];
    this.isHighlightMode = false;
    this.currentColor = 'yellow';
    this.showTooltip = true;
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadHighlights();
    this.setupEventListeners();
    this.injectStyles();
    
    // Check if we should restore highlights
    chrome.storage.sync.get(['autoRestore'], (data) => {
      if (data.autoRestore !== false) {
        this.restoreHighlights();
      }
    });
    
    // Check for pending color from popup
    this.checkPendingColor();
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['highlightColor', 'showTooltip'], (data) => {
        this.currentColor = data.highlightColor || 'yellow';
        this.showTooltip = data.showTooltip !== false;
        resolve();
      });
    });
  }

  async loadHighlights() {
    return new Promise((resolve) => {
      const url = window.location.href;
      chrome.storage.local.get(['highlights'], (data) => {
        const allHighlights = data.highlights || {};
        this.highlights = allHighlights[url] || [];
        resolve();
      });
    });
  }

  injectStyles() {
    // Additional dynamic styles
    const style = document.createElement('style');
    style.textContent = `
      .simple-highlighter-cursor {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="%23ffd700" d="M0 0 L32 0 L32 32 L0 32 Z" opacity="0.5"/><path fill="none" stroke="%23000" stroke-width="2" d="M8 8 L24 24 M24 8 L8 24"/></svg>') 16 16, crosshair !important;
      }
      
      .simple-highlight-tooltip {
        position: absolute;
        background: #333;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        pointer-events: none;
        white-space: nowrap;
        transform: translateY(-100%);
        margin-top: -8px;
      }
    `;
    document.head.appendChild(style);
  }

  setupEventListeners() {
    // Message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'setHighlightMode':
          this.setHighlightMode(request.enabled);
          break;
        case 'setHighlightColor':
          this.setHighlightColor(request.color, request.immediate);
          break;
        case 'setShowTooltip':
          this.showTooltip = request.enabled;
          break;
        case 'refreshHighlights':
          this.restoreHighlights();
          break;
        case 'clearHighlights':
          this.clearAllHighlights();
          break;
        case 'scrollToHighlight':
          this.scrollToHighlight(request.index);
          break;
      }
      sendResponse({success: true});
      return true; // Keep message channel open
    });

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        this.setHighlightMode(!this.isHighlightMode);
      }
    });
  }

  checkPendingColor() {
    // Check if there's a pending color change from popup
    chrome.storage.session.get(['pendingColor'], (data) => {
      if (data.pendingColor) {
        this.currentColor = data.pendingColor;
        chrome.storage.session.remove(['pendingColor']);
        console.log('Applied pending color:', this.currentColor);
      }
    });
  }

  setHighlightColor(color, immediate = false) {
    console.log('Setting highlight color to:', color, 'immediate:', immediate);
    this.currentColor = color;
    
    // Update cursor color if highlight mode is active
    if (this.isHighlightMode) {
      this.updateCursorColor(color);
    }
    
    if (immediate) {
      this.showNotification(`Color changed to ${color}`);
    }
  }

  updateCursorColor(color) {
    const cursorColors = {
      yellow: '#FFD700',
      green: '#4CAF50',
      blue: '#2196F3',
      pink: '#E91E63',
      red: '#F44336'
    };
    
    const cursorColor = cursorColors[color] || '#FFD700';
    const cursorSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" fill="${cursorColor}" opacity="0.5"/>
      <path d="M8 8 L24 24 M24 8 L8 24" stroke="#000" stroke-width="2" fill="none"/>
    </svg>`;
    
    const cursorStyle = `url('data:image/svg+xml;utf8,${encodeURIComponent(cursorSVG)}') 16 16, crosshair`;
    document.body.style.cursor = cursorStyle;
    
    // Also update the CSS class for future highlights
    const styleId = 'dynamic-cursor-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      .simple-highlighter-cursor {
        cursor: ${cursorStyle} !important;
      }
    `;
  }

  setHighlightMode(enabled) {
    this.isHighlightMode = enabled;
    
    if (enabled) {
      document.body.classList.add('simple-highlighter-cursor');
      // Update cursor with current color
      this.updateCursorColor(this.currentColor);
      document.addEventListener('mouseup', this.handleTextSelection.bind(this));
      this.showNotification(`Highlight mode enabled (${this.currentColor}). Select text to highlight.`);
    } else {
      document.body.classList.remove('simple-highlighter-cursor');
      document.removeEventListener('mouseup', this.handleTextSelection.bind(this));
      this.showNotification('Highlight mode disabled');
    }
  }

handleTextSelection() {
  if (!this.isHighlightMode) return;
  
  const selection = window.getSelection();
  if (selection.isCollapsed) return;
  
  const range = selection.getRangeAt(0);
  const text = selection.toString().trim();
  
  // Validate selection
  if (text.length < 1) return;
  
  // Check if selection is already inside a highlight
  if (this.isSelectionInsideHighlight(range)) {
    this.showNotification('Text is already highlighted');
    selection.removeAllRanges();
    return;
  }
  
  // Check if selection crosses highlight boundaries
  if (this.selectionCrossesHighlights(range)) {
    this.showNotification('Cannot highlight across existing highlights');
    selection.removeAllRanges();
    return;
  }
  
  // Create highlight
  this.createHighlight(range, text);
  selection.removeAllRanges();
}

// Add these helper methods to the class:
isSelectionInsideHighlight(range) {
  const startContainer = range.startContainer;
  const endContainer = range.endContainer;
  
  return this.isInsideHighlight(startContainer) || this.isInsideHighlight(endContainer);
}

selectionCrossesHighlights(range) {
  // Check if range starts or ends inside different highlights
  const commonAncestor = range.commonAncestorContainer;
  
  // Get all highlights in the range
  const highlightsInRange = Array.from(
    commonAncestor.querySelectorAll?.('.simple-highlight') || []
  );
  
  if (highlightsInRange.length === 0) return false;
  
  // Check if range boundaries are inside different highlights
  const startInHighlight = this.getContainingHighlight(range.startContainer);
  const endInHighlight = this.getContainingHighlight(range.endContainer);
  
  return startInHighlight && endInHighlight && startInHighlight !== endInHighlight;
}

getContainingHighlight(node) {
  let parent = node.parentNode;
  while (parent && parent !== document.body) {
    if (parent.classList && parent.classList.contains('simple-highlight')) {
      return parent;
    }
    parent = parent.parentNode;
  }
  return null;
}

  createHighlight(range, text) {
  if (!range || !text || text.length < 1) return;
  
  const highlightId = 'highlight-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  try {
    // First, collapse the range to prevent text shifting
    const clonedRange = range.cloneRange();
    
    // Create highlight span
    const span = document.createElement('span');
    span.className = 'simple-highlight';
    span.dataset.highlightId = highlightId;
    span.dataset.color = this.currentColor;
    
    // Apply color directly
    span.style.backgroundColor = this.getColorValue(this.currentColor);
    span.style.padding = '0 1px';
    span.style.margin = '0 1px';
    span.style.borderRadius = '2px';
    span.style.cursor = 'pointer';
    span.style.display = 'inline';
    span.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
    span.style.verticalAlign = 'baseline'; // Important for text alignment
    
    // Store reference to 'this' for event handlers
    const self = this;
    
    // Add tooltip on hover if enabled
    if (this.showTooltip) {
      span.title = `Highlighted (${this.currentColor}) - Click to remove`;
      
      span.addEventListener('mouseenter', function(e) {
        self.showTooltipFn(this, text);
      });
      
      span.addEventListener('mouseleave', function() {
        self.hideTooltipFn();
      });
    }
    
    // Click to remove
    span.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      self.removeHighlight(highlightId);
    });
    
    // Check if range is valid
    if (!range.collapsed && range.toString().trim().length > 0) {
      try {
        // Create a document fragment to hold the highlighted content
        const fragment = range.extractContents();
        
        // Wrap text nodes in span
        const walker = document.createTreeWalker(
          fragment,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let node;
        const textNodes = [];
        while (node = walker.nextNode()) {
          if (node.textContent.trim().length > 0) {
            textNodes.push(node);
          }
        }
        
        if (textNodes.length === 0) {
          // If no text nodes found, use the original approach
          span.appendChild(fragment);
          range.insertNode(span);
        } else {
          // For each text node, create a separate highlight span
          textNodes.forEach((textNode, index) => {
            if (textNode.textContent.trim().length > 0) {
              const textSpan = span.cloneNode(true);
              textSpan.dataset.highlightId = highlightId + '-' + index;
              textSpan.textContent = textNode.textContent;
              
              // Replace text node with highlight span
              textNode.parentNode.replaceChild(textSpan, textNode);
            }
          });
          
          // Insert the fragment back
          range.insertNode(fragment);
        }
        
        // Clear selection
        window.getSelection().removeAllRanges();
        
      } catch (error) {
        console.error('Error wrapping text:', error);
        // Fallback: simple text wrapping
        const spanClone = span.cloneNode(true);
        spanClone.textContent = text;
        range.deleteContents();
        range.insertNode(spanClone);
      }
    }
    
    // Save highlight
    this.saveHighlight({
      id: highlightId,
      text: text,
      color: this.currentColor,
      timestamp: Date.now(),
      html: span.outerHTML,
      xpath: this.getXPath(range.startContainer),
      offset: range.startOffset
    });
    
    this.showNotification(`"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" highlighted`);
    
  } catch (error) {
    console.error('Error creating highlight:', error);
    this.showNotification('Error creating highlight. Try selecting different text.');
  }
}
  getColorValue(colorName) {
    const colors = {
      yellow: 'rgba(255, 235, 59, 0.45)',
      green: 'rgba(76, 175, 80, 0.45)',
      blue: 'rgba(33, 150, 243, 0.45)',
      pink: 'rgba(233, 30, 99, 0.45)',
      red: 'rgba(244, 67, 54, 0.45)'
    };
    return colors[colorName] || colors.yellow;
  }

  // Renamed methods to avoid conflict with property name
  showTooltipFn(element, text) {
    if (!this.showTooltip) return;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'simple-highlight-tooltip';
    tooltip.textContent = text.length > 100 ? text.substring(0, 100) + '...' : text;
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = (rect.left + window.scrollX) + 'px';
    tooltip.style.top = (rect.top + window.scrollY - 10) + 'px';
    
    tooltip.id = 'current-tooltip';
    document.body.appendChild(tooltip);
  }

  hideTooltipFn() {
    const tooltip = document.getElementById('current-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }

  getXPath(node) {
    if (node.id) return `//*[@id="${node.id}"]`;
    
    const parts = [];
    while (node && node.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      let sibling = node.previousSibling;
      
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === node.nodeName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }
      
      const tagName = node.nodeName.toLowerCase();
      const part = index ? `${tagName}[${index + 1}]` : tagName;
      parts.unshift(part);
      
      node = node.parentNode;
    }
    
    return parts.length ? `/${parts.join('/')}` : null;
  }

  async saveHighlight(highlight) {
    const url = window.location.href;
    
    chrome.storage.local.get(['highlights'], (data) => {
      const allHighlights = data.highlights || {};
      if (!allHighlights[url]) {
        allHighlights[url] = [];
      }
      
      allHighlights[url].push(highlight);
      this.highlights = allHighlights[url];
      
      chrome.storage.local.set({highlights: allHighlights});
    });
  }

  async restoreHighlights() {
    // Remove existing highlights
    document.querySelectorAll('.simple-highlight').forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
    
    // Add highlights back
    const self = this;
    for (const highlight of this.highlights) {
      await this.restoreSingleHighlight(highlight, self);
    }
  }

async restoreSingleHighlight(highlight, self) {
  try {
    // Don't restore if text is too short
    if (!highlight.text || highlight.text.trim().length < 1) {
      return;
    }
    
    // Create new span with correct color
    const span = document.createElement('span');
    span.className = 'simple-highlight';
    span.dataset.highlightId = highlight.id;
    span.dataset.color = highlight.color;
    span.style.backgroundColor = this.getColorValue(highlight.color);
    span.style.padding = '0 1px';
    span.style.margin = '0 1px';
    span.style.borderRadius = '2px';
    span.style.cursor = 'pointer';
    span.style.display = 'inline';
    span.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
    span.style.verticalAlign = 'baseline';
    span.textContent = highlight.text;
    
    // Add event listeners
    if (this.showTooltip) {
      span.title = `Highlighted (${highlight.color}) - Click to remove`;
      
      span.addEventListener('mouseenter', function(e) {
        self.showTooltipFn(this, highlight.text);
      });
      
      span.addEventListener('mouseleave', function() {
        self.hideTooltipFn();
      });
    }
    
    span.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      self.removeHighlight(highlight.id);
    });
    
    // Try to find the text in the document
    const bodyText = document.body.textContent || document.body.innerText;
    const index = bodyText.indexOf(highlight.text);
    
    if (index !== -1) {
      // Use a more robust text search
      const result = this.findTextPosition(highlight.text);
      
      if (result) {
        const {node, offset} = result;
        const range = document.createRange();
        range.setStart(node, offset);
        range.setEnd(node, offset + highlight.text.length);
        
        // Replace the text with our highlight
        range.deleteContents();
        range.insertNode(span);
        
        // Normalize to merge text nodes
        if (span.parentNode) {
          span.parentNode.normalize();
        }
      }
    }
  } catch (error) {
    console.log('Could not restore highlight:', error, highlight);
  }
}

// Add this new helper method to the class:
findTextPosition(searchText) {
  if (!searchText || searchText.length < 3) return null;
  
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    const nodeText = node.textContent;
    const index = nodeText.indexOf(searchText);
    
    if (index !== -1) {
      // Check if this is the best match (not inside another highlight)
      if (!this.isInsideHighlight(node)) {
        return {node, offset: index};
      }
    }
  }
  
  return null;
}

// Add this helper method too:
isInsideHighlight(node) {
  let parent = node.parentNode;
  while (parent && parent !== document.body) {
    if (parent.classList && parent.classList.contains('simple-highlight')) {
      return true;
    }
    parent = parent.parentNode;
  }
  return false;
}

  removeHighlight(highlightId) {
    // Remove from DOM
    const element = document.querySelector(`[data-highlight-id="${highlightId}"]`);
    if (element) {
      const parent = element.parentNode;
      parent.replaceChild(document.createTextNode(element.textContent), element);
      parent.normalize();
    }
    
    // Remove from storage
    const url = window.location.href;
    chrome.storage.local.get(['highlights'], (data) => {
      const allHighlights = data.highlights || {};
      if (allHighlights[url]) {
        allHighlights[url] = allHighlights[url].filter(h => h.id !== highlightId);
        this.highlights = allHighlights[url];
        chrome.storage.local.set({highlights: allHighlights});
      }
    });
    
    this.showNotification('Highlight removed');
  }

  clearAllHighlights() {
    document.querySelectorAll('.simple-highlight').forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
    
    this.highlights = [];
    this.showNotification('All highlights cleared from page');
  }

  scrollToHighlight(index) {
    if (this.highlights[index]) {
      const element = document.querySelector(`[data-highlight-id="${this.highlights[index].id}"]`);
      if (element) {
        element.scrollIntoView({behavior: 'smooth', block: 'center'});
        
        // Flash animation
        const originalColor = element.style.backgroundColor;
        element.style.backgroundColor = '#fff176';
        setTimeout(() => {
          element.style.backgroundColor = originalColor;
        }, 1000);
      }
    }
  }

  showNotification(message) {
    // Remove existing notification
    const existing = document.getElementById('simple-highlighter-notification');
    if (existing) existing.remove();
    
    // Create a simple notification
    const notification = document.createElement('div');
    notification.id = 'simple-highlighter-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-family: sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: fadeInOut 3s ease-in-out;
    `;
    
    // Add animation style if not exists
    if (!document.getElementById('simple-highlighter-animation')) {
      const style = document.createElement('style');
      style.id = 'simple-highlighter-animation';
      style.textContent = `
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; transform: translateY(-10px); }
          10%, 90% { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  // ===== DEBUG METHOD =====
  debugColors() {
    console.log('=== HIGHLIGHTER DEBUG ===');
    console.log('Current active color:', this.currentColor);
    console.log('Highlight mode active:', this.isHighlightMode);
    console.log('Show tooltip:', this.showTooltip);
    console.log('Available colors:', {
      yellow: this.getColorValue('yellow'),
      green: this.getColorValue('green'),
      blue: this.getColorValue('blue'),
      pink: this.getColorValue('pink'),
      red: this.getColorValue('red')
    });
    
    // Check DOM highlights
    const highlights = document.querySelectorAll('.simple-highlight');
    console.log(`Found ${highlights.length} highlights in DOM:`);
    
    highlights.forEach((h, i) => {
      const computedColor = window.getComputedStyle(h).backgroundColor;
      const dataColor = h.dataset.color || 'none';
      const match = dataColor && computedColor.includes(this.getColorValue(dataColor).replace(/[^0-9.,]/g, ''));
      
      console.log(`Highlight ${i}:`, {
        'Data Color': dataColor,
        'Actual BG Color': computedColor,
        'Matches?': match ? '✅' : '❌',
        'Text Preview': h.textContent.substring(0, 50) + (h.textContent.length > 50 ? '...' : ''),
        'Element': h
      });
    });
    
    // Check storage highlights
    const url = window.location.href;
    chrome.storage.local.get(['highlights'], (data) => {
      const allHighlights = data.highlights || {};
      const pageHighlights = allHighlights[url] || [];
      console.log(`Storage highlights for this page: ${pageHighlights.length}`);
      
      pageHighlights.forEach((h, i) => {
        console.log(`Stored Highlight ${i}:`, {
          id: h.id,
          color: h.color,
          text: h.text.substring(0, 30) + '...',
          timestamp: new Date(h.timestamp).toLocaleTimeString()
        });
      });
    });
    
    console.log('=== END DEBUG ===');
  }
  // ===== END DEBUG METHOD =====
}

// Initialize
const highlighter = new SimpleHighlighter();

// Expose for debugging
window.debugHighlighter = () => highlighter.debugColors();
window.highlighter = highlighter;

console.log('🎨 Simple Highlighter loaded successfully');