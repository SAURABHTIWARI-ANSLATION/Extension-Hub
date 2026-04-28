let lastSelectionText = "";
let lastSelectionRange = null;
let lastEditableTarget = null;
let isConnected = false;
let retryCount = 0;
const MAX_RETRIES = 3;
let initAttempted = false;

// Safe wrapper for chrome.runtime methods
function isRuntimeAvailable() {
  try {
    return typeof chrome !== 'undefined' && 
           chrome !== null &&
           typeof chrome.runtime !== 'undefined' &&
           chrome.runtime !== null &&
           typeof chrome.runtime.sendMessage === 'function';
  } catch (e) {
    return false;
  }
}

// Establish connection with background with retry
function initConnection() {
  // Prevent multiple initialization attempts
  if (initAttempted && retryCount >= MAX_RETRIES) {
    return;
  }
  
  initAttempted = true;
  
  if (!isRuntimeAvailable()) {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      setTimeout(initConnection, 1000 * retryCount); // Exponential backoff
    }
    return;
  }
  
  try {
    const port = chrome.runtime.connect({ name: "contentScript" });
    port.onDisconnect.addListener(() => {
      isConnected = false;
    });
    isConnected = true;
    retryCount = 0;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      setTimeout(initConnection, 1000 * retryCount);
    }
  }
}

// Delay initialization to ensure extension context is ready
setTimeout(initConnection, 100);

// Debounce function to prevent excessive calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Capture selection with debounce
const debouncedCapture = debounce(captureSelection, 100);

// Safely add event listeners
try {
  document.addEventListener("selectionchange", debouncedCapture);
  document.addEventListener("mouseup", () => setTimeout(debouncedCapture, 50));
  document.addEventListener("keyup", () => setTimeout(debouncedCapture, 50));
} catch (e) {
  // Silent fail
}

function captureSelection() {
  // Don't capture if runtime not available
  if (!isRuntimeAvailable()) {
    return;
  }
  
  try {
    const activeElement = document.activeElement;
    if (isTextField(activeElement)) {
      const selectedText = getFieldSelection(activeElement);
      if (selectedText && selectedText !== lastSelectionText) {
        lastSelectionText = selectedText;
        lastEditableTarget = activeElement;
        notifySelection(selectedText, "Input selection");
      }
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : "";
    if (!selectedText || selectedText === lastSelectionText) {
      return;
    }

    if (selection && selection.rangeCount > 0) {
      lastSelectionRange = selection.getRangeAt(0).cloneRange();
    }

    const anchorElement = selection?.anchorNode?.nodeType === Node.TEXT_NODE
      ? selection.anchorNode.parentElement
      : selection?.anchorNode;

    if (anchorElement && typeof anchorElement.closest === 'function' && anchorElement.closest("[contenteditable='true']")) {
      lastEditableTarget = anchorElement.closest("[contenteditable='true']");
    } else {
      lastEditableTarget = null;
    }

    lastSelectionText = selectedText;
    notifySelection(selectedText, "Page selection");
  } catch (error) {
    // Silent fail - don't break page functionality
  }
}

function notifySelection(text, source) {
  // Check if runtime is available before sending
  if (!isRuntimeAvailable()) {
    return;
  }
  
  try {
    chrome.runtime.sendMessage({
      action: "textSelected",
      text: text.slice(0, 5000),
      source
    }).catch(() => {
      // Background might not be ready, silently fail
    });
  } catch (error) {
    // Silent fail - don't break the page
  }
}

function scanPageForText() {
  const results = [];
  const seen = new Set();

  if (lastSelectionText) {
    addResult(results, seen, lastSelectionText, "Selected text");
  }

  try {
    // Limit to prevent performance issues
    const textareas = document.querySelectorAll("textarea, input[type='text'], input[type='search'], input[type='email']");
    for (const element of Array.from(textareas).slice(0, 5)) {
      addResult(results, seen, element.value, element.tagName === "TEXTAREA" ? "Textarea" : "Input field");
    }

    const editableElements = document.querySelectorAll("[contenteditable='true']");
    for (const element of Array.from(editableElements).slice(0, 3)) {
      addResult(results, seen, element.innerText || element.textContent, "Editable content");
    }

    const blocks = document.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption");
    for (const block of Array.from(blocks).slice(0, 18)) {
      addResult(results, seen, block.innerText || block.textContent, block.tagName.toLowerCase());
    }
  } catch (e) {
    // Silent fail
  }

  return results;
}

function addResult(results, seen, rawText, source) {
  if (!rawText) return;
  
  const text = String(rawText).replace(/\s+/g, " ").trim();
  if (!text || text.length < 2) {
    return;
  }

  const normalized = text.toLowerCase();
  if (seen.has(normalized)) {
    return;
  }

  seen.add(normalized);
  results.push({
    text: text.length > 900 ? `${text.slice(0, 900)}...` : text,
    source
  });
}

function applyText(newText) {
  try {
    const activeElement = document.activeElement;
    if (isTextField(activeElement) && replaceInField(activeElement, newText)) {
      return { success: true, message: "Applied inside active field." };
    }

    if (lastEditableTarget && isContentEditable(lastEditableTarget) && replaceInEditable(lastEditableTarget, newText)) {
      return { success: true, message: "Applied inside editable content." };
    }

    if (lastSelectionRange) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(lastSelectionRange);
        lastSelectionRange.deleteContents();
        lastSelectionRange.insertNode(document.createTextNode(newText));
        selection.removeAllRanges();
        lastSelectionText = newText;
        return { success: true, message: "Applied to saved text selection." };
      }
    }

    return {
      success: false,
      message: "No editable selection found. Copy and paste manually."
    };
  } catch (error) {
    return {
      success: false,
      message: "Error applying text: " + error.message
    };
  }
}

function replaceInField(field, newText) {
  const start = field.selectionStart;
  const end = field.selectionEnd;
  if (typeof start !== "number" || typeof end !== "number" || start === end) {
    return false;
  }

  const previousValue = field.value;
  field.value = `${previousValue.slice(0, start)}${newText}${previousValue.slice(end)}`;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.selectionStart = start;
  field.selectionEnd = start + newText.length;
  lastSelectionText = newText;
  lastEditableTarget = field;
  return true;
}

function replaceInEditable(element, newText) {
  if (lastSelectionRange) {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(lastSelectionRange);
      lastSelectionRange.deleteContents();
      lastSelectionRange.insertNode(document.createTextNode(newText));
      element.dispatchEvent(new Event("input", { bubbles: true }));
      selection.removeAllRanges();
      lastSelectionText = newText;
      return true;
    }
  }
  return false;
}

function getCurrentSelection() {
  try {
    const activeElement = document.activeElement;
    if (isTextField(activeElement)) {
      const text = getFieldSelection(activeElement);
      if (text) {
        return { success: true, text, source: "Input selection" };
      }
    }

    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : (lastSelectionText || "");
    if (!text) {
      return { success: false, message: "No text selected." };
    }

    return { success: true, text: text.slice(0, 5000), source: "Page selection" };
  } catch (error) {
    return { success: false, message: "Error getting selection" };
  }
}

function getFieldSelection(field) {
  if (!field || typeof field.selectionStart !== "number" || typeof field.selectionEnd !== "number") {
    return "";
  }

  if (field.selectionStart === field.selectionEnd) {
    return "";
  }

  return field.value.slice(field.selectionStart, field.selectionEnd).trim();
}

function isTextField(element) {
  return Boolean(
    element &&
    (element.tagName === "TEXTAREA" ||
      (element.tagName === "INPUT" && ["text", "search", "email", "url", "tel"].includes(element.type)))
  );
}

function isContentEditable(element) {
  return Boolean(element && element.isContentEditable);
}

// Message listener with error handling
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    try {
      if (request.action === "ping") {
        sendResponse({ success: true, alive: true });
        return true;
      }

      if (request.action === "scanPage") {
        const items = scanPageForText();
        sendResponse({
          success: items.length > 0,
          data: { items }
        });
        return true;
      }

      if (request.action === "getCurrentSelection") {
        sendResponse(getCurrentSelection());
        return true;
      }

      if (request.action === "applyText") {
        sendResponse(applyText(request.text || ""));
        return true;
      }
    } catch (error) {
      sendResponse({ success: false, message: error.message });
      return true;
    }
    
    return true;
  });
}

// Re-initialize connection when page becomes visible again
try {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !isConnected && isRuntimeAvailable()) {
      initConnection();
    }
  });
} catch (e) {
  // Silent fail
}