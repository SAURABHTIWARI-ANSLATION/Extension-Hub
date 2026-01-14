// Listen for the chrome message from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'QS_START_SELECTION') {
        startSelectionOverlay();
        sendResponse({ status: 'ok' });
    }
    // Return true if we needed async response, but here sync is fine
});

// Also keep the window message listener just in case, but it's less reliable for this
window.addEventListener('message', (event) => {
    if (event.data.type === 'QS_START_SELECTION') {
        startSelectionOverlay();
    }
}, false);

function startSelectionOverlay() {
    if (document.getElementById('qs-overlay')) return; // Already active

    const overlay = document.createElement('div');
    overlay.id = 'qs-overlay';
    // Inline styles to ensure it overrides specific site CSS
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
    `;

    document.body.appendChild(overlay);

    let startX, startY, isDragging = false;
    const selectionBox = document.createElement('div');
    selectionBox.style.cssText = `
        position: absolute;
        border: 2px dashed #fff;
        background-color: rgba(255, 255, 255, 0.2);
        pointer-events: none;
    `;
    overlay.appendChild(selectionBox);

    overlay.addEventListener('mousedown', (e) => {
        // Prevent default text selection
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        isDragging = true;
        selectionBox.style.left = startX + 'px';
        selectionBox.style.top = startY + 'px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
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
    });

    overlay.addEventListener('mouseup', async (e) => {
        isDragging = false;
        const rect = selectionBox.getBoundingClientRect();

        // Remove overlay immediately
        document.body.removeChild(overlay);

        if (rect.width < 5 || rect.height < 5) return; // Ignore tiny clicks

        // Wait a small delay to ensure the browser repaints without the overlay
        setTimeout(() => {
            const coords = {
                x: rect.left * window.devicePixelRatio,
                y: rect.top * window.devicePixelRatio,
                width: rect.width * window.devicePixelRatio,
                height: rect.height * window.devicePixelRatio
            };

            // Send coords to background to capture
            chrome.runtime.sendMessage({
                action: 'selection_completed',
                coords: coords
            });

        }, 250);
    });
}
