class DesignTokenExtractor {
  constructor() {
    this.tokens = {
      colors: [],
      typography: [],
      spacing: [],
      shadows: [],
      borderRadius: [],
      breakpoints: []
    };
  }

  extractAll() {
    try {
      return {
        colors: this.extractColors(),
        typography: this.extractTypography(),
        spacing: this.extractSpacing(),
        shadows: this.extractShadows(),
        borderRadius: this.extractBorderRadius(),
        breakpoints: this.extractBreakpoints()
      };
    } catch (error) {
      console.error('Error extracting tokens:', error);
      return this.tokens;
    }
  }

  extractColors() {
    const colors = new Set();
    
    try {
      // Method 1: Scan stylesheets
      for (const styleSheet of document.styleSheets) {
        try {
          for (const rule of styleSheet.cssRules || []) {
            if (rule.style) {
              // Check CSS properties that contain colors
              const colorProperties = [
                'color', 'background-color', 'border-color',
                'border-top-color', 'border-right-color', 
                'border-bottom-color', 'border-left-color',
                'outline-color', 'text-decoration-color',
                'fill', 'stroke', 'background'
              ];
              
              for (const prop of colorProperties) {
                const value = rule.style[prop];
                if (value && this.isValidColor(value)) {
                  colors.add(value.trim());
                }
              }
              
              // Also scan cssText for any color patterns
              const cssText = rule.style.cssText || '';
              const colorMatches = cssText.match(/#[0-9a-f]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)/gi);
              if (colorMatches) {
                colorMatches.forEach(color => {
                  if (this.isValidColor(color)) colors.add(color.trim());
                });
              }
            }
          }
        } catch (e) {
          // Skip cross-origin stylesheets
          continue;
        }
      }

      // Method 2: Scan computed styles from sample elements
      const sampleElements = document.querySelectorAll('body, div, span, p, h1, h2, h3, h4, h5, h6, a, button, input, section, header, footer, nav, main, article');
      const maxElements = Math.min(sampleElements.length, 100); // Limit for performance
      
      for (let i = 0; i < maxElements; i++) {
        try {
          const element = sampleElements[i];
          const computedStyle = window.getComputedStyle(element);
          
          const colorProperties = ['color', 'backgroundColor', 'borderColor'];
          for (const prop of colorProperties) {
            const value = computedStyle[prop];
            if (value && this.isValidColor(value)) {
              colors.add(value.trim());
            }
          }
        } catch (e) {
          continue;
        }
      }
    } catch (error) {
      console.warn('Color extraction partial error:', error);
    }

    // Convert to array with usage estimation
    const colorArray = Array.from(colors)
      .filter(color => color && this.isValidColor(color))
      .slice(0, 50) // Limit to 50 colors
      .map(color => ({
        value: color,
        usage: this.estimateColorUsage(color)
      }));

    return colorArray.sort((a, b) => a.value.localeCompare(b.value));
  }

  extractTypography() {
    const typography = [];
    const seen = new Set();
    
    try {
      // Sample key text elements
      const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, .heading, .title, .subtitle, .text, .caption, .label');
      const maxElements = Math.min(textElements.length, 50);
      
      for (let i = 0; i < maxElements; i++) {
        try {
          const el = textElements[i];
          // Only process elements with meaningful text
          if (el.textContent && el.textContent.trim().length > 5) {
            const computed = window.getComputedStyle(el);
            const fontSize = computed.fontSize;
            const fontWeight = computed.fontWeight || '400';
            const fontFamily = computed.fontFamily.split(',')[0].replace(/["']/g, '').trim();
            const lineHeight = computed.lineHeight;
            
            if (!fontFamily || fontFamily === 'initial' || fontFamily === 'inherit') continue;
            
            const key = `${fontFamily}-${fontSize}-${fontWeight}`;
            
            if (!seen.has(key)) {
              seen.add(key);
              typography.push({
                family: fontFamily,
                size: fontSize,
                weight: fontWeight,
                lineHeight: lineHeight,
                element: el.tagName.toLowerCase(),
                sampleText: el.textContent.trim().substring(0, 50) + '...'
              });
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      // If we didn't get enough samples, check body and main containers
      if (typography.length < 5) {
        const body = document.body;
        if (body) {
          const computed = window.getComputedStyle(body);
          typography.push({
            family: computed.fontFamily.split(',')[0].replace(/["']/g, '').trim(),
            size: computed.fontSize,
            weight: computed.fontWeight || '400',
            lineHeight: computed.lineHeight,
            element: 'body',
            sampleText: 'Body text sample'
          });
        }
      }
    } catch (error) {
      console.warn('Typography extraction partial error:', error);
    }
    
    return typography.sort((a, b) => parseFloat(b.size) - parseFloat(a.size)).slice(0, 20);
  }

  extractSpacing() {
    const spacing = new Set();
    
    try {
      // Sample layout elements
      const layoutElements = document.querySelectorAll('.container, .wrapper, .grid, .flex, .box, .card, .section, .padding, .margin, .gap');
      const sampleElements = layoutElements.length > 0 ? 
        layoutElements : 
        document.querySelectorAll('div, section, article, main, header, footer');
      
      const maxElements = Math.min(sampleElements.length, 50);
      
      for (let i = 0; i < maxElements; i++) {
        try {
          const el = sampleElements[i];
          const computed = window.getComputedStyle(el);
          
          // Check spacing properties
          const spacingProps = ['margin', 'padding', 'gap', 'rowGap', 'columnGap'];
          for (const prop of spacingProps) {
            const value = computed[prop];
            if (value && value !== '0px' && value !== 'normal' && !value.includes('auto')) {
              // Split compound values like "10px 20px"
              value.split(' ').forEach(val => {
                if (val && val !== '0px' && !isNaN(parseFloat(val))) {
                  spacing.add(val);
                }
              });
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      // Also check common spacing utility classes
      const classElements = document.querySelectorAll('[class*="m-"], [class*="p-"], [class*="gap-"], [class*="space-"]');
      for (let i = 0; i < Math.min(classElements.length, 20); i++) {
        try {
          const el = classElements[i];
          const computed = window.getComputedStyle(el);
          ['margin', 'padding', 'gap'].forEach(prop => {
            const value = computed[prop];
            if (value && value !== '0px') {
              spacing.add(value);
            }
          });
        } catch (e) {
          continue;
        }
      }
    } catch (error) {
      console.warn('Spacing extraction partial error:', error);
    }
    
    return Array.from(spacing)
      .filter(s => s && !isNaN(parseFloat(s)))
      .sort((a, b) => parseFloat(a) - parseFloat(b))
      .slice(0, 20);
  }

  extractShadows() {
    const shadows = new Set();
    
    try {
      // Elements likely to have shadows
      const shadowElements = document.querySelectorAll('.shadow, .card, .button, .btn, .elevated, .raised, [class*="shadow"], [class*="box-shadow"]');
      const sampleElements = shadowElements.length > 0 ? 
        shadowElements : 
        document.querySelectorAll('div, button, input, section');
      
      const maxElements = Math.min(sampleElements.length, 30);
      
      for (let i = 0; i < maxElements; i++) {
        try {
          const el = sampleElements[i];
          const computed = window.getComputedStyle(el);
          
          if (computed.boxShadow && computed.boxShadow !== 'none') {
            shadows.add(computed.boxShadow);
          }
          if (computed.textShadow && computed.textShadow !== 'none') {
            shadows.add(computed.textShadow);
          }
        } catch (e) {
          continue;
        }
      }
    } catch (error) {
      console.warn('Shadow extraction partial error:', error);
    }
    
    return Array.from(shadows).slice(0, 10);
  }

  extractBorderRadius() {
    const borderRadius = new Set();
    
    try {
      // Elements likely to have border radius
      const radiusElements = document.querySelectorAll('.rounded, .card, .button, .btn, .circle, [class*="radius"], [class*="rounded"]');
      const sampleElements = radiusElements.length > 0 ? 
        radiusElements : 
        document.querySelectorAll('div, button, input, img, section');
      
      const maxElements = Math.min(sampleElements.length, 50);
      
      for (let i = 0; i < maxElements; i++) {
        try {
          const el = sampleElements[i];
          const computed = window.getComputedStyle(el);
          const radius = computed.borderRadius;
          
          if (radius && radius !== '0px') {
            // Split compound values
            radius.split(' ').forEach(value => {
              if (value && value !== '0px' && !isNaN(parseFloat(value))) {
                borderRadius.add(value);
              }
            });
          }
        } catch (e) {
          continue;
        }
      }
    } catch (error) {
      console.warn('Border radius extraction partial error:', error);
    }
    
    return Array.from(borderRadius)
      .filter(r => r && r !== '0px')
      .sort((a, b) => parseFloat(a) - parseFloat(b))
      .slice(0, 10);
  }

  extractBreakpoints() {
    const breakpoints = new Set();
    
    try {
      // Scan accessible stylesheets for media queries
      for (const styleSheet of document.styleSheets) {
        try {
          for (const rule of styleSheet.cssRules || []) {
            if (rule instanceof CSSMediaRule) {
              const mediaText = rule.media.mediaText;
              // Extract pixel values from media queries
              const pixelMatches = mediaText.match(/\b(\d+)px\b/g);
              if (pixelMatches) {
                pixelMatches.forEach(match => breakpoints.add(match));
              }
            }
          }
        } catch (e) {
          // Skip cross-origin stylesheets
          continue;
        }
      }
    } catch (error) {
      console.warn('Breakpoint extraction partial error:', error);
    }
    
    return Array.from(breakpoints)
      .map(bp => parseInt(bp))
      .sort((a, b) => a - b)
      .map(bp => `${bp}px`)
      .slice(0, 10);
  }

  isValidColor(color) {
    if (!color) return false;
    
    const colorStr = color.toLowerCase().trim();
    
    // Common color keywords
    const colorKeywords = [
      'transparent', 'currentcolor', 'inherit', 'initial', 'unset',
      'black', 'white', 'red', 'green', 'blue', 'yellow', 'purple', 
      'orange', 'pink', 'brown', 'gray', 'grey', 'silver', 'gold',
      'navy', 'teal', 'aqua', 'lime', 'maroon', 'olive', 'fuchsia'
    ];
    
    if (colorKeywords.includes(colorStr)) {
      return colorStr !== 'transparent' && colorStr !== 'inherit' && 
             colorStr !== 'initial' && colorStr !== 'unset';
    }
    
    // Hex color patterns
    if (/^#([0-9a-f]{3}){1,2}$/i.test(colorStr)) {
      return true;
    }
    
    // RGB/RGBA patterns
    if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/i.test(colorStr)) {
      return true;
    }
    
    // HSL/HSLA patterns
    if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+\s*)?\)$/i.test(colorStr)) {
      return true;
    }
    
    return false;
  }

  estimateColorUsage(color) {
    if (!this.isValidColor(color)) return 'rare';
    
    try {
      let count = 0;
      const sampleElements = document.querySelectorAll('body, div, span, a, button, h1, h2, h3, h4, h5, h6, p');
      const maxCheck = Math.min(sampleElements.length, 100);
      
      for (let i = 0; i < maxCheck; i++) {
        try {
          const el = sampleElements[i];
          const computed = window.getComputedStyle(el);
          if (computed.color === color || computed.backgroundColor === color) {
            count++;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (count > 15) return 'primary';
      if (count > 8) return 'secondary';
      if (count > 3) return 'accent';
      return 'rare';
    } catch (error) {
      return 'unknown';
    }
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractTokens') {
    try {
      const extractor = new DesignTokenExtractor();
      const tokens = extractor.extractAll();
      sendResponse({ 
        success: true, 
        tokens: tokens,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Token extraction failed:', error);
      sendResponse({ 
        success: false, 
        error: error.message,
        url: window.location.href
      });
    }
  }
  return true; // Keep message channel open for async response
});

// Log when content script loads
console.log('🎨 Design Token Generator content script loaded successfully');