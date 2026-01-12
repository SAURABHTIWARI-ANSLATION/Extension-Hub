// Grammar Check Pro - Background Service Worker
console.log('Grammar Check Pro background service worker started');

// Import API configuration (inline since we can't use ES modules directly)
// API class will be defined inline below

// Storage for grammar data
let grammarDataCache = new Map();
let checkHistory = [];
let grammarAPI; // Will be initialized after class definition

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Grammar Check Pro installed');
  
  // Set default settings
  await chrome.storage.sync.set({
    autoCheck: true,
    spellCheck: true,
    grammarCheck: true,
    toneCheck: false,
    soundEffects: true,
    language: 'en_US',
    theme: 'light',
    enableContextMenu: true,
    enableKeyboardShortcut: true
  });
  
  // Create context menu
  createContextMenu();
  
  // Load history
  const result = await chrome.storage.local.get(['checkHistory']);
  if (result.checkHistory) {
    checkHistory = result.checkHistory;
  }
});

// Initialize API on service worker startup
async function initializeAPI() {
  // Load API preference from storage
  const result = await chrome.storage.sync.get(['apiProvider']);
  const preferredProvider = result.apiProvider || 'LOCAL';
  
  // Create API instance will be done after class definition
  // This function will be called at the end of this file
  console.log('API initialized with provider:', preferredProvider);
}

// Create context menu
function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'checkGrammar',
      title: 'Check Grammar with Grammar Check Pro',
      contexts: ['selection', 'editable'],
      visible: true
    });
    
    chrome.contextMenus.create({
      id: 'checkSpelling',
      title: 'Check Spelling',
      contexts: ['selection'],
      parentId: 'checkGrammar'
    });
    
    chrome.contextMenus.create({
      id: 'checkTone',
      title: 'Check Writing Tone',
      contexts: ['selection'],
      parentId: 'checkGrammar'
    });
  });
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('Context menu clicked:', info.menuItemId);
  
  if (!tab?.id) return;
  
  try {
    // Inject content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    // Get selected text
    const result = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_SELECTED_TEXT'
    });
    
    if (result?.text) {
      // Store in cache
      grammarDataCache.set('lastSelection', {
        text: result.text,
        timestamp: new Date().toISOString(),
        tabId: tab.id
      });
      
      // Open popup with the text
      chrome.action.openPopup();
      
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Grammar Check Pro',
        message: `Selected text ready for checking (${result.text.length} chars)`,
        priority: 1
      });
    }
  } catch (error) {
    console.error('Context menu error:', error);
  }
});

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received:', message.type);
  
  switch (message.type) {
    case 'PING':
      // Health check from content script
      sendResponse({ pong: true });
      return true;
      
    case 'GRAMMAR_DATA':
      handleGrammarData(message.data, sender.tab?.id);
      sendResponse({ success: true });
      return true;
      
    case 'GET_GRAMMAR_DATA':
      const data = grammarDataCache.get(sender.tab?.id);
      sendResponse(data || null);
      return true;
      
    case 'SAVE_TO_HISTORY':
      handleSaveToHistory(message.entry);
      sendResponse({ success: true });
      return true;
      
    case 'GET_HISTORY':
      sendResponse(checkHistory.slice(0, 50)); // Return last 50 entries
      return true;
      
    case 'CLEAR_HISTORY':
      checkHistory = [];
      chrome.storage.local.remove(['checkHistory']);
      sendResponse({ success: true });
      return true;
      
    case 'CHECK_SPELLING':
      handleSpellCheck(message.text, message.options || {}, sendResponse);
      return true;
      
    case 'CHECK_GRAMMAR':
      handleGrammarCheck(message.text, message.options || {}, sendResponse);
      return true;
      
    case 'CHECK_WITH_API':
      handleCheckWithAPI(message.text, message.options || {}, sendResponse);
      return true;
      
    case 'GET_API_PROVIDERS':
      sendResponse(getAPIProviders());
      return true;
      
    case 'SET_API_PROVIDER':
      setAPIProvider(message.provider, sendResponse);
      return true;
      
    case 'GET_API_STATS':
      sendResponse(getAPIStats());
      return true;
      
    case 'UPDATE_SETTINGS':
      handleUpdateSettings(message.settings, sendResponse);
      return true;
      
    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
      return false;
  }
});

function handleGrammarData(data, tabId) {
  if (!data || !tabId) return;
  
  // Add metadata
  data.cachedAt = new Date().toISOString();
  data.tabId = tabId;
  
  // Cache the data
  grammarDataCache.set(tabId, data);
  
  console.log('Grammar data cached:', {
    textLength: data.text?.length || 0,
    errorCount: data.errors?.length || 0
  });
  
  // Add to history
  if (data.errors?.length > 0 || data.suggestions?.length > 0) {
    const historyEntry = {
      text: data.text?.substring(0, 200) + (data.text?.length > 200 ? '...' : ''),
      errorCount: data.errors?.length || 0,
      suggestionCount: data.suggestions?.length || 0,
      timestamp: new Date().toISOString(),
      url: data.url || 'Popup',
      score: data.score || 100
    };
    
    checkHistory.unshift(historyEntry);
    
    // Keep only last 100 entries
    if (checkHistory.length > 100) {
      checkHistory = checkHistory.slice(0, 100);
    }
    
    // Save to storage
    chrome.storage.local.set({ checkHistory });
  }
  
  // Show notification if enabled
  chrome.storage.sync.get(['soundEffects'], (result) => {
    if (result.soundEffects && data.errors?.length > 0) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Grammar Check Pro',
        message: `Found ${data.errors.length} issues in your text`,
        priority: 1
      });
    }
  });
}

async function handleSaveToHistory(entry) {
  checkHistory.unshift(entry);
  
  // Keep only last 100 entries
  if (checkHistory.length > 100) {
    checkHistory = checkHistory.slice(0, 100);
  }
  
  await chrome.storage.local.set({ checkHistory });
}

async function handleSpellCheck(text, options = {}, sendResponse) {
  try {
    // In a real implementation, you would use a dictionary API or library
    // For now, simulate with common misspellings
    const commonMisspellings = {
      'recieve': 'receive',
      'seperate': 'separate',
      'definately': 'definitely',
      'occured': 'occurred',
      'wierd': 'weird',
      'acheive': 'achieve',
      'alot': 'a lot',
      'ammount': 'amount',
      'apparant': 'apparent',
      'begining': 'beginning',
      'beleive': 'believe',
      'calender': 'calendar',
      'cemetary': 'cemetery',
      'conscience': 'conscience',
      'dilemna': 'dilemma',
      'dissappoint': 'disappoint',
      'embarass': 'embarrass',
      'existance': 'existence',
      'firey': 'fiery',
      'foriegn': 'foreign',
      'guage': 'gauge',
      'harrass': 'harass',
      'heros': 'heroes',
      'independant': 'independent',
      'judgement': 'judgment',
      'knowledgeable': 'knowledgeable',
      'liaison': 'liaison',
      'millenium': 'millennium',
      'neccessary': 'necessary',
      'occassion': 'occasion',
      'occurrance': 'occurrence',
      'perserverance': 'perseverance',
      'posession': 'possession',
      'privelege': 'privilege',
      'publically': 'publicly',
      'reccomend': 'recommend',
      'refered': 'referred',
      'seige': 'siege',
      'speach': 'speech',
      'succesful': 'successful',
      'supersede': 'supersede',
      'thier': 'their',
      'truely': 'truly',
      'unforseen': 'unforeseen',
      'untill': 'until',
      'vaccuum': 'vacuum',
      'vegeterian': 'vegetarian',
      'withold': 'withhold',
      'writting': 'writing'
    };
    
    const errors = [];
    const words = text.split(/\b/);
    
    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      if (commonMisspellings[cleanWord]) {
        errors.push({
          type: 'spelling',
          word: word,
          correct: commonMisspellings[cleanWord],
          position: index,
          message: `Misspelled word: "${word}"`,
          suggestion: `Did you mean "${commonMisspellings[cleanWord]}"?`
        });
      }
    });
    
    sendResponse({
      errors: errors,
      total: errors.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Spell check error:', error);
    sendResponse({
      errors: [],
      total: 0,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function handleGrammarCheck(text, options = {}, sendResponse) {
  try {
    // Grammar rules (simplified)
    const grammarRules = [
      {
        pattern: /\byour\s+[a-z]+ing\b/gi,
        message: 'Consider using "you are" instead of "your"',
        suggestion: 'Replace "your" with "you are"',
        type: 'grammar'
      },
      {
        pattern: /\bcould of\b|\bwould of\b|\bshould of\b/gi,
        message: 'Use "could have", "would have", "should have"',
        suggestion: 'Replace "of" with "have"',
        type: 'grammar'
      },
      {
        pattern: /\bbetween you and I\b/gi,
        message: 'Should be "between you and me"',
        suggestion: 'Replace "I" with "me"',
        type: 'grammar'
      },
      {
        pattern: /\bwho\s+did\s+you\s+give\b/gi,
        message: 'Consider using "whom" instead of "who"',
        suggestion: 'Replace "who" with "whom"',
        type: 'grammar'
      },
      {
        pattern: /\bi\s+feel\s+badly\b/gi,
        message: 'Should be "I feel bad"',
        suggestion: 'Replace "badly" with "bad"',
        type: 'grammar'
      },
      {
        pattern: /\bless\s+[a-z]+\s+then\b/gi,
        message: 'Should be "less than"',
        suggestion: 'Replace "then" with "than"',
        type: 'grammar'
      },
      {
        pattern: /\bit's\s+[a-z]+\s+fault\b/gi,
        message: 'Should be "its" (possessive)',
        suggestion: 'Replace "it\'s" with "its"',
        type: 'grammar'
      },
      {
        pattern: /\bthey're\s+[a-z]+\s+book\b/gi,
        message: 'Should be "their" (possessive)',
        suggestion: 'Replace "they\'re" with "their"',
        type: 'grammar'
      },
      {
        pattern: /\byour\s+[a-z]+\s+welcome\b/gi,
        message: 'Should be "you\'re welcome"',
        suggestion: 'Replace "your" with "you\'re"',
        type: 'grammar'
      }
    ];
    
    const errors = [];
    
    grammarRules.forEach(rule => {
      const matches = text.match(rule.pattern);
      if (matches) {
        matches.forEach(match => {
          errors.push({
            type: rule.type,
            pattern: match,
            message: rule.message,
            suggestion: rule.suggestion,
            position: text.indexOf(match)
          });
        });
      }
    });
    
    // Check for passive voice (simplified)
    const passivePattern = /\b(am|are|is|was|were|be|been|being)\s+[a-z]+ed\b/gi;
    const passiveMatches = text.match(passivePattern);
    if (passiveMatches) {
      passiveMatches.forEach(match => {
        errors.push({
          type: 'style',
          pattern: match,
          message: 'Passive voice detected',
          suggestion: 'Consider using active voice for stronger writing',
          position: text.indexOf(match)
        });
      });
    }
    
    // Check for long sentences
    const sentences = text.split(/[.!?]+/);
    sentences.forEach((sentence, index) => {
      const wordCount = sentence.trim().split(/\s+/).length;
      if (wordCount > 30) {
        errors.push({
          type: 'style',
          pattern: sentence.substring(0, 50) + '...',
          message: 'Long sentence detected',
          suggestion: 'Consider breaking into shorter sentences',
          position: text.indexOf(sentence)
        });
      }
    });
    
    sendResponse({
      errors: errors,
      total: errors.length,
      timestamp: new Date().toISOString(),
      suggestions: generateSuggestions(errors)
    });
    
  } catch (error) {
    console.error('Grammar check error:', error);
    sendResponse({
      errors: [],
      total: 0,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function generateSuggestions(errors) {
  const suggestions = [];
  
  if (errors.length === 0) {
    suggestions.push(
      'Great writing! No issues detected.',
      'Consider varying sentence structure for better flow.',
      'Your tone is clear and professional.'
    );
  } else {
    const spellingCount = errors.filter(e => e.type === 'spelling').length;
    const grammarCount = errors.filter(e => e.type === 'grammar').length;
    const styleCount = errors.filter(e => e.type === 'style').length;
    
    if (spellingCount > 0) {
      suggestions.push(`Pay attention to ${spellingCount} spelling issue${spellingCount > 1 ? 's' : ''}.`);
    }
    
    if (grammarCount > 0) {
      suggestions.push(`Review ${grammarCount} grammar rule${grammarCount > 1 ? 's' : ''}.`);
    }
    
    if (styleCount > 0) {
      suggestions.push(`Consider improving ${styleCount} style element${styleCount > 1 ? 's' : ''}.`);
    }
    
    suggestions.push(
      'Read your text aloud to catch more errors.',
      'Take a break and proofread again later.',
      'Use shorter sentences for better readability.'
    );
  }
  
  return suggestions;
}

async function handleUpdateSettings(settings, sendResponse) {
  try {
    await chrome.storage.sync.set(settings);
    
    // Update context menu if needed
    if (settings.enableContextMenu !== undefined) {
      if (settings.enableContextMenu) {
        createContextMenu();
      } else {
        chrome.contextMenus.removeAll();
      }
    }
    
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Keyboard shortcut handler
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'check-text') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab?.id) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        const result = await chrome.tabs.sendMessage(tab.id, {
          type: 'GET_SELECTED_TEXT'
        });
        
        if (result?.text) {
          grammarDataCache.set('shortcutSelection', {
            text: result.text,
            timestamp: new Date().toISOString(),
            tabId: tab.id
          });
          
          chrome.action.openPopup();
        }
      } catch (error) {
        console.error('Keyboard shortcut error:', error);
      }
    }
  }
});

// Clear cache when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (grammarDataCache.has(tabId)) {
    grammarDataCache.delete(tabId);
    console.log(`Cleared grammar cache for closed tab ${tabId}`);
  }
});


// ============ API HANDLERS ============

/**
 * Handle check with API (LanguageTool or Local)
 */
async function handleCheckWithAPI(text, options = {}, sendResponse) {
  try {
    if (!text || text.trim().length === 0) {
      sendResponse({
        success: false,
        error: 'No text to check',
        errors: []
      });
      return;
    }

    // Get the selected provider from storage
    const result = await chrome.storage.sync.get(['apiProvider']);
    const provider = result.apiProvider || 'LOCAL';

    // Call appropriate checker based on provider
    let response;
    if (provider === 'LANGUAGETOOL') {
      response = await checkWithLanguageTool(text, options);
    } else {
      response = await checkWithLocalRules(text);
    }

    sendResponse(response);
  } catch (error) {
    console.error('API check error:', error);
    sendResponse({
      success: false,
      error: error.message,
      errors: []
    });
  }
}

/**
 * Check text using LanguageTool API
 */
async function checkWithLanguageTool(text, options = {}) {
  try {
    const language = options.language || 'en_US';
    const langCode = language === 'en_US' ? 'en-US' : language;

    const params = new URLSearchParams({
      text: text,
      language: langCode,
      enabledOnly: false
    });

    const response = await fetch(
      `https://api.languagetool.org/v2/check?${params}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform LanguageTool response to our format
    const errors = data.matches.map(match => ({
      type: match.rule.issueType || 'unknown',
      message: match.message,
      suggestion: match.replacements[0]?.value || '',
      ruleId: match.rule.id,
      ruleName: match.rule.description || match.rule.id,
      position: match.offset,
      length: match.length,
      context: text.substring(Math.max(0, match.offset - 20), Math.min(text.length, match.offset + match.length + 20)),
      replacements: match.replacements.map(r => r.value).slice(0, 3) // Top 3 suggestions
    }));

    console.log(`LanguageTool found ${errors.length} issues`);

    return {
      success: true,
      provider: 'LANGUAGETOOL',
      errors: errors,
      total: errors.length,
      timestamp: new Date().toISOString(),
      suggestions: generateAPIBasedSuggestions(errors)
    };
  } catch (error) {
    console.error('LanguageTool API error:', error);
    return {
      success: false,
      provider: 'LANGUAGETOOL',
      error: error.message,
      errors: [],
      fallbackToLocal: true
    };
  }
}

/**
 * Check text using local rules (fallback)
 */
async function checkWithLocalRules(text) {
  const commonMisspellings = {
    'recieve': 'receive',
    'seperate': 'separate',
    'definately': 'definitely',
    'occured': 'occurred',
    'wierd': 'weird',
    'acheive': 'achieve',
    'alot': 'a lot',
    'ammount': 'amount',
    'apparant': 'apparent',
    'begining': 'beginning',
    'beleive': 'believe',
    'calender': 'calendar',
    'cemetary': 'cemetery',
    'conscience': 'conscience',
    'dilemna': 'dilemma',
    'dissappoint': 'disappoint',
    'embarass': 'embarrass',
    'existance': 'existence',
    'firey': 'fiery',
    'foriegn': 'foreign',
    'guage': 'gauge',
    'harrass': 'harass',
    'heros': 'heroes',
    'independant': 'independent',
    'judgement': 'judgment',
    'knowledgeable': 'knowledgeable',
    'liaison': 'liaison',
    'millenium': 'millennium',
    'neccessary': 'necessary',
    'occassion': 'occasion',
    'occurrance': 'occurrence',
    'perserverance': 'perseverance',
    'posession': 'possession',
    'privelege': 'privilege',
    'publically': 'publicly',
    'reccomend': 'recommend',
    'refered': 'referred',
    'seige': 'siege',
    'speach': 'speech',
    'succesful': 'successful',
    'supersede': 'supersede',
    'thier': 'their',
    'truely': 'truly',
    'unforseen': 'unforeseen',
    'untill': 'until',
    'vaccuum': 'vacuum',
    'vegeterian': 'vegetarian',
    'withold': 'withhold',
    'writting': 'writing'
  };

  const errors = [];
  const words = text.split(/\b/);

  // Check spelling
  words.forEach((word) => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (commonMisspellings[cleanWord]) {
      const position = text.indexOf(word);
      errors.push({
        type: 'spelling',
        message: `Misspelled word: "${word}"`,
        suggestion: commonMisspellings[cleanWord],
        ruleId: 'MISSPELLING',
        ruleName: 'Spelling',
        position: position,
        length: word.length,
        replacements: [commonMisspellings[cleanWord]]
      });
    }
  });

  return {
    success: true,
    provider: 'LOCAL',
    errors: errors,
    total: errors.length,
    timestamp: new Date().toISOString(),
    suggestions: generateAPIBasedSuggestions(errors)
  };
}

/**
 * Generate suggestions based on API errors
 */
function generateAPIBasedSuggestions(errors) {
  const suggestions = [];

  if (errors.length === 0) {
    suggestions.push(
      'Great writing! No issues detected.',
      'Consider varying sentence structure for better flow.',
      'Your tone is clear and professional.'
    );
  } else {
    const spellingCount = errors.filter(e => e.type === 'spelling').length;
    const grammarCount = errors.filter(e => e.type === 'grammar').length;
    const styleCount = errors.filter(e => e.type === 'style').length;

    if (spellingCount > 0) {
      suggestions.push(`Fix ${spellingCount} spelling issue${spellingCount > 1 ? 's' : ''}.`);
    }

    if (grammarCount > 0) {
      suggestions.push(`Review ${grammarCount} grammar issue${grammarCount > 1 ? 's' : ''}.`);
    }

    if (styleCount > 0) {
      suggestions.push(`Consider ${styleCount} style improvement${styleCount > 1 ? 's' : ''}.`);
    }

    suggestions.push(
      'Read your text aloud to catch more errors.',
      'Take a break and proofread again later.'
    );
  }

  return suggestions;
}

/**
 * Get available API providers
 */
function getAPIProviders() {
  return {
    'LOCAL': {
      name: 'Local Rules',
      description: 'Built-in grammar rules (no internet required)',
      free: true
    },
    'LANGUAGETOOL': {
      name: 'LanguageTool',
      description: 'Free, open-source grammar and spell checker',
      free: true
    }
  };
}

/**
 * Set the current API provider
 */
async function setAPIProvider(provider, sendResponse) {
  try {
    const providers = getAPIProviders();
    if (providers[provider]) {
      await chrome.storage.sync.set({ apiProvider: provider });
      console.log('API provider set to:', provider);
      sendResponse({ success: true, provider: provider });
    } else {
      sendResponse({ success: false, error: 'Invalid provider' });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Get API statistics
 */
function getAPIStats() {
  return {
    providers: getAPIProviders(),
    status: 'ready',
    timestamp: new Date().toISOString()
  };
}

// Error handling
self.addEventListener('error', (error) => {
  console.error('Service worker error:', error.message, error.stack);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Initialize API and other components on startup
initializeAPI().catch(error => {
  console.error('Failed to initialize API:', error);
});

console.log('Grammar Check Pro background service worker ready');