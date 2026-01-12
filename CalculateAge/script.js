document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('birthdate');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultContainer = document.getElementById('result-container');
    const nextBdayContainer = document.getElementById('next-birthday-container');
    const errorMessage = document.getElementById('error-message');

    // Elements for displaying results
    const yearsDisplay = document.getElementById('years');
    const monthsDisplay = document.getElementById('months');
    const daysDisplay = document.getElementById('days');
    const nextBdayCountdown = document.getElementById('next-bday-countdown');

    // Set max date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('max', today);

    // Initial focus
    /* dateInput.focus(); // Optional: can be annoying in extension popups sometimes */

    calculateBtn.addEventListener('click', calculateAge);
    dateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateAge();
    });

    function calculateAge() {
        const birthDateString = dateInput.value;

        // Reset UI
        errorMessage.classList.add('hidden');
        resultContainer.classList.remove('visible');
        resultContainer.classList.add('hidden');
        nextBdayContainer.classList.add('hidden');

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

        if (days < 0) {
            months--;
            const lastMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 0);
            days += lastMonth.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        // --- Next Birthday Calculation ---
        const nextBirthday = new Date(todayDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        if (todayDate > nextBirthday) {
            nextBirthday.setFullYear(todayDate.getFullYear() + 1);
        }
        const timeDiff = nextBirthday - todayDate;
        const daysToNextBirthday = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));


        // --- Display & Animation ---
        resultContainer.classList.remove('hidden');

        // Slight delay for layout to stabilize
        requestAnimationFrame(() => {
            resultContainer.classList.add('visible');
            animateCount(yearsDisplay, years, 1500);
            animateCount(monthsDisplay, months, 1000);
            animateCount(daysDisplay, days, 1000);
        });

        // Show Next Birthday
        if (daysToNextBirthday > 0 && daysToNextBirthday < 366) {
            nextBdayCountdown.textContent = `${daysToNextBirthday} ${daysToNextBirthday === 1 ? 'day' : 'days'}`;
            nextBdayContainer.classList.remove('hidden');
        } else if (daysToNextBirthday === 0 || daysToNextBirthday === 365 || daysToNextBirthday === 366) {
            // Logic for 'Today is your birthday' could go here
            nextBdayCountdown.textContent = "It's today! Happy Birthday! 🎉";
            nextBdayContainer.classList.remove('hidden');
        }
    }

    // Number Counting Animation
    function animateCount(element, target, duration) {
        let start = 0;
        const end = parseInt(target, 10);
        if (start === end) {
            element.textContent = end;
            return;
        }

        const range = end - start;
        const increment = end > start ? 1 : -1;
        const stepTime = Math.abs(Math.floor(duration / range));

        // Cap speed for very large numbers
        const safeStepTime = Math.max(stepTime, 20);

        const timer = setInterval(() => {
            start += increment;
            element.textContent = start;
            if (start === end) {
                clearInterval(timer);
            }
        }, safeStepTime);
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');

        // Re-trigger animation
        errorMessage.style.animation = 'none';
        errorMessage.offsetHeight; /* trigger reflow */
        errorMessage.style.animation = null;
    }
});