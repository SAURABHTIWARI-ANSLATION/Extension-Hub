// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadUserProgress();
  initializeEventListeners();
  updateUI();
});

// Load user progress
async function loadUserProgress() {
  const data = await chrome.storage.local.get(['userProgress']);
  if (!data.userProgress) {
    await chrome.storage.local.set({
      userProgress: {
        totalSolved: 0,
        totalPoints: 0,
        puzzles: {}
      }
    });
  }
}

// Initialize event listeners
function initializeEventListeners() {
  // Difficulty buttons
  document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Category cards
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', function() {
      const type = this.dataset.type;
      const difficulty = document.querySelector('.difficulty-btn.active').dataset.level;
      
      if (type === 'custom') {
        handleCustomPuzzle();
      } else {
        startPuzzle(type, difficulty);
      }
    });
  });

  // Back button
  document.getElementById('back-btn').addEventListener('click', () => {
    showScreen('selection-screen');
  });

  // Hint button
  document.getElementById('hint-btn').addEventListener('click', () => {
    puzzleEngine.showHint();
  });

  // Submit solution
  document.getElementById('submit-solution').addEventListener('click', () => {
    const answer = document.getElementById('solution-input').value;
    puzzleEngine.checkSolution(answer);
  });

  // Next puzzle
  document.getElementById('next-puzzle').addEventListener('click', () => {
    const type = puzzleEngine.currentType;
    const difficulty = document.querySelector('.difficulty-btn.active').dataset.level;
    startPuzzle(type, difficulty);
  });

  // Return to menu
  document.getElementById('return-menu').addEventListener('click', () => {
    showScreen('selection-screen');
    updateUI();
  });

  // Share result
  document.getElementById('share-result').addEventListener('click', () => {
    const time = document.getElementById('completion-time').textContent;
    const points = document.getElementById('completion-points').textContent;
    
    const shareText = `I solved a ${puzzleEngine.currentPuzzle.difficulty} puzzle in ${time} and earned ${points} on Puzzle Pulse Pro!`;
    
    navigator.clipboard.writeText(shareText).then(() => {
      alert('Result copied to clipboard!');
    });
  });
}

// Start puzzle
async function startPuzzle(type, difficulty) {
  // Update UI
  document.getElementById('puzzle-title').textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Puzzle`;
  document.getElementById('puzzle-difficulty').textContent = difficulty;
  document.getElementById('puzzle-difficulty').className = `difficulty-badge ${difficulty}`;
  
  // Load puzzle
  await puzzleEngine.loadPuzzle(type, difficulty);
  
  // Show puzzle screen
  showScreen('puzzle-screen');
}

// Show specific screen
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

// Handle custom puzzle
function handleCustomPuzzle() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Convert to data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        // Create custom puzzle
        const customPuzzle = {
          id: 'custom_' + Date.now(),
          title: 'Custom Image Puzzle',
          type: 'custom',
          difficulty: 'medium',
          image: event.target.result,
          hint: 'This is your custom puzzle!',
          solution: 'custom'
        };
        
        puzzleEngine.currentPuzzle = customPuzzle;
        puzzleEngine.displayPuzzle(customPuzzle);
        showScreen('puzzle-screen');
      };
      reader.readAsDataURL(file);
    }
  };
  
  input.click();
}

// Update UI
async function updateUI() {
  const data = await chrome.storage.local.get(['userProgress']);
  const progress = data.userProgress || { totalSolved: 0, totalPoints: 0 };
  
  document.getElementById('total-solved').textContent = progress.totalSolved;
  document.getElementById('total-points').textContent = progress.totalPoints;
  
  // Update progress bar
  const totalPuzzles = 45; // Total puzzles in database
  const percent = Math.min(100, (progress.totalSolved / totalPuzzles) * 100);
  document.querySelector('.progress-fill').style.width = `${percent}%`;
  document.querySelector('.progress-text').textContent = `${Math.round(percent)}% Complete`;
}