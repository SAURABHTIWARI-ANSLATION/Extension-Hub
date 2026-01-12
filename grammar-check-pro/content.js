// Grammar Check Pro - Content Script (Fixed)
console.log('Grammar Check Pro content script loaded');

// Configuration
const config = {
  highlightErrors: true,
  showSuggestions: true,
  autoCheck: false,
  checkInterval: 3000
};

// State
let currentErrors = [];
let highlightedElements = [];
let isChecking = false;
let activePopup = null;
let extensionContextValid = true;

// Initialize
function initialize() {
  console.log('Initializing Grammar Check Pro content script');
  
  loadSettings();
  setupMutationObserver();
  addStyles();
  setupMessageListener();
  setupContextWatcher();
  
  console.log('Grammar Check Pro content script ready');
}

// Watch for extension context invalidation
function setupContextWatcher() {
  // Periodically check if extension is still valid
  setInterval(() => {
    chrome.runtime.sendMessage({ type: 'PING' }).catch(error => {
      if (error.message && error.message.includes('Extension context invalidated')) {
        extensionContextValid = false;
        console.warn('Extension context has been invalidated');
        showContextInvalidatedNotification();
      }
    });
  }, 5000);
}

// Load settings from storage
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get([
      'autoCheck',
      'spellCheck',
      'grammarCheck',
      'highlightErrors'
    ]);
    
    config.autoCheck = settings.autoCheck || false;
    config.highlightErrors = settings.highlightErrors !== false;
    
    if (config.autoCheck) {
      startAutoCheck();
    }
  } catch (error) {
    console.warn('Failed to load settings:', error);
  }
}

// Add custom styles
function addStyles() {
  const style = document.createElement('style');
  style.id = 'grammar-check-pro-styles';
  style.textContent = `
    .grammar-error {
      position: relative;
      background-color: rgba(239, 68, 68, 0.1) !important;
      border-bottom: 2px dashed #ef4444 !important;
      cursor: pointer !important;
    }
    
    .spelling-error {
      background-color: rgba(239, 68, 68, 0.1) !important;
      border-bottom: 2px solid #ef4444 !important;
    }
    
    .grammar-issue {
      background-color: rgba(245, 158, 11, 0.1) !important;
      border-bottom: 2px dashed #f59e0b !important;
    }
    
    .style-issue {
      background-color: rgba(59, 130, 246, 0.1) !important;
      border-bottom: 2px dashed #3b82f6 !important;
    }
    
    .grammar-tooltip {
      position: absolute;
      background: #1f2937;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-width: 300px;
      min-width: 200px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .grammar-tooltip.show {
      opacity: 1;
    }
    
    .grammar-tooltip-title {
      font-weight: bold;
      margin-bottom: 4px;
      color: #fbbf24;
    }
    
    .grammar-tooltip-message {
      margin-bottom: 6px;
      line-height: 1.4;
    }
    
    .grammar-tooltip-suggestion {
      color: #34d399;
      font-weight: 500;
    }
    
    .grammar-correction {
      background-color: rgba(16, 185, 129, 0.1) !important;
      border-bottom: 2px solid #10b981 !important;
    }
    
    .grammar-check-pro-popup {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      padding: 16px;
      z-index: 10000;
      max-width: 320px;
      border: 1px solid #e5e7eb;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .grammar-check-pro-popup h4 {
      margin: 0 0 8px 0;
      color: #1f2937;
      font-size: 14px;
      font-weight: 600;
    }
    
    .grammar-check-pro-popup p {
      margin: 0 0 12px 0;
      color: #6b7280;
      font-size: 13px;
      line-height: 1.4;
    }
    
    .grammar-popup-buttons {
      display: flex;
      gap: 8px;
    }
    
    .grammar-popup-btn {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      flex: 1;
    }
    
    .grammar-popup-btn:hover {
      background: #4338ca;
    }
    
    .grammar-popup-btn.secondary {
      background: #e5e7eb;
      color: #374151;
    }
    
    .grammar-popup-btn.secondary:hover {
      background: #d1d5db;
    }
    
    .grammar-popup-close {
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      font-size: 20px;
      color: #9ca3af;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
    }
    
    .grammar-popup-close:hover {
      color: #374151;
    }
  `;
  
  document.head.appendChild(style);
}

// Set up mutation observer
function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    if (config.autoCheck && !isChecking) {
      clearTimeout(window.grammarCheckTimeout);
      window.grammarCheckTimeout = setTimeout(() => {
        checkPageContent();
      }, 1000);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

// Set up message listener
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received:', message.type);
    
    try {
      switch (message.type) {
        case 'GET_PAGE_TEXT':
          sendResponse({
            text: getPageText(),
            url: window.location.href,
            title: document.title
          });
          break;
          
        case 'GET_SELECTED_TEXT':
          sendResponse({
            text: getSelectedText(),
            url: window.location.href
          });
          break;
          
        case 'CHECK_PAGE':
          checkPageContent().then(result => {
            sendResponse(result);
          });
          return true; // Keep channel open
          
        case 'HIGHLIGHT_ERRORS':
          highlightErrors(message.errors);
          sendResponse({ success: true });
          break;
          
        case 'CLEAR_HIGHLIGHTS':
          clearHighlights();
          sendResponse({ success: true });
          break;
          
        case 'CHECK_ELEMENT':
          const element = document.querySelector(message.selector);
          if (element) {
            const result = checkElement(element);
            sendResponse(result);
          } else {
            sendResponse({ error: 'Element not found' });
          }
          break;
          
        case 'APPLY_CORRECTION':
          applyCorrectionById(message.errorId, message.correction);
          sendResponse({ success: true });
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Message handler error:', error);
      
      // Handle extension context invalidation
      if (error.message && error.message.includes('Extension context invalidated')) {
        sendResponse({ 
          error: 'Extension context invalidated. Please reload the page.',
          contextInvalidated: true
        });
      } else {
        sendResponse({ error: error.message });
      }
    }
    
    return false;
  });
}

// Get page text
function getPageText() {
  const selectors = [
    'article',
    'main',
    '.content',
    '.post',
    '.article',
    '#content',
    'p',
    'div[role="article"]'
  ];
  
  let text = '';
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (el.offsetParent !== null) {
        text += el.textContent + '\n\n';
      }
    });
  });
  
  if (!text.trim()) {
    text = document.body.textContent;
  }
  
  return text.trim();
}

// Get selected text
function getSelectedText() {
  const selection = window.getSelection();
  return selection.toString().trim();
}

// Check page content
async function checkPageContent() {
  if (isChecking) return { checking: true };
  
  isChecking = true;
  console.log('Checking page content...');
  
  try {
    const text = getPageText();
    
    if (!text || text.length < 10) {
      isChecking = false;
      return { text: '', errors: [], noContent: true };
    }
    
    // Send to background for checking with retry logic
    let result = null;
    let retries = 3;
    
    while (retries > 0) {
      try {
        result = await chrome.runtime.sendMessage({
          type: 'CHECK_GRAMMAR',
          text: text
        });
        break; // Success, exit retry loop
      } catch (sendError) {
        // Check if this is an extension context error
        if (sendError.message && sendError.message.includes('Extension context invalidated')) {
          console.warn('Extension context invalidated, retrying...', retries - 1);
          retries--;
          
          if (retries > 0) {
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            // All retries exhausted
            console.error('Extension context invalidated after retries');
            isChecking = false;
            return { 
              error: 'Extension context invalidated. Please reload the page or restart the extension.',
              contextInvalidated: true
            };
          }
        } else {
          // Different error, don't retry
          throw sendError;
        }
      }
    }
    
    currentErrors = result.errors || [];
    
    if (config.highlightErrors && currentErrors.length > 0) {
      highlightErrors(currentErrors);
    }
    
    isChecking = false;
    
    return {
      text: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
      errors: currentErrors,
      total: currentErrors.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Page check error:', error);
    isChecking = false;
    
    // Handle extension context invalidation
    if (error.message && error.message.includes('Extension context invalidated')) {
      return { 
        error: 'Extension context invalidated. Please reload the page or restart the extension.',
        contextInvalidated: true
      };
    }
    
    return { error: error.message };
  }
}

// Check specific element
function checkElement(element) {
  const text = element.textContent;
  const errors = [];
  
  const commonMisspellings = {
    'recieve': 'receive',
    'seperate': 'separate',
    'definately': 'definitely',
    'occured': 'occurred',
    'wierd': 'weird'
  };
  
  Object.keys(commonMisspellings).forEach(badWord => {
    const regex = new RegExp(`\\b${badWord}\\b`, 'gi');
    const matches = text.match(regex);
    
    if (matches) {
      matches.forEach(match => {
        errors.push({
          type: 'spelling',
          word: match,
          correct: commonMisspellings[badWord],
          position: text.indexOf(match),
          message: `Misspelled: "${match}"`,
          suggestion: `Did you mean "${commonMisspellings[badWord]}"?`
        });
      });
    }
  });
  
  return {
    text: text,
    errors: errors,
    total: errors.length,
    element: element.tagName
  };
}

// Highlight errors in page
function highlightErrors(errors) {
  clearHighlights();
  
  errors.forEach((error, index) => {
    if (error.position !== undefined && (error.word || error.pattern)) {
      highlightError(error, index);
    }
  });
  
  console.log(`Highlighted ${highlightedElements.length} errors`);
}

// Highlight a single error
function highlightError(error, errorId) {
  const searchText = error.word || error.pattern;
  if (!searchText) return;
  
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  const nodes = [];
  
  while (node = walker.nextNode()) {
    if (node.textContent.includes(searchText)) {
      nodes.push(node);
    }
  }
  
  nodes.forEach(node => {
    const parent = node.parentNode;
    if (parent && !parent.classList.contains('grammar-error')) {
      const html = node.textContent.replace(
        new RegExp(`(${escapeRegex(searchText)})`, 'gi'),
        `<span class="grammar-error ${error.type}-error" data-error-id="${errorId}" data-error-type="${error.type}">$1</span>`
      );
      
      const span = document.createElement('span');
      span.innerHTML = html;
      parent.replaceChild(span, node);
      
      const errorElement = span.querySelector('.grammar-error');
      if (errorElement) {
        addTooltip(errorElement, error, errorId);
        highlightedElements.push(errorElement);
      }
    }
  });
}

// Escape regex special characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Add tooltip to error element
function addTooltip(element, error, errorId) {
  element.addEventListener('mouseenter', (e) => {
    const tooltip = document.createElement('div');
    tooltip.className = 'grammar-tooltip';
    tooltip.innerHTML = `
      <div class="grammar-tooltip-title">${error.type.toUpperCase()} ERROR</div>
      <div class="grammar-tooltip-message">${error.message}</div>
      ${error.suggestion ? `<div class="grammar-tooltip-suggestion">${error.suggestion}</div>` : ''}
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
    
    setTimeout(() => tooltip.classList.add('show'), 10);
    
    element._tooltip = tooltip;
  });
  
  element.addEventListener('mouseleave', (e) => {
    if (element._tooltip) {
      element._tooltip.remove();
      delete element._tooltip;
    }
  });
  
  element.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showCorrectionPopup(element, error, errorId);
  });
}

// Show correction popup (NO GLOBAL FUNCTIONS)
function showCorrectionPopup(element, error, errorId) {
  // Remove existing popup
  if (activePopup) {
    activePopup.remove();
    activePopup = null;
  }
  
  const popup = document.createElement('div');
  popup.className = 'grammar-check-pro-popup';
  activePopup = popup;
  
  let buttonsHTML = '';
  if (error.correct) {
    buttonsHTML = `
      <p>Suggested correction: <strong>${error.correct}</strong></p>
      <div class="grammar-popup-buttons">
        <button class="grammar-popup-btn" data-action="apply">Apply</button>
        <button class="grammar-popup-btn secondary" data-action="ignore">Ignore</button>
      </div>
    `;
  } else {
    buttonsHTML = `
      <p>${error.message}</p>
      <div class="grammar-popup-buttons">
        <button class="grammar-popup-btn secondary" data-action="ignore">Ignore</button>
      </div>
    `;
  }
  
  popup.innerHTML = `
    <button class="grammar-popup-close" data-action="close">&times;</button>
    <h4>✍️ Grammar Check Pro</h4>
    ${buttonsHTML}
  `;
  
  document.body.appendChild(popup);
  
  // Position popup
  const rect = element.getBoundingClientRect();
  popup.style.left = Math.min(rect.left + window.scrollX, window.innerWidth - 340) + 'px';
  popup.style.top = (rect.bottom + window.scrollY + 10) + 'px';
  
  // Add event listeners using event delegation
  popup.addEventListener('click', (e) => {
    const button = e.target.closest('[data-action]');
    if (!button) return;
    
    const action = button.dataset.action;
    
    if (action === 'apply' && error.correct) {
      applyCorrectionToElement(element, error.correct);
      chrome.runtime.sendMessage({
        type: 'APPLIED_CORRECTION',
        correction: { from: error.word, to: error.correct }
      });
    } else if (action === 'ignore') {
      element.classList.remove('grammar-error', 'spelling-error', 'grammar-issue', 'style-issue');
    } else if (action === 'close') {
      // Just close
    }
    
    popup.remove();
    activePopup = null;
  });
}

// Apply correction to element
function applyCorrectionToElement(element, correction) {
  element.textContent = correction;
  element.classList.remove('grammar-error', 'spelling-error', 'grammar-issue', 'style-issue');
  element.classList.add('grammar-correction');
}

// Apply correction by error ID
function applyCorrectionById(errorId, correction) {
  const errorElements = document.querySelectorAll(`[data-error-id="${errorId}"]`);
  
  errorElements.forEach(element => {
    applyCorrectionToElement(element, correction);
  });
}

// Clear all highlights
function clearHighlights() {
  highlightedElements.forEach(element => {
    if (element._tooltip) {
      element._tooltip.remove();
    }
    
    const text = document.createTextNode(element.textContent);
    if (element.parentNode) {
      element.parentNode.replaceChild(text, element);
    }
  });
  
  highlightedElements = [];
  
  document.querySelectorAll('.grammar-tooltip').forEach(tooltip => tooltip.remove());
  
  if (activePopup) {
    activePopup.remove();
    activePopup = null;
  }
}

// Start auto-check
function startAutoCheck() {
  console.log('Starting auto-check');
  
  setTimeout(checkPageContent, 2000);
  
  setInterval(() => {
    if (document.hasFocus() && !isChecking) {
      checkPageContent();
    }
  }, config.checkInterval);
}

// Show notification when extension context is invalidated
function showContextInvalidatedNotification() {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc2626;
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    z-index: 100000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    max-width: 320px;
  `;
  
  notification.innerHTML = `
    <strong>Grammar Check Pro</strong><br>
    Extension context invalidated. Please reload the page to continue.
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

console.log('Grammar Check Pro content script initialization complete');