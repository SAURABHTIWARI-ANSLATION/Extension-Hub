// DOM Elements
const questionEl = document.getElementById("question");
const solutionEl = document.getElementById("solution");
const solutionContainer = document.getElementById("solutionContainer");
const languageEl = document.getElementById("language");
const difficultyEl = document.getElementById("difficulty");
const difficultyBadge = document.getElementById("difficultyBadge");
const showBtn = document.getElementById("showSolution");
const newPuzzleBtn = document.getElementById("newPuzzle");
const markSolvedBtn = document.getElementById("markSolved");
const copyBtn = document.getElementById("copyBtn");

// Stats Elements
const streakCountEl = document.getElementById("streakCount");
const totalSolvedEl = document.getElementById("totalSolved");
const easySolvedEl = document.getElementById("easySolved");
const mediumSolvedEl = document.getElementById("mediumSolved");
const hardSolvedEl = document.getElementById("hardSolved");
const bestStreakEl = document.getElementById("bestStreak");

// State
let currentPuzzle = null;
let stats = {
  streak: 0,
  lastSolvedDate: null,
  totalSolved: 0,
  easySolved: 0,
  mediumSolved: 0,
  hardSolved: 0,
  bestStreak: 0,
  solvedPuzzles: new Set()
};

// Initialize stats from storage
async function loadStats() {
  try {
    const result = await chrome.storage.local.get(['stats']);
    if (result.stats) {
      stats = {
        ...stats,
        ...result.stats,
        solvedPuzzles: new Set(result.stats.solvedPuzzles || [])
      };
      updateStreak();
      updateStatsDisplay();
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Save stats to storage
async function saveStats() {
  try {
    await chrome.storage.local.set({
      stats: {
        ...stats,
        solvedPuzzles: Array.from(stats.solvedPuzzles)
      }
    });
  } catch (error) {
    console.error('Failed to save stats:', error);
  }
}

// Update streak based on last solved date
function updateStreak() {
  if (!stats.lastSolvedDate) return;

  const today = new Date().toDateString();
  const lastSolved = new Date(stats.lastSolvedDate).toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  // Reset streak if more than a day has passed
  if (lastSolved !== today && lastSolved !== yesterday) {
    stats.streak = 0;
  }
}

// Update stats display
function updateStatsDisplay() {
  streakCountEl.textContent = stats.streak;
  totalSolvedEl.textContent = stats.totalSolved;
  easySolvedEl.textContent = stats.easySolved;
  mediumSolvedEl.textContent = stats.mediumSolved;
  hardSolvedEl.textContent = stats.hardSolved;
  bestStreakEl.textContent = stats.bestStreak;
}

// Mark puzzle as solved
async function markAsSolved() {
  if (!currentPuzzle) return;

  const puzzleId = getPuzzleId(currentPuzzle);
  if (stats.solvedPuzzles.has(puzzleId)) {
    showNotification("Already marked as solved! 🎉");
    return;
  }

  // Update streak
  const today = new Date().toDateString();
  const lastSolved = stats.lastSolvedDate ? new Date(stats.lastSolvedDate).toDateString() : null;
  
  if (lastSolved === today) {
    // Already solved one today, don't increment streak
  } else if (!lastSolved || lastSolved === new Date(Date.now() - 86400000).toDateString()) {
    // First solve today or solved yesterday
    stats.streak++;
  } else {
    // Streak broken, restart
    stats.streak = 1;
  }

  stats.lastSolvedDate = new Date().toISOString();
  stats.totalSolved++;
  stats.solvedPuzzles.add(puzzleId);

  // Update difficulty-specific stats
  if (currentPuzzle.difficulty === 'easy') stats.easySolved++;
  else if (currentPuzzle.difficulty === 'medium') stats.mediumSolved++;
  else if (currentPuzzle.difficulty === 'hard') stats.hardSolved++;

  // Update best streak
  if (stats.streak > stats.bestStreak) {
    stats.bestStreak = stats.streak;
  }

  await saveStats();
  updateStatsDisplay();
  
  showNotification("🎉 Puzzle solved! Keep going!");
  markSolvedBtn.classList.add("hidden");
}

// Show notification
function showNotification(message) {
  const originalText = markSolvedBtn.textContent;
  markSolvedBtn.textContent = message;
  setTimeout(() => {
    if (!markSolvedBtn.classList.contains("hidden")) {
      markSolvedBtn.textContent = originalText;
    }
  }, 2000);
}

// Generate unique puzzle ID
function getPuzzleId(puzzle) {
  return `${languageEl.value}-${puzzle.question.substring(0, 30)}`;
}

// Get daily index based on date
function getDailyIndex(puzzles) {
  const today = new Date().toDateString();
  const hash = today.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return hash % puzzles.length;
}

// Filter puzzles by difficulty
function filterPuzzles(puzzles) {
  const difficulty = difficultyEl.value;
  if (difficulty === 'all') return puzzles;
  return puzzles.filter(p => p.difficulty === difficulty);
}

// Load puzzle
function loadPuzzle(isRandom = false) {
  const lang = languageEl.value;
  let puzzles = PUZZLES[lang];
  
  // Filter by difficulty
  puzzles = filterPuzzles(puzzles);
  
  if (puzzles.length === 0) {
    questionEl.textContent = "No puzzles available for this difficulty level.";
    return;
  }

  // Decide index: Random or Daily
  let index;
  if (isRandom) {
    index = Math.floor(Math.random() * puzzles.length);
  } else {
    index = getDailyIndex(puzzles);
  }

  currentPuzzle = puzzles[index];

  // Update DOM
  questionEl.textContent = currentPuzzle.question;
  solutionEl.textContent = currentPuzzle.solution;
  
  // Update difficulty badge
  difficultyBadge.textContent = currentPuzzle.difficulty;
  difficultyBadge.className = `difficulty-badge difficulty-${currentPuzzle.difficulty}`;

  // Reset View
  solutionContainer.classList.add("hidden");
  showBtn.textContent = "Show Solution";
  markSolvedBtn.classList.add("hidden");

  // Check if already solved
  const puzzleId = getPuzzleId(currentPuzzle);
  if (stats.solvedPuzzles.has(puzzleId)) {
    questionEl.innerHTML = `${currentPuzzle.question} <span style="color: #10b981;">✓ Solved</span>`;
  }
}

// Copy to clipboard
async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(solutionEl.textContent);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = "✅ Copied!";
    setTimeout(() => copyBtn.textContent = originalText, 1500);
  } catch (err) {
    console.error('Failed to copy:', err);
    copyBtn.textContent = "❌ Failed";
    setTimeout(() => copyBtn.textContent = "📋 Copy", 1500);
  }
}

// Event Listeners
languageEl.addEventListener("change", () => loadPuzzle(false));
difficultyEl.addEventListener("change", () => loadPuzzle(false));

newPuzzleBtn.addEventListener("click", () => loadPuzzle(true));

copyBtn.addEventListener("click", copyToClipboard);

markSolvedBtn.addEventListener("click", markAsSolved);

showBtn.addEventListener("click", () => {
  const isHidden = solutionContainer.classList.contains("hidden");
  if (isHidden) {
    solutionContainer.classList.remove("hidden");
    showBtn.textContent = "Hide Solution";
    markSolvedBtn.classList.remove("hidden");
  } else {
    solutionContainer.classList.add("hidden");
    showBtn.textContent = "Show Solution";
    markSolvedBtn.classList.add("hidden");
  }
});

// Initialize
(async () => {
  await loadStats();
  loadPuzzle();
})();