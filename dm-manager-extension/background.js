// DM Manager - Background Service Worker
console.log('DM Manager background service worker started');

let autoResponderEnabled = false;

// Load default templates from JSON file
async function loadDefaultTemplates() {
  try {
    const response = await fetch(chrome.runtime.getURL('assets/templates.json'));
    const data = await response.json();
    return data.templates;
  } catch (error) {
    console.error('Error loading default templates:', error);
    // Return fallback templates
    return [
      {
        id: 'welcome',
        name: 'Welcome Message',
        content: 'Hello {{name}}! Thank you for reaching out. How can I help you today?',
        category: 'general',
        tags: ['welcome', 'greeting']
      },
      {
        id: 'pricing',
        name: 'Pricing Inquiry',
        content: 'Hi {{name}}, thanks for your interest! Our pricing starts at {{price}}/month. Would you like me to send you our detailed pricing sheet?',
        category: 'sales',
        tags: ['pricing', 'sales']
      },
      {
        id: 'follow-up',
        name: 'Follow Up',
        content: 'Hi {{name}}, just following up on our previous conversation. Are you still interested in discussing this further?',
        category: 'sales',
        tags: ['follow-up']
      }
    ];
  }
}

// Initialize
chrome.runtime.onInstalled.addListener(async () => {
  console.log('DM Manager installed');
  
  // Load default templates
  const defaultTemplates = await loadDefaultTemplates();
  
  // Set default settings
  chrome.storage.sync.set({
    templates: defaultTemplates,
    autoResponder: false,
    autoResponseDelay: 5,
    signature: 'Best regards,\n{{your_name}}',
    yourName: '',
    workingHours: {
      enabled: false,
      start: '09:00',
      end: '17:00',
      timezone: 'UTC'
    }
  });
  
  // Create context menu
  createContextMenu();
});

// Create context menu
function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    // Add template insertion menu
    chrome.contextMenus.create({
      id: 'insert-template',
      title: 'Insert DM Template',
      contexts: ['editable']
    });
    
    // Add template management menu
    chrome.contextMenus.create({
      id: 'manage-templates',
      title: 'Manage Templates',
      contexts: ['page']
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'manage-templates') {
    chrome.runtime.openOptionsPage();
  } else if (info.menuItemId === 'insert-template') {
    chrome.tabs.sendMessage(tab.id, {
      type: 'SHOW_TEMPLATE_POPUP',
      selection: info.selectionText
    });
  }
});

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received:', message.type);
  
  switch (message.type) {
    case 'GET_TEMPLATES':
      chrome.storage.sync.get(['templates'], (result) => {
        sendResponse({ templates: result.templates || [] });
      });
      return true;
      
    case 'SAVE_TEMPLATE':
      chrome.storage.sync.get(['templates'], (result) => {
        const templates = result.templates || [];
        const newTemplate = message.template;
        
        if (newTemplate.id) {
          // Update existing template
          const index = templates.findIndex(t => t.id === newTemplate.id);
          if (index !== -1) {
            templates[index] = newTemplate;
          }
        } else {
          // Add new template
          newTemplate.id = Date.now().toString();
          templates.push(newTemplate);
        }
        
        chrome.storage.sync.set({ templates }, () => {
          sendResponse({ success: true });
        });
      });
      return true;
      
    case 'DELETE_TEMPLATE':
      chrome.storage.sync.get(['templates'], (result) => {
        const templates = (result.templates || []).filter(t => t.id !== message.id);
        chrome.storage.sync.set({ templates }, () => {
          sendResponse({ success: true });
        });
      });
      return true;
      
    case 'TOGGLE_AUTO_RESPONDER':
      autoResponderEnabled = !autoResponderEnabled;
      chrome.storage.sync.set({ autoResponder: autoResponderEnabled });
      sendResponse({ enabled: autoResponderEnabled });
      return true;
      
    case 'EDIT_TEMPLATE':
      // Store template ID for options page to pick up
      chrome.storage.local.set({ 
        'dm_edit_template_id': message.templateId,
        'dm_edit_mode': true
      }, () => {
        // Open the options page
        chrome.runtime.openOptionsPage();
        sendResponse({ success: true });
      });
      return true;
      
    case 'OPEN_OPTIONS_PAGE':
      // Simply open the options page
      chrome.runtime.openOptionsPage();
      sendResponse({ success: true });
      return true;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
});