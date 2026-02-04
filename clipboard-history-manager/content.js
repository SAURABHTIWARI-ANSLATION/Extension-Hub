// Content Script - Monitors clipboard actions
let lastCopiedText = '';

// Listen for copy events
document.addEventListener('copy', handleCopy);
document.addEventListener('cut', handleCopy);

// Listen for paste events to track usage
document.addEventListener('paste', handlePaste);

// Handle copy events
function handleCopy(event) {
    setTimeout(() => {
        const selectedText = window.getSelection().toString();
        if (selectedText && selectedText !== lastCopiedText) {
            lastCopiedText = selectedText;
            
            // Send to background script
            chrome.runtime.sendMessage({
                action: 'saveClipboard',
                text: selectedText
            });
        }
    }, 100);
}

// Handle paste events
function handlePaste(event) {
    // We could track paste events here if needed
}

// Also monitor keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Ctrl+C or Cmd+C
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        setTimeout(checkClipboard, 100);
    }
});

// Check clipboard content
function checkClipboard() {
    // Note: Direct clipboard access requires user permission
    // For now, we rely on the copy event
}

// Monitor right-click copy from context menu
document.addEventListener('contextmenu', (event) => {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
        lastCopiedText = selectedText;
    }
});

// Send message when extension is loaded
chrome.runtime.sendMessage({ action: 'contentScriptLoaded' });