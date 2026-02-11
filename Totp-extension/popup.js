// Main popup functionality
document.addEventListener('DOMContentLoaded', async function() {
  const totp = new TOTP();
  let accounts = [];
  let updateInterval;
  let accountToDelete = null;

  // DOM Elements
  const accountsList = document.getElementById('accounts-list');
  const addModal = document.getElementById('add-modal');
  const confirmModal = document.getElementById('confirm-modal');
  const addForm = document.getElementById('add-form');
  const searchInput = document.getElementById('search');
  const showSecretBtn = document.getElementById('show-secret');
  const secretKeyInput = document.getElementById('secret-key');
  const addAccountBtn = document.getElementById('add-account');
  const closeModalBtn = document.querySelector('.close');
  const closeConfirmBtn = document.querySelector('.close-confirm');
  const cancelBtn = document.querySelector('.cancel-btn');
  const cancelDeleteBtn = document.getElementById('cancel-delete');
  const confirmDeleteBtn = document.getElementById('confirm-delete');
  const confirmMessage = document.getElementById('confirm-message');

  // Initialize
  loadAccounts();
  setupEventListeners();
  startUpdateInterval();

  // Load accounts from storage
  async function loadAccounts() {
    try {
      const data = await chrome.storage.sync.get('otpAccounts');
      accounts = data.otpAccounts || [];
      renderAccounts();
    } catch (error) {
      console.error('Failed to load accounts:', error);
      showToast('Failed to load accounts', 'error');
    }
  }

  // Save accounts to storage
  async function saveAccounts() {
    try {
      await chrome.storage.sync.set({ otpAccounts: accounts });
    } catch (error) {
      console.error('Failed to save accounts:', error);
      showToast('Failed to save accounts', 'error');
    }
  }

  // Render accounts list
  function renderAccounts(filter = '') {
    accountsList.innerHTML = '';
    
    const filteredAccounts = accounts.filter(account => 
      account.name.toLowerCase().includes(filter.toLowerCase()) ||
      (account.issuer && account.issuer.toLowerCase().includes(filter.toLowerCase()))
    );
    
    if (filteredAccounts.length === 0) {
      accountsList.innerHTML = `
        <div class="empty-state">
          <p>${filter ? 'No matching accounts' : 'No accounts added yet'}</p>
          <p>${filter ? 'Try a different search' : 'Click "+ Add Account" to get started'}</p>
        </div>
      `;
      return;
    }
    
    filteredAccounts.forEach((account, index) => {
      const accountElement = document.createElement('div');
      accountElement.className = 'account-item';
      accountElement.innerHTML = `
        <div class="account-header">
          <div>
            <div class="account-name">${escapeHtml(account.name)}</div>
            ${account.issuer ? `<div class="issuer">${escapeHtml(account.issuer)}</div>` : ''}
          </div>
        </div>
        <div class="account-code">
          <div class="code">${account.code || '------'}</div>
          <div class="time-left">${account.timeLeft || '30'}s</div>
        </div>
        <div class="progress-bar">
          <div class="progress" style="width: ${(account.timeLeft / 30) * 100}%"></div>
        </div>
        <div class="account-actions">
          <button class="copy-btn" data-index="${index}">Copy Code</button>
          <button class="delete-btn" data-index="${index}">Delete</button>
        </div>
      `;
      accountsList.appendChild(accountElement);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', copyCode);
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', showDeleteConfirm);
    });
  }

  // Update all codes
  async function updateCodes() {
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      try {
        account.code = await totp.generateTOTP(account.secret);
        account.timeLeft = totp.getTimeRemaining();
      } catch (error) {
        account.code = 'ERROR';
        account.timeLeft = 30;
      }
    }
    
    const filter = searchInput.value;
    renderAccounts(filter);
  }

  // Start update interval (every second)
  function startUpdateInterval() {
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(updateCodes, 1000);
  }

  // Copy code to clipboard
  async function copyCode(e) {
    const index = parseInt(e.target.dataset.index);
    const code = accounts[index].code;
    
    try {
      await navigator.clipboard.writeText(code);
      showToast('Code copied to clipboard!', 'success');
    } catch (error) {
      console.error('Failed to copy:', error);
      showToast('Failed to copy code', 'error');
    }
  }

  // Show delete confirmation modal
  function showDeleteConfirm(e) {
    const index = parseInt(e.target.dataset.index);
    accountToDelete = index;
    const accountName = accounts[index].name;
    
    confirmMessage.textContent = `Delete account "${accountName}"?`;
    confirmModal.style.display = 'block';
  }

  // Delete account (after confirmation)
  async function deleteAccount() {
    if (accountToDelete === null) return;
    
    accounts.splice(accountToDelete, 1);
    await saveAccounts();
    updateCodes();
    accountToDelete = null;
    confirmModal.style.display = 'none';
    showToast('Account deleted', 'success');
  }

  // Show toast notification
  function showToast(message, type = 'success') {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // Setup event listeners
  function setupEventListeners() {
    // Add account button
    addAccountBtn.addEventListener('click', () => {
      addModal.style.display = 'block';
      document.getElementById('account-name').focus();
    });

    // Close add modal buttons
    closeModalBtn.addEventListener('click', () => {
      addModal.style.display = 'none';
      addForm.reset();
    });

    cancelBtn.addEventListener('click', () => {
      addModal.style.display = 'none';
      addForm.reset();
    });

    // Close confirm modal buttons
    closeConfirmBtn.addEventListener('click', () => {
      confirmModal.style.display = 'none';
      accountToDelete = null;
    });

    cancelDeleteBtn.addEventListener('click', () => {
      confirmModal.style.display = 'none';
      accountToDelete = null;
    });

    confirmDeleteBtn.addEventListener('click', deleteAccount);

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === addModal) {
        addModal.style.display = 'none';
        addForm.reset();
      }
      if (e.target === confirmModal) {
        confirmModal.style.display = 'none';
        accountToDelete = null;
      }
    });

    // Add account form submission
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('account-name').value.trim();
      let secret = document.getElementById('secret-key').value.trim();
      const issuer = document.getElementById('issuer').value.trim();
      
      // Clean the secret (remove spaces)
      secret = secret.replace(/\s/g, '');
      
      // Validate secret (basic base32 validation)
      const base32Regex = /^[A-Z2-7]+=*$/i;
      if (!base32Regex.test(secret)) {
        showToast('Please enter a valid base32 secret key', 'error');
        return;
      }
      
      try {
        // Test generating a code to validate the secret
        const testCode = await totp.generateTOTP(secret);
        if (testCode === 'ERROR') {
          throw new Error('Invalid secret key');
        }
        
        // Check for duplicates
        const duplicate = accounts.find(acc => 
          acc.name.toLowerCase() === name.toLowerCase() && 
          acc.secret === secret
        );
        
        if (duplicate) {
          showToast('This account already exists', 'error');
          return;
        }
        
        // Add account
        accounts.push({
          name,
          secret,
          issuer: issuer || '',
          code: testCode,
          timeLeft: totp.getTimeRemaining(),
          addedAt: Date.now()
        });
        
        await saveAccounts();
        updateCodes();
        addModal.style.display = 'none';
        addForm.reset();
        showToast('Account added successfully!', 'success');
        
        // Scroll to show new account
        accountsList.scrollTop = accountsList.scrollHeight;
      } catch (error) {
        showToast('Invalid secret key. Please check and try again.', 'error');
      }
    });

    // Toggle secret visibility
    showSecretBtn.addEventListener('click', () => {
      const type = secretKeyInput.type === 'password' ? 'text' : 'password';
      secretKeyInput.type = type;
      showSecretBtn.textContent = type === 'password' ? 'Show' : 'Hide';
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
      renderAccounts(e.target.value);
    });
  }

  // Utility function to escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initial code update
  updateCodes();
});