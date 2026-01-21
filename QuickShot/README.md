# 📸 QuickShot - Advanced Screen Capture

## 👨‍💻 Developed with ❤️

### 🧩 Description
**QuickShot** is a professional screen capture and annotation tool for Chrome. Designed for speed and precision, it allows you to capture exactly what you need and edit it instantly with a beautiful, modern interface.

### 🚀 Features
- **Capture Modes**:
    - **Visible Screen**: Instant snapshot of current tab
    - **Selected Area**: Drag-to-select specific region
    - **Crosshair Selection**: Precise area selection with overlay
- **Powerful Editor**:
    - **Drawing Tools**: Pen, Arrow, Rectangle, Circle, Line
    - **Text Tool**: Add annotations with custom fonts
    - **Color Palette**: 12 vibrant colors + custom picker
    - **Undo/Redo**: Full history support (Ctrl+Z/Ctrl+Y)
    - **Brush Controls**: Adjustable size and opacity
- **Smart Features**:
    - **Zoom Controls**: Pinch to zoom, fit to screen
    - **Grid Overlay**: Alignment assistance
    - **Auto-save**: Never lose your work
    - **Keyboard Shortcuts**: Power user friendly
- **Export Options**:
    - **Copy to Clipboard**: One-click copy
    - **Download PNG**: High-quality export
    - **Multiple Formats**: PNG with quality control

### 🎨 UI Theme
- **Clean Light Theme**: Modern, professional interface
- **Ocean Blue Accents**: Consistent color scheme
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: Keyboard navigation & focus states

### 🛠️ Tech Stack
- **Manifest V3**: Modern Chrome extension architecture
- **HTML5 Canvas**: High-performance image rendering
- **Service Workers**: Background processing
- **CSS Variables**: Theme system with custom properties
- **ES6 Classes**: Modular, maintainable JavaScript
- **Chrome APIs**: Native browser integration

### 📂 Project Structure
quickshot/
├── manifest.json # Extension configuration
├── popup.html # Main popup interface
├── popup.js # Popup interactions
├── style.css # Popup & shared styles
├── background.js # Background service worker
├── content.js # Selection overlay script
├── content.css # Overlay styles
├── editor.html # Full-featured editor
├── editor.css # Editor styles (Light Theme)
├── editor.js # Canvas drawing engine
├── icons/
│ ├── icon16.png # Extension icon (16px)
│ ├── icon48.png # Extension icon (48px)
│ └── icon128.png # Extension icon (128px)
└── README.md # This file

text

### ⚙️ Installation
#### Developer Mode (Local)
1. **Clone or download** this repository
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer mode** (toggle in top right)
4. **Click "Load unpacked"**
5. **Select the project folder**

#### From Chrome Web Store (Coming Soon)
1. Visit Chrome Web Store
2. Search for "QuickShot"
3. Click "Add to Chrome"

### 🧠 How It Works
1. **Capture**:
   - Click extension icon or use shortcut (Alt+Shift+1/3)
   - For selection: Drag crosshair to select area
   - Capture is saved locally

2. **Edit**:
   - Automatically opens in editor
   - Use toolbar tools to annotate
   - Adjust colors, brush size, opacity

3. **Export**:
   - Copy to clipboard (Ctrl+C)
   - Download as PNG (Ctrl+S)
   - Share directly (optional)

### ⌨️ Keyboard Shortcuts
| Action | Shortcut | Description |
|--------|----------|-------------|
| Visible Capture | Alt+Shift+1 | Capture current tab |
| Selection | Alt+Shift+3 | Select area to capture |
| Undo | Ctrl+Z | Undo last action |
| Redo | Ctrl+Y / Ctrl+Shift+Z | Redo last action |
| Copy | Ctrl+C | Copy image to clipboard |
| Save | Ctrl+S | Download image |
| Close Popup | Escape | Close extension popup |

### 🔐 Privacy & Security
- **100% Local Processing**: All images stay on your device
- **No Data Collection**: We don't track or store your screenshots
- **No Internet Required**: Works completely offline
- **Open Source**: Transparent codebase

### 🎯 Use Cases
- **Documentation**: Capture and annotate screenshots for guides
- **Bug Reporting**: Highlight issues with arrows and text
- **Design Feedback**: Mark up designs and layouts
- **Education**: Create instructional materials
- **Personal Use**: Save and organize screenshots

### 🚀 Performance
- **Fast Capture**: Near-instant screenshot capture
- **Smooth Drawing**: Optimized canvas rendering
- **Low Memory**: Efficient image processing
- **Responsive UI**: Smooth animations and interactions

### 🔧 Technical Details
- **Canvas Resolution**: Maintains original image quality
- **Image Format**: PNG with lossless compression
- **Undo Stack**: 50-step history
- **Zoom Range**: 10% to 500%
- **Brush Sizes**: 1px to 50px
- **Color Support**: RGB, HEX, and custom colors

### 📱 Compatibility
- **Chrome**: Version 88+
- **Edge**: Version 88+ (Chromium-based)
- **Brave**: Version 1.20+
- **Operating Systems**: Windows, macOS, Linux, ChromeOS

### 🤝 Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### 🐛 Reporting Issues
Found a bug? Please report it:
1. Check existing issues
2. Provide detailed reproduction steps
3. Include Chrome version and OS
4. Add screenshots if possible

### 📄 License
This project is licensed under the **MIT License** - see the LICENSE file for details.

### 🙏 Acknowledgments
- **Icons**: Custom designed for QuickShot
- **Fonts**: Inter font family by Rasmus Andersson
- **Color Palette**: Based on Material Design colors
- **Inspiration**: Modern screenshot tools and user feedback

### 📞 Support
- **Documentation**: This README
- **Issues**: GitHub Issues tab
- **Email**: Available via GitHub profile

---

**QuickShot** - Because every screenshot deserves to be perfect! ✨