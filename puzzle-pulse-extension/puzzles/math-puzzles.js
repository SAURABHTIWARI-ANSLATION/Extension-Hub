// puzzles/math-puzzles.js - UPDATED
const MATH_PUZZLES = {
  calculation: [
    {
      id: 'math_001',
      title: 'Quick Calculation',
      type: 'calculation',
      difficulty: 'easy',
      question: 'What is 15 × 4 + 20 ÷ 2?',
      hint: 'Remember PEMDAS/BODMAS',
      solution: '70',
      explanation: '15×4=60, 20÷2=10, 60+10=70',
      points: 80
    },
    {
      id: 'math_002',
      title: 'Simple Addition',
      type: 'calculation',
      difficulty: 'easy',
      question: 'What is 25 + 37?',
      hint: 'Add the numbers',
      solution: '62',
      points: 50
    },
    {
      id: 'math_003',
      title: 'Multiplication',
      type: 'calculation',
      difficulty: 'easy',
      question: 'What is 9 × 7?',
      hint: 'Multiplication table',
      solution: '63',
      points: 60
    },
    {
      id: 'math_004',
      title: 'Missing Number',
      type: 'calculation',
      difficulty: 'medium',
      question: 'If 2 + 3 = 10, 7 + 2 = 63, 6 + 5 = 66, then 8 + 4 = ?',
      hint: 'Multiply the numbers, then add something',
      solution: '96',
      explanation: 'Pattern: (a + b) × a',
      points: 120
    }
  ],
  algebra: [
    {
      id: 'math_005',
      title: 'Solve for X',
      type: 'algebra',
      difficulty: 'hard',
      question: 'If 3x + 7 = 22, what is the value of x?',
      hint: 'Isolate x on one side',
      solution: '5',
      explanation: '3x = 22 - 7, 3x = 15, x = 5',
      points: 150
    },
    {
      id: 'math_006',
      title: 'Simple Equation',
      type: 'algebra',
      difficulty: 'easy',
      question: 'If x + 5 = 12, what is x?',
      hint: 'Subtract 5 from 12',
      solution: '7',
      points: 80
    },
    {
      id: 'math_007',
      title: 'Two Variables',
      type: 'algebra',
      difficulty: 'medium',
      question: 'If x + y = 10 and x - y = 4, what is x?',
      hint: 'Add the two equations',
      solution: '7',
      points: 120
    }
  ],
  sequence: [
    {
      id: 'math_008',
      title: 'Number Sequence',
      type: 'sequence',
      difficulty: 'easy',
      question: 'What comes next: 2, 4, 6, 8, ?',
      hint: 'Even numbers',
      solution: '10',
      points: 70
    },
    {
      id: 'math_009',
      title: 'Pattern Recognition',
      type: 'sequence',
      difficulty: 'medium',
      question: 'What comes next: 1, 1, 2, 3, 5, 8, ?',
      hint: 'Fibonacci sequence',
      solution: '13',
      points: 100
    }
  ]
};

// Export for use in other files
if (typeof module !== 'undefined') {
  module.exports = MATH_PUZZLES;
} else {
  window.MATH_PUZZLES = MATH_PUZZLES;
}