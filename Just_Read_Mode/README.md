# Just Read Extension 📚

A distraction-free reading mode Chrome extension that transforms any webpage into a clean, readable format.

## Features ✨

### 🎯 Core Features
- **One-click reading mode** - Instantly remove distractions from any webpage
- **Smart content detection** - Automatically finds and extracts main article content
- **Customizable appearance** - Adjust font size, style, colors, and spacing
- **Dark mode** - Eye-friendly reading in low light
- **Keyboard shortcuts** - Quick access with keyboard commands

### 🛠 Customization Options
- **Font settings**: Choose between serif/sans-serif, adjust size and line height
- **Color themes**: Light, dark, or custom theme colors
- **Content filtering**: Remove images, ads, sidebars as needed
- **Domain exceptions**: Exclude specific websites from reading mode

## Installation 📦

### From Chrome Web Store
1. Visit Chrome Web Store
2. Search for "Just Read"
3. Click "Add to Chrome"

### Manual Installation (Developer)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked" and select the extension folder

## Usage 🚀

### Basic Usage
1. Navigate to any webpage with article content
2. Click the Just Read extension icon in your toolbar
3. Click "Enable Reading Mode" to transform the page
4. Use the control bar to adjust settings or exit reading mode

### Keyboard Shortcuts
- **Ctrl+Shift+R** (Windows/Linux) / **Cmd+Shift+R** (Mac) - Toggle reading mode
- **ESC** - Exit reading mode
- **Ctrl++** / **Ctrl+-** - Adjust font size
- **Ctrl+D** - Toggle dark mode

### Settings Customization
1. Click the extension icon
2. Click "Settings" button
3. Customize:
   - Appearance (themes, fonts)
   - Content filtering options
   - Keyboard shortcuts
   - Advanced settings

## Technical Details 🔧

### Architecture
- **Manifest V3** - Latest Chrome extension standard
- **Content Scripts** - Run on webpages to modify content
- **Service Worker** - Background processing and messaging
- **Popup UI** - User interface for controls and settings

### Technologies Used
- Vanilla JavaScript (ES6+)
- HTML5 & CSS3
- Chrome Extension APIs
- Local Storage for settings

### Browser Support
- Google Chrome 88+
- Microsoft Edge 88+
- Other Chromium-based browsers

## Development 🛠️

### Project Structure
just-read-extension/
├── manifest.json # Extension configuration
├── popup.html # Popup interface
├── popup.js # Popup logic
├── popup.css # Popup styles
├── content.js # Content script for reading mode
├── background.js # Background service worker
├── options.html # Settings page
├── options.js # Settings logic
├── options.css # Settings styles
├── icons/ # Extension icons
└── README.md # This file

text

### Building from Source
1. Clone the repository
2. Open Chrome Extensions page
3. Enable Developer Mode
4. Load the unpacked extension

## Contributing 🤝

We welcome contributions! Here's how you can help:

1. **Report Issues** - Found a bug? Open an issue
2. **Suggest Features** - Have an idea? Share it!
3. **Submit Pull Requests** - Fix bugs or add features

### Development Guidelines
- Follow existing code style and architecture
- Add comments for complex logic
- Test changes thoroughly
- Update documentation as needed

## Troubleshooting 🔧

### Common Issues
1. **Extension not working on some sites**
   - Check if domain is in excluded list
   - Try manually enabling via extension icon

2. **Content not extracted properly**
   - Use custom content selectors in settings
   - Report the website for improvement

3. **Keyboard shortcuts not working**
   - Check Chrome extension shortcuts page
   - Ensure no conflicts with other extensions

### Debug Mode
Enable debug logging in content.js for troubleshooting:
```javascript
const DEBUG = true;
Privacy & Security 🔒
Data Collection
No data collection - All settings stored locally

No tracking - No analytics or user tracking

No external requests - All processing happens locally

Permissions Justification
activeTab - To access current webpage content

scripting - To inject reading mode styles

storage - To save user preferences locally

License 📄
MIT License - See LICENSE file for details

Support 💖
GitHub Issues - For bug reports and feature requests

Email - [Your contact email]

Documentation - Check the README and comments in code

Acknowledgments 🙏
Inspired by Reader Mode in Safari and Firefox

Thanks to all contributors and testers

Built with ❤️ for the reading community

Happy reading! 📖✨

Made with ❤️ for Chrome users worldwide.