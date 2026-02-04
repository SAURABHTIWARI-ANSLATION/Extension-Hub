document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggleBtn');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const serifToggle = document.getElementById('serifToggle');
    const fontSizeSelect = document.getElementById('fontSize');
    const optionsBtn = document.getElementById('optionsBtn');
    const keyboardBtn = document.getElementById('keyboardBtn');
    const btnText = toggleBtn.querySelector('.btn-text');
    const loadingSpinner = toggleBtn.querySelector('.loading-spinner');

    let isActive = false;

    // Load saved settings
    chrome.storage.sync.get(['darkMode', 'serifFont', 'fontSize', 'autoDarkMode'], (result) => {
        if (result.autoDarkMode !== undefined) {
            // If auto dark mode is on, grey out manual dark mode toggle
            darkModeToggle.disabled = result.autoDarkMode;
            if (result.autoDarkMode) {
                // Show system preference
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                darkModeToggle.checked = systemDark;
            } else if (result.darkMode !== undefined) {
                darkModeToggle.checked = result.darkMode;
            }
        } else if (result.darkMode !== undefined) {
            darkModeToggle.checked = result.darkMode;
        }
        
        if (result.serifFont !== undefined) serifToggle.checked = result.serifFont;
        if (result.fontSize) fontSizeSelect.value = result.fontSize;
    });

    // Check if reading mode is active on current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;
        chrome.storage.local.get(['activeTabs'], (result) => {
            isActive = result.activeTabs && result.activeTabs[tabId];
            updateUI(isActive);
        });
    });

    // Toggle reading mode
    toggleBtn.addEventListener('click', async () => {
        loadingSpinner.style.display = 'inline-block';
        btnText.style.opacity = '0.5';

        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const tabId = tabs[0].id;

            if (isActive) {
                // Disable reading mode
                await chrome.tabs.sendMessage(tabId, { action: 'disableReadingMode' });
                
                // Update storage
                chrome.storage.local.get(['activeTabs'], (result) => {
                    const activeTabs = result.activeTabs || {};
                    delete activeTabs[tabId];
                    chrome.storage.local.set({ activeTabs });
                });

                isActive = false;
            } else {
                // Enable reading mode
                await chrome.tabs.sendMessage(tabId, { action: 'enableReadingMode' });
                
                // Update storage
                chrome.storage.local.get(['activeTabs'], (result) => {
                    const activeTabs = result.activeTabs || {};
                    activeTabs[tabId] = true;
                    chrome.storage.local.set({ activeTabs });
                });

                isActive = true;
            }

            updateUI(isActive);
            
            // Close popup after short delay
            setTimeout(() => {
                window.close();
            }, 300);
        } catch (error) {
            console.error('Error toggling reading mode:', error);
            statusText.textContent = 'Error activating reading mode';
            statusDot.style.backgroundColor = '#f44336';
        } finally {
            loadingSpinner.style.display = 'none';
            btnText.style.opacity = '1';
        }
    });

    // Update UI based on state
    function updateUI(active) {
        if (active) {
            btnText.textContent = 'Disable Reading Mode';
            toggleBtn.classList.add('active');
            statusDot.style.backgroundColor = '#4CAF50';
            statusText.textContent = 'Reading mode is active';
        } else {
            btnText.textContent = 'Enable Reading Mode';
            toggleBtn.classList.remove('active');
            statusDot.style.backgroundColor = '#2196F3';
            statusText.textContent = 'Reading mode is available';
        }
    }

    // Save settings when changed
    darkModeToggle.addEventListener('change', async (e) => {
        await chrome.storage.sync.set({ darkMode: e.target.checked });
        // Notify active tabs to update
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { action: 'settingsUpdated' }).catch(() => {});
        });
    });

    serifToggle.addEventListener('change', async (e) => {
        await chrome.storage.sync.set({ serifFont: e.target.checked });
        // Notify active tabs to update
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { action: 'settingsUpdated' }).catch(() => {});
        });
    });

    fontSizeSelect.addEventListener('change', async (e) => {
        await chrome.storage.sync.set({ fontSize: e.target.value });
        // Notify active tabs to update
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { action: 'settingsUpdated' }).catch(() => {});
        });
    });

    // Open options page
    optionsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
        window.close();
    });

    // Show keyboard shortcuts
    keyboardBtn.addEventListener('click', () => {
        alert('Keyboard Shortcuts:\n\n• Ctrl+Shift+R (Cmd+Shift+R on Mac) - Toggle Reading Mode\n• Esc - Exit Reading Mode\n\nYou can customize these in Chrome settings.');
    });
});