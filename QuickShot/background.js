// Background Service Worker

chrome.commands.onCommand.addListener((command) => {
    if (command === 'capture_visible') {
        captureVisible();

    } else if (command === 'capture_selection') {
        captureSelection();
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'capture_visible') {
        captureVisible();

    } else if (request.action === 'capture_selection') {
        captureSelection();
    } else if (request.action === 'selection_completed') {
        captureAndCrop(request.coords);
    }
});

async function captureVisible() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    openEditor(dataUrl);
}

// ------ Full Page Capture Logic ------


// -------------------------------------

async function captureAndCrop(coords) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
        openEditor(dataUrl, null, null, coords);
    } catch (error) {
        console.error('Capture failed:', error);
    }
}


async function captureSelection() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'QS_START_SELECTION' });
        if (response && response.status === 'ok') return;
    } catch (err) {
        console.log('Injecting content script...');
        await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['content.css'] });
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });

        setTimeout(async () => {
            try { await chrome.tabs.sendMessage(tab.id, { action: 'QS_START_SELECTION' }); }
            catch (e) { console.error('Failed to start selection:', e); }
        }, 100);
    }
}

function openEditor(singleImage, fullPageCaptures = null, fullPageDims = null, cropCoords = null) {
    const data = {};

    if (singleImage) {
        data.qs_current_image = singleImage;
        data.qs_capture_mode = 'single';
        data.qs_crop_coords = cropCoords; // Can be null

    }

    chrome.storage.local.set(data, () => {
        chrome.tabs.create({ url: 'editor.html' });
    });
}
