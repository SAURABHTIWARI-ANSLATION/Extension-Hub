// Simplified and Fixed Template Generator
class TemplateGenerator {
  constructor(tokens) {
    this.tokens = tokens;
  }

  generate(format, options = {}) {
    switch(format) {
      case 'css':
        return this.generateCSS(options);
      case 'tailwind':
        return this.generateTailwind(options);
      case 'json':
        return this.generateJSON(options);
      case 'scss':
        return this.generateSCSS(options);
      case 'figma':
        return this.generateFigma(options);
      default:
        return this.generateJSON(options);
    }
  }

  generateCSS(options = {}) {
    let css = `/* Design Tokens - Generated ${new Date().toLocaleDateString()} */\n\n:root {\n`;
    
    // Colors
    if (this.tokens.colors && this.tokens.colors.length > 0) {
      css += '\n  /* Colors */\n';
      this.tokens.colors.forEach((color, index) => {
        const name = this.getColorName(color.value, index);
        css += `  --color-${name}: ${color.value};\n`;
      });
    }

    // Typography
    if (this.tokens.typography && this.tokens.typography.length > 0) {
      css += '\n  /* Typography */\n';
      this.tokens.typography.forEach((type, index) => {
        const name = type.element === 'h1' ? 'heading-1' :
                     type.element === 'h2' ? 'heading-2' :
                     type.element === 'h3' ? 'heading-3' :
                     type.element === 'p' ? 'body' : `text-${index + 1}`;
        css += `  --font-${name}-family: ${type.family};\n`;
        css += `  --font-${name}-size: ${type.size};\n`;
        css += `  --font-${name}-weight: ${type.weight};\n`;
        css += `  --font-${name}-line-height: ${type.lineHeight};\n`;
      });
    }

    // Spacing
    if (this.tokens.spacing && this.tokens.spacing.length > 0) {
      css += '\n  /* Spacing */\n';
      const uniqueSpacing = [...new Set(this.tokens.spacing)].sort((a, b) => 
        parseFloat(a) - parseFloat(b)
      );
      
      const scaleNames = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];
      uniqueSpacing.forEach((spacing, index) => {
        const name = index < scaleNames.length ? scaleNames[index] : index;
        css += `  --spacing-${name}: ${spacing};\n`;
      });
    }

    // Border Radius
    if (this.tokens.borderRadius && this.tokens.borderRadius.length > 0) {
      css += '\n  /* Border Radius */\n';
      const uniqueRadius = [...new Set(this.tokens.borderRadius)].sort((a, b) => 
        parseFloat(a) - parseFloat(b)
      );
      
      uniqueRadius.forEach((radius, index) => {
        const scale = ['none', 'sm', 'md', 'lg', 'full'][index] || index;
        css += `  --radius-${scale}: ${radius};\n`;
      });
    }

    css += '}\n\n';

    // Utility Classes
    if (this.tokens.shadows && this.tokens.shadows.length > 0) {
      css += '/* Shadow Utilities */\n';
      this.tokens.shadows.forEach((shadow, index) => {
        css += `.shadow-${index + 1} {\n  box-shadow: ${shadow};\n}\n\n`;
      });
    }

    return css;
  }

  generateTailwind(options = {}) {
    let config = 'module.exports = {\n  theme: {\n    extend: {\n';
    
    // Colors
    if (this.tokens.colors && this.tokens.colors.length > 0) {
      config += '      colors: {\n';
      const colorGroups = this.groupColors(this.tokens.colors);
      
      Object.entries(colorGroups).forEach(([group, colors]) => {
        if (colors.length > 1) {
          config += `        '${group}': {\n`;
          colors.forEach((color, index) => {
            const shade = (index + 1) * 100;
            config += `          ${shade}: '${color.value}',\n`;
          });
          config += '        },\n';
        } else {
          config += `        '${group}': '${colors[0].value}',\n`;
        }
      });
      config += '      },\n';
    }

    // Spacing
    if (this.tokens.spacing && this.tokens.spacing.length > 0) {
      config += '      spacing: {\n';
      const uniqueSpacing = [...new Set(this.tokens.spacing)].sort((a, b) => 
        parseFloat(a) - parseFloat(b)
      );
      
      const scaleMap = { 0: '0', 1: 'px', 2: '0.5', 3: '1', 4: '1.5', 5: '2', 6: '2.5', 7: '3', 8: '4' };
      uniqueSpacing.forEach((spacing, index) => {
        const key = scaleMap[index] || index.toString();
        config += `        '${key}': '${spacing}',\n`;
      });
      config += '      },\n';
    }

    // Font Size
    if (this.tokens.typography && this.tokens.typography.length > 0) {
      config += '      fontSize: {\n';
      this.tokens.typography.forEach((type, index) => {
        const name = type.element === 'h1' ? 'h1' :
                     type.element === 'h2' ? 'h2' :
                     type.element === 'h3' ? 'h3' : `text-${index + 1}`;
        config += `        '${name}': ['${type.size}', { lineHeight: '${type.lineHeight}' }],\n`;
      });
      config += '      },\n';
    }

    // Font Family
    if (this.tokens.typography && this.tokens.typography.length > 0) {
      const families = [...new Set(this.tokens.typography.map(t => t.family))];
      if (families.length > 0) {
        config += '      fontFamily: {\n';
        families.forEach(family => {
          const name = family.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
          if (name) {
            config += `        '${name}': ['${family}'],\n`;
          }
        });
        config += '      },\n';
      }
    }

    // Border Radius
    if (this.tokens.borderRadius && this.tokens.borderRadius.length > 0) {
      config += '      borderRadius: {\n';
      const uniqueRadius = [...new Set(this.tokens.borderRadius)].sort((a, b) => 
        parseFloat(a) - parseFloat(b)
      );
      
      uniqueRadius.forEach((radius, index) => {
        const key = ['none', 'sm', 'md', 'lg', 'full'][index] || index.toString();
        config += `        '${key}': '${radius}',\n`;
      });
      config += '      },\n';
    }

    // Box Shadow
    if (this.tokens.shadows && this.tokens.shadows.length > 0) {
      config += '      boxShadow: {\n';
      this.tokens.shadows.forEach((shadow, index) => {
        const name = index === 0 ? 'DEFAULT' : `shadow-${index}`;
        config += `        '${name}': '${shadow}',\n`;
      });
      config += '      },\n';
    }

    config += '    }\n  }\n}';
    return config;
  }

  generateJSON(options = {}) {
    const designSystem = {
      name: 'Extracted Design System',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      tokens: {
        colors: this.tokens.colors || [],
        typography: this.tokens.typography || [],
        spacing: this.tokens.spacing || [],
        shadows: this.tokens.shadows || [],
        borderRadius: this.tokens.borderRadius || []
      }
    };

    if (options.includeMetadata) {
      designSystem.metadata = {
        source: window.location.href,
        extractedAt: new Date().toISOString()
      };
    }

    return JSON.stringify(designSystem, null, 2);
  }

  generateSCSS(options = {}) {
    let scss = `// Design Tokens SCSS\n// Generated: ${new Date().toLocaleDateString()}\n\n`;
    
    // Colors
    if (this.tokens.colors && this.tokens.colors.length > 0) {
      scss += '// Colors\n';
      this.tokens.colors.forEach((color, index) => {
        const name = this.getColorName(color.value, index);
        scss += `$${name}: ${color.value};\n`;
      });
      scss += '\n';
    }

    // Typography
    if (this.tokens.typography && this.tokens.typography.length > 0) {
      scss += '// Typography\n';
      this.tokens.typography.forEach((type, index) => {
        const name = type.element === 'h1' ? 'h1' :
                     type.element === 'h2' ? 'h2' :
                     type.element === 'h3' ? 'h3' : `text-${index + 1}`;
        scss += `$${name}-font-size: ${type.size};\n`;
        scss += `$${name}-font-family: ${type.family};\n`;
        scss += `$${name}-font-weight: ${type.weight};\n`;
        scss += `$${name}-line-height: ${type.lineHeight};\n\n`;
      });
    }

    // Spacing
    if (this.tokens.spacing && this.tokens.spacing.length > 0) {
      scss += '// Spacing\n';
      const uniqueSpacing = [...new Set(this.tokens.spacing)].sort((a, b) => 
        parseFloat(a) - parseFloat(b)
      );
      
      uniqueSpacing.forEach((spacing, index) => {
        scss += `$spacing-${index}: ${spacing};\n`;
      });
      scss += '\n';
    }

    return scss;
  }

  generateFigma(options = {}) {
    const figmaTokens = {
      version: "1",
      tokenSetOrder: ["global"],
      tokenSets: {
        global: {}
      }
    };

    // Colors for Figma
    if (this.tokens.colors && this.tokens.colors.length > 0) {
      figmaTokens.tokenSets.global.color = {};
      this.tokens.colors.forEach((color, index) => {
        const name = `color-${index + 1}`;
        figmaTokens.tokenSets.global.color[name] = {
          type: "color",
          value: this.normalizeColorForFigma(color.value),
          description: `Color token ${index + 1}`
        };
      });
    }

    return JSON.stringify(figmaTokens, null, 2);
  }

  // Helper Methods
  getColorName(color, index) {
    // Simple color naming
    const colorMap = {
      '#000000': 'black',
      '#ffffff': 'white',
      '#f8f9fa': 'gray-50',
      '#e9ecef': 'gray-100',
      '#dee2e6': 'gray-200',
      '#ced4da': 'gray-300',
      '#adb5bd': 'gray-400',
      '#6c757d': 'gray-500',
      '#495057': 'gray-600',
      '#343a40': 'gray-700',
      '#212529': 'gray-800',
      '#007bff': 'blue',
      '#6c757d': 'gray',
      '#28a745': 'green',
      '#17a2b8': 'cyan',
      '#ffc107': 'yellow',
      '#dc3545': 'red',
      '#6610f2': 'indigo'
    };

    const normalizedColor = color.toLowerCase();
    if (colorMap[normalizedColor]) {
      return colorMap[normalizedColor];
    }

    // Generate name from hex
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3 || hex.length === 6) {
        return `custom-${hex.substring(0, 3)}`;
      }
    }

    return `color-${index + 1}`;
  }

  groupColors(colors) {
    const groups = {
      primary: [],
      secondary: [],
      accent: [],
      neutral: []
    };

    colors.forEach(color => {
      const colorValue = color.value.toLowerCase();
      
      if (colorValue.includes('#007bff') || colorValue.includes('blue')) {
        groups.primary.push(color);
      } else if (colorValue.includes('#6c757d') || colorValue.includes('gray')) {
        groups.neutral.push(color);
      } else if (colorValue.includes('#28a745') || colorValue.includes('green')) {
        groups.accent.push(color);
      } else {
        groups.secondary.push(color);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }

  normalizeColorForFigma(color) {
    // Convert color to rgba format for Figma
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      let r, g, b;
      
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16) / 255;
        g = parseInt(hex[1] + hex[1], 16) / 255;
        b = parseInt(hex[2] + hex[2], 16) / 255;
      } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16) / 255;
        g = parseInt(hex.slice(2, 4), 16) / 255;
        b = parseInt(hex.slice(4, 6), 16) / 255;
      } else {
        return color;
      }
      
      return `rgba(${(r * 255).toFixed(0)}, ${(g * 255).toFixed(0)}, ${(b * 255).toFixed(0)}, 1)`;
    }
    
    return color;
  }
}

// Make it available globally for Chrome extension
if (typeof window !== 'undefined') {
  window.TemplateGenerator = TemplateGenerator;
}