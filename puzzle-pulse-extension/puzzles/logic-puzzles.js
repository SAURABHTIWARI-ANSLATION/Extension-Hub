// Logic puzzles database
const LOGIC_PUZZLES = {
  riddles: [
    {
      id: 'riddle_001',
      title: 'The River Crossing',
      type: 'riddle',
      difficulty: 'medium',
      question: `A farmer needs to cross a river with a wolf, a goat, and a cabbage. His boat can only carry himself and one of the three items. If left alone, the wolf will eat the goat, and the goat will eat the cabbage. How does he get everything across safely?`,
      hint: 'Take the goat first, then come back for something else',
      solution: 'farmer takes goat, returns alone, takes wolf, returns with goat, takes cabbage, returns alone, takes goat',
      explanation: '1. Take goat → 2. Return alone → 3. Take wolf → 4. Return with goat → 5. Take cabbage → 6. Return alone → 7. Take goat',
      points: 150,
      timeLimit: 300
    },
    {
      id: 'riddle_002',
      title: 'The Two Doors',
      type: 'riddle',
      difficulty: 'hard',
      question: `You are in a room with two doors. One leads to certain death, the other to freedom. There are two guards, one in front of each door. One guard always tells the truth, the other always lies. You don't know which guard is which or which door leads where. You can ask ONE question to ONE guard. What question do you ask to ensure you choose the door to freedom?`,
      hint: 'Ask about what the OTHER guard would say',
      solution: 'ask either guard: "If I asked the other guard which door leads to freedom, which door would he point to?" Then choose the opposite door',
      explanation: 'This question forces both guards to point to the door leading to death',
      points: 200,
      timeLimit: 420
    },
    {
      id: 'riddle_003',
      title: 'Light Bulbs and Switches',
      type: 'riddle',
      difficulty: 'expert',
      question: `You are in a room with three light switches, each controlling one of three light bulbs in another room. You can't see the bulbs from the switch room. You can only go to the bulb room once. How can you determine which switch controls which bulb?`,
      hint: 'Use heat from the bulbs',
      solution: 'turn on switch 1 for 5 minutes, then turn it off. turn on switch 2, then immediately go to bulb room. the hot bulb is switch 1, the lit bulb is switch 2, the cold bulb is switch 3',
      explanation: 'Bulb 1: Hot but off, Bulb 2: On and warm, Bulb 3: Cold and off',
      points: 250,
      timeLimit: 600
    }
  ],

  sequence: [
    {
      id: 'seq_001',
      title: 'Number Pattern',
      type: 'sequence',
      difficulty: 'easy',
      question: 'What comes next: 2, 4, 8, 16, 32, ?',
      hint: 'Each number is multiplied by 2',
      solution: '64',
      explanation: 'Pattern: ×2 each time',
      points: 50,
      timeLimit: 60
    },
    {
      id: 'seq_002',
      title: 'Alphabet Sequence',
      type: 'sequence',
      difficulty: 'medium',
      question: 'What comes next: A, C, F, J, O, ?',
      hint: 'Count the letters skipped',
      solution: 'U',
      explanation: 'Pattern: Skip 1, 2, 3, 4, 5 letters: A→(B)→C→(DE)→F→(GHI)→J→(KLMN)→O→(PQRST)→U',
      points: 100,
      timeLimit: 120
    },
    {
      id: 'seq_003',
      title: 'Mixed Sequence',
      type: 'sequence',
      difficulty: 'hard',
      question: 'What comes next: 1, 11, 21, 1211, 111221, ?',
      hint: 'Read the previous number aloud',
      solution: '312211',
      explanation: 'Pattern: Each number describes the previous: "one 1" = 11, "two 1s" = 21, "one 2 one 1" = 1211, etc.',
      points: 150,
      timeLimit: 180
    }
  ],

  deduction: [
    {
      id: 'deduct_001',
      title: 'The Three Gods',
      type: 'deduction',
      difficulty: 'expert',
      question: `Three gods A, B, and C are called True (always truthful), False (always lies), and Random (randomly tells truth or lies). You don't know which is which. You may ask three yes/no questions, each to exactly one god. The gods understand English but answer in their own language: "da" and "ja" mean yes and no, but you don't know which is which. How do you determine the identities of A, B, and C?`,
      hint: 'Use complex conditional questions',
      solution: 'This is the "Hardest Logic Puzzle Ever". Requires asking questions like: "If I asked you Is A Random?, would you say ja?',
      explanation: 'Too complex for explanation here - involves meta-questions',
      points: 300,
      timeLimit: 900
    },
    {
      id: 'deduct_002',
      title: 'Murder Mystery',
      type: 'deduction',
      difficulty: 'hard',
      question: `A murder has been committed. Four suspects: Alice, Bob, Charlie, Diane. Each makes a statement:
      1. Alice: "I didn't do it. Bob was with me."
      2. Bob: "I didn't do it. Diane did it."
      3. Charlie: "I didn't do it. Alice didn't do it."
      4. Diane: "I didn't do it. Bob is lying."
      Only the murderer lies. Who did it?`,
      hint: 'Test each person as the murderer',
      solution: 'Charlie',
      explanation: 'If Charlie is murderer, his statement "Alice didn\'t do it" is false, which fits since he\'s lying. Others\' statements would have contradictions.',
      points: 180,
      timeLimit: 240
    }
  ],

  pattern: [
    {
      id: 'pattern_001',
      title: 'Visual Pattern',
      type: 'pattern',
      difficulty: 'medium',
      question: 'What comes next in this pattern: △, ▽, ◁, ▷, △, ▽, ?',
      hint: 'Think about directions',
      solution: '◁',
      explanation: 'Pattern: Triangle pointing up, down, left, right, then repeat',
      points: 120,
      timeLimit: 180
    },
    {
      id: 'pattern_002',
      title: 'Color Pattern',
      type: 'pattern',
      difficulty: 'hard',
      question: 'Red, Orange, Yellow, Green, Blue, Indigo, ?',
      hint: 'Think about rainbows',
      solution: 'Violet',
      explanation: 'ROYGBIV - colors of the rainbow',
      points: 100,
      timeLimit: 120
    }
  ]
};

// Export for use in other files
if (typeof module !== 'undefined') {
  module.exports = LOGIC_PUZZLES;
} else {
  window.LOGIC_PUZZLES = LOGIC_PUZZLES;
}