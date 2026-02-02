
// Add this at the VERY TOP
console.log('🚀 QUICKSHOT CONTENT SCRIPT LOADED on page:', window.location.href);

// Listen for the chrome message from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Content script received message:', request.action);
    
    if (request.action === 'QS_START_SELECTION') {
        console.log('✅ Starting selection overlay...');
        startSelectionOverlay();
        sendResponse({ status: 'ok', message: 'Selection started' });
        return true;
    }
    
    // Add this to handle any other messages
    console.log('⚠️ Unknown action received:', request.action);
    sendResponse({ status: 'error', message: 'Unknown action' });
    return true;
});

function startSelectionOverlay() {
    console.log('🎯 Executing startSelectionOverlay()');
    if (document.getElementById('qs-overlay')) {
        console.log('⚠️ Overlay already exists, removing old one');
        document.getElementById('qs-overlay').remove();
    }

    console.log('🎯 Starting selection overlay...');

    const overlay = document.createElement('div');
    overlay.id = 'qs-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 2147483647;
        cursor: crosshair;
        background-color: rgba(0,0,0,0.3);
        box-sizing: border-box;
        user-select: none;
    `;

    document.body.appendChild(overlay);

    let startX, startY, isDragging = false;
    const selectionBox = document.createElement('div');
    selectionBox.style.cssText = `
        position: absolute;
        border: 2px dashed #fff;
        background-color: rgba(100, 181, 246, 0.2);
        pointer-events: none;
        box-shadow: 0 0 0 1px rgba(255,255,255,0.5);
    `;
    overlay.appendChild(selectionBox);

    // Add instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        pointer-events: none;
    `;
    instructions.textContent = 'Drag to select area • Press ESC to cancel';
    overlay.appendChild(instructions);

    // Add cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '✕ Cancel';
    cancelBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(0,0,0,0.8);
        color: white;
        border: 1px solid rgba(255,255,255,0.3);
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-family: Arial, sans-serif;
        font-size: 13px;
        z-index: 2147483648;
    `;
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    overlay.appendChild(cancelBtn);

    overlay.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        startX = e.clientX;
        startY = e.clientY;
        isDragging = true;
        
        selectionBox.style.left = startX + 'px';
        selectionBox.style.top = startY + 'px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        
        instructions.textContent = 'Release mouse to capture';
    });

    overlay.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const currentX = e.clientX;
        const currentY = e.clientY;
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const left = Math.min(currentX, startX);
        const top = Math.min(currentY, startY);

        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';
        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
        
        // Update instructions with size
        instructions.textContent = `${width} × ${height} pixels • Release to capture`;
    });

    overlay.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        
        isDragging = false;
        const rect = selectionBox.getBoundingClientRect();
        
        // Remove overlay
        document.body.removeChild(overlay);

        if (rect.width < 10 || rect.height < 10) {
            console.log('⚠️ Selection too small, ignoring');
            return;
        }

        console.log('📏 Selected area:', rect);

        // Send viewport-relative coordinates for cropping the viewport screenshot
        const coords = {
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            devicePixelRatio: window.devicePixelRatio,
            scrollX: window.scrollX,
            scrollY: window.scrollY
        };

        console.log('📤 Sending coordinates to background:', coords);

        // Send coords to background
        chrome.runtime.sendMessage({
            action: 'selection_completed',
            coords: coords
        });
    });

    // ESC key to cancel
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(overlay);
            document.removeEventListener('keydown', handleKeyDown);
        }
    };
    document.addEventListener('keydown', handleKeyDown);

    // Clean up event listener on removal
    overlay.addEventListener('remove', () => {
        document.removeEventListener('keydown', handleKeyDown);
    });
}

// For debugging
console.log('✅ QuickShot content script loaded');