document.addEventListener('DOMContentLoaded', () => {
    // Form elements
    const saveBtn = document.getElementById('saveBtn');
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    const statusMessage = document.getElementById('statusMessage');
    const keyboardSettingsLink = document.getElementById('keyboardSettingsLink');

    // Load saved settings
    loadSettings();

    // Save settings
    saveBtn.addEventListener('click', saveSettings);

    // Reset to defaults
    resetBtn.addEventListener('click', () => {
        if (confirm('Reset all settings to default values?')) {
            resetToDefaults();
        }
    });

    // Export settings
    exportBtn.addEventListener('click', exportSettings);

    // Import settings
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importSettings);

    // Open keyboard shortcuts page
    keyboardSettingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    });

    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'darkMode', 'serifFont', 'fontSize', 'lineHeight', 'themeColor',
                'removeImages', 'removeAds', 'removeSidebars', 'keepLinks',
                'autoEnable', 'contentSelectors', 'excludeDomains', 'autoDarkMode'
            ]);

            // Appearance
            document.getElementById('autoDarkMode').checked = result.autoDarkMode || false;
            document.getElementById('serifFont').checked = result.serifFont || false;
            document.getElementById('fontSize').value = result.fontSize || 'medium';
            document.getElementById('lineHeight').value = result.lineHeight || '1.6';
            document.getElementById('themeColor').value = result.themeColor || '#4285f4';

            // Content
            document.getElementById('removeImages').checked = result.removeImages || false;
            document.getElementById('removeAds').checked = result.removeAds || false;
            document.getElementById('removeSidebars').checked = result.removeSidebars || false;
            document.getElementById('keepLinks').checked = result.keepLinks !== false;

            // Advanced
            document.getElementById('autoEnable').checked = result.autoEnable || false;
            document.getElementById('contentSelectors').value = result.contentSelectors || 'article, .post-content, .story, #main-content';
            document.getElementById('excludeDomains').value = result.excludeDomains || '';

        } catch (error) {
            console.error('Error loading settings:', error);
            showStatus('Error loading settings', 'error');
        }
    }

    async function saveSettings() {
        try {
            const settings = {
                // Appearance
                autoDarkMode: document.getElementById('autoDarkMode').checked,
                serifFont: document.getElementById('serifFont').checked,
                fontSize: document.getElementById('fontSize').value,
                lineHeight: document.getElementById('lineHeight').value,
                themeColor: document.getElementById('themeColor').value,
                
                // Content
                removeImages: document.getElementById('removeImages').checked,
                removeAds: document.getElementById('removeAds').checked,
                removeSidebars: document.getElementById('removeSidebars').checked,
                keepLinks: document.getElementById('keepLinks').checked,
                
                // Advanced
                autoEnable: document.getElementById('autoEnable').checked,
                contentSelectors: document.getElementById('contentSelectors').value.trim(),
                excludeDomains: document.getElementById('excludeDomains').value.trim()
            };

            await chrome.storage.sync.set(settings);
            showStatus('Settings saved successfully!', 'success');
            
            // Notify content scripts about settings change
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { action: 'settingsUpdated' }).catch(() => {});
                });
            });

        } catch (error) {
            console.error('Error saving settings:', error);
            showStatus('Error saving settings', 'error');
        }
    }

    async function resetToDefaults() {
        try {
            const defaultSettings = {
                darkMode: false,
                serifFont: false,
                fontSize: 'medium',
                lineHeight: '1.6',
                themeColor: '#4285f4',
                removeImages: false,
                removeAds: true,
                removeSidebars: true,
                keepLinks: true,
                autoEnable: false,
                autoDarkMode: false,
                contentSelectors: 'article, .post-content, .story, #main-content',
                excludeDomains: ''
            };

            await chrome.storage.sync.set(defaultSettings);
            await loadSettings();
            showStatus('Settings reset to defaults', 'success');
            
        } catch (error) {
            console.error('Error resetting settings:', error);
            showStatus('Error resetting settings', 'error');
        }
    }

    async function exportSettings() {
        try {
            const settings = await chrome.storage.sync.get(null);
            const dataStr = JSON.stringify(settings, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = 'just-read-settings.json';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
            
            showStatus('Settings exported successfully', 'success');
            
        } catch (error) {
            console.error('Error exporting settings:', error);
            showStatus('Error exporting settings', 'error');
        }
    }

    async function importSettings(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const settings = JSON.parse(e.target.result);
                    await chrome.storage.sync.set(settings);
                    await loadSettings();
                    showStatus('Settings imported successfully', 'success');
                    
                    // Clear file input
                    importFile.value = '';
                    
                } catch (error) {
                    showStatus('Invalid settings file format', 'error');
                }
            };
            reader.readAsText(file);
            
        } catch (error) {
            console.error('Error importing settings:', error);
            showStatus('Error importing settings', 'error');
        }
    }

    function showStatus(message, type = 'info') {
        statusMessage.textContent = message;
        statusMessage.className = 'status ' + type;
        
        setTimeout(() => {
            statusMessage.textContent = '';
            statusMessage.className = 'status';
        }, 3000);
    }
});