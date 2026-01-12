/**
 * Theme Switcher Component
 * Optional UI component for allowing users to switch themes
 * Can be added to options page for theme selection
 */

class ThemeSwitcher {
  constructor(containerId = 'theme-switcher') {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    if (this.container) {
      this.init();
    }
  }

  /**
   * Initialize theme switcher
   */
  init() {
    if (!window.themeManager) {
      console.warn('ThemeManager not initialized');
      return;
    }
    
    this.render();
    this.attachListeners();
  }

  /**
   * Render theme switcher UI
   */
  render() {
    const themes = window.themeManager.getRecommendedThemes();
    const currentTheme = window.themeManager.currentTheme;

    const html = `
      <div class="theme-switcher-wrapper">
        <h3 class="theme-switcher-title">Theme Selection</h3>
        <p class="theme-switcher-description">Choose your preferred theme for the extension interface</p>
        
        <div class="theme-grid">
          ${themes.map(theme => `
            <div 
              class="theme-card ${currentTheme === theme.id ? 'active' : ''}"
              data-theme="${theme.id}"
              role="button"
              tabindex="0"
              aria-label="Select ${theme.name} theme"
            >
              <div class="theme-card-preview" style="background: linear-gradient(135deg, var(--bg-gradient-start), var(--bg-gradient-end))"></div>
              <div class="theme-card-content">
                <h4>${theme.name}</h4>
                <p>${theme.recommended}</p>
              </div>
              ${currentTheme === theme.id ? '<div class="theme-card-badge">✓ Active</div>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  /**
   * Attach event listeners
   */
  attachListeners() {
    const cards = this.container.querySelectorAll('.theme-card');
    
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const themeId = card.dataset.theme;
        this.selectTheme(themeId);
      });

      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          const themeId = card.dataset.theme;
          this.selectTheme(themeId);
        }
      });
    });
  }

  /**
   * Select a theme
   * @param {string} themeId - Theme identifier
   */
  selectTheme(themeId) {
    window.themeManager.applyTheme(themeId);
    this.render();
    this.attachListeners();

    // Dispatch custom event
    window.dispatchEvent(
      new CustomEvent('themeswitched', { detail: { theme: themeId } })
    );
  }
}

/**
 * CSS for Theme Switcher Component
 * Add this to your CSS file or style tag
 */
const themeSwitcherStyles = `
  .theme-switcher-wrapper {
    margin-bottom: var(--space-3xl);
  }

  .theme-switcher-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--label-color);
    margin-bottom: var(--space-sm);
  }

  .theme-switcher-description {
    font-size: var(--font-size-sm);
    color: var(--label-secondary);
    margin-bottom: var(--space-xl);
  }

  .theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--space-lg);
  }

  .theme-card {
    position: relative;
    border-radius: var(--border-radius);
    overflow: hidden;
    cursor: pointer;
    transition: all var(--transition-normal);
    border: 2px solid transparent;
    background: var(--surface-bg);
  }

  .theme-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: var(--accent-color);
  }

  .theme-card:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: 2px;
  }

  .theme-card.active {
    border-color: var(--btn-primary-start);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }

  .theme-card-preview {
    width: 100%;
    height: 80px;
    background: linear-gradient(135deg, #a78bfa, #8b5cf6);
  }

  .theme-card-content {
    padding: var(--space-md);
  }

  .theme-card-content h4 {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    color: var(--label-color);
    margin-bottom: 4px;
  }

  .theme-card-content p {
    font-size: var(--font-size-xs);
    color: var(--label-secondary);
  }

  .theme-card-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: var(--success-bg);
    color: var(--success-text);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
  }

  @media (max-width: 768px) {
    .theme-grid {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    }
  }
`;

// Inject styles when component is used
if (document.currentScript) {
  const style = document.createElement('style');
  style.textContent = themeSwitcherStyles;
  document.head.appendChild(style);
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('theme-switcher') && window.themeManager) {
    window.themeSwitcher = new ThemeSwitcher('theme-switcher');
  }
});
