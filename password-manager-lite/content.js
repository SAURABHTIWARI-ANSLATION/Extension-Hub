// Auto-fill login forms
class AutoFill {
  constructor() {
    this.init();
  }

  async init() {
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'getLoginFields') {
        const fields = this.findLoginFields();
        sendResponse({ fields });
      }
      return true;
    });
  }

  findLoginFields() {
    const fields = [];
    
    // Find all input fields
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
    
    inputs.forEach(input => {
      fields.push({
        type: input.type,
        name: input.name || input.id || input.className,
        value: input.value,
        placeholder: input.placeholder
      });
    });

    return fields;
  }

  fillCredentials(username, password) {
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
    
    inputs.forEach(input => {
      if (input.type === 'password') {
        input.value = password;
      } else if (input.type === 'text' || input.type === 'email') {
        // Try to identify username field
        const name = (input.name || input.id || '').toLowerCase();
        if (name.includes('user') || name.includes('email') || name.includes('login')) {
          input.value = username;
        }
      }
      
      // Trigger change event
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
}

// Initialize
new AutoFill();