
// FIX 1: Ensure window variables exist before using them
if (typeof window.IMAGE_PUZZLES === 'undefined') window.IMAGE_PUZZLES = {};
if (typeof window.LOGIC_PUZZLES === 'undefined') window.LOGIC_PUZZLES = {};
if (typeof window.WORD_PUZZLES === 'undefined') window.WORD_PUZZLES = {};
if (typeof window.MATH_PUZZLES === 'undefined') window.MATH_PUZZLES = {};

// FIX 2: Create PUZZLE_DATABASES with safe defaults
const PUZZLE_DATABASES = {
  image: window.IMAGE_PUZZLES || {
    jigsaw: [],
    find_differences: [],
    rotate: []
  },
  logic: window.LOGIC_PUZZLES || {
    riddles: [],
    sequence: []
  },
  word: window.WORD_PUZZLES || {
    anagrams: [],
    word_search: []
  },
  math: window.MATH_PUZZLES || {
    calculation: [],
    algebra: []
  }
};

console.log('Puzzle databases loaded:', Object.keys(PUZZLE_DATABASES));

class PuzzleEngine {
  constructor() {
    this.currentPuzzle = null;
    this.currentType = null;
    this.timer = null;
    this.timeLeft = 600;
    this.pieces = [];
    this.selectedPieces = [];
    this.userAnswers = {};
    
    // Log available types
    console.log('Available puzzle types:', this.getAvailableTypes());
  }

  // Get all available puzzle types
  getAvailableTypes() {
    const types = Object.keys(PUZZLE_DATABASES);
    // Filter out empty databases
    return types.filter(type => {
      const db = PUZZLE_DATABASES[type];
      return db && Object.keys(db).length > 0;
    });
  }

  // Get puzzles by type and difficulty - FIXED VERSION
  getPuzzlesByType(type, difficulty = null) {
    console.log(`Getting puzzles for type: ${type}, difficulty: ${difficulty}`);
    
    // FIX: Check if type exists in database
    if (!PUZZLE_DATABASES[type]) {
      console.warn(`Type "${type}" not found in PUZZLE_DATABASES. Available:`, Object.keys(PUZZLE_DATABASES));
      return [];
    }
    
    const db = PUZZLE_DATABASES[type];
    if (!db || Object.keys(db).length === 0) {
      console.warn(`Database for "${type}" is empty`);
      return [];
    }
    
    if (difficulty) {
      // Filter by difficulty
      const result = [];
      Object.keys(db).forEach(category => {
        if (db[category] && Array.isArray(db[category])) {
          db[category].forEach(puzzle => {
            if (puzzle.difficulty === difficulty) {
              result.push({...puzzle, category});
            }
          });
        }
      });
      console.log(`Found ${result.length} puzzles for ${type} ${difficulty}`);
      return result;
    }
    
    // Return all puzzles of this type
    const allPuzzles = [];
    Object.keys(db).forEach(category => {
      if (db[category] && Array.isArray(db[category])) {
        allPuzzles.push(...db[category]);
      }
    });
    console.log(`Found ${allPuzzles.length} total puzzles for ${type}`);
    return allPuzzles;
  }

  // Get random puzzle - IMPROVED WITH FALLBACK
  getRandomPuzzle(type, difficulty) {
    console.log(`Getting random puzzle: ${type} ${difficulty}`);
    
    let puzzles = this.getPuzzlesByType(type, difficulty);
    
    if (puzzles.length === 0) {
      console.log(`No puzzles found for ${type} ${difficulty}, trying any difficulty`);
      puzzles = this.getPuzzlesByType(type); // Try without difficulty filter
    }
    
    if (puzzles.length === 0) {
      console.warn(`No puzzles at all for ${type}, using fallback`);
      return this.getFallbackPuzzle(type, difficulty);
    }
    
    const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    console.log('Selected puzzle:', puzzle.title);
    return puzzle;
  }

  getFallbackPuzzle(type, difficulty) {
    console.log('Using fallback puzzle');
    return {
      id: 'fallback_' + Date.now(),
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Puzzle`,
      type: 'generic',
      difficulty: difficulty || 'easy',
      question: `Solve this ${type} puzzle. The answer is "test".`,
      solution: 'test',
      hint: 'This is a fallback puzzle',
      points: 100
    };
  }

  // Load puzzle - WITH ERROR HANDLING
  async loadPuzzle(type, difficulty) {
    try {
      console.log(`Loading puzzle: ${type} ${difficulty}`);
      
      this.currentType = type;
      this.currentPuzzle = this.getRandomPuzzle(type, difficulty);
      
      if (!this.currentPuzzle) {
        console.error('Failed to get puzzle, using fallback');
        this.currentPuzzle = this.getFallbackPuzzle(type, difficulty);
      }
      
      console.log('Current puzzle loaded:', this.currentPuzzle.title);
      
      // Set time limit
      this.timeLeft = this.currentPuzzle.timeLimit || 300;
      
      // Display puzzle
      this.displayPuzzle(this.currentPuzzle);
      
      // Start timer
      this.startTimer();
      
      return this.currentPuzzle;
    } catch (error) {
      console.error('Error in loadPuzzle:', error);
      alert('Error loading puzzle. Please try a different category.');
      return null;
    }
  }

  // Display puzzle based on type
  displayPuzzle(puzzle) {
    const container = document.getElementById('puzzle-content');
    container.innerHTML = '';
    
    // Set puzzle info
    document.getElementById('puzzle-title').textContent = puzzle.title;
    document.getElementById('puzzle-difficulty').textContent = puzzle.difficulty;
    document.getElementById('puzzle-difficulty').className = 
      `difficulty-badge ${puzzle.difficulty}`;
    
    switch(puzzle.type) {
      case 'jigsaw':
        this.displayJigsawPuzzle(puzzle);
        break;
      case 'find_differences':
        this.displayFindDifferences(puzzle);
        break;
      case 'rotate':
        this.displayRotatePuzzle(puzzle);
        break;
      case 'riddle':
      case 'deduction':
        this.displayTextPuzzle(puzzle);
        break;
      case 'sequence':
        this.displaySequencePuzzle(puzzle);
        break;
      case 'anagram':
        this.displayAnagramPuzzle(puzzle);
        break;
      case 'word_search':
        this.displayWordSearch(puzzle);
        break;
      case 'hangman':
        this.displayHangman(puzzle);
        break;
      default:
        this.displayGenericPuzzle(puzzle);
    }
  }

  // Jigsaw Puzzle Display
  displayJigsawPuzzle(puzzle) {
    const container = document.getElementById('puzzle-content');
    const pieces = puzzle.pieces || 9;
    const gridSize = Math.sqrt(pieces);
    
    container.innerHTML = `
      <div class="puzzle-instructions">
        <h4><i class="fas fa-puzzle-piece"></i> Jigsaw Puzzle</h4>
        <p>Drag and drop the pieces to complete the image</p>
        <p>Pieces: ${pieces} | Grid: ${gridSize}×${gridSize}</p>
      </div>
      <div class="jigsaw-container" id="jigsaw-container">
        <div class="jigsaw-board" id="jigsaw-board"></div>
        <div class="jigsaw-pieces" id="jigsaw-pieces"></div>
      </div>
      <div class="jigsaw-controls">
        <button id="shuffle-btn" class="control-btn">
          <i class="fas fa-random"></i> Shuffle
        </button>
        <button id="solve-btn" class="control-btn">
          <i class="fas fa-eye"></i> Show Solution
        </button>
      </div>
    `;
    
    this.initializeJigsaw(puzzle);
  }

  initializeJigsaw(puzzle) {
    const board = document.getElementById('jigsaw-board');
    const piecesContainer = document.getElementById('jigsaw-pieces');
    
    // Create board grid
    const gridSize = Math.sqrt(puzzle.pieces);
    board.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    
    // Create pieces
    for (let i = 0; i < puzzle.pieces; i++) {
      const piece = document.createElement('div');
      piece.className = 'jigsaw-piece';
      piece.draggable = true;
      piece.dataset.index = i;
      piece.dataset.correctPos = i;
      
      // Calculate position for background image
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      piece.style.backgroundPosition = 
        `${-col * (100/(gridSize-1))}% ${-row * (100/(gridSize-1))}%`;
      
      piece.innerHTML = `<span>${i+1}</span>`;
      
      piece.addEventListener('dragstart', this.handleDragStart.bind(this));
      
      // Add to pieces container
      piecesContainer.appendChild(piece);
      this.pieces.push(piece);
    }
    
    // Add event listeners to board cells
    for (let i = 0; i < puzzle.pieces; i++) {
      const cell = document.createElement('div');
      cell.className = 'jigsaw-cell';
      cell.dataset.index = i;
      cell.addEventListener('dragover', this.handleDragOver.bind(this));
      cell.addEventListener('drop', this.handleDrop.bind(this));
      board.appendChild(cell);
    }
    
    // Shuffle pieces
    this.shuffleJigsawPieces();
    
    // Add control listeners
    document.getElementById('shuffle-btn').addEventListener('click', 
      () => this.shuffleJigsawPieces());
    document.getElementById('solve-btn').addEventListener('click',
      () => this.showJigsawSolution());
  }

  handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.index);
  }

  handleDragOver(e) {
    e.preventDefault();
  }

  handleDrop(e) {
    e.preventDefault();
    const pieceIndex = e.dataTransfer.getData('text/plain');
    const piece = document.querySelector(`.jigsaw-piece[data-index="${pieceIndex}"]`);
    const cell = e.target.closest('.jigsaw-cell');
    
    if (piece && cell) {
      // Move piece to cell
      cell.appendChild(piece);
      piece.style.position = 'static';
      
      // Check if correct position
      if (parseInt(piece.dataset.correctPos) === parseInt(cell.dataset.index)) {
        piece.classList.add('correct');
        this.checkJigsawComplete();
      }
    }
  }

  shuffleJigsawPieces() {
    const piecesContainer = document.getElementById('jigsaw-pieces');
    const pieces = Array.from(piecesContainer.querySelectorAll('.jigsaw-piece'));
    
    pieces.forEach(piece => {
      piece.classList.remove('correct');
      piece.style.position = 'static';
    });
    
    // Shuffle array
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      piecesContainer.appendChild(pieces[j]);
    }
  }

  showJigsawSolution() {
    // In complete version, this would show solution
    alert('Solution: Arrange pieces in numerical order');
  }

  checkJigsawComplete() {
    const correctPieces = document.querySelectorAll('.jigsaw-piece.correct').length;
    const totalPieces = this.pieces.length;
    
    if (correctPieces === totalPieces) {
      this.puzzleComplete();
    }
  }

  // Find Differences Display
  displayFindDifferences(puzzle) {
    const container = document.getElementById('puzzle-content');
    container.innerHTML = `
      <div class="puzzle-instructions">
        <h4><i class="fas fa-search"></i> Spot the Differences</h4>
        <p>Click on ${puzzle.differences} differences between the two images</p>
        <div class="diff-counter">
          Found: <span id="diff-found">0</span> / ${puzzle.differences}
        </div>
      </div>
      <div class="diff-container">
        <div class="diff-image" id="diff-image1">
          <div class="image-label">Image A</div>
        </div>
        <div class="diff-image" id="diff-image2">
          <div class="image-label">Image B</div>
        </div>
      </div>
      <div class="diff-hints">
        <button id="show-first-diff" class="hint-btn">
          <i class="fas fa-map-marker-alt"></i> Show First Difference
        </button>
      </div>
    `;
    
    this.initializeFindDifferences(puzzle);
  }

  initializeFindDifferences(puzzle) {
    // This would load actual images
    const image1 = document.getElementById('diff-image1');
    const image2 = document.getElementById('diff-image2');
    
    // For demo, create grid overlay
    this.createDifferenceGrid(puzzle);
    
    // Add click handlers
    image1.addEventListener('click', (e) => this.checkDifferenceClick(e, puzzle, 'left'));
    image2.addEventListener('click', (e) => this.checkDifferenceClick(e, puzzle, 'right'));
    
    // Hint button
    document.getElementById('show-first-diff').addEventListener('click', 
      () => this.showFirstDifference(puzzle));
  }

  createDifferenceGrid(puzzle) {
    // Create grid overlay for differences
    const container1 = document.getElementById('diff-image1');
    const container2 = document.getElementById('diff-image2');
    
    // Mark difference areas (simplified for demo)
    puzzle.solution.forEach((diff, index) => {
      const marker1 = document.createElement('div');
      marker1.className = 'diff-marker hidden';
      marker1.dataset.index = index;
      marker1.style.left = `${diff.x}px`;
      marker1.style.top = `${diff.y}px`;
      
      const marker2 = marker1.cloneNode(true);
      
      container1.appendChild(marker1);
      container2.appendChild(marker2);
    });
  }

  checkDifferenceClick(e, puzzle, side) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is near any difference
    let found = false;
    puzzle.solution.forEach((diff, index) => {
      const distance = Math.sqrt(Math.pow(x - diff.x, 2) + Math.pow(y - diff.y, 2));
      if (distance < 20) {
        this.markDifferenceFound(index, side);
        found = true;
      }
    });
    
    if (found) {
      this.updateDifferenceCounter();
      this.checkDifferencesComplete(puzzle);
    }
  }

  markDifferenceFound(index, side) {
    const markers = document.querySelectorAll(`.diff-marker[data-index="${index}"]`);
    markers.forEach(marker => {
      marker.classList.remove('hidden');
      marker.classList.add('found');
      marker.innerHTML = '<i class="fas fa-check-circle"></i>';
    });
  }

  updateDifferenceCounter() {
    const found = document.querySelectorAll('.diff-marker.found').length / 2;
    document.getElementById('diff-found').textContent = Math.floor(found);
  }

  checkDifferencesComplete(puzzle) {
    const found = document.querySelectorAll('.diff-marker.found').length / 2;
    if (found >= puzzle.differences) {
      this.puzzleComplete();
    }
  }

  showFirstDifference(puzzle) {
    if (puzzle.solution && puzzle.solution.length > 0) {
      const firstDiff = puzzle.solution[0];
      alert(`First difference is around coordinates (${firstDiff.x}, ${firstDiff.y})`);
    }
  }

  // Rotate Puzzle Display
  displayRotatePuzzle(puzzle) {
    const container = document.getElementById('puzzle-content');
    container.innerHTML = `
      <div class="puzzle-instructions">
        <h4><i class="fas fa-sync-alt"></i> Rotation Puzzle</h4>
        <p>Rotate the image to find the hidden pattern</p>
      </div>
      <div class="rotate-container">
        <div class="rotate-image" id="rotate-image">
          <div class="rotation-degrees">0°</div>
        </div>
        <div class="rotate-controls">
          <button class="rotate-btn" data-degrees="-90">
            <i class="fas fa-undo"></i> -90°
          </button>
          <button class="rotate-btn" data-degrees="-45">
            <i class="fas fa-angle-left"></i> -45°
          </button>
          <button class="rotate-btn" data-degrees="0">
            <i class="fas fa-redo"></i> Reset
          </button>
          <button class="rotate-btn" data-degrees="45">
            <i class="fas fa-angle-right"></i> +45°
          </button>
          <button class="rotate-btn" data-degrees="90">
            <i class="fas fa-redo"></i> +90°
          </button>
        </div>
        <div class="rotate-info">
          Current rotation: <span id="current-rotation">0</span>°
        </div>
      </div>
      <div class="rotate-submit">
        <button id="submit-rotation" class="submit-btn">
          This is the correct rotation
        </button>
      </div>
    `;
    
    this.initializeRotatePuzzle(puzzle);
  }

  initializeRotatePuzzle(puzzle) {
    let currentRotation = 0;
    const image = document.getElementById('rotate-image');
    const rotationDisplay = document.getElementById('current-rotation');
    
    document.querySelectorAll('.rotate-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const degrees = parseInt(e.target.dataset.degrees);
        
        if (degrees === 0) {
          currentRotation = 0;
        } else {
          currentRotation = (currentRotation + degrees) % 360;
        }
        
        image.style.transform = `rotate(${currentRotation}deg)`;
        rotationDisplay.textContent = currentRotation;
        
        // Check if correct rotation
        if (Math.abs(currentRotation - parseInt(puzzle.solution)) < 5) {
          setTimeout(() => this.puzzleComplete(), 500);
        }
      });
    });
    
    document.getElementById('submit-rotation').addEventListener('click', () => {
      if (Math.abs(currentRotation - parseInt(puzzle.solution)) < 5) {
        this.puzzleComplete();
      } else {
        alert('Not quite right! Try a different rotation.');
      }
    });
  }

  // Text-based puzzles (Riddles, Deductions)
  displayTextPuzzle(puzzle) {
    const container = document.getElementById('puzzle-content');
    container.innerHTML = `
      <div class="text-puzzle-container">
        <div class="puzzle-question">
          <h4><i class="fas fa-question-circle"></i> ${puzzle.title}</h4>
          <div class="question-text">${puzzle.question}</div>
        </div>
        <div class="answer-section">
          <textarea id="text-answer" 
                    placeholder="Type your answer here... 
                    For the river crossing puzzle, describe each step"></textarea>
          <div class="answer-hint">
            <button id="show-explanation" class="hint-btn">
              <i class="fas fa-book"></i> Need explanation?
            </button>
          </div>
        </div>
        <div class="text-submit">
          <button id="submit-text" class="submit-btn">
            <i class="fas fa-paper-plane"></i> Submit Answer
          </button>
        </div>
      </div>
    `;
    
    document.getElementById('submit-text').addEventListener('click', () => {
      const answer = document.getElementById('text-answer').value.trim();
      this.checkTextAnswer(answer, puzzle);
    });
    
    document.getElementById('show-explanation').addEventListener('click', () => {
      if (puzzle.explanation) {
        alert(`Explanation: ${puzzle.explanation}`);
      } else {
        alert('No detailed explanation available for this puzzle.');
      }
    });
  }

  checkTextAnswer(userAnswer, puzzle) {
    // Simple check - in real app, use more sophisticated matching
    const cleanUser = userAnswer.toLowerCase().replace(/[^\w\s]/g, '');
    const cleanSolution = puzzle.solution.toLowerCase().replace(/[^\w\s]/g, '');
    
    if (cleanUser.includes(cleanSolution) || cleanSolution.includes(cleanUser)) {
      this.puzzleComplete();
    } else {
      alert('Not quite right! Try again or use the hint.');
    }
  }

  // Sequence Puzzle
  displaySequencePuzzle(puzzle) {
    const container = document.getElementById('puzzle-content');
    container.innerHTML = `
      <div class="sequence-puzzle-container">
        <div class="sequence-question">
          <h4><i class="fas fa-sort-amount-down"></i> ${puzzle.title}</h4>
          <div class="sequence-text">${puzzle.question}</div>
        </div>
        <div class="sequence-options">
          <h5>What comes next?</h5>
          <div class="options-grid" id="options-grid"></div>
        </div>
        <div class="sequence-hint">
          <button id="sequence-hint-btn" class="hint-btn">
            <i class="fas fa-lightbulb"></i> Show Hint
          </button>
        </div>
      </div>
    `;
    
    // Generate options based on puzzle type
    this.generateSequenceOptions(puzzle);
    
    document.getElementById('sequence-hint-btn').addEventListener('click', () => {
      alert(`Hint: ${puzzle.hint}`);
    });
  }

  generateSequenceOptions(puzzle) {
    const grid = document.getElementById('options-grid');
    grid.innerHTML = '';
    
    // Generate plausible options including correct one
    const options = this.generatePlausibleOptions(puzzle.solution);
    
    options.forEach((option, index) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = option;
      btn.dataset.value = option;
      
      btn.addEventListener('click', (e) => {
        this.checkSequenceAnswer(e.target.dataset.value, puzzle);
      });
      
      grid.appendChild(btn);
    });
  }

  generatePlausibleOptions(correct) {
    const options = [correct];
    
    // Add some wrong options
    if (!isNaN(correct)) {
      // Number sequence
      const num = parseInt(correct);
      options.push((num - 1).toString());
      options.push((num + 1).toString());
      options.push((num * 2).toString());
      options.push(Math.floor(num / 2).toString());
    } else {
      // Letter sequence
      options.push(String.fromCharCode(correct.charCodeAt(0) - 1));
      options.push(String.fromCharCode(correct.charCodeAt(0) + 1));
      options.push(correct.toLowerCase());
      options.push(correct.toUpperCase());
    }
    
    // Shuffle and return unique options
    return [...new Set(options)].sort(() => Math.random() - 0.5).slice(0, 4);
  }

  checkSequenceAnswer(selected, puzzle) {
    if (selected === puzzle.solution.toString()) {
      this.puzzleComplete();
    } else {
      document.querySelectorAll('.option-btn').forEach(btn => {
        if (btn.dataset.value === selected) {
          btn.classList.add('wrong');
        }
        if (btn.dataset.value === puzzle.solution.toString()) {
          btn.classList.add('correct');
        }
      });
    }
  }

  // Anagram Puzzle
  displayAnagramPuzzle(puzzle) {
    const container = document.getElementById('puzzle-content');
    const scrambled = this.scrambleWord(puzzle.scrambled || puzzle.solution);
    
    container.innerHTML = `
      <div class="anagram-container">
        <div class="anagram-header">
          <h4><i class="fas fa-random"></i> Anagram Puzzle</h4>
          <div class="category">Category: ${puzzle.category || 'General'}</div>
        </div>
        <div class="scrambled-word" id="scrambled-word">
          ${scrambled.split('').map(letter => 
            `<span class="letter-tile">${letter}</span>`
          ).join('')}
        </div>
        <div class="anagram-input">
          <input type="text" id="anagram-guess" 
                 placeholder="Unscramble the word...">
          <button id="shuffle-anagram" class="control-btn">
            <i class="fas fa-random"></i> Reshuffle
          </button>
        </div>
        <div class="anagram-controls">
          <button id="check-anagram" class="submit-btn">
            Check Answer
          </button>
          <button id="reveal-anagram" class="hint-btn">
            Reveal Answer
          </button>
        </div>
        <div class="anagram-hint">
          <p><i class="fas fa-info-circle"></i> ${puzzle.hint}</p>
        </div>
      </div>
    `;
    
    this.initializeAnagram(puzzle, scrambled);
  }

  scrambleWord(word) {
    const letters = word.toUpperCase().split('');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters.join('');
  }

  initializeAnagram(puzzle, scrambled) {
    document.getElementById('shuffle-anagram').addEventListener('click', () => {
      const newScrambled = this.scrambleWord(puzzle.scrambled || puzzle.solution);
      document.getElementById('scrambled-word').innerHTML = 
        newScrambled.split('').map(letter => 
          `<span class="letter-tile">${letter}</span>`
        ).join('');
    });
    
    document.getElementById('check-anagram').addEventListener('click', () => {
      const guess = document.getElementById('anagram-guess').value.trim();
      this.checkAnagram(guess, puzzle);
    });
    
    document.getElementById('reveal-anagram').addEventListener('click', () => {
      alert(`The answer is: ${puzzle.solution}`);
    });
  }

  checkAnagram(guess, puzzle) {
    const normalizedGuess = guess.toLowerCase().replace(/\s+/g, '');
    const normalizedSolution = puzzle.solution.toLowerCase().replace(/\s+/g, '');
    
    if (normalizedGuess === normalizedSolution) {
      this.puzzleComplete();
    } else {
      alert('Not quite! Try again.');
      document.getElementById('anagram-guess').value = '';
    }
  }

  // Word Search Display
  displayWordSearch(puzzle) {
    const container = document.getElementById('puzzle-content');
    
    container.innerHTML = `
      <div class="wordsearch-container">
        <div class="wordsearch-header">
          <h4><i class="fas fa-search"></i> Word Search</h4>
          <div class="words-to-find">
            <h5>Find these words:</h5>
            <div class="word-list" id="word-list"></div>
          </div>
        </div>
        <div class="wordsearch-grid" id="wordsearch-grid"></div>
        <div class="wordsearch-controls">
          <div class="found-words">
            Found: <span id="found-count">0</span> / ${puzzle.words.length}
          </div>
          <button id="solve-wordsearch" class="hint-btn">
            <i class="fas fa-lightbulb"></i> Show Solution
          </button>
        </div>
      </div>
    `;
    
    this.initializeWordSearch(puzzle);
  }

  initializeWordSearch(puzzle) {
    // Display word list
    const wordList = document.getElementById('word-list');
    puzzle.words.forEach(word => {
      const wordEl = document.createElement('span');
      wordEl.className = 'search-word';
      wordEl.textContent = word;
      wordEl.dataset.word = word;
      wordList.appendChild(wordEl);
    });
    
    // Create grid
    this.createWordSearchGrid(puzzle);
  }

  createWordSearchGrid(puzzle) {
    const grid = document.getElementById('wordsearch-grid');
    const size = puzzle.grid.length;
    
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = i;
        cell.dataset.col = j;
        cell.textContent = puzzle.grid[i][j];
        
        cell.addEventListener('click', () => {
          cell.classList.toggle('selected');
          this.checkWordSearchSelection(puzzle);
        });
        
        grid.appendChild(cell);
      }
    }
  }

  checkWordSearchSelection(puzzle) {
    // In complete version, check if selected cells form a word
    const selected = document.querySelectorAll('.grid-cell.selected');
    if (selected.length > 0) {
      const word = Array.from(selected)
        .map(cell => cell.textContent)
        .join('');
      
      if (puzzle.words.includes(word)) {
        // Mark word as found
        document.querySelector(`.search-word[data-word="${word}"]`)
          .classList.add('found');
        
        // Clear selection
        selected.forEach(cell => {
          cell.classList.remove('selected');
          cell.classList.add('solved');
        });
        
        this.updateWordSearchCounter(puzzle);
      }
    }
  }

  updateWordSearchCounter(puzzle) {
    const found = document.querySelectorAll('.search-word.found').length;
    document.getElementById('found-count').textContent = found;
    
    if (found === puzzle.words.length) {
      this.puzzleComplete();
    }
  }

  // Hangman Display
  displayHangman(puzzle) {
    const container = document.getElementById('puzzle-content');
    const hiddenWord = '_ '.repeat(puzzle.word.length).trim();
    
    container.innerHTML = `
      <div class="hangman-container">
        <div class="hangman-header">
          <h4><i class="fas fa-user"></i> Hangman</h4>
          <div class="category">Category: ${puzzle.category}</div>
        </div>
        <div class="hangman-figure" id="hangman-figure">
          <div class="hangman-stage" id="hangman-stage">Stage: 0/${puzzle.maxAttempts}</div>
        </div>
        <div class="hidden-word" id="hidden-word">
          ${hiddenWord.split('').join(' ')}
        </div>
        <div class="hangman-alphabet" id="hangman-alphabet"></div>
        <div class="hangman-hint">
          <p><i class="fas fa-lightbulb"></i> Hint: ${puzzle.hint}</p>
        </div>
        <div class="hangman-controls">
          <button id="solve-hangman" class="hint-btn">
            Solve Puzzle
          </button>
        </div>
      </div>
    `;
    
    this.initializeHangman(puzzle);
  }

  initializeHangman(puzzle) {
    this.hangmanState = {
      word: puzzle.word.toUpperCase(),
      guessed: new Set(),
      wrong: 0,
      maxWrong: puzzle.maxAttempts
    };
    
    // Create alphabet buttons
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const container = document.getElementById('hangman-alphabet');
    
    alphabet.split('').forEach(letter => {
      const btn = document.createElement('button');
      btn.className = 'letter-btn';
      btn.textContent = letter;
      btn.dataset.letter = letter;
      
      btn.addEventListener('click', (e) => {
        this.guessLetter(letter, puzzle);
        e.target.disabled = true;
      });
      
      container.appendChild(btn);
    });
    
    // Solve button
    document.getElementById('solve-hangman').addEventListener('click', () => {
      const guess = prompt('Enter the complete word:');
      if (guess && guess.toUpperCase() === puzzle.word.toUpperCase()) {
        this.puzzleComplete();
      } else {
        alert('Incorrect! Try guessing letter by letter.');
      }
    });
  }

  guessLetter(letter, puzzle) {
    const state = this.hangmanState;
    state.guessed.add(letter);
    
    if (!state.word.includes(letter)) {
      state.wrong++;
      document.getElementById('hangman-stage').textContent = 
        `Stage: ${state.wrong}/${state.maxWrong}`;
      
      if (state.wrong >= state.maxWrong) {
        alert(`Game Over! The word was: ${puzzle.word}`);
        this.showScreen('selection-screen');
      }
    }
    
    this.updateHangmanDisplay();
    this.checkHangmanComplete();
  }

  updateHangmanDisplay() {
    const state = this.hangmanState;
    const display = state.word.split('').map(letter => 
      state.guessed.has(letter) ? letter : '_'
    ).join(' ');
    
    document.getElementById('hidden-word').textContent = display;
  }

  checkHangmanComplete() {
    const state = this.hangmanState;
    const solved = state.word.split('').every(letter => 
      state.guessed.has(letter));
    
    if (solved) {
      this.puzzleComplete();
    }
  }

  // Generic puzzle display (fallback)
  displayGenericPuzzle(puzzle) {
    const container = document.getElementById('puzzle-content');
    container.innerHTML = `
      <div class="generic-puzzle">
        <h4>${puzzle.title}</h4>
        <div class="puzzle-description">${puzzle.question}</div>
        <div class="generic-input">
          <input type="text" id="generic-answer" 
                 placeholder="Enter your answer...">
          <button id="submit-generic" class="submit-btn">
            Submit
          </button>
        </div>
        <div class="generic-hint">
          <button id="show-hint" class="hint-btn">
            <i class="fas fa-lightbulb"></i> Hint
          </button>
        </div>
      </div>
    `;
    
    document.getElementById('submit-generic').addEventListener('click', () => {
      const answer = document.getElementById('generic-answer').value;
      this.checkGenericAnswer(answer, puzzle);
    });
    
    document.getElementById('show-hint').addEventListener('click', () => {
      alert(`Hint: ${puzzle.hint}`);
    });
  }

  checkGenericAnswer(answer, puzzle) {
    if (answer.toLowerCase().trim() === puzzle.solution.toLowerCase()) {
      this.puzzleComplete();
    } else {
      alert('Incorrect! Try again.');
    }
  }

  // Timer functions
  startTimer() {
    clearInterval(this.timer);
    
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTimerDisplay();
      
      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.timeUp();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    document.getElementById('puzzle-timer').textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  timeUp() {
    alert('Time\'s up! Puzzle expired.');
    this.showScreen('selection-screen');
  }

  // Puzzle completion
  puzzleComplete() {
    clearInterval(this.timer);
    
    // Calculate score
    const baseScore = this.currentPuzzle.points || 100;
    const timeBonus = Math.floor(this.timeLeft / 10) * 10;
    const totalScore = baseScore + timeBonus;
    
    // Update completion screen
    document.getElementById('completion-time').textContent = 
      this.formatTime(600 - this.timeLeft);
    document.getElementById('completion-points').textContent = `+${totalScore}`;
    document.getElementById('completion-accuracy').textContent = '100%';
    
    // Save progress
    this.saveProgress(totalScore);
    
    // Show completion screen
    this.showScreen('complete-screen');
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  saveProgress(points) {
    chrome.storage.local.get(['userProgress'], (result) => {
      const progress = result.userProgress || {
        totalSolved: 0,
        totalPoints: 0,
        puzzles: {},
        categories: {}
      };
      
      progress.totalSolved++;
      progress.totalPoints += points;
      
      // Track by puzzle ID
      progress.puzzles[this.currentPuzzle.id] = {
        solved: true,
        points: points,
        time: new Date().toISOString(),
        type: this.currentType,
        difficulty: this.currentPuzzle.difficulty
      };
      
      // Track by category
      if (!progress.categories[this.currentType]) {
        progress.categories[this.currentType] = {
          solved: 0,
          points: 0
        };
      }
      progress.categories[this.currentType].solved++;
      progress.categories[this.currentType].points += points;
      
      chrome.storage.local.set({ userProgress: progress });
    });
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
  }

  showHint() {
    if (this.currentPuzzle && this.currentPuzzle.hint) {
      document.getElementById('hint-text').textContent = this.currentPuzzle.hint;
      document.getElementById('hint-box').style.display = 'block';
      
      // Deduct points for using hint
      chrome.storage.local.get(['userProgress'], (result) => {
        const progress = result.userProgress || { totalPoints: 0 };
        progress.totalPoints = Math.max(0, progress.totalPoints - 20);
        chrome.storage.local.set({ userProgress: progress });
      });
    }
  }

}

PuzzleEngine.prototype.checkSolution = function(answer) {
  if (!this.currentPuzzle) {
    console.error('No current puzzle');
    return false;
  }
  
  const userAnswer = answer.toString().toLowerCase().trim();
  const correctAnswer = this.currentPuzzle.solution ? 
    this.currentPuzzle.solution.toString().toLowerCase().trim() : '';
  
  // Check if answer is correct
  if (userAnswer === correctAnswer) {
    this.puzzleComplete();
    return true;
  } else {
    alert(`Incorrect! The correct answer is: ${this.currentPuzzle.solution}`);
    return false;
  }
};

// Create global instance
window.puzzleEngine = new PuzzleEngine();