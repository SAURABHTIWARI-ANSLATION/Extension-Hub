# Word Typing Practice - Browser Extension

A clean, modern typing game designed as a browser extension that helps improve your typing speed and accuracy through timed practice sessions.

## Features

- **Timed Practice Sessions**: Choose from 2, 3, 4, or 5-minute typing tests
- **Real-time Statistics**: Track WPM (Words Per Minute), accuracy, errors, and time remaining
- **Word Highlighting**: Visual feedback for correct/incorrect characters and current position
- **Smart Word Generation**: Random selection from a curated list of 200+ common English words
- **Results Screen**: Detailed performance summary after each session
- **Responsive Design**: Optimized for browser extension popup (450x600px)
- **Modern UI**: Clean white grid theme with subtle animations

## Installation

### As a Browser Extension

1. **Chrome/Edge**:
   - Download or clone this repository
   - Open `chrome://extensions/` in your browser
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the folder containing these files

2. **Firefox**:
   - Open `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select any file from the extension folder

### Files Required
- `index.html` - Main application interface
- `style.css` - Styling and theming
- `script.js` - Game logic and functionality
- `manifest.json` - Extension configuration
- `logo.png` (128x128) - Extension icon (not included in provided code)

## How to Play

1. **Select Time Duration**: Choose your practice length (2-5 minutes)
2. **Start Typing**: Begin typing the highlighted words
3. **Navigate Words**: Press spacebar to move to the next word
4. **Track Progress**: Monitor real-time stats in the header
5. **Review Results**: See your performance summary when time expires
6. **Restart**: Click "Restart" or "Play Again" to start a new session

## Controls

- **Spacebar**: Advance to next word
- **Backspace**: Delete previous character
- **Tab/Click**: Focus on input field
- **Timer Buttons**: Change session duration
- **Restart Button**: Reset current session

## Technical Details

### Word List
The game uses 200+ common English words from the Oxford 3000 list, ensuring practical typing practice.

### WPM Calculation
- Words are calculated as (characters typed / 5) per minute
- Only correctly typed characters count toward WPM
- Accuracy is calculated based on total keystrokes

### Game States
1. **Ready**: Timer set, waiting for input
2. **Active**: Typing in progress, timer counting down
3. **Completed**: Time's up, results displayed

### Styling System
- CSS custom properties for consistent theming
- Grid background pattern for visual appeal
- Smooth transitions and focus states
- Responsive layout for extension popup

## Browser Compatibility

- Chrome 88+
- Edge 88+
- Firefox 86+
- Opera 74+

## Permissions

The extension requires:
- `activeTab`: To interact with the current tab
- `storage`: To save user preferences (future implementation)

## Future Enhancements

Potential features for future versions:
- User authentication and progress tracking
- Difficulty levels (easy/medium/hard)
- Custom word lists
- Dark mode toggle
- Sound effects
- Leaderboards
- Practice history and statistics

## Troubleshooting

**Extension not loading?**
- Ensure all files are in the same directory
- Check browser console for errors (F12)
- Verify `manifest.json` syntax is correct

**Input not working?**
- Click on the typing area to focus the input field
- Ensure no other extensions are interfering

**Stats not updating?**
- Refresh the extension
- Check JavaScript console for errors

## Credits

- Fonts: Inter & Roboto Mono from Google Fonts
- Design: Modern grid-based theme
- Development: Pure HTML/CSS/JavaScript

## License

This project is available for personal and educational use. Commercial use requires permission.