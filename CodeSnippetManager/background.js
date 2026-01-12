chrome.runtime.onInstalled.addListener(() => {
    console.log('Code Snippet Manager installed');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSnippets') {
        chrome.storage.sync.get('snippets', (data) => {
            sendResponse({ snippets: data.snippets || [] });
        });
        return true; // Required for async response
    }
});