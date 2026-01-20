// SIMPLE Content Script - Just Works!
console.log('Text Case Converter content script loaded on:', window.location.href);

// Store last selection
let lastSelection = '';
let lastSelectionTime = 0;

// Function to detect ALL text on page
function scanPageForText() {
    console.log('Scanning page for text...');
    
    const results = [];
    
    // 1. First check for selected text (most important)
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
        console.log('Found selected text:', selectedText.substring(0, 50) + '...');
        results.push({
            text: selectedText,
            source: 'Selected Text',
            type: 'selection',
            length: selectedText.length
        });
    }
    
    // 2. Check textareas and inputs
    const textAreas = document.querySelectorAll('textarea');
    textAreas.forEach((ta, index) => {
        if (ta.value && ta.value.trim()) {
            results.push({
                text: ta.value.trim(),
                source: 'Text Area',
                type: 'textarea',
                length: ta.value.length
            });
        }
    });
    
    const textInputs = document.querySelectorAll('input[type="text"], input[type="search"], input[type="email"]');
    textInputs.forEach((input, index) => {
        if (input.value && input.value.trim()) {
            results.push({
                text: input.value.trim(),
                source: 'Input Field',
                type: 'input',
                length: input.value.length
            });
        }
    });
    
    // 3. Check contenteditable areas
    const editableAreas = document.querySelectorAll('[contenteditable="true"]');
    editableAreas.forEach((area, index) => {
        const text = area.textContent || area.innerText;
        if (text && text.trim()) {
            results.push({
                text: text.trim(),
                source: 'Editable Content',
                type: 'editable',
                length: text.length
            });
        }
    });
    
    // 4. Get some paragraphs (limit to avoid too much data)
    const paragraphs = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, span, li');
    let pCount = 0;
    
    for (const p of paragraphs) {
        if (pCount >= 10) break; // Limit to 10 paragraphs
        
        const text = p.textContent || p.innerText;
        if (text && text.trim() && text.length > 10) {
            // Skip if text is too long
            const cleanText = text.trim().substring(0, 500);
            results.push({
                text: cleanText,
                source: p.tagName,
                type: 'paragraph',
                length: cleanText.length
            });
            pCount++;
        }
    }
    
    console.log('Scan complete. Found', results.length, 'text items');
    
    // Return results
    if (results.length > 0) {
        return {
            items: results,
            pageTitle: document.title,
            url: window.location.href,
            timestamp: Date.now()
        };
    }
    
    return null;
}

// Function to replace selected text
function replaceSelectedText(newText) {
    console.log('Replacing text with:', newText.substring(0, 50) + '...');
    
    try {
        // Try to get current selection
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            
            // Save the selection position
            const startOffset = range.startOffset;
            const endOffset = range.endOffset;
            const startContainer = range.startContainer;
            const endContainer = range.endContainer;
            
            // Replace the text
            range.deleteContents();
            range.insertNode(document.createTextNode(newText));
            
            // Try to restore selection
            try {
                const newRange = document.createRange();
                newRange.setStart(startContainer, startOffset);
                newRange.setEnd(endContainer, endOffset);
                selection.removeAllRanges();
                selection.addRange(newRange);
            } catch (e) {
                // If we can't restore selection, that's okay
                console.log('Could not restore selection:', e.message);
            }
            
            console.log('Text replaced successfully');
            return true;
        } else {
            console.log('No active selection to replace');
            return false;
        }
    } catch (error) {
        console.error('Error replacing text:', error);
        return false;
    }
}

// Listen for selection changes
document.addEventListener('selectionchange', function() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    // Only send if text changed and has content
    if (selectedText && selectedText !== lastSelection) {
        lastSelection = selectedText;
        lastSelectionTime = Date.now();
        
        console.log('Selection detected:', selectedText.substring(0, 50) + '...');
        
        // Send to background script
        chrome.runtime.sendMessage({
            action: "textSelected",
            text: selectedText,
            source: 'Page Selection',
            timestamp: Date.now(),
            length: selectedText.length
        });
    }
});

// Also listen for mouseup (better detection)
document.addEventListener('mouseup', function(e) {
    setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText && selectedText !== lastSelection) {
            lastSelection = selectedText;
            
            chrome.runtime.sendMessage({
                action: "textSelected",
                text: selectedText,
                source: 'Page Selection',
                timestamp: Date.now(),
                length: selectedText.length
            });
        }
    }, 100);
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received request:', request.action);
    
    if (request.action === "scanPage") {
        console.log('Starting page scan...');
        const result = scanPageForText();
        console.log('Scan result:', result ? result.items.length + ' items' : 'no items');
        sendResponse({ 
            success: !!result, 
            data: result 
        });
    }
    
    else if (request.action === "applyText") {
        console.log('Applying text...');
        const success = replaceSelectedText(request.text);
        sendResponse({ 
            success: success,
            message: success ? 'Text replaced' : 'Failed to replace text'
        });
    }
    
    else if (request.action === "getCurrentSelection") {
        console.log('Getting current selection...');
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText) {
            console.log('Current selection:', selectedText.substring(0, 50) + '...');
            sendResponse({
                success: true,
                text: selectedText,
                source: 'Current Selection',
                length: selectedText.length
            });
        } else {
            console.log('No text currently selected');
            sendResponse({
                success: false,
                message: 'No text selected'
            });
        }
    }
    
    else if (request.action === "ping") {
        console.log('Ping received');
        sendResponse({
            alive: true,
            ready: true,
            page: window.location.href
        });
    }
    
    else if (request.action === "test") {
        console.log('Test request received');
        sendResponse({
            success: true,
            message: 'Content script is working!',
            pageTitle: document.title,
            url: window.location.href
        });
    }
    
    // Important: Return true to keep message channel open for async responses
    return true;
});

// Initialize
console.log('Text Case Converter content script initialized');
chrome.runtime.sendMessage({
    action: "contentScriptReady",
    url: window.location.href,
    timestamp: Date.now()
});