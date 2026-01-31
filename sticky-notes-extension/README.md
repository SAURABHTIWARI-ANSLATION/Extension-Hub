# Sticky Notes for Browser - Chrome Extension

A powerful Chrome extension that lets you place real, interactive sticky notes directly on any webpage. Unlike traditional note-taking extensions, these notes appear as actual DOM elements on the page itself, allowing for seamless interaction and persistence.

## 🌟 Features

### ✨ Core Features
- **Real Sticky Notes**: Notes appear directly on webpages as DOM elements, not in iframes or overlays
- **Per-Page Persistence**: Notes automatically save and reload when you revisit a page
- **Smart Categorization**: Notes are organized by webpage URL
- **Rich Text Formatting**: Bold, italic, underline, and font size controls
- **Multiple Colors**: 8 vibrant note colors (yellow, blue, green, pink, orange, purple, teal, gray)
- **Interactive Controls**: Pin, hide, minimize, lock, and resize notes

### 🎨 Design Features
- **Modern UI**: Clean, gradient-based design with subtle animations
- **Responsive Notes**: Adjustable size with intuitive resize handles
- **Visual Feedback**: Interactive hover states and button feedback
- **Font Awesome Icons**: Beautiful, consistent iconography
- **Custom Scrollbars**: Styled scrollbars that match the theme

### 🔧 Technical Features
- **Drag & Drop**: Move notes anywhere on the page
- **Resizable**: Adjust note size with corner handles
- **Minimize/Maximize**: Double-click header to toggle size
- **Auto-Save**: Changes are automatically saved to Chrome storage
- **Context Menu Integration**: Add notes via right-click menu
- **Per-Page Organization**: Notes are stored and loaded per URL

## 📁 Project Structure

```
sticky-notes-extension/
├── manifest.json          # Extension configuration (Manifest V3)
├── background.js         # Background service worker
├── content.js           # Content script (runs on all pages)
├── content.css          # Styles for sticky notes
├── popup.html           # Extension popup UI
├── popup.css            # Popup styles
├── popup.js             # Popup functionality
└── icons/               # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🚀 Installation

### For Development:
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the project folder containing all files

### From Chrome Web Store:
*(Coming soon)*

## 🛠️ Usage

### Creating Notes:
1. **Via Popup**: Click extension icon → "New Note"
2. **Via Context Menu**: Right-click anywhere on page → "Sticky Notes" → "Add Note Here"
3. **With Selected Text**: Select text → Right-click → "Add Note with Selection"

### Managing Notes:
- **Move**: Drag the note header
- **Resize**: Drag the bottom-right corner handle
- **Minimize**: Double-click header or click minimize button
- **Pin**: Click thumbtack icon to pin note (stays on top)
- **Hide**: Click eye icon to hide/show note
- **Lock**: Click lock icon to prevent editing
- **Change Color**: Click palette icon to change note color
- **Close**: Click X icon to remove note

### Popup Controls:
- **New Note**: Creates a new sticky note at default position
- **Show All**: Makes all hidden notes visible
- **Hide All**: Hides all notes (toggle visibility)
- **Settings**: 
  - Auto-save: Automatically save changes
  - Reopen notes: Restore notes on browser startup

## 🔧 Technical Details

### Architecture:
- **Manifest V3**: Uses service workers instead of background pages
- **Direct DOM Manipulation**: Notes are real HTML elements, not iframes
- **Event-Driven**: Mouse events for dragging and resizing
- **Chrome Storage API**: Persistent storage using chrome.storage.local

### Storage Schema:
```javascript
{
  "stickyNotes": {
    "example.com/page1": {
      "note_123456789": {
        "id": "note_123456789",
        "content": "Note text here",
        "color": "yellow",
        "left": 100,
        "top": 100,
        "width": 320,
        "height": 380,
        "pinned": false,
        "minimized": false,
        "hidden": false,
        "locked": false,
        "fontSize": "16",
        "createdAt": "2024-01-20T10:30:00Z",
        "updatedAt": "2024-01-20T10:35:00Z"
      }
    }
  },
  "settings": {
    "autoSave": true,
    "startOnBoot": false
  }
}
```

### Performance:
- **Lazy Loading**: Notes only load when page is ready
- **Efficient Storage**: Only stores note data, not entire DOM
- **Event Delegation**: Uses event delegation for better performance
- **Debounced Saving**: Prevents excessive storage writes

## 🎨 Customization

### Note Colors:
- Yellow (default): #FFF9C4
- Blue: #E3F2FD
- Green: #E8F5E9
- Pink: #FCE4EC
- Orange: #FFF3E0
- Purple: #F3E5F5
- Teal: #E0F2F1
- Gray: #F5F5F5

### Font Sizes:
- Small: 14px
- Normal: 16px
- Large: 18px
- X-Large: 20px

## 📝 Development Notes

### Browser Compatibility:
- Chrome 88+ (Manifest V3)
- Edge 88+ (Chromium-based)
- Opera 74+ (Chromium-based)
- Brave 1.3+ (Chromium-based)

### Dependencies:
- **Font Awesome 6.4.0**: For icons
- **Chrome APIs**: storage, tabs, contextMenus, activeTab

### Code Architecture:
- **StickyNoteManager Class**: Main controller for note management
- **Event-Driven Design**: Uses Chrome message passing
- **Modular CSS**: Separate styles for content and popup
- **Responsive Design**: Works on various screen sizes

### Security Considerations:
- **Content Security Policy**: No external scripts in content
- **Sandboxed Execution**: Content script runs in isolated context
- **No Data Collection**: All data stored locally
- **Permission Minimalism**: Only requests necessary permissions

## 🔍 Future Enhancements

### Planned Features:
- [ ] Note templates
- [ ] Export/import notes
- [ ] Cloud sync
- [ ] Note sharing
- [ ] Rich text editor with more formatting
- [ ] Keyboard shortcuts
- [ ] Note categories/tags
- [ ] Search functionality
- [ ] Note version history
- [ ] Dark mode

### Technical Improvements:
- [ ] Performance optimization for many notes
- [ ] Better conflict resolution for overlapping notes
- [ ] Undo/redo functionality
- [ ] Localization support
- [ ] Accessibility improvements
- [ ] Unit tests
- [ ] CI/CD pipeline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Setup:
```bash
# Clone the repository
git clone https://github.com/yourusername/sticky-notes-extension.git

# Install dependencies (if any)
# Currently no build process required
```

### Testing:
- Test on multiple websites
- Verify note persistence across page reloads
- Check performance with many notes
- Test on different screen sizes

## 🐛 Troubleshooting

### Common Issues:
1. **Notes not appearing**: Check if content script is running (check console)
2. **Notes not saving**: Verify storage permissions in manifest
3. **Context menu missing**: Extension may need reloading
4. **Performance issues**: Too many notes on one page

### Debugging:
```javascript
// Check if extension is running
chrome.runtime.getBackgroundPage(console.log)

// Check storage contents
chrome.storage.local.get(null, console.log)

// Reload content script
chrome.tabs.reload()
```

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgements

- **Font Awesome** for beautiful icons
- **Chrome Extension API** documentation
- **Contributors** and testers

## 🔗 Resources

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)

---

**Made with ❤️ for developers, students, researchers, and anyone who needs to take notes while browsing**
