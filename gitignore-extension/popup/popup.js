// ============================================
// THEME MANAGEMENT
// ============================================

// Theme color tokens for UI elements
const themeColors = {
  'ocean-blue': {
    btnBg: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
    btnHover: 'linear-gradient(135deg, #1976D2 0%, #1E88E5 100%)',
    accent: '#64B5F6'
  },
  'mint-teal': {
    btnBg: 'linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)',
    btnHover: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
    accent: '#5EEAD4'
  },
  'indigo-night': {
    btnBg: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
    btnHover: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
    accent: '#818CF8'
  },
  'sky-gradient': {
    btnBg: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)',
    btnHover: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
    accent: '#BAE6FD'
  },
  'violet-glow': {
    btnBg: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
    btnHover: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
    accent: '#C4B5FD'
  }
};

// Initialize theme
function initTheme() {
  // Load saved theme or default to ocean-blue (recommended for developer tools)
  chrome.storage.local.get(['selectedTheme'], function(result) {
    const theme = result.selectedTheme || 'ocean-blue';
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update active theme button
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-theme') === theme) {
        btn.classList.add('active');
      }
    });
    
    // Update button colors dynamically
    updateButtonColors(theme);
  });
}

// Update button colors based on theme
function updateButtonColors(theme) {
  const colors = themeColors[theme] || themeColors['ocean-blue'];
  const generateBtn = document.getElementById('generateBtn');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  
  // Apply theme to generate button
  if (generateBtn) {
    generateBtn.style.background = colors.btnBg;
    generateBtn.addEventListener('mouseenter', () => {
      generateBtn.style.background = colors.btnHover;
    });
    generateBtn.addEventListener('mouseleave', () => {
      generateBtn.style.background = colors.btnBg;
    });
  }
  
  // Apply accent color to secondary buttons
  if (copyBtn) {
    copyBtn.style.borderColor = colors.accent;
    copyBtn.style.color = colors.accent;
  }
  
  if (downloadBtn) {
    downloadBtn.style.borderColor = colors.accent;
    downloadBtn.style.color = colors.accent;
  }
}

// Theme selector event listeners
document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const theme = this.getAttribute('data-theme');
    
    // Update theme
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update active button
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    
    // Update button colors
    updateButtonColors(theme);
    
    // Save theme preference
    chrome.storage.local.set({ 'selectedTheme': theme });
    
    // Show theme change notification
    showNotification(`Theme changed to ${this.getAttribute('title')}`);
  });
});

// ============================================
// GITIGNORE TEMPLATES
// ============================================

const templates = {
  node: `# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.env
.env.local
.DS_Store
.coverage
.nyc_output
dist/
build/
package-lock.json
yarn.lock`,

  python: `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv/
ENV/
env.bak/
venv.bak/
.env
.idea/
.vscode/
*.log
pip-log.txt
pip-delete-this-directory.txt
*.pyc`,

  react: `# React
node_modules/
build/
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
coverage/
.parcel-cache/
.cache/`,

  next: `# Next.js
.next/
out/
node_modules/
*.log
.env.local
.env.development.local
.env.production.local
.vercel/
.next/cache/
.next/standalone/`,

  java: `# Java
*.class
*.log
*.ctxt
.mtj.tmp/
*.jar
*.war
*.nar
*.ear
*.zip
*.tar.gz
*.rar
hs_err_pid*
target/
build/
.idea/
.vscode/
*.iml
.project
.classpath
.settings/`,

  php: `# PHP
vendor/
.env
.env.local
.env.production.local
composer.lock
.DS_Store
*.log
.phpunit.result.cache
.idea/
.vscode/
.php_cs.cache
storage/framework/cache/
storage/framework/sessions/
storage/framework/views/`,

  go: `# Go
bin/
pkg/
*.exe
*.exe~
*.so
*.dylib
*.test
*.out
vendor/
.env
go.sum
.DS_Store
.idea/
.vscode/`,

  rust: `# Rust
target/
**/*.rs.bk
Cargo.lock
.env
.DS_Store
.idea/
.vscode/`,

  docker: `# Docker
docker-compose.override.yml
.env
.dockerignore
Dockerfile.local
.DS_Store`,

  // Platform specific templates
  vercel: `# Vercel Specific
.vercel/
.next/
# Build output
.next/cache/
.next/standalone/
# Environment variables
.env.*.local
# Debug logs
*.log`,

  netlify: `# Netlify
.netlify/
functions/
.netlify/functions/
# Build artifacts
dist/
build/
# Environment
.env
.env.*
# Logs
*.log`,

  github: `# GitHub Pages
_site/
.sass-cache/
.jekyll-cache/
.jekyll-metadata
vendor/bundle/
# Build output
build/
dist/
out/
# Environment
.env
.env.local`,

  aws: `# AWS
.aws-sam/
samconfig.toml
.terraform/
*.tfstate
*.tfstate.*
.terraform.tfstate.lock.info
.env
.idea/
.vscode/
*.log
node_modules/
dist/
build/`,

  firebase: `# Firebase
.firebase/
firebase-debug.log
.firebaserc
# Build output
dist/
build/
# Environment
.env
.env.local
# Logs
*.log`
};

// ============================================
// MAIN FUNCTIONALITY
// ============================================

// Generate .gitignore content
function generateGitignore() {
  const techSelect = document.getElementById('techSelect');
  const platformSelect = document.getElementById('platformSelect');
  const outputDiv = document.getElementById('output');
  const textarea = document.getElementById('gitignoreContent');
  
  // Get selected values
  const selectedTechs = Array.from(techSelect.selectedOptions).map(opt => opt.value);
  const platform = platformSelect.value;
  
  // Check if at least one technology is selected
  if (selectedTechs.length === 0) {
    showNotification('Please select at least one technology', 'warning');
    return;
  }
  
  // Generate header with timestamp
  let content = `# .gitignore generated by GitIgnore Generator Pro
# Generated: ${new Date().toLocaleString()}
# Technologies: ${selectedTechs.join(', ')}
# Platform: ${platform === 'general' ? 'General' : platform.charAt(0).toUpperCase() + platform.slice(1)}
\n`;
  
  // Add selected technologies
  selectedTechs.forEach(tech => {
    if (templates[tech]) {
      content += templates[tech] + '\n\n';
    }
  });
  
  // Add platform specific (if not general)
  if (platform !== 'general' && templates[platform]) {
    content += templates[platform] + '\n\n';
  }
  
  // Add common files section
  content += `# Common files\n.DS_Store\nThumbs.db\n*.log\n.env\n.env.local\n.idea/\n.vscode/\n`;
  
  // Update UI
  textarea.value = content.trim();
  outputDiv.style.display = 'block';
  
  // Scroll to output
  outputDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  // Show success notification
  showNotification('.gitignore generated successfully!');
}

// Copy to clipboard
function copyToClipboard() {
  const textarea = document.getElementById('gitignoreContent');
  const copyBtn = document.getElementById('copyBtn');
  
  if (!textarea || textarea.value.trim() === '') {
    showNotification('Nothing to copy! Generate content first.', 'warning');
    return;
  }
  
  textarea.select();
  textarea.setSelectionRange(0, 99999); // For mobile devices
  
  try {
    navigator.clipboard.writeText(textarea.value).then(() => {
      copyBtn.textContent = '✓ Copied!';
      copyBtn.style.background = 'var(--accent-color)';
      copyBtn.style.color = 'white';
      
      showNotification('Copied to clipboard!');
      
      setTimeout(() => {
        copyBtn.textContent = 'Copy to Clipboard';
        copyBtn.style.background = '';
        copyBtn.style.color = '';
      }, 2000);
    });
  } catch (err) {
    // Fallback for older browsers
    document.execCommand('copy');
    copyBtn.textContent = '✓ Copied!';
    setTimeout(() => {
      copyBtn.textContent = 'Copy to Clipboard';
    }, 2000);
  }
}

// Download .gitignore file
function downloadGitignore() {
  const textarea = document.getElementById('gitignoreContent');
  
  if (!textarea || textarea.value.trim() === '') {
    showNotification('Nothing to download! Generate content first.', 'warning');
    return;
  }
  
  const content = textarea.value;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  a.href = url;
  a.download = '.gitignore';
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  
  showNotification('.gitignore file downloaded!');
}

// Show notification
function showNotification(message, type = 'success') {
  // Remove existing notification
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create notification
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: ${type === 'warning' ? '#f59e0b' : 'var(--header-bg)'};
    color: white;
    padding: 10px 15px;
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-sm);
    z-index: 1000;
    animation: slideIn 0.3s ease;
    max-width: 250px;
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Auto-detect technology from current page
async function autoDetectTech() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      return; // Skip for extension pages
    }
    
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const detected = [];
        
        // Check for common files
        const checks = [
          { tech: 'node', files: ['package.json'], dirs: ['node_modules'] },
          { tech: 'python', files: ['requirements.txt', 'pyproject.toml'], dirs: ['venv', '.venv'] },
          { tech: 'react', files: ['package.json'], checkContent: /react/ },
          { tech: 'next', files: ['next.config.js', 'next.config.ts'], dirs: ['pages', 'app'] },
          { tech: 'java', files: ['pom.xml', 'build.gradle'], dirs: ['src/main/java'] },
          { tech: 'php', files: ['composer.json', 'index.php'], dirs: ['vendor'] },
          { tech: 'go', files: ['go.mod'], dirs: ['vendor'] },
          { tech: 'rust', files: ['Cargo.toml'], dirs: ['target'] }
        ];
        
        checks.forEach(check => {
          // Check for files
          check.files?.forEach(file => {
            const xhr = new XMLHttpRequest();
            xhr.open('HEAD', file, false);
            try {
              xhr.send();
              if (xhr.status === 200) detected.push(check.tech);
            } catch (e) {}
          });
        });
        
        return [...new Set(detected)]; // Remove duplicates
      }
    });
    
    if (result && result[0] && result[0].result.length > 0) {
      const detectedTechs = result[0].result;
      const techSelect = document.getElementById('techSelect');
      
      // Clear previous selections
      Array.from(techSelect.options).forEach(option => {
        option.selected = detectedTechs.includes(option.value);
      });
      
      showNotification(`Auto-detected: ${detectedTechs.join(', ')}`);
    }
  } catch (error) {
    console.log('Auto-detect not available:', error);
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  // Initialize theme
  initTheme();
  
  // Auto-detect button
  const autoDetectBtn = document.getElementById('autoDetectBtn');
  if (autoDetectBtn) {
    autoDetectBtn.addEventListener('click', autoDetectTech);
  } else {
    // Add auto-detect button if not in HTML
    const controlGroup = document.querySelector('.control-group');
    if (controlGroup) {
      const autoBtn = document.createElement('button');
      autoBtn.id = 'autoDetectBtn';
      autoBtn.className = 'btn-secondary';
      autoBtn.textContent = 'Auto-detect from page';
      autoBtn.style.marginTop = '8px';
      autoBtn.style.width = '100%';
      controlGroup.appendChild(autoBtn);
      autoBtn.addEventListener('click', autoDetectTech);
    }
  }
  
  // Generate button
  document.getElementById('generateBtn').addEventListener('click', generateGitignore);
  
  // Copy button
  document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
  
  // Download button
  document.getElementById('downloadBtn').addEventListener('click', downloadGitignore);
  
  // Clear selection button
  const clearBtn = document.createElement('button');
  clearBtn.id = 'clearBtn';
  clearBtn.className = 'btn-secondary';
  clearBtn.textContent = 'Clear Selection';
  clearBtn.style.marginTop = '8px';
  clearBtn.style.width = '100%';
  
  clearBtn.addEventListener('click', function() {
    const techSelect = document.getElementById('techSelect');
    Array.from(techSelect.options).forEach(option => option.selected = false);
    document.getElementById('platformSelect').value = 'general';
    document.getElementById('output').style.display = 'none';
    showNotification('Selection cleared');
  });
  
  // Add clear button after generate button
  const generateBtn = document.getElementById('generateBtn');
  if (generateBtn && generateBtn.parentNode) {
    generateBtn.parentNode.insertBefore(clearBtn, generateBtn.nextSibling);
  }
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to generate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      generateGitignore();
    }
    
    // Ctrl/Cmd + C to copy
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && 
        document.activeElement.id === 'gitignoreContent') {
      copyToClipboard();
    }
    
    // Escape to clear output
    if (e.key === 'Escape') {
      document.getElementById('output').style.display = 'none';
    }
  });
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .notification {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;
document.head.appendChild(style);