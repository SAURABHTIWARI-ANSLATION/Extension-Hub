// Background Service Worker for Tab Context Saver

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Tab Context Saver installed successfully!');
  
  // Initialize storage
  chrome.storage.local.get(['sessions'], (result) => {
    if (!result.sessions) {
      chrome.storage.local.set({ sessions: [] });
    }
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveSession') {
    handleSaveSession(request.data, sendResponse);
    return true;
  }
  
  if (request.action === 'restoreSession') {
    handleRestoreSession(request.sessionId, sendResponse);
    return true;
  }
  
  if (request.action === 'deleteSession') {
    handleDeleteSession(request.sessionId, sendResponse);
    return true;
  }
});

async function handleSaveSession(sessionData, sendResponse) {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    
    const session = {
      ...sessionData,
      id: Date.now(),
      timestamp: Date.now(),
      tabs: tabs.map(tab => ({
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl
      }))
    };
    
    const result = await chrome.storage.local.get(['sessions']);
    const sessions = result.sessions || [];
    sessions.unshift(session);
    
    await chrome.storage.local.set({ sessions });
    sendResponse({ success: true, session });
  } catch (error) {
    console.error('Error saving session:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleRestoreSession(sessionId, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['sessions']);
    const sessions = result.sessions || [];
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      sendResponse({ success: false, error: 'Session not found' });
      return;
    }
    
    // Close current tabs (except pinned ones)
    const currentTabs = await chrome.tabs.query({ currentWindow: true, pinned: false });
    const tabIds = currentTabs.map(tab => tab.id);
    await chrome.tabs.remove(tabIds);
    
    // Open session tabs
    for (const tab of session.tabs) {
      await chrome.tabs.create({ url: tab.url, active: false });
    }
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error restoring session:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleDeleteSession(sessionId, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['sessions']);
    const sessions = result.sessions || [];
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    
    await chrome.storage.local.set({ sessions: updatedSessions });
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Auto-save on browser close (optional feature)
chrome.windows.onRemoved.addListener(async (windowId) => {
  const windows = await chrome.windows.getAll();
  
  // If this was the last window, auto-save the session
  if (windows.length === 0) {
    const tabs = await chrome.tabs.query({ windowId });
    
    if (tabs.length > 0) {
      const autoSaveSession = {
        id: Date.now(),
        name: `Auto-save ${new Date().toLocaleString()}`,
        mode: 'custom',
        timestamp: Date.now(),
        tabs: tabs.map(tab => ({
          url: tab.url,
          title: tab.title,
          favIconUrl: tab.favIconUrl
        }))
      };
      
      const result = await chrome.storage.local.get(['sessions']);
      const sessions = result.sessions || [];
      sessions.unshift(autoSaveSession);
      
      // Keep only last 50 sessions to avoid storage bloat
      const trimmedSessions = sessions.slice(0, 50);
      
      await chrome.storage.local.set({ sessions: trimmedSessions });
    }
  }
});
