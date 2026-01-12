document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const elements = {
        // Tabs
        formatTabs: document.querySelectorAll('.format-tab'),
        
        // Input
        inputText: document.getElementById('inputText'),
        clearBtn: document.getElementById('clearBtn'),
        pasteBtn: document.getElementById('pasteBtn'),
        sampleBtn: document.getElementById('sampleBtn'),
        
        // Format Options
        formatBtn: document.getElementById('formatBtn'),
        validateBtn: document.getElementById('validateBtn'),
        minifyBtn: document.getElementById('minifyBtn'),
        escapeBtn: document.getElementById('escapeBtn'),
        convertBtn: document.getElementById('convertBtn'),
        
        // JSON Options
        jsonSortKeys: document.getElementById('jsonSortKeys'),
        jsonQuoteKeys: document.getElementById('jsonQuoteKeys'),
        jsonIndent: document.getElementById('jsonIndent'),
        
        // XML Options
        xmlSelfClose: document.getElementById('xmlSelfClose'),
        xmlAttributes: document.getElementById('xmlAttributes'),
        xmlIndent: document.getElementById('xmlIndent'),
        
        // General Options
        highlightSyntax: document.getElementById('highlightSyntax'),
        lineNumbers: document.getElementById('lineNumbers'),
        autoFormat: document.getElementById('autoFormat'),
        
        // Output
        outputText: document.getElementById('outputText'),
        copyBtn: document.getElementById('copyBtn'),
        downloadBtn: document.getElementById('downloadBtn'),
        expandBtn: document.getElementById('expandBtn'),
        outputFormat: document.getElementById('outputFormat'),
        
        // Stats
        charCount: document.getElementById('charCount'),
        lineCount: document.getElementById('lineCount'),
        sizeInfo: document.getElementById('sizeInfo'),
        outputSize: document.getElementById('outputSize'),
        outputTime: document.getElementById('outputTime'),
        
        // Status
        detectedFormat: document.getElementById('detectedFormat'),
        statusIcon: document.getElementById('statusIcon'),
        statusText: document.getElementById('statusText'),
        autoFormatStatus: document.getElementById('autoFormatStatus'),
        quickFormatToggle: document.getElementById('quickFormatToggle'),
        
        // Settings
        settingsBtn: document.getElementById('settingsBtn')
    };

    // State
    let currentFormat = 'auto';
    let currentOutput = '';
    let lastFormatTime = 0;
    let settings = {};

    // Initialize
    init();

    // Event Listeners
    elements.formatTabs.forEach(tab => {
        tab.addEventListener('click', () => switchFormat(tab.dataset.format));
    });

    elements.inputText.addEventListener('input', handleInput);
    elements.inputText.addEventListener('paste', handlePaste);
    
    elements.clearBtn.addEventListener('click', clearInput);
    elements.pasteBtn.addEventListener('click', pasteFromClipboard);
    elements.sampleBtn.addEventListener('click', loadSampleData);
    
    elements.formatBtn.addEventListener('click', formatData);
    elements.validateBtn.addEventListener('click', validateData);
    elements.minifyBtn.addEventListener('click', minifyData);
    elements.escapeBtn.addEventListener('click', toggleEscape);
    elements.convertBtn.addEventListener('click', convertFormat);
    
    elements.copyBtn.addEventListener('click', copyToClipboard);
    elements.downloadBtn.addEventListener('click', downloadOutput);
    elements.expandBtn.addEventListener('click', expandView);
    
    elements.settingsBtn.addEventListener('click', openSettings);
    elements.quickFormatToggle.addEventListener('click', toggleQuickFormat);

    // Initialize
    function init() {
        loadSettings();
        setupEventListeners();
        updateStats();
        updateStatus('ready', 'Ready to format');
    }

    function loadSettings() {
        chrome.storage.local.get({
            autoFormat: false,
            defaultFormat: 'auto',
            indentSize: '4',
            sortKeys: true,
            syntaxHighlight: true,
            lineNumbers: true,
            theme: 'ocean-blue'
        }, function(data) {
            settings = data;
            applySettings();
        });
    }

    function applySettings() {
        if (settings.defaultFormat && settings.defaultFormat !== 'auto') {
            switchFormat(settings.defaultFormat);
        }
        
        elements.autoFormat.checked = settings.autoFormat;
        elements.jsonIndent.value = settings.indentSize;
        elements.xmlIndent.value = settings.indentSize;
        elements.jsonSortKeys.checked = settings.sortKeys;
        elements.highlightSyntax.checked = settings.syntaxHighlight;
        elements.lineNumbers.checked = settings.lineNumbers;
        
        updateAutoFormatStatus();
    }

    function setupEventListeners() {
        // Format on Ctrl+Enter
        elements.inputText.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                formatData();
            }
        });

        // Auto-format when enabled
        elements.autoFormat.addEventListener('change', () => {
            if (elements.autoFormat.checked && elements.inputText.value.trim()) {
                formatData();
            }
        });
    }

    // Format Switching
    function switchFormat(format) {
        currentFormat = format;
        
        // Update tabs
        elements.formatTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.format === format);
        });
        
        // Show/hide format-specific options
        document.querySelectorAll('.option-group[data-format]').forEach(group => {
            group.style.display = group.dataset.format === format || group.dataset.format === 'json' && format === 'auto' ? 'flex' : 'none';
        });
        
        // Update detected format indicator
        updateFormatIndicator();
        
        // Auto-format if there's input
        if (elements.inputText.value.trim() && settings.autoFormat) {
            formatData();
        }
    }

    function updateFormatIndicator() {
        const indicator = elements.detectedFormat;
        const text = currentFormat === 'auto' ? 'Auto-detect' : 
                    currentFormat === 'json' ? 'JSON' : 'XML';
        
        indicator.innerHTML = `
            <span class="status-dot ${currentFormat === 'auto' ? 'status-info' : 
                                      currentFormat === 'json' ? 'status-success' : 'status-warning'}"></span>
            <span>${text}</span>
        `;
    }

    // Input Handling
    function handleInput() {
        updateStats();
        
        // Auto-detect format if set to auto
        if (currentFormat === 'auto') {
            detectFormat();
        }
        
        // Auto-format if enabled
        if (settings.autoFormat && elements.inputText.value.trim()) {
            const now = Date.now();
            if (now - lastFormatTime > 500) { // Debounce
                lastFormatTime = now;
                setTimeout(formatData, 300);
            }
        }
    }

    function handlePaste(e) {
        // Let the paste happen first, then process
        setTimeout(() => {
            updateStats();
            if (settings.autoFormat) {
                formatData();
            }
        }, 10);
    }

    function clearInput() {
        elements.inputText.value = '';
        elements.outputText.innerHTML = `
            <div class="empty-output">
                <svg width="48" height="48" fill="var(--text-muted)" viewBox="0 0 24 24">
                    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM7 13H17V15H7V13ZM7 17H14V19H7V17Z"/>
                </svg>
                <p>Formatted output will appear here</p>
                <p class="empty-hint">Click "Format Now" or paste data to begin</p>
            </div>
        `;
        updateStats();
        updateStatus('ready', 'Input cleared');
    }

    async function pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            elements.inputText.value = text;
            updateStats();
            updateStatus('success', 'Pasted from clipboard');
            
            if (settings.autoFormat) {
                formatData();
            }
        } catch (err) {
            updateStatus('error', 'Failed to paste from clipboard');
            console.error('Failed to paste:', err);
        }
    }

    function loadSampleData() {
        const samples = {
            json: `{"glossary":{"title":"example glossary","GlossDiv":{"title":"S","GlossList":{"GlossEntry":{"ID":"SGML","SortAs":"SGML","GlossTerm":"Standard Generalized Markup Language","Acronym":"SGML","Abbrev":"ISO 8879:1986","GlossDef":{"para":"A meta-markup language, used to create markup languages such as DocBook.","GlossSeeAlso":["GML","XML"]},"GlossSee":"markup"}}}}}`,
            xml: `<?xml version="1.0" encoding="UTF-8"?><catalog><book id="bk101"><author>Gambardella, Matthew</author><title>XML Developer's Guide</title><genre>Computer</genre><price>44.95</price><publish_date>2000-10-01</publish_date><description>An in-depth look at creating applications with XML.</description></book><book id="bk102"><author>Ralls, Kim</author><title>Midnight Rain</title><genre>Fantasy</genre><price>5.95</price><publish_date>2000-12-16</publish_date><description>A former architect battles corporate zombies.</description></book></catalog>`
        };

        const format = currentFormat === 'auto' ? 'json' : currentFormat;
        elements.inputText.value = samples[format];
        updateStats();
        updateStatus('info', `Loaded ${format.toUpperCase()} sample`);
        
        if (settings.autoFormat) {
            formatData();
        }
    }

    function updateStats() {
        const text = elements.inputText.value;
        const chars = text.length;
        const lines = text.split('\n').length;
        const bytes = new TextEncoder().encode(text).length;
        
        elements.charCount.textContent = `${chars.toLocaleString()} characters`;
        elements.lineCount.textContent = `${lines.toLocaleString()} lines`;
        elements.sizeInfo.textContent = `${formatBytes(bytes)}`;
    }

    // Format Detection
    function detectFormat() {
        const text = elements.inputText.value.trim();
        
        if (!text) {
            elements.detectedFormat.querySelector('span:last-child').textContent = 'Auto-detect';
            return;
        }
        
        // Try to detect format
        if (isJSON(text)) {
            elements.detectedFormat.querySelector('span:last-child').textContent = 'JSON detected';
            elements.detectedFormat.querySelector('.status-dot').className = 'status-dot status-success';
        } else if (isXML(text)) {
            elements.detectedFormat.querySelector('span:last-child').textContent = 'XML detected';
            elements.detectedFormat.querySelector('.status-dot').className = 'status-dot status-warning';
        } else {
            elements.detectedFormat.querySelector('span:last-child').textContent = 'Unknown format';
            elements.detectedFormat.querySelector('.status-dot').className = 'status-dot status-error';
        }
    }

    function isJSON(text) {
        try {
            JSON.parse(text);
            return true;
        } catch {
            return false;
        }
    }

    function isXML(text) {
        const trimmed = text.trim();
        return (
            trimmed.startsWith('<?xml') ||
            trimmed.startsWith('<') && trimmed.endsWith('>') ||
            /^<[a-zA-Z][^>]*>/.test(trimmed)
        );
    }

    // Formatting Functions
    function formatData() {
        const startTime = performance.now();
        const input = elements.inputText.value.trim();
        
        if (!input) {
            updateStatus('error', 'No input to format');
            return;
        }
        
        updateStatus('info', 'Formatting...');
        
        try {
            let result;
            let format = currentFormat;
            
            // Auto-detect if needed
            if (format === 'auto') {
                format = isJSON(input) ? 'json' : isXML(input) ? 'xml' : null;
            }
            
            if (!format) {
                throw new Error('Unable to detect format. Please specify JSON or XML.');
            }
            
            // Format based on type
            if (format === 'json') {
                result = formatJSON(input);
                elements.outputFormat.textContent = 'JSON';
            } else {
                result = formatXML(input);
                elements.outputFormat.textContent = 'XML';
            }
            
            // Update output
            currentOutput = result.formatted;
            displayOutput(result.formatted, format);
            
            // Update stats
            const endTime = performance.now();
            const time = Math.round(endTime - startTime);
            const size = new TextEncoder().encode(currentOutput).length;
            
            elements.outputTime.textContent = `${time}ms`;
            elements.outputSize.textContent = formatBytes(size);
            
            updateStatus('success', `Formatted as ${format.toUpperCase()} in ${time}ms`);
            
        } catch (error) {
            displayError(error.message);
            updateStatus('error', `Format error: ${error.message}`);
        }
    }

    function formatJSON(input) {
        const obj = JSON.parse(input);
        const indent = elements.jsonIndent.value === 'tab' ? '\t' : 
                      elements.jsonIndent.value === '0' ? 0 : 
                      parseInt(elements.jsonIndent.value);
        
        let formatted;
        if (elements.jsonSortKeys.checked) {
            formatted = JSON.stringify(obj, Object.keys(obj).sort(), indent);
        } else {
            formatted = JSON.stringify(obj, null, indent);
        }
        
        // Ensure quotes if needed
        if (!elements.jsonQuoteKeys.checked && indent !== 0) {
            formatted = formatted.replace(/"([^"]+)":/g, '$1:');
        }
        
        return {
            formatted: formatted,
            minified: JSON.stringify(obj)
        };
    }

    function formatXML(input) {
        // Simple XML formatter
        const formatted = formatXMLString(input, {
            indent: elements.xmlIndent.value === 'tab' ? '\t' : 
                   parseInt(elements.xmlIndent.value) || 4,
            selfClose: elements.xmlSelfClose.checked,
            separateAttributes: elements.xmlAttributes.checked
        });
        
        return {
            formatted: formatted,
            minified: input.replace(/\s+/g, ' ').trim()
        };
    }

    function formatXMLString(xml, options) {
        const { indent = 4, selfClose = true, separateAttributes = false } = options;
        const indentStr = indent === 'tab' ? '\t' : ' '.repeat(indent);
        
        let formatted = '';
        let level = 0;
        let inTag = false;
        let inAttribute = false;
        let currentIndent = '';
        
        // Add XML declaration if present
        if (xml.startsWith('<?xml')) {
            const declEnd = xml.indexOf('?>') + 2;
            formatted = xml.substring(0, declEnd) + '\n';
            xml = xml.substring(declEnd).trim();
        }
        
        const tokens = xml.match(/<[^>]+>|[^<]+/g) || [];
        
        tokens.forEach(token => {
            if (token.startsWith('<')) {
                // It's a tag
                if (token.startsWith('</')) {
                    // Closing tag
                    level--;
                    currentIndent = indentStr.repeat(level);
                    formatted += '\n' + currentIndent + token;
                } else if (token.endsWith('/>') && selfClose) {
                    // Self-closing tag
                    currentIndent = indentStr.repeat(level);
                    formatted += '\n' + currentIndent + token;
                } else {
                    // Opening tag
                    currentIndent = indentStr.repeat(level);
                    formatted += '\n' + currentIndent + token;
                    if (!token.includes('/>')) {
                        level++;
                    }
                }
            } else {
                // Text content
                const text = token.trim();
                if (text) {
                    formatted += text;
                }
            }
        });
        
        return formatted.trim();
    }

    function displayOutput(content, format) {
        let output = content;
        
        if (elements.highlightSyntax.checked) {
            output = highlightSyntax(content, format);
        }
        
        if (elements.lineNumbers.checked) {
            output = addLineNumbers(output);
        }
        
        elements.outputText.innerHTML = `<pre class="syntax-highlighted">${output}</pre>`;
    }

    function highlightSyntax(content, format) {
        if (format === 'json') {
            return highlightJSON(content);
        } else {
            return highlightXML(content);
        }
    }

    function highlightJSON(json) {
        return json
            .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, function(match) {
                let cls = 'syntax-string';
                if (/:$/.test(match)) {
                    cls = 'syntax-key';
                    match = match.replace(/:$/, '');
                }
                return `<span class="${cls}">${match}</span>`;
            })
            .replace(/\b(true|false|null)\b/g, '<span class="syntax-boolean">$1</span>')
            .replace(/\b-?\d+(\.\d+)?([eE][+-]?\d+)?\b/g, '<span class="syntax-number">$&</span>')
            .replace(/[{}\[\]]/g, '<span class="syntax-bracket">$&</span>')
            .replace(/[:,]/g, '<span class="syntax-colon">$&</span>');
    }

    function highlightXML(xml) {
        return xml
            .replace(/&lt;\/?([a-zA-Z][a-zA-Z0-9:-]*)/g, '&lt;<span class="xml-tag">$1</span>')
            .replace(/([a-zA-Z-]+)=/g, '<span class="xml-attr-name">$1</span>=')
            .replace(/"([^"]*)"/g, '"<span class="xml-attr-value">$1</span>"')
            .replace(/&lt;!--[\s\S]*?--&gt;/g, '<span class="xml-comment">$&</span>')
            .replace(/&lt;![\s\S]*?&gt;/g, '<span class="xml-doctype">$&</span>')
            .replace(/(?<=&gt;)([^&<]+)(?=&lt;)/g, '<span class="xml-text">$1</span>')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
    }

    function addLineNumbers(content) {
        const lines = content.split('\n');
        return lines.map((line, i) => 
            `<div class="line"><span class="line-number">${i + 1}</span>${line}</div>`
        ).join('\n');
    }

    function displayError(message) {
        elements.outputText.innerHTML = `
            <div class="empty-output invalid">
                <svg width="48" height="48" fill="var(--theme-error-color)" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <p>Format Error</p>
                <p class="empty-hint">${message}</p>
            </div>
        `;
    }

    // Additional Functions
    function validateData() {
        const input = elements.inputText.value.trim();
        if (!input) {
            updateStatus('error', 'No input to validate');
            return;
        }
        
        let isValid = false;
        let message = '';
        
        if (currentFormat === 'json' || (currentFormat === 'auto' && isJSON(input))) {
            try {
                JSON.parse(input);
                isValid = true;
                message = 'Valid JSON';
            } catch (e) {
                message = `Invalid JSON: ${e.message}`;
            }
        } else if (currentFormat === 'xml' || (currentFormat === 'auto' && isXML(input))) {
            // Simple XML validation
            const tags = input.match(/<[^>]+>/g) || [];
            const openTags = [];
            let error = '';
            
            for (const tag of tags) {
                if (tag.startsWith('</')) {
                    const tagName = tag.slice(2, -1);
                    if (openTags.pop() !== tagName) {
                        error = `Mismatched tag: ${tagName}`;
                        break;
                    }
                } else if (!tag.endsWith('/>')) {
                    const tagName = tag.match(/<([a-zA-Z][^>\s]*)/);
                    if (tagName) openTags.push(tagName[1]);
                }
            }
            
            if (!error && openTags.length === 0) {
                isValid = true;
                message = 'Valid XML';
            } else {
                message = error || `Unclosed tags: ${openTags.join(', ')}`;
            }
        } else {
            message = 'Unknown format';
        }
        
        updateStatus(isValid ? 'success' : 'error', message);
        
        // Highlight validation in output
        if (isValid) {
            elements.outputText.classList.add('valid');
            setTimeout(() => elements.outputText.classList.remove('valid'), 2000);
        } else {
            elements.outputText.classList.add('invalid');
            setTimeout(() => elements.outputText.classList.remove('invalid'), 2000);
        }
    }

    function minifyData() {
        const input = elements.inputText.value.trim();
        if (!input) {
            updateStatus('error', 'No input to minify');
            return;
        }
        
        try {
            let minified;
            if (isJSON(input)) {
                const obj = JSON.parse(input);
                minified = JSON.stringify(obj);
            } else if (isXML(input)) {
                minified = input.replace(/\s+/g, ' ').trim();
            } else {
                throw new Error('Unknown format');
            }
            
            elements.inputText.value = minified;
            updateStats();
            updateStatus('success', 'Data minified');
            
            if (settings.autoFormat) {
                formatData();
            }
        } catch (error) {
            updateStatus('error', `Minify error: ${error.message}`);
        }
    }

    function toggleEscape() {
        const input = elements.inputText.value;
        if (!input) return;
        
        // Check if needs escaping or unescaping
        const hasSpecialChars = /[<>&'"]/.test(input);
        let result;
        
        if (hasSpecialChars) {
            // Escape
            result = input
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
            updateStatus('success', 'HTML entities escaped');
        } else {
            // Unescape
            result = input
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&#x([0-9a-f]+);/gi, (match, hex) => 
                    String.fromCharCode(parseInt(hex, 16)))
                .replace(/&#(\d+);/g, (match, dec) => 
                    String.fromCharCode(parseInt(dec, 10)));
            updateStatus('success', 'HTML entities unescaped');
        }
        
        elements.inputText.value = result;
        updateStats();
        
        if (settings.autoFormat) {
            formatData();
        }
    }

    function convertFormat() {
        const input = elements.inputText.value.trim();
        if (!input) {
            updateStatus('error', 'No input to convert');
            return;
        }
        
        try {
            let result;
            let newFormat;
            
            if (isJSON(input)) {
                // JSON to XML
                const obj = JSON.parse(input);
                result = jsonToXML(obj);
                newFormat = 'xml';
                updateStatus('success', 'Converted JSON to XML');
            } else if (isXML(input)) {
                // XML to JSON (simple conversion)
                result = xmlToJSON(input);
                newFormat = 'json';
                updateStatus('success', 'Converted XML to JSON');
            } else {
                throw new Error('Unknown format');
            }
            
            elements.inputText.value = result;
            switchFormat(newFormat);
            updateStats();
            
            if (settings.autoFormat) {
                formatData();
            }
        } catch (error) {
            updateStatus('error', `Conversion error: ${error.message}`);
        }
    }

    function jsonToXML(obj, rootName = 'root') {
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;
        
        function buildXML(data, indent = 2) {
            let result = '';
            const indentStr = ' '.repeat(indent);
            
            if (Array.isArray(data)) {
                data.forEach(item => {
                    result += `${indentStr}<item>\n${buildXML(item, indent + 2)}${indentStr}</item>\n`;
                });
            } else if (typeof data === 'object' && data !== null) {
                Object.entries(data).forEach(([key, value]) => {
                    if (typeof value === 'object' && value !== null) {
                        result += `${indentStr}<${key}>\n${buildXML(value, indent + 2)}${indentStr}</${key}>\n`;
                    } else {
                        const escaped = String(value)
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;');
                        result += `${indentStr}<${key}>${escaped}</${key}>\n`;
                    }
                });
            } else {
                const escaped = String(data)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
                result += `${indentStr}<value>${escaped}</value>\n`;
            }
            
            return result;
        }
        
        xml += buildXML(obj);
        xml += `</${rootName}>`;
        return xml;
    }

    function xmlToJSON(xml) {
        // Simple XML to JSON conversion
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
        
        function parseNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent.trim();
                return text ? text : null;
            }
            
            const obj = {};
            
            // Attributes
            Array.from(node.attributes).forEach(attr => {
                obj[`@${attr.name}`] = attr.value;
            });
            
            // Child nodes
            const children = {};
            Array.from(node.childNodes).forEach(child => {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    const childName = child.nodeName;
                    const childValue = parseNode(child);
                    
                    if (children[childName]) {
                        if (!Array.isArray(children[childName])) {
                            children[childName] = [children[childName]];
                        }
                        children[childName].push(childValue);
                    } else {
                        children[childName] = childValue;
                    }
                } else if (child.nodeType === Node.TEXT_NODE) {
                    const text = child.textContent.trim();
                    if (text) {
                        obj['#text'] = text;
                    }
                }
            });
            
            // Merge children
            Object.assign(obj, children);
            
            // If no attributes and only text content, return just the text
            if (Object.keys(obj).length === 1 && obj['#text']) {
                return obj['#text'];
            }
            
            // If no children or attributes, return empty object
            if (Object.keys(obj).length === 0 && node.childNodes.length === 0) {
                return null;
            }
            
            return obj;
        }
        
        const root = doc.documentElement;
        const result = { [root.nodeName]: parseNode(root) };
        return JSON.stringify(result, null, 2);
    }

    // Output Functions
    async function copyToClipboard() {
        if (!currentOutput) {
            updateStatus('error', 'No output to copy');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(currentOutput);
            updateStatus('success', 'Copied to clipboard');
            
            // Visual feedback
            elements.copyBtn.classList.add('highlight');
            setTimeout(() => elements.copyBtn.classList.remove('highlight'), 1000);
        } catch (err) {
            updateStatus('error', 'Failed to copy');
        }
    }

    function downloadOutput() {
        if (!currentOutput) {
            updateStatus('error', 'No output to download');
            return;
        }
        
        const format = elements.outputFormat.textContent.toLowerCase();
        const blob = new Blob([currentOutput], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `formatted-data.${format === 'json' ? 'json' : 'xml'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        updateStatus('success', 'File downloaded');
    }

    function expandView() {
        chrome.windows.create({
            url: chrome.runtime.getURL('popup.html'),
            type: 'popup',
            width: 800,
            height: 900
        });
    }

    // Status Functions
    function updateStatus(type, message) {
        const iconMap = {
            ready: { icon: '✓', color: 'var(--theme-success-color)' },
            success: { icon: '✓', color: 'var(--theme-success-color)' },
            error: { icon: '✗', color: 'var(--theme-error-color)' },
            warning: { icon: '!', color: 'var(--theme-warning-color)' },
            info: { icon: '…', color: 'var(--theme-info-color)' }
        };
        
        const status = iconMap[type] || iconMap.ready;
        
        elements.statusIcon.textContent = status.icon;
        elements.statusIcon.style.background = status.color;
        elements.statusText.textContent = message;
        
        // Clear status after 3 seconds if not persistent
        if (type !== 'ready') {
            setTimeout(() => {
                if (elements.statusText.textContent === message) {
                    updateStatus('ready', 'Ready');
                }
            }, 3000);
        }
    }

    function toggleQuickFormat() {
        const newValue = !settings.autoFormat;
        settings.autoFormat = newValue;
        elements.autoFormat.checked = newValue;
        
        chrome.storage.local.set({ autoFormat: newValue });
        updateAutoFormatStatus();
        
        updateStatus('success', `Auto-format ${newValue ? 'enabled' : 'disabled'}`);
        
        if (newValue && elements.inputText.value.trim()) {
            formatData();
        }
    }

    function updateAutoFormatStatus() {
        elements.autoFormatStatus.textContent = settings.autoFormat ? 'On' : 'Off';
        elements.autoFormatStatus.className = settings.autoFormat ? 'valid' : 'muted';
    }

    function openSettings() {
        chrome.runtime.openOptionsPage();
    }

    // Utility Functions
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Initialize format detection
    detectFormat();
});