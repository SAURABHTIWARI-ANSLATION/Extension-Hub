🧩 Code Puzzle Generator Chrome Extension
https://img.shields.io/badge/Chrome-Extension-green
https://img.shields.io/badge/Manifest-v3-blue
https://img.shields.io/badge/Version-2.0-purple
https://img.shields.io/badge/License-MIT-yellow

A daily coding challenge extension for developers to practice JavaScript and Python problems with progressive difficulty levels, streak tracking, and visual analytics. Perfect for interview preparation and skill sharpening!

✨ Features
🎯 Daily & Random Challenges
Daily Puzzle: Unique challenge every day based on date hash

Random Mode: Get random puzzles anytime for extra practice

Multi-language Support: JavaScript and Python challenges

Difficulty Levels: Easy, Medium, Hard categories

📊 Progress Tracking
Streak System: Daily streak counter with visual fire emoji

Solved Counter: Track total puzzles solved

Difficulty Stats: Separate counters for Easy/Medium/Hard

Best Streak: Record your longest consecutive day streak

Already Solved Indicator: Visual markers for completed puzzles

💻 Developer-Friendly Features
Syntax Highlighted Solutions: Color-coded code for better readability

One-click Copy: Copy solutions to clipboard instantly

Language Toggle: Switch between JavaScript and Python seamlessly

Mark as Solved: Track your progress with one click

Clean Code Examples: Well-commented, production-ready solutions

🎨 Modern UI/UX
Dark Theme: Easy-on-eyes dark interface with blue accents

Interactive Elements: Hover effects and smooth animations

Responsive Design: Optimized 380px popup layout

Visual Feedback: Animations and notifications for user actions

Difficulty Badges: Color-coded difficulty indicators

📁 Project Structure
text
code-puzzle-generator/
├── manifest.json          # Extension manifest (Manifest v3)
├── popup.html            # Main extension popup interface
├── popup.css             # Modern dark theme styling
├── popup.js              # Core logic and state management
├── puzzles.js            # JavaScript & Python puzzle database
└── README.md             # This documentation file
🚀 Installation
Method 1: Developer Mode (Local Installation)
Download or clone this repository

Open Chrome and navigate to chrome://extensions/

Enable Developer mode (toggle in top-right corner)

Click Load unpacked

Select the folder containing the extension files

Pin the extension to your toolbar for easy access

Method 2: Pack for Distribution
bash
# In Chrome extensions page:
# 1. Click "Pack extension"
# 2. Select the extension folder
# 3. Distribute the generated .crx file
🎮 How to Use
Daily Practice Routine
Click the extension icon in Chrome toolbar

Review the daily challenge question

Try to solve it yourself first

Click "Show Solution" to see the answer

Click "✓ Mark Solved" to track your progress

Maintain your streak by solving daily!

Exploring Challenges
Switch Language: Use dropdown to toggle between JavaScript/Python

Filter Difficulty: Select Easy/Medium/Hard or "All Levels"

Get Random Puzzle: Click "🎲 Random" for surprise challenges

View Stats: Check your progress in the statistics section

Using Solutions
Copy Code: Click the "📋 Copy" button to copy solution to clipboard

Study Patterns: Analyze multiple solution approaches provided

Syntax Highlighting: Color-coded keywords, strings, and comments

Best Practices: Learn from clean, well-commented code examples

📊 Statistics System
Track Your Progress
🔥 Streak: Consecutive days with at least one solved puzzle

✅ Total Solved: All puzzles marked as solved

Easy/Medium/Hard: Solved counts per difficulty level

Best Streak: Your personal record for consecutive days

How Streak Works
Solve at least one puzzle per day to maintain streak

Miss a day? Streak resets to zero

Best streak is automatically tracked

Last solved date is stored to calculate streaks accurately

🧩 Puzzle Database
JavaScript Challenges (14 Total)
Easy (5): String reversal, array deduplication, FizzBuzz, capitalization, array sum

Medium (5): Non-repeating character, anagrams, factorial, longest word, array chunking

Hard (4): Debounce function, deep cloning, Promise.all, string permutations

Python Challenges (14 Total)
Easy (5): Palindrome check, vowel counting, even squares, max number, list reversal

Medium (5): List flattening, Fibonacci, prime checking, dictionary merging, second largest

Hard (4): Timer decorator, LRU cache, power set, binary search

Puzzle Structure
Each puzzle includes:

javascript
{
  difficulty: "easy|medium|hard",
  question: "Clear problem statement",
  solution: "Well-commented, multiple-approach code"
}
🔧 Technical Details
Permissions
json
{
  "storage": "Local storage for statistics and solved puzzles"
}
APIs Used
Chrome Storage API: Persistent local data storage for stats

Clipboard API: Copy solutions to clipboard

DOM APIs: Dynamic UI updates and interactions

Data Structure
javascript
// Statistics storage
{
  streak: 5,                // Current streak
  lastSolvedDate: "2024-01-15T10:30:00.000Z",
  totalSolved: 23,          // Total puzzles solved
  easySolved: 10,
  mediumSolved: 8,
  hardSolved: 5,
  bestStreak: 7,            // Longest streak achieved
  solvedPuzzles: Set()      // IDs of solved puzzles
}
Key Algorithms
Daily Puzzle Selection: Date-based deterministic random selection

Streak Calculation: Time-based streak tracking with reset logic

Duplicate Prevention: Unique puzzle ID generation

State Management: Local storage synchronization

🎨 Design System
Color Palette
Primary Gradient: #0e639c to #1177bb (Blue theme)

Background: #1e1e1e to #2d2d30 (Dark gradient)

Difficulty Colors:

Easy: #10b981 (Green)

Medium: #f59e0b (Orange)

Hard: #ef4444 (Red)

Text: #d4d4d4 with varying opacities

Code Syntax:

Keywords: #569cd6 (Blue)

Strings: #ce9178 (Orange)

Functions: #dcdcaa (Yellow)

Comments: #6a9955 (Green)

Typography
Font Family: Segoe UI, system fonts stack

Font Sizes: 11px (labels) to 18px (headers)

Font Weights: Regular (400) to Bold (700)

Code Font: Consolas, Courier New monospace

Animations & Transitions
Slide Down: Solution panel reveal

Hover Effects: Button elevation and color transitions

Button Feedback: Press/click animations

Smooth Transitions: 0.2-0.3s transitions throughout

⚡ Performance Features
Minimal Permissions: Only storage permission required

Local Storage: No network calls, works offline

Efficient Updates: Batch DOM updates

Memory Efficient: Small bundle size (<100KB)

Fast Load: Instant popup opening

🔒 Privacy & Security
No Data Collection: All data stays locally in your browser

No Analytics: No tracking or telemetry

No Internet Required: Complete offline functionality

Local Storage: Uses Chrome's secure storage API

No External Dependencies: Zero third-party libraries

🚧 Limitations & Known Issues
Limited Puzzle Set: Currently 28 puzzles total (expandable)

No Custom Puzzles: Cannot add user-generated content

No Progress Sync: Statistics don't sync across devices

No Hint System: Direct solution reveal only

Fixed Languages: Only JavaScript and Python supported

🔮 Future Roadmap
Planned enhancements for future versions:

Version 3.0 Goals
Cloud Sync: Sync progress across Chrome instances

Custom Puzzles: User-submitted challenge system

More Languages: Add TypeScript, Java, C++, etc.

Hints System: Progressive hints before solution

Achievements: Badges and rewards system

Version 2.x Enhancements
Multiple Solutions: Show alternative approaches

Time Tracking: Record solving time per puzzle

Difficulty Progression: Adaptive difficulty adjustment

Export Statistics: CSV/JSON export of progress

Dark/Light Mode: Theme toggle option

Community Features
Leaderboard: Compare streaks with friends

Challenge Sharing: Share puzzles via link

Weekly Themes: Themed challenge weeks

Code Runner: Execute code in sandbox

Video Explanations: Link to tutorial videos

🐛 Troubleshooting
Common Issues & Solutions
Issue	Solution
Extension not loading	Ensure Chrome version 88+ (Manifest v3)
Statistics not saving	Check storage permission in manifest
Copy not working	Enable clipboard permissions in browser
Streak not updating	Check system date/time accuracy
UI looks broken	Clear browser cache and reload extension
Debug Mode
Open Chrome DevTools (F12)

Go to Console tab

Look for error messages

Check chrome://extensions/ for extension errors

Verify storage: chrome.storage.local.get(['stats'])

🧪 Testing
Manual Testing Checklist
Daily puzzle loads correctly

Language switching works

Difficulty filtering functions

Mark as solved updates stats

Streak calculation is accurate

Copy to clipboard works

Random puzzle generation

Already solved indication

Statistics persistence

UI responsive at 380px

🤝 Contributing
We welcome contributions! Here's how to help:

Add New Puzzles
Fork the repository

Add puzzles to puzzles.js following the existing structure

Ensure solutions are clean and well-commented

Test the puzzles load correctly

Submit a pull request

Code Guidelines
Follow existing code style and structure

Add comments for complex logic

Test changes thoroughly

Update documentation if needed

Keep bundle size minimal

Reporting Issues
Check existing issues

Provide clear reproduction steps

Include Chrome version and OS

Attach screenshots if applicable

Suggest possible solutions

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.