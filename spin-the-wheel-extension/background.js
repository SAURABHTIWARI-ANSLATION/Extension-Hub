// Background service worker for the extension

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'spinWheel') {
        // Store the wheel data for the wheel page
        chrome.storage.local.set({
            wheelOptions: message.options,
            spinDuration: message.duration,
            wheelColors: message.colors
        }, () => {
            // Create a new window for the wheel
            chrome.windows.create({
                url: chrome.runtime.getURL('wheel.html'),
                type: 'popup',
                width: 800,
                height: 800,
                focused: true
            });
        });
    }
    
    if (message.action === 'updateHistory') {
        // History was updated, nothing to do here
        sendResponse({status: 'ok'});
    }
    
    return true; // Keep message channel open for async response
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    // Set default options
    const defaultOptions = ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'];
    const defaultColors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2'];
    
    chrome.storage.local.set({
        wheelOptions: defaultOptions,
        spinDuration: 5,
        wheelColors: defaultColors,
        history: []
    });
    
    console.log('Spin The Wheel extension installed!');
});