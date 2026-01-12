document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const elements = {
        // Input
        selector1: document.getElementById('selector1'),
        selector2: document.getElementById('selector2'),
        calculateBtn: document.getElementById('calculateBtn'),
        clearBtn: document.getElementById('clearBtn'),
        exampleBtn: document.getElementById('exampleBtn'),
        
        // Results
        resultsSection: document.getElementById('resultsSection'),
        selector1Results: document.getElementById('selector1Results'),
        selector2Results: document.getElementById('selector2Results'),
        comparisonSection: document.getElementById('comparisonSection'),
        
        // Selector 1 Results
        selector1Text: document.getElementById('selector1Text'),
        selector1Score: document.getElementById('selector1Score'),
        selector1Bar: document.getElementById('selector1Bar'),
        selector1Values: document.getElementById('selector1Values'),
        selector1Details: document.getElementById('selector1Details'),
        
        // Selector 2 Results
        selector2Text: document.getElementById('selector2Text'),
        selector2Score: document.getElementById('selector2Score'),
        selector2Bar: document.getElementById('selector2Bar'),
        selector2Values: document.getElementById('selector2Values'),
        selector2Details: document.getElementById('selector2Details'),
        
        // Comparison Results
        comparisonResult: document.getElementById('comparisonResult'),
        comparisonSelector1: document.getElementById('comparisonSelector1'),
        comparisonSelector2: document.getElementById('comparisonSelector2'),
        comparisonBar1: document.getElementById('comparisonBar1'),
        comparisonBar2: document.getElementById('comparisonBar2'),
        
        // Guide
        toggleGuideBtn: document.getElementById('toggleGuideBtn'),
        guideDetails: document.getElementById('guideDetails'),
        guideContent: document.getElementById('guideContent'),
        
        // Actions
        copyResultsBtn: document.getElementById('copyResultsBtn'),
        infoBtn: document.getElementById('infoBtn'),
        closeInfoBtn: document.getElementById('closeInfoBtn'),
        infoModal: document.getElementById('infoModal'),
        settingsBtn: document.getElementById('settingsBtn'),
        
        // Status
        statusText: document.getElementById('statusText')
    };

    // State
    let currentResults = null;
    let isGuideExpanded = false;

    // Initialize
    init();

    // Event Listeners
    elements.calculateBtn.addEventListener('click', calculateSpecificity);
    elements.clearBtn.addEventListener('click', clearAll);
    elements.exampleBtn.addEventListener('click', loadExamples);
    
    elements.selector1.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateSpecificity();
    });
    
    elements.selector2.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateSpecificity();
    });
    
    elements.copyResultsBtn.addEventListener('click', copyResults);
    elements.toggleGuideBtn.addEventListener('click', toggleGuide);
    elements.infoBtn.addEventListener('click', showInfoModal);
    elements.closeInfoBtn.addEventListener('click', hideInfoModal);
    elements.settingsBtn.addEventListener('click', showSettings);
    
    // Close modal when clicking outside
    elements.infoModal.addEventListener('click', (e) => {
        if (e.target === elements.infoModal) {
            hideInfoModal();
        }
    });

    // Initialize
    function init() {
        updateStatus('ready', 'Enter a CSS selector to begin');
        
        // Load saved selectors
        chrome.storage.local.get(['lastSelectors'], (data) => {
            if (data.lastSelectors) {
                elements.selector1.value = data.lastSelectors[0] || '';
                elements.selector2.value = data.lastSelectors[1] || '';
            }
        });
    }

    // Calculate specificity
    function calculateSpecificity() {
        const selector1 = elements.selector1.value.trim();
        const selector2 = elements.selector2.value.trim();
        
        if (!selector1) {
            updateStatus('error', 'Please enter at least one selector');
            return;
        }
        
        updateStatus('info', 'Calculating specificity...');
        
        try {
            // Calculate specificity for selector 1
            const spec1 = calculateSelectorSpecificity(selector1);
            
            // Calculate specificity for selector 2 if provided
            let spec2 = null;
            if (selector2) {
                spec2 = calculateSelectorSpecificity(selector2);
            }
            
            // Store results
            currentResults = { spec1, spec2 };
            
            // Save selectors
            chrome.storage.local.set({
                lastSelectors: [selector1, selector2]
            });
            
            // Display results
            displayResults(spec1, spec2);
            
            // Update status
            updateStatus('success', 'Specificity calculated successfully');
            
        } catch (error) {
            updateStatus('error', `Error: ${error.message}`);
            console.error('Specificity calculation error:', error);
        }
    }

    // Calculate specificity for a single selector
    function calculateSelectorSpecificity(selector) {
        if (!selector || selector.trim() === '') {
            throw new Error('Empty selector');
        }
        
        // Reset counters
        let a = 0; // Inline styles
        let b = 0; // ID selectors
        let c = 0; // Class/attribute/pseudo-class selectors
        let d = 0; // Element/pseudo-element selectors
        
        // For analysis
        const ids = [];
        const classes = [];
        const attributes = [];
        const pseudoClasses = [];
        const elements = [];
        const pseudoElements = [];
        
        // Handle inline styles
        if (selector === 'style=""' || selector.includes('style=')) {
            a = 1;
        }
        
        // Parse the selector
        const parts = parseSelector(selector);
        
        parts.forEach(part => {
            switch (part.type) {
                case 'id':
                    b++;
                    ids.push(part.value);
                    break;
                    
                case 'class':
                    c++;
                    classes.push(part.value);
                    break;
                    
                case 'attribute':
                    c++;
                    attributes.push(part.value);
                    break;
                    
                case 'pseudo-class':
                    c++;
                    pseudoClasses.push(part.value);
                    break;
                    
                case 'element':
                    d++;
                    elements.push(part.value);
                    break;
                    
                case 'pseudo-element':
                    d++;
                    pseudoElements.push(part.value);
                    break;
                    
                case 'universal':
                    // * has no specificity
                    break;
            }
        });
        
        // Format specificity tuple
        const specificity = [a, b, c, d];
        const score = calculateScore(specificity);
        
        return {
            selector,
            specificity,
            score,
            breakdown: {
                ids,
                classes,
                attributes,
                pseudoClasses,
                elements,
                pseudoElements
            }
        };
    }

    // Parse selector into parts
    function parseSelector(selector) {
        const parts = [];
        let buffer = '';
        let inAttribute = false;
        let inPseudo = false;
        let inString = false;
        let stringChar = '';
        
        for (let i = 0; i < selector.length; i++) {
            const char = selector[i];
            const nextChar = selector[i + 1];
            
            // Handle strings in attributes
            if (char === '"' || char === "'") {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                }
                buffer += char;
                continue;
            }
            
            if (inString) {
                buffer += char;
                continue;
            }
            
            // Check for ID selector
            if (char === '#' && !inAttribute && !inPseudo) {
                if (buffer) {
                    parts.push({ type: 'element', value: buffer });
                    buffer = '';
                }
                let idValue = '';
                let j = i + 1;
                while (j < selector.length && /[a-zA-Z0-9_-]/.test(selector[j])) {
                    idValue += selector[j];
                    j++;
                }
                parts.push({ type: 'id', value: `#${idValue}` });
                i = j - 1;
                continue;
            }
            
            // Check for class selector
            if (char === '.' && !inAttribute && !inPseudo) {
                if (buffer) {
                    parts.push({ type: 'element', value: buffer });
                    buffer = '';
                }
                let classValue = '';
                let j = i + 1;
                while (j < selector.length && /[a-zA-Z0-9_-]/.test(selector[j])) {
                    classValue += selector[j];
                    j++;
                }
                parts.push({ type: 'class', value: `.${classValue}` });
                i = j - 1;
                continue;
            }
            
            // Check for attribute selector
            if (char === '[') {
                inAttribute = true;
                if (buffer) {
                    parts.push({ type: 'element', value: buffer });
                    buffer = '';
                }
                buffer = char;
                continue;
            }
            
            if (char === ']' && inAttribute) {
                inAttribute = false;
                buffer += char;
                parts.push({ type: 'attribute', value: buffer });
                buffer = '';
                continue;
            }
            
            // Check for pseudo-class/element
            if (char === ':') {
                inPseudo = true;
                if (buffer) {
                    parts.push({ type: 'element', value: buffer });
                    buffer = '';
                }
                buffer = char;
                continue;
            }
            
            if (inPseudo) {
                // Check if it's a pseudo-element (::)
                if (char === ':' && nextChar === ':') {
                    buffer += '::';
                    i++; // Skip next colon
                    continue;
                }
                
                // End of pseudo selector
                if (char === ' ' || char === ',' || char === '>' || char === '+' || char === '~' || 
                    char === '[' || char === '.' || char === '#') {
                    inPseudo = false;
                    
                    // Determine if it's pseudo-class or pseudo-element
                    const pseudoValue = buffer.trim();
                    if (pseudoValue.startsWith('::')) {
                        parts.push({ type: 'pseudo-element', value: pseudoValue });
                    } else {
                        parts.push({ type: 'pseudo-class', value: pseudoValue });
                    }
                    
                    buffer = '';
                    i--; // Reprocess current char
                    continue;
                }
                
                buffer += char;
                continue;
            }
            
            // Check for element selector
            if (/[a-zA-Z]/.test(char)) {
                buffer += char;
                let j = i + 1;
                while (j < selector.length && /[a-zA-Z0-9-]/.test(selector[j])) {
                    buffer += selector[j];
                    j++;
                }
                i = j - 1;
                continue;
            }
            
            // Universal selector
            if (char === '*') {
                parts.push({ type: 'universal', value: '*' });
                continue;
            }
            
            // End of current selector part
            if (buffer && (char === ' ' || char === ',' || char === '>' || char === '+' || char === '~')) {
                if (buffer) {
                    parts.push({ type: 'element', value: buffer });
                    buffer = '';
                }
                continue;
            }
            
            // Add to buffer
            if (char !== ' ' && char !== ',' && char !== '>' && char !== '+' && char !== '~') {
                buffer += char;
            }
        }
        
        // Add any remaining buffer
        if (buffer) {
            // Check if it's a pseudo selector that wasn't processed
            if (buffer.startsWith(':')) {
                if (buffer.startsWith('::')) {
                    parts.push({ type: 'pseudo-element', value: buffer });
                } else {
                    parts.push({ type: 'pseudo-class', value: buffer });
                }
            } else if (buffer === '*') {
                parts.push({ type: 'universal', value: buffer });
            } else {
                parts.push({ type: 'element', value: buffer });
            }
        }
        
        return parts;
    }

    // Calculate numeric score from specificity tuple
    function calculateScore(specificity) {
        // Convert to base-10 number for easy comparison
        // Using base-1000 to ensure each position is weighted properly
        const [a, b, c, d] = specificity;
        return (a * 1000000) + (b * 10000) + (c * 100) + d;
    }

    // Display results
    function displayResults(spec1, spec2) {
        // Show results section
        elements.resultsSection.style.display = 'block';
        
        // Display selector 1 results
        displaySelectorResults(spec1, 1);
        
        // Display selector 2 results if provided
        if (spec2) {
            elements.selector2Results.style.display = 'block';
            displaySelectorResults(spec2, 2);
            
            // Show comparison
            elements.comparisonSection.style.display = 'block';
            displayComparison(spec1, spec2);
        } else {
            elements.selector2Results.style.display = 'none';
            elements.comparisonSection.style.display = 'none';
        }
        
        // Scroll to results
        elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Display results for a single selector
    function displaySelectorResults(spec, index) {
        const [a, b, c, d] = spec.specificity;
        const selectorText = elements[`selector${index}Text`];
        const scoreElement = elements[`selector${index}Score`];
        const barElement = elements[`selector${index}Bar`];
        const valuesElement = elements[`selector${index}Values`];
        const detailsElement = elements[`selector${index}Details`];
        
        // Set selector text
        selectorText.textContent = spec.selector;
        
        // Set score
        scoreElement.textContent = `(${a},${b},${c},${d})`;
        
        // Create specificity bar
        createSpecificityBar(barElement, spec.specificity);
        
        // Create values display
        createSpecificityValues(valuesElement, spec.specificity);
        
        // Create details grid
        createDetailsGrid(detailsElement, spec);
    }

    // Create visual specificity bar
    function createSpecificityBar(container, specificity) {
        const [a, b, c, d] = specificity;
        const total = a + b + c + d || 1; // Avoid division by zero
        
        container.innerHTML = '';
        
        // Inline styles segment (if present)
        if (a > 0) {
            const width = (a / total) * 100;
            const segment = document.createElement('div');
            segment.className = 'specificity-segment';
            segment.style.background = 'var(--specificity-inline)';
            segment.style.width = `${width}%`;
            segment.textContent = 'Inline';
            segment.dataset.tooltip = `Inline styles: ${a}`;
            container.appendChild(segment);
        }
        
        // ID selectors segment
        if (b > 0) {
            const width = (b / total) * 100;
            const segment = document.createElement('div');
            segment.className = 'specificity-segment';
            segment.style.background = 'var(--specificity-id)';
            segment.style.width = `${width}%`;
            segment.textContent = 'IDs';
            segment.dataset.tooltip = `ID selectors: ${b}`;
            container.appendChild(segment);
        }
        
        // Class/attribute/pseudo-class segment
        if (c > 0) {
            const width = (c / total) * 100;
            const segment = document.createElement('div');
            segment.className = 'specificity-segment';
            segment.style.background = 'var(--specificity-class)';
            segment.style.width = `${width}%`;
            segment.textContent = 'Classes';
            segment.dataset.tooltip = `Classes/attributes/pseudo-classes: ${c}`;
            container.appendChild(segment);
        }
        
        // Element/pseudo-element segment
        if (d > 0) {
            const width = (d / total) * 100;
            const segment = document.createElement('div');
            segment.className = 'specificity-segment';
            segment.style.background = 'var(--specificity-element)';
            segment.style.width = `${width}%`;
            segment.textContent = 'Elements';
            segment.dataset.tooltip = `Elements/pseudo-elements: ${d}`;
            container.appendChild(segment);
        }
    }

    // Create specificity values display
    function createSpecificityValues(container, specificity) {
        const [a, b, c, d] = specificity;
        
        container.innerHTML = `
            <div class="specificity-value" style="color: var(--specificity-inline);">${a}</div>
            <div class="specificity-value" style="color: var(--specificity-id);">${b}</div>
            <div class="specificity-value" style="color: var(--specificity-class);">${c}</div>
            <div class="specificity-value" style="color: var(--specificity-element);">${d}</div>
        `;
    }

    // Create details grid
    function createDetailsGrid(container, spec) {
        const { breakdown, specificity } = spec;
        const [a, b, c, d] = specificity;
        
        let html = '';
        
        // Inline styles
        if (a > 0) {
            html += `
                <div class="detail-item">
                    <div class="detail-label">Inline Styles</div>
                    <div class="detail-value">${a}</div>
                    <div class="detail-examples">style="" attribute</div>
                </div>
            `;
        }
        
        // IDs
        if (b > 0) {
            const examples = breakdown.ids.slice(0, 3).join(', ');
            html += `
                <div class="detail-item">
                    <div class="detail-label">ID Selectors</div>
                    <div class="detail-value">${b}</div>
                    <div class="detail-examples">${examples}</div>
                </div>
            `;
        }
        
        // Classes/Attributes/Pseudo-classes
        if (c > 0) {
            const classCount = breakdown.classes.length;
            const attrCount = breakdown.attributes.length;
            const pseudoCount = breakdown.pseudoClasses.length;
            
            html += `
                <div class="detail-item">
                    <div class="detail-label">Classes/Attributes/Pseudo</div>
                    <div class="detail-value">${c}</div>
                    <div class="detail-examples">${classCount} classes, ${attrCount} attrs, ${pseudoCount} pseudo</div>
                </div>
            `;
        }
        
        // Elements/Pseudo-elements
        if (d > 0) {
            const elemCount = breakdown.elements.length;
            const pseudoElemCount = breakdown.pseudoElements.length;
            
            html += `
                <div class="detail-item">
                    <div class="detail-label">Elements/Pseudo-elements</div>
                    <div class="detail-value">${d}</div>
                    <div class="detail-examples">${elemCount} elements, ${pseudoElemCount} pseudo-elements</div>
                </div>
            `;
        }
        
        // Total
        const total = a + b + c + d;
        html += `
            <div class="detail-item">
                <div class="detail-label">Total Selectors</div>
                <div class="detail-value">${total}</div>
                <div class="detail-examples">Sum of all selector parts</div>
            </div>
        `;
        
        // Score
        html += `
            <div class="detail-item">
                <div class="detail-label">Numeric Score</div>
                <div class="detail-value">${spec.score}</div>
                <div class="detail-examples">For comparison purposes</div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    // Display comparison between two selectors
    function displayComparison(spec1, spec2) {
        const result = compareSpecificity(spec1, spec2);
        
        // Set comparison result text
        elements.comparisonResult.textContent = result.text;
        elements.comparisonResult.className = `comparison-result ${result.class}`;
        
        // Set selector texts
        elements.comparisonSelector1.textContent = spec1.selector;
        elements.comparisonSelector2.textContent = spec2.selector;
        
        // Apply winner/loser styles
        if (result.winner === 1) {
            elements.comparisonSelector1.classList.add('winner');
            elements.comparisonSelector2.classList.add('loser');
        } else if (result.winner === 2) {
            elements.comparisonSelector1.classList.add('loser');
            elements.comparisonSelector2.classList.add('winner');
        } else {
            elements.comparisonSelector1.classList.add('draw');
            elements.comparisonSelector2.classList.add('draw');
        }
        
        // Create comparison bars
        createComparisonBar(elements.comparisonBar1, spec1.specificity, result.winner === 1);
        createComparisonBar(elements.comparisonBar2, spec2.specificity, result.winner === 2);
    }

    // Compare two specificity tuples
    function compareSpecificity(spec1, spec2) {
        const [a1, b1, c1, d1] = spec1.specificity;
        const [a2, b2, c2, d2] = spec2.specificity;
        
        // Compare from left to right
        if (a1 > a2) return { winner: 1, text: 'Selector 1 wins (inline styles)', class: 'winner-1' };
        if (a2 > a1) return { winner: 2, text: 'Selector 2 wins (inline styles)', class: 'winner-2' };
        
        if (b1 > b2) return { winner: 1, text: 'Selector 1 wins (more IDs)', class: 'winner-1' };
        if (b2 > b1) return { winner: 2, text: 'Selector 2 wins (more IDs)', class: 'winner-2' };
        
        if (c1 > c2) return { winner: 1, text: 'Selector 1 wins (more classes)', class: 'winner-1' };
        if (c2 > c1) return { winner: 2, text: 'Selector 2 wins (more classes)', class: 'winner-2' };
        
        if (d1 > d2) return { winner: 1, text: 'Selector 1 wins (more elements)', class: 'winner-1' };
        if (d2 > d1) return { winner: 2, text: 'Selector 2 wins (more elements)', class: 'winner-2' };
        
        return { winner: 0, text: 'Draw (equal specificity)', class: 'draw' };
    }

    // Create comparison bar
    function createComparisonBar(container, specificity, isWinner) {
        const [a, b, c, d] = specificity;
        const total = a + b + c + d || 1;
        
        container.innerHTML = '';
        
        // Add border if winner
        if (isWinner) {
            container.style.boxShadow = '0 0 0 3px var(--theme-success-color)';
        } else {
            container.style.boxShadow = 'none';
        }
        
        // Create segments
        const segments = [
            { value: a, color: 'var(--specificity-inline)', label: 'I' },
            { value: b, color: 'var(--specificity-id)', label: 'ID' },
            { value: c, color: 'var(--specificity-class)', label: 'C' },
            { value: d, color: 'var(--specificity-element)', label: 'E' }
        ];
        
        segments.forEach(segment => {
            if (segment.value > 0) {
                const width = (segment.value / total) * 100;
                const div = document.createElement('div');
                div.className = 'specificity-segment';
                div.style.background = segment.color;
                div.style.width = `${width}%`;
                div.textContent = segment.label;
                container.appendChild(div);
            }
        });
    }

    // Utility Functions
    function clearAll() {
        elements.selector1.value = '';
        elements.selector2.value = '';
        elements.resultsSection.style.display = 'none';
        updateStatus('ready', 'Enter a CSS selector to begin');
        
        // Clear stored selectors
        chrome.storage.local.remove(['lastSelectors']);
    }

    function loadExamples() {
        const examples = [
            ['#header nav ul li a', 'body .container .nav a'],
            ['.btn-primary:hover', 'button[type="submit"]'],
            ['div.content > p:first-child', 'section p:first-of-type'],
            ['*', 'html body div']
        ];
        
        const randomExample = examples[Math.floor(Math.random() * examples.length)];
        elements.selector1.value = randomExample[0];
        elements.selector2.value = randomExample[1];
        
        updateStatus('info', 'Example loaded. Click "Calculate Specificity" to analyze.');
    }

    async function copyResults() {
        if (!currentResults) {
            updateStatus('error', 'No results to copy');
            return;
        }
        
        let text = 'CSS Specificity Results\n';
        text += '=====================\n\n';
        
        // Selector 1
        const [a1, b1, c1, d1] = currentResults.spec1.specificity;
        text += `Selector 1: ${currentResults.spec1.selector}\n`;
        text += `Specificity: (${a1},${b1},${c1},${d1})\n`;
        text += `Score: ${currentResults.spec1.score}\n\n`;
        
        // Selector 2 if exists
        if (currentResults.spec2) {
            const [a2, b2, c2, d2] = currentResults.spec2.specificity;
            text += `Selector 2: ${currentResults.spec2.selector}\n`;
            text += `Specificity: (${a2},${b2},${c2},${d2})\n`;
            text += `Score: ${currentResults.spec2.score}\n\n`;
            
            // Comparison
            const result = compareSpecificity(currentResults.spec1, currentResults.spec2);
            text += `Comparison: ${result.text}\n`;
        }
        
        try {
            await navigator.clipboard.writeText(text);
            updateStatus('success', 'Results copied to clipboard');
            
            // Visual feedback
            elements.copyResultsBtn.classList.add('highlight');
            setTimeout(() => {
                elements.copyResultsBtn.classList.remove('highlight');
            }, 1000);
        } catch (err) {
            updateStatus('error', 'Failed to copy results');
        }
    }

    function toggleGuide() {
        isGuideExpanded = !isGuideExpanded;
        elements.guideDetails.style.display = isGuideExpanded ? 'block' : 'none';
        elements.toggleGuideBtn.textContent = isGuideExpanded ? 'Hide Details' : 'Show Details';
    }

    function showInfoModal() {
        elements.infoModal.style.display = 'flex';
    }

    function hideInfoModal() {
        elements.infoModal.style.display = 'none';
    }

    function showSettings() {
        // In a full implementation, this would open a settings page
        updateStatus('info', 'Settings feature coming soon!');
    }

    function updateStatus(type, message) {
        const iconMap = {
            ready: { icon: '⚡', color: 'var(--theme-info-color)' },
            success: { icon: '✓', color: 'var(--theme-success-color)' },
            error: { icon: '✗', color: 'var(--theme-error-color)' },
            warning: { icon: '!', color: 'var(--theme-warning-color)' },
            info: { icon: '…', color: 'var(--theme-info-color)' }
        };
        
        const status = iconMap[type] || iconMap.ready;
        
        elements.statusText.textContent = message;
        
        // Clear status after 5 seconds if not persistent
        if (type !== 'ready') {
            setTimeout(() => {
                if (elements.statusText.textContent === message) {
                    updateStatus('ready', 'Enter a CSS selector to begin');
                }
            }, 5000);
        }
    }

    // Initial guide setup
    toggleGuide(); // Start with guide collapsed
});