// ===============================
// QuickShot – Content Script (MV3, Reviewer-Safe)
// ===============================

console.log('🚀 QUICKSHOT CONTENT SCRIPT LOADED on page:', window.location.href);

// Listen for message from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Content script received message:', request.action);

  if (request.action === 'QS_START_SELECTION') {
    startSelectionOverlay();
    sendResponse({ status: 'ok', message: 'Selection started' });
    return true;
  }

  console.warn('⚠️ Unknown action received:', request.action);
  sendResponse({ status: 'error', message: 'Unknown action' });
  return true;
});

function startSelectionOverlay() {
  console.log('🎯 Executing startSelectionOverlay()');

  // Remove existing overlay if present
  document.getElementById('qs-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'qs-overlay';

  const selectionBox = document.createElement('div');
  selectionBox.id = 'qs-selection-box';

  const instructions = document.createElement('div');
  instructions.id = 'qs-instructions';
  instructions.textContent = 'Drag to select area • Press ESC to cancel';

  const cancelBtn = document.createElement('button');
  cancelBtn.id = 'qs-cancel-btn';
  cancelBtn.textContent = '✕ Cancel';

  overlay.appendChild(selectionBox);
  overlay.appendChild(instructions);
  overlay.appendChild(cancelBtn);
  document.body.appendChild(overlay);

  let startX, startY, isDragging = false;

  const removeOverlay = () => {
    document.removeEventListener('keydown', handleKeyDown);
    overlay.remove();
  };

  cancelBtn.addEventListener('click', removeOverlay);

  overlay.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    startX = e.clientX;
    startY = e.clientY;
    isDragging = true;

    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
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

    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;
    selectionBox.style.left = `${left}px`;
    selectionBox.style.top = `${top}px`;

    instructions.textContent = `${width} × ${height} pixels • Release to capture`;
  });

  overlay.addEventListener('mouseup', (e) => {
    if (!isDragging) return;

    isDragging = false;
    const rect = selectionBox.getBoundingClientRect();

    removeOverlay();

    if (rect.width < 10 || rect.height < 10) {
      console.warn('⚠️ Selection too small, ignoring');
      return;
    }

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

    chrome.runtime.sendMessage({
      action: 'selection_completed',
      coords
    });
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      removeOverlay();
    }
  };

  document.addEventListener('keydown', handleKeyDown);
}

console.log('✅ QuickShot content script initialized');
