// content.js
class AccessibilityScanner {
  constructor() {
    this.results = {
      score: 0,
      checks: {
        contrast: { passed: 0, total: 0, issues: [] },
        images: { passed: 0, total: 0, issues: [] },
        headings: { passed: 0, total: 0, issues: [] },
        forms: { passed: 0, total: 0, issues: [] },
        navigation: { passed: 0, total: 0, issues: [] },
        semantics: { passed: 0, total: 0, issues: [] }
      },
      suggestions: [],
      stats: {
        totalElements: 0,
        scannedElements: 0,
        pageTitle: document.title,
        url: window.location.href
      }
    };
  }
  
  async scan() {
    console.log('🔍 Starting accessibility scan...');
    
    await Promise.all([
      this.checkContrast(),
      this.checkImages(),
      this.checkHeadings(),
      this.checkForms(),
      this.checkNavigation(),
      this.checkSemantics()
    ]);
    
    this.calculateScore();
    this.generateSuggestions();
    
    return this.results;
  }
  
  checkContrast() {
    console.log('🎨 Checking color contrast...');
    
    const textElements = document.querySelectorAll(
      'p, span, div, h1, h2, h3, h4, h5, h6, a, li, td, th, label, button, input, textarea'
    );
    
    let checked = 0;
    let passed = 0;
    const issues = [];
    
    // Sample up to 50 elements for performance
    const sampleSize = Math.min(textElements.length, 50);
    
    for (let i = 0; i < sampleSize; i++) {
      const element = textElements[i];
      const style = window.getComputedStyle(element);
      const bgElement = this.findBackgroundElement(element);
      
      if (bgElement) {
        const bgStyle = window.getComputedStyle(bgElement);
        const textColor = style.color;
        const bgColor = bgStyle.backgroundColor;
        
        if (textColor && bgColor && textColor !== 'rgba(0, 0, 0, 0)') {
          const contrast = ContrastCalculator.calculateContrastRatio(textColor, bgColor);
          checked++;
          
          if (ContrastCalculator.meetsWCAGAA(contrast)) {
            passed++;
          } else {
            issues.push({
              element: element.tagName,
              text: element.textContent?.substring(0, 50) || 'No text',
              contrast: contrast.toFixed(2),
              textColor,
              bgColor
            });
          }
        }
      }
    }
    
    this.results.checks.contrast = { passed, total: checked, issues };
  }
  
  checkImages() {
    console.log('🖼️ Checking images...');
    
    const images = document.querySelectorAll('img');
    let checked = images.length;
    let passed = 0;
    const issues = [];
    
    images.forEach(img => {
      const alt = img.getAttribute('alt');
      const hasAlt = alt !== null && alt.trim() !== '';
      
      if (hasAlt) {
        passed++;
      } else {
        issues.push({
          element: 'IMG',
          src: img.src.substring(0, 100),
          alt: alt || 'missing'
        });
      }
    });
    
    this.results.checks.images = { passed, total: checked, issues };
  }
  
  checkHeadings() {
    console.log('#️⃣ Checking heading hierarchy...');
    
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let checked = headings.length;
    let passed = 0;
    const issues = [];
    
    // Check if h1 exists
    const h1Count = headings.filter(h => h.tagName === 'H1').length;
    if (h1Count === 0) {
      issues.push({
        type: 'missing-h1',
        message: 'Page is missing H1 heading'
      });
    } else if (h1Count > 1) {
      issues.push({
        type: 'multiple-h1',
        message: `Page has ${h1Count} H1 headings (should have only 1)`
      });
    }
    
    // Check heading hierarchy
    let lastLevel = 0;
    for (const heading of headings) {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (level > lastLevel + 1) {
        issues.push({
          element: heading.tagName,
          text: heading.textContent?.substring(0, 50) || 'No text',
          message: `Heading jump from H${lastLevel} to H${level}`
        });
      }
      lastLevel = level;
    }
    
    // For now, pass all headings if no hierarchy issues
    passed = checked - issues.length;
    this.results.checks.headings = { passed, total: checked, issues };
  }
  
  checkForms() {
    console.log('📝 Checking form elements...');
    
    const formElements = document.querySelectorAll(
      'input, textarea, select, button, [role="button"], [role="textbox"]'
    );
    let checked = 0;
    let passed = 0;
    const issues = [];
    
    formElements.forEach(element => {
      checked++;
      
      // Check labels
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
        const hasLabel = element.labels?.length > 0 || 
                         element.hasAttribute('aria-label') || 
                         element.hasAttribute('aria-labelledby');
        
        if (hasLabel) {
          passed++;
        } else {
          issues.push({
            element: element.tagName,
            type: element.type || 'N/A',
            id: element.id || 'none',
            message: 'Missing label or aria-label'
          });
        }
      } else {
        passed++; // Non-input elements pass by default
      }
    });
    
    this.results.checks.forms = { passed, total: checked, issues };
  }
  
  checkNavigation() {
    console.log('🧭 Checking navigation...');
    
    const links = document.querySelectorAll('a');
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    let checked = links.length;
    let passed = 0;
    const issues = [];
    
    // Check for skip links
    if (skipLinks.length === 0) {
      issues.push({
        type: 'missing-skip-link',
        message: 'No skip navigation link found'
      });
    }
    
    // Check link text
    links.forEach(link => {
      const text = link.textContent?.trim() || '';
      const href = link.getAttribute('href');
      
      if (href && href !== '#') {
        if (text.length === 0 && !link.querySelector('img[alt]')) {
          issues.push({
            element: 'A',
            href: href.substring(0, 100),
            message: 'Link has no accessible text'
          });
        } else if (text === 'Click here' || text === 'Read more' || text === 'Here') {
          issues.push({
            element: 'A',
            text,
            href: href.substring(0, 100),
            message: 'Generic link text: "' + text + '"'
          });
        }
      }
    });
    
    passed = checked - issues.length;
    this.results.checks.navigation = { passed, total: checked, issues };
  }
  
  checkSemantics() {
    console.log('🏷️ Checking semantic HTML...');
    
    const semanticElements = [
      'header', 'nav', 'main', 'article', 'section', 'aside', 'footer',
      'figure', 'figcaption', 'time', 'mark', 'summary', 'details'
    ];
    
    const presentElements = semanticElements.filter(tag => 
      document.querySelector(tag)
    );
    
    let checked = semanticElements.length;
    let passed = presentElements.length;
    const issues = [];
    
    // Check for div/span misuse
    const divCount = document.querySelectorAll('div').length;
    const spanCount = document.querySelectorAll('span').length;
    
    if (divCount > 100) {
      issues.push({
        type: 'div-overuse',
        message: `${divCount} div elements found - consider using semantic elements`
      });
    }
    
    this.results.checks.semantics = { passed, total: checked, issues };
  }
  
  findBackgroundElement(element) {
    let current = element;
    while (current && current !== document.body) {
      const bg = window.getComputedStyle(current).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        return current;
      }
      current = current.parentElement;
    }
    return document.body;
  }
  
  calculateScore() {
    const checks = this.results.checks;
    let totalPoints = 0;
    let maxPoints = 0;
    
    for (const category in checks) {
      const check = checks[category];
      if (check.total > 0) {
        const categoryScore = (check.passed / check.total) * 100;
        totalPoints += categoryScore;
        maxPoints += 100;
      }
    }
    
    this.results.score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
    
    // Add grade
    if (this.results.score >= 90) {
      this.results.grade = 'A';
    } else if (this.results.score >= 80) {
      this.results.grade = 'B';
    } else if (this.results.score >= 70) {
      this.results.grade = 'C';
    } else if (this.results.score >= 60) {
      this.results.grade = 'D';
    } else {
      this.results.grade = 'F';
    }
  }
  
  generateSuggestions() {
    const suggestions = [];
    const checks = this.results.checks;
    
    // Contrast suggestions
    if (checks.contrast.passed < checks.contrast.total * 0.8) {
      suggestions.push({
        category: 'Contrast',
        priority: 'high',
        suggestion: `Improve color contrast on ${checks.contrast.issues.length} elements. Aim for minimum 4.5:1 ratio.`,
        fix: 'Increase contrast between text and background colors.'
      });
    }
    
    // Image suggestions
    if (checks.images.issues.length > 0) {
      suggestions.push({
        category: 'Images',
        priority: 'high',
        suggestion: `Add alt text to ${checks.images.issues.length} images.`,
        fix: 'Add descriptive alt attributes to all <img> tags.'
      });
    }
    
    // Heading suggestions
    if (checks.headings.issues.length > 0) {
      suggestions.push({
        category: 'Headings',
        priority: 'medium',
        suggestion: 'Fix heading hierarchy issues.',
        fix: 'Ensure proper heading structure (H1 → H2 → H3).'
      });
    }
    
    // Form suggestions
    if (checks.forms.issues.length > 0) {
      suggestions.push({
        category: 'Forms',
        priority: 'high',
        suggestion: `Fix ${checks.forms.issues.length} form accessibility issues.`,
        fix: 'Add labels or aria-label attributes to all form inputs.'
      });
    }
    
    // Navigation suggestions
    if (checks.navigation.issues.length > 0) {
      suggestions.push({
        category: 'Navigation',
        priority: 'medium',
        suggestion: 'Improve link accessibility.',
        fix: 'Add descriptive link text and consider adding skip navigation.'
      });
    }
    
    this.results.suggestions = suggestions;
  }
}

// Listen for scan requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanAccessibility') {
    const scanner = new AccessibilityScanner();
    scanner.scan().then(results => {
      // Save report
      chrome.runtime.sendMessage({
        type: 'SAVE_REPORT',
        data: results
      });
      
      sendResponse({ 
        success: true, 
        results,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    }).catch(error => {
      sendResponse({ 
        success: false, 
        error: error.message,
        url: window.location.href
      });
    });
    
    return true; // Keep message channel open
  }
});

console.log('🚀 Accessibility Scanner loaded');