document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup loaded');
    
    // Elements
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const textPreview = document.getElementById('text-preview');
    const textOutput = document.getElementById('text-output');
    const sourceInfo = document.getElementById('source-info');
    const textItems = document.getElementById('text-items');
    const manualText = document.getElementById('manual-text');
    
    // Buttons
    const modeTabs = document.querySelectorAll('.mode-tab');
    const scanBtn = document.getElementById('scan-btn');
    const getSelectionBtn = document.getElementById('get-selection-btn');
    const useTextBtn = document.getElementById('use-text-btn');
    const caseButtons = document.querySelectorAll('.case-btn');
    const applyBtn = document.getElementById('apply-btn');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    
    // State
    let currentText = '';
    let currentSource = '';
    let convertedText = '';
    let activeTabId = null;
    let activeTabUrl = '';
    let scannedTexts = [];
    
    // Update status
    function updateStatus(type, message) {
        console.log('Status:', type, '-', message);
        
        const colors = {
            idle: '#FBBF24',
            scanning: '#38BDF8',
            success: '#4ADE80',
            error: '#EF4444',
            listening: '#8B5CF6',
            warning: '#F59E0B'
        };
        
        statusIndicator.style.background = colors[type] || colors.idle;
        statusText.textContent = message;
        
        if (type === 'scanning') {
            statusIndicator.style.animation = 'pulse 1s infinite';
        } else {
            statusIndicator.style.animation = 'none';
        }
    }

    // Send message to content script with proper error handling
    async function sendToContentScript(tabId, message) {
        return new Promise((resolve) => {
            console.log('Sending to tab', tabId, ':', message.action);
            
            chrome.tabs.sendMessage(tabId, message, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error sending message:', chrome.runtime.lastError.message);
                    resolve({ 
                        success: false, 
                        error: chrome.runtime.lastError.message 
                    });
                } else {
                    console.log('Response received:', response);
                    resolve(response || { success: false });
                }
            });
        });
    }

    // Test connection to content script
    async function testConnection(tabId) {
        console.log('Testing connection to tab:', tabId);
        
        try {
            const response = await sendToContentScript(tabId, { action: "ping" });
            console.log('Ping response:', response);
            return response && response.alive === true;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    // Display text for conversion
    function displayTextForConversion(text, source = 'Manual input') {
        console.log('Displaying text for conversion:', text.substring(0, 50) + '...');
        
        currentText = text;
        currentSource = source;
        
        // Update preview
        const displayText = text.length > 300 ? text.substring(0, 300) + '...' : text;
        textPreview.textContent = displayText;
        
        // Update source info
        sourceInfo.textContent = `From: ${source} • ${text.length} characters`;
        
        // Enable apply button
        applyBtn.disabled = false;
        applyBtn.innerHTML = `<span class="btn-icon">✓</span> Apply to Original`;
        
        updateStatus('success', `Text ready (${text.length} chars)`);
        
        // Scroll to conversion area
        setTimeout(() => {
            document.querySelector('.conversion-area').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    }

    // Switch mode
    modeTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const mode = this.dataset.mode;
            
            // Update tabs
            modeTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update mode content
            document.querySelectorAll('.mode-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${mode}-mode`).classList.add('active');
            
            // Mode-specific setup
            if (mode === 'manual') {
                manualText.focus();
                updateStatus('idle', 'Type or paste text below');
            } else if (mode === 'selection') {
                updateStatus('listening', 'Select text on page, then click button');
            } else if (mode === 'scan') {
                updateStatus('idle', 'Click Scan to find all page text');
            }
        });
    });

    // SCAN PAGE - Main fix here!
    scanBtn.addEventListener('click', async function() {
        console.log('=== SCAN BUTTON CLICKED ===');
        updateStatus('scanning', 'Scanning page for text...');
        
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log('Active tab:', tab.id, tab.url);
            
            activeTabId = tab.id;
            activeTabUrl = tab.url;
            
            // Test connection first
            const isConnected = await testConnection(tab.id);
            console.log('Content script connected:', isConnected);
            
            if (!isConnected) {
                updateStatus('error', 'Cannot access page content. Try refreshing the page.');
                textItems.innerHTML = `
                    <div class="no-text">
                        <strong>Cannot access page content.</strong><br>
                        Try:<br>
                        1. Refresh the page<br>
                        2. Try Manual or Selection mode<br>
                        3. Or type text below
                    </div>
                `;
                return;
            }
            
            // Send scan request
            const response = await sendToContentScript(tab.id, { action: "scanPage" });
            console.log('Scan response:', response);
            
            if (response && response.success && response.data) {
                // Handle the response data
                if (response.data.items && response.data.items.length > 0) {
                    scannedTexts = response.data.items;
                    displayScanResults(scannedTexts);
                    updateStatus('success', `Found ${scannedTexts.length} text items`);
                    
                    // Auto-select first item
                    if (scannedTexts.length > 0) {
                        setTimeout(() => {
                            selectTextItem(0);
                        }, 200);
                    }
                } else if (response.data.text) {
                    // Single text item
                    scannedTexts = [response.data];
                    displayScanResults(scannedTexts);
                    updateStatus('success', `Found text (${response.data.text.length} chars)`);
                    
                    setTimeout(() => {
                        selectTextItem(0);
                    }, 200);
                } else {
                    updateStatus('warning', 'No text found on page');
                    textItems.innerHTML = '<div class="no-text">No text found on this page</div>';
                }
            } else {
                updateStatus('warning', 'Scan completed but no text found');
                textItems.innerHTML = '<div class="no-text">No text found on this page</div>';
            }
            
        } catch (error) {
            console.error('Scan error:', error);
            updateStatus('error', 'Scan failed: ' + error.message);
            textItems.innerHTML = `<div class="no-text">Error: ${error.message}</div>`;
        }
    });

    // Display scan results
    function displayScanResults(texts) {
        console.log('Displaying scan results:', texts.length, 'items');
        textItems.innerHTML = '';
        
        if (texts.length === 0) {
            textItems.innerHTML = '<div class="no-text">No text found</div>';
            return;
        }
        
        texts.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'text-item';
            div.dataset.index = index;
            
            const preview = item.text.length > 80 
                ? item.text.substring(0, 80) + '...' 
                : item.text;
            
            div.innerHTML = `
                <div class="preview">${preview}</div>
                <div class="source">${item.source} • ${item.text.length} chars</div>
            `;
            
            div.addEventListener('click', () => selectTextItem(index));
            textItems.appendChild(div);
        });
    }

    // Select text item from scan results
    function selectTextItem(index) {
        console.log('Selecting text item', index);
        
        // Update UI
        document.querySelectorAll('.text-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const itemElement = document.querySelector(`.text-item[data-index="${index}"]`);
        if (itemElement) {
            itemElement.classList.add('active');
        }
        
        // Display for conversion
        const item = scannedTexts[index];
        if (item) {
            displayTextForConversion(item.text, item.source);
        }
    }

    // GET SELECTED TEXT
    getSelectionBtn.addEventListener('click', async function() {
        console.log('=== GET SELECTION BUTTON CLICKED ===');
        updateStatus('scanning', 'Getting selected text...');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            activeTabId = tab.id;
            
            const response = await sendToContentScript(tab.id, { 
                action: "getCurrentSelection" 
            });
            
            console.log('Selection response:', response);
            
            if (response && response.success && response.text) {
                displayTextForConversion(response.text, response.source || 'Selected Text');
                updateStatus('success', `Selected text loaded (${response.text.length} chars)`);
            } else {
                updateStatus('error', 'No text selected on page');
                alert('Please select some text on the page first, then click this button.');
            }
        } catch (error) {
            console.error('Selection error:', error);
            updateStatus('error', 'Failed to get selection');
            alert('Error: ' + error.message);
        }
    });

    // USE MANUAL TEXT
    useTextBtn.addEventListener('click', function() {
        const text = manualText.value.trim();
        if (!text) {
            updateStatus('error', 'Please enter some text');
            manualText.focus();
            return;
        }
        
        displayTextForConversion(text, 'Manual Input');
    });

    // Listen for auto-selection from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Popup received message:', request.action);
        
        if (request.action === "textSelected") {
            // Switch to selection mode if not already
            const selectionTab = document.querySelector('.mode-tab[data-mode="selection"]');
            if (!selectionTab.classList.contains('active')) {
                selectionTab.click();
            }
            
            // Display the selected text
            displayTextForConversion(request.text, request.source || 'Auto-detected');
            updateStatus('success', `Auto-detected selection (${request.text.length} chars)`);
        }
        
        return true;
    });

    // CASE CONVERSION FUNCTIONS
    const caseConverters = {
        upper: (text) => text.toUpperCase(),
        lower: (text) => text.toLowerCase(),
        title: (text) => text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
        sentence: (text) => {
            return text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, match => match.toUpperCase());
        },
        camel: (text) => text.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
            index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, ''),
        pascal: (text) => text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase()).replace(/\s+/g, ''),
        snake: (text) => text.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, ''),
        kebab: (text) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
    };

    // Case button handlers
    caseButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!currentText) {
                updateStatus('error', 'No text to convert');
                return;
            }

            const caseType = this.dataset.case;
            convertedText = caseConverters[caseType](currentText);
            
            // Display converted text
            const displayText = convertedText.length > 500 
                ? convertedText.substring(0, 500) + '...' 
                : convertedText;
            textOutput.textContent = displayText;
            
            // Highlight active button
            caseButtons.forEach(btn => {
                btn.style.opacity = '0.7';
                btn.style.background = '';
            });
            this.style.opacity = '1';
            this.style.background = 'var(--primary-btn-end)';
            
            updateStatus('success', `Converted to ${this.textContent}`);
            
            // Enable apply button
            applyBtn.disabled = false;
        });
    });

    // APPLY CONVERTED TEXT
    applyBtn.addEventListener('click', async function() {
        if (!convertedText) {
            updateStatus('error', 'Nothing to apply - convert text first');
            return;
        }
        
        if (!activeTabId) {
            updateStatus('error', 'No active page to apply to');
            return;
        }
        
        updateStatus('scanning', 'Applying changes to page...');
        
        try {
            const response = await sendToContentScript(activeTabId, {
                action: "applyText",
                text: convertedText
            });
            
            console.log('Apply response:', response);
            
            if (response && response.success) {
                updateStatus('success', '✓ Text applied successfully!');
                
                // Update current text to converted text
                currentText = convertedText;
                textPreview.textContent = convertedText.length > 300 
                    ? convertedText.substring(0, 300) + '...' 
                    : convertedText;
                
                // Show success message
                textOutput.innerHTML = `
                    <div style="color: #4ADE80; padding: 10px; background: rgba(74, 222, 128, 0.2); border-radius: 6px;">
                        ✓ Successfully applied to page!<br>
                        <small>The text has been updated on the original page.</small>
                    </div>
                `;
            } else {
                updateStatus('warning', 'Could not auto-apply to page');
                textOutput.innerHTML = `
                    <div style="color: #FBBF24; padding: 10px; background: rgba(251, 191, 36, 0.2); border-radius: 6px;">
                        ⚠️ Could not auto-apply.<br>
                        <small>Use Copy button below, then paste manually.</small>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Apply error:', error);
            updateStatus('error', 'Failed to apply: ' + error.message);
            textOutput.innerHTML = `
                <div style="color: #EF4444; padding: 10px; background: rgba(239, 68, 68, 0.2); border-radius: 6px;">
                    ❌ Error applying changes.<br>
                    <small>Use Copy button instead.</small>
                </div>
            `;
        }
    });

    // COPY TO CLIPBOARD
    copyBtn.addEventListener('click', function() {
        const textToCopy = convertedText || currentText;
        if (!textToCopy) {
            updateStatus('error', 'No text to copy');
            return;
        }
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            // Visual feedback
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span class="btn-icon">✓</span> Copied!';
            copyBtn.style.background = '#4ADE80';
            
            updateStatus('success', '✓ Copied to clipboard!');
            
            // Show success in output
            textOutput.innerHTML = `
                <div style="color: #4ADE80; padding: 10px; background: rgba(74, 222, 128, 0.2); border-radius: 6px;">
                    ✓ Copied to clipboard!<br>
                    <small>Paste with Ctrl+V anywhere.</small>
                </div>
            `;
            
            // Reset button after 2 seconds
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.style.background = '';
            }, 2000);
        }).catch(err => {
            updateStatus('error', 'Copy failed: ' + err.message);
            console.error('Copy error:', err);
        });
    });

    // CLEAR ALL
    clearBtn.addEventListener('click', function() {
        currentText = '';
        convertedText = '';
        currentSource = '';
        scannedTexts = [];
        
        textPreview.textContent = 'No text selected. Choose a mode above.';
        textOutput.textContent = 'Converted text will appear here...';
        sourceInfo.textContent = '';
        textItems.innerHTML = '<div class="no-text">No text found yet. Click Scan above.</div>';
        manualText.value = '';
        
        // Reset case buttons
        caseButtons.forEach(btn => {
            btn.style.opacity = '1';
            btn.style.background = '';
        });
        
        // Disable apply button
        applyBtn.disabled = true;
        
        updateStatus('idle', 'Cleared all. Ready for new text.');
    });

    // Initialize
    updateStatus('idle', 'Choose a mode to begin');
    
    // Auto-focus manual text
    setTimeout(() => {
        if (manualText) {
            manualText.focus();
            // Add sample text for testing
            if (!manualText.value) {
                manualText.value = "Try converting this sample text. Select UPPERCASE, lowercase, or other options above!";
            }
        }
    }, 300);
    
    // Add keyboard shortcut for manual text (Ctrl+Enter to use)
    if (manualText) {
        manualText.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                useTextBtn.click();
            }
        });
    }
    
    console.log('Popup initialized successfully');
});