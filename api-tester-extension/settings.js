document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const backBtn = document.getElementById('backBtn');
    const saveBtn = document.getElementById('saveSettings');
    const resetBtn = document.getElementById('resetSettings');
    
    // Default settings - No theme needed
    const defaultSettings = {
        autoFormat: true,
        showResponseTime: true,
        autoCopy: false,
        historyLimit: 20,
        requestTimeout: 60,
        defaultContentType: 'application/json'
    };
    
    let currentSettings = {};
    
    // Initialize
    loadSettings();
    
    // Event Listeners
    backBtn.addEventListener('click', function() {
        window.close();
    });
    
    saveBtn.addEventListener('click', saveSettings);
    resetBtn.addEventListener('click', resetSettings);
    
    // Functions
    
    function loadSettings() {
        chrome.storage.local.get(['extensionSettings'], function(result) {
            if (result.extensionSettings) {
                currentSettings = {...defaultSettings, ...result.extensionSettings};
            } else {
                currentSettings = {...defaultSettings};
            }
            applySettingsToUI();
        });
    }
    
    function applySettingsToUI() {
        // Set checkboxes and selects
        document.getElementById('autoFormat').checked = currentSettings.autoFormat;
        document.getElementById('showResponseTime').checked = currentSettings.showResponseTime;
        document.getElementById('autoCopy').checked = currentSettings.autoCopy;
        document.getElementById('historyLimit').value = currentSettings.historyLimit;
        document.getElementById('requestTimeout').value = currentSettings.requestTimeout;
        document.getElementById('defaultContentType').value = currentSettings.defaultContentType;
    }
    
    function saveSettings() {
        // Collect settings from UI
        currentSettings.autoFormat = document.getElementById('autoFormat').checked;
        currentSettings.showResponseTime = document.getElementById('showResponseTime').checked;
        currentSettings.autoCopy = document.getElementById('autoCopy').checked;
        currentSettings.historyLimit = parseInt(document.getElementById('historyLimit').value);
        currentSettings.requestTimeout = parseInt(document.getElementById('requestTimeout').value);
        currentSettings.defaultContentType = document.getElementById('defaultContentType').value;
        
        // Save to storage
        chrome.storage.local.set({ extensionSettings: currentSettings }, function() {
            // Show success message
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '✓ Saved!';
            saveBtn.style.background = 'linear-gradient(135deg, #10B981, #34D399)';
            
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.background = '';
            }, 1500);
            
            // Update popup if it's open
            chrome.runtime.sendMessage({
                action: 'settingsUpdated',
                settings: currentSettings
            });
        });
    }
    
    function resetSettings() {
        if (confirm('Reset all settings to defaults?')) {
            currentSettings = {...defaultSettings};
            applySettingsToUI();
            
            // Show reset confirmation
            const originalText = resetBtn.textContent;
            resetBtn.textContent = '✓ Reset!';
            
            setTimeout(() => {
                resetBtn.textContent = originalText;
            }, 1500);
        }
    }
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.action === 'getSettings') {
            sendResponse(currentSettings);
        }
    });
});