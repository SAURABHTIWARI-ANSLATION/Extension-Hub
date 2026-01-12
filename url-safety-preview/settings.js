document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const elements = {
        autoCheckToggle: document.getElementById('autoCheckToggle'),
        checkShortenedToggle: document.getElementById('checkShortenedToggle'),
        warnHttpToggle: document.getElementById('warnHttpToggle'),
        saveHistoryToggle: document.getElementById('saveHistoryToggle'),
        clearOnExitToggle: document.getElementById('clearOnExitToggle'),
        telemetryToggle: document.getElementById('telemetryToggle'),
        manageBlockListBtn: document.getElementById('manageBlockListBtn'),
        resetSettingsBtn: document.getElementById('resetSettingsBtn'),
        clearAllDataBtn: document.getElementById('clearAllDataBtn'),
        saveBtn: document.getElementById('saveBtn'),
        cancelBtn: document.getElementById('cancelBtn')
    };

    // Current settings
    let currentSettings = {};

    // Initialize
    loadSettings();

    // Event Listeners
    elements.saveBtn.addEventListener('click', saveSettings);
    elements.cancelBtn.addEventListener('click', cancelChanges);
    elements.manageBlockListBtn.addEventListener('click', manageBlockList);
    elements.resetSettingsBtn.addEventListener('click', resetSettings);
    elements.clearAllDataBtn.addEventListener('click', clearAllData);

    // Functions
    function loadSettings() {
        chrome.storage.local.get({
            // Default settings
            autoCheck: true,
            checkShortened: true,
            warnHttp: true,
            saveHistory: true,
            clearOnExit: false,
            telemetry: false,
            blockedUrls: []
        }, function(settings) {
            currentSettings = settings;
            updateUI();
        });
    }

    function updateUI() {
        elements.autoCheckToggle.checked = currentSettings.autoCheck;
        elements.checkShortenedToggle.checked = currentSettings.checkShortened;
        elements.warnHttpToggle.checked = currentSettings.warnHttp;
        elements.saveHistoryToggle.checked = currentSettings.saveHistory;
        elements.clearOnExitToggle.checked = currentSettings.clearOnExit;
        elements.telemetryToggle.checked = currentSettings.telemetry;
    }

    function saveSettings() {
        const newSettings = {
            autoCheck: elements.autoCheckToggle.checked,
            checkShortened: elements.checkShortenedToggle.checked,
            warnHttp: elements.warnHttpToggle.checked,
            saveHistory: elements.saveHistoryToggle.checked,
            clearOnExit: elements.clearOnExitToggle.checked,
            telemetry: elements.telemetryToggle.checked
        };

        chrome.storage.local.set(newSettings, function() {
            currentSettings = newSettings;
            showNotification('Settings saved successfully');
            
            // Close settings page after 1 second
            setTimeout(() => {
                window.close();
            }, 1000);
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
        return (
            elements.autoCheckToggle.checked !== currentSettings.autoCheck ||
            elements.checkShortenedToggle.checked !== currentSettings.checkShortened ||
            elements.warnHttpToggle.checked !== currentSettings.warnHttp ||
            elements.saveHistoryToggle.checked !== currentSettings.saveHistory ||
            elements.clearOnExitToggle.checked !== currentSettings.clearOnExit ||
            elements.telemetryToggle.checked !== currentSettings.telemetry
        );
    }

    function manageBlockList() {
        chrome.tabs.create({
            url: chrome.runtime.getURL('block.html')
        });
    }

    function resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default values?')) {
            const defaultSettings = {
                autoCheck: true,
                checkShortened: true,
                warnHttp: true,
                saveHistory: true,
                clearOnExit: false,
                telemetry: false
            };

            chrome.storage.local.set(defaultSettings, function() {
                currentSettings = defaultSettings;
                updateUI();
                showNotification('Settings reset to defaults');
            });
        }
    }

    function clearAllData() {
        if (confirm('⚠️ WARNING: This will delete ALL extension data including history and block list. This cannot be undone. Are you sure?')) {
            chrome.storage.local.clear(function() {
                // Reload with default settings
                loadSettings();
                showNotification('All data cleared');
            });
        }
    }

    function showNotification(message) {
        // Create notification
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--theme-header-bg);
            color: var(--text-primary);
            padding: 12px 20px;
            border-radius: var(--border-radius-md);
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges()) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    });
});