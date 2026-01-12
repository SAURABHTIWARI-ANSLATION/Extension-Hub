class JobPageAnalyzer {
    constructor() {
        this.scamPatterns = this.initializePatterns();
        this.domainPatterns = this.initializeDomainPatterns();
        this.settings = {
            sensitivity: 'medium'
        };
        this.initialize();
    }

    initializePatterns() {
        return {
            financialScams: {
                level: 'high',
                patterns: [
                    /registration\s*(fee|charge|payment)/gi,
                    /pay\s*(to|for)\s*(apply|application|process)/gi,
                    /money\s*(transfer|deposit|advance)/gi,
                    /upfront\s*(payment|fee|cost)/gi,
                    /investment\s*(required|needed)/gi,
                    /training\s*(fee|cost|payment)/gi
                ],
                description: 'Requests for upfront payments or fees',
                examples: ['registration fee', 'pay to apply', 'upfront payment']
            },
            urgencyPressure: {
                level: 'medium',
                patterns: [
                    /urgent\s*(hiring|required|position)/gi,
                    /immediate\s*(start|joining)/gi,
                    /limited\s*(time|spots|offer)/gi,
                    /apply\s*(now|immediately|asap)/gi,
                    /last\s*(chance|opportunity)/gi,
                    /quick\s*(money|cash|earning)/gi
                ],
                description: 'Creates artificial urgency or pressure',
                examples: ['urgent hiring', 'immediate start', 'limited time offer']
            },
            contactRedFlags: {
                level: 'high',
                patterns: [
                    /whatsapp\s*(only|contact|message)/gi,
                    /telegram\s*(only|contact)/gi,
                    /@gmail\.com\s*(only|contact)/gi,
                    /@yahoo\.com\s*(only|contact)/gi,
                    /personal\s*email\s*(only|required)/gi,
                    /text\s*(only|message)\s*to/gi
                ],
                description: 'Unprofessional contact methods',
                examples: ['WhatsApp only', 'personal email required']
            },
            salaryPromises: {
                level: 'medium',
                patterns: [
                    /guaranteed\s*(salary|income|earning)/gi,
                    /earn\s*\$?\d+[kK]?\s*(per|month|week)/gi,
                    /high\s*(salary|pay|income)/gi,
                    /work\s*from\s*home\s*\$\d+/gi,
                    /no\s*experience\s*high\s*pay/gi
                ],
                description: 'Unrealistic salary promises',
                examples: ['guaranteed income', 'earn $5000/month from home']
            },
            processRedFlags: {
                level: 'medium',
                patterns: [
                    /no\s*(interview|experience|skills)\s*required/gi,
                    /instant\s*(hiring|job|approval)/gi,
                    /simple\s*(process|registration)/gi,
                    /just\s*submit\s*(details|information)/gi,
                    /auto\s*selection/gi
                ],
                description: 'Suspicious hiring process',
                examples: ['no interview required', 'instant hiring']
            },
            grammarIssues: {
                level: 'low',
                patterns: [
                    /congratulations\s*!{2,}/gi,
                    /dear\s*applicant/gi,
                    /kindly\s*(contact|reply|send)/gi,
                    /multiple\s*!{2,}/gi,
                    /all\s*caps\s*sentences/gi,
                    /poor\s*grammar\s*throughout/gi
                ],
                description: 'Poor grammar and formatting',
                examples: ['CONGRATULATIONS!!', 'kindly send your details']
            },
            remoteWorkScams: {
                level: 'high',
                patterns: [
                    /data\s*entry\s*\$\d+/gi,
                    /mystery\s*shopper/gi,
                    /package\s*forwarding/gi,
                    /re-shipping\s*job/gi,
                    /payment\s*processing/gi
                ],
                description: 'Common remote work scam types',
                examples: ['data entry $500/week', 'mystery shopper job']
            }
        };
    }

    initializeDomainPatterns() {
        return {
            newDomains: /domain\s*(created|registered)\s*within\s*\d+\s*(days|months)/gi,
            freeHosting: /(blogspot|wordpress|weebly|wix)\./gi,
            suspiciousTLD: /\.(xyz|top|club|loan|download)/gi
        };
    }
    
    isJobSite(url) {
        if (!url) return false;
        
        const jobSitePatterns = [
            /linkedin\.com\/jobs/, 
            /indeed\.com/, 
            /glassdoor\.com\/Job/, 
            /monster\.com/, 
            /careerbuilder\.com/, 
            /ziprecruiter\.com/, 
            /dice\.com/, 
            /angel\.co\/jobs/, 
            /remote\.co/, 
            /flexjobs\.com/, 
            /upwork\.com/, 
            /fiverr\.com/, 
            /simplyhired\.com/, 
            /jobsite\.co\.uk/, 
            /totaljobs\.com/, 
            /reed\.co\.uk/, 
            /seek\.com\.au/, 
            /jobstreet\.com/, 
            /naukri\.com/, 
            /hire\.com/, 
            /hired\.com/, 
            /\bcareers?\b/, 
            /\bjobs?\b/, 
            /\bhiring\b/, 
            /\bemployment\b/, 
            /\bpositions?\b/
        ];
        
        return jobSitePatterns.some(pattern => pattern.test(url.toLowerCase()));
    }

    async initialize() {
        // Check if service worker is available
        if (!chrome.runtime || !chrome.storage) {
            console.error('JobShield: Service worker not available');
            return;
        }
        
        this.loadSettings();
        this.setupMessageListener();
        
        // Only inject badge if showBadge setting is enabled
        chrome.storage.local.get(['showBadge'], (result) => {
            if (result.showBadge !== false) {
                this.injectStatusBadge();
            }
        });
        
        // Auto-scan if enabled
        chrome.storage.local.get(['autoScan'], (result) => {
            if (result.autoScan !== false) {
                setTimeout(() => this.analyzePageContent(), 1000);
            }
        });
    }

    loadSettings() {
        chrome.storage.local.get(['sensitivityLevel'], (result) => {
            this.settings.sensitivity = result.sensitivityLevel || 'medium';
        });
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            try {
                if (request.action === 'analyzePage') {
                    this.settings.sensitivity = request.sensitivity || 'medium';
                    const result = this.analyzePageContent();
                    sendResponse(result);
                    return true;
                }
            } catch (error) {
                console.error('Content script message handler error:', error);
                sendResponse({ error: 'Content script error: ' + error.message });
                return true;
            }
        });
    }

    analyzePageContent() {
        const startTime = performance.now();
        const pageText = this.extractPageText();
        const wordsScanned = pageText.split(/\s+/).length;
        
        const redFlags = this.detectRedFlags(pageText);
        const domainInfo = this.analyzeDomain();
        const riskScore = this.calculateRiskScore(redFlags);
        
        const analysisTime = Math.round(performance.now() - startTime);
        
        this.updateStatusBadge(riskScore, redFlags.length);
        
        return {
            riskScore,
            redFlags,
            domain: domainInfo.domain,
            domainAge: domainInfo.age,
            analysisTime,
            wordsScanned,
            pageTitle: document.title,
            url: window.location.href
        };
    }

    extractPageText() {
        // Get text from main content areas without hiding elements to avoid layout disruption
        const contentSelectors = [
            'main',
            'article',
            '.job-description',
            '.job-posting',
            '#job-details',
            '.description'
            // Note: avoiding 'body' to focus on actual content areas
        ];
        
        let allText = '';
        contentSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Only extract text from elements that are visible and not hidden
                const computedStyle = window.getComputedStyle(el);
                if (computedStyle.display !== 'none' && 
                    computedStyle.visibility !== 'hidden' &&
                    computedStyle.opacity !== '0') {
                    allText += ' ' + el.textContent;
                }
            });
        });
        
        // If no content found in specific selectors, fallback to body but more carefully
        if (allText.trim().length < 100) {
            const bodyElement = document.body;
            if (bodyElement) {
                allText += ' ' + bodyElement.textContent;
            }
        }
        
        return allText.toLowerCase();
    }

    detectRedFlags(text) {
        const detectedFlags = [];
        
        Object.entries(this.scamPatterns).forEach(([category, config]) => {
            config.patterns.forEach(pattern => {
                const matches = text.match(pattern);
                if (matches && matches.length > 0) {
                    // Check sensitivity threshold
                    const threshold = this.getSensitivityThreshold(config.level);
                    if (matches.length >= threshold) {
                        detectedFlags.push({
                            type: this.formatCategoryName(category),
                            level: config.level,
                            description: config.description,
                            examples: config.examples,
                            count: matches.length,
                            matches: matches.slice(0, 5) // Limit matches for privacy
                        });
                    }
                }
            });
        });
        
        // Sort by level (high to low)
        const levelOrder = { high: 3, medium: 2, low: 1 };
        detectedFlags.sort((a, b) => levelOrder[b.level] - levelOrder[a.level]);
        
        return detectedFlags;
    }

    getSensitivityThreshold(level) {
        const thresholds = {
            low: { low: 5, medium: 3, high: 1 },
            medium: { low: 3, medium: 2, high: 1 },
            high: { low: 1, medium: 1, high: 1 }
        };
        return thresholds[this.settings.sensitivity][level] || 1;
    }

    formatCategoryName(category) {
        return category
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace('Scams', ' Scams');
    }

    analyzeDomain() {
        const url = new URL(window.location.href);
        const domain = url.hostname;
        
        // Check for suspicious domain patterns
        let age = 'unknown';
        let isSuspicious = false;
        
        // Simple heuristic for domain age (in real app, would use WHOIS API)
        if (domain.includes('new-') || domain.includes('fresh-')) {
            age = 'possibly new';
            isSuspicious = true;
        }
        
        // Check TLD
        const suspiciousTLDs = ['.xyz', '.top', '.club', '.loan', '.download', '.gq', '.ml'];
        if (suspiciousTLDs.some(tld => domain.endsWith(tld))) {
            isSuspicious = true;
        }
        
        return {
            domain,
            age,
            isSuspicious,
            isSecure: url.protocol === 'https:'
        };
    }

    calculateRiskScore(redFlags) {
        let score = 0;
        const weights = { high: 15, medium: 10, low: 5 };
        
        redFlags.forEach(flag => {
            score += weights[flag.level] * Math.min(flag.count, 5); // Cap count effect
        });
        
        // Adjust based on sensitivity
        const sensitivityMultiplier = {
            low: 0.7,
            medium: 1.0,
            high: 1.3
        };
        
        score *= sensitivityMultiplier[this.settings.sensitivity];
        
        // Cap at 100
        return Math.min(100, score);
    }

    injectStatusBadge() {
        // Check if badge already exists
        if (document.getElementById('jobshield-badge')) return;
        
        // Check if we're on a job-related site before injecting
        if (!this.isJobSite(window.location.href)) {
            return; // Don't inject badge on non-job sites
        }
        
        const badge = document.createElement('div');
        badge.id = 'jobshield-badge';
        badge.innerHTML = `
            <div class="jobshield-badge-container">
                <div class="jobshield-badge-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div class="jobshield-badge-content">
                    <div class="jobshield-status" id="jobshield-status">Analyzing...</div>
                    <div class="jobshield-score" id="jobshield-score">-</div>
                </div>
                <button class="jobshield-close" id="jobshield-close">&times;</button>
            </div>
        `;
        
        // Add Font Awesome if not already present
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const faLink = document.createElement('link');
            faLink.rel = 'stylesheet';
            faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(faLink);
        }
        
        document.body.appendChild(badge);
        
        // Add badge styles
        this.injectBadgeStyles();
        
        // Close button functionality
        document.getElementById('jobshield-close').addEventListener('click', () => {
            badge.style.display = 'none';
        });
        
        // Load badge visibility setting
        chrome.storage.local.get(['showBadge'], (result) => {
            if (result.showBadge === false) {
                badge.style.display = 'none';
            }
        });
    }

    injectBadgeStyles() {
        const styles = `
            #jobshield-badge {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 2147483647; /* Maximum z-index value */
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 13px;
                min-width: 240px;
                max-width: 280px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
                border: 1px solid #e0e0e0;
                overflow: hidden;
                transition: transform 0.2s ease, opacity 0.2s ease;
                opacity: 0.95;
            }
            
            #jobshield-badge:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                opacity: 1;
            }
            
            .jobshield-badge-container {
                display: flex;
                align-items: center;
                padding: 10px 12px;
                gap: 10px;
            }
            
            .jobshield-badge-icon {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 14px;
                flex-shrink: 0;
            }
            
            .jobshield-badge-content {
                flex-grow: 1;
                min-width: 0;
            }
            
            .jobshield-status {
                font-weight: 600;
                color: #333;
                margin-bottom: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-size: 12px;
            }
            
            .jobshield-score {
                font-size: 11px;
                color: #666;
                font-weight: 500;
            }
            
            .jobshield-close {
                background: none;
                border: none;
                color: #999;
                font-size: 16px;
                cursor: pointer;
                padding: 2px 4px;
                line-height: 1;
                transition: color 0.2s;
                flex-shrink: 0;
            }
            
            .jobshield-close:hover {
                color: #ff4444;
            }
            
            /* Status-specific colors */
            #jobshield-badge.safe .jobshield-badge-icon {
                background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
            }
            
            #jobshield-badge.suspicious .jobshield-badge-icon {
                background: linear-gradient(135deg, #FF9800 0%, #EF6C00 100%);
            }
            
            #jobshield-badge.danger .jobshield-badge-icon {
                background: linear-gradient(135deg, #F44336 0%, #C62828 100%);
            }
            
            @media (max-width: 768px) {
                #jobshield-badge {
                    top: 10px;
                    right: 10px;
                    left: auto;
                    max-width: 200px;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    updateStatusBadge(riskScore, flagCount) {
        const badge = document.getElementById('jobshield-badge');
        const statusElement = document.getElementById('jobshield-status');
        const scoreElement = document.getElementById('jobshield-score');
        
        if (!badge) return;
        
        let status, statusClass, iconClass;
        
        if (riskScore < 30) {
            status = '✅ Safe';
            statusClass = 'safe';
            iconClass = 'fas fa-check-circle';
        } else if (riskScore < 70) {
            status = '⚠️ Suspicious';
            statusClass = 'suspicious';
            iconClass = 'fas fa-exclamation-triangle';
        } else {
            status = '❌ High Risk';
            statusClass = 'danger';
            iconClass = 'fas fa-times-circle';
        }
        
        // Update badge class
        badge.className = statusClass;
        
        // Update icon
        const iconElement = badge.querySelector('.jobshield-badge-icon i');
        if (iconElement) {
            iconElement.className = iconClass;
        }
        
        // Update status text
        if (statusElement) {
            statusElement.textContent = status;
        }
        
        // Update score text
        if (scoreElement) {
            scoreElement.textContent = `Risk: ${Math.round(riskScore)}% | Flags: ${flagCount}`;
        }
        
        // Show badge
        badge.style.display = 'block';
    }
}

// Initialize the analyzer
new JobPageAnalyzer();