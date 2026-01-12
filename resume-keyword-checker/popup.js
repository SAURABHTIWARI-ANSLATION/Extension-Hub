document.addEventListener('DOMContentLoaded', function() {
    const jobDescription = document.getElementById('jobDescription');
    const resumeText = document.getElementById('resumeText');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const scrapeBtn = document.getElementById('scrapeBtn');
    const results = document.getElementById('results');
    const scoreElement = document.getElementById('score');
    const foundKeywordsList = document.getElementById('foundKeywords');
    const missingKeywordsList = document.getElementById('missingKeywords');
    const suggestionsElement = document.getElementById('suggestions');
    const summaryElement = document.getElementById('summaryText');
    

      // Theme Management
    const themeToggle = document.getElementById('themeToggle');
    const themeDropdown = document.getElementById('themeDropdown');
    const themeOptions = document.querySelectorAll('.theme-option');
    const body = document.body;
    
    // Load saved theme
    chrome.storage.local.get(['selectedTheme'], function(data) {
        if (data.selectedTheme) {
            body.setAttribute('data-theme', data.selectedTheme);
            updateThemeButton(data.selectedTheme);
        }
    });
    
    // Toggle theme dropdown
    themeToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        themeDropdown.classList.toggle('show');
    });
    
    // Select theme
    themeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            body.setAttribute('data-theme', theme);
            
            // Save theme preference
            chrome.storage.local.set({ selectedTheme: theme });
            
            // Update button
            updateThemeButton(theme);
            
            // Close dropdown
            themeDropdown.classList.remove('show');
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        themeDropdown.classList.remove('show');
    });
    
    // Helper function to update theme button
    function updateThemeButton(theme) {
        const themeNames = {
            'ocean-blue': '🌊',
            'mint-teal': '🌿',
            'indigo-night': '🌙',
            'sky-gradient': '☁️',
            'violet-glow': '✨'
        };
        themeToggle.textContent = themeNames[theme] || '🎨';
    }

    // Common ATS keywords for different fields
    const commonKeywords = {
        technical: ['python', 'java', 'javascript', 'react', 'node.js', 'sql', 'aws', 'docker', 'kubernetes', 'git', 'rest api', 'agile', 'scrum'],
        softSkills: ['leadership', 'communication', 'teamwork', 'problem-solving', 'critical thinking', 'adaptability', 'time management', 'collaboration'],
        business: ['strategy', 'analysis', 'management', 'marketing', 'sales', 'finance', 'budget', 'planning', 'reporting']
    };

    // Load saved data
    chrome.storage.local.get(['savedJD', 'savedResume'], function(data) {
        if (data.savedJD) jobDescription.value = data.savedJD;
        if (data.savedResume) resumeText.value = data.savedResume;
    });

    // Analyze Button
    analyzeBtn.addEventListener('click', function() {
        const jd = jobDescription.value.toLowerCase();
        const resume = resumeText.value.toLowerCase();
        
        if (!jd || !resume) {
            alert('Please enter both job description and resume text');
            return;
        }

        // Save data
        chrome.storage.local.set({
            savedJD: jobDescription.value,
            savedResume: resumeText.value
        });

        analyzeKeywords(jd, resume);
    });

    // Clear Button
    clearBtn.addEventListener('click', function() {
        jobDescription.value = '';
        resumeText.value = '';
        chrome.storage.local.remove(['savedJD', 'savedResume']);
        results.classList.add('hidden');
    });

    // Scrape from Page Button - FIXED VERSION
    scrapeBtn.addEventListener('click', function() {
        console.log('Scrape button clicked');
        
        // Show loading state
        scrapeBtn.innerHTML = '⏳ Extracting...';
        scrapeBtn.disabled = true;
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (!tabs[0]) {
                showError('No active tab found');
                resetScrapeButton();
                return;
            }
            
            console.log('Current tab:', tabs[0].url);
            
            // Send message to content script
            chrome.tabs.sendMessage(
                tabs[0].id, 
                {action: "scrapeContent"}, 
                function(response) {
                    console.log('Response from content script:', response);
                    
                    if (chrome.runtime.lastError) {
                        console.error('Runtime error:', chrome.runtime.lastError);
                        
                        // If content script isn't loaded, try to inject it
                        if (chrome.runtime.lastError.message.includes('receiving end')) {
                            console.log('Injecting content script...');
                            injectContentScript(tabs[0].id);
                        } else {
                            showError('Error: ' + chrome.runtime.lastError.message);
                            resetScrapeButton();
                        }
                        return;
                    }
                    
                    if (response) {
                        if (response.jobDescription && response.jobDescription.trim() !== '') {
                            jobDescription.value = response.jobDescription;
                            console.log('Job description extracted:', response.jobDescription.substring(0, 100) + '...');
                        } else {
                            console.log('No job description found on page');
                            jobDescription.value = '⚠️ No job description found on this page. Try LinkedIn, Indeed, or other job portals.';
                        }
                        
                        if (response.resumeText && response.resumeText.trim() !== '') {
                            resumeText.value = response.resumeText;
                            console.log('Resume text extracted:', response.resumeText.substring(0, 100) + '...');
                        }
                        
                        // Save extracted data
                        chrome.storage.local.set({
                            savedJD: jobDescription.value,
                            savedResume: resumeText.value || ''
                        });
                        
                        // Show success message
                        showSuccess('Content extracted successfully!');
                    } else {
                        showError('No content could be extracted from this page.');
                    }
                    
                    resetScrapeButton();
                }
            );
        });
        
        // Set timeout in case no response
        setTimeout(function() {
            if (scrapeBtn.innerHTML === '⏳ Extracting...') {
                resetScrapeButton();
                showError('Timeout: Could not extract content. Try refreshing the page.');
            }
        }, 10000);
    });

    // Helper function to inject content script
    function injectContentScript(tabId) {
        chrome.scripting.executeScript({
            target: {tabId: tabId},
            files: ['content.js']
        }, function() {
            if (chrome.runtime.lastError) {
                console.error('Failed to inject content script:', chrome.runtime.lastError);
                showError('Failed to load extraction tool. Try refreshing the page.');
                resetScrapeButton();
                return;
            }
            
            // Retry sending message after injection
            setTimeout(function() {
                chrome.tabs.sendMessage(tabId, {action: "scrapeContent"}, function(response) {
                    if (response) {
                        if (response.jobDescription) {
                            jobDescription.value = response.jobDescription;
                        }
                        if (response.resumeText) {
                            resumeText.value = response.resumeText;
                        }
                        showSuccess('Content extracted after script injection!');
                    }
                    resetScrapeButton();
                });
            }, 1000);
        });
    }

    // Helper function to reset button state
    function resetScrapeButton() {
        scrapeBtn.innerHTML = '🌐 Extract from Page';
        scrapeBtn.disabled = false;
    }

    // Helper function to show error
    function showError(message) {
        // Create error message element
        let errorDiv = document.getElementById('errorMessage');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'errorMessage';
            errorDiv.style.cssText = `
                background: #ffebee;
                color: #c62828;
                padding: 10px;
                margin: 10px 0;
                border-radius: 5px;
                border-left: 4px solid #c62828;
                font-size: 14px;
            `;
            document.querySelector('.container').appendChild(errorDiv);
        }
        errorDiv.textContent = message;
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv) errorDiv.remove();
        }, 5000);
    }

    // Helper function to show success
    function showSuccess(message) {
        let successDiv = document.getElementById('successMessage');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.id = 'successMessage';
            successDiv.style.cssText = `
                background: #e8f5e9;
                color: #2e7d32;
                padding: 10px;
                margin: 10px 0;
                border-radius: 5px;
                border-left: 4px solid #2e7d32;
                font-size: 14px;
            `;
            document.querySelector('.container').appendChild(successDiv);
        }
        successDiv.textContent = message;
        
        setTimeout(() => {
            if (successDiv) successDiv.remove();
        }, 3000);
    }

    // Analysis Function
    function analyzeKeywords(jd, resume) {
        // Extract keywords from JD
        const jdWords = extractKeywords(jd);
        const resumeWords = extractKeywords(resume);
        
        // Find matches
        const found = [];
        const missing = [];
        
        jdWords.forEach(word => {
            if (resumeWords.includes(word)) {
                found.push(word);
            } else {
                missing.push(word);
            }
        });
        
        // Calculate score
        const score = Math.round((found.length / jdWords.length) * 100) || 0;
        
        // Display results
        displayResults(score, found, missing, jdWords.length);
        
        // Generate suggestions
        generateSuggestions(found, missing);
        
        // Show results section
        results.classList.remove('hidden');
    }

    function extractKeywords(text) {
        // Remove common words and extract meaningful keywords
        const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were'];
        
        let words = text
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .map(word => word.toLowerCase())
            .filter(word => word.length > 2 && !stopWords.includes(word));
        
        // Remove duplicates and sort
        return [...new Set(words)].sort();
    }

    function displayResults(score, found, missing, totalKeywords) {
        scoreElement.textContent = score;
        
        // Style score circle based on score
        const scoreCircle = document.querySelector('.score-circle');
        if (score >= 80) {
            scoreCircle.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
        } else if (score >= 60) {
            scoreCircle.style.background = 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)';
        } else {
            scoreCircle.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
        }
        
        // Display found keywords (limit to 20)
        foundKeywordsList.innerHTML = '';
        const foundToShow = found.slice(0, 20);
        foundToShow.forEach(keyword => {
            const li = document.createElement('li');
            li.textContent = `✓ ${keyword}`;
            foundKeywordsList.appendChild(li);
        });
        
        if (found.length > 20) {
            const li = document.createElement('li');
            li.textContent = `... and ${found.length - 20} more`;
            li.style.fontStyle = 'italic';
            li.style.color = '#666';
            foundKeywordsList.appendChild(li);
        }
        
        // Display missing keywords (limit to 20)
        missingKeywordsList.innerHTML = '';
        const missingToShow = missing.slice(0, 20);
        missingToShow.forEach(keyword => {
            const li = document.createElement('li');
            li.textContent = `✗ ${keyword}`;
            missingKeywordsList.appendChild(li);
        });
        
        if (missing.length > 20) {
            const li = document.createElement('li');
            li.textContent = `... and ${missing.length - 20} more`;
            li.style.fontStyle = 'italic';
            li.style.color = '#666';
            missingKeywordsList.appendChild(li);
        }
        
        // Display summary
        summaryElement.innerHTML = `
            <p>• Total keywords in JD: ${totalKeywords}</p>
            <p>• Keywords found: ${found.length}</p>
            <p>• Keywords missing: ${missing.length}</p>
            <p>• Match rate: ${score}%</p>
            ${score >= 80 ? 
                '<p>🎉 Great! Your resume has good ATS compatibility.</p>' : 
                score >= 60 ? 
                '<p>⚠️ Your resume needs some improvements for better ATS compatibility.</p>' :
                '<p>🚨 Your resume needs significant improvements to pass ATS systems.</p>'
            }
        `;
    }

    function generateSuggestions(found, missing) {
        let suggestions = '<p><strong>Recommendations:</strong></p><ul>';
        
        if (missing.length > 0) {
            suggestions += '<li>Add these missing keywords to your resume: ' + 
                missing.slice(0, 10).join(', ') + '</li>';
        }
        
        if (found.length < 15) {
            suggestions += '<li>Add more technical skills and action verbs</li>';
        }
        
        suggestions += '<li>Use the exact keywords from the job description</li>';
        suggestions += '<li>Incorporate keywords naturally in context</li>';
        suggestions += '<li>Repeat important keywords 2-3 times</li>';
        suggestions += '<li>Include both technical and soft skills</li>';
        suggestions += '</ul>';
        
        suggestionsElement.innerHTML = suggestions;
    }

    function openOptionsPage() {
    chrome.tabs.create({ 
        url: chrome.runtime.getURL('options.html') 
    }, function(tab) {
        console.log('Options page opened');
    });

}
});