// Encryption Utility
class CryptoUtil {
  static async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  static async encrypt(text, password) {
    try {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      
      const key = await this.deriveKey(password, salt);
      const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encoder.encode(text)
      );

      return {
        salt: Array.from(salt),
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encrypted))
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  static async decrypt(encryptedData, password) {
    try {
      const salt = new Uint8Array(encryptedData.salt);
      const iv = new Uint8Array(encryptedData.iv);
      const data = new Uint8Array(encryptedData.data);
      
      const key = await this.deriveKey(password, salt);
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        data
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Wrong password or corrupted data');
    }
  }
}

// Password Manager Class
class PasswordManager {
  constructor() {
    this.masterPassword = null;
    this.passwords = [];
    this.filteredPasswords = [];
    this.currentEditingId = null;
    this.init();
  }

  async init() {
    await this.checkFirstTime();
    this.setupEventListeners();
  }

  async checkFirstTime() {
    const { masterPasswordHash } = await chrome.storage.local.get('masterPasswordHash');
    
    if (!masterPasswordHash) {
      document.getElementById('setupHint').textContent = 'First time? Set a master password';
      document.getElementById('setupHint').style.cursor = 'pointer';
      document.getElementById('setupHint').onclick = () => {
        document.getElementById('setupHint').textContent = 'Enter a strong master password (min 8 chars)';
      };
    }
  }

  async setupMasterPassword(password) {
    const hash = await this.hashPassword(password);
    await chrome.storage.local.set({ masterPasswordHash: hash });
    this.masterPassword = password;
    this.showDashboard();
    this.loadPasswords();
  }

  async verifyMasterPassword(password) {
    const { masterPasswordHash } = await chrome.storage.local.get('masterPasswordHash');
    
    if (!masterPasswordHash) {
      // First time setup
      await this.setupMasterPassword(password);
      return true;
    }

    const hash = await this.hashPassword(password);
    if (hash === masterPasswordHash) {
      this.masterPassword = password;
      this.showDashboard();
      this.loadPasswords();
      return true;
    }
    return false;
  }

  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  showDashboard() {
    document.getElementById('lockScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    this.updateStats();
  }

  showLockScreen() {
    document.getElementById('lockScreen').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('masterPassword').value = '';
    this.masterPassword = null;
  }

  async loadPasswords() {
    const { encryptedPasswords } = await chrome.storage.local.get('encryptedPasswords');
    
    if (encryptedPasswords && this.masterPassword) {
      try {
        const decrypted = await CryptoUtil.decrypt(encryptedPasswords, this.masterPassword);
        this.passwords = JSON.parse(decrypted);
        this.renderPasswords();
      } catch (error) {
        console.error('Failed to decrypt passwords:', error);
        this.passwords = [];
        this.renderPasswords();
      }
    } else {
      this.passwords = [];
      this.renderPasswords();
    }
  }

  async savePasswords() {
    if (!this.masterPassword) return;

    try {
      const data = JSON.stringify(this.passwords);
      const encrypted = await CryptoUtil.encrypt(data, this.masterPassword);
      await chrome.storage.local.set({ encryptedPasswords: encrypted });
      this.updateStats();
    } catch (error) {
      console.error('Failed to save passwords:', error);
    }
  }

  addPassword(passwordData) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const password = {
      id,
      ...passwordData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.passwords.unshift(password);
    this.savePasswords();
    this.renderPasswords();
  }

  updatePassword(id, passwordData) {
    const index = this.passwords.findIndex(p => p.id === id);
    if (index !== -1) {
      this.passwords[index] = {
        ...this.passwords[index],
        ...passwordData,
        updatedAt: new Date().toISOString()
      };
      this.savePasswords();
      this.renderPasswords();
    }
  }

  deletePassword(id) {
    if (confirm('Are you sure you want to delete this password?')) {
      this.passwords = this.passwords.filter(p => p.id !== id);
      this.savePasswords();
      this.renderPasswords();
    }
  }

  renderPasswords() {
    const list = document.getElementById('passwordsList');
    const searchTerm = document.getElementById('search')?.value.toLowerCase() || '';
    
    this.filteredPasswords = this.passwords.filter(pass => {
      if (searchTerm) {
        return pass.website.toLowerCase().includes(searchTerm) ||
               pass.username.toLowerCase().includes(searchTerm) ||
               (pass.notes && pass.notes.toLowerCase().includes(searchTerm));
      }
      return true;
    });

    if (this.filteredPasswords.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔐</div>
          <div class="empty-text">
            ${searchTerm ? 'No matching passwords' : 'No passwords saved yet'}
          </div>
          <div class="empty-subtext">
            ${searchTerm ? 'Try a different search term' : 'Click + to add your first password'}
          </div>
        </div>
      `;
      return;
    }

    list.innerHTML = this.filteredPasswords.map(pass => `
      <div class="password-item" data-id="${pass.id}">
        <div class="password-header">
          <div class="password-website">
            <img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(pass.website)}&sz=16" 
                 class="password-favicon"
                 onerror="this.style.display='none'">
            ${pass.website}
          </div>
          <div class="password-time">
            ${new Date(pass.updatedAt).toLocaleDateString()}
          </div>
        </div>
        <div class="password-username">${pass.username}</div>
        <div class="password-actions">
          <button class="action-icon copy-username-btn" title="Copy username" data-id="${pass.id}">
            👤
          </button>
          <button class="action-icon copy-password-btn" title="Copy password" data-id="${pass.id}">
            🔑
          </button>
          <button class="action-icon edit-btn" title="Edit" data-id="${pass.id}">
            ✏️
          </button>
          <button class="action-icon delete-btn" title="Delete" data-id="${pass.id}">
            🗑️
          </button>
        </div>
      </div>
    `).join('');
  }

  updateStats() {
    const passwordCount = document.getElementById('passwordCount');
    const weakCount = document.getElementById('weakCount');
    
    if (passwordCount) {
      passwordCount.textContent = `${this.passwords.length} passwords`;
    }
    
    if (weakCount) {
      const weakCountNum = this.passwords.filter(p => this.checkPasswordStrength(p.password) === 'weak').length;
      weakCount.textContent = `${weakCountNum} weak`;
    }
  }

  checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  }

  async copyPassword(id) {
    const password = this.passwords.find(p => p.id === id);
    if (password) {
      try {
        await navigator.clipboard.writeText(password.password);
        this.showToast('Password copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
        this.showToast('Failed to copy password');
      }
    }
  }

  async copyUsername(id) {
    const password = this.passwords.find(p => p.id === id);
    if (password) {
      try {
        await navigator.clipboard.writeText(password.username);
        this.showToast('Username copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
        this.showToast('Failed to copy username');
      }
    }
  }

  showToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create new toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--accent-green);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  showPasswordModal(editId = null) {
    this.currentEditingId = editId;
    const modal = document.getElementById('passwordModal');
    const title = document.getElementById('modalTitle');
    const website = document.getElementById('website');
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const notes = document.getElementById('notes');
    
    if (editId) {
      title.textContent = 'Edit Password';
      const existing = this.passwords.find(p => p.id === editId);
      if (existing) {
        website.value = existing.website || '';
        username.value = existing.username || '';
        password.value = existing.password || '';
        notes.value = existing.notes || '';
      }
    } else {
      title.textContent = 'Add Password';
      website.value = '';
      username.value = '';
      password.value = '';
      notes.value = '';
      
      // Try to get current website URL
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          try {
            const url = new URL(tabs[0].url);
            website.value = url.hostname;
          } catch (e) {
            console.log('Could not parse URL');
          }
        }
      });
    }
    
    modal.classList.remove('hidden');
    website.focus();
  }

  hidePasswordModal() {
    document.getElementById('passwordModal').classList.add('hidden');
    this.currentEditingId = null;
  }

  savePasswordFromModal() {
    const website = document.getElementById('website').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const notes = document.getElementById('notes').value.trim();

    if (!website || !username || !password) {
      alert('Please fill in all required fields');
      return;
    }

    const passwordData = {
      website,
      username,
      password,
      notes
    };

    if (this.currentEditingId) {
      this.updatePassword(this.currentEditingId, passwordData);
    } else {
      this.addPassword(passwordData);
    }

    this.hidePasswordModal();
  }

  editPassword(id) {
    this.showPasswordModal(id);
  }

  showPasswordDetails(id) {
    // Optional: Show password details in a view mode
    const password = this.passwords.find(p => p.id === id);
    if (password) {
      alert(`Website: ${password.website}\nUsername: ${password.username}\nPassword: ${password.password}\n\nNotes: ${password.notes || 'None'}`);
    }
  }

  exportPasswords() {
    if (this.passwords.length === 0) {
      alert('No passwords to export');
      return;
    }

    const dataStr = JSON.stringify(this.passwords, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `passwords-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    this.showToast('Passwords exported successfully!');
  }

  // NEW: Import functionality
  showImportModal() {
    document.getElementById('importModal').classList.remove('hidden');
  }

  hideImportModal() {
    document.getElementById('importModal').classList.add('hidden');
    document.getElementById('importFile').value = '';
  }

  importPasswords(file) {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        
        if (!Array.isArray(imported)) {
          throw new Error('Invalid file format');
        }

        // Merge with existing passwords (avoid duplicates by ID)
        const existingIds = new Set(this.passwords.map(p => p.id));
        const newPasswords = imported.filter(p => !existingIds.has(p.id));
        
        this.passwords = [...this.passwords, ...newPasswords];
        await this.savePasswords();
        this.renderPasswords();
        
        this.showToast(`Imported ${newPasswords.length} passwords successfully!`);
        this.hideImportModal();
        
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import passwords. Make sure the file is valid JSON format.');
      }
    };
    
    reader.readAsText(file);
  }

  setupEventListeners() {
    // Unlock button
    document.getElementById('unlockBtn').addEventListener('click', async () => {
      const password = document.getElementById('masterPassword').value;
      if (password.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
      }

      const success = await this.verifyMasterPassword(password);
      if (!success) {
        alert('Wrong password!');
      }
    });

    // Enter key in password field
    document.getElementById('masterPassword').addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        document.getElementById('unlockBtn').click();
      }
    });

    // Lock button
    document.getElementById('lockBtn').addEventListener('click', () => {
      this.showLockScreen();
    });

    // Search
    let searchTimeout;
    const searchInput = document.getElementById('search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.renderPasswords();
        }, 300);
      });
    }

    // Add password button
    const addPasswordBtn = document.getElementById('addPassword');
    if (addPasswordBtn) {
      addPasswordBtn.addEventListener('click', () => {
        this.showPasswordModal();
      });
    }

    // Import button
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        this.showImportModal();
      });
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportPasswords();
      });
    }

    // Password Modal events
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        this.hidePasswordModal();
      });
    }

    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hidePasswordModal();
      });
    }

    const savePasswordBtn = document.getElementById('savePassword');
    if (savePasswordBtn) {
      savePasswordBtn.addEventListener('click', () => {
        this.savePasswordFromModal();
      });
    }

    // Show password toggle
    const showPasswordBtn = document.getElementById('showPassword');
    if (showPasswordBtn) {
      showPasswordBtn.addEventListener('click', () => {
        const passwordInput = document.getElementById('password');
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          showPasswordBtn.textContent = '🙈';
        } else {
          passwordInput.type = 'password';
          showPasswordBtn.textContent = '👁️';
        }
      });
    }

    // Import Modal events
    const closeImportBtn = document.getElementById('closeImport');
    if (closeImportBtn) {
      closeImportBtn.addEventListener('click', () => {
        this.hideImportModal();
      });
    }

    const cancelImportBtn = document.getElementById('cancelImport');
    if (cancelImportBtn) {
      cancelImportBtn.addEventListener('click', () => {
        this.hideImportModal();
      });
    }

    const confirmImportBtn = document.getElementById('confirmImport');
    if (confirmImportBtn) {
      confirmImportBtn.addEventListener('click', () => {
        const fileInput = document.getElementById('importFile');
        if (fileInput.files.length > 0) {
          this.importPasswords(fileInput.files[0]);
        } else {
          alert('Please select a file to import');
        }
      });
    }

    // File input change
    const importFileInput = document.getElementById('importFile');
    if (importFileInput) {
      importFileInput.addEventListener('change', (e) => {
        // Optional: Validate file before showing confirm button
      });
    }

    // Password strength check
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
      passwordInput.addEventListener('input', () => {
        this.updatePasswordStrength();
      });
    }

    // Password list events (delegated)
    const passwordsList = document.getElementById('passwordsList');
    if (passwordsList) {
      passwordsList.addEventListener('click', (e) => {
        const passwordItem = e.target.closest('.password-item');
        if (!passwordItem) return;

        const id = passwordItem.dataset.id;
        
        if (e.target.classList.contains('copy-password-btn') || 
            e.target.closest('.copy-password-btn')) {
          this.copyPassword(id);
        } else if (e.target.classList.contains('copy-username-btn') || 
                   e.target.closest('.copy-username-btn')) {
          this.copyUsername(id);
        } else if (e.target.classList.contains('edit-btn') || 
                   e.target.closest('.edit-btn')) {
          this.editPassword(id);
        } else if (e.target.classList.contains('delete-btn') || 
                   e.target.closest('.delete-btn')) {
          this.deletePassword(id);
        } else if (e.target.closest('.password-item')) {
          this.showPasswordDetails(id);
        }
      });
    }
  }

  updatePasswordStrength() {
    const password = document.getElementById('password')?.value || '';
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthFill || !strengthText) return;
    
    const strength = this.checkPasswordStrength(password);
    
    strengthFill.className = 'strength-fill';
    strengthFill.classList.add(`strength-${strength}`);
    
    const texts = {
      weak: 'Weak password',
      medium: 'Medium strength',
      strong: 'Strong password'
    };
    
    strengthText.textContent = texts[strength];
    strengthText.style.color = {
      weak: 'var(--accent-red)',
      medium: 'var(--warning)',
      strong: 'var(--accent-green)'
    }[strength];
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.passwordManager = new PasswordManager();
});