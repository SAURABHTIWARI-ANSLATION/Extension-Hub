// DOM elements
const extractBtn = document.getElementById('extractBtn');
const copyAllBtn = document.getElementById('copyAllBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const emailList = document.getElementById('emailList');
const emailCount = document.getElementById('emailCount');
const domainCount = document.getElementById('domainCount');
const emptyState = document.getElementById('emptyState');
const toast = document.getElementById('toast');

let extractedEmails = [];

// Load saved emails on popup open
chrome.storage.local.get(['emails'], (result) => {
  if (result.emails && result.emails.length > 0) {
    extractedEmails = result.emails;
    displayEmails();
  }
});

// Extract emails from current page
extractBtn.addEventListener('click', async () => {
  const originalText = extractBtn.innerHTML;
  extractBtn.innerHTML = `
    <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
      <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
    Extracting...
  `;
  extractBtn.classList.add('loading');
  extractBtn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if URL is restricted
    if (tab.url.startsWith('chrome://') || 
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:')) {
      showToast('❌ Cannot extract from browser internal pages', 'error');
      extractBtn.innerHTML = originalText;
      extractBtn.classList.remove('loading');
      extractBtn.disabled = false;
      return;
    }
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractEmailsFromPage
    });

    if (results && results[0] && results[0].result) {
      const newEmails = results[0].result;
      const beforeCount = extractedEmails.length;
      
      // Merge with existing emails and remove duplicates
      extractedEmails = [...new Set([...extractedEmails, ...newEmails])];
      
      // Save to storage
      chrome.storage.local.set({ emails: extractedEmails });
      
      displayEmails();
      
      const addedCount = extractedEmails.length - beforeCount;
      if (addedCount > 0) {
        showToast(`✅ Found ${addedCount} new email(s)!`, 'success');
      } else {
        showToast('ℹ️ No new emails found', 'success');
      }
    }
  } catch (error) {
    showToast('❌ Error extracting emails', 'error');
    console.error(error);
  } finally {
    extractBtn.innerHTML = originalText;
    extractBtn.classList.remove('loading');
    extractBtn.disabled = false;
  }
});

// Function to extract emails (injected into page)
function extractEmailsFromPage() {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const pageText = document.body.innerText;
  const pageHTML = document.body.innerHTML;
  
  // Extract from both text and HTML
  const textEmails = pageText.match(emailRegex) || [];
  const htmlEmails = pageHTML.match(emailRegex) || [];
  
  // Extract from mailto links
  const mailtoLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]'))
    .map(a => a.href.replace('mailto:', '').split('?')[0]);
  
  // Combine and remove duplicates
  const allEmails = [...new Set([...textEmails, ...htmlEmails, ...mailtoLinks])];
  
  // Filter out common false positives
  return allEmails.filter(email => {
    if (!email || email.length < 5) return false;
    
    const domain = email.split('@')[1];
    if (!domain) return false;
    
    const domainLower = domain.toLowerCase();
    
    // Exclude common placeholder/example domains
    const excludeDomains = [
      'example.com',
      'domain.com',
      'email.com',
      'test.com',
      'sample.com',
      'placeholder.com',
      'yourdomain',
      'yoursite',
      'company.com'
    ];
    
    return !excludeDomains.some(excluded => domainLower.includes(excluded));
  });
}

// Display emails in the list
function displayEmails() {
  emailList.innerHTML = '';
  emailCount.textContent = extractedEmails.length;
  
  // Calculate unique domains
  const domains = new Set(extractedEmails.map(email => email.split('@')[1]));
  domainCount.textContent = domains.size;

  if (extractedEmails.length === 0) {
    emptyState.style.display = 'flex';
    copyAllBtn.disabled = true;
    exportBtn.disabled = true;
    clearBtn.disabled = true;
    return;
  }

  emptyState.style.display = 'none';
  copyAllBtn.disabled = false;
  exportBtn.disabled = false;
  clearBtn.disabled = false;

  extractedEmails.forEach((email, index) => {
    const emailItem = document.createElement('div');
    emailItem.className = 'email-item';
    emailItem.style.animationDelay = `${index * 0.05}s`;
    
    const emailText = document.createElement('div');
    emailText.className = 'email-text';
    
    // Split email to highlight domain
    const [localPart, domain] = email.split('@');
    emailText.innerHTML = `${localPart}@<span class="email-domain">${domain}</span>`;
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-copy-single';
    copyBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"/>
      </svg>
      Copy
    `;
    
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyToClipboard(email, copyBtn);
    });
    
    emailItem.appendChild(emailText);
    emailItem.appendChild(copyBtn);
    emailList.appendChild(emailItem);
  });
}

// Copy individual email to clipboard
function copyToClipboard(email, button) {
  navigator.clipboard.writeText(email).then(() => {
    const originalHTML = button.innerHTML;
    button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Copied!
    `;
    button.classList.add('copied');
    
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove('copied');
    }, 2000);
  }).catch(() => {
    showToast('❌ Failed to copy', 'error');
  });
}

// Copy all emails to clipboard
copyAllBtn.addEventListener('click', () => {
  const emailText = extractedEmails.join('\n');
  navigator.clipboard.writeText(emailText).then(() => {
    showToast('✅ All emails copied to clipboard!', 'success');
  }).catch(() => {
    showToast('❌ Failed to copy emails', 'error');
  });
});

// Export emails as CSV
exportBtn.addEventListener('click', () => {
  const csvContent = 'Email Address,Domain\n' + 
    extractedEmails.map(email => {
      const [local, domain] = email.split('@');
      return `${email},${domain}`;
    }).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `extracted-emails-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ Emails exported successfully!', 'success');
});

// Clear all emails
clearBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all emails?')) {
    extractedEmails = [];
    chrome.storage.local.remove('emails');
    displayEmails();
    showToast('🗑️ All emails cleared', 'success');
  }
});

// Show toast notification
function showToast(message, type = 'success') {
  const toastIcon = toast.querySelector('.toast-icon');
  const toastMessage = toast.querySelector('.toast-message');
  
  // Set icon based on type
  if (type === 'success') {
    toastIcon.textContent = '✓';
  } else if (type === 'error') {
    toastIcon.textContent = '✕';
  } else {
    toastIcon.textContent = 'ℹ';
  }
  
  toastMessage.textContent = message.replace(/[✅❌ℹ️🗑️]/g, '').trim();
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
