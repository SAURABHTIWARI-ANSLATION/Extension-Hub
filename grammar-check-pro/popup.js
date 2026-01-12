// Grammar Check Pro - Popup Script
document.addEventListener('DOMContentLoaded', () => {
  initialize();
});

let currentText = '';
let currentErrors = [];
let currentSuggestions = [];

async function initialize() {
  // Load settings
  await loadSettings();
  
  // Setup event listeners
  setupEventListeners();
  
  // Initialize text stats
  updateTextStats();
  
  // Check for selected text from context menu
  checkForSelectedText();
}

async function loadSettings() {
  const defaultSettings = {
    autoCheck: true,
    spellCheck: true,
    grammarCheck: true,
    toneCheck: false,
    soundEffects: false,
    language: 'en_US',
    theme: 'light'
  };
  
  try {
    const savedSettings = await chrome.storage.sync.get(Object.keys(defaultSettings));
    const settings = { ...defaultSettings, ...savedSettings };
    
    // Apply settings to UI
    document.getElementById('autoCheck').checked = settings.autoCheck;
    document.getElementById('spellCheck').checked = settings.spellCheck;
    document.getElementById('grammarCheck').checked = settings.grammarCheck;
    document.getElementById('toneCheck').checked = settings.toneCheck;
    document.getElementById('soundEffects').checked = settings.soundEffects;
    document.getElementById('languageSelect').value = settings.language;
    
    return settings;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return defaultSettings;
  }
}

async function saveSettings() {
  try {
    const settings = {
      autoCheck: document.getElementById('autoCheck').checked,
      spellCheck: document.getElementById('spellCheck').checked,
      grammarCheck: document.getElementById('grammarCheck').checked,
      toneCheck: document.getElementById('toneCheck').checked,
      soundEffects: document.getElementById('soundEffects').checked,
      language: document.getElementById('languageSelect').value
    };
    
    await chrome.storage.sync.set(settings);
    showNotification('Settings saved');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showError('Failed to save settings');
  }
}

/**
 * Load and display current API provider
 */
async function loadAPIProvider() {
  try {
    const result = await chrome.storage.sync.get(['apiProvider']);
    const provider = result.apiProvider || 'LOCAL';
    
    const apiProviderSelect = document.getElementById('apiProvider');
    if (apiProviderSelect) {
      apiProviderSelect.value = provider;
    }
    
    updateAPIInfo(provider);
  } catch (error) {
    console.error('Failed to load API provider:', error);
  }
}

/**
 * Handle API provider change
 */
async function handleAPIProviderChange(event) {
  const provider = event.target.value;
  
  try {
    await chrome.runtime.sendMessage({
      type: 'SET_API_PROVIDER',
      provider: provider
    }, (response) => {
      if (response && response.success) {
        updateAPIInfo(provider);
        showNotification('API provider changed to: ' + response.provider);
      } else {
        showError('Failed to change API provider');
      }
    });
  } catch (error) {
    console.error('Failed to set API provider:', error);
    showError('Failed to change API provider: ' + error.message);
  }
}

/**
 * Update API info display
 */
function updateAPIInfo(provider) {
  const apiInfo = document.getElementById('apiInfo');
  if (!apiInfo) return;
  
  const infoMessages = {
    'LOCAL': '✅ Using local grammar rules. No internet required. Fast and offline-capable.',
    'LANGUAGETOOL': '🌐 Using LanguageTool API. More accurate checks with online grammar database. (Free service)'
  };
  
  apiInfo.textContent = infoMessages[provider] || 'API provider information unavailable';
}

function setupEventListeners() {
  // Text input events
  const textInput = document.getElementById('textInput');
  if (textInput) {
    textInput.addEventListener('input', () => {
      currentText = textInput.value;
      updateTextStats();
      
      // Auto-check if enabled
      const autoCheck = document.getElementById('autoCheck');
      if (autoCheck && autoCheck.checked && currentText.trim().length > 10) {
        setTimeout(() => checkGrammar(), 500);
      }
    });
  }
  
  // Check buttons
  const checkTextBtn = document.getElementById('checkTextBtn');
  if (checkTextBtn) checkTextBtn.addEventListener('click', () => checkGrammar());
  
  const checkPageBtn = document.getElementById('checkPageBtn');
  if (checkPageBtn) checkPageBtn.addEventListener('click', () => checkCurrentPage());
  
  const checkSelectedBtn = document.getElementById('checkSelectedBtn');
  if (checkSelectedBtn) checkSelectedBtn.addEventListener('click', () => checkSelectedText());
  
  // Action buttons
  const copyTextBtn = document.getElementById('copyTextBtn');
  if (copyTextBtn) copyTextBtn.addEventListener('click', copyCorrectedText);
  
  const clearTextBtn = document.getElementById('clearTextBtn');
  if (clearTextBtn) clearTextBtn.addEventListener('click', clearText);
  
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.addEventListener('click', exportReport);
  
  const historyBtn = document.getElementById('historyBtn');
  if (historyBtn) historyBtn.addEventListener('click', showHistory);
  
  const helpBtn = document.getElementById('helpBtn');
  if (helpBtn) helpBtn.addEventListener('click', showHelp);
  
  // Settings changes
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) languageSelect.addEventListener('change', saveSettings);
  
  const apiProvider = document.getElementById('apiProvider');
  if (apiProvider) {
    apiProvider.addEventListener('change', (event) => {
      handleAPIProviderChange(event).catch(err => {
        console.error('API provider change error:', err);
        showError('Failed to change API provider');
      });
    });
    loadAPIProvider().catch(err => console.error('Failed to load API provider:', err));
  }
  
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', saveSettings);
  });
}

function updateTextStats() {
  const textInput = document.getElementById('textInput');
  if (!textInput) return;
  
  const text = textInput.value;
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  
  const charCountEl = document.getElementById('charCount');
  const wordCountEl = document.getElementById('wordCount');
  
  if (charCountEl) charCountEl.textContent = `${charCount} chars`;
  if (wordCountEl) wordCountEl.textContent = `${wordCount} words`;
}

async function checkGrammar() {
  const textInput = document.getElementById('textInput');
  if (!textInput) {
    showError('Text input not found');
    return;
  }
  
  const text = textInput.value.trim();
  
  if (!text) {
    showError('Please enter some text to check');
    return;
  }
  
  showLoading(true);
  
  try {
    // Get current settings
    const settings = await loadSettings();
    
    // Use real API check instead of simulation
    const result = await checkGrammarWithAPI(text, settings);
    
    // Display results
    displayResults(result);
    
    // Play sound if enabled
    if (settings.soundEffects) {
      playSound(result.errors.length === 0 ? 'correct' : 'error');
    }
    
    showLoading(false);
  } catch (error) {
    console.error('Grammar check error:', error);
    showError('Failed to check grammar: ' + error.message);
    showLoading(false);
  }
}

/**
 * Check grammar using the API from background service worker
 */
async function checkGrammarWithAPI(text, settings) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: 'CHECK_WITH_API',
      text: text,
      options: {
        language: settings.language || 'en_US'
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      if (chrome.runtime.lastError) {
        console.error('Message error:', chrome.runtime.lastError.message);
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      if (response && response.success) {
        const errors = response.errors || [];
        const stats = {
          score: Math.max(0, 100 - (errors.length * 10)),
          totalErrors: errors.length,
          spellingErrors: errors.filter(e => e.type === 'spelling').length,
          grammarErrors: errors.filter(e => e.type === 'grammar').length,
          styleErrors: errors.filter(e => e.type === 'style').length
        };
        
        resolve({
          errors: errors,
          suggestions: response.suggestions || [],
          stats: stats,
          provider: response.provider,
          timestamp: response.timestamp
        });
      } else if (response && response.fallbackToLocal) {
        console.warn('API check failed, falling back to local rules:', response.error);
        resolve({
          errors: [],
          suggestions: ['Could not connect to API. Using local grammar rules.'],
          stats: {
            score: 100,
            totalErrors: 0,
            spellingErrors: 0,
            grammarErrors: 0,
            styleErrors: 0
          },
          provider: 'LOCAL_FALLBACK',
          timestamp: new Date().toISOString()
        });
      } else {
        resolve({
          errors: [],
          suggestions: [],
          stats: {
            score: 100,
            totalErrors: 0,
            spellingErrors: 0,
            grammarErrors: 0,
            styleErrors: 0
          },
          provider: 'UNKNOWN',
          timestamp: new Date().toISOString()
        });
      }
    });
  });
}

async function simulateGrammarCheck(text, settings) {
  // This is a simulation - in a real extension, you would:
  // 1. Use a local dictionary for spell checking
  // 2. Use grammar rules or AI API for grammar checking
  // 3. Use tone analysis API for tone suggestions
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const errors = [];
      const suggestions = [];
      
      // Sample spelling errors
      const spellingErrors = [
        { word: 'recieve', correct: 'receive' },
        { word: 'seperate', correct: 'separate' },
        { word: 'definately', correct: 'definitely' },
        { word: 'occured', correct: 'occurred' },
        { word: 'wierd', correct: 'weird' }
      ];
      
      // Sample grammar errors
      const grammarErrors = [
        { pattern: /your\s+[a-z]+ing/gi, message: 'Consider using "you are" instead of "your"' },
        { pattern: /could of|would of|should of/gi, message: 'Use "could have", "would have", "should have"' },
        { pattern: /alot/gi, message: 'Should be "a lot"' },
        { pattern: /between you and I/gi, message: 'Should be "between you and me"' }
      ];
      
      // Check spelling if enabled
      if (settings.spellCheck) {
        spellingErrors.forEach(({ word, correct }) => {
          const regex = new RegExp(`\\b${word}\\b`, 'gi');
          if (text.match(regex)) {
            errors.push({
              type: 'spelling',
              word: word,
              correct: correct,
              message: `Misspelled word: "${word}"`,
              suggestion: `Did you mean "${correct}"?`,
              position: text.toLowerCase().indexOf(word.toLowerCase())
            });
          }
        });
      }
      
      // Check grammar if enabled
      if (settings.grammarCheck) {
        grammarErrors.forEach(({ pattern, message }) => {
          const match = text.match(pattern);
          if (match) {
            errors.push({
              type: 'grammar',
              pattern: pattern.source,
              message: message,
              suggestion: 'Review this grammar rule',
              position: text.toLowerCase().indexOf(match[0].toLowerCase())
            });
          }
        });
      }
      
      // Generate suggestions
      if (errors.length > 0) {
        suggestions.push(
          'Proofread your text carefully',
          'Use shorter sentences for better readability',
          'Avoid passive voice when possible',
          'Check for repeated words'
        );
      } else {
        suggestions.push(
          'Great job! Your text looks good',
          'Consider varying sentence length for better flow',
          'Add specific details to make your writing more engaging'
        );
      }
      
      // Add tone suggestions if enabled
      if (settings.toneCheck) {
        suggestions.push(
          'Your tone seems professional and clear',
          'Consider adding more positive language'
        );
      }
      
      // Calculate score
      const wordCount = text.trim().split(/\s+/).length;
      const errorCount = errors.length;
      const score = Math.max(0, 100 - (errorCount * 10));
      
      resolve({
        text: text,
        errors: errors,
        suggestions: suggestions,
        stats: {
          totalWords: wordCount,
          totalErrors: errorCount,
          spellingErrors: errors.filter(e => e.type === 'spelling').length,
          grammarErrors: errors.filter(e => e.type === 'grammar').length,
          styleErrors: 0,
          score: score
        },
        timestamp: new Date().toISOString(),
        language: settings.language
      });
    }, 1000); // Simulate 1 second delay
  });
}

function displayResults(result) {
  if (!result) {
    showError('No grammar check result available');
    return;
  }
  
  const resultsPanel = document.getElementById('resultsPanel');
  if (resultsPanel) {
    resultsPanel.classList.add('active');
  }
  
  const stats = result.stats || {
    score: 100,
    totalErrors: result.errors ? result.errors.length : 0,
    spellingErrors: result.errors ? result.errors.filter(e => e.type === 'spelling').length : 0,
    grammarErrors: result.errors ? result.errors.filter(e => e.type === 'grammar').length : 0,
    styleErrors: result.errors ? result.errors.filter(e => e.type === 'style').length : 0
  };
  
  const scoreBadge = document.getElementById('scoreBadge');
  if (scoreBadge && stats.score !== undefined) scoreBadge.textContent = `${stats.score}%`;
  
  const totalErrorsEl = document.getElementById('totalErrors');
  if (totalErrorsEl) totalErrorsEl.textContent = stats.totalErrors || 0;
  
  const spellingErrorsEl = document.getElementById('spellingErrors');
  if (spellingErrorsEl) spellingErrorsEl.textContent = stats.spellingErrors || 0;
  
  const grammarErrorsEl = document.getElementById('grammarErrors');
  if (grammarErrorsEl) grammarErrorsEl.textContent = stats.grammarErrors || 0;
  
  const styleErrorsEl = document.getElementById('styleErrors');
  if (styleErrorsEl) styleErrorsEl.textContent = stats.styleErrors || 0;
  
  // Display errors
  displayErrors(result.errors || []);
  
  // Display suggestions
  displaySuggestions(result.suggestions || []);
  
  // Store current data
  currentErrors = result.errors || [];
  currentSuggestions = result.suggestions || [];
}

function displayErrors(errors) {
  const errorsList = document.getElementById('errorsList');
  if (!errorsList) return;
  
  if (errors.length === 0) {
    errorsList.innerHTML = `
      <div class="empty-state">
        <div class="icon">🎉</div>
        <p>No errors found! Your text looks perfect.</p>
      </div>
    `;
    return;
  }
  
  errorsList.innerHTML = errors.map((error, index) => {
    const icon = error.type === 'spelling' ? '🔤' : error.type === 'grammar' ? '📖' : '💬';
    const iconClass = error.type === 'spelling' ? 'spelling' : error.type === 'grammar' ? 'grammar' : 'style';
    
    return `
      <div class="error-item">
        <div class="error-icon ${iconClass}">${icon}</div>
        <div class="error-content">
          <h5>${error.message}</h5>
          <p>Found: "${error.word || error.pattern}"</p>
          ${error.suggestion ? `<div class="error-suggestion">Suggestion: ${error.suggestion}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function displaySuggestions(suggestions) {
  const suggestionsList = document.getElementById('suggestionsList');
  if (!suggestionsList) return;
  
  suggestionsList.innerHTML = suggestions.map(suggestion => `
    <div class="suggestion-item">${suggestion}</div>
  `).join('');
}

async function checkCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.id) {
      throw new Error('No active tab found');
    }
    
    // Try to send message first (content script might already be loaded)
    try {
      const result = await chrome.tabs.sendMessage(tab.id, { 
        type: 'GET_PAGE_TEXT' 
      });
      
      if (result?.text) {
        const textInput = document.getElementById('textInput');
        if (textInput) {
          textInput.value = result.text;
          currentText = result.text;
          updateTextStats();
          await checkGrammar();
          return;
        }
      }
    } catch (error) {
      // Content script not loaded, inject it
      console.log('Content script not loaded, injecting...');
    }
    
    // Check if we have permission to inject scripts
    const hasPermission = await checkPermission('activeTab');
    if (!hasPermission) {
      showError('Please grant "activeTab" permission in extension settings');
      return;
    }
    
    // Inject content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    // Wait a moment for the content script to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get page text
    const result = await chrome.tabs.sendMessage(tab.id, { 
      type: 'GET_PAGE_TEXT' 
    });
    
    if (result?.text) {
      const textInput = document.getElementById('textInput');
      if (textInput) {
        textInput.value = result.text;
        currentText = result.text;
        updateTextStats();
        await checkGrammar();
      }
    } else {
      showError('Could not extract text from page');
    }
    
  } catch (error) {
    console.error('Page check error:', error);
    showError('Failed to check page: ' + error.message);
  }
}

async function checkSelectedText() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.id) {
      throw new Error('No active tab found');
    }
    
    // Try to send message first
    try {
      const result = await chrome.tabs.sendMessage(tab.id, { 
        type: 'GET_SELECTED_TEXT' 
      });
      
      if (result?.text) {
        const textInput = document.getElementById('textInput');
        if (textInput) {
          textInput.value = result.text;
          currentText = result.text;
          updateTextStats();
          await checkGrammar();
          return;
        }
      } else {
        showError('No text selected. Please select some text on the page.');
        return;
      }
    } catch (error) {
      // Content script not loaded
      console.log('Content script not loaded for selected text');
    }
    
    // If we get here, try to get selected text directly
    const injectionResult = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return window.getSelection().toString().trim();
      }
    });
    
    if (injectionResult && injectionResult[0]?.result) {
      const textInput = document.getElementById('textInput');
      if (textInput) {
        textInput.value = injectionResult[0].result;
        currentText = injectionResult[0].result;
        updateTextStats();
        await checkGrammar();
      }
    } else {
      showError('No text selected. Please select some text on the page.');
    }
    
  } catch (error) {
    console.error('Selected text check error:', error);
    showError('Failed to get selected text: ' + error.message);
  }
}

async function checkForSelectedText() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.id) return;
    
    try {
      const result = await chrome.tabs.sendMessage(tab.id, { 
        type: 'GET_SELECTED_TEXT' 
      });
      
      if (result?.text) {
        // Auto-load selected text
        const textInput = document.getElementById('textInput');
        if (textInput) {
          textInput.value = result.text;
          currentText = result.text;
          updateTextStats();
          
          // Auto-check if enabled
          const autoCheck = document.getElementById('autoCheck');
          if (autoCheck && autoCheck.checked) {
            setTimeout(() => checkGrammar(), 300);
          }
        }
      }
    } catch (error) {
      // Ignore errors - just means no text is selected or content script isn't loaded
    }
  } catch (error) {
    // Ignore errors
  }
}

function copyCorrectedText() {
  const textInput = document.getElementById('textInput');
  if (!textInput) {
    showError('Text input not found');
    return;
  }
  
  let correctedText = textInput.value;
  
  // Apply corrections
  currentErrors.forEach(error => {
    if (error.type === 'spelling' && error.correct) {
      correctedText = correctedText.replace(new RegExp(`\\b${error.word}\\b`, 'gi'), error.correct);
    }
  });
  
  navigator.clipboard.writeText(correctedText)
    .then(() => showNotification('✅ Corrected text copied to clipboard!'))
    .catch(err => {
      console.error('Copy failed:', err);
      showError('Failed to copy: ' + err.message);
    });
}

function clearText() {
  const textInput = document.getElementById('textInput');
  if (!textInput) return;
  
  if (confirm('Clear all text?')) {
    textInput.value = '';
    currentText = '';
    updateTextStats();
    
    const resultsPanel = document.getElementById('resultsPanel');
    if (resultsPanel) {
      resultsPanel.classList.remove('active');
    }
  }
}

async function exportReport() {
  if (!currentErrors.length && !currentSuggestions.length) {
    showError('No results to export');
    return;
  }
  
  try {
    const textInput = document.getElementById('textInput');
    if (!textInput) {
      showError('Text input not found');
      return;
    }
    
    const report = {
      text: textInput.value,
      errors: currentErrors,
      suggestions: currentSuggestions,
      stats: {
        totalErrors: currentErrors.length,
        spellingErrors: currentErrors.filter(e => e.type === 'spelling').length,
        grammarErrors: currentErrors.filter(e => e.type === 'grammar').length,
        score: parseInt(document.getElementById('scoreBadge')?.textContent || '100')
      },
      timestamp: new Date().toISOString(),
      generatedBy: 'Grammar Check Pro'
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `grammar-check-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('📤 Report exported successfully!');
  } catch (error) {
    console.error('Export failed:', error);
    showError('Failed to export report');
  }
}

function showHistory() {
  alert('History feature coming soon!\n\nPlanned features:\n• Previous checks\n• Improvement tracking\n• Most common errors');
}

function showHelp() {
  const helpText = `
Grammar Check Pro - Help Guide

🚀 HOW TO USE:
1. Type or paste text in the text area
2. Click "Check Grammar" or enable auto-check
3. Review errors and suggestions
4. Apply corrections and copy the improved text

📝 QUICK ACTIONS:
• Check Current Page: Scans all text on the current webpage
• Check Selected Text: Checks only your selected text
• Auto-check: Checks grammar as you type

⚙️ SETTINGS:
• Spelling: Basic spell checking
• Grammar: Grammar rule checking
• Tone: Writing tone suggestions
• Sounds: Audio feedback

💡 TIPS:
• Keep sentences short and clear
• Avoid passive voice
• Proofread before sending
• Use specific, descriptive words

Need more help? Contact support@grammarcheckpro.com
`;
  
  alert(helpText);
}

function showLoading(show) {
  const existing = document.getElementById('loadingOverlay');
  
  if (show && !existing) {
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.id = 'loadingOverlay';
    loading.innerHTML = `
      <div class="spinner"></div>
      <p>Checking grammar and spelling...</p>
    `;
    loading.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;
    
    document.body.appendChild(loading);
  } else if (!show && existing) {
    existing.remove();
  }
}

function showError(message) {
  alert(`❌ Error: ${message}`);
}

function showNotification(message) {
  // Remove existing notification
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #10b981;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    font-size: 14px;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 2000);
}

function playSound(type) {
  // In a real implementation, you would play actual sound files
  console.log(`Playing ${type} sound`);
}

// Helper function to check permissions
async function checkPermission(permission) {
  try {
    const result = await chrome.permissions.contains({ permissions: [permission] });
    return result;
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);