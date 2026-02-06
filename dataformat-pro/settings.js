document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const elements = {
        // Formatting
        defaultFormat: document.getElementById('defaultFormat'),
        indentSize: document.getElementById('indentSize'),
        sortKeys: document.getElementById('sortKeys'),
        
        // Display
        syntaxHighlight: document.getElementById('syntaxHighlight'),
        lineNumbers: document.getElementById('lineNumbers'),
        themeOptions: document.querySelectorAll('.theme-option'),
        
        // Auto-format
        autoFormat: document.getElementById('autoFormat'),
        autoFormatPages: document.getElementById('autoFormatPages'),
        highlightPages: document.getElementById('highlightPages'),
        formatOnHover: document.getElementById('formatOnHover'),
        
        // Actions
        saveBtn: document.getElementById('saveBtn'),
        cancelBtn: document.getElementById('cancelBtn'),
        resetSettingsBtn: document.getElementById('resetSettingsBtn'),
        clearAllDataBtn: document.getElementById('clearAllDataBtn'),
        
        // Notification
        notification: document.getElementById('notification')
    };

    // Current settings
    let currentSettings = {};

    // Initialize
    loadSettings();

    // Event Listeners
    elements.saveBtn.addEventListener('click', saveSettings);
    elements.cancelBtn.addEventListener('click', cancelChanges);
    elements.resetSettingsBtn.addEventListener('click', resetSettings);
    elements.clearAllDataBtn.addEventListener('click', clearAllData);

    elements.themeOptions.forEach(option => {
        option.addEventListener('click', () => selectTheme(option.dataset.theme));
    });

    // Functions
    function loadSettings() {
        chrome.storage.local.get({
            // Default settings
            autoFormat: false,
            autoFormatPages: true,
            highlightPages: true,
            formatOnHover: true,
            defaultFormat: 'auto',
            indentSize: '4',
            sortKeys: true,
            syntaxHighlight: true,
            lineNumbers: true,
            theme: 'premium-light'
        }, function(data) {
            currentSettings = data;
            updateUI();
        });
    }

    function updateUI() {
        // Formatting
        elements.defaultFormat.value = currentSettings.defaultFormat;
        elements.indentSize.value = currentSettings.indentSize;
        elements.sortKeys.checked = currentSettings.sortKeys;
        
        // Display
        elements.syntaxHighlight.checked = currentSettings.syntaxHighlight;
        elements.lineNumbers.checked = currentSettings.lineNumbers;
        
        // Theme
        elements.themeOptions.forEach(option => {
            option.classList.toggle('selected', option.dataset.theme === currentSettings.theme);
        });
        
        // Auto-format
        elements.autoFormat.checked = currentSettings.autoFormat;
        elements.autoFormatPages.checked = currentSettings.autoFormatPages;
        elements.highlightPages.checked = currentSettings.highlightPages;
        elements.formatOnHover.checked = currentSettings.formatOnHover;
        
        // Apply theme to settings page
        document.body.className = `theme-${currentSettings.theme}`;
    }

    function selectTheme(theme) {
        elements.themeOptions.forEach(option => {
            option.classList.toggle('selected', option.dataset.theme === theme);
        });
        
        // Preview theme change
        document.body.className = `theme-${theme}`;
    }

    function saveSettings() {
        const newSettings = {
            autoFormat: elements.autoFormat.checked,
            autoFormatPages: elements.autoFormatPages.checked,
            highlightPages: elements.highlightPages.checked,
            formatOnHover: elements.formatOnHover.checked,
            defaultFormat: elements.defaultFormat.value,
            indentSize: elements.indentSize.value,
            sortKeys: elements.sortKeys.checked,
            syntaxHighlight: elements.syntaxHighlight.checked,
            lineNumbers: elements.lineNumbers.checked,
            theme: document.querySelector('.theme-option.selected').dataset.theme
        };

        chrome.storage.local.set(newSettings, function() {
            currentSettings = newSettings;
            showNotification('Settings saved successfully');
            
            // Apply theme to all pages
            applyThemeToAllPages(newSettings.theme);
            
            // Close settings page after 1 second
            setTimeout(() => {
                window.close();
            }, 1000);
        });
    }

    function applyThemeToAllPages(theme) {
        // Send theme change to all tabs
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'themeChanged',
                    theme: theme
                }).catch(() => {
                    // Tab might not have content script
                });
            });
        });
    }

    function cancelChanges() {
        if (hasUnsavedChanges()) {
            if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                window.close();
            }
        } else {
            window.close();
        }
    }

    function hasUnsavedChanges() {
        const selectedTheme = document.querySelector('.theme-option.selected').dataset.theme;
        
        return (
            elements.autoFormat.checked !== currentSettings.autoFormat ||
            elements.autoFormatPages.checked !== currentSettings.autoFormatPages ||
            elements.highlightPages.checked !== currentSettings.highlightPages ||
            elements.formatOnHover.checked !== currentSettings.formatOnHover ||
            elements.defaultFormat.value !== currentSettings.defaultFormat ||
            elements.indentSize.value !== currentSettings.indentSize ||
            elements.sortKeys.checked !== currentSettings.sortKeys ||
            elements.syntaxHighlight.checked !== currentSettings.syntaxHighlight ||
            elements.lineNumbers.checked !== currentSettings.lineNumbers ||
            selectedTheme !== currentSettings.theme
        );
    }

    function resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default values?')) {
            const defaultSettings = {
                autoFormat: false,
                autoFormatPages: true,
                highlightPages: true,
                formatOnHover: true,
                defaultFormat: 'auto',
                indentSize: '4',
                sortKeys: true,
                syntaxHighlight: true,
                lineNumbers: true,
                theme: 'premium-light'
            };

            chrome.storage.local.set(defaultSettings, function() {
                currentSettings = defaultSettings;
                updateUI();
                showNotification('Settings reset to defaults');
            });
        }
    }

    function clearAllData() {
        if (confirm('⚠️ WARNING: This will delete ALL extension data including settings and history. This cannot be undone. Are you sure?')) {
            chrome.storage.local.clear(function() {
                // Reload with default settings
                loadSettings();
                showNotification('All data cleared');
            });
        }
    }

    function showNotification(message) {
        const notification = elements.notification;
        notification.textContent = message;
        notification.classList.add('show');
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges()) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+S to save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveSettings();
        }
        // Escape to cancel
        else if (e.key === 'Escape') {
            cancelChanges();
        }
    });
});