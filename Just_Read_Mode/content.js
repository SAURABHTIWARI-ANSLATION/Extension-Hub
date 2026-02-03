class ReadingMode {
    constructor() {
        this.isActive = false;
        this.originalHTML = null;
        this.readingModeContainer = null;
        this.settings = {
            darkMode: false,
            serifFont: false,
            fontSize: 'medium',
            lineHeight: '1.6',
            autoDarkMode: false
        };
        
        this.init();
    }

    async init() {
        // Load settings
        const result = await chrome.storage.sync.get(['darkMode', 'serifFont', 'fontSize', 'lineHeight', 'autoDarkMode']);
        Object.assign(this.settings, result);

        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'enableReadingMode') {
                this.enable();
            } else if (request.action === 'disableReadingMode') {
                this.disable();
            } else if (request.action === 'settingsUpdated') {
                // Reload settings and update if reading mode is active
                this.loadSettings();
            }
            sendResponse({ success: true });
            return true;
        });

        // Listen for settings changes
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync') {
                if (changes.darkMode) this.settings.darkMode = changes.darkMode.newValue;
                if (changes.serifFont) this.settings.serifFont = changes.serifFont.newValue;
                if (changes.fontSize) this.settings.fontSize = changes.fontSize.newValue;
                if (changes.lineHeight) this.settings.lineHeight = changes.lineHeight.newValue;
                if (changes.autoDarkMode) this.settings.autoDarkMode = changes.autoDarkMode.newValue;
                
                if (this.isActive) {
                    this.updateStyles();
                }
            }
        });

        // Add keyboard shortcuts
        this.addKeyboardShortcuts();
    }

    async loadSettings() {
        const result = await chrome.storage.sync.get(['darkMode', 'serifFont', 'fontSize', 'lineHeight', 'autoDarkMode']);
        Object.assign(this.settings, result);
        if (this.isActive) {
            this.updateStyles();
        }
    }

    enable() {
        if (this.isActive) return;

        this.isActive = true;
        this.originalHTML = document.documentElement.outerHTML;
        
        this.createReadingMode();
        this.applyStyles();
        this.addControls();
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('readingModeEnabled'));
    }

    disable() {
        if (!this.isActive) return;

        this.isActive = false;
        
        if (this.originalHTML) {
            document.documentElement.innerHTML = this.originalHTML;
        }
        
        if (this.readingModeContainer) {
            document.body.removeChild(this.readingModeContainer);
            this.readingModeContainer = null;
        }
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('readingModeDisabled'));
    }

    createReadingMode() {
        // Save original content
        const articleContent = this.extractArticleContent();
        
        // Create reading mode container
        this.readingModeContainer = document.createElement('div');
        this.readingModeContainer.id = 'just-read-container';
        this.readingModeContainer.innerHTML = `
            <div id="just-read-header">
                <button id="just-read-close" title="Exit reading mode (ESC)">×</button>
                <div id="just-read-controls">
                    <button class="control-btn" data-action="font-smaller">A-</button>
                    <button class="control-btn" data-action="font-larger">A+</button>
                    <button class="control-btn" data-action="print">🖨️</button>
                </div>
            </div>
            <main id="just-read-content">
                <article>
                    ${articleContent}
                </article>
            </main>
        `;
        
        // Replace body content
        document.body.innerHTML = '';
        document.body.appendChild(this.readingModeContainer);
        
        // Add event listeners to controls
        this.addControlListeners();
    }

    extractArticleContent() {
        // Try to find main article content
        let content = '';
        
        // Common article selectors
        const selectors = [
            'article',
            'main',
            '.post-content',
            '.article-content',
            '.entry-content',
            '.content',
            '#content',
            '.story',
            '.post',
            '[role="main"]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.length > 500) {
                content = element.innerHTML;
                break;
            }
        }
        
        // If no article found, use the whole page body
        if (!content) {
            const bodyClone = document.body.cloneNode(true);
            
            // Remove common non-content elements
            const elementsToRemove = bodyClone.querySelectorAll(
                'nav, header, footer, aside, .sidebar, .ad, .advertisement, iframe, script, style, noscript, .comments, .social-share'
            );
            elementsToRemove.forEach(el => el.remove());
            
            content = bodyClone.innerHTML;
        }
        
        return content;
    }

    applyStyles() {
        const style = document.createElement('style');
        style.id = 'just-read-styles';
        style.textContent = this.generateCSS();
        document.head.appendChild(style);
    }

    generateCSS() {
        const fontSizeMap = {
            small: '16px',
            medium: '18px',
            large: '20px',
            xlarge: '22px'
        };
        
        const lineHeight = this.settings.lineHeight || '1.6';
        
        const fontFamily = this.settings.serifFont 
            ? "'Georgia', 'Times New Roman', serif"
            : "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', sans-serif";
        
        const isDark = this.settings.autoDarkMode 
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
            : this.settings.darkMode;
        
        return `
            #just-read-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                line-height: ${lineHeight};
                font-size: ${fontSizeMap[this.settings.fontSize] || '18px'};
                font-family: ${fontFamily};
            }
            
            ${isDark ? `
                body {
                    background-color: #1a1a1a !important;
                    color: #e0e0e0 !important;
                }
                #just-read-container {
                    background-color: #2d2d2d;
                    color: #e0e0e0;
                }
                #just-read-header {
                    background-color: #1a1a1a;
                    border-bottom: 1px solid #444;
                }
                .control-btn {
                    background-color: #444;
                    color: #fff;
                }
                #just-read-content {
                    background-color: #2d2d2d;
                }
                a {
                    color: #64b5f6;
                }
                h1, h2, h3, h4, h5, h6 {
                    color: #fff;
                }
                code, pre {
                    background-color: #333;
                    color: #e0e0e0;
                }
                blockquote {
                    border-left: 4px solid #666;
                    color: #aaa;
                }
            ` : `
                body {
                    background-color: #f5f5f5 !important;
                }
                #just-read-container {
                    background-color: white;
                    color: #333;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                }
                #just-read-header {
                    background-color: #4285f4;
                    color: white;
                }
                .control-btn {
                    background-color: #f0f0f0;
                    color: #333;
                }
                a {
                    color: #4285f4;
                }
                code, pre {
                    background-color: #f5f5f5;
                }
                blockquote {
                    border-left: 4px solid #ddd;
                    color: #666;
                }
            `}
            
            #just-read-header {
                position: sticky;
                top: 0;
                z-index: 1000;
                padding: 10px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            #just-read-close {
                background: none;
                border: none;
                color: inherit;
                font-size: 24px;
                cursor: pointer;
                padding: 0 10px;
                opacity: 0.8;
            }
            
            #just-read-close:hover {
                opacity: 1;
            }
            
            #just-read-controls {
                display: flex;
                gap: 5px;
            }
            
            .control-btn {
                border: none;
                border-radius: 4px;
                padding: 5px 10px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .control-btn:hover {
                opacity: 0.8;
            }
            
            #just-read-content {
                padding: 40px 20px;
            }
            
            #just-read-content img {
                max-width: 100%;
                height: auto;
            }
            
            #just-read-content iframe {
                max-width: 100%;
            }
            
            #just-read-content table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            
            #just-read-content table th,
            #just-read-content table td {
                border: 1px solid #ddd;
                padding: 8px;
            }
            
            #just-read-content blockquote {
                margin: 20px 0;
                padding-left: 20px;
                font-style: italic;
            }
            
            #just-read-content code {
                padding: 2px 4px;
                border-radius: 3px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            }
            
            #just-read-content pre {
                padding: 10px;
                border-radius: 5px;
                overflow-x: auto;
            }
            
            @media print {
                #just-read-header {
                    display: none !important;
                }
            }
        `;
    }

    addControls() {
        // Add close button functionality
        const closeBtn = document.getElementById('just-read-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.disable());
        }
        
        // Add control buttons functionality
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Get the button element (in case emoji/text is clicked)
                const button = e.currentTarget;
                const action = button.dataset.action;
                if (action) {
                    this.handleControlAction(action);
                }
            });
        });
    }

    handleControlAction(action) {
        switch(action) {
            case 'font-smaller':
                this.adjustFontSize(-1);
                break;
            case 'font-larger':
                this.adjustFontSize(1);
                break;
            case 'print':
                window.print();
                break;
        }
    }

    adjustFontSize(direction) {
        const container = document.getElementById('just-read-container');
        if (!container) return;
        
        const currentSize = parseFloat(window.getComputedStyle(container).fontSize);
        const newSize = currentSize + (direction * 2);
        container.style.fontSize = `${newSize}px`;
    }

    toggleDarkMode() {
        // Toggle dark mode
        this.settings.darkMode = !this.settings.darkMode;
        
        // Save to storage
        chrome.storage.sync.set({ darkMode: this.settings.darkMode });
        
        // Update the visual immediately
        this.updateStyles();
        
        console.log('Dark mode toggled:', this.settings.darkMode);
    }

    updateStyles() {
        const styleElement = document.getElementById('just-read-styles');
        if (styleElement) {
            styleElement.textContent = this.generateCSS();
        }
    }

    addControlListeners() {
        // Close button
        const closeBtn = document.getElementById('just-read-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.disable());
        }
        
        // Control buttons
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Get the button element (in case emoji/text is clicked)
                const button = e.currentTarget;
                const action = button.dataset.action;
                if (action) {
                    this.handleControlAction(action);
                }
            });
        });
    }

    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                e.preventDefault();
                this.disable();
            }
            
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                this.isActive ? this.disable() : this.enable();
            }
            
            if (this.isActive) {
                if ((e.ctrlKey || e.metaKey) && e.key === '+') {
                    e.preventDefault();
                    this.adjustFontSize(1);
                }
                if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                    e.preventDefault();
                    this.adjustFontSize(-1);
                }
            }
        });
    }
}

// Initialize reading mode
const readingMode = new ReadingMode();