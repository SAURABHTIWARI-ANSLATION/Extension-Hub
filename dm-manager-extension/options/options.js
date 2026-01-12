// ========== AUTO-LOAD TEMPLATE FOR EDITING ==========
(function initializeEditMode() {
    // Method 1: Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const templateIdFromUrl = urlParams.get('edit');
    
    // Method 2: Check storage
    chrome.storage.local.get(['dm_edit_template_id', 'dm_edit_mode'], (data) => {
        const templateIdToEdit = templateIdFromUrl || data.dm_edit_template_id;
        
        if (templateIdToEdit) {
            console.log('🔄 Edit mode detected for template:', templateIdToEdit);
            
            // Clear storage after reading
            chrome.storage.local.remove(['dm_edit_template_id', 'dm_edit_mode']);
            
            // Wait for page to load
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => editTemplateAfterLoad(templateIdToEdit), 500);
                });
            } else {
                setTimeout(() => editTemplateAfterLoad(templateIdToEdit), 500);
            }
        }
    });
})();

function editTemplateAfterLoad(templateId) {
    console.log('Loading template for editing:', templateId);
    
    // Switch to templates section
    switchToSection('templates');
    
    // Load template and open editor
    chrome.storage.sync.get(['templates'], (result) => {
        const templates = result.templates || [];
        const template = templates.find(t => t.id === templateId);
        
        if (template) {
            console.log('✅ Template found:', template.name);
            
            // Small delay to ensure UI is ready
            setTimeout(() => {
                showTemplateModal(template);
                
                // Optional: Highlight the template card
                highlightTemplateInGrid(templateId);
            }, 800);
        } else {
            console.error('❌ Template not found:', templateId);
            showNotification('Template not found. Creating new template instead.');
        }
    });
}

function switchToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${sectionId}`) {
            item.classList.add('active');
        }
    });
}

function highlightTemplateInGrid(templateId) {
    setTimeout(() => {
        const editButtons = document.querySelectorAll('.edit');
        editButtons.forEach(btn => {
            if (btn.dataset.id === templateId) {
                const card = btn.closest('.template-card');
                if (card) {
                    card.style.border = '2px solid #4F46E5';
                    card.style.boxShadow = '0 0 15px rgba(79, 70, 229, 0.3)';
                    
                    // Scroll to card
                    card.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }
            }
        });
    }, 1000);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10B981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-family: sans-serif;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

// DM Manager - Options Page
document.addEventListener('DOMContentLoaded', () => {
  initializeOptionsPage();
  loadTemplates();
  loadSettings();
  setupEventListeners();
  setupNavigation();
});

let currentTemplateId = null;

// Load variables from templates.json
async function loadVariables() {
  try {
    const response = await fetch(chrome.runtime.getURL('assets/templates.json'));
    const data = await response.json();
    return data.variables || [];
  } catch (error) {
    console.error('Error loading variables:', error);
    return [
      { name: '{{name}}', description: 'Recipient\'s name' },
      { name: '{{your_name}}', description: 'Your name' },
      { name: '{{company}}', description: 'Recipient\'s company' }
    ];
  }
}

function initializeOptionsPage() {
  console.log('DM Manager Options initialized');
  setupVariableButtons();
}

// Setup variable buttons once
async function setupVariableButtons() {
  const variables = await loadVariables();
  const toolbar = document.querySelector('.variables-toolbar');
  
  if (!toolbar) return;
  
  // Clear existing buttons (except the label)
  const label = toolbar.querySelector('span');
  toolbar.innerHTML = '';
  if (label) toolbar.appendChild(label);
  
  // Add variable buttons
  variables.forEach(variable => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'var-btn';
    btn.dataset.var = variable.name;
    btn.title = variable.description;
    btn.textContent = variable.name.replace(/[{}]/g, '');
    toolbar.appendChild(btn);
    
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const variableText = e.currentTarget.dataset.var;
      const textarea = document.getElementById('templateContent');
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      
      textarea.value = text.substring(0, start) + variableText + text.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + variableText.length;
      textarea.focus();
      
      updatePreview(textarea.value);
    });
  });
}

// MODIFY loadTemplates function in options.js:
function loadTemplates() {
  chrome.storage.sync.get(['templates'], (result) => {
    const templates = result.templates || [];
    displayTemplates(templates);
    
    // Check if we need to auto-edit a template (from URL parameter)
    const urlParams = new URLSearchParams(window.location.search);
    const templateIdToEdit = urlParams.get('edit');
    
    if (templateIdToEdit) {
      // Wait for templates to be displayed, then edit
      setTimeout(() => {
        const template = templates.find(t => t.id === templateIdToEdit);
        if (template) {
          showTemplateModal(template);
        }
      }, 500);
    }
  });
}

// Display templates in grid
function displayTemplates(templates) {
  const grid = document.getElementById('templatesGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  if (templates.length === 0) {
    grid.innerHTML = `
      <div style="
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px;
        background: #f9fafb;
        border-radius: 12px;
        border: 2px dashed #d1d5db;
      ">
        <i class="fas fa-layer-group" style="font-size: 48px; color: #d1d5db; margin-bottom: 16px;"></i>
        <h3 style="color: #6b7280; margin-bottom: 8px;">No templates yet</h3>
        <p style="color: #9ca3af; margin-bottom: 20px;">Create your first template to get started</p>
        <button id="createFirstTemplate" class="btn-primary" style="
          padding: 10px 20px;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        ">
          <i class="fas fa-plus"></i> Create Template
        </button>
      </div>
    `;
    
    document.getElementById('createFirstTemplate').addEventListener('click', () => {
      showTemplateModal();
    });
    return;
  }
  
  templates.forEach(template => {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.innerHTML = `
      <div class="template-header">
        <div class="template-title">${template.name}</div>
        <span class="template-category">${template.category}</span>
      </div>
      <div class="template-content">${template.content.substring(0, 150)}${template.content.length > 150 ? '...' : ''}</div>
      <div class="template-footer">
        <div class="template-tags">
          ${(template.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="template-actions">
          <button class="template-btn edit" data-id="${template.id}">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="template-btn delete" data-id="${template.id}">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
    
    grid.appendChild(card);
  });
  
  // Add event listeners to buttons
  document.querySelectorAll('.template-btn.edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const templateId = e.currentTarget.dataset.id;
      editTemplate(templateId);
    });
  });
  
  document.querySelectorAll('.template-btn.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const templateId = e.currentTarget.dataset.id;
      deleteTemplate(templateId);
    });
  });
}

// Show template modal
function showTemplateModal(template = null) {
  const modal = document.getElementById('templateModal');
  const form = document.getElementById('templateForm');
  const title = document.getElementById('modalTitle');
  
  if (!modal || !form || !title) return;
  
  if (template) {
    // Edit mode
    currentTemplateId = template.id;
    title.textContent = 'Edit Template';
    document.getElementById('templateName').value = template.name || '';
    document.getElementById('templateCategory').value = template.category || 'general';
    document.getElementById('templateContent').value = template.content || '';
    document.getElementById('templateTags').value = (template.tags || []).join(', ');
    updatePreview(template.content);
  } else {
    // New template mode
    currentTemplateId = null;
    title.textContent = 'New Template';
    form.reset();
    document.getElementById('templateCategory').value = 'general';
    document.getElementById('templatePreview').textContent = 'Preview will appear here';
  }
  
  modal.classList.add('active');
  
  // Close modal when clicking X or outside
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.remove('active');
      form.reset();
      currentTemplateId = null;
    });
  });
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      form.reset();
      currentTemplateId = null;
    }
  });
}

// Edit template
function editTemplate(templateId) {
  chrome.storage.sync.get(['templates'], (result) => {
    const template = (result.templates || []).find(t => t.id === templateId);
    if (template) {
      showTemplateModal(template);
    }
  });
}

// Delete template
function deleteTemplate(templateId) {
  if (confirm('Are you sure you want to delete this template?')) {
    chrome.runtime.sendMessage({
      type: 'DELETE_TEMPLATE',
      id: templateId
    }, () => {
      loadTemplates(); // Reload templates
    });
  }
}

// Save template
document.getElementById('templateForm').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const templateName = document.getElementById('templateName').value;
  const templateContent = document.getElementById('templateContent').value;
  
  if (!templateName || !templateContent) {
    alert('Template name and content are required!');
    return;
  }
  
  const template = {
    id: currentTemplateId,
    name: templateName,
    category: document.getElementById('templateCategory').value,
    content: templateContent,
    tags: document.getElementById('templateTags').value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag)
  };
  
  chrome.runtime.sendMessage({
    type: 'SAVE_TEMPLATE',
    template: template
  }, () => {
    document.getElementById('templateModal').classList.remove('active');
    e.target.reset();
    loadTemplates(); // Reload templates
  });
});

// Update preview
document.getElementById('templateContent').addEventListener('input', (e) => {
  updatePreview(e.target.value);
});

function updatePreview(content) {
  const preview = document.getElementById('templatePreview');
  if (preview) {
    preview.textContent = content || 'Preview will appear here';
  }
}

// Load settings
function loadSettings() {
  chrome.storage.sync.get([
    'autoResponder', 
    'signature', 
    'yourName',
    'autoResponderRules'
  ], (result) => {
    // Auto-responder
    const toggle = document.getElementById('autoResponderToggle');
    if (toggle) toggle.checked = result.autoResponder || false;
    
    // Signature
    const signature = document.getElementById('signature');
    if (signature) signature.value = result.signature || '';
    
    // Your name
    const yourName = document.getElementById('yourName');
    if (yourName) yourName.value = result.yourName || '';
    
    // Load auto-responder rules
    loadAutoResponderRules(result.autoResponderRules || []);
    
    // Populate default response template dropdown
    loadTemplatesForAutoResponder();
  });
}

// Load templates into the default response template dropdown
function loadTemplatesForAutoResponder() {
  chrome.storage.sync.get(['templates'], (result) => {
    const templates = result.templates || [];
    const dropdown = document.getElementById('defaultResponseTemplate');
    
    if (!dropdown) return;
    
    // Clear existing options except first one
    dropdown.innerHTML = '<option value="">Select a template</option>';
    
    // Add all templates to dropdown
    templates.forEach(template => {
      const option = document.createElement('option');
      option.value = template.id;
      option.textContent = template.name;
      dropdown.appendChild(option);
    });
    
    // Load saved selection
    chrome.storage.sync.get(['defaultResponseTemplateId'], (data) => {
      if (data.defaultResponseTemplateId) {
        dropdown.value = data.defaultResponseTemplateId;
      }
    });
  });
}

// Load auto-responder keyword rules
function loadAutoResponderRules(rules) {
  const container = document.getElementById('keywordRules');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (rules.length === 0) {
    container.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">No keyword rules added yet</p>';
    return;
  }
  
  rules.forEach((rule, index) => {
    const ruleElement = document.createElement('div');
    ruleElement.className = 'keyword-rule';
    ruleElement.style.cssText = `
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 12px;
    `;
    ruleElement.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; gap: 12px;">
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 8px;">Keywords: ${rule.keywords.join(', ')}</div>
          <div style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">Response: ${rule.response.substring(0, 100)}${rule.response.length > 100 ? '...' : ''}</div>
          <div style="color: #9ca3af; font-size: 12px;">Delay: ${rule.delay}ms</div>
        </div>
        <button class="delete-rule" data-index="${index}" style="
          background: #EF4444;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        ">Delete</button>
      </div>
    `;
    container.appendChild(ruleElement);
    
    // Add delete listener
    ruleElement.querySelector('.delete-rule').addEventListener('click', () => {
      deleteKeywordRule(index);
    });
  });
}

// Setup event listeners
function setupEventListeners() {
  // New template button
  const newTemplateBtn = document.getElementById('newTemplateBtn');
  if (newTemplateBtn) {
    newTemplateBtn.addEventListener('click', () => {
      showTemplateModal();
    });
  }
  
  // Search functionality
  const templateSearch = document.getElementById('templateSearch');
  if (templateSearch) {
    templateSearch.addEventListener('input', (e) => {
      filterAndDisplayTemplates();
    });
  }
  
  // Category filter functionality
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      filterAndDisplayTemplates();
    });
  }
  
  // Auto-responder toggle
  const autoResponderToggle = document.getElementById('autoResponderToggle');
  if (autoResponderToggle) {
    autoResponderToggle.addEventListener('change', (e) => {
      chrome.storage.sync.set({ autoResponder: e.target.checked });
    });
  }
  
  // Default response template dropdown
  const defaultResponseTemplate = document.getElementById('defaultResponseTemplate');
  if (defaultResponseTemplate) {
    defaultResponseTemplate.addEventListener('change', (e) => {
      chrome.storage.sync.set({ defaultResponseTemplateId: e.target.value });
      console.log('✅ Default response template saved:', e.target.value);
    });
  }
  
  // Response delay input
  const responseDelay = document.getElementById('responseDelay');
  if (responseDelay) {
    responseDelay.addEventListener('change', (e) => {
      chrome.storage.sync.set({ autoResponseDelay: parseInt(e.target.value) });
      console.log('✅ Response delay saved:', e.target.value);
    });
  }
  
  // Add keyword rule button
  const addKeywordBtn = document.getElementById('addKeywordBtn');
  if (addKeywordBtn) {
    addKeywordBtn.addEventListener('click', () => {
      showAddKeywordRuleModal();
    });
  }
  
  // Working hours toggle
  const workingHoursToggle = document.getElementById('enableWorkingHours');
  if (workingHoursToggle) {
    workingHoursToggle.addEventListener('change', (e) => {
      const settings = document.getElementById('workingHoursSettings');
      if (settings) {
        settings.style.display = e.target.checked ? 'block' : 'none';
      }
    });
  }
  
  // Save settings on input
  ['signature', 'yourName'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', (e) => {
        const settings = {};
        settings[id] = e.target.value;
        chrome.storage.sync.set(settings);
      });
    }
  });
}

// Filter and display templates based on search and category
function filterAndDisplayTemplates() {
  const searchTerm = document.getElementById('templateSearch')?.value.toLowerCase() || '';
  const selectedCategory = document.getElementById('categoryFilter')?.value || '';
  
  chrome.storage.sync.get(['templates'], (result) => {
    const templates = result.templates || [];
    
    // Filter templates
    const filteredTemplates = templates.filter(template => {
      // Search filter
      const matchesSearch = !searchTerm || 
        template.name.toLowerCase().includes(searchTerm) ||
        template.content.toLowerCase().includes(searchTerm) ||
        (template.tags && template.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
      
      // Category filter
      const matchesCategory = !selectedCategory || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
    
    // Display filtered templates
    displayTemplates(filteredTemplates);
  });
}

// Setup navigation
function setupNavigation() {
  // Navigation items
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.content-section');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Get target section
      const targetId = item.getAttribute('href').substring(1);
      
      // Update active nav item
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Show target section
      sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetId) {
          section.classList.add('active');
        }
      });
    });
  });
}

// ========== KEYWORD RULE MANAGEMENT ==========

// Show modal to add a new keyword rule
function showAddKeywordRuleModal() {
  const modalHTML = `
    <div id="keywordRuleModal" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        background: white;
        border-radius: 12px;
        padding: 24px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0;">Add Keyword Rule</h3>
          <button class="close-modal" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
          ">×</button>
        </div>
        
        <form id="keywordRuleForm" style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 8px;">Keywords (comma-separated)</label>
            <input type="text" id="ruleKeywords" placeholder="hello, hi, thank you" style="
              width: 100%;
              padding: 8px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 14px;
            " required>
          </div>
          
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 8px;">Response Message</label>
            <textarea id="ruleResponse" rows="4" placeholder="Enter the auto-response message..." style="
              width: 100%;
              padding: 8px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 14px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            " required></textarea>
          </div>
          
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 8px;">Response Delay (milliseconds)</label>
            <input type="number" id="ruleDelay" min="500" max="30000" value="2000" style="
              width: 100%;
              padding: 8px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 14px;
            ">
          </div>
          
          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px;">
            <button type="button" class="close-modal" style="
              padding: 10px 16px;
              background: #f3f4f6;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            ">Cancel</button>
            <button type="submit" style="
              padding: 10px 16px;
              background: #4f46e5;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            ">Add Rule</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  const modal = document.createElement('div');
  modal.innerHTML = modalHTML;
  document.body.appendChild(modal);
  
  const modalElement = document.getElementById('keywordRuleModal');
  const closeButtons = modalElement.querySelectorAll('.close-modal');
  const form = document.getElementById('keywordRuleForm');
  
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modal.remove();
    });
  });
  
  modalElement.addEventListener('click', (e) => {
    if (e.target === modalElement) {
      modal.remove();
    }
  });
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const keywords = document.getElementById('ruleKeywords').value
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k);
    const response = document.getElementById('ruleResponse').value;
    const delay = parseInt(document.getElementById('ruleDelay').value) || 2000;
    
    if (keywords.length === 0 || !response) {
      alert('Please enter keywords and a response message');
      return;
    }
    
    addKeywordRule({ keywords, response, delay });
    modal.remove();
  });
}

// Add keyword rule to storage
function addKeywordRule(rule) {
  chrome.storage.sync.get(['autoResponderRules'], (result) => {
    const rules = result.autoResponderRules || [];
    rules.push(rule);
    
    chrome.storage.sync.set({ autoResponderRules: rules }, () => {
      console.log('✅ Keyword rule added:', rule);
      loadAutoResponderRules(rules);
      showNotification('Keyword rule added successfully!');
    });
  });
}

// Delete keyword rule
function deleteKeywordRule(index) {
  chrome.storage.sync.get(['autoResponderRules'], (result) => {
    const rules = result.autoResponderRules || [];
    rules.splice(index, 1);
    
    chrome.storage.sync.set({ autoResponderRules: rules }, () => {
      console.log('✅ Keyword rule deleted');
      loadAutoResponderRules(rules);
      showNotification('Keyword rule deleted!');
    });
  });
}