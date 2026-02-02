console.log('🚀 Prompt Optimizer content script loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Content script received:', request.action);
    
    switch (request.action) {
        case 'extractPrompt':
            const prompt = extractCurrentPrompt();
            console.log('📝 Extracted prompt:', prompt ? prompt.substring(0, 50) + '...' : 'none');
            sendResponse({prompt: prompt, success: !!prompt});
            break;
            
        case 'insertPrompt':
            const success = insertPrompt(request.prompt);
            console.log('✅ Insert result:', success);
            sendResponse({success: success});
            break;
            
        case 'ping':
            sendResponse({status: 'alive', page: document.location.hostname});
            break;
    }
    
    return false;
});

// ✅ IMPROVED: Extract prompt from AI chat platforms
function extractCurrentPrompt() {
    let prompt = '';
    const hostname = window.location.hostname;
    
    console.log('🔍 Extracting from:', hostname);
    
    // ChatGPT - IMPROVED SELECTORS
    if (hostname.includes('chat.openai.com') || hostname.includes('chatgpt.com')) {
        console.log('🤖 ChatGPT detected');
        
        // Try multiple selectors for different ChatGPT versions
        const selectors = [
            '#prompt-textarea',
            'textarea[data-id="root"]',
            'textarea[placeholder*="Message"]',
            'textarea[placeholder*="Send"]',
            'div[contenteditable="true"][data-id]',
            'div.ProseMirror',
            'textarea',
            '[contenteditable="true"]',
            '.placeholder' // Check for placeholder text to avoid extracting it
        ];
        
        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);
                
                for (const element of elements) {
                    // Skip if it's a hidden element or a placeholder
                    if (element.classList.contains('placeholder') || element.getAttribute('placeholder') === element.textContent) {
                        continue;
                    }

                    // Get text from textarea or contenteditable
                    const text = element.value || (element.tagName === 'DIV' ? element.innerText : element.textContent) || '';
                    
                    if (text.trim() && text.length > 0) {
                        prompt = text.trim();
                        console.log('✅ Found prompt via:', selector);
                        break;
                    }
                }
                
                if (prompt) break;
            } catch (e) {
                console.log('  Selector failed:', selector, e.message);
            }
        }
    }
    // Claude AI
    else if (hostname.includes('claude.ai') || hostname.includes('anthropic.com')) {
        console.log('🤖 Claude detected');
        
        const selectors = [
            'div.ProseMirror',
            '[contenteditable="true"]',
            'textarea',
            'div[data-placeholder]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                const text = element.value || element.textContent || element.innerText || '';
                if (text.trim()) {
                    prompt = text.trim();
                    console.log('✅ Found via:', selector);
                    break;
                }
            }
        }
    }
    // Google Bard/Gemini
    else if (hostname.includes('bard.google.com') || hostname.includes('gemini.google.com')) {
        console.log('🤖 Bard/Gemini detected');
        
        const selectors = [
            '.ql-editor',
            '[contenteditable="true"]',
            'textarea',
            'rich-textarea',
            '.input-area'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                const text = element.innerText || element.textContent || element.value || '';
                if (text.trim() && !text.includes('Enter a prompt here')) {
                    prompt = text.trim();
                    console.log('✅ Found via:', selector);
                    break;
                }
            }
        }
    }
    // Microsoft Copilot
    else if (hostname.includes('copilot.microsoft.com') || hostname.includes('bing.com/chat')) {
        console.log('🤖 Copilot detected');
        
        const selectors = [
            '#searchbox',
            'textarea[aria-label]',
            'textarea',
            '[contenteditable="true"]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                const text = element.value || element.textContent || element.innerText || '';
                if (text.trim()) {
                    prompt = text.trim();
                    console.log('✅ Found via:', selector);
                    break;
                }
            }
        }
    }
    // Generic fallback - ANY AI chat page
    else {
        console.log('🔍 Generic AI platform - trying all inputs');
        
        // Look for any focused or visible textarea
        const textareas = document.querySelectorAll('textarea');
        console.log(`  Found ${textareas.length} textareas`);
        
        for (const textarea of textareas) {
            // Check if visible and has content
            if (textarea.offsetWidth > 0 && textarea.offsetHeight > 0) {
                const text = textarea.value || '';
                if (text.trim() && text.length > 5) {
                    prompt = text.trim();
                    console.log('✅ Found via generic textarea');
                    break;
                }
            }
        }
        
        // Try contenteditable divs
        if (!prompt) {
            const editables = document.querySelectorAll('[contenteditable="true"]');
            console.log(`  Found ${editables.length} contenteditable elements`);
            
            for (const el of editables) {
                if (el.offsetWidth > 0 && el.offsetHeight > 0) {
                    const text = el.textContent || el.innerText || '';
                    if (text.trim() && text.length > 5) {
                        prompt = text.trim();
                        console.log('✅ Found via generic contenteditable');
                        break;
                    }
                }
            }
        }
    }
    
    // Clean up the prompt
    if (prompt) {
        // Remove placeholder text artifacts
        prompt = prompt.replace(/^(Message ChatGPT|Send a message|Type your message)/i, '').trim();
        
        console.log(`✅ Final extracted prompt: ${prompt.length} chars`);
    } else {
        console.log('❌ No prompt found');
    }
    
    return prompt;
}

// ✅ IMPROVED: Insert optimized prompt into chat
function insertPrompt(prompt) {
    let success = false;
    const hostname = window.location.hostname;
    
    console.log('📥 Inserting prompt to:', hostname);
    console.log('📝 Prompt length:', prompt.length);
    
    // ChatGPT
    if (hostname.includes('chat.openai.com') || hostname.includes('chatgpt.com')) {
        console.log('🤖 ChatGPT insertion');
        
        const selectors = [
            '#prompt-textarea',
            'textarea[data-id="root"]',
            'textarea[placeholder*="Message"]',
            'div[contenteditable="true"][data-id]',
            'textarea'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                try {
                    if (element.tagName === 'TEXTAREA') {
                        // For textarea
                        element.value = prompt;
                        element.focus();
                        
                        // Trigger events
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                        
                        // Trigger React events
                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                            window.HTMLTextAreaElement.prototype,
                            'value'
                        ).set;
                        nativeInputValueSetter.call(element, prompt);
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        
                    } else if (element.contentEditable === 'true') {
                        // For contenteditable
                        element.textContent = prompt;
                        element.focus();
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    
                    success = true;
                    console.log('✅ Inserted via:', selector);
                    showInsertionFeedback('✅ Prompt inserted into ChatGPT!');
                    break;
                } catch (e) {
                    console.log('  Failed:', selector, e.message);
                }
            }
        }
    }
    // Claude
    else if (hostname.includes('claude.ai') || hostname.includes('anthropic.com')) {
        console.log('🤖 Claude insertion');
        
        const element = document.querySelector('.ProseMirror') || 
                       document.querySelector('[contenteditable="true"]');
        
        if (element) {
            element.textContent = prompt;
            element.focus();
            element.dispatchEvent(new Event('input', { bubbles: true }));
            success = true;
            console.log('✅ Inserted into Claude');
            showInsertionFeedback('✅ Prompt inserted into Claude!');
        }
    }
    // Bard/Gemini
    else if (hostname.includes('bard.google.com') || hostname.includes('gemini.google.com')) {
        console.log('🤖 Bard/Gemini insertion');
        
        const element = document.querySelector('.ql-editor') ||
                       document.querySelector('[contenteditable="true"]');
        
        if (element) {
            element.textContent = prompt;
            element.focus();
            element.dispatchEvent(new Event('input', { bubbles: true }));
            success = true;
            console.log('✅ Inserted into Bard');
            showInsertionFeedback('✅ Prompt inserted into Bard!');
        }
    }
    // Copilot
    else if (hostname.includes('copilot.microsoft.com') || hostname.includes('bing.com/chat')) {
        console.log('🤖 Copilot insertion');
        
        const element = document.querySelector('#searchbox') ||
                       document.querySelector('textarea');
        
        if (element) {
            element.value = prompt;
            element.focus();
            element.dispatchEvent(new Event('input', { bubbles: true }));
            success = true;
            console.log('✅ Inserted into Copilot');
            showInsertionFeedback('✅ Prompt inserted into Copilot!');
        }
    }
    // Generic fallback
    else {
        console.log('🔍 Generic insertion attempt');
        
        // Find any visible textarea
        const textareas = document.querySelectorAll('textarea');
        for (const textarea of textareas) {
            if (textarea.offsetWidth > 0 && textarea.offsetHeight > 0) {
                textarea.value = prompt;
                textarea.focus();
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                success = true;
                console.log('✅ Inserted via generic textarea');
                showInsertionFeedback('✅ Prompt inserted!');
                break;
            }
        }
    }
    
    if (!success) {
        console.log('❌ Insertion failed');
    }
    
    return success;
}

// Show visual feedback when prompt is inserted
function showInsertionFeedback(message = '✅ Prompt inserted') {
    // Remove existing feedback
    const existing = document.getElementById('prompt-optimizer-feedback');
    if (existing) existing.remove();
    
    const feedback = document.createElement('div');
    feedback.id = 'prompt-optimizer-feedback';
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        font-weight: 600;
        z-index: 2147483647;
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
        animation: promptFadeInOut 2.5s ease;
        pointer-events: none;
    `;
    
    document.body.appendChild(feedback);
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes promptFadeInOut {
            0% { opacity: 0; transform: translateY(20px); }
            10% { opacity: 1; transform: translateY(0); }
            90% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
        }
    `;
    document.head.appendChild(style);
    
    // Remove after animation
    setTimeout(() => {
        feedback.remove();
        style.remove();
    }, 2500);
}

// Detect platform and log
const platform = detectPlatform();
if (platform) {
    console.log(`✅ Detected AI platform: ${platform}`);
}

function detectPlatform() {
    const hostname = window.location.hostname;
    
    if (hostname.includes('chat.openai.com') || hostname.includes('chatgpt.com')) {
        return 'ChatGPT';
    } else if (hostname.includes('claude.ai') || hostname.includes('anthropic.com')) {
        return 'Claude';
    } else if (hostname.includes('bard.google.com') || hostname.includes('gemini.google.com')) {
        return 'Bard/Gemini';
    } else if (hostname.includes('copilot.microsoft.com') || hostname.includes('bing.com/chat')) {
        return 'Copilot';
    }
    
    return null;
}

console.log('✅ Prompt Optimizer content script ready');