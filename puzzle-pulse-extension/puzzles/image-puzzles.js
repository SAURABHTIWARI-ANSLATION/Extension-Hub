// Image-based puzzles database
const IMAGE_PUZZLES = {
  jigsaw: [
    {
      id: 'jigsaw_001',
      title: 'Mountain Landscape',
      type: 'jigsaw',
      difficulty: 'easy',
      image: 'mountain.jpg',
      pieces: 9,
      hint: 'The completed image shows a beautiful mountain with a lake',
      solution: 'correct_assembly',
      points: 100,
      timeLimit: 300
    },
    {
      id: 'jigsaw_002',
      title: 'Historic Monument',
      type: 'jigsaw',
      difficulty: 'medium',
      image: 'monument.jpg',
      pieces: 16,
      hint: 'This is one of the Seven Wonders of the World',
      solution: 'correct_assembly',
      points: 150,
      timeLimit: 420
    },
    {
      id: 'jigsaw_003',
      title: 'Abstract Art',
      type: 'jigsaw',
      difficulty: 'hard',
      image: 'abstract.jpg',
      pieces: 25,
      hint: 'Look for color patterns to assemble correctly',
      solution: 'correct_assembly',
      points: 200,
      timeLimit: 600
    }
  ],

  find_differences: [
    {
      id: 'diff_001',
      title: 'City Street Scene',
      type: 'find_differences',
      difficulty: 'easy',
      image1: 'city1.jpg',
      image2: 'city2.jpg',
      differences: 5,
      hint: 'Check the store signs, car colors, and people',
      solution: [
        {x: 120, y: 45},
        {x: 245, y: 89},
        {x: 178, y: 156},
        {x: 89, y: 210},
        {x: 312, y: 189}
      ],
      points: 120,
      timeLimit: 180
    },
    {
      id: 'diff_002',
      title: 'Forest Animals',
      type: 'find_differences',
      difficulty: 'medium',
      image1: 'forest1.jpg',
      image2: 'forest2.jpg',
      differences: 7,
      hint: 'Look for missing animals and changed leaves',
      solution: [
        {x: 56, y: 78},
        {x: 189, y: 112},
        {x: 234, y: 67},
        {x: 145, y: 189},
        {x: 278, y: 156},
        {x: 89, y: 234},
        {x: 312, y: 89}
      ],
      points: 180,
      timeLimit: 240
    },
    {
      id: 'diff_003',
      title: 'Office Desk',
      type: 'find_differences',
      difficulty: 'hard',
      image1: 'office1.jpg',
      image2: 'office2.jpg',
      differences: 10,
      hint: 'Check stationery items, computer screen, and books',
      solution: [
        {x: 45, y: 67},
        {x: 156, y: 89},
        {x: 234, y: 45},
        {x: 189, y: 156},
        {x: 78, y: 189},
        {x: 267, y: 123},
        {x: 123, y: 234},
        {x: 289, y: 178},
        {x: 89, y: 145},
        {x: 312, y: 89}
      ],
      points: 250,
      timeLimit: 300
    }
  ],

  rotate: [
    {
      id: 'rotate_001',
      title: 'Hidden Symbol',
      type: 'rotate',
      difficulty: 'easy',
      image: 'symbol.jpg',
      rotations: [0, 90, 180, 270],
      hint: 'Rotate to reveal a mathematical symbol',
      solution: '180',
      points: 80,
      timeLimit: 120
    },
    {
      id: 'rotate_002',
      title: 'Mystery Pattern',
      type: 'rotate',
      difficulty: 'medium',
      image: 'pattern.jpg',
      rotations: [0, 90, 180, 270],
      hint: 'Correct rotation forms a recognizable logo',
      solution: '270',
      points: 120,
      timeLimit: 180
    },
    {
      id: 'rotate_003',
      title: 'Encrypted Message',
      type: 'rotate',
      difficulty: 'hard',
      image: 'encrypted.jpg',
      rotations: [0, 90, 180, 270],
      hint: 'Find the rotation that reveals a readable word',
      solution: '90',
      points: 150,
      timeLimit: 240
    }
  ],

  slider: [
    {
      id: 'slider_001',
      title: 'Number Slider',
      type: 'slider',
      difficulty: 'easy',
      grid: 3,
      image: 'numbers.jpg',
      hint: 'Slide tiles to arrange numbers 1-8',
      solution: '12345678',
      points: 100,
      timeLimit: 180
    },
    {
      id: 'slider_002',
      title: 'Picture Slider',
      type: 'slider',
      difficulty: 'medium',
      grid: 4,
      image: 'picture.jpg',
      hint: 'Complete the famous painting',
      solution: 'complete_image',
      points: 150,
      timeLimit: 300
    }
  ]
};

// Export for use in other files
if (typeof module !== 'undefined') {
  module.exports = IMAGE_PUZZLES;
} else {
  window.IMAGE_PUZZLES = IMAGE_PUZZLES;
}