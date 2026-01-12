# WhatFont - Font Identifier Extension

A powerful Chrome extension to identify fonts on any website with ease.

## 🚀 Features

- **Hover Mode**: Simply hover over text to identify fonts instantly
- **Click Mode**: Click on text elements to lock font information
- **Scan Mode**: Scan entire page to find all unique fonts
- **Detailed Info**: View font family, size, weight, style, color, and more
- **CSS Export**: Copy font CSS properties directly
- **Beautiful UI**: Modern, gradient-themed interface
- **Multiple Themes**: Choose from various color schemes

## 📁 Project Structure

```
whatfont-extension/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── popup.css
├── themes/
│   └── themes.css
└── images/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🛠️ Installation

### Step 1: Create Extension Icons

You need to create icon images. Here are your options:

**Option A - Create Simple Icons:**
Create three PNG images (16x16, 48x48, 128x128) with the letter "F" on a purple gradient background.

**Option B - Use Online Icon Generator:**
1. Go to https://www.favicon-generator.org/
2. Upload any font-related image or create one
3. Download and rename as `icon16.png`, `icon48.png`, `icon128.png`
4. Place in `images/` folder

**Option C - Use Placeholder:**
Create a simple colored square as placeholder until you have proper icons.

### Step 2: Set Up Files

1. Create a new folder called `whatfont-extension`
2. Create the following structure:

```bash
mkdir whatfont-extension
cd whatfont-extension
mkdir images themes
```

3. Create each file with the provided code:
   - `manifest.json` - Extension configuration
   - `background.js` - Service worker
   - `content.js` - Font detection script
   - `popup.html` - Extension popup interface
   - `popup.js` - Popup logic
   - `popup.css` - Popup styles
   - `themes/themes.css` - Theme variables

### Step 3: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select your `whatfont-extension` folder
5. The extension should now appear in your toolbar!

## 📖 How to Use

### Quick Start

1. **Click the WhatFont icon** in your browser toolbar
2. **Toggle "Enable Hover Mode"** or click "Start Detection"
3. **Hover over any text** on a webpage
4. **View font details** in the floating panel

### Detection Modes

- **Hover**: Automatically detect fonts as you move your mouse
- **Click**: Click on text to lock the detection panel
- **Scan All**: Detect all unique fonts used on the current page

### Settings

- **Show download links**: Display links to find fonts on Google Fonts
- **Show CSS code**: View copyable CSS properties
- **Highlight detected text**: Visually highlight the text you're inspecting
- **Panel position**: Choose where the detection panel appears

## 🔧 Troubleshooting

### Extension Not Working?

1. **Refresh the page** after installing/updating the extension
2. **Check Developer Mode** is enabled in `chrome://extensions/`
3. **Verify all files** are in correct locations
4. **Check console** (F12) for error messages

### Can't Detect Fonts on Certain Pages?

- Extension cannot work on Chrome internal pages (`chrome://` URLs)
- Some websites may block extensions with Content Security Policy
- Try refreshing the page after activating detection

### Detection Panel Not Appearing?

1. Make sure detection is activated (toggle should be ON)
2. Try hovering over different text elements
3. Check if the page has enough text content
4. Verify content script loaded (check console)

## 🎨 Customization

### Change Theme Colors

Edit `themes/themes.css` to customize colors:

```css
:root {
  --theme-primary-btn-start: #8B5CF6; /* Change this */
  --theme-primary-btn-end: #A78BFA;   /* And this */
  /* ... more variables ... */
}
```

### Modify Panel Style

Edit the styles in `content.js` under the `injectStyles()` function.

### Add New Detection Modes

Extend the mode handling in `content.js` and add UI in `popup.html`.

## 🐛 Known Issues

- Very large pages may have slight delay in scan mode
- Some dynamically loaded content may not be detected immediately
- Extension requires page refresh after installation

## 📝 Development Notes

### Technologies Used

- **Manifest V3**: Latest Chrome extension standard
- **Vanilla JavaScript**: No frameworks, pure JS
- **CSS Custom Properties**: For easy theming
- **Chrome APIs**: Storage, Tabs, Runtime, Scripting

### Key Files Explained

- **manifest.json**: Defines extension permissions and structure
- **background.js**: Service worker for background tasks
- **content.js**: Injected into pages to detect fonts
- **popup.js**: Handles UI interactions in extension popup
- **themes.css**: CSS variables for consistent theming

## 🚀 Future Enhancements

Potential features to add:
- Export detected fonts to JSON/CSV
- Font comparison tool
- Save favorite font combinations
- Integration with more font services
- Font pairing suggestions
- History of detected fonts across sessions

## 📄 License

This project is open source and available for personal and commercial use.

## 🤝 Contributing

Feel free to fork, modify, and improve this extension!

---

**Made with ❤️ for designers and developers**