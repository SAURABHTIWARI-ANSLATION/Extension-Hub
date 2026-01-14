// utils/theme-manager.js - New file for theme management
class ThemeManager {
  constructor() {
    this.themes = {
      'indigo-night': {
        name: 'Indigo Night',
        colors: {
          bgGradientStart: '#1E1B4B',
          bgGradientEnd: '#312E81',
          headerBg: '#020617',
          primaryBtnStart: '#6366F1',
          primaryBtnEnd: '#4F46E5',
          accent: '#818CF8',
          textPrimary: '#FFFFFF',
          textSecondary: '#E0E7FF'
        },
        category: 'analytics'
      },
      'ocean-blue': {
        name: 'Ocean Blue',
        colors: {
          bgGradientStart: '#0A4DBF',
          bgGradientEnd: '#1E88E5',
          headerBg: '#0A3D91',
          primaryBtnStart: '#2196F3',
          primaryBtnEnd: '#42A5F5',
          accent: '#64B5F6',
          textPrimary: '#FFFFFF',
          textSecondary: '#CFE8FF'
        },
        category: 'developer'
      },
      'mint-teal': {
        name: 'Mint Teal',
        colors: {
          bgGradientStart: '#0F766E',
          bgGradientEnd: '#2DD4BF',
          headerBg: '#115E59',
          primaryBtnStart: '#14B8A6',
          primaryBtnEnd: '#2DD4BF',
          accent: '#5EEAD4',
          textPrimary: '#ECFEFF',
          textSecondary: '#FFFFFF'
        },
        category: 'health'
      }
    };
    
    this.currentTheme = 'indigo-night';
  }
  
  async init() {
    // Load saved theme preference
    const data = await chrome.storage.local.get(['themePreference']);
    if (data.themePreference && this.themes[data.themePreference]) {
      this.currentTheme = data.themePreference;
    }
    
    this.applyTheme(this.currentTheme);
  }
  
  applyTheme(themeName) {
    if (!this.themes[themeName]) return;
    
    const theme = this.themes[themeName];
    this.currentTheme = themeName;
    
    // Update CSS variables
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });
    
    // Update body class
    document.body.className = `theme-${themeName}`;
    
    // Save preference
    chrome.storage.local.set({ themePreference: themeName });
  }
  
  getAvailableThemes() {
    return Object.keys(this.themes);
  }
  
  getCurrentTheme() {
    return this.currentTheme;
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ThemeManager = ThemeManager;
}