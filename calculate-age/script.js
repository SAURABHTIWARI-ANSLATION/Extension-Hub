document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('birthdate');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultContainer = document.getElementById('result-container');
    const nextBdayContainer = document.getElementById('next-birthday-container');
    const errorMessage = document.getElementById('error-message');
    const saveProfileBtn = document.getElementById('save-profile');
    const compareBtn = document.getElementById('compare-btn');
    const shareBtn = document.getElementById('share-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const profilesList = document.getElementById('profiles-list');
    const detailedStats = document.getElementById('detailed-stats');
    const timelineContainer = document.getElementById('timeline-container');
    const timelineProgress = document.getElementById('timeline-progress');
    const milestoneMarkers = document.getElementById('milestone-markers');
    const lifeStage = document.getElementById('life-stage');
    const zodiacSign = document.getElementById('zodiac-sign');
    const generation = document.getElementById('generation');
    const dayOfWeek = document.getElementById('day-of-week');
    const totalDays = document.getElementById('total-days');
    const totalWeeks = document.getElementById('total-weeks');
    const totalHours = document.getElementById('total-hours');
    const totalMinutes = document.getElementById('total-minutes');

    // Elements for displaying results
    const yearsDisplay = document.getElementById('years');
    const monthsDisplay = document.getElementById('months');
    const daysDisplay = document.getElementById('days');
    const nextBdayCountdown = document.getElementById('next-bday-countdown');

    // State management
    let currentProfile = null;
    let profiles = [];
    let darkMode = false;

    // Set max date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('max', today);

    // Load saved data
    loadProfiles();
    loadTheme();

    // Event listeners
    calculateBtn.addEventListener('click', calculateAge);
    dateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateAge();
    });

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfile);
    }

    if (compareBtn) {
        compareBtn.addEventListener('click', toggleComparisonMode);
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', shareResults);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    function calculateAge() {
        const birthDateString = dateInput.value;

        // Reset UI
        errorMessage.classList.add('hidden');
        resultContainer.classList.remove('visible');
        resultContainer.classList.add('hidden');
        nextBdayContainer.classList.add('hidden');
        if (detailedStats) detailedStats.classList.add('hidden');
        if (timelineContainer) timelineContainer.classList.add('hidden');

        if (!birthDateString) {
            showError('Please select your date of birth');
            return;
        }

        const birthDate = new Date(birthDateString);
        const todayDate = new Date();

        if (birthDate > todayDate) {
            showError('Future dates are invalid');
            return;
        }

        // --- Core Calculation ---
        let years = todayDate.getFullYear() - birthDate.getFullYear();
        let months = todayDate.getMonth() - birthDate.getMonth();
        let days = todayDate.getDate() - birthDate.getDate();

        // Adjust days and months
        if (days < 0) {
            months--;
            const lastMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 0);
            days += lastMonth.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        // --- Total Breakdown ---
        const timeDiff = todayDate - birthDate;
        const totalDaysValue = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const totalWeeksValue = Math.floor(totalDaysValue / 7);
        const totalHoursValue = Math.floor(timeDiff / (1000 * 60 * 60));
        const totalMinutesValue = Math.floor(timeDiff / (1000 * 60));

        // --- Next Birthday Calculation ---
        const nextBirthday = new Date(todayDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        
        // If birthday already passed this year, add a year
        if (nextBirthday < todayDate) {
            nextBirthday.setFullYear(todayDate.getFullYear() + 1);
        }
        
        const daysToNextBirthday = Math.ceil((nextBirthday - todayDate) / (1000 * 60 * 60 * 24));

        // --- Additional Info ---
        const zodiac = getWesternZodiac(birthDate);
        const generation_ = getGeneration(birthDate.getFullYear());
        const dayOfWeek_ = birthDate.toLocaleDateString('en-US', { weekday: 'long' });
        const lifeProgress = Math.min((years / 80) * 100, 100); // Assuming 80 years average lifespan
        
        // Get life stage
        let lifeStageText = 'Child';
        if (years >= 65) lifeStageText = 'Senior';
        else if (years >= 30) lifeStageText = 'Adult';
        else if (years >= 18) lifeStageText = 'Young Adult';
        else if (years >= 13) lifeStageText = 'Teenager';
        else if (years >= 3) lifeStageText = 'Child';
        else lifeStageText = 'Infant';

        // Store current profile
        currentProfile = {
            birthDate: birthDateString,
            age: { years, months, days },
            totalDays: totalDaysValue,
            totalWeeks: totalWeeksValue,
            totalHours: totalHoursValue,
            totalMinutes: totalMinutesValue,
            zodiac,
            generation: generation_,
            dayOfWeek: dayOfWeek_,
            nextBirthday: daysToNextBirthday,
            lifeProgress,
            lifeStage: lifeStageText
        };

        // --- Display & Animation ---
        resultContainer.classList.remove('hidden');

        requestAnimationFrame(() => {
            resultContainer.classList.add('visible');
            animateCount(yearsDisplay, years, 1500);
            animateCount(monthsDisplay, months, 1000);
            animateCount(daysDisplay, days, 1000);
        });

        // Show Next Birthday
        const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        // Check if today IS the birthday
        const isBirthdayToday = (
            todayDate.getMonth()  === birthDate.getMonth() &&
            todayDate.getDate()   === birthDate.getDate()
        );

        if (isBirthdayToday) {
            nextBdayCountdown.textContent = 'Today! Happy Birthday! 🎉';
            nextBdayContainer.classList.remove('hidden');
        } else if (daysToNextBirthday > 0) {
            const bdayDayName  = DAYS[nextBirthday.getDay()];
            const bdayMonthStr = MONTHS[nextBirthday.getMonth()];
            const bdayDateNum  = nextBirthday.getDate();
            // e.g. "in 45 days — Monday, Mar 15"
            nextBdayCountdown.textContent =
                `in ${daysToNextBirthday} ${daysToNextBirthday === 1 ? 'day' : 'days'} — ${bdayDayName}, ${bdayMonthStr} ${bdayDateNum}`;
            nextBdayContainer.classList.remove('hidden');
        }

        // Update detailed stats
        updateDetailedStats(currentProfile);
        
        // Update timeline
        updateTimeline(currentProfile);
        
        // Check for milestones
        checkMilestones(years);
    }

    function updateDetailedStats(profile) {
        if (!profile || !detailedStats) return;
        
        if (zodiacSign) zodiacSign.textContent = profile.zodiac || 'Unknown';
        if (generation) generation.textContent = profile.generation || 'Unknown';
        if (dayOfWeek) dayOfWeek.textContent = profile.dayOfWeek || 'Unknown';
        if (totalDays) totalDays.textContent = formatNumber(profile.totalDays || 0);
        if (totalWeeks) totalWeeks.textContent = formatNumber(profile.totalWeeks || 0);
        if (totalHours) totalHours.textContent = formatNumber(profile.totalHours || 0);
        if (totalMinutes) totalMinutes.textContent = formatNumber(profile.totalMinutes || 0);
        
        detailedStats.classList.remove('hidden');
    }

    function updateTimeline(profile) {
        if (!profile || !timelineContainer) return;
        
        // Update progress bar
        if (timelineProgress) {
            timelineProgress.style.width = `${Math.min(profile.lifeProgress, 100)}%`;
        }
        
        // Update life stage
        if (lifeStage) {
            lifeStage.textContent = profile.lifeStage || 'Adult';
        }
        
        // Update milestones - SAFE: No innerHTML
        if (milestoneMarkers) {
            // Clear safely
            while (milestoneMarkers.firstChild) {
                milestoneMarkers.removeChild(milestoneMarkers.firstChild);
            }
            
            const milestones = [1, 5, 10, 13, 18, 21, 30, 40, 50, 60, 65, 70, 80];
            
            milestones.forEach(milestone => {
                const marker = document.createElement('div');
                marker.className = `milestone-marker ${profile.age.years >= milestone ? 'reached' : ''}`;
                marker.style.left = `${(milestone / 80) * 100}%`;
                marker.setAttribute('data-age', milestone);
                milestoneMarkers.appendChild(marker);
            });
        }
        
        timelineContainer.classList.remove('hidden');
    }

    function checkMilestones(years) {
        const milestones = [1, 5, 10, 13, 18, 21, 30, 40, 50, 60, 65, 70, 75, 80, 90, 100];
        
        if (milestones.includes(years)) {
            let message = `🎉 You've reached ${years} years!`;
            if (years === 18) message = '🎉 Congratulations on becoming an adult!';
            if (years === 21) message = '🎉 You can now drink (legally)!';
            if (years === 30) message = '🎉 Dirty thirty!';
            if (years === 40) message = '🎉 Over the hill? Never!';
            if (years === 50) message = '🎉 Golden jubilee!';
            if (years === 60) message = '🎉 Diamond jubilee!';
            if (years === 75) message = '🎉 Platinum anniversary!';
            if (years === 100) message = '🎉 Centenarian! 🎉';
            
            showNotification(message, 'milestone');
        }
    }

    function getWesternZodiac(date) {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        
        if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
        if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
        if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
        if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
        if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
        if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
        if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
        if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
        if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
        if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
        if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
        if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';
        
        return 'Unknown';
    }

    function getGeneration(year) {
        if (year >= 2010) return 'Gen Alpha';
        if (year >= 1997) return 'Gen Z';
        if (year >= 1981) return 'Millennial';
        if (year >= 1965) return 'Gen X';
        if (year >= 1946) return 'Boomer';
        if (year >= 1928) return 'Silent';
        return 'Greatest Generation';
    }

    function saveProfile() {
        if (!currentProfile) {
            showError('Calculate age first');
            return;
        }
        
        const name = prompt('Enter a name for this profile:');
        if (!name) return;
        
        const profile = {
            id: Date.now(),
            name,
            birthDate: currentProfile.birthDate,
            age: currentProfile.age,
            saved: new Date().toISOString()
        };
        
        profiles.push(profile);
        saveProfilesToStorage();
        renderProfilesList();
        showNotification('Profile saved successfully!', 'success');
    }

    function loadProfiles() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['profiles'], (result) => {
                profiles = result.profiles || [];
                renderProfilesList();
            });
        } else {
            // Fallback for local development
            const saved = localStorage.getItem('ageProfiles');
            profiles = saved ? JSON.parse(saved) : [];
            renderProfilesList();
        }
    }

    function saveProfilesToStorage() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ profiles });
        } else {
            // Fallback for local development
            localStorage.setItem('ageProfiles', JSON.stringify(profiles));
        }
    }

    function renderProfilesList() {
        if (!profilesList) return;
        
        // Clear safely
        while (profilesList.firstChild) {
            profilesList.removeChild(profilesList.firstChild);
        }
        
        if (profiles.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-state';
            emptyDiv.textContent = 'No saved profiles';
            profilesList.appendChild(emptyDiv);
            return;
        }
        
        // Create profile items safely using DOM methods (NO innerHTML)
        profiles.forEach((profile) => {
            const profileDiv = document.createElement('div');
            profileDiv.className = 'profile-item';
            profileDiv.setAttribute('data-id', profile.id);
            
            // Profile info container
            const infoDiv = document.createElement('div');
            infoDiv.className = 'profile-info';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'profile-name';
            nameSpan.textContent = profile.name; // SAFE: textContent, not innerHTML
            
            const ageSpan = document.createElement('span');
            ageSpan.className = 'profile-age';
            ageSpan.textContent = `${profile.age.years}y ${profile.age.months}m`;
            
            infoDiv.appendChild(nameSpan);
            infoDiv.appendChild(ageSpan);
            
            // Actions container
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'profile-actions';
            
            // Load button
            const loadBtn = document.createElement('button');
            loadBtn.className = 'icon-btn small load-profile';
            loadBtn.setAttribute('aria-label', 'Load profile');
            loadBtn.title = 'Load profile';
            loadBtn.textContent = '📂';
            loadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                loadProfile(profile.id);
            });
            
            // Compare button
            const compareBtn = document.createElement('button');
            compareBtn.className = 'icon-btn small compare-profile';
            compareBtn.setAttribute('aria-label', 'Compare');
            compareBtn.title = 'Compare';
            compareBtn.textContent = '🔄';
            compareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                addToComparison(profile.id);
            });
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'icon-btn small delete-profile';
            deleteBtn.setAttribute('aria-label', 'Delete');
            deleteBtn.title = 'Delete';
            deleteBtn.textContent = '🗑️';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteProfile(profile.id);
            });
            
            actionsDiv.appendChild(loadBtn);
            actionsDiv.appendChild(compareBtn);
            actionsDiv.appendChild(deleteBtn);
            
            profileDiv.appendChild(infoDiv);
            profileDiv.appendChild(actionsDiv);
            
            profilesList.appendChild(profileDiv);
        });
    }

    function loadProfile(id) {
        const profile = profiles.find(p => p.id === id);
        if (profile) {
            dateInput.value = profile.birthDate;
            calculateAge();
        }
    }

    function deleteProfile(id) {
        if (confirm('Are you sure you want to delete this profile?')) {
            profiles = profiles.filter(p => p.id !== id);
            saveProfilesToStorage();
            renderProfilesList();
        }
    }

    function addToComparison(id) {
        const profile = profiles.find(p => p.id === id);
        if (!profile) return;
        
        if (!currentProfile) {
            showError('Calculate current age first');
            return;
        }
        
        showComparisonView([profile, { 
            name: 'Current', 
            age: currentProfile.age,
            isCurrent: true 
        }]);
    }

    function toggleComparisonMode() {
        if (!currentProfile) {
            showError('Calculate age first');
            return;
        }
        
        if (profiles.length === 0) {
            showError('No saved profiles to compare');
            return;
        }
        
        // Create array with current and first 3 profiles
        const compareProfiles = [
            { name: 'Current', age: currentProfile.age, isCurrent: true },
            ...profiles.slice(0, 3).map(p => ({ name: p.name, age: p.age }))
        ];
        
        showComparisonView(compareProfiles);
    }

    function showComparisonView(profiles) {
        // Remove existing modal if any
        const existingModal = document.querySelector('.comparison-modal');
        if (existingModal) existingModal.remove();
        
        // Create comparison modal safely (NO innerHTML)
        const modal = document.createElement('div');
        modal.className = 'comparison-modal';
        
        const content = document.createElement('div');
        content.className = 'comparison-content';
        
        // Heading
        const heading = document.createElement('h3');
        heading.textContent = 'Age Comparison';
        content.appendChild(heading);
        
        // Bars container
        const barsContainer = document.createElement('div');
        barsContainer.className = 'comparison-bars';
        
        const maxAge = Math.max(...profiles.map(p => p.age.years));
        
        profiles.forEach(profile => {
            const barContainer = document.createElement('div');
            barContainer.className = 'comparison-bar-container';
            
            const bar = document.createElement('div');
            bar.className = `comparison-bar ${profile.isCurrent ? 'current' : ''}`;
            bar.style.height = `${(profile.age.years / maxAge) * 150}px`;
            
            const barLabel = document.createElement('span');
            barLabel.className = 'bar-label';
            barLabel.textContent = `${profile.age.years}y`;
            bar.appendChild(barLabel);
            
            const barName = document.createElement('span');
            barName.className = 'bar-name';
            barName.title = profile.name;
            barName.textContent = profile.name; // SAFE: textContent
            
            barContainer.appendChild(bar);
            barContainer.appendChild(barName);
            barsContainer.appendChild(barContainer);
        });
        
        content.appendChild(barsContainer);
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-modal';
        closeBtn.textContent = 'Close';
        closeBtn.addEventListener('click', () => modal.remove());
        content.appendChild(closeBtn);
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    function shareResults() {
        if (!currentProfile) {
            showError('Calculate age first');
            return;
        }
        
        const text = `I am ${currentProfile.age.years} years, ${currentProfile.age.months} months, and ${currentProfile.age.days} days old!
🌟 Zodiac: ${currentProfile.zodiac}
📅 Born on: ${currentProfile.dayOfWeek}
⏱️ Total days alive: ${formatNumber(currentProfile.totalDays)}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'My Age',
                text: text,
            }).catch(() => {
                copyToClipboard(text);
            });
        } else {
            copyToClipboard(text);
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Copied to clipboard!', 'success');
        }).catch(() => {
            showError('Could not copy to clipboard');
        });
    }

    function toggleTheme() {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode', darkMode);
        if (themeToggle) {
            themeToggle.textContent = darkMode ? '☀️' : '🌙';
        }
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ darkMode });
        } else {
            localStorage.setItem('darkMode', darkMode);
        }
    }

    function loadTheme() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['darkMode'], (result) => {
                darkMode = result.darkMode || false;
                document.body.classList.toggle('dark-mode', darkMode);
                if (themeToggle) {
                    themeToggle.textContent = darkMode ? '☀️' : '🌙';
                }
            });
        } else {
            const saved = localStorage.getItem('darkMode');
            darkMode = saved === 'true' || false;
            document.body.classList.toggle('dark-mode', darkMode);
            if (themeToggle) {
                themeToggle.textContent = darkMode ? '☀️' : '🌙';
            }
        }
    }

    function showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.setAttribute('role', 'alert');
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) notification.remove();
            }, 300);
        }, 3000);
    }

    // Number Counting Animation
    function animateCount(element, target, duration) {
        if (!element) return;
        
        let start = 0;
        const end = parseInt(target, 10);
        element.textContent = start;
        
        if (start === end) return;
        
        const increment = end > start ? 1 : -1;
        const steps = Math.abs(end - start);
        const stepTime = Math.max(Math.floor(duration / steps), 10);
        
        const timer = setInterval(() => {
            start += increment;
            element.textContent = start;
            if (start === end) {
                clearInterval(timer);
            }
        }, stepTime);
    }

    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function showError(msg) {
        if (!errorMessage) return;
        
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');

        // Re-trigger animation by toggling class
        errorMessage.classList.remove('shake-trigger');
        // Force reflow
        void errorMessage.offsetHeight;
        errorMessage.classList.add('shake-trigger');
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 3000);
    }
});