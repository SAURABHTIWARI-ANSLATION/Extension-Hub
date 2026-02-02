console.log('🚀 Prompt Optimizer loaded');

// DOM Elements
const promptInput = document.getElementById('promptInput');
const charCount = document.getElementById('charCount');
const extractBtn = document.getElementById('extractBtn');
const clearBtn = document.getElementById('clearBtn');
const optimizeBtn = document.getElementById('optimizeBtn');
const resultsSection = document.getElementById('resultsSection');
const improvementScore = document.getElementById('improvementScore');
const optimizedOutput = document.getElementById('optimizedOutput');
const improvementsList = document.getElementById('improvementsList');
const appliedTone = document.getElementById('appliedTone');
const toneSample = document.getElementById('toneSample');
const copyBtn = document.getElementById('copyBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const useBtn = document.getElementById('useBtn');
const toneButtons = document.querySelectorAll('.tone-btn');
const platformSelect = document.getElementById('platformSelect');
const promptsOptimized = document.getElementById('promptsOptimized');
const timeSaved = document.getElementById('timeSaved');
const historyBtn = document.getElementById('historyBtn');

// State
let currentTone = 'professional';
let optimizedPrompt = '';
let optimizationHistory = [];
let settings = {
    addContext: true,
    improveTone: true,
    addExamples: false,
    specifyFormat: true
};

const TONE_SAMPLES = {
    professional: "I would appreciate your assistance in [task]. Please provide a comprehensive and well-structured response.",
    friendly: "Hey! Could you help me with this? [task] I'd really appreciate your thoughts!",
    creative: "Let's think creatively about this: [task]. Feel free to explore innovative approaches.",
    concise: "[task]. Please provide a direct, concise response."
};

// Load saved state on startup
loadSavedState();
updateToneSample();

// Character count with color coding
promptInput.addEventListener('input', function() {
    const count = this.value.length;
    charCount.textContent = count;
    
    // Use theme-aware classes instead of hardcoded colors
    if (count < 10) {
        charCount.className = 'char-count error';
    } else if (count < 50) {
        charCount.className = 'char-count warning';
    } else {
        charCount.className = 'char-count success';
    }
});

function updateToneSample() {
    if (toneSample) {
        toneSample.textContent = TONE_SAMPLES[currentTone] || TONE_SAMPLES.professional;
    }
}

// ✅ FIXED: Extract from page
extractBtn.addEventListener('click', async function() {
    console.log('📥 Extract button clicked');
    
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Extracting...';
    this.disabled = true;
    
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        if (!tab?.id) {
            showNotification('No active tab found', 'error');
            return;
        }
        
        // Try to inject content script first to be safe
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
        } catch (e) {
            console.log('Content script already present or cannot inject');
        }
        
        // Send message to content script
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'extractPrompt'
        });
        
        console.log('📨 Response from content script:', response);
        
        if (response?.prompt && response.prompt.trim().length > 0) {
            promptInput.value = response.prompt;
            promptInput.dispatchEvent(new Event('input'));
            showNotification(`✅ Extracted ${response.prompt.length} characters!`, 'success');
        } else {
            showNotification('No prompt found in input field. Type something first!', 'warning');
        }
        
    } catch (error) {
        console.error('❌ Extract error:', error);
        showNotification('Could not extract. Make sure you\'re on ChatGPT/Claude page', 'error');
    } finally {
        this.innerHTML = '<i class="fas fa-download"></i> Extract from Page';
        this.disabled = false;
    }
});

// Clear button
clearBtn.addEventListener('click', function() {
    promptInput.value = '';
    promptInput.dispatchEvent(new Event('input'));
    resultsSection.classList.add('hidden');
});

// Tone selection
toneButtons.forEach(button => {
    button.addEventListener('click', function() {
        toneButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        currentTone = this.dataset.tone;
        console.log('🎨 Tone changed to:', currentTone);
        updateToneSample();
    });
});

// Settings checkboxes
Object.keys(settings).forEach(key => {
    const checkbox = document.getElementById(key);
    if (checkbox) {
        checkbox.checked = settings[key];
        checkbox.addEventListener('change', function() {
            settings[key] = this.checked;
            saveSettings();
        });
    }
});

// ✅ MAIN OPTIMIZATION FUNCTION - MUCH BETTER!
optimizeBtn.addEventListener('click', function() {
    const originalPrompt = promptInput.value.trim();
    
    if (!originalPrompt) {
        showNotification('⚠️ Please enter a prompt to optimize', 'error');
        promptInput.focus();
        return;
    }
    
    if (originalPrompt.length < 5) {
        showNotification('⚠️ Please enter a more detailed prompt (at least 5 characters)', 'warning');
        return;
    }
    
    console.log('🎯 Optimizing prompt:', originalPrompt.substring(0, 50) + '...');
    
    // Show loading state
    optimizeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimizing...';
    optimizeBtn.disabled = true;
    
    // Optimize with realistic delay
    setTimeout(() => {
        const optimized = optimizePromptAdvanced(originalPrompt);
        displayResults(originalPrompt, optimized);
        
        // Save to history
        saveToHistory(originalPrompt, optimized);
        
        // Update stats
        updateStats(1, 3);
        
        // Reset button
        optimizeBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Optimize Prompt';
        optimizeBtn.disabled = false;
        
        showNotification('✨ Prompt optimized successfully!', 'success');
    }, 1200);
});

// Copy button
copyBtn.addEventListener('click', function() {
    navigator.clipboard.writeText(optimizedPrompt)
        .then(() => {
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            }, 2000);
            showNotification('📋 Copied to clipboard!', 'success');
        })
        .catch(err => {
            console.error('Copy failed:', err);
            showNotification('❌ Failed to copy', 'error');
        });
});

// Regenerate button
regenerateBtn.addEventListener('click', function() {
    const originalPrompt = promptInput.value.trim();
    if (originalPrompt) {
        console.log('🔄 Regenerating...');
        const optimized = optimizePromptAdvanced(originalPrompt);
        displayResults(originalPrompt, optimized);
        saveToHistory(originalPrompt, optimized, true);
        showNotification('🔄 Prompt regenerated!', 'success');
    }
});

// Use in chat button
useBtn.addEventListener('click', async function() {
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        if (tab?.id) {
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'insertPrompt',
                prompt: optimizedPrompt
            });
            
            if (response?.success) {
                showNotification('✅ Prompt inserted into chat!', 'success');
                window.close(); // Close popup after inserting
            } else {
                throw new Error('Insert failed');
            }
        } else {
            throw new Error('No active tab');
        }
    } catch (error) {
        console.log('⚠️ Could not insert, copying instead:', error);
        navigator.clipboard.writeText(optimizedPrompt);
        showNotification('📋 Prompt copied to clipboard!', 'info');
    }
});

// History button
historyBtn.addEventListener('click', function() {
    showHistoryModal();
});

// ✅ ADVANCED PROMPT OPTIMIZATION - REAL AI-LIKE IMPROVEMENTS
function optimizePromptAdvanced(originalPrompt) {
    console.log('🧠 Starting advanced optimization...');
    
    const platform = platformSelect.value;
    const improvements = [];
    let optimized = originalPrompt;
    
    // Step 1: Analyze the prompt
    const analysis = analyzePromptDeep(originalPrompt);
    console.log('📊 Analysis:', analysis);
    
    // Step 2: Apply tone improvements
    if (settings.improveTone) {
        optimized = applyToneImprovement(optimized, currentTone, analysis);
        improvements.push({
            icon: 'fas fa-volume-up',
            text: `Applied ${currentTone} tone for better communication`
        });
    }
    
    // Step 3: Add context if missing
    if (settings.addContext && !analysis.hasContext) {
        optimized = addMeaningfulContext(optimized, platform);
        improvements.push({
            icon: 'fas fa-layer-group',
            text: 'Added helpful context and background information'
        });
    }
    
    // Step 4: Structure the prompt
    if (settings.specifyFormat) {
        optimized = addStructureAndFormat(optimized, platform);
        improvements.push({
            icon: 'fas fa-ruler-combined',
            text: 'Structured output format for clarity'
        });
    }
    
    // Step 5: Add examples if needed
    if (settings.addExamples && !analysis.hasExamples && analysis.needsExamples) {
        optimized = addRelevantExamples(optimized, analysis);
        improvements.push({
            icon: 'fas fa-list-ol',
            text: 'Added specific examples for better understanding'
        });
    }
    
    // Step 6: Enhance specificity
    optimized = enhanceSpecificity(optimized, analysis);
    improvements.push({
        icon: 'fas fa-bullseye',
        text: 'Improved specificity and clarity of requirements'
    });
    
    // Step 7: Platform-specific optimizations
    optimized = applyPlatformOptimizations(optimized, platform);
    improvements.push({
        icon: 'fas fa-robot',
        text: `Optimized for ${getPlatformName(platform)}`
    });
    
    // Store improvements
    window.currentImprovements = improvements;
    
    console.log('✅ Optimization complete!');
    return optimized;
}

// Deep prompt analysis
function analyzePromptDeep(prompt) {
    const lower = prompt.toLowerCase();
    const words = prompt.split(/\s+/);
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return {
        length: prompt.length,
        wordCount: words.length,
        sentenceCount: sentences.length,
        hasContext: /\b(context|background|because|since|in order to|situation|scenario)\b/i.test(prompt),
        hasExamples: /\b(example|for instance|such as|like|e\.g\.|i\.e\.)\b/i.test(prompt),
        hasFormat: /\b(format|structure|outline|organize|list|bullet|markdown)\b/i.test(prompt),
        hasConstraints: /\b(must|should|need|require|limit|maximum|minimum|at least)\b/i.test(prompt),
        hasAudience: /\b(for|audience|reader|user|beginner|expert|student)\b/i.test(prompt),
        isQuestion: prompt.trim().endsWith('?'),
        isVague: words.length < 10,
        needsExamples: /\b(write|create|generate|make|build|design)\b/i.test(prompt),
        tone: detectTone(prompt),
        complexity: words.length < 15 ? 'simple' : words.length < 40 ? 'medium' : 'complex'
    };
}

function detectTone(prompt) {
    const lower = prompt.toLowerCase();
    if (/please|could you|would you|kindly/i.test(prompt)) return 'polite';
    if (/urgent|asap|quick|fast|immediately/i.test(prompt)) return 'urgent';
    if (/just|simply|basic|easy/i.test(prompt)) return 'casual';
    return 'neutral';
}

// Apply tone based on selection
function applyToneImprovement(prompt, tone, analysis) {
    let improved = prompt;
    
    // Remove existing tone markers
    improved = improved.replace(/^(please|could you|would you|kindly|hey|hi)\s*/i, '');
    
    switch (tone) {
        case 'professional':
            improved = `I would appreciate your assistance in ${improved.toLowerCase()}. Please provide a comprehensive and well-structured response.`;
            break;
        case 'friendly':
            improved = `Hey! Could you help me with this? ${improved} I'd really appreciate your thoughts!`;
            break;
        case 'creative':
            improved = `Let's think creatively about this: ${improved}. Feel free to explore innovative approaches and unique perspectives.`;
            break;
        case 'concise':
            improved = `${improved}. Please provide a direct, concise response.`;
            break;
    }
    
    return improved;
}

// Add meaningful context
function addMeaningfulContext(prompt, platform) {
    const contextTemplates = [
        `\n\n**Context:** I'm working on a project and need this information to make informed decisions.`,
        `\n\n**Background:** This is part of a larger effort to understand and improve my work/studies.`,
        `\n\n**Purpose:** I need this to help me create better content and make data-driven decisions.`,
        `\n\n**Goal:** My objective is to gain deep insights that I can apply practically.`
    ];
    
    const context = contextTemplates[Math.floor(Math.random() * contextTemplates.length)];
    return prompt + context;
}

// Add structure and format
function addStructureAndFormat(prompt, platform) {
    const formatInstructions = {
        chatgpt: `\n\n**Output Format:**
- Use clear headings and subheadings
- Include bullet points for key information
- Provide examples where relevant
- Use markdown formatting for better readability`,
        
        claude: `\n\n**Response Structure:**
1. Start with a brief overview
2. Provide detailed analysis with clear sections
3. Include practical examples
4. End with a summary and next steps`,
        
        bard: `\n\n**Format Guidelines:**
- Structure with clear sections
- Include relevant sources if available
- Use conversational yet informative tone
- Provide actionable insights`,
        
        copilot: `\n\n**Expected Format:**
- Professional structure with clear sections
- Business-focused language
- Include Microsoft tool suggestions if relevant
- Provide implementation steps`,
        
        general: `\n\n**Response Format:**
Please organize your response with:
1. Clear introduction
2. Main points with explanations
3. Relevant examples
4. Conclusion with key takeaways`
    };
    
    return prompt + (formatInstructions[platform] || formatInstructions.general);
}

// Add relevant examples
function addRelevantExamples(prompt, analysis) {
    if (analysis.needsExamples) {
        return prompt + `\n\n**Examples Needed:** Please include 2-3 specific, practical examples to illustrate the concepts and make them easier to understand and apply.`;
    }
    return prompt;
}

// Enhance specificity
function enhanceSpecificity(prompt, analysis) {
    let enhanced = prompt;
    
    // Add specificity requirements
    if (!analysis.hasConstraints) {
        enhanced += `\n\n**Requirements:**
- Focus on actionable and practical information
- Provide specific details rather than general statements
- Include relevant data or statistics where applicable`;
    }
    
    // Add audience if missing
    if (!analysis.hasAudience && analysis.complexity === 'simple') {
        enhanced += `\n- Explain concepts in a way that's accessible to beginners`;
    }
    
    return enhanced;
}

// Platform-specific optimizations
function applyPlatformOptimizations(prompt, platform) {
    const platformTips = {
        chatgpt: '\n\n**ChatGPT Tip:** Feel free to ask follow-up questions for clarification or deeper exploration.',
        claude: '\n\n**Note:** Please provide thorough explanations with attention to nuance and context.',
        bard: '\n\n**Bard Note:** Include recent information and cite sources where relevant.',
        copilot: '\n\n**Copilot Tip:** Consider enterprise use cases and professional applications.',
        general: ''
    };
    
    return prompt + (platformTips[platform] || '');
}

function getPlatformName(platform) {
    const names = {
        chatgpt: 'ChatGPT',
        claude: 'Claude AI',
        bard: 'Google Bard',
        copilot: 'Microsoft Copilot',
        general: 'General AI'
    };
    return names[platform] || 'AI Platform';
}

// Display results
function displayResults(original, optimized) {
    optimizedPrompt = optimized;
    
    // Calculate improvement score
    const originalAnalysis = analyzePromptDeep(original);
    const optimizedAnalysis = analyzePromptDeep(optimized);
    const score = calculateRealScore(originalAnalysis, optimizedAnalysis);
    
    // Update UI
    improvementScore.textContent = score;
    optimizedOutput.textContent = optimized;
    appliedTone.textContent = getToneName(currentTone);
    
    // Update tone sample in results
    if (toneSample) {
        toneSample.textContent = TONE_SAMPLES[currentTone].replace('[task]', 'your prompt');
    }
    
    // Display improvements
    improvementsList.innerHTML = '';
    if (window.currentImprovements) {
        window.currentImprovements.forEach(imp => {
            const div = document.createElement('div');
            div.className = 'improvement-item';
            div.innerHTML = `
                <i class="${imp.icon}" style="color: #10B981;"></i>
                <div class="improvement-text">${imp.text}</div>
            `;
            improvementsList.appendChild(div);
        });
    }
    
    // Show results section
    resultsSection.classList.remove('hidden');
    
    // Scroll to results
    resultsSection.scrollIntoView({behavior: 'smooth', block: 'nearest'});
    
    // Animate score
    animateScore(score);
}

function calculateRealScore(original, optimized) {
    let score = 40; // Base score
    
    // Length improvement (more detailed = better)
    const lengthRatio = optimized.length / original.length;
    if (lengthRatio > 2) score += 20;
    else if (lengthRatio > 1.5) score += 15;
    else if (lengthRatio > 1.2) score += 10;
    
    // Context added
    if (!original.hasContext && settings.addContext) score += 10;
    
    // Format specified
    if (!original.hasFormat && settings.specifyFormat) score += 10;
    
    // Examples added
    if (!original.hasExamples && settings.addExamples) score += 8;
    
    // Specificity improved
    if (optimized.wordCount > original.wordCount * 1.5) score += 7;
    
    // Structure improved
    if (optimized.sentenceCount > original.sentenceCount) score += 5;
    
    return Math.min(98, score); // Cap at 98
}

function animateScore(targetScore) {
    let current = 0;
    const increment = targetScore / 30;
    const timer = setInterval(() => {
        current += increment;
        if (current >= targetScore) {
            current = targetScore;
            clearInterval(timer);
        }
        improvementScore.textContent = Math.round(current);
    }, 30);
}

function getToneName(tone) {
    const names = {
        professional: 'Professional',
        friendly: 'Friendly',
        creative: 'Creative',
        concise: 'Concise'
    };
    return names[tone] || 'Professional';
}

// Save to history
function saveToHistory(original, optimized, isRegenerate = false) {
    const entry = {
        id: Date.now(),
        original: original,
        optimized: optimized,
        tone: currentTone,
        platform: platformSelect.value,
        timestamp: new Date().toISOString(),
        improvements: window.currentImprovements || [],
        score: parseInt(improvementScore.textContent)
    };
    
    optimizationHistory.unshift(entry);
    
    if (optimizationHistory.length > 50) {
        optimizationHistory.pop();
    }
    
    chrome.storage.local.set({optimizationHistory: optimizationHistory});
    
    if (!isRegenerate) {
        updateStats(1, 3);
    }
}

// Load saved state
function loadSavedState() {
    chrome.storage.local.get(['optimizationHistory', 'promptSettings', 'stats', 'lastSelection'], (data) => {
        if (data.optimizationHistory) {
            optimizationHistory = data.optimizationHistory;
        }
        
        if (data.promptSettings) {
            settings = {...settings, ...data.promptSettings};
            Object.keys(settings).forEach(key => {
                const checkbox = document.getElementById(key);
                if (checkbox) checkbox.checked = settings[key];
            });
        }
        
        if (data.stats) {
            promptsOptimized.textContent = data.stats.promptsOptimized || 0;
            timeSaved.textContent = data.stats.timeSaved || 0;
        }

        // ✅ FIXED: Handle selection from context menu
        if (data.lastSelection) {
            promptInput.value = data.lastSelection;
            promptInput.dispatchEvent(new Event('input'));
            // Clear it so it doesn't reappear
            chrome.storage.local.remove('lastSelection');
            showNotification('📋 Loaded selected text!', 'success');
        }
    });
}

// Save settings
function saveSettings() {
    chrome.storage.local.set({promptSettings: settings});
}

// Update stats
function updateStats(count = 1, minutes = 3) {
    chrome.storage.local.get(['stats'], (data) => {
        const stats = data.stats || {promptsOptimized: 0, timeSaved: 0};
        stats.promptsOptimized += count;
        stats.timeSaved += minutes;
        
        chrome.storage.local.set({stats});
        
        promptsOptimized.textContent = stats.promptsOptimized;
        timeSaved.textContent = stats.timeSaved;
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    
    notification.innerHTML = `
        <i class="fas fa-${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInNotif 0.3s ease;
        font-size: 14px;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutNotif 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// History modal
function showHistoryModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 24px; 
             max-width: 500px; max-height: 80vh; overflow-y: auto; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #1F2937;">
                    <i class="fas fa-history"></i> Optimization History
                </h3>
                <button id="closeModal" style="background: none; border: none; 
                        font-size: 24px; cursor: pointer; color: #666;">×</button>
            </div>
            
            <div id="historyList">
                ${optimizationHistory.length === 0 ? 
                    '<p style="text-align: center; color: #666; padding: 40px 0;">No history yet</p>' : 
                    optimizationHistory.map(entry => `
                        <div style="border: 1px solid #E5E7EB; border-radius: 8px; 
                             padding: 12px; margin-bottom: 10px; cursor: pointer;" 
                             data-id="${entry.id}">
                            <div style="font-weight: 600; margin-bottom: 4px;">
                                ${entry.original.substring(0, 60)}${entry.original.length > 60 ? '...' : ''}
                            </div>
                            <div style="font-size: 12px; color: #666; display: flex; 
                                 justify-content: space-between;">
                                <span>${entry.tone} • ${getPlatformName(entry.platform)}</span>
                                <span>Score: ${entry.score}%</span>
                            </div>
                        </div>
                    `).join('')}
            </div>
            
            ${optimizationHistory.length > 0 ? `
                <button id="clearHistory" style="width: 100%; padding: 10px; 
                        background: #EF4444; color: white; border: none; 
                        border-radius: 8px; cursor: pointer; margin-top: 12px;">
                    <i class="fas fa-trash"></i> Clear History
                </button>
            ` : ''}
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#closeModal').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    modal.querySelectorAll('[data-id]').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            const entry = optimizationHistory.find(e => e.id === id);
            if (entry) {
                promptInput.value = entry.original;
                promptInput.dispatchEvent(new Event('input'));
                displayResults(entry.original, entry.optimized);
                modal.remove();
            }
        });
    });
    
    const clearBtn = modal.querySelector('#clearHistory');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Clear all history?')) {
                optimizationHistory = [];
                chrome.storage.local.set({optimizationHistory: []});
                modal.remove();
                showNotification('History cleared', 'success');
            }
        });
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInNotif {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutNotif {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

console.log('✅ Prompt Optimizer fully initialized');