// URL Safety Preview - Content Script
// Enhanced with theme system

class SafetyPreview {
    constructor() {
        this.tooltip = null;
        this.currentUrl = '';
        this.autoCheckEnabled = true;
        
        this.init();
    }
    
    async init() {
        // Load settings
        await this.loadSettings();
        
        // Initialize tooltip
        this.createTooltip();
        
        // Setup event listeners
        this.setupListeners();
        
        console.log('URL Safety Preview content script loaded');
    }
    
    async loadSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['autoCheck', 'checkShortened'], (data) => {
                this.autoCheckEnabled = data.autoCheck !== false;
                this.checkShortened = data.checkShortened !== false;
                resolve();
            });
        });
    }
    
    createTooltip() {
        // Remove existing tooltip if any
        const existing = document.getElementById('safety-preview-tooltip');
        if (existing) existing.remove();
        
        // Create new tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'safety-preview-tooltip';
        this.tooltip.className = 'theme-indigo-night';
        
        // Apply theme styles
        this.tooltip.style.cssText = `
            position: absolute;
            background: var(--bg-card);
            backdrop-filter: blur(10px);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius-md);
            padding: var(--space-md);
            box-shadow: var(--shadow-lg);
            z-index: var(--z-tooltip);
            min-width: 280px;
            max-width: 320px;
            display: none;
            font-family: var(--font-family);
            pointer-events: auto;
            animation: slideIn var(--transition-normal) forwards;
        `;
        
        document.body.appendChild(this.tooltip);
    }
    
    setupListeners() {
        // Link hover detection
        document.addEventListener('mouseover', this.handleMouseOver.bind(this));
        document.addEventListener('mouseout', this.handleMouseOut.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // Settings change listener
        chrome.storage.onChanged.addListener((changes) => {
            if (changes.autoCheck) {
                this.autoCheckEnabled = changes.autoCheck.newValue;
            }
            if (changes.checkShortened) {
                this.checkShortened = changes.checkShortened.newValue;
            }
        });
    }
    
    handleMouseOver(e) {
        if (!this.autoCheckEnabled) return;
        
        let target = e.target;
        
        // Find nearest anchor tag
        while (target && target.tagName !== 'A') {
            target = target.parentElement;
        }
        
        if (target && target.href) {
            const url = target.href;
            
            // Check if we should preview this URL
            if (this.shouldPreviewUrl(url)) {
                this.showSafetyInfo(url, e.pageX, e.pageY, target);
            }
        }
    }
    
    handleMouseOut(e) {
        if (e.target.tagName === 'A' || e.target.closest('a')) {
            this.hideTooltip();
        }
    }
    
    handleMouseMove(e) {
        if (this.tooltip && this.tooltip.style.display === 'block') {
            this.positionTooltip(e.pageX, e.pageY);
        }
    }
    
    shouldPreviewUrl(url) {
        // Always check shortened URLs if enabled
        if (this.checkShortened && this.isShortenedUrl(url)) {
            return true;
        }
        
        // Check for suspicious patterns
        if (this.isSuspiciousUrl(url)) {
            return true;
        }
        
        return false;
    }
    
    async showSafetyInfo(url, x, y, linkElement) {
        this.currentUrl = url;
        
        // Show loading state
        this.showLoadingTooltip(x, y);
        
        // Analyze URL
        const analysis = await this.analyzeUrl(url);
        
        // Update tooltip with results
        this.updateTooltip(analysis, x, y);
        
        // Position tooltip relative to link
        this.positionTooltip(x, y);
    }
    
    showLoadingTooltip(x, y) {
        this.tooltip.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <div style="width: 40px; height: 40px; border-radius: 50%; 
                     background: linear-gradient(135deg, var(--bg-secondary), var(--bg-primary));
                     border: 2px solid var(--border-color);
                     display: flex; align-items: center; justify-content: center;
                     animation: pulse 2s infinite;">
                    <svg width="20" height="20" fill="var(--theme-accent-color)" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                </div>
                <div>
                    <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">
                        Analyzing URL Safety
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                        ${this.truncateUrl(this.currentUrl, 30)}
                    </div>
                </div>
            </div>
            <div style="font-size: 12px; color: var(--text-muted); text-align: center;">
                Checking against security databases...
            </div>
        `;
        
        this.tooltip.style.display = 'block';
        this.positionTooltip(x, y);
    }
    
    updateTooltip(analysis, x, y) {
        const scoreColor = this.getScoreColor(analysis.score);
        const statusClass = this.getStatusClass(analysis.score);
        
        this.tooltip.innerHTML = `
            <div style="margin-bottom: 12px;">
                <div style="font-weight: 600; color: var(--text-primary); font-size: 14px; 
                     display: flex; align-items: center; gap: 8px;">
                    <span style="display: inline-block; width: 8px; height: 8px; 
                          border-radius: 50%; background: ${scoreColor};"></span>
                    URL Safety Preview
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                    ${this.truncateUrl(analysis.url, 35)}
                </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <div style="width: 60px; height: 60px; border-radius: 50%; 
                     background: ${this.getScoreGradient(analysis.score)};
                     display: flex; flex-direction: column; align-items: center; justify-content: center;
                     color: white; font-weight: bold; box-shadow: var(--shadow-sm);">
                    <span style="font-size: 18px; line-height: 1;">${analysis.score}</span>
                    <span style="font-size: 10px; opacity: 0.9;">Score</span>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: ${scoreColor}; font-size: 16px;">
                        ${analysis.status}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                        ${analysis.description}
                    </div>
                    ${analysis.isShortened ? `
                        <div style="font-size: 11px; color: var(--theme-warning-color); 
                             margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                            </svg>
                            Shortened URL detected
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div style="background: var(--bg-secondary); border-radius: 6px; padding: 8px; 
                 margin-bottom: 12px; border: 1px solid var(--border-color);">
                <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">
                    Quick Analysis
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px;">
                    <span style="color: var(--text-secondary);">Domain:</span>
                    <span style="color: var(--text-primary); font-weight: 500;">
                        ${analysis.domain}
                    </span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px;">
                    <span style="color: var(--text-secondary);">Risk Level:</span>
                    <span style="color: ${scoreColor}; font-weight: 500;">
                        ${analysis.details.riskLevel}
                    </span>
                </div>
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button id="visitLink" style="flex: 2; padding: 8px; background: var(--theme-primary-btn-start);
                     color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;
                     font-weight: 500; transition: all 0.2s;">
                    Visit Anyway
                </button>
                <button id="checkDetails" style="flex: 1; padding: 8px; background: var(--bg-secondary);
                     color: var(--text-primary); border: 1px solid var(--border-color); 
                     border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;
                     transition: all 0.2s;">
                    Details
                </button>
            </div>
        `;
        
        // Add event listeners
        setTimeout(() => {
            const visitBtn = this.tooltip.querySelector('#visitLink');
            const detailsBtn = this.tooltip.querySelector('#checkDetails');
            
            if (visitBtn) {
                visitBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.location.href = this.currentUrl;
                    this.hideTooltip();
                });
                
                visitBtn.addEventListener('mouseenter', () => {
                    visitBtn.style.transform = 'translateY(-1px)';
                    visitBtn.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                });
                
                visitBtn.addEventListener('mouseleave', () => {
                    visitBtn.style.transform = 'none';
                    visitBtn.style.boxShadow = 'none';
                });
            }
            
            if (detailsBtn) {
                detailsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    chrome.runtime.sendMessage({
                        action: 'analyzeUrlInPopup',
                        url: this.currentUrl
                    });
                    this.hideTooltip();
                });
            }
        }, 0);
        
        this.tooltip.style.display = 'block';
        this.positionTooltip(x, y);
    }
    
    positionTooltip(x, y) {
        if (!this.tooltip) return;
        
        const tooltipWidth = this.tooltip.offsetWidth;
        const tooltipHeight = this.tooltip.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Calculate position (prefer top-right of cursor)
        let posX = x + 15;
        let posY = y + 15;
        
        // Adjust if tooltip would go off screen
        if (posX + tooltipWidth > windowWidth) {
            posX = x - tooltipWidth - 15;
        }
        
        if (posY + tooltipHeight > windowHeight) {
            posY = y - tooltipHeight - 15;
        }
        
        // Ensure minimum distance from edges
        posX = Math.max(10, Math.min(posX, windowWidth - tooltipWidth - 10));
        posY = Math.max(10, Math.min(posY, windowHeight - tooltipHeight - 10));
        
        this.tooltip.style.left = posX + 'px';
        this.tooltip.style.top = posY + 'px';
    }
    
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }
    
    async analyzeUrl(url) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                const domain = this.extractDomain(url);
                const isShortened = this.isShortenedUrl(url);
                const score = this.calculateSafetyScore(url);
                const status = this.getSafetyStatus(score);
                
                resolve({
                    url,
                    domain,
                    score,
                    status,
                    description: this.getSafetyDescription(status),
                    isShortened,
                    details: {
                        riskLevel: this.getRiskLevel(score)
                    }
                });
            }, 800);
        });
    }
    
    // Helper Methods
    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return url.split('/')[0];
        }
    }
    
    isShortenedUrl(url) {
        const shortenedDomains = [
            'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 'is.gd',
            'buff.ly', 't.co', 'tiny.cc', 'shorturl.at', 'cutt.ly'
        ];
        const domain = this.extractDomain(url).toLowerCase();
        return shortenedDomains.some(short => domain.includes(short));
    }
    
    isSuspiciousUrl(url) {
        const suspiciousPatterns = [
            'login', 'verify', 'secure', 'account', 'update',
            'free', 'win', 'prize', 'click', 'offer', 'download'
        ];
        const urlLower = url.toLowerCase();
        return suspiciousPatterns.some(pattern => urlLower.includes(pattern));
    }
    
    calculateSafetyScore(url) {
        let score = 100;
        
        if (this.isShortenedUrl(url)) score -= 30;
        if (this.isSuspiciousUrl(url)) score -= 25;
        if (!url.startsWith('https://')) score -= 15;
        
        // Add some variation
        score += Math.floor(Math.random() * 20) - 10;
        
        return Math.max(0, Math.min(100, score));
    }
    
    getSafetyStatus(score) {
        if (score >= 80) return 'Safe';
        if (score >= 60) return 'Caution';
        return 'Dangerous';
    }
    
    getSafetyDescription(status) {
        const descriptions = {
            'Safe': 'Likely safe with normal precautions',
            'Caution': 'Review details before visiting',
            'Dangerous': 'Consider avoiding this URL'
        };
        return descriptions[status] || '';
    }
    
    getRiskLevel(score) {
        if (score >= 80) return 'Low';
        if (score >= 60) return 'Medium';
        return 'High';
    }
    
    getScoreColor(score) {
        if (score >= 80) return 'var(--theme-success-color)';
        if (score >= 60) return 'var(--theme-warning-color)';
        return 'var(--theme-danger-color)';
    }
    
    getScoreGradient(score) {
        if (score >= 80) return 'linear-gradient(135deg, var(--theme-success-color), #059669)';
        if (score >= 60) return 'linear-gradient(135deg, var(--theme-warning-color), #D97706)';
        return 'linear-gradient(135deg, var(--theme-danger-color), #DC2626)';
    }
    
    getStatusClass(score) {
        if (score >= 80) return 'status-indicator-safe';
        if (score >= 60) return 'status-indicator-caution';
        return 'status-indicator-danger';
    }
    
    truncateUrl(url, maxLength) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength - 3) + '...';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.safetyPreview = new SafetyPreview();
    });
} else {
    window.safetyPreview = new SafetyPreview();
}