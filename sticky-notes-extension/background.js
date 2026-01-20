// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
    console.log('Sticky Notes extension installed');
    
    // Initialize storage
    chrome.storage.local.get(['stickyNotes', 'settings'], (result) => {
        if (!result.stickyNotes) {
            chrome.storage.local.set({ stickyNotes: {} });
        }
        if (!result.settings) {
            chrome.storage.local.set({ 
                settings: {
                    autoSave: true,
                    startOnBoot: false,
                    defaultColor: 'yellow'
                } 
            });
        }
    });
    
    // Create context menu - FIXED VERSION
    createContextMenus();
});

// Create context menus
function createContextMenus() {
    // Remove existing menus first
    chrome.contextMenus.removeAll(() => {
        // Create main context menu
        chrome.contextMenus.create({
            id: "stickyNotesParent",
            title: "Sticky Notes",
            contexts: ["all"]
        });
        
        // Add note at cursor position
        chrome.contextMenus.create({
            id: "addNoteHere",
            parentId: "stickyNotesParent",
            title: "Add Note Here",
            contexts: ["page"]
        });
        
        // Add note with selected text
        chrome.contextMenus.create({
            id: "addNoteWithText",
            parentId: "stickyNotesParent",
            title: "Add Note with Selection",
            contexts: ["selection"]
        });
        
        console.log('Context menus created');
    });
}

// Context menu handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log('Context menu clicked:', info.menuItemId);
    
    if (info.menuItemId === "addNoteHere" || info.menuItemId === "addNoteWithText") {
        handleAddNote(info, tab);
    }
});

function handleAddNote(info, tab) {
    if (!tab || !tab.id) {
        console.error('No tab found');
        return;
    }
    
    const noteId = `note_${Date.now()}`;
    const selectedText = info.selectionText || '';
    
    // Create note data
    const noteData = {
        id: noteId,
        title: selectedText ? 'Note from selection' : 'New Note',
        content: selectedText || '',
        color: 'yellow',
        left: info.x || 100,
        top: info.y || 100,
        width: 320,
        height: 380,
        pinned: false,
        minimized: false,
        hidden: false,
        locked: false,
        fontSize: '16',
        createdAt: new Date().toISOString(),
        pageUrl: tab.url,
        pageTitle: tab.title
    };
    
    // Send to content script
    chrome.tabs.sendMessage(tab.id, {
        action: 'createNote',
        noteData: noteData
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.log('Content script not ready, note will be created when page loads');
            
            // Store note to create later
            saveNoteToStorage(tab.url, noteId, noteData);
        } else if (response && response.success) {
            saveNoteToStorage(tab.url, noteId, noteData);
        }
    });
}

// Save note to storage
function saveNoteToStorage(pageUrl, noteId, noteData) {
    chrome.storage.local.get(['stickyNotes'], (result) => {
        const allNotes = result.stickyNotes || {};
        const urlKey = getUrlKey(pageUrl);
        
        if (!allNotes[urlKey]) {
            allNotes[urlKey] = {};
        }
        
        allNotes[urlKey][noteId] = noteData;
        
        chrome.storage.local.set({ stickyNotes: allNotes });
    });
}

// Get URL key for storage
function getUrlKey(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname + urlObj.pathname;
    } catch {
        return url;
    }
}

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'getNotesForPage':
            chrome.storage.local.get(['stickyNotes'], (result) => {
                const allNotes = result.stickyNotes || {};
                const urlKey = getUrlKey(message.pageUrl);
                sendResponse({ 
                    notes: allNotes[urlKey] || {},
                    urlKey: urlKey 
                });
            });
            return true;
            
        case 'saveNote':
            saveNoteToStorage(message.pageUrl, message.noteId, message.noteData);
            sendResponse({ success: true });
            break;
            
        case 'deleteNote':
            chrome.storage.local.get(['stickyNotes'], (result) => {
                const allNotes = result.stickyNotes || {};
                const urlKey = getUrlKey(message.pageUrl);
                
                if (allNotes[urlKey] && allNotes[urlKey][message.noteId]) {
                    delete allNotes[urlKey][message.noteId];
                    
                    // Clean up empty URL entries
                    if (Object.keys(allNotes[urlKey]).length === 0) {
                        delete allNotes[urlKey];
                    }
                    
                    chrome.storage.local.set({ stickyNotes: allNotes });
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: false, error: 'Note not found' });
                }
            });
            return true;
            
        case 'deleteAllNotes':
            chrome.storage.local.get(['stickyNotes'], (result) => {
                const allNotes = result.stickyNotes || {};
                const urlKey = getUrlKey(message.pageUrl);
                
                const count = allNotes[urlKey] ? Object.keys(allNotes[urlKey]).length : 0;
                delete allNotes[urlKey];
                
                chrome.storage.local.set({ stickyNotes: allNotes });
                sendResponse({ success: true, count: count });
            });
            return true;
            
        case 'exportNotes':
            chrome.storage.local.get(['stickyNotes'], (result) => {
                const dataStr = JSON.stringify(result.stickyNotes || {}, null, 2);
                sendResponse({ data: dataStr });
            });
            return true;
            
        case 'importNotes':
            try {
                const importedNotes = JSON.parse(message.data);
                if (typeof importedNotes === 'object') {
                    chrome.storage.local.set({ stickyNotes: importedNotes }, () => {
                        sendResponse({ 
                            success: true, 
                            count: Object.keys(importedNotes).reduce((sum, key) => 
                                sum + Object.keys(importedNotes[key] || {}).length, 0
                            )
                        });
                    });
                } else {
                    sendResponse({ success: false, error: 'Invalid data format' });
                }
            } catch (error) {
                sendResponse({ success: false, error: error.message });
            }
            return true;
            
        case 'getSettings':
            chrome.storage.local.get(['settings'], (result) => {
                sendResponse({ settings: result.settings || {} });
            });
            return true;
            
        case 'updateSettings':
            chrome.storage.local.get(['settings'], (result) => {
                const currentSettings = result.settings || {};
                const updatedSettings = { ...currentSettings, ...message.settings };
                chrome.storage.local.set({ settings: updatedSettings });
                sendResponse({ success: true, settings: updatedSettings });
            });
            return true;
    }
});

// Auto-load notes on page load
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
        chrome.storage.local.get(['stickyNotes', 'settings'], (result) => {
            const settings = result.settings || {};
            
            if (settings.startOnBoot) {
                const urlKey = getUrlKey(tab.url);
                const pageNotes = (result.stickyNotes || {})[urlKey] || {};
                
                if (Object.keys(pageNotes).length > 0) {
                    // Content script will auto-load notes when it initializes
                    // No need to manually inject or send messages
                    console.log(`Notes available for ${urlKey}, content script will load them`);
                }
            }
        });
    }
});

// Handle startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Sticky Notes starting up');
    // Notes will be loaded via content scripts when pages load
});

// Install/update handler
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // First install
        console.log('First install - welcome!');
    } else if (details.reason === 'update') {
        console.log(`Updated from ${details.previousVersion}`);
    }
});