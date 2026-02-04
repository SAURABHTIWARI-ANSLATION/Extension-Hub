# 🎨 Super Simple Highlighter

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green?logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/version-1.0-blue)]()
[![Privacy](https://img.shields.io/badge/privacy-100%25_local-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-orange)]()

A lightweight Chrome extension for making **permanent, private text highlights** on any web page. All data stays in your browser - nothing is sent to any server.

## ✨ Features

- **🖍️ Permanent Highlights** - Save highlights that persist across page visits
- **🎨 Multiple Colors** - 5 color options: Yellow, Green, Blue, Pink, Red
- **🔒 Complete Privacy** - All data stored locally in your browser
- **⚡ Instant Switching** - Change colors with one click
- **🗑️ Easy Management** - Click highlights to remove, clear page highlights
- **📤 Export Option** - Save highlights as JSON file
- **⌨️ Keyboard Shortcut** - Toggle highlight mode with `Ctrl+Shift+H`
- **🔍 Navigation** - Scroll to highlights from popup
- **💡 Tooltip Hints** - Hover to see highlight details

## 🚀 Installation

### Method 1: Load Unpacked (Development)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **"Load unpacked"**
5. Select the `super-simple-highlighter` folder
6. Extension icon (🎨) will appear in your toolbar

### Method 2: From Chrome Web Store (Coming Soon)
*Note: Extension will be published to Chrome Web Store soon*

## 🎮 How to Use

### Basic Highlighting:
1. Click the extension icon 🎨 in your toolbar
2. Enable **"Enable Highlighting"** toggle
3. Select any text on the webpage
4. Text will be highlighted in the current color

### Changing Colors:
1. Open the popup
2. Click any color button (🟨 🟩 🟦 🩷 🟥)
3. New highlights will use the selected color

### Managing Highlights:
- **Remove single highlight**: Click on any highlighted text
- **View all highlights**: Open popup to see list
- **Scroll to highlight**: Click 👁️ icon in popup
- **Clear all highlights**: Click "Clear Page" button
- **Export highlights**: Click "Export All" to save as JSON

## 🛠️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+H` | Toggle highlight mode |
| `Click highlight` | Remove that highlight |

## 📁 Project Structure
super-simple-highlighter/
├── manifest.json # Extension configuration
├── popup.html # Popup interface
├── popup.js # Popup logic & controls
├── popup.css # Popup styling
├── content.js # Main highlighting engine
├── background.js # Background service worker
├── styles/
│ └── highlights.css # Highlight styles
├── icons/ # Extension icons
│ ├── icon16.png
│ ├── icon48.png
│ └── icon128.png
└── README.md # This file

text

## 🔧 Technical Details

- **Manifest Version**: 3 (Latest Chrome Extension API)
- **Storage**: IndexedDB for highlights, chrome.storage for settings
- **Permissions**: `storage`, `activeTab`, `scripting`
- **Content Script**: Injected on all pages, handles DOM manipulation
- **Background Service Worker**: Manages keyboard shortcuts and events

## 🔐 Privacy Statement

This extension operates **100% offline**. Your highlights:
- Are stored only in your browser's local storage
- Never leave your computer
- Never sent to any external server
- Are completely private to you

## 🐛 Known Issues

1. Highlights may not restore perfectly if webpage content changes significantly
2. Some websites with complex DOM structures may have highlighting issues
3. Single Page Apps (SPAs) may require page refresh to restore highlights

## 🔮 Future Features

- [ ] Sync across devices (optional)
- [ ] More highlight styles (underline, strikethrough)
- [ ] Search within highlights
- [ ] Categories/tags for highlights
- [ ] Import highlights from other tools
- [ ] Statistics dashboard

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by various web annotation tools
- Built with vanilla JavaScript (no frameworks)
- Icons from emoji set
- Color palette inspired by Material Design

## 📞 Support

Found a bug or have a feature request?
1. Check [Issues](../../issues) to see if it's already reported
2. Create a new issue with details
3. Include Chrome version and steps to reproduce

---

<div align="center">
Made with ❤️ for better web reading experience
<br>
⭐ Star this repo if you find it useful!
</div>