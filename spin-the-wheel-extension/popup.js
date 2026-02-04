document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const optionsList = document.getElementById('optionsList');
    const newOptionInput = document.getElementById('newOption');
    const addOptionBtn = document.getElementById('addOption');
    const clearOptionsBtn = document.getElementById('clearOptions');
    const randomOptionsBtn = document.getElementById('randomOptions');
    const spinWheelBtn = document.getElementById('spinWheel');
    const openWheelBtn = document.getElementById('openWheel');
    const spinDurationSlider = document.getElementById('spinDuration');
    const durationValue = document.getElementById('durationValue');
    const colorOptions = document.querySelectorAll('.color-option');
    const historyList = document.getElementById('historyList');

    // Default options
    const defaultOptions = ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'];
    const randomSuggestions = [
        'Pizza', 'Burger', 'Sushi', 'Tacos', 'Pasta',
        'Movie', 'Walk', 'Game', 'Nap', 'Read',
        'Red', 'Blue', 'Green', 'Yellow', 'Purple'
    ];

    // Selected colors
    let selectedColors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2'];

    // Load saved data
    loadData();

    // Event Listeners
    addOptionBtn.addEventListener('click', addOption);
    newOptionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addOption();
    });
    
    clearOptionsBtn.addEventListener('click', clearOptions);
    randomOptionsBtn.addEventListener('click', addRandomOptions);
    spinWheelBtn.addEventListener('click', spinWheel);
    openWheelBtn.addEventListener('click', openFullscreenWheel);
    spinDurationSlider.addEventListener('input', updateDurationValue);
    
    colorOptions.forEach(color => {
        color.addEventListener('click', () => {
            colorOptions.forEach(c => c.classList.remove('active'));
            color.classList.add('active');
            // In a real app, you might want to use this selected color
        });
    });

    // Functions
    function loadData() {
        chrome.storage.local.get(['wheelOptions', 'spinDuration', 'history'], (data) => {
            const options = data.wheelOptions || defaultOptions;
            const duration = data.spinDuration || 5;
            const history = data.history || [];
            
            displayOptions(options);
            spinDurationSlider.value = duration;
            durationValue.textContent = duration;
            displayHistory(history);
        });
    }

    function displayOptions(options) {
        optionsList.innerHTML = '';
        options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option-item';
            optionElement.innerHTML = `
                <span class="option-text">${option}</span>
                <button class="remove-option" data-index="${index}">×</button>
            `;
            optionsList.appendChild(optionElement);
        });

        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-option').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeOption(index);
            });
        });
    }

    function addOption() {
        const option = newOptionInput.value.trim();
        if (option) {
            chrome.storage.local.get(['wheelOptions'], (data) => {
                const options = data.wheelOptions || defaultOptions;
                options.push(option);
                chrome.storage.local.set({ wheelOptions: options }, () => {
                    displayOptions(options);
                    newOptionInput.value = '';
                    newOptionInput.focus();
                });
            });
        }
    }

    function removeOption(index) {
        chrome.storage.local.get(['wheelOptions'], (data) => {
            const options = data.wheelOptions || defaultOptions;
            options.splice(index, 1);
            chrome.storage.local.set({ wheelOptions: options }, () => {
                displayOptions(options);
            });
        });
    }

    function clearOptions() {
        if (confirm('Are you sure you want to clear all options?')) {
            chrome.storage.local.set({ wheelOptions: [] }, () => {
                displayOptions([]);
            });
        }
    }

    function addRandomOptions() {
        const randomOptions = [];
        while (randomOptions.length < 5) {
            const randomOption = randomSuggestions[Math.floor(Math.random() * randomSuggestions.length)];
            if (!randomOptions.includes(randomOption)) {
                randomOptions.push(randomOption);
            }
        }
        
        chrome.storage.local.get(['wheelOptions'], (data) => {
            const options = data.wheelOptions || [];
            const combinedOptions = [...options, ...randomOptions].slice(0, 20); // Limit to 20
            chrome.storage.local.set({ wheelOptions: combinedOptions }, () => {
                displayOptions(combinedOptions);
            });
        });
    }

    function updateDurationValue() {
        const duration = spinDurationSlider.value;
        durationValue.textContent = duration;
        chrome.storage.local.set({ spinDuration: parseInt(duration) });
    }

    function spinWheel() {
        chrome.storage.local.get(['wheelOptions'], (data) => {
            const options = data.wheelOptions || defaultOptions;
            if (options.length < 2) {
                alert('Please add at least 2 options to spin the wheel!');
                return;
            }
            
            chrome.storage.local.get(['spinDuration'], (data) => {
                const duration = data.spinDuration || 5;
                
                chrome.runtime.sendMessage({
                    action: 'spinWheel',
                    options: options,
                    duration: duration,
                    colors: selectedColors
                });
            });
        });
    }

    function openFullscreenWheel() {
        chrome.storage.local.get(['wheelOptions'], (data) => {
            const options = data.wheelOptions || defaultOptions;
            if (options.length < 2) {
                alert('Please add at least 2 options to open the wheel!');
                return;
            }
            
            chrome.windows.create({
                url: chrome.runtime.getURL('wheel.html'),
                type: 'popup',
                width: 800,
                height: 800,
                focused: true
            });
        });
    }

    function displayHistory(history) {
        historyList.innerHTML = '';
        history.slice(-5).reverse().forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <span>${item.result}</span>
                <span class="history-time">${item.time}</span>
            `;
            historyList.appendChild(historyItem);
        });
    }

    // Load colors
    colorOptions[0].classList.add('active');

    // Listen for result messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'updateHistory') {
            loadData();
        }
    });
});