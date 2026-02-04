/**
 * Content Script for Code Snippet Manager
 * Handles snippet insertion into web pages
 */

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        if (request.action === 'insertCode') {
            insertCode(request.code, request.language);
            sendResponse({ success: true });
        }
    } catch (error) {
        console.error('Content script error:', error);
        sendResponse({ success: false, error: error.message });
    }
});

/**
 * Insert code into the active element or show a floating window
 */
function insertCode(code, language) {
    // Try to find the active text input or contenteditable element
    const activeElement = document.activeElement;
    
    if (activeElement && 
        (activeElement.tagName === 'TEXTAREA' || 
         (activeElement.tagName === 'INPUT' && activeElement.type === 'text') || 
         activeElement.isContentEditable)) {
        // Insert at cursor position for input/textarea
        if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            const text = activeElement.value;
            activeElement.value = text.substring(0, start) + code + text.substring(end);
            activeElement.selectionStart = activeElement.selectionEnd = start + code.length;
            
            // Trigger input event for frameworks that listen to it
            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
            activeElement.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (activeElement.isContentEditable) {
            // Insert into contenteditable element
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const textNode = document.createTextNode(code);
                range.insertNode(textNode);
                range.setStartAfter(textNode);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                document.execCommand('insertText', false, code);
            }
        }
        activeElement.focus();
    } else {
        // Create a floating code window
        createCodeWindow(code, language);
    }
}

/**
 * Create a floating window displaying the snippet
 */
function createCodeWindow(code, language) {
    // Remove existing code window if any
    const existingWindow = document.getElementById('code-snippet-window');
    if (existingWindow) {
        existingWindow.remove();
    }

    // Create floating window container
    const windowEl = document.createElement('div');
    windowEl.id = 'code-snippet-window';
    windowEl.style.cssText = `
        position: fixed;
        top: 40px;
        right: 20px;
        width: 450px;
        max-width: 90vw;
        background: white;
        border-radius: 12px;
        box-shadow: 0 15px 40px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Monaco', 'Menlo', monospace;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        max-height: 70vh;
    `;

    windowEl.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                   color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;
                   flex-shrink: 0;">
            <div>
                <strong style="font-size: 14px;">Code Snippet</strong>
                <div style="font-size: 11px; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px;">${escapeHtml(language || 'text')}</div>
            </div>
            <button id="close-code-window" style="background: rgba(255,255,255,0.2); border: none; color: white; 
                    font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px;
                    border-radius: 4px; display: flex; align-items: center; justify-content: center;
                    transition: background 0.2s; hover: {background: rgba(255,255,255,0.3)}">
                ✕
            </button>
        </div>
        <pre style="margin: 0; padding: 16px 20px; max-height: 300px; overflow: auto; background: #f7fafc; 
                   color: #2d3748; line-height: 1.5; font-size: 11px; flex: 1;">
            <code style="word-break: break-all; white-space: pre-wrap;">${escapeHtml(code)}</code>
        </pre>
        <div style="padding: 14px 20px; background: #f1f5f9; display: flex; gap: 10px; justify-content: flex-end;
                   flex-shrink: 0; border-top: 1px solid #e2e8f0;">
            <button id="copy-code" style="padding: 8px 16px; background: #48bb78; color: white; border: none; 
                    border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;
                    transition: all 0.2s;" title="Copy code to clipboard">
                📋 Copy
            </button>
            <button id="insert-code-btn" style="padding: 8px 16px; background: #667eea; color: white; border: none; 
                    border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;
                    transition: all 0.2s;" title="Insert code at cursor">
                📝 Insert
            </button>
        </div>
    `;

    document.body.appendChild(windowEl);

    // Add event listeners
    document.getElementById('close-code-window').addEventListener('click', () => {
        windowEl.remove();
    });

    document.getElementById('copy-code').addEventListener('click', () => {
        navigator.clipboard.writeText(code).then(() => {
            const btn = document.getElementById('copy-code');
            const originalText = btn.textContent;
            btn.textContent = '✓ Copied!';
            btn.style.background = '#38a169';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '#48bb78';
            }, 2000);
        }).catch(err => {
            console.error('Copy failed:', err);
            alert('Failed to copy to clipboard');
        });
    });

    document.getElementById('insert-code-btn').addEventListener('click', () => {
        insertCode(code, language);
        windowEl.remove();
    });

    // Make window draggable
    makeDraggable(windowEl);
}

/**
 * Make element draggable
 */
function makeDraggable(element) {
    const header = element.querySelector('div');
    let isDragging = false;
    let offsetX, offsetY;

    header.style.cursor = 'move';

    header.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);

    function startDrag(e) {
        // Don't drag if clicking buttons
        if (e.target.closest('button')) return;
        isDragging = true;
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
        element.style.opacity = '0.9';
        element.style.transition = 'none';
    }

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        const rect = element.parentElement ? element.parentElement.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
        
        let left = e.clientX - offsetX;
        let top = e.clientY - offsetY;
        
        // Keep element within viewport
        left = Math.max(0, Math.min(left, window.innerWidth - element.offsetWidth));
        top = Math.max(0, Math.min(top, window.innerHeight - element.offsetHeight));
        
        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
        element.style.right = 'auto';
    }

    function stopDrag() {
        isDragging = false;
        element.style.opacity = '1';
        element.style.transition = 'all 0.2s';
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
