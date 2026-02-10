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
  chrome.storage.local.get(['selectedTheme'], function(result) {
    const theme = result.selectedTheme || 'ocean-blue';
    document.documentElement.setAttribute('data-theme', theme);
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-theme') === theme) {
        btn.classList.add('active');
      }
    });
    
    updateButtonColors(theme);
  });
}

// Update button colors based on theme
function updateButtonColors(theme) {
  const colors = themeColors[theme] || themeColors['ocean-blue'];
  const generateBtn = document.getElementById('generateBtn');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  
  if (generateBtn) {
    generateBtn.style.background = colors.btnBg;
    generateBtn.addEventListener('mouseenter', () => {
      generateBtn.style.background = colors.btnHover;
    });
    generateBtn.addEventListener('mouseleave', () => {
      generateBtn.style.background = colors.btnBg;
    });
  }
  
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
    
    document.documentElement.setAttribute('data-theme', theme);
    
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    
    updateButtonColors(theme);
    
    chrome.storage.local.set({ 'selectedTheme': theme });
    
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

  vercel: `# Vercel Specific
.vercel/
.next/
.next/cache/
.next/standalone/
.env.*.local
*.log`,

  netlify: `# Netlify
.netlify/
functions/
.netlify/functions/
dist/
build/
.env
.env.*
*.log`,

  github: `# GitHub Pages
_site/
.sass-cache/
.jekyll-cache/
.jekyll-metadata
vendor/bundle/
build/
dist/
out/
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
dist/
build/
.env
.env.local
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
  
  const selectedTechs = Array.from(techSelect.selectedOptions).map(opt => opt.value);
  const platform = platformSelect.value;
  
  if (selectedTechs.length === 0) {
    showNotification('Please select at least one technology', 'warning');
    return;
  }
  
  let content = `# .gitignore generated by GitIgnore Generator Pro
# Generated: ${new Date().toLocaleString()}
# Technologies: ${selectedTechs.join(', ')}
# Platform: ${platform === 'general' ? 'General' : platform.charAt(0).toUpperCase() + platform.slice(1)}
\n`;
  
  selectedTechs.forEach(tech => {
    if (templates[tech]) {
      content += templates[tech] + '\n\n';
    }
  });
  
  if (platform !== 'general' && templates[platform]) {
    content += templates[platform] + '\n\n';
  }
  
  content += `# Common files\n.DS_Store\nThumbs.db\n*.log\n.env\n.env.local\n.idea/\n.vscode/\n`;
  
  textarea.value = content.trim();
  outputDiv.style.display = 'block';
  
  outputDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
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
  textarea.setSelectionRange(0, 99999);
  
  navigator.clipboard.writeText(textarea.value).then(() => {
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓ Copied!';
    copyBtn.style.background = 'var(--accent-color)';
    copyBtn.style.color = 'white';
    
    showNotification('Copied to clipboard!');
    
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.background = '';
      copyBtn.style.color = '';
    }, 2000);
  }).catch(() => {
    document.execCommand('copy');
    showNotification('Copied to clipboard!');
  });
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
  
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  
  showNotification('.gitignore file downloaded!');
}

// Show notification
function showNotification(message, type = 'success') {
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Auto-detect technology from current page (MODERN FETCH VERSION)
async function autoDetectTech() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showNotification('Auto-detect not available on this page', 'warning');
      return;
    }
    
    // Use the background script for detection
    const detectedTechs = await chrome.runtime.sendMessage({ 
      action: 'detectTechStack', 
      tabId: tab.id 
    });
    
    if (detectedTechs && detectedTechs.length > 0) {
      const techSelect = document.getElementById('techSelect');
      
      // Clear previous selections
      Array.from(techSelect.options).forEach(option => {
        option.selected = detectedTechs.includes(option.value);
      });
      
      showNotification(`Auto-detected: ${detectedTechs.join(', ')}`);
    } else {
      showNotification('No technologies detected on this page', 'warning');
    }
  } catch (error) {
    console.log('Auto-detect error:', error);
    showNotification('Auto-detect failed', 'warning');
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  
  document.getElementById('autoDetectBtn').addEventListener('click', autoDetectTech);
  document.getElementById('generateBtn').addEventListener('click', generateGitignore);
  document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
  document.getElementById('downloadBtn').addEventListener('click', downloadGitignore);
  document.getElementById('clearBtn').addEventListener('click', function() {
    const techSelect = document.getElementById('techSelect');
    Array.from(techSelect.options).forEach(option => option.selected = false);
    document.getElementById('platformSelect').value = 'general';
    document.getElementById('output').style.display = 'none';
    showNotification('Selection cleared');
  });
  
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      generateGitignore();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && 
        document.activeElement.id === 'gitignoreContent') {
      copyToClipboard();
    }
    
    if (e.key === 'Escape') {
      document.getElementById('output').style.display = 'none';
    }
  });
});