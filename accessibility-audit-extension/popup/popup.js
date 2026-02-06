// popup.js
class AccessibilityPopup {
  constructor() {
    this.scanning = false;
    this.currentResults = null;
    this.init();
  }
  
  init() {
    // Initially hide results section
    document.getElementById('results').style.display = 'none';
    
    // Check if we should show previous scan results
    this.checkAndShowLastScan();
    
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
      
      // Check if we can access the tab
      if (!tab || !tab.id) {
        throw new Error('No active tab found');
      }
      
      // Try to send message to content script
      let response;
      try {
        response = await chrome.tabs.sendMessage(tab.id, { 
          action: 'scanAccessibility' 
        });
      } catch (sendMessageError) {
        // If content script is not responding, try to inject it
        console.log('Content script not responding, attempting to inject...');
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js', 'utils/contrast-calculator.js']
          });
          
          // Wait a bit for script to load
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try sending message again
          response = await chrome.tabs.sendMessage(tab.id, { 
            action: 'scanAccessibility' 
          });
        } catch (injectError) {
          throw new Error('Failed to inject content script: ' + injectError.message);
        }
      }
      
      if (response && response.success) {
        this.currentResults = response.results;
        this.displayResults(response.results);
        this.showNotification('✅ Scan completed successfully!');
      } else {
        throw new Error(response?.error || 'Scan failed');
      }
    } catch (error) {
      console.error('Scan error:', error);
      this.showError('Failed to scan page: ' + error.message);
      
      // Reset view to show scan button
      results.style.display = 'none';
      scanBtn.style.display = 'block';
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
  
  async checkAndShowLastScan() {
    try {
      // Get current tab URL
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tab?.url;
      
      if (!currentUrl) return;
      
      // Get reports from storage
      const response = await new Promise(resolve => {
        chrome.runtime.sendMessage({ type: 'GET_REPORTS' }, resolve);
      });
      
      if (response.reports.length > 0) {
        const lastReport = response.reports[0];
        const lastReportUrl = lastReport.stats?.url;
        
        // Only show previous results if it's the same page
        if (lastReportUrl && this.isSamePage(currentUrl, lastReportUrl)) {
          this.currentResults = lastReport;
          this.displayResults(lastReport);
        } else {
          // Hide results section, show scan button
          document.getElementById('results').style.display = 'none';
          document.getElementById('scanBtn').style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Failed to check last scan:', error);
    }
  }
  
  viewDetails() {
    if (!this.currentResults) return;
    
    // Create detailed report view
    const results = this.currentResults;
    const details = `
      <div style="max-height: 60vh; overflow-y: auto; padding-left: 5px; box-sizing: border-box;">
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; color: var(--accent-color);">Detailed Accessibility Report</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
              <div style="font-size: 24px; font-weight: bold; color: var(--accent-color);">${results.score}/100</div>
              <div style="font-size: 14px; color: var(--text-secondary);">Score</div>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
              <div style="font-size: 24px; font-weight: bold; color: var(--accent-color);">${results.grade}</div>
              <div style="font-size: 14px; color: var(--text-secondary);">Grade</div>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
              <div style="font-size: 24px; font-weight: bold; color: var(--accent-color);">${Object.values(results.checks).reduce((sum, check) => sum + check.issues.length, 0)}</div>
              <div style="font-size: 14px; color: var(--text-secondary);">Issues</div>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: var(--accent-color);">Check Results</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            ${Object.entries(results.checks).map(([key, check]) => `
              <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                <div style="font-weight: 500; margin-bottom: 8px; text-transform: capitalize;">${key}</div>
                <div style="font-size: 14px;">
                  <span style="color: var(--success);">${check.passed}</span> passed, 
                  <span style="color: var(--danger);">${check.issues.length}</span> issues
                </div>
                <div style="margin-top: 5px; font-size: 12px; color: var(--text-secondary);">
                  ${check.total} total elements
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: var(--accent-color);">Improvement Suggestions</h4>
          ${results.suggestions && results.suggestions.length > 0 ? 
            results.suggestions.map(suggestion => `
              <div style="background: rgba(255,255,255,0.05); padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid ${suggestion.priority === 'high' ? 'var(--danger)' : suggestion.priority === 'medium' ? 'var(--warning)' : 'var(--accent-color)'}; box-sizing: border-box;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-right: 10px; 
                        background: ${suggestion.priority === 'high' ? 'var(--danger)' : suggestion.priority === 'medium' ? 'var(--warning)' : 'var(--accent-color)'}; 
                        color: white; text-transform: uppercase;">
                    ${suggestion.priority}
                  </span>
                  <strong style="color: var(--accent-color);">${suggestion.category}</strong>
                </div>
                <p style="margin: 8px 0; font-size: 14px; word-wrap: break-word; overflow-wrap: break-word;">${suggestion.suggestion}</p>
                <p style="margin: 8px 0 0 0; font-size: 13px; color: var(--text-secondary); word-wrap: break-word; overflow-wrap: break-word;"><strong>Fix:</strong> ${suggestion.fix}</p>
              </div>
            `).join('') :
            '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">🎉 No suggestions - great job!</div>'}
        </div>
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
      
      let historyHTML = '<h3 style="margin-top: 0; margin-bottom: 20px; color: var(--accent-color); padding-left: 5px;">Scan History</h3>';
      
      if (response.reports.length === 0) {
        historyHTML += '<div style="text-align: center; padding: 30px; color: var(--text-secondary);">No scans yet</div>';
      } else {
        historyHTML += '<div style="max-height: 400px; overflow-y: auto; padding: 0 5px;" class="history-list">';
        response.reports.forEach((report, index) => {
          const date = new Date(report.timestamp).toLocaleString();
          historyHTML += `
            <div style="margin: 12px 0; padding: 15px; background: rgba(255,255,255,0.08); border-radius: 12px; border-left: 3px solid var(--accent-color); transition: transform 0.2s ease;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap;">
                <div>
                  <strong style="font-size: 18px; font-weight: 700; color: ${this.getScoreColor(report.score)}">
                    ${report.score}/100 (${report.grade})
                  </strong>
                </div>
                <button class="load-report-btn" data-index="${index}" style="padding: 8px 16px; background: rgba(99, 102, 241, 0.3); border: 1px solid var(--border-color); border-radius: 8px; color: white; cursor: pointer; font-size: 13px; transition: all 0.2s ease;">
                  Load
                </button>
              </div>
              <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                <div style="font-size: 13px; color: var(--text-secondary);">
                  <div>${date}</div>
                  <div style="margin-top: 4px; font-size: 12px; opacity: 0.8; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${report.stats.pageTitle || report.stats.url || 'Unknown page'}
                  </div>
                </div>
                <div style="text-align: right; font-size: 12px;">
                  <div style="color: var(--success);">
                    ${Object.values(report.checks).reduce((sum, check) => sum + check.passed, 0)} passed
                  </div>
                  <div style="color: var(--danger);">
                    ${Object.values(report.checks).reduce((sum, check) => sum + check.issues.length, 0)} issues
                  </div>
                </div>
              </div>
            </div>
          `;
        });
        historyHTML += '</div>';
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
  
  isSamePage(currentUrl, storedUrl) {
    try {
      const current = new URL(currentUrl);
      const stored = new URL(storedUrl);
      
      // Compare hostname and pathname (ignoring query params and hash)
      return current.hostname === stored.hostname && 
             current.pathname === stored.pathname;
    } catch (error) {
      return false;
    }
  }
  
  // Method to be accessible for inline handlers in modal
  handleLoadReport(index) {
    this.loadReport(index);
  }
  
  closeModal(button) {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      modal.remove();
    }
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
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9));
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      backdrop-filter: blur(10px);
      box-sizing: border-box;
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: var(--card-bg);
      border-radius: 24px;
      padding: 30px;
      width: calc(100% - 40px);
      max-width: 550px;
      max-height: 85vh;
      overflow-y: auto;
      color: var(--text-primary);
      position: relative;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2);
      border: 1px solid var(--card-border);
      box-sizing: border-box;
      margin: 0 20px;
      backdrop-filter: blur(20px);
    `;
    
    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid var(--card-border);">
        <h2 style="margin: 0; font-size: 26px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px;">${title}</h2>
        <button id="modalCloseBtn"
                style="background: linear-gradient(135deg, var(--accent-light), rgba(99, 102, 241, 0.1)); border: 2px solid var(--card-border); color: var(--accent-color); font-size: 22px; font-weight: 700; cursor: pointer; padding: 10px 14px; border-radius: 12px; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);">
          ×
        </button>
      </div>
      <div style="max-height: calc(85vh - 150px); overflow-y: auto; box-sizing: border-box; padding: 0 8px;">
        ${content}
      </div>
    `;
    
    modal.appendChild(modalContent);
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
    
    // Add close button event listener
    const closeBtn = document.getElementById('modalCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.remove();
      });
    }
    
    // Add load report button event listeners
    const loadButtons = modalContent.querySelectorAll('.load-report-btn');
    loadButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const index = e.target.getAttribute('data-index');
        this.handleLoadReport(parseInt(index));
      });
    });
    
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
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 20px; animation: pulse 1.5s infinite;"></div>
        <div style="flex: 1; font-weight: 600;">${message}</div>
        <div style="font-size: 18px; cursor: pointer; opacity: 0.8; transition: opacity 0.2s;" onclick="this.parentElement.parentElement.remove()">×</div>
      </div>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, var(--success) 0%, #059669 100%);
      color: white;
      padding: 18px 22px;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
      z-index: 10000;
      animation: notificationSlideIn 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
      font-weight: 600;
      max-width: 350px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      letter-spacing: 0.2px;
    `;
    
    // Add animation styles if not present
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes notificationSlideIn {
          from { transform: translateX(100%) scale(0.8); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        
        @keyframes notificationSlideOut {
          from { transform: translateX(0) scale(1); opacity: 1; }
          to { transform: translateX(100%) scale(0.8); opacity: 0; }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .notification:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(16, 185, 129, 0.4);
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'notificationSlideOut 0.4s cubic-bezier(0.55, 0.085, 0.68, 0.53)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 400);
    }, 4000);
  }
  
  showError(message) {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const error = document.createElement('div');
    error.className = 'notification';
    error.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 20px;">❌</div>
        <div style="flex: 1; font-weight: 600;">${message}</div>
        <div style="font-size: 18px; cursor: pointer; opacity: 0.8; transition: opacity 0.2s;" onclick="this.parentElement.parentElement.remove()">×</div>
      </div>
    `;
    
    error.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, var(--danger) 0%, #dc2626 100%);
      color: white;
      padding: 18px 22px;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
      z-index: 10000;
      animation: notificationSlideIn 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
      font-weight: 600;
      max-width: 350px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      letter-spacing: 0.2px;
    `;
    
    // Add animation styles if not present
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes notificationSlideIn {
          from { transform: translateX(100%) scale(0.8); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        
        @keyframes notificationSlideOut {
          from { transform: translateX(0) scale(1); opacity: 1; }
          to { transform: translateX(100%) scale(0.8); opacity: 0; }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .notification:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(239, 68, 68, 0.4);
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(error);
    
    // Auto-remove after 5 seconds (longer for errors)
    setTimeout(() => {
      error.style.animation = 'notificationSlideOut 0.4s cubic-bezier(0.55, 0.085, 0.68, 0.53)';
      setTimeout(() => {
        if (error.parentNode) {
          error.parentNode.removeChild(error);
        }
      }, 400);
    }, 5000);
  }
}

// Initialize when DOM is loaded
let popup;
document.addEventListener('DOMContentLoaded', () => {
  popup = new AccessibilityPopup();
  window.popup = popup; // Make accessible for inline onclick handlers
});