// Grammar Check Pro - API Configuration
// This file manages API connections for enhanced grammar checking

const API_PROVIDERS = {
  LANGUAGETOOL: {
    name: 'LanguageTool',
    endpoint: 'https://api.languagetool.org/v2/check',
    free: true,
    description: 'Free, open-source grammar and spell checker'
  },
  LOCAL: {
    name: 'Local Rules',
    endpoint: null,
    free: true,
    description: 'Built-in grammar rules (no API required)'
  }
};

class GrammarAPI {
  constructor() {
    this.currentProvider = 'LOCAL';
    this.cache = new Map();
    this.cacheTimeout = 3600000; // 1 hour
    this.apiCallCount = 0;
    this.rateLimitPerDay = 20000; // LanguageTool free limit
  }

  /**
   * Check text using selected API
   * @param {string} text - Text to check
   * @param {object} options - Check options
   * @returns {Promise<object>} Check results
   */
  async checkText(text, options = {}) {
    const { provider = this.currentProvider, language = 'en_US' } = options;

    // Check cache first
    const cacheKey = this._generateCacheKey(text, provider);
    const cached = this._getFromCache(cacheKey);
    if (cached) {
      console.log('Using cached grammar check result');
      return cached;
    }

    try {
      let result;

      if (provider === 'LANGUAGETOOL') {
        result = await this._checkWithLanguageTool(text, language);
      } else {
        result = await this._checkWithLocalRules(text);
      }

      // Cache the result
      this._setInCache(cacheKey, result);
      this.apiCallCount++;

      return result;
    } catch (error) {
      console.error('Grammar check error:', error);
      return {
        success: false,
        error: error.message,
        errors: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check text using LanguageTool API
   * @private
   */
  async _checkWithLanguageTool(text, language = 'en') {
    const langCode = language === 'en_US' ? 'en-US' : language;

    const params = new URLSearchParams({
      text: text,
      language: langCode,
      enabledOnly: false
    });

    const response = await fetch(
      `${API_PROVIDERS.LANGUAGETOOL.endpoint}?${params}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
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
      ruleName: match.rule.description,
      position: match.offset,
      length: match.length,
      context: text.substring(Math.max(0, match.offset - 20), match.offset + match.length + 20),
      replacements: match.replacements.map(r => r.value)
    }));

    return {
      success: true,
      provider: 'LANGUAGETOOL',
      errors: errors,
      total: errors.length,
      timestamp: new Date().toISOString(),
      suggestions: this._generateSuggestions(errors)
    };
  }

  /**
   * Check text using local rules (fallback)
   * @private
   */
  async _checkWithLocalRules(text) {
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
    words.forEach((word, index) => {
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

    // Grammar rules
    const grammarRules = [
      {
        pattern: /\byour\s+[a-z]+ing\b/gi,
        message: 'Use "you are" instead of "your"',
        suggestion: 'Replace "your" with "you are"',
        type: 'grammar',
        ruleId: 'YOUR_YOURE'
      },
      {
        pattern: /\bcould of\b|\bwould of\b|\bshould of\b/gi,
        message: 'Use "could have", "would have", "should have"',
        suggestion: 'Replace "of" with "have"',
        type: 'grammar',
        ruleId: 'COULD_HAVE'
      },
      {
        pattern: /\bbetween you and I\b/gi,
        message: 'Should be "between you and me"',
        suggestion: 'Replace "I" with "me"',
        type: 'grammar',
        ruleId: 'BETWEEN_ME'
      }
    ];

    grammarRules.forEach(rule => {
      const matches = text.match(rule.pattern);
      if (matches) {
        matches.forEach(match => {
          const position = text.indexOf(match);
          errors.push({
            type: rule.type,
            message: rule.message,
            suggestion: rule.suggestion,
            ruleId: rule.ruleId,
            ruleName: rule.message,
            position: position,
            length: match.length,
            replacements: [rule.suggestion]
          });
        });
      }
    });

    return {
      success: true,
      provider: 'LOCAL',
      errors: errors,
      total: errors.length,
      timestamp: new Date().toISOString(),
      suggestions: this._generateSuggestions(errors)
    };
  }

  /**
   * Generate helpful suggestions based on errors
   * @private
   */
  _generateSuggestions(errors) {
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

      if (spellingCount > 0) {
        suggestions.push(`Pay attention to ${spellingCount} spelling issue${spellingCount > 1 ? 's' : ''}.`);
      }

      if (grammarCount > 0) {
        suggestions.push(`Review ${grammarCount} grammar rule${grammarCount > 1 ? 's' : ''}.`);
      }

      suggestions.push(
        'Read your text aloud to catch more errors.',
        'Take a break and proofread again later.'
      );
    }

    return suggestions;
  }

  /**
   * Set current API provider
   */
  setProvider(provider) {
    if (API_PROVIDERS[provider]) {
      this.currentProvider = provider;
      return true;
    }
    return false;
  }

  /**
   * Get available API providers
   */
  getProviders() {
    return API_PROVIDERS;
  }

  /**
   * Get API statistics
   */
  getStats() {
    return {
      provider: this.currentProvider,
      apiCallsToday: this.apiCallCount,
      remainingCalls: Math.max(0, this.rateLimitPerDay - this.apiCallCount),
      cacheSize: this.cache.size
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Cache helpers
   * @private
   */
  _generateCacheKey(text, provider) {
    const hash = this._simpleHash(text);
    return `${provider}_${hash}`;
  }

  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < this.cacheTimeout) {
        return cached.data;
      } else {
        this.cache.delete(key);
      }
    }
    return null;
  }

  _setInCache(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  _simpleHash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Export for use in background.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GrammarAPI, API_PROVIDERS };
}
