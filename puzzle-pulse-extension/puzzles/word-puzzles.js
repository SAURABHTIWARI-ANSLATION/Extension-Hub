// Word puzzles database
const WORD_PUZZLES = {
  anagrams: [
    {
      id: 'anagram_001',
      title: 'Simple Anagram',
      type: 'anagram',
      difficulty: 'easy',
      scrambled: 'listen',
      hint: 'What you do with your ears',
      solution: 'silent',
      category: 'common words',
      points: 50,
      timeLimit: 60
    },
    {
      id: 'anagram_002',
      title: 'Famous Person',
      type: 'anagram',
      difficulty: 'medium',
      scrambled: 'clint eastwood',
      hint: 'Old West movies',
      solution: 'old west action',
      category: 'celebrity',
      points: 100,
      timeLimit: 120
    },
    {
      id: 'anagram_003',
      title: 'Long Anagram',
      type: 'anagram',
      difficulty: 'hard',
      scrambled: 'the morse code',
      hint: 'Famous quote',
      solution: 'here come dots',
      category: 'phrases',
      points: 150,
      timeLimit: 180
    },
    {
      id: 'anagram_004',
      title: 'Movie Title',
      type: 'anagram',
      difficulty: 'medium',
      scrambled: 'dirty room',
      hint: 'A messy place',
      solution: 'dormitory',
      category: 'movies',
      points: 120,
      timeLimit: 150
    }
  ],

  crossword: [
    {
      id: 'crossword_001',
      title: 'Mini Crossword',
      type: 'crossword',
      difficulty: 'easy',
      grid: [
        [' ', ' ', ' ', ' ', ' '],
        [' ', 'H', 'E', 'L', 'L'],
        [' ', ' ', ' ', ' ', 'O'],
        ['W', 'O', 'R', 'L', 'D'],
        [' ', ' ', ' ', ' ', ' ']
      ],
      clues: {
        across: [
          {number: 1, clue: 'Greeting (5 letters)', answer: 'HELLO', start: [1,1]},
          {number: 2, clue: 'Planet we live on (5 letters)', answer: 'WORLD', start: [3,0]}
        ],
        down: [
          {number: 1, clue: 'Opposite of low (4 letters)', answer: 'HIGH', start: [0,1]}
        ]
      },
      solution: [
        ['H', 'I', ' ', ' ', ' '],
        ['E', 'H', 'E', 'L', 'L'],
        ['L', ' ', 'L', ' ', 'O'],
        ['W', 'O', 'R', 'L', 'D'],
        [' ', ' ', ' ', ' ', ' ']
      ],
      points: 120,
      timeLimit: 300
    }
  ],

  word_search: [
    {
      id: 'wordsearch_001',
      title: 'Animals Word Search',
      type: 'word_search',
      difficulty: 'easy',
      grid: [
        ['C', 'A', 'T', 'D', 'O', 'G'],
        ['O', 'W', 'L', 'I', 'O', 'N'],
        ['W', 'H', 'A', 'L', 'E', 'B'],
        ['F', 'I', 'S', 'H', 'B', 'E'],
        ['B', 'I', 'R', 'D', 'A', 'R'],
        ['L', 'I', 'O', 'N', 'T', 'Z']
      ],
      words: ['CAT', 'DOG', 'OWL', 'LION', 'WHALE', 'FISH', 'BIRD', 'BEAR', 'COW'],
      points: 100,
      timeLimit: 240
    },
    {
      id: 'wordsearch_002',
      title: 'Countries Search',
      type: 'word_search',
      difficulty: 'medium',
      grid: [
        ['I', 'N', 'D', 'I', 'A', 'C', 'H'],
        ['U', 'S', 'A', 'B', 'R', 'A', 'Z'],
        ['C', 'A', 'N', 'A', 'D', 'A', 'I'],
        ['J', 'A', 'P', 'A', 'N', 'L', 'L'],
        ['F', 'R', 'A', 'N', 'C', 'E', 'Y'],
        ['G', 'E', 'R', 'M', 'A', 'N', 'Y']
      ],
      words: ['INDIA', 'USA', 'CANADA', 'JAPAN', 'FRANCE', 'GERMANY', 'CHINA', 'BRAZIL'],
      points: 150,
      timeLimit: 300
    }
  ],

  cryptogram: [
    {
      id: 'crypto_001',
      title: 'Simple Cryptogram',
      type: 'cryptogram',
      difficulty: 'medium',
      encrypted: 'GSRH RH Z IVZGFH',
      hint: 'A = Z, B = Y',
      solution: 'THIS IS A GREAT',
      key: {G:'T', S:'H', R:'I', H:'S', Z:'A', I:'R', V:'G', F:'E'},
      points: 120,
      timeLimit: 180
    },
    {
      id: 'crypto_002',
      title: 'Famous Quote',
      type: 'cryptogram',
      difficulty: 'hard',
      encrypted: 'QZEJQK ZA OAYQ IQKK',
      hint: 'Common three-letter word is "THE"',
      solution: 'THINK OR BE THIN',
      key: {Q:'T', Z:'H', E:'I', J:'N', K:'K', A:'O', O:'B', Y:'E'},
      points: 180,
      timeLimit: 300
    }
  ],

  hangman: [
    {
      id: 'hangman_001',
      title: 'Fruit Hangman',
      type: 'hangman',
      difficulty: 'easy',
      category: 'fruits',
      word: 'BANANA',
      hint: 'Yellow fruit that monkeys love',
      maxAttempts: 6,
      points: 60,
      timeLimit: 120
    },
    {
      id: 'hangman_002',
      title: 'Capital City',
      type: 'hangman',
      difficulty: 'medium',
      category: 'geography',
      word: 'TOKYO',
      hint: 'Capital of Japan',
      maxAttempts: 8,
      points: 100,
      timeLimit: 180
    },
    {
      id: 'hangman_003',
      title: 'Scientific Term',
      type: 'hangman',
      difficulty: 'hard',
      category: 'science',
      word: 'PHOTOSYNTHESIS',
      hint: 'Process plants use to make food',
      maxAttempts: 10,
      points: 150,
      timeLimit: 240
    }
  ],

  scrabble: [
    {
      id: 'scrabble_001',
      title: 'High Score Word',
      type: 'scrabble',
      difficulty: 'medium',
      letters: ['Q', 'U', 'I', 'Z', 'E', 'S', 'M'],
      hint: 'Use all letters for bonus',
      bestWord: 'QUIZZES',
      possibleWords: ['QUIZ', 'SIZE', 'MUSE', 'QUIZZES'],
      points: 120,
      timeLimit: 180
    },
    {
      id: 'scrabble_002',
      title: 'Vowel Challenge',
      type: 'scrabble',
      difficulty: 'hard',
      letters: ['A', 'E', 'I', 'O', 'U', 'Y', 'S'],
      hint: 'Use the Y strategically',
      bestWord: 'SAUCEY',
      possibleWords: ['SAUCE', 'SAUCEY', 'NOISE', 'HOUSE'],
      points: 150,
      timeLimit: 240
    }
  ]
};

// Additional utility functions
function shuffleWord(word) {
  let arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

function generateCrossword(gridSize) {
  // Simple crossword generator
  const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(' '));
  return grid;
}

// Export for use in other files
if (typeof module !== 'undefined') {
  module.exports = WORD_PUZZLES;
} else {
  window.WORD_PUZZLES = WORD_PUZZLES;
}