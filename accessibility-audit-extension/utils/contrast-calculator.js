// utils/contrast-calculator.js
class ContrastCalculator {
  /**
   * Calculate contrast ratio between two colors
   * WCAG 2.1 formula: (L1 + 0.05) / (L2 + 0.05)
   */
  static calculateContrastRatio(color1, color2) {
    const l1 = this.getRelativeLuminance(color1);
    const l2 = this.getRelativeLuminance(color2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  static getRelativeLuminance(color) {
    const rgb = this.parseColor(color);
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  
  static parseColor(color) {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return [
          parseInt(hex[0] + hex[0], 16),
          parseInt(hex[1] + hex[1], 16),
          parseInt(hex[2] + hex[2], 16)
        ];
      } else if (hex.length === 6) {
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16)
        ];
      }
    }
    
    // Handle rgb/rgba
    if (color.startsWith('rgb')) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
      }
    }
    
    // Default fallback
    return [128, 128, 128];
  }
  
  static meetsWCAGAA(contrastRatio) {
    return contrastRatio >= 4.5;
  }
  
  static meetsWCAGAAA(contrastRatio) {
    return contrastRatio >= 7;
  }
  
  static getContrastScore(contrastRatio) {
    if (contrastRatio >= 7) return 100;
    if (contrastRatio >= 4.5) return 80;
    if (contrastRatio >= 3) return 60;
    return 40;
  }
}