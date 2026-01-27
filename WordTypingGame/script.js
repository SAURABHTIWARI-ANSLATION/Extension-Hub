const words = [
    "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "with", "as", "not", "on", "she", "at", "by", "this", "we", "you", "do", "but", "from", "or", "which", "one", "would", "all", "will", "there", "say", "who", "make", "when", "can", "more", "if", "no", "man", "out", "other", "so", "what", "time", "up", "go", "about", "than", "into", "could", "state", "only", "new", "year", "some", "take", "come", "these", "know", "see", "use", "get", "like", "then", "first", "any", "work", "now", "may", "such", "give", "over", "think", "most", "even", "find", "day", "also", "after", "way", "many", "must", "look", "before", "great", "back", "through", "long", "where", "much", "should", "well", "people", "down", "own", "just", "because", "good", "each", "those", "feel", "seem", "how", "high", "too", "place", "little", "world", "very", "still", "nation", "hand", "old", "life", "tell", "write", "become", "here", "show", "house", "both", "between", "need", "mean", "call", "develop", "under", "last", "right", "move", "thing", "general", "school", "never", "same", "another", "begin", "while", "number", "part", "turn", "real", "leave", "might", "want", "point", "form", "off", "child", "few", "small", "since", "against", "ask", "late", "home", "interest", "large", "person", "end", "open", "public", "follow", "during", "present", "without", "again", "hold", "govern", "around", "possible", "head", "consider", "word", "program", "problem", "however", "lead", "system", "set", "order", "eye", "plan", "run", "keep", "face", "fact", "group", "play", "stand", "increase", "early", "course", "change", "help", "line"
];

// Settings
let selectedDurationMinutes = 2; // Default 2 minutes
let gameDurationSeconds = 120;

// DOM Elements
const wordDisplay = document.getElementById('word-display');
const inputField = document.getElementById('input-field');
const wpmElement = document.getElementById('wpm');
const accuracyElement = document.getElementById('accuracy');
const errorElement = document.getElementById('error-count');
const timerElement = document.getElementById('timer');
const restartBtn = document.getElementById('restart-btn');
const timerBtns = document.querySelectorAll('.timer-btn');
const modalOverlay = document.getElementById('result-modal');
const modalRestartBtn = document.getElementById('modal-restart-btn');

// Modal Stats
const finalWpm = document.getElementById('final-wpm');
const finalAccuracy = document.getElementById('final-accuracy');
const finalErrors = document.getElementById('final-errors');
const finalChars = document.getElementById('final-chars');

// Game State
let timeLeft = gameDurationSeconds;
let timer = null;
let isPlaying = false;
let charIndex = 0;
let currentWordIndex = 0;
let correctKeyStrokes = 0;
let totalKeyStrokes = 0;
let errorCount = 0;
let generatedWords = [];

// Formatter for time MM:SS
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// Initialize Game
function init() {
    generatedWords = [];
    // Generate 300 random words (more words for longer durations)
    for (let i = 0; i < 300; i++) {
        const randomIndex = Math.floor(Math.random() * words.length);
        generatedWords.push(words[randomIndex]);
    }
    renderWords();
    resetStats();

    // Focus input on load
    // inputField.focus(); // Optional: might be annoying if user is selecting timer
}

function updateDuration(minutes) {
    selectedDurationMinutes = parseInt(minutes);
    gameDurationSeconds = selectedDurationMinutes * 60;

    // Reset game immediately when timer changes
    init();
}

function renderWords() {
    wordDisplay.innerHTML = "";
    generatedWords.forEach((word, index) => {
        const span = document.createElement('span');
        span.classList.add('word');
        word.split('').forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.innerText = char;
            charSpan.classList.add('char');
            span.appendChild(charSpan);
        });

        if (index === 0) {
            span.classList.add('active');
            if (span.children.length > 0) {
                span.children[0].classList.add('current');
            }
        }

        wordDisplay.appendChild(span);
    });
}

function resetStats() {
    clearInterval(timer);
    timeLeft = gameDurationSeconds;
    isPlaying = false;
    charIndex = 0;
    currentWordIndex = 0;
    correctKeyStrokes = 0;
    totalKeyStrokes = 0;
    errorCount = 0;

    wpmElement.innerText = 0;
    accuracyElement.innerText = "100%";
    errorElement.innerText = 0;
    timerElement.innerText = formatTime(timeLeft);
    inputField.value = "";

    modalOverlay.classList.remove('active');
    modalOverlay.classList.add('hidden');
}

function startGame() {
    isPlaying = true;
    timer = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            timerElement.innerText = formatTime(timeLeft);
            if (timeLeft % 1 === 0) calculateWPM(); // Update WPM every second mostly
        } else {
            endGame();
        }
    }, 1000);
}

function endGame() {
    clearInterval(timer);
    isPlaying = false;
    inputField.blur();
    calculateWPM();
    showResults();
}

function showResults() {
    finalWpm.innerText = wpmElement.innerText;
    finalAccuracy.innerText = accuracyElement.innerText;
    finalErrors.innerText = errorCount;
    finalChars.innerText = correctKeyStrokes;

    modalOverlay.classList.remove('hidden');
    // Force reflow for transition if needed, or just let CSS handle opacity
    // modalOverlay.classList.add('active'); // If using extra class for animation
}

function calculateWPM() {
    const timeElapsed = gameDurationSeconds - timeLeft;
    if (timeElapsed === 0) return;

    const minutes = timeElapsed / 60;
    const wpm = Math.round((correctKeyStrokes / 5) / minutes);

    const accuracy = totalKeyStrokes > 0
        ? Math.round(((totalKeyStrokes - errorCount) / totalKeyStrokes) * 100)
        : 100;

    wpmElement.innerText = wpm;
    accuracyElement.innerText = accuracy + "%";
    errorElement.innerText = errorCount;
}

// Input Event
inputField.addEventListener('input', (e) => {
    if (!isPlaying && timeLeft === gameDurationSeconds && inputField.value.length > 0) {
        startGame();
    }

    const val = inputField.value;
    const currentWordSpan = wordDisplay.children[currentWordIndex];
    const currentWord = generatedWords[currentWordIndex];

    // Handle Space (Next Word)
    if (e.data === ' ' || (val.endsWith(' ') && val.length > 0)) {
        e.preventDefault();
        inputField.value = "";

        currentWordSpan.classList.remove('active');
        Array.from(currentWordSpan.children).forEach(char => char.classList.remove('current'));

        currentWordIndex++;
        charIndex = 0;

        if (currentWordIndex < generatedWords.length) {
            const nextWordSpan = wordDisplay.children[currentWordIndex];
            nextWordSpan.classList.add('active');
            nextWordSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (nextWordSpan.children.length > 0) {
                nextWordSpan.children[0].classList.add('current');
            }
        } else {
            endGame();
        }
        return;
    }

    // Handle Backspace
    if (e.inputType === 'deleteContentBackward') {
        if (charIndex > 0) {
            charIndex--;
            const charSpan = currentWordSpan.children[charIndex];
            charSpan.classList.remove('correct', 'incorrect');

            if (charIndex + 1 < currentWordSpan.children.length) {
                currentWordSpan.children[charIndex + 1].classList.remove('current');
            }
            charSpan.classList.add('current');
        }
        return;
    }

    // Handle Character Typing
    if (e.data) {
        const typedChar = e.data;
        if (charIndex < currentWordSpan.children.length) {
            const charSpan = currentWordSpan.children[charIndex];
            const originalChar = currentWord[charIndex];

            charSpan.classList.remove('current');

            if (typedChar === originalChar) {
                charSpan.classList.add('correct');
                correctKeyStrokes++;
            } else {
                charSpan.classList.add('incorrect');
                errorCount++;
            }

            totalKeyStrokes++;
            charIndex++;

            if (charIndex < currentWordSpan.children.length) {
                currentWordSpan.children[charIndex].classList.add('current');
            }

            calculateWPM();
        } else {
            errorCount++;
            calculateWPM();
        }
    }
});

// Timer Selection
timerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        timerBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateDuration(btn.dataset.time);
    });
});

// Restart Buttons
restartBtn.addEventListener('click', init);
modalRestartBtn.addEventListener('click', init);

// Focus handlers
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        inputField.focus();
    }
});
document.getElementById('focus-overlay')?.addEventListener('click', () => inputField.focus());
document.querySelector('.typing-area-wrapper')?.addEventListener('click', () => inputField.focus());

// Init
init();