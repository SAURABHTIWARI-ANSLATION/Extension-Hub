document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const elements = {
        urlInput: document.getElementById('urlInput'),
        analyzeBtn: document.getElementById('analyzeBtn'),
        resultsSection: document.getElementById('resultsSection'),
        scoreCircle: document.getElementById('scoreCircle'),
        scoreValue: document.getElementById('scoreValue'),
        safetyStatus: document.getElementById('safetyStatus'),
        safetyDescription: document.getElementById('safetyDescription'),
        visitBtn: document.getElementById('visitBtn'),
        blockBtn: document.getElementById('blockBtn'),
        historyList: document.getElementById('historyList'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn'),
        autoCheckToggle: document.getElementById('autoCheckToggle'),
        settingsBtn: document.getElementById('settingsBtn'),
        statusIndicator: document.getElementById('statusIndicator'),
        statusText: document.querySelector('.status-text'),
        statusDot: document.querySelector('.status-dot')
    };

    // Analysis Elements
    const analysisElements = {
        urlType: document.getElementById('urlType'),
        riskLevel: document.getElementById('riskLevel'),
        domainRep: document.getElementById('domainRep'),
        sslStatus: document.getElementById('sslStatus'),
        malwareStatus: document.getElementById('malwareStatus'),
        phishingRisk: document.getElementById('phishingRisk')
    };

    // State
    let currentAnalysis = null;
    let isAnalyzing = false;

    // Initialize
    initExtension();

    // Event Listeners
    elements.analyzeBtn.addEventListener('click', analyzeUrl);
    elements.urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') analyzeUrl();
    });
    elements.visitBtn.addEventListener('click', visitUrl);
    elements.blockBtn.addEventListener('click', blockUrl);
    elements.clearHistoryBtn.addEventListener('click', clearHistory);
    elements.settingsBtn.addEventListener('click', openSettings);
    elements.autoCheckToggle.addEventListener('change', toggleAutoCheck);

    // Functions
    function initExtension() {
        loadSettings();
        loadHistory();
        updateStatus('ready');
        
        // Set focus to input
        setTimeout(() => elements.urlInput.focus(), 100);
    }

    async function analyzeUrl() {
        const url = elements.urlInput.value.trim();
        if (!url || isAnalyzing) return;

        try {
            isAnalyzing = true;
            updateStatus('analyzing');
            
            // Validate URL format
            if (!isValidUrl(url)) {
                throw new Error('Invalid URL format');
            }

            // Show loading state
            showLoadingState();

            // Simulate analysis (replace with API calls in production)
            const result = await simulateSafetyAnalysis(url);
            
            // Display results
            displayResults(result);
            
            // Save to history
            saveToHistory(url, result);
            
            // Update status
            updateStatus('success');
            
        } catch (error) {
            console.error('Analysis error:', error);
            showErrorState(error.message);
            updateStatus('error');
        } finally {
            isAnalyzing = false;
        }
    }

    function simulateSafetyAnalysis(url) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const domain = extractDomain(url);
                const isShortened = isShortenedUrl(url);
                const isSuspicious = isSuspiciousUrl(url);
                
                // Calculate safety score
                let score = calculateSafetyScore(url);
                const status = getSafetyStatus(score);
                
                // Generate analysis data
                const analysis = {
                    url,
                    domain,
                    score,
                    status,
                    description: getSafetyDescription(status),
                    details: {
                        urlType: isShortened ? 'Shortened' : 'Direct',
                        riskLevel: getRiskLevel(score),
                        domainReputation: getDomainReputation(domain, score),
                        ssl: Math.random() > 0.15 ? 'Valid ✓' : 'Invalid ✗',
                        malware: Math.random() > 0.9 ? 'Detected ✗' : 'None ✓',
                        phishing: Math.random() > 0.85 ? 'High ✗' : 'Low ✓'
                    },
                    timestamp: new Date().toISOString(),
                    isShortened,
                    isSuspicious
                };
                
                resolve(analysis);
            }, 1500);
        });
    }

    function displayResults(analysis) {
        currentAnalysis = analysis;
        
        // Update main score display
        elements.scoreValue.textContent = analysis.score;
        elements.safetyStatus.textContent = analysis.status;
        elements.safetyDescription.textContent = analysis.description;
        
        // Update score circle style
        updateScoreCircle(analysis.score);
        
        // Update analysis details
        analysisElements.urlType.textContent = `Type: ${analysis.details.urlType}`;
        analysisElements.riskLevel.textContent = `Risk: ${analysis.details.riskLevel}`;
        analysisElements.domainRep.textContent = analysis.details.domainReputation;
        analysisElements.sslStatus.textContent = analysis.details.ssl;
        analysisElements.malwareStatus.textContent = analysis.details.malware;
        analysisElements.phishingRisk.textContent = analysis.details.phishing;
        
        // Style analysis values
        styleAnalysisValue(analysisElements.sslStatus, analysis.details.ssl.includes('✓'));
        styleAnalysisValue(analysisElements.malwareStatus, !analysis.details.malware.includes('✗'));
        styleAnalysisValue(analysisElements.phishingRisk, !analysis.details.phishing.includes('✗'));
        
        // Show results section
        elements.resultsSection.style.display = 'block';
        
        // Scroll to results
        elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function showLoadingState() {
        elements.scoreCircle.classList.add('pulse');
        elements.scoreValue.textContent = '--';
        elements.safetyStatus.textContent = 'Analyzing...';
        elements.safetyDescription.textContent = 'Checking URL against safety databases';
        
        // Reset analysis values
        Object.values(analysisElements).forEach(el => {
            el.textContent = '--';
            el.className = 'analysis-value';
        });
        
        elements.resultsSection.style.display = 'block';
    }

    function showErrorState(message) {
        elements.scoreCircle.classList.remove('pulse');
        elements.scoreCircle.style.background = 'var(--bg-secondary)';
        elements.scoreValue.textContent = '?';
        elements.safetyStatus.textContent = 'Error';
        elements.safetyDescription.textContent = message || 'Unable to analyze URL';
        
        Object.values(analysisElements).forEach(el => {
            el.textContent = 'Error';
            el.className = 'analysis-value bad';
        });
    }

    function updateScoreCircle(score) {
        elements.scoreCircle.classList.remove('pulse');
        
        // Remove existing score classes
        elements.scoreCircle.className = 'score-circle';
        
        // Add appropriate class based on score
        if (score >= 80) {
            elements.scoreCircle.classList.add('score-badge-safe');
        } else if (score >= 60) {
            elements.scoreCircle.classList.add('score-badge-caution');
        } else {
            elements.scoreCircle.classList.add('score-badge-danger');
        }
    }

    function styleAnalysisValue(element, isGood) {
        element.classList.add(isGood ? 'good' : 'bad');
    }

    function visitUrl() {
        if (currentAnalysis?.url) {
            chrome.tabs.create({ url: currentAnalysis.url });
        }
    }

    function blockUrl() {
        if (currentAnalysis?.url) {
            chrome.storage.local.get({blockedUrls: []}, (data) => {
                const blockedUrls = data.blockedUrls;
                if (!blockedUrls.includes(currentAnalysis.url)) {
                    blockedUrls.push(currentAnalysis.url);
                    chrome.storage.local.set({blockedUrls}, () => {
                        showNotification('URL added to blocked list');
                    });
                }
            });
        }
    }

    function loadHistory() {
        chrome.storage.local.get({history: []}, (data) => {
            const history = data.history || [];
            renderHistory(history);
        });
    }

    function renderHistory(history) {
        elements.historyList.innerHTML = '';
        
        if (history.length === 0) {
            elements.historyList.innerHTML = `
                <div class="empty-history">
                    <svg width="48" height="48" fill="var(--text-muted)" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <p>No recent checks</p>
                    <p class="empty-hint">Analyze a URL to see history here</p>
                </div>
            `;
            return;
        }
        
        // Show latest 6 items
        history.slice(-6).reverse().forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-url">${truncateUrl(item.url, 35)}</div>
                <div class="history-score ${getScoreClass(item.score)}">${item.score}</div>
            `;
            
            historyItem.addEventListener('click', () => {
                elements.urlInput.value = item.url;
                analyzeUrl();
            });
            
            elements.historyList.appendChild(historyItem);
        });
    }

    function saveToHistory(url, analysis) {
        chrome.storage.local.get({history: []}, (data) => {
            const history = data.history;
            
            // Remove duplicate if exists
            const filteredHistory = history.filter(item => item.url !== url);
            
            // Add new entry
            filteredHistory.push({
                url,
                score: analysis.score,
                status: analysis.status,
                timestamp: analysis.timestamp
            });
            
            // Keep only last 50 entries
            const trimmedHistory = filteredHistory.slice(-50);
            
            chrome.storage.local.set({history: trimmedHistory}, () => {
                renderHistory(trimmedHistory);
            });
        });
    }

    function clearHistory() {
        if (confirm('Clear all history? This cannot be undone.')) {
            chrome.storage.local.set({history: []}, () => {
                renderHistory([]);
                showNotification('History cleared');
            });
        }
    }

    function loadSettings() {
        chrome.storage.local.get({autoCheck: true}, (data) => {
            elements.autoCheckToggle.checked = data.autoCheck;
        });
    }

    function toggleAutoCheck() {
        chrome.storage.local.set({autoCheck: elements.autoCheckToggle.checked});
        showNotification(`Auto-check ${elements.autoCheckToggle.checked ? 'enabled' : 'disabled'}`);
    }

    function openSettings() {
        chrome.runtime.openOptionsPage();
    }

    function updateStatus(status) {
        const statusMap = {
            ready: { text: 'Ready', color: 'var(--theme-success-color)', dot: 'ready' },
            analyzing: { text: 'Analyzing...', color: 'var(--theme-warning-color)', dot: 'analyzing' },
            success: { text: 'Analysis complete', color: 'var(--theme-success-color)', dot: 'success' },
            error: { text: 'Analysis failed', color: 'var(--theme-danger-color)', dot: 'error' }
        };
        
        const statusInfo = statusMap[status] || statusMap.ready;
        
        elements.statusText.textContent = statusInfo.text;
        elements.statusDot.style.background = statusInfo.color;
        elements.statusDot.className = `status-dot ${statusInfo.dot}`;
    }

    function showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--theme-header-bg);
            color: var(--text-primary);
            padding: var(--space-sm) var(--space-md);
            border-radius: var(--border-radius-md);
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-lg);
            z-index: var(--z-toast);
            animation: slideIn var(--transition-normal);
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Helper Functions
    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    function extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }

    function isShortenedUrl(url) {
        const shortenedDomains = [
            'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 'is.gd',
            'buff.ly', 't.co', 'tiny.cc', 'shorturl.at', 'cutt.ly'
        ];
        const domain = extractDomain(url).toLowerCase();
        return shortenedDomains.some(short => domain.includes(short));
    }

    function isSuspiciousUrl(url) {
        const suspiciousPatterns = [
            'login', 'verify', 'secure', 'account', 'update',
            'free', 'win', 'prize', 'click', 'offer'
        ];
        return suspiciousPatterns.some(pattern => 
            url.toLowerCase().includes(pattern.toLowerCase())
        );
    }

    function calculateSafetyScore(url) {
        let score = 100;
        
        // Penalize shortened URLs
        if (isShortenedUrl(url)) score -= 30;
        
        // Penalize suspicious patterns
        if (isSuspiciousUrl(url)) score -= 25;
        
        // Penalize non-HTTPS
        if (!url.startsWith('https://')) score -= 15;
        
        // Random variation (simulate real analysis)
        score += Math.floor(Math.random() * 20) - 10;
        
        return Math.max(0, Math.min(100, score));
    }

    function getSafetyStatus(score) {
        if (score >= 80) return 'Safe';
        if (score >= 60) return 'Caution';
        return 'Dangerous';
    }

    function getSafetyDescription(status) {
        const descriptions = {
            'Safe': 'This URL appears safe to visit with normal precautions',
            'Caution': 'Proceed with caution - review details carefully',
            'Dangerous': 'High risk detected - consider avoiding this URL'
        };
        return descriptions[status] || 'Unable to determine safety';
    }

    function getRiskLevel(score) {
        if (score >= 80) return 'Low';
        if (score >= 60) return 'Medium';
        return 'High';
    }

    function getDomainReputation(domain, score) {
        if (score >= 80) return 'Good';
        if (score >= 60) return 'Fair';
        return 'Poor';
    }

    function getScoreClass(score) {
        if (score >= 80) return 'score-badge-safe';
        if (score >= 60) return 'score-badge-caution';
        return 'score-badge-danger';
    }

    function truncateUrl(url, maxLength = 35) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength - 3) + '...';
    }
});