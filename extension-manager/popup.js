class ExtensionManager {
  constructor() {
    this.extensions = [];
    this.filteredExtensions = [];
    this.currentFilter = 'all';
    this.searchTerm = '';
    this.init();
  }

  async init() {
    await this.loadExtensions();
    this.setupEventListeners();
    this.setupDropdown();
  }

  async loadExtensions() {
    try {
      // Show loading
      const list = document.getElementById('extensions-list');
      list.innerHTML = `
        <div class="loading">
          <div class="empty-icon">⏳</div>
          <div class="empty-text">Loading extensions...</div>
        </div>
      `;

      const allExtensions = await chrome.management.getAll();
      const thisExtensionId = chrome.runtime.id;
      
      // Filter out our own extension
      this.extensions = allExtensions.filter(ext => ext.id !== thisExtensionId);
      
      // Sort alphabetically
      this.extensions.sort((a, b) => a.name.localeCompare(b.name));
      
      this.applyFilters();
      this.updateStats();
      
    } catch (error) {
      this.showError('Failed to load extensions');
      console.error('Error:', error);
    }
  }

  applyFilters() {
    let filtered = [...this.extensions];
    
    // Apply filter
    switch(this.currentFilter) {
      case 'enabled':
        filtered = filtered.filter(ext => ext.enabled);
        break;
      case 'disabled':
        filtered = filtered.filter(ext => !ext.enabled);
        break;
      case 'all':
      default:
        break;
    }
    
    // Apply search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(ext =>
        ext.name.toLowerCase().includes(term) ||
        (ext.description && ext.description.toLowerCase().includes(term))
      );
    }
    
    this.filteredExtensions = filtered;
    this.renderExtensions();
  }

  renderExtensions() {
    const list = document.getElementById('extensions-list');
    
    if (this.filteredExtensions.length === 0) {
      let message = 'No extensions found';
      let submessage = '';
      
      if (this.searchTerm) {
        message = 'No matching extensions';
        submessage = 'Try a different search term';
      } else if (this.currentFilter === 'enabled') {
        message = 'No enabled extensions';
        submessage = 'All extensions are disabled';
      } else if (this.currentFilter === 'disabled') {
        message = 'No disabled extensions';
        submessage = 'All extensions are enabled';
      }
      
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-text">${message}</div>
          <div class="empty-subtext">${submessage}</div>
        </div>
      `;
      return;
    }

    list.innerHTML = this.filteredExtensions.map(ext => `
      <div class="extension-item ${ext.enabled ? '' : 'disabled'}" data-id="${ext.id}">
        <img src="${ext.icons?.[0]?.url || 'icons/icon48.png'}" 
             alt="${ext.name}" 
             class="extension-icon"
             onerror="this.src='icons/icon48.png'">
        <div class="extension-name" title="${ext.description || ext.name}">
          ${ext.name}
          ${ext.mayDisable ? '' : `
            <div class="extension-warning">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              Required extension
            </div>
          `}
        </div>
        <div class="extension-actions">
          <label class="toggle-switch">
            <input type="checkbox" ${ext.enabled ? 'checked' : ''} 
                   ${ext.mayDisable ? '' : 'disabled'}
                   data-id="${ext.id}">
            <span class="toggle-slider"></span>
          </label>
          ${ext.mayDisable ? `
            <button class="remove-btn" title="Remove extension" data-id="${ext.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  updateStats() {
    const enabled = this.extensions.filter(ext => ext.enabled).length;
    const disabled = this.extensions.length - enabled;
    const removable = this.extensions.filter(ext => ext.mayDisable).length;
    
    document.getElementById('enabled-count').textContent = `${enabled} enabled`;
    document.getElementById('disabled-count').textContent = `${disabled} disabled`;
  }

  showError(message) {
    const list = document.getElementById('extensions-list');
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-text">${message}</div>
        <div class="empty-subtext">Please check permissions</div>
      </div>
    `;
  }

  // Add this method to show delete confirmation
  showDeleteConfirmation(extension) {
    // Create dialog HTML
    const dialogHTML = `
      <div class="confirm-dialog" id="delete-dialog">
        <div class="confirm-box">
          <div class="confirm-title">Remove "${extension.name}"?</div>
          <div class="confirm-message">
            This extension will be permanently removed from your browser. 
            This action cannot be undone.
            ${extension.mayDisable ? '' : '<br><br><strong>Note:</strong> This extension may be required by your browser or organization.'}
          </div>
          <div class="confirm-actions">
            <button class="confirm-btn confirm-cancel" id="cancel-delete">Cancel</button>
            <button class="confirm-btn confirm-delete" id="confirm-delete">Remove</button>
          </div>
        </div>
      </div>
    `;

    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', dialogHTML);
    
    const dialog = document.getElementById('delete-dialog');
    const cancelBtn = document.getElementById('cancel-delete');
    const confirmBtn = document.getElementById('confirm-delete');

    // Handle cancel
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(dialog);
    });

    // Handle confirm
    confirmBtn.addEventListener('click', async () => {
      try {
        confirmBtn.textContent = 'Removing...';
        confirmBtn.disabled = true;
        
        await chrome.management.uninstall(extension.id);
        document.body.removeChild(dialog);
        await this.loadExtensions();
        
      } catch (error) {
        alert(`Failed to remove extension: ${error.message}`);
        document.body.removeChild(dialog);
      }
    });

    // Close on background click
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        document.body.removeChild(dialog);
      }
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(dialog);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  setupDropdown() {
    const filterBtn = document.getElementById('filter-btn');
    const dropdown = document.getElementById('filter-dropdown');
    const items = dropdown.querySelectorAll('.dropdown-item');

    // Toggle dropdown
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    // Handle item selection
    items.forEach(item => {
      item.addEventListener('click', () => {
        // Update active item
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Update filter button text
        const text = item.textContent;
        filterBtn.querySelector('span').textContent = text.split(' ')[0];
        
        // Apply filter
        this.currentFilter = item.dataset.filter;
        this.applyFilters();
        
        // Close dropdown
        dropdown.classList.remove('show');
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      dropdown.classList.remove('show');
    });
  }

  setupEventListeners() {
    // Search with debounce
    let searchTimeout;
    document.getElementById('search').addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.applyFilters();
      }, 300);
    });

    // Refresh button
    document.getElementById('refresh').addEventListener('click', async () => {
      const refreshBtn = document.getElementById('refresh');
      const originalHTML = refreshBtn.innerHTML;
      refreshBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="animation: spin 1s linear infinite">
          <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97-.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
        </svg>
      `;
      
      // Add spin animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
      
      await this.loadExtensions();
      setTimeout(() => {
        refreshBtn.innerHTML = originalHTML;
        document.head.removeChild(style);
      }, 500);
    });

    // Enable all button
    document.getElementById('enable-all').addEventListener('click', async () => {
      const disableableExtensions = this.extensions.filter(ext => ext.mayDisable);
      if (disableableExtensions.length === 0) {
        alert('No extensions can be enabled/disabled');
        return;
      }
      
      if (confirm('Enable all extensions?')) {
        await Promise.all(
          disableableExtensions.map(ext => 
            chrome.management.setEnabled(ext.id, true)
          )
        );
        await this.loadExtensions();
      }
    });

    // Disable all button
    document.getElementById('disable-all').addEventListener('click', async () => {
      const enabledExtensions = this.extensions.filter(ext => ext.enabled && ext.mayDisable);
      if (enabledExtensions.length === 0) {
        alert('No enabled extensions to disable');
        return;
      }
      
      if (confirm(`Disable ${enabledExtensions.length} enabled extensions?`)) {
        await Promise.all(
          enabledExtensions.map(ext => 
            chrome.management.setEnabled(ext.id, false)
          )
        );
        await this.loadExtensions();
      }
    });

    // Remove selected button (if exists)
    const removeSelectedBtn = document.getElementById('remove-selected');
    if (removeSelectedBtn) {
      removeSelectedBtn.addEventListener('click', async () => {
        const removableExtensions = this.extensions.filter(ext => ext.mayDisable);
        
        if (removableExtensions.length === 0) {
          alert('No removable extensions found');
          return;
        }
        
        if (confirm(`Remove ${removableExtensions.length} removable extensions? This action cannot be undone.`)) {
          try {
            // Show loading
            const originalText = removeSelectedBtn.innerHTML;
            removeSelectedBtn.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="animation: spin 1s linear infinite">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97-.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
              </svg>
              Removing...
            `;
            
            // Remove extensions one by one
            for (const ext of removableExtensions) {
              try {
                await chrome.management.uninstall(ext.id);
              } catch (error) {
                console.error(`Failed to remove ${ext.name}:`, error);
              }
            }
            
            await this.loadExtensions();
            removeSelectedBtn.innerHTML = originalText;
            
          } catch (error) {
            alert(`Error removing extensions: ${error.message}`);
            removeSelectedBtn.innerHTML = originalText;
          }
        }
      });
    }

    // Toggle extension on/off
    document.getElementById('extensions-list').addEventListener('change', async (e) => {
      if (e.target.type === 'checkbox') {
        const extensionId = e.target.dataset.id;
        const isEnabled = e.target.checked;
        const extension = this.extensions.find(ext => ext.id === extensionId);
        
        if (!extension.mayDisable) {
          alert('This extension cannot be disabled');
          e.target.checked = !isEnabled;
          return;
        }
        
        try {
          await chrome.management.setEnabled(extensionId, isEnabled);
          await this.loadExtensions();
        } catch (error) {
          alert(`Cannot modify this extension: ${error.message}`);
          e.target.checked = !isEnabled;
        }
      }
    });

    // Remove extension button
    document.getElementById('extensions-list').addEventListener('click', async (e) => {
      if (e.target.closest('.remove-btn')) {
        const removeBtn = e.target.closest('.remove-btn');
        const extensionId = removeBtn.dataset.id;
        const extension = this.extensions.find(ext => ext.id === extensionId);
        
        if (extension && extension.mayDisable) {
          this.showDeleteConfirmation(extension);
        }
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Close on Escape
      if (e.key === 'Escape') {
        window.close();
      }
      
      // Focus search on Ctrl+F or /
      if ((e.ctrlKey && e.key === 'f') || e.key === '/') {
        e.preventDefault();
        document.getElementById('search').focus();
      }
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.extensionManager = new ExtensionManager();
});