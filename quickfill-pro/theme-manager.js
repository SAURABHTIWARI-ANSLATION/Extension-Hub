/**
 * Theme Manager for QuickFill Pro
 * Manages theme selection, persistence, and application across UI
 */

class ThemeManager {
  constructor() {
    this.currentTheme = 'ocean-blue';
    this.themes = {};
    this.storageKey = 'quickfill-theme';
    this.initialize();
  }

  /**
   * Initialize theme manager
   */
  async initialize() {
    await this.loadThemes();
    await this.loadSavedTheme();
    this.applyTheme(this.currentTheme);
    this.setupThemeListeners();
  }

  /**
   * Load theme definitions from themes.json
   */
  async loadThemes() {
    try {
      const response = await fetch(chrome.runtime.getURL('themes.json'));
      const data = await response.json();
      this.themes = data.themes;
    } catch (error) {
      console.error('Failed to load themes:', error);
    }
  }

  /**
   * Load saved theme from storage
   */
  async loadSavedTheme() {
    try {
      const result = await chrome.storage.sync.get([this.storageKey]);
      if (result[this.storageKey]) {
        this.currentTheme = result[this.storageKey];
      }
    } catch (error) {
      console.warn('Failed to load saved theme:', error);
    }
  }

  /**
   * Apply theme to document
   * @param {string} themeName - Theme identifier
   */
  applyTheme(themeName) {
    if (!this.themes[themeName]) {
      console.warn(`Theme ${themeName} not found, using default`);
      themeName = 'ocean-blue';
    }

    // Set data attribute on html element
    document.documentElement.setAttribute('data-theme', themeName);
    document.body.setAttribute('data-theme', themeName);

    this.currentTheme = themeName;

    // Dispatch custom event for other listeners
    window.dispatchEvent(
      new CustomEvent('themechanged', { detail: { theme: themeName } })
    );

    // Save to storage
    this.saveTheme(themeName);
  }

  /**
   * Save theme preference to storage
   * @param {string} themeName - Theme identifier
   */
  async saveTheme(themeName) {
    try {
      await chrome.storage.sync.set({
        [this.storageKey]: themeName
      });
    } catch (error) {
      console.warn('Failed to save theme:', error);
    }
  }

  /**
   * Get current theme details
   * @returns {Object} Current theme configuration
   */
  getCurrentTheme() {
    return this.themes[this.currentTheme];
  }

  /**
   * Get all available themes
   * @returns {Object} All themes
   */
  getAllThemes() {
    return this.themes;
  }

  /**
   * Get theme by category
   * @param {string} category - Category name
   * @returns {string} Theme name
   */
  getThemeByCategory(category) {
    const mapping = {
      'general-utility': 'ocean-blue',
      'productivity': 'ocean-blue',
      'developer-tools': 'ocean-blue',
      'security': 'indigo-night',
      'finance': 'indigo-night',
      'health': 'mint-teal',
      'tracker': 'mint-teal',
      'education': 'sky-gradient',
      'beginner-friendly': 'sky-gradient',
      'creative': 'violet-glow',
      'design': 'violet-glow'
    };
    return mapping[category] || 'ocean-blue';
  }

  /**
   * Setup theme change listeners
   */
  setupThemeListeners() {
    // Listen for system preference changes (dark mode)
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addEventListener('change', (e) => {
        // Optional: Switch to darker theme based on system preference
        // This is commented out to allow manual theme selection
        // if (e.matches) {
        //   this.applyTheme('indigo-night');
        // } else {
        //   this.applyTheme('ocean-blue');
        // }
      });
    }
  }

  /**
   * Get CSS variable value
   * @param {string} variableName - CSS variable name
   * @returns {string} CSS variable value
   */
  getCSSVariable(variableName) {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  }

  /**
   * Get contrast ratio between two colors
   * Used for accessibility validation
   * @param {string} color1 - First color (hex)
   * @param {string} color2 - Second color (hex)
   * @returns {number} Contrast ratio
   */
  getContrastRatio(color1, color2) {
    const getLuminance = (hex) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Validate theme accessibility
   * @param {string} themeName - Theme to validate
   * @returns {Object} Accessibility report
   */
  validateAccessibility(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return null;

    const colors = theme.colors;
    const report = {
      theme: themeName,
      passed: true,
      issues: []
    };

    // Check primary text contrast
    const textContrast = this.getContrastRatio(
      colors['text-primary'],
      colors['header-bg']
    );
    if (textContrast < 4.5) {
      report.passed = false;
      report.issues.push({
        element: 'header text',
        contrast: textContrast.toFixed(2),
        requirement: '4.5:1 (WCAG AA)'
      });
    }

    // Check button text contrast
    const buttonContrast = this.getContrastRatio(
      colors['btn-primary-text'],
      colors['primary-button-start']
    );
    if (buttonContrast < 4.5) {
      report.passed = false;
      report.issues.push({
        element: 'button text',
        contrast: buttonContrast.toFixed(2),
        requirement: '4.5:1 (WCAG AA)'
      });
    }

    return report;
  }

  /**
   * Export theme configuration
   * @param {string} themeName - Theme to export
   * @returns {string} JSON string
   */
  exportTheme(themeName) {
    return JSON.stringify(this.themes[themeName], null, 2);
  }

  /**
   * Get theme by popularity (used for recommendations)
   * @returns {Array} Themes sorted by use case
   */
  getRecommendedThemes() {
    return [
      {
        name: this.themes['ocean-blue'].name,
        id: 'ocean-blue',
        recommended: 'Default for most extensions'
      },
      {
        name: this.themes['indigo-night'].name,
        id: 'indigo-night',
        recommended: 'Security & data tools'
      },
      {
        name: this.themes['mint-teal'].name,
        id: 'mint-teal',
        recommended: 'Health & wellness tools'
      },
      {
        name: this.themes['sky-gradient'].name,
        id: 'sky-gradient',
        recommended: 'Education & beginners'
      },
      {
        name: this.themes['violet-glow'].name,
        id: 'violet-glow',
        recommended: 'Creative tools'
      }
    ];
  }
}

// Initialize theme manager when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
  });
} else {
  window.themeManager = new ThemeManager();
}
