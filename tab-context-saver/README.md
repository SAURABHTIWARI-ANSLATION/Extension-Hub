# Tab Context Saver 🚀

**Time-travel for your browsing sessions**

A premium, futuristic Chrome extension that lets you save, restore, and switch between browsing contexts instantly. Experience intelligent tab management with a cinematic, high-end UI.

![Version](https://img.shields.io/badge/version-1.0.0-8b5cf6)
![License](https://img.shields.io/badge/license-MIT-6366f1)

## ✨ Features

### 🎯 Core Functionality
- **Save Current Session** - Capture all open tabs instantly
- **Restore Sessions** - Travel back to any saved browsing context
- **Quick Modes** - Switch between Work, Study, Entertainment, or Custom modes
- **Smart Organization** - Auto-organize tabs with visual node representations
- **Search & Filter** - Find sessions quickly with intelligent search

### 🎨 Premium UI/UX
- **Futuristic Design** - Glassmorphism panels with holographic edges
- **Animated Particles** - Dynamic neural network background
- **Time-Travel Effects** - Cinematic transitions when switching sessions
- **Responsive Animations** - Smooth micro-interactions throughout
- **Dark Premium Theme** - Deep indigo with electric violet accents

### 🔐 Privacy First
- **100% Local Storage** - All data stays on your device
- **No Tracking** - Zero analytics or data collection
- **Secure** - No external API calls

## 📦 Installation

### Method 1: Load Unpacked Extension (Developer Mode)

1. **Extract the ZIP file** to a folder on your computer

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or click Menu (⋮) → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the extracted `tab-context-saver` folder
   - Click "Select Folder"

5. **Pin the Extension** (Optional)
   - Click the puzzle icon (🧩) in your Chrome toolbar
   - Find "Tab Context Saver"
   - Click the pin icon to keep it visible

### Method 2: Package as CRX (Advanced)

1. Follow steps 1-4 from Method 1
2. Click "Pack extension" on the Extensions page
3. Select the extension directory
4. Click "Pack Extension"
5. Install the generated `.crx` file

## 🚀 Usage Guide

### Saving a Session

1. **Open the Extension**
   - Click the Tab Context Saver icon in your toolbar

2. **Save Current Tabs**
   - Click "Save Current Session" button
   - Enter a session name (e.g., "Work Project", "Research")
   - Select a mode: Work 💼, Study 📚, Entertainment 🎮, or Custom ⭐
   - Click "Save Session"

### Restoring a Session

**Method 1: Restore Last Session**
- Click "Restore Last Session" button for instant access to your most recent save

**Method 2: From Session List**
- Find your session in the list
- Hover over the session card
- Click the restore icon (↻)

**Method 3: Quick Mode Switch**
- Click any Quick Mode button (Work, Study, Entertainment, Custom)
- The most recent session in that mode will be restored

### Managing Sessions

- **Search**: Use the search bar to filter sessions by name or mode
- **Delete**: Hover over a session and click the delete icon (🗑)
- **View Details**: Each card shows:
  - Session name and timestamp
  - Number of saved tabs
  - Mode category
  - Visual representation of tabs

## 🎨 UI Features

### Visual Elements

- **Particle Background**: Animated neural network with floating nodes
- **Glassmorphism**: Frosted glass panels with soft depth
- **Holographic Accents**: Gradient borders on interactive elements
- **Time-Wave Effect**: Cinematic pulse when saving/restoring
- **Node Visualization**: Each tab represented as a glowing particle

### Color Palette

```
Primary: Deep Indigo (#1a1a3e)
Accent 1: Electric Violet (#8b5cf6)
Accent 2: Neon Indigo (#6366f1)
Highlight: Soft Cyan (#06b6d4)
Text: Light Periwinkle (#e0e7ff)
```

### Animations

- Button hover effects with soft glow
- Ripple animation on primary actions
- Smooth slide transitions
- Particle float and connection animations
- Time-travel wave on session changes

## ⚙️ Technical Details

### File Structure

```
tab-context-saver/
├── manifest.json          # Extension configuration
├── popup.html            # Main UI structure
├── styles.css            # Premium styling & animations
├── popup.js              # Core functionality & particle system
├── background.js         # Service worker for tab management
├── icons/                # Extension icons (16, 32, 48, 128px)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # Documentation
```

### Technologies Used

- **Manifest V3** - Latest Chrome Extension format
- **Vanilla JavaScript** - No dependencies, lightweight
- **CSS3 Animations** - Hardware-accelerated transitions
- **Canvas API** - Particle system rendering
- **Chrome Storage API** - Local data persistence
- **Chrome Tabs API** - Tab management

### Browser Support

- Chrome 88+
- Edge 88+
- Brave
- Other Chromium-based browsers

## 🔧 Customization

### Modify Colors

Edit `styles.css` and update the CSS variables:

```css
:root {
  --midnight-blue: #0f0f23;
  --electric-violet: #8b5cf6;
  --neon-indigo: #6366f1;
  /* Add your custom colors */
}
```

### Adjust Particle Count

In `popup.js`, find the `ParticleSystem` class:

```javascript
init() {
  const particleCount = 50; // Change this number
  // ...
}
```

### Change Animation Speed

Modify timing in CSS animations:

```css
@keyframes logoGlow {
  /* Adjust duration */
  animation: logoGlow 3s ease-in-out infinite;
}
```

## 🐛 Troubleshooting

### Extension Doesn't Load
- Ensure Developer Mode is enabled
- Check that all files are in the correct directory
- Reload the extension from `chrome://extensions/`

### Sessions Not Saving
- Check Chrome's storage quota
- Clear browser cache if needed
- Verify permissions in manifest.json

### UI Not Displaying Correctly
- Hard refresh the extension (Ctrl+R in popup)
- Check browser zoom level (100% recommended)
- Update Chrome to the latest version

### Tabs Not Restoring
- Ensure URLs are valid and accessible
- Check that tabs aren't blocked by Chrome policies
- Some URLs (chrome://, file://) cannot be opened by extensions

## 📝 Changelog

### Version 1.0.0 (Initial Release)
- ✨ Core session save/restore functionality
- 🎨 Premium futuristic UI with glassmorphism
- 🎭 Animated particle background system
- 🚀 Quick mode switching (Work, Study, Entertainment, Custom)
- 🔍 Search and filter sessions
- 💾 Local storage implementation
- 🎬 Cinematic time-travel effects
- 📱 Responsive design for popup window

## 🤝 Contributing

Want to improve Tab Context Saver? Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use and modify for your projects.

## 🙏 Acknowledgments

- Design inspired by modern UI/UX trends
- Particle system concept from network visualization
- Color palette based on premium tech aesthetics

## 📧 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check the troubleshooting section
- Review Chrome Extension documentation

---

**Made with 💜 by passionate developers**

*Experience the future of tab management*
