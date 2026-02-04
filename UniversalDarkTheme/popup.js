document.addEventListener('DOMContentLoaded', function() {
    const lightModeBtn = document.getElementById('lightModeBtn');
    const darkModeBtn = document.getElementById('darkModeBtn');
    const brightnessSlider = document.getElementById('brightnessSlider');
    const brightnessValue = document.getElementById('brightnessValue');
    const statusText = document.getElementById('statusText');

    // Load saved settings
    chrome.storage.local.get(['isDark', 'brightness'], function(result) {
        const isDark = result.isDark !== undefined ? result.isDark : false;
        const brightness = result.brightness !== undefined ? result.brightness : 100;
        
        updateUI(isDark, brightness);
    });

    // Light mode button
    lightModeBtn.addEventListener('click', function() {
        applyMode(false);
    });

    // Dark mode button
    darkModeBtn.addEventListener('click', function() {
        applyMode(true);
    });

    // Brightness slider
    brightnessSlider.addEventListener('input', function() {
        const brightness = parseInt(brightnessSlider.value);
        brightnessValue.textContent = brightness + '%';
        
        chrome.storage.local.get(['isDark'], function(result) {
            const isDark = result.isDark !== undefined ? result.isDark : false;
            saveAndApply(isDark, brightness);
        });
    });

    function applyMode(isDark) {
        const brightness = parseInt(brightnessSlider.value);
        updateUI(isDark, brightness);
        saveAndApply(isDark, brightness);
    }

    function updateUI(isDark, brightness) {
        brightnessSlider.value = brightness;
        brightnessValue.textContent = brightness + '%';
        
        if (isDark) {
            darkModeBtn.classList.add('active');
            lightModeBtn.classList.remove('active');
            statusText.textContent = 'Dark mode enabled';
        } else {
            lightModeBtn.classList.add('active');
            darkModeBtn.classList.remove('active');
            statusText.textContent = 'Light mode enabled';
        }
    }

    function saveAndApply(isDark, brightness) {
        chrome.storage.local.set({ isDark: isDark, brightness: brightness }, function() {
            console.log('Settings saved:', { isDark: isDark, brightness: brightness });
            
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { isDark: isDark, brightness: brightness }, function(response) {
                        if (chrome.runtime.lastError) {
                            console.log('Error sending message:', chrome.runtime.lastError.message);
                            chrome.scripting.executeScript({
                                target: { tabId: tabs[0].id },
                                files: ['content.js']
                            }, function() {
                                if (!chrome.runtime.lastError) {
                                    setTimeout(function() {
                                        chrome.tabs.sendMessage(tabs[0].id, { isDark: isDark, brightness: brightness });
                                    }, 100);
                                }
                            });
                        }
                    });
                }
            });
        });
    }
});