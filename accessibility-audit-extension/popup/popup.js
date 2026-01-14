// popup.js
class AccessibilityPopup {
  constructor() {
    this.scanning = false;
    this.currentResults = null;
    this.init();
  }
  
  init() {
    // Load previous scan if any
    this.loadLastScan();
    
    // Event listeners
    document.getElementById('scanBtn').addEventListener('click', () => this.scanPage());
    document.getElementById('viewDetailsBtn').addEventListener('click', () => this.viewDetails());
    document.getElementById('exportBtn').addEventListener('click', () => this.exportResults());
    document.getElementById('historyBtn').addEventListener('click', () => this.viewHistory());
  }
  
  async scanPage() {
    if (this.scanning) return;
    
    this.scanning = true;
    const scanBtn = document.getElementById('scanBtn');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    
    scanBtn.disabled = true;
    scanBtn.textContent = 'Scanning...';
    loading.style.display = 'block';
    results.style.display = 'none';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'scanAccessibility' 
      });
      
      if (response && response.success) {
        this.currentResults = response.results;
        this.displayResults(response.results);
        this.showNotification('✅ Scan completed successfully!');
      } else {
        throw new Error(response?.error || 'Scan failed');
      }
    } catch (error) {
      console.error('Scan error:', error);
      this.showError('Failed to scan page. Please refresh and try again.');
    } finally {
      this.scanning = false;
      scanBtn.disabled = false;
      scanBtn.textContent = '🔍 Scan Current Page';
      loading.style.display = 'none';
    }
  }
  
  displayResults(results) {
    // Update score
    document.getElementById('scoreValue').textContent = results.score;
    document.getElementById('scoreGrade').textContent = `Grade: ${results.grade}`;
    document.getElementById('scoreStatus').textContent = this.getScoreStatus(results.score);
    
    // Update progress circle
    const progress = document.querySelector('.score-progress');
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (results.score / 100) * circumference;
    progress.style.strokeDashoffset = offset;
    
    // Update categories
    this.displayCategories(results.checks);
    
    // Update suggestions
    this.displaySuggestions(results.suggestions);
    
    // Update stats
    document.getElementById('issuesCount').textContent = 
      Object.values(results.checks).reduce((sum, check) => sum + check.issues.length, 0);
    
    document.getElementById('elementsCount').textContent = 
      Object.values(results.checks).reduce((sum, check) => sum + check.total, 0);
    
    document.getElementById('passRate').textContent = 
      `${Math.round((results.score / 100) * 100)}%`;
    
    // Show results section
    document.getElementById('results').style.display = 'block';
  }
  
  displayCategories(checks) {
    const categoriesList = document.getElementById('categoriesList');
    categoriesList.innerHTML = '';
    
    const categories = [
      { key: 'contrast', name: 'Color Contrast', icon: '🎨' },
      { key: 'images', name: 'Images', icon: '🖼️' },
      { key: 'headings', name: 'Headings', icon: '#️⃣' },
      { key: 'forms', name: 'Forms', icon: '📝' },
      { key: 'navigation', name: 'Navigation', icon: '🧭' },
      { key: 'semantics', name: 'Semantics', icon: '🏷️' }
    ];
    
    categories.forEach(category => {
      const check = checks[category.key];
      if (!check || check.total === 0) return;
      
      const percentage = Math.round((check.passed / check.total) * 100);
      const color = this.getScoreColor(percentage);
      
      const item = document.createElement('div');
      item.className = 'category-item';
      item.innerHTML = `
        <div class="category-name">
          <span class="category-icon" style="background: ${color}20; color: ${color}">
            ${category.icon}
          </span>
          <span>${category.name}</span>
        </div>
        <div class="category-score" style="color: ${color}">
          ${percentage}% (${check.passed}/${check.total})
        </div>
      `;
      
      categoriesList.appendChild(item);
    });
  }
  
  displaySuggestions(suggestions) {
    const suggestionsList = document.getElementById('suggestionsList');
    suggestionsList.innerHTML = '';
    
    if (suggestions.length === 0) {
      suggestionsList.innerHTML = `
        <div class="suggestion-item">
          <p style="margin: 0; opacity: 0.9;">🎉 Great job! No major issues found.</p>
        </div>
      `;
      return;
    }
    
    suggestions.forEach(suggestion => {
      const priorityClass = `priority-${suggestion.priority}`;
      
      const item = document.createElement('div');
      item.className = `suggestion-item ${suggestion.priority}`;
      item.innerHTML = `
        <div>
          <span class="suggestion-priority ${priorityClass}">
            ${suggestion.priority.toUpperCase()}
          </span>
          <span>${suggestion.category}</span>
        </div>
        <p class="suggestion-text">${suggestion.suggestion}</p>
        <p class="suggestion-fix"><strong>Fix:</strong> ${suggestion.fix}</p>
      `;
      
      suggestionsList.appendChild(item);
    });
  }
  
  getScoreStatus(score) {
    if (score >= 90) return 'Excellent - WCAG AAA compliant';
    if (score >= 80) return 'Good - WCAG AA compliant';
    if (score >= 70) return 'Fair - Needs improvements';
    if (score >= 60) return 'Poor - Significant issues';
    return 'Critical - Major accessibility barriers';
  }
  
  getScoreColor(percentage) {
    if (percentage >= 90) return '#10b981';
    if (percentage >= 80) return '#3b82f6';
    if (percentage >= 70) return '#f59e0b';
    return '#ef4444';
  }
  
  async loadLastScan() {
    try {
      const response = await new Promise(resolve => {
        chrome.runtime.sendMessage({ type: 'GET_REPORTS' }, resolve);
      });
      
      if (response.reports.length > 0) {
        const lastReport = response.reports[0];
        this.currentResults = lastReport;
        this.displayResults(lastReport);
      }
    } catch (error) {
      console.error('Failed to load last scan:', error);
    }
  }
  
  viewDetails() {
    if (!this.currentResults) return;
    
    // Create detailed report view
    const details = `
      <div style="max-height: 400px; overflow-y: auto;">
        <h3>Detailed Accessibility Report</h3>
        <pre style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; font-size: 12px;">
          ${JSON.stringify(this.currentResults, null, 2)}
        </pre>
      </div>
    `;
    
    this.showModal('Full Report', details);
  }
  
  exportResults() {
    if (!this.currentResults) return;
    
    const data = {
      ...this.currentResults,
      exportedAt: new Date().toISOString(),
      tool: 'Accessibility Score Calculator'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showNotification('📥 Report exported successfully!');
  }
  
  async viewHistory() {
    try {
      const response = await new Promise(resolve => {
        chrome.runtime.sendMessage({ type: 'GET_REPORTS' }, resolve);
      });
      
      let historyHTML = '<h3>Scan History</h3>';
      
      if (response.reports.length === 0) {
        historyHTML += '<p style="text-align: center; opacity: 0.8;">No scans yet</p>';
      } else {
        response.reports.forEach((report, index) => {
          const date = new Date(report.timestamp).toLocaleString();
          historyHTML += `
            <div style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="color: ${this.getScoreColor(report.score)}">
                    ${report.score}/100 (${report.grade})
                  </strong>
                  <div style="font-size: 12px; opacity: 0.8;">${date}</div>
                </div>
                <button onclick="popup.loadReport(${index})" style="padding: 4px 8px; background: rgba(255,255,255,0.2); border: none; border-radius: 4px; color: white; cursor: pointer;">
                  Load
                </button>
              </div>
              <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">
                ${report.stats.pageTitle || report.stats.url}
              </div>
            </div>
          `;
        });
      }
      
      this.showModal('Scan History', historyHTML);
    } catch (error) {
      console.error('Failed to load history:', error);
      this.showError('Failed to load scan history');
    }
  }
  
  loadReport(index) {
    chrome.runtime.sendMessage({ type: 'GET_REPORTS' }, response => {
      if (response.reports[index]) {
        this.currentResults = response.reports[index];
        this.displayResults(response.reports[index]);
        this.showNotification('✅ Report loaded!');
      }
    });
  }
  
  showModal(title, content) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 25px;
      width: 100%;
      max-width: 400px;
      max-height: 80vh;
      overflow-y: auto;
      color: white;
      position: relative;
    `;
    
    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 20px;">${title}</h2>
        <button onclick="this.closest('.modal-overlay').remove()" 
                style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0;">
          ×
        </button>
      </div>
      ${content}
    `;
    
    modal.appendChild(modalContent);
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
    
    // Close on escape key
    const closeModal = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', closeModal);
      }
    };
    document.addEventListener('keydown', closeModal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        document.removeEventListener('keydown', closeModal);
      }
    });
  }
  
  showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  showError(message) {
    const error = document.createElement('div');
    error.textContent = message;
    error.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(error);
    
    setTimeout(() => {
      error.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => error.remove(), 300);
    }, 3000);
  }
}

// Initialize when DOM is loaded
let popup;
document.addEventListener('DOMContentLoaded', () => {
  popup = new AccessibilityPopup();
  window.popup = popup; // Make accessible for inline onclick handlers
});