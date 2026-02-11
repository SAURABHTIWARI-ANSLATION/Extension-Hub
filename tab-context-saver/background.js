// Background Service Worker for Tab Context Saver

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Tab Context Saver installed successfully!');
  
  // Initialize storage with better structure
  chrome.storage.local.get(['sessions', 'settings'], (result) => {
    const defaultData = {
      sessions: [],
      settings: {
        autoSave: true,
        maxSessions: 50,
        preservePinned: true
      }
    };
    
    if (!result.sessions) {
      chrome.storage.local.set(defaultData);
    }
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const handlers = {
    'saveSession': handleSaveSession,
    'restoreSession': handleRestoreSession,
    'deleteSession': handleDeleteSession,
    'getSettings': handleGetSettings,
    'updateSettings': handleUpdateSettings
  };
  
  if (handlers[request.action]) {
    // Pass the appropriate data based on the action
    if (request.action === 'restoreSession') {
      handlers[request.action](request.sessionId, sendResponse);
    } else if (request.action === 'deleteSession') {
      handlers[request.action](request.sessionId, sendResponse);
    } else {
      handlers[request.action](request.data, sendResponse);
    }
    return true; // Keep message channel open for async response
  }
});

async function handleSaveSession(sessionData, sendResponse) {
  try {
    const { settings } = await chrome.storage.local.get(['settings']);
    const tabs = await chrome.tabs.query({ currentWindow: true });
    
    const session = {
      ...sessionData,
      id: Date.now(),
      timestamp: Date.now(),
      tabCount: tabs.length,
      tabs: tabs.map(tab => ({
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl,
        pinned: tab.pinned
      }))
    };
    
    const result = await chrome.storage.local.get(['sessions']);
    const sessions = result.sessions || [];
    sessions.unshift(session);
    
    // Apply max sessions limit
    const maxSessions = settings?.maxSessions || 50;
    const trimmedSessions = sessions.slice(0, maxSessions);
    
    await chrome.storage.local.set({ sessions: trimmedSessions });
    sendResponse({ success: true, session, totalSessions: trimmedSessions.length });
  } catch (error) {
    console.error('Error saving session:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleRestoreSession(sessionId, sendResponse) {
  try {
    // Ensure sessionId is a number for proper comparison
    const sessionIdNum = typeof sessionId === 'string' ? parseInt(sessionId) : sessionId;
    
    console.log('[Background] Restore session request:', { sessionId, sessionIdNum, type: typeof sessionId });
    
    const { settings } = await chrome.storage.local.get(['settings']);
    const result = await chrome.storage.local.get(['sessions']);
    const sessions = result.sessions || [];
    
    console.log('[Background] Available sessions:', sessions.map(s => ({ id: s.id, name: s.name })));
    
    const session = sessions.find(s => s.id === sessionIdNum);
    
    if (!session) {
      sendResponse({ success: false, error: 'Session not found' });
      return;
    }
    
    // Close current tabs (preserve pinned if setting is enabled)
    const currentTabs = await chrome.tabs.query({ currentWindow: true });
    const tabsToClose = settings?.preservePinned 
      ? currentTabs.filter(tab => !tab.pinned).map(tab => tab.id)
      : currentTabs.map(tab => tab.id);
    
    if (tabsToClose.length > 0) {
      await chrome.tabs.remove(tabsToClose);
    }
    
    // Open session tabs with proper ordering
    const createdTabs = [];
    for (const [index, tab] of session.tabs.entries()) {
      try {
        const newTab = await chrome.tabs.create({ 
          url: tab.url, 
          active: index === 0, // Activate first tab
          pinned: tab.pinned
        });
        createdTabs.push(newTab);
      } catch (error) {
        console.warn(`Failed to open tab: ${tab.url}`, error);
      }
    }
    
    // Group tabs by mode (optional enhancement)
    if (session.mode && createdTabs.length > 0) {
      try {
        const groupId = await chrome.tabs.group({
          tabIds: createdTabs.map(t => t.id)
        });
        await chrome.tabGroups.update(groupId, {
          title: session.mode.charAt(0).toUpperCase() + session.mode.slice(1),
          color: getGroupColor(session.mode)
        });
      } catch (error) {
        // Grouping not essential, just log
        console.log('Tab grouping skipped:', error.message);
      }
    }
    
    sendResponse({ 
      success: true, 
      restoredTabs: createdTabs.length,
      sessionName: session.name 
    });
  } catch (error) {
    console.error('Error restoring session:', error);
    sendResponse({ success: false, error: error.message });
  }
}

function getGroupColor(mode) {
  const colors = {
    work: 'blue',
    study: 'purple',
    entertainment: 'green',
    custom: 'yellow'
  };
  return colors[mode] || 'grey';
}

async function handleDeleteSession(sessionId, sendResponse) {
  try {
    // Ensure sessionId is a number for proper comparison
    const sessionIdNum = typeof sessionId === 'string' ? parseInt(sessionId) : sessionId;
    
    console.log('[Background] Delete session request:', { sessionId, sessionIdNum, type: typeof sessionId });
    
    const result = await chrome.storage.local.get(['sessions']);
    const sessions = result.sessions || [];
    
    console.log('[Background] Current sessions:', sessions.map(s => ({ id: s.id, name: s.name, idType: typeof s.id })));
    console.log('[Background] Looking for ID:', sessionIdNum, 'type:', typeof sessionIdNum);
    
    // Debug: Check each session comparison
    sessions.forEach((s, index) => {
      console.log(`[Background] Session ${index}: id=${s.id} (type: ${typeof s.id}), match=${s.id !== sessionIdNum}`);
    });
    
    // Find the session index and remove it
    const sessionIndex = sessions.findIndex(s => s.id === sessionIdNum);
    
    console.log('[Background] Session index found:', sessionIndex);
    
    let updatedSessions;
    if (sessionIndex !== -1) {
      sessions.splice(sessionIndex, 1);
      console.log('[Background] Session removed, remaining sessions:', sessions.length);
      updatedSessions = sessions;
    } else {
      console.log('[Background] Session not found for deletion');
      updatedSessions = sessions;
    }
    
    console.log('[Background] Sessions after operation:', updatedSessions.length);
    
    await chrome.storage.local.set({ sessions: updatedSessions });
    sendResponse({ success: true, remaining: updatedSessions.length });
  } catch (error) {
    console.error('Error deleting session:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetSettings(_, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['settings']);
    sendResponse({ success: true, settings: result.settings || {} });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUpdateSettings(settings, sendResponse) {
  try {
    await chrome.storage.local.set({ settings });
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Enhanced auto-save with better conditions
chrome.windows.onRemoved.addListener(async (windowId) => {
  const { settings } = await chrome.storage.local.get(['settings']);
  
  if (!settings?.autoSave) return;
  
  const windows = await chrome.windows.getAll();
  
  // Auto-save only if this was the last normal window
  if (windows.length === 0) {
    const tabs = await chrome.tabs.query({ windowId });
    
    if (tabs.length >= 2) { // Only save if more than 1 tab
      const autoSaveSession = {
        id: Date.now(),
        name: `Auto-saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        mode: 'custom',
        timestamp: Date.now(),
        tabCount: tabs.length,
        tabs: tabs.map(tab => ({
          url: tab.url,
          title: tab.title,
          favIconUrl: tab.favIconUrl,
          pinned: tab.pinned
        }))
      };
      
      const result = await chrome.storage.local.get(['sessions', 'settings']);
      const sessions = result.sessions || [];
      sessions.unshift(autoSaveSession);
      
      // Apply limit
      const maxSessions = result.settings?.maxSessions || 50;
      const trimmedSessions = sessions.slice(0, maxSessions);
      
      await chrome.storage.local.set({ sessions: trimmedSessions });
      console.log('Auto-saved session:', autoSaveSession);
    }
  }
});

// Listen for tab updates to track active session (optional feature)
let activeSessionTabs = new Set();

chrome.tabs.onCreated.addListener((tab) => {
  activeSessionTabs.add(tab.id);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  activeSessionTabs.delete(tabId);
});