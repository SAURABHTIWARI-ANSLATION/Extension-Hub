// Content script for scraping job descriptions and resumes from web pages

console.log('Resume Keyword Checker content script loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in content script:', request);
    
    if (request.action === "scrapeContent") {
        console.log('Scraping content from page...');
        const content = extractPageContent();
        console.log('Content extracted:', content);
        sendResponse(content);
    }
    
    // Return true to indicate we'll send response asynchronously
    return true;
});

function extractPageContent() {
    console.log('Starting content extraction...');
    
    let jobDescription = '';
    let resumeText = '';
    
    // Common job description selectors for popular job sites
    const jdSelectors = [
        // LinkedIn
        '.description__text',
        '.show-more-less-html__markup',
        '.jobs-description__content',
        '.jobs-description-content__text',
        
        // Indeed
        '#jobDescriptionText',
        '.jobsearch-JobComponent-description',
        
        // Naukri
        '.job-desc',
        '.dang-inner-html',
        
        // Monster
        '.job-description',
        '.desc',
        
        // Generic
        '[class*="description"]',
        '[class*="jd"]',
        '[class*="job-desc"]',
        '.description',
        '#description',
        '.job-description-content',
        '.job-details',
        '.details',
        '.content',
        '.text',
        'article',
        'section',
        'div[role="main"]',
        'main'
    ];
    
    // Common resume text area selectors
    const resumeSelectors = [
        'textarea',
        'input[type="text"]',
        '.resume-text',
        '#resume',
        '.resume-content',
        '[contenteditable="true"]',
        'pre',
        'code',
        '.text-area',
        '.text-box'
    ];
    
    // Function to get visible text from element
    function getVisibleText(element) {
        if (!element) return '';
        
        // Clone element to avoid modifying original
        const clone = element.cloneNode(true);
        
        // Remove script and style elements
        const scripts = clone.getElementsByTagName('script');
        const styles = clone.getElementsByTagName('style');
        Array.from(scripts).forEach(s => s.remove());
        Array.from(styles).forEach(s => s.remove());
        
        // Get text content
        let text = clone.textContent || clone.innerText || '';
        
        // Clean up text
        text = text
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, '\n')
            .trim();
        
        return text;
    }
    
    // Method 1: Try specific job description selectors first
    for (const selector of jdSelectors) {
        try {
            const elements = document.querySelectorAll(selector);
            console.log(`Checking selector "${selector}": Found ${elements.length} elements`);
            
            for (const el of elements) {
                const text = getVisibleText(el);
                if (text.length > 200 && text.length < 10000) {
                    // Check if it looks like a job description
                    const hasJobKeywords = /(responsibilit|requirement|qualification|experience|skill|job|position|must have|should have|duties)/i.test(text);
                    const hasSectionHeadings = /(job description|requirements|qualifications|skills|experience|education|about the role|what you'll do)/i.test(text);
                    
                    if (hasJobKeywords || hasSectionHeadings) {
                        console.log(`Found job description using selector: ${selector}`);
                        jobDescription = text;
                        break;
                    }
                }
            }
            if (jobDescription) break;
        } catch (error) {
            console.error(`Error with selector ${selector}:`, error);
        }
    }
    
    // Method 2: If no job description found, try to find the main content
    if (!jobDescription) {
        console.log('Trying main content extraction...');
        
        // Try to find the largest text block (likely main content)
        const allElements = document.querySelectorAll('div, section, article, main');
        let largestText = '';
        let largestElement = null;
        
        for (const el of allElements) {
            const text = getVisibleText(el);
            if (text.length > largestText.length && text.length < 20000) {
                largestText = text;
                largestElement = el;
            }
        }
        
        if (largestText.length > 500) {
            console.log('Using largest text block as job description');
            jobDescription = largestText;
        }
    }
    
    // Method 3: Extract from common job portal structures
    if (!jobDescription) {
        console.log('Trying job portal specific extraction...');
        
        // Check for common job portal structures
        const portalSpecificSelectors = [
            // LinkedIn job postings
            '[data-test-id="job-details"]',
            '.jobs-details',
            
            // Indeed job postings
            '.jobsearch-JobComponent',
            '#jobDescriptionText',
            
            // Glassdoor
            '.jobDescriptionContent',
            '.desc'
        ];
        
        for (const selector of portalSpecificSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const text = getVisibleText(element);
                if (text.length > 100) {
                    jobDescription = text;
                    break;
                }
            }
        }
    }
    
    // Method 4: Try to extract resume text
    for (const selector of resumeSelectors) {
        try {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
                let text = '';
                
                // Handle different element types
                if (el.tagName.toLowerCase() === 'textarea' || el.tagName.toLowerCase() === 'input') {
                    text = el.value || '';
                } else {
                    text = getVisibleText(el);
                }
                
                if (text.length > 100 && text.length < 5000) {
                    // Check if it looks like a resume
                    const hasResumeKeywords = /(experience|education|skill|project|summary|objective|work history|employment)/i.test(text);
                    if (hasResumeKeywords) {
                        console.log(`Found resume text using selector: ${selector}`);
                        resumeText = text;
                        break;
                    }
                }
            }
            if (resumeText) break;
        } catch (error) {
            console.error(`Error with resume selector ${selector}:`, error);
        }
    }
    
    // Method 5: Look for any text areas with resume-like content
    if (!resumeText) {
        const textareas = document.querySelectorAll('textarea');
        for (const textarea of textareas) {
            if (textarea.value && textarea.value.length > 200) {
                resumeText = textarea.value;
                break;
            }
        }
    }
    
    // Clean and format the extracted text
    jobDescription = cleanText(jobDescription);
    resumeText = cleanText(resumeText);
    
    console.log('Extraction complete:', {
        jobDescriptionLength: jobDescription.length,
        resumeTextLength: resumeText.length
    });
    
    return {
        jobDescription: jobDescription,
        resumeText: resumeText,
        url: window.location.href
    };
}

function cleanText(text) {
    if (!text) return '';
    
    return text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .replace(/[^\S\n]+/g, ' ')
        .trim();
}

// Inject CSS to highlight what's being extracted
function highlightExtractedElements() {
    const style = document.createElement('style');
    style.textContent = `
        .resume-keyword-highlight {
            background-color: rgba(255, 255, 0, 0.3) !important;
            border: 2px solid #ffcc00 !important;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { border-color: #ffcc00; }
            50% { border-color: #ff9900; }
            100% { border-color: #ffcc00; }
        }
    `;
    document.head.appendChild(style);
}

// Call highlight on load
highlightExtractedElements();