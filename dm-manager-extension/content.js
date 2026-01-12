// DM Manager - Content Script
console.log('DM Manager content script loaded');

let templatePopup = null;

// Clear old cached names on script load to prevent stale data
chrome.storage.local.remove(['userName'], () => {
    console.log('✅ Cleared old cached name to prevent stale data');
});

// Load template categories
function loadTemplateCategories() {
  // You can load this from the JSON file or hardcode it
  return [
    { id: 'general', name: 'General', icon: '💬' },
    { id: 'sales', name: 'Sales', icon: '💰' },
    { id: 'support', name: 'Support', icon: '🛠️' },
    { id: 'follow-up', name: 'Follow-up', icon: '↪️' },
    { id: 'networking', name: 'Networking', icon: '🤝' },
    { id: 'recruitment', name: 'Recruitment', icon: '👥' }
  ];
}

// Initialize when page loads
function initialize() {
  // Check if we're on a supported platform
  if (isSupportedPlatform()) {
    console.log('DM Manager initializing on:', window.location.hostname);
    
    // Inject main button
    injectDMButton();
    
    // Setup message listener
    setupMessageListener();
    
    // Setup template popup
    setupTemplatePopup();
    
    // Initialize auto-response (for LinkedIn only)
    if (window.location.href.includes('linkedin.com')) {
        chrome.storage.local.get(['autoResponseEnabled'], function(data) {
            if (data.autoResponseEnabled !== false) {
                setTimeout(initializeAutoResponse, 3000);
            }
        });
    }
    
    // Extract and save user name if on LinkedIn profile
    if (window.location.href.includes('linkedin.com/in/') || window.location.href.includes('linkedin.com/feed')) {
        setTimeout(() => {
            extractYourName().then(name => {
                console.log('User name detected:', name);
            });
        }, 2000);
    }
  }
}

// Check if current site is supported
function isSupportedPlatform() {
  const url = window.location.href;
  return url.includes('linkedin.com/messaging') ||
         url.includes('twitter.com/messages') ||
         url.includes('instagram.com/direct') ||
         url.includes('facebook.com/messages');
}

// Inject DM button into the page
function injectDMButton() {
  const buttonHTML = `
    <div class="dm-manager-button" style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background: #4F46E5;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
    ">
      <span>💬 DM Manager</span>
      <span class="dm-badge" style="
        background: #10B981;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
      ">New</span>
    </div>
  `;
  
  const button = document.createElement('div');
  button.innerHTML = buttonHTML;
  document.body.appendChild(button);
  
  // Add click handler
  button.querySelector('.dm-manager-button').addEventListener('click', showTemplatesPanel);
}

// Show templates panel
function showTemplatesPanel() {
  // Get templates from storage
  chrome.runtime.sendMessage({ type: 'GET_TEMPLATES' }, (response) => {
    createTemplatesPanel(response.templates || []);
  });
}

// Create templates panel
function createTemplatesPanel(templates) {
  // Remove existing panel
  const existingPanel = document.querySelector('.dm-templates-panel');
  if (existingPanel) existingPanel.remove();
  
  // Group templates by category
  const groupedTemplates = {};
  templates.forEach(template => {
    if (!groupedTemplates[template.category]) {
      groupedTemplates[template.category] = [];
    }
    groupedTemplates[template.category].push(template);
  });
  
  // Create panel HTML
  const panelHTML = `
    <div class="dm-templates-panel" style="
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 350px;
      max-height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
    ">
      <div style="
        background: #4F46E5;
        color: white;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <h3 style="margin: 0; font-size: 16px;">💬 DM Templates</h3>
        <button class="dm-close-btn" style="
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 20px;
        ">×</button>
      </div>
      
      <div style="padding: 16px;">
        <input type="text" placeholder="Search templates..." style="
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
        ">
        
        <div class="templates-list" style="max-height: 400px; overflow-y: auto;">
          ${Object.entries(groupedTemplates).map(([category, categoryTemplates]) => `
            <div class="category-section">
              <h4 style="margin: 0 0 8px 0; color: #6B7280; font-size: 12px; text-transform: uppercase;">
                ${category}
              </h4>
              ${categoryTemplates.map(template => `
                <div class="template-item" data-id="${template.id}" style="
                  background: #F9FAFB;
                  padding: 12px;
                  border-radius: 8px;
                  margin-bottom: 8px;
                  cursor: pointer;
                  transition: all 0.2s ease;
                ">
                  <div style="display: flex; justify-content: space-between; align-items: start;">
                    <strong style="font-size: 14px;">${template.name}</strong>
                    <button class="quick-insert-btn" style="
                      background: #10B981;
                      color: white;
                      border: none;
                      padding: 4px 12px;
                      border-radius: 4px;
                      font-size: 12px;
                      cursor: pointer;
                    ">Insert</button>
                  </div>
                  <p style="margin: 8px 0 0 0; font-size: 13px; color: #6B7280; line-height: 1.4;">
                    ${template.content.substring(0, 80)}${template.content.length > 80 ? '...' : ''}
                  </p>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
        
        <div style="margin-top: 16px; display: flex; gap: 8px;">
          <button id="createTemplateBtn" style="
            flex: 1;
            background: #4F46E5;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">➕ New Template</button>
          <button id="manageTemplatesBtn" style="
            flex: 1;
            background: #F3F4F6;
            color: #374151;
            border: 1px solid #D1D5DB;
            padding: 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">⚙️ Manage</button>
        </div>
      </div>
    </div>
  `;
  
  const panel = document.createElement('div');
  panel.innerHTML = panelHTML;
  document.body.appendChild(panel);
  
  // Add event listeners
  panel.querySelector('.dm-close-btn').addEventListener('click', () => {
    panel.remove();
  });
  
  // Template item click
  panel.querySelectorAll('.template-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('quick-insert-btn')) {
        const templateId = item.dataset.id;
        chrome.runtime.sendMessage({ 
          type: 'GET_TEMPLATES' 
        }, (response) => {
          const template = response.templates.find(t => t.id === templateId);
          if (template) {
            showTemplatePreview(template);
          }
        });
      }
    });
  });
  
  // Quick insert button
  panel.querySelectorAll('.quick-insert-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const templateId = btn.closest('.template-item').dataset.id;
      chrome.runtime.sendMessage({ 
        type: 'GET_TEMPLATES' 
      }, (response) => {
        const template = response.templates.find(t => t.id === templateId);
        if (template) {
          insertTemplateIntoMessage(template);
        }
      });
    });
  });
  
  // Create template button
  panel.querySelector('#createTemplateBtn').addEventListener('click', () => {
    console.log('📝 Opening options page to create new template');
    chrome.runtime.sendMessage({ 
      type: 'OPEN_OPTIONS_PAGE'
    }, (response) => {
      console.log('✅ Options page requested');
    });
  });
  
  // Manage templates button
  panel.querySelector('#manageTemplatesBtn').addEventListener('click', () => {
    console.log('⚙️ Opening options page to manage templates');
    chrome.runtime.sendMessage({ 
      type: 'OPEN_OPTIONS_PAGE'
    }, (response) => {
      console.log('✅ Options page requested');
    });
  });
  
  // Search functionality
  const searchInput = panel.querySelector('input[type="text"]');
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    panel.querySelectorAll('.template-item').forEach(item => {
      const templateName = item.querySelector('strong').textContent.toLowerCase();
      const templateContent = item.querySelector('p').textContent.toLowerCase();
      const isVisible = templateName.includes(searchTerm) || templateContent.includes(searchTerm);
      item.style.display = isVisible ? 'block' : 'none';
    });
  });
}

// Show template preview
function showTemplatePreview(template) {
  // Create preview modal
  const modalHTML = `
    <div class="dm-preview-modal" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 10002;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        background: white;
        width: 90%;
        max-width: 500px;
        border-radius: 12px;
        padding: 24px;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; font-size: 18px;">📝 ${template.name}</h3>
          <button class="close-preview" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6B7280;
          ">×</button>
        </div>
        
        <div style="margin-bottom: 20px;">
          <div style="
            background: #F9FAFB;
            padding: 16px;
            border-radius: 8px;
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
            margin-bottom: 16px;
          ">${template.content}</div>
          
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
            ${(template.tags || []).map(tag => `
              <span style="
                background: #E0E7FF;
                color: #4F46E5;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
              ">${tag}</span>
            `).join('')}
          </div>
        </div>
        
        <div style="display: flex; gap: 8px;">
          <button class="edit-template" style="
            flex: 1;
            background: #F3F4F6;
            color: #374151;
            border: 1px solid #D1D5DB;
            padding: 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">✏️ Edit</button>
          <button class="use-template" style="
            flex: 1;
            background: #4F46E5;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">📤 Use Template</button>
        </div>
      </div>
    </div>
  `;
  
  const modal = document.createElement('div');
  modal.innerHTML = modalHTML;
  document.body.appendChild(modal);
  
  // Add event listeners
  modal.querySelector('.close-preview').addEventListener('click', () => {
    modal.remove();
  });
  
// NEW CODE (replace with this - SIMPLE VERSION):
modal.querySelector('.edit-template').addEventListener('click', () => {
    console.log('📝 Editing template:', template.id, template.name);
    
    // Send message to background service worker to open options page and store template ID
    chrome.runtime.sendMessage({ 
        type: 'EDIT_TEMPLATE',
        templateId: template.id
    }, (response) => {
        if (response?.success) {
            console.log('✅ Template ID sent to background for editing');
            showNotification('Opening settings page...');
        } else {
            console.error('❌ Error requesting edit mode');
            showNotification('Could not open settings page. Please try again.');
        }
        modal.remove();
    });
});
  
  modal.querySelector('.use-template').addEventListener('click', () => {
    insertTemplateIntoMessage(template);
    modal.remove();
  });
}

// Replace the current insertTemplateIntoMessage function with this:
async function insertTemplateIntoMessage(template) {
    console.log('Inserting template:', template.name);
    
    // Get names
    const receiverName = await extractReceiverName();
    const yourName = await extractYourName();
    
    // Process template with variables
    let message = template.content;
    
    // Replace known variables first
    message = message.replace(/{{name}}/g, receiverName);
    message = message.replace(/{{your_name}}/g, yourName);
    
    // Find all remaining {{variable}} patterns
    const variablePattern = /{{([^}]+)}}/g;
    const customVariables = [];
    let match;
    
    while ((match = variablePattern.exec(template.content)) !== null) {
        const varName = match[1];
        // Only add if it's not already a known variable
        if (varName !== 'name' && varName !== 'your_name' && !customVariables.includes(varName)) {
            customVariables.push(varName);
        }
    }
    
    // If there are custom variables, ask user to fill them in
    if (customVariables.length > 0) {
        const replacements = await showVariableModal(customVariables);
        if (replacements) {
            // Replace custom variables
            Object.keys(replacements).forEach(key => {
                message = message.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
            });
        } else {
            // User cancelled, show warning
            showNotification('⚠️ Template cancelled - variables were not filled');
            return false;
        }
    }
    
    // Auto-add signature if not present
    if (!message.includes('{{your_name}}') && !message.toLowerCase().includes('best') && !message.toLowerCase().includes('regards')) {
        message += `\n\nBest regards,\n${yourName}`;
    }
    
    // Find message input based on platform
    let messageInput = null;
    
    if (window.location.href.includes('linkedin.com')) {
        // LinkedIn specific selectors
        messageInput = document.querySelector('.msg-form__contenteditable, div[contenteditable="true"][role="textbox"], .compose-form__message');
    } else if (window.location.href.includes('twitter.com')) {
        messageInput = document.querySelector('[data-testid="dmComposerTextInput"]');
    } else if (window.location.href.includes('instagram.com')) {
        messageInput = document.querySelector('textarea[placeholder*="Message"]');
    } else if (window.location.href.includes('facebook.com')) {
        messageInput = document.querySelector('[contenteditable="true"][role="textbox"]');
    }
    
    if (messageInput) {
        // Focus first to ensure proper activation
        messageInput.focus();
        
        // Insert into input
        if (messageInput.tagName === 'TEXTAREA') {
            messageInput.value = message;
        } else if (messageInput.isContentEditable) {
            // For contenteditable divs (LinkedIn uses this)
            messageInput.innerHTML = message.replace(/\n/g, '<br>');
            
            // Set text content as well for data consistency
            messageInput.textContent = message;
        }
        
        // Dispatch multiple events to ensure LinkedIn detects the change
        // Input event for basic change detection
        messageInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Change event
        messageInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Focus/blur cycle to trigger validation
        messageInput.blur();
        setTimeout(() => {
            messageInput.focus();
            
            // Additional events for LinkedIn's internal state management
            messageInput.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true }));
            messageInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true }));
            
            // DOMCharacterDataModified for older browsers
            messageInput.dispatchEvent(new Event('DOMCharacterDataModified', { bubbles: true }));
        }, 100);
        
        // Move cursor to top
        messageInput.scrollTop = 0;
        
        // Show success notification
        showNotification(`✅ Template "${template.name}" inserted!`);
        
        // Update usage count
        updateTemplateUsage(template.id);
        
        return true;
    } else {
        showNotification('❌ Could not find message input. Please click on the message box first.');
        return false;
    }
}

// NEW FUNCTION: Extract receiver name from LinkedIn
async function extractReceiverName() {
    // LinkedIn specific selectors - try to get the current conversation name
    const nameSelectors = [
        '.msg-thread__title',
        '.thread__header--recipient-name',
        '.conversation-partner__name',
        'h2.conversation-title',
        '.msg-conversation-card__participant-names',
        '.msg-entity-lockup__title',
        '.msg-s-message-list__header h2',
        '.thread-heading'
    ];
    
    // First, clear any cached name to force fresh extraction
    for (const selector of nameSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            const name = element.textContent.trim().split(',')[0].split('(')[0].trim();
            // Make sure it's not a generic text
            if (name && name !== 'Conversations' && name.length > 1) {
                console.log('✅ Found receiver name:', name);
                return name;
            }
        }
    }
    
    // Fallback: Get from profile page
    if (window.location.href.includes('/in/')) {
        const urlParts = window.location.href.split('/in/');
        if (urlParts[1]) {
            const profileId = urlParts[1].split('/')[0];
            // Convert "john-doe-123" to "John Doe"
            const fallbackName = profileId
                .split('-')
                .slice(0, -1)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            console.log('⚠️ Using fallback name from URL:', fallbackName);
            return fallbackName;
        }
    }
    
    console.log('⚠️ Using default greeting name');
    return 'There';
}

// NEW FUNCTION: Extract your name from LinkedIn
async function extractYourName() {
    // ALWAYS check user's settings from options page (sync storage) FIRST
    return new Promise((resolve) => {
        chrome.storage.sync.get(['yourName'], function(syncData) {
            // If user set a custom name in options page, use it (highest priority)
            if (syncData.yourName && syncData.yourName.trim()) {
                console.log('✅ Using name from Settings (Sync Storage):', syncData.yourName);
                // Update local cache with correct name
                chrome.storage.local.set({ userName: syncData.yourName });
                resolve(syncData.yourName);
                return;
            }
            
            // If not set in options, try to extract from LinkedIn profile
            // Skip local cache if sync storage is empty - this prevents stale cache issues
            const yourNameSelectors = [
                '.profile-dropdown__name',
                '.nav-settings__member-name',
                '.global-nav__me-content .t-16',
                'h1.text-heading-xlarge',
                '.pv-top-card-section__name',
                '[data-test-id="global-nav-me-profilephoto-button"]',
                '.global-nav__me .inline-flex span'
            ];
            
            let foundName = null;
            for (const selector of yourNameSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    foundName = element.textContent.trim().split('\n')[0].split(',')[0].trim();
                    // Make sure it's a real name, not a generic element
                    if (foundName && foundName.length > 1 && !foundName.includes('Sign out')) {
                        break;
                    }
                }
            }
            
            // If found name from profile, use it and save to sync storage
            if (foundName) {
                console.log('✅ Extracted name from LinkedIn profile:', foundName);
                // Save to sync so it persists
                chrome.storage.sync.set({ yourName: foundName });
                // Clear old local cache to prevent confusion
                chrome.storage.local.remove(['userName']);
                resolve(foundName);
                return;
            }
            
            // Last resort: NO local cache fallback - use default instead
            console.log('⚠️ Using default name - please set your name in Settings');
            resolve('Your Name');
        });
    });
}

// NEW FUNCTION: Update template usage count
function updateTemplateUsage(templateId) {
    chrome.runtime.sendMessage({ 
        type: 'GET_TEMPLATES' 
    }, (response) => {
        const updatedTemplates = response.templates.map(template => {
            if (template.id === templateId) {
                return {
                    ...template,
                    usageCount: (template.usageCount || 0) + 1,
                    lastUsed: new Date().toISOString()
                };
            }
            return template;
        });
        
        // Save updated templates
        chrome.storage.local.set({ templates: updatedTemplates });
    });
}

// Process template variables
function processTemplateVariables(template) {
  // Get user info from storage
  return new Promise((resolve) => {
    chrome.storage.sync.get(['signature'], (result) => {
      let processed = template;
      
      // Replace variables
      processed = processed.replace(/{{name}}/g, '[Recipient Name]');
      processed = processed.replace(/{{your_name}}/g, '[Your Name]');
      processed = processed.replace(/{{price}}/g, '[Price]');
      processed = processed.replace(/{{signature}}/g, result.signature || '');
      
      resolve(processed);
    });
  });
}

// Setup message listener
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'SHOW_TEMPLATE_POPUP':
        showTemplatePopup(message.selection);
        sendResponse({ success: true });
        break;
        
      case 'SHOW_TEMPLATES_PANEL':
        showTemplatesPanel();
        sendResponse({ success: true });
        break;
        
      case 'INSERT_TEMPLATE':
        chrome.runtime.sendMessage({ 
          type: 'GET_TEMPLATES' 
        }, (response) => {
          const template = response.templates.find(t => t.id === message.templateId);
          if (template) {
            insertTemplateIntoMessage(template);
          }
        });
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ success: false });
    }
    return true;
  });
}

// Show template popup
function showTemplatePopup(selectedText) {
  // Implementation for context menu popup
  console.log('Show template popup with selection:', selectedText);
}

// Setup template popup
function setupTemplatePopup() {
  // Implementation for floating template suggestions
}

// Show notification
// Keep track of active notifications to prevent stacking
const activeNotifications = new Set();

function showNotification(message) {
  // Check if notification with same message already exists
  const existingNotif = Array.from(activeNotifications).find(notif => notif.textContent.includes(message));
  if (existingNotif) {
    // Don't create duplicate notification
    return;
  }

  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10B981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10003;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      animation: slideIn 0.3s ease;
    ">${message}</div>
  `;
  
  const notifDiv = notification.firstChild;
  activeNotifications.add(notifDiv);
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
    activeNotifications.delete(notifDiv);
  }, 3000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Re-initialize on SPA navigation
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(initialize, 1000);
  }
}).observe(document, { subtree: true, childList: true });

// ==================== AUTO-RESPONSE SYSTEM ====================

// Auto-response configuration
const autoResponseSettings = {
    enabled: true,
    delay: 2000, // 2 seconds delay
    responses: [
        {
            triggers: ['thank you', 'thanks', 'thankyou', 'appreciate'],
            response: "You're welcome! Happy to help."
        },
        {
            triggers: ['interested', 'yes please', 'sure', 'definitely'],
            response: "Great! I'd be happy to discuss this further. When would be a good time for you?"
        },
        {
            triggers: ['not interested', 'no thanks', 'not now', 'maybe later'],
            response: "No problem at all! Thanks for letting me know. Have a great day!"
        },
        {
            triggers: ['hello', 'hi', 'hey', 'greetings'],
            response: "Hi! How can I help you today?"
        },
        {
            triggers: ['resume', 'cv', 'portfolio', 'experience'],
            response: "I can share my resume/portfolio. What specific information would you like to see?"
        }
    ]
};

// Initialize auto-response monitoring
function initializeAutoResponse() {
    if (!autoResponseSettings.enabled) return;
    
    // Track if we're currently checking to prevent race conditions
    let isChecking = false;
    let checkTimeout = null;
    
    // Monitor message threads for new messages
    const observer = new MutationObserver((mutations) => {
        // Cancel previous timeout to debounce
        if (checkTimeout) clearTimeout(checkTimeout);
        
        // Only check if we're not already checking
        if (!isChecking) {
            checkTimeout = setTimeout(() => {
                isChecking = true;
                checkForAutoResponse().then(() => {
                    isChecking = false;
                });
            }, 1000);
        }
    });
    
    // Find message container
    const messageContainer = document.querySelector('.msg-s-message-list, .thread__message-list, .conversations-list');
    if (messageContainer) {
        observer.observe(messageContainer, { childList: true, subtree: true });
        console.log('Auto-response monitoring initialized');
    }
    
    // Also check initially
    setTimeout(checkForAutoResponse, 3000);
}

// Check for auto-response triggers
async function checkForAutoResponse() {
    // Get all incoming messages (not sent by me)
    const incomingMessages = document.querySelectorAll('.msg-s-event-listitem__message-bubble:not(.msg-s-message-group__bubble--is-mine), .incoming-message, .received-message');
    
    if (incomingMessages.length === 0) return;
    
    // Get the latest incoming message
    const latestMessage = incomingMessages[incomingMessages.length - 1];
    const messageText = latestMessage.textContent.toLowerCase().trim();
    
    // Check if this message was already responded to
    const messageId = latestMessage.dataset.messageId || latestMessage.textContent;
    if (window.lastRespondedMessage === messageId) return;
    
    // Check each response trigger
    for (const response of autoResponseSettings.responses) {
        if (response.triggers.some(trigger => messageText.includes(trigger))) {
            // Get user's name for personalized response
            const yourName = await extractYourName();
            const personalizedResponse = `${response.response}\n\nBest,\n${yourName}`;
            
            // Send auto-response after delay
            setTimeout(() => {
                sendAutoResponse(personalizedResponse);
            }, autoResponseSettings.delay);
            
            // Mark as responded
            window.lastRespondedMessage = messageId;
            console.log('Auto-response triggered for:', messageText);
            break;
        }
    }
}

// Send auto-response
async function sendAutoResponse(responseText) {
    const messageInput = document.querySelector('.msg-form__contenteditable, div[contenteditable="true"][role="textbox"]');
    
    if (messageInput && messageInput.isContentEditable) {
        // Save current text
        const currentText = messageInput.textContent;
        
        // Insert response
        messageInput.innerHTML = responseText.replace(/\n/g, '<br>');
        messageInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Auto-send (optional - can be enabled/disabled)
        const autoSend = false; // Set to true to auto-send
        
        if (autoSend) {
            const sendButton = document.querySelector('.msg-form__send-button, button[aria-label*="send"], button[data-testid*="send"]');
            if (sendButton) {
                setTimeout(() => {
                    sendButton.click();
                    console.log('Auto-response sent');
                }, 500);
            }
        }
        
        // Show notification
        showNotification('🤖 Auto-response ready to send');
        
        return true;
    }
    
    return false;
}

// Toggle auto-response
function toggleAutoResponse(enabled) {
    autoResponseSettings.enabled = enabled;
    chrome.storage.local.set({ autoResponseEnabled: enabled });
    
    if (enabled) {
        initializeAutoResponse();
        showNotification('✅ Auto-response enabled');
    } else {
        showNotification('⏸️ Auto-response disabled');
    }
}

// ========== CUSTOM VARIABLE MODAL ==========

// Show modal to fill in custom template variables
function showVariableModal(variables) {
    return new Promise((resolve) => {
        const modalHTML = `
            <div id="variableModal" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.6);
                z-index: 10005;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    width: 90%;
                    max-width: 450px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                ">
                    <h3 style="
                        margin: 0 0 20px 0;
                        font-size: 18px;
                        color: #1f2937;
                    ">📝 Fill in Template Variables</h3>
                    
                    <div id="variableInputs" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button id="cancelVarBtn" style="
                            padding: 10px 20px;
                            background: #f3f4f6;
                            border: 1px solid #d1d5db;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 500;
                        ">Cancel</button>
                        <button id="submitVarBtn" style="
                            padding: 10px 20px;
                            background: #4f46e5;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 500;
                        ">Insert Template</button>
                    </div>
                </div>
            </div>
        `;
        
        const modal = document.createElement('div');
        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);
        
        const inputsContainer = document.getElementById('variableInputs');
        const inputs = {};
        
        // Create input fields for each variable
        variables.forEach(varName => {
            const label = document.createElement('div');
            label.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';
            label.innerHTML = `
                <label style="
                    font-weight: 600;
                    color: #374151;
                    font-size: 14px;
                ">{{${varName}}}</label>
                <input type="text" id="input_${varName}" placeholder="Enter ${varName}" style="
                    padding: 10px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                ">
            `;
            inputsContainer.appendChild(label);
            inputs[varName] = document.getElementById(`input_${varName}`);
        });
        
        // Focus first input
        setTimeout(() => {
            const firstInput = Object.values(inputs)[0];
            if (firstInput) firstInput.focus();
        }, 100);
        
        // Cancel button
        document.getElementById('cancelVarBtn').addEventListener('click', () => {
            modal.remove();
            resolve(null);
        });
        
        // Submit button
        document.getElementById('submitVarBtn').addEventListener('click', () => {
            const replacements = {};
            
            // Get all input values
            Object.keys(inputs).forEach(varName => {
                const value = inputs[varName].value.trim();
                replacements[varName] = value || `{{${varName}}}`;
            });
            
            modal.remove();
            resolve(replacements);
        });
        
        // Allow Enter key to submit
        Object.values(inputs).forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('submitVarBtn').click();
                }
            });
        });
        
        // Close on outside click
        document.getElementById('variableModal').addEventListener('click', (e) => {
            if (e.target.id === 'variableModal') {
                modal.remove();
                resolve(null);
            }
        });
    });
}


// Load auto-response settings
chrome.storage.local.get(['autoResponseEnabled'], function(data) {
    if (data.autoResponseEnabled !== false) { // Default to true
        initializeAutoResponse();
    }
});