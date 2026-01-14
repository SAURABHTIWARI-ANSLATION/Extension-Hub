class TokenGenerator {
  constructor() {
    this.init();
  }

  init() {
    document.getElementById('scanBtn').addEventListener('click', () => this.scanPage());
    document.getElementById('copyBtn').addEventListener('click', () => this.copyOutput());
    document.getElementById('downloadBtn').addEventListener('click', () => this.downloadOutput());
    document.getElementById('clearBtn').addEventListener('click', () => this.clearOutput());
  }

  async scanPage() {
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const output = document.getElementById('output');
    const stats = document.getElementById('stats');
    
    loading.style.display = 'block';
    results.style.display = 'none';
    output.value = '';
    stats.textContent = '';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractTokens' });
      
      if (response && response.success) {
        const selectedFormat = document.getElementById('format').value;
        const generatedCode = this.generateCode(response.tokens, selectedFormat);
        
        output.value = generatedCode;
        loading.style.display = 'none';
        results.style.display = 'block';
        
        this.updateStats(response.tokens);
      } else {
        throw new Error('Failed to extract tokens. Try refreshing the page.');
      }
    } catch (error) {
      loading.style.display = 'none';
      output.value = `Error: ${error.message}\n\nPlease:\n1. Refresh the webpage\n2. Make sure you're on a valid website\n3. Try again`;
      results.style.display = 'block';
    }
  }

  generateCode(tokens, format) {
    const selectedCategories = {
      colors: document.getElementById('colors').checked,
      typography: document.getElementById('typography').checked,
      spacing: document.getElementById('spacing').checked,
      shadows: document.getElementById('shadows').checked
    };

    // Filter tokens
    const filteredTokens = {};
    Object.keys(tokens).forEach(category => {
      if (selectedCategories[category] && tokens[category].length > 0) {
        filteredTokens[category] = tokens[category];
      }
    });

    // Use TemplateGenerator (now defined in popup.html)
    try {
      const generator = new TemplateGenerator(filteredTokens);
      return generator.generate(format);
    } catch (error) {
      console.error('Template generator error:', error);
      return this.generateFallbackCode(filteredTokens, format);
    }
  }

  generateFallbackCode(tokens, format) {
    if (format === 'json') {
      return JSON.stringify(tokens, null, 2);
    } else if (format === 'css') {
      let css = ':root {\n';
      if (tokens.colors) {
        tokens.colors.forEach((color, i) => {
          css += `  --color-${i + 1}: ${color.value};\n`;
        });
      }
      css += '}\n';
      return css;
    }
    return 'Format not supported in fallback mode';
  }

  copyOutput() {
    const output = document.getElementById('output');
    output.select();
    document.execCommand('copy');
    
    const copyBtn = document.getElementById('copyBtn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✅ Copied!';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 2000);
  }

  downloadOutput() {
    const output = document.getElementById('output');
    const format = document.getElementById('format').value;
    const ext = format === 'tailwind' ? 'js' : format === 'json' ? 'json' : format;
    const filename = `design-tokens.${ext}`;
    
    const blob = new Blob([output.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  clearOutput() {
    document.getElementById('output').value = '';
    document.getElementById('stats').textContent = '';
  }

  updateStats(tokens) {
    const stats = document.getElementById('stats');
    const statsArray = [];
    
    if (tokens.colors && tokens.colors.length > 0) {
      statsArray.push(`${tokens.colors.length} colors`);
    }
    if (tokens.typography && tokens.typography.length > 0) {
      statsArray.push(`${tokens.typography.length} fonts`);
    }
    if (tokens.spacing && tokens.spacing.length > 0) {
      statsArray.push(`${tokens.spacing.length} spacing values`);
    }
    if (tokens.shadows && tokens.shadows.length > 0) {
      statsArray.push(`${tokens.shadows.length} shadows`);
    }
    
    if (statsArray.length > 0) {
      stats.textContent = `Found: ${statsArray.join(', ')}`;
    } else {
      stats.textContent = 'No tokens found on this page';
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TokenGenerator();
});