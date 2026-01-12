// Background service worker for Chrome extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Resume Keyword Checker extension installed');
    
    // Initialize storage with default values
    chrome.storage.local.set({
        savedJD: '',
        savedResume: '',
        analysisHistory: []
    });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "saveAnalysis") {
        // Save analysis results to history
        chrome.storage.local.get(['analysisHistory'], (data) => {
            const history = data.analysisHistory || [];
            history.unshift({
                date: new Date().toISOString(),
                score: request.score,
                foundCount: request.foundCount,
                missingCount: request.missingCount
            });
            
            // Keep only last 10 analyses
            if (history.length > 10) history.pop();
            
            chrome.storage.local.set({ analysisHistory: history });
        });
    }
    return true;
});