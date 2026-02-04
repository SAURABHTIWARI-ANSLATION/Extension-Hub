# Quick Link Manager - Chrome Extension

A beautifully designed Chrome extension that helps you manage and organize your most important links with an Instagram Bio-like interface for desktop.

## 🌟 Features

### ✨ Core Features
- **One-Click Link Saving**: Save current page or any link via context menu
- **Smart Categorization**: Automatically categorizes links into work, social, shopping, entertainment, and general
- **Quick Access**: Open all links with a single click
- **Search & Filter**: Quickly find links by title, URL, or category
- **Visual Interface**: Clean, modern UI with domain-specific icons

### 🎨 Design Features
- **Beautiful Sky Gradient Theme**: Modern, beginner-friendly color scheme
- **Responsive Layout**: Perfectly sized popup (380px × 500px)
- **Hover Effects**: Smooth animations and interactive elements
- **Visual Feedback**: Success notifications and loading states
- **Empty States**: Helpful prompts when no links are added

### 🔧 Technical Features
- **Context Menu Integration**: Right-click any link to save it
- **Chrome Storage**: All data saved securely in Chrome sync storage
- **Real-time Updates**: UI updates instantly when links are added/removed
- **Sample Data**: Pre-populated with useful links for first-time users

## 📁 Project Structure

```
quick-link-manager/
├── manifest.json          # Extension configuration
├── background.js         # Background service worker
├── content.js           # Content script (runs on all pages)
├── popup.html           # Main extension popup UI
├── popup.css            # Popup styles and layout
├── popup.js             # Popup functionality
├── themes.css           # Theme definitions and variables
└── icons/               # Extension icons (16x16, 48x48, 128x128)
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

### Adding Links:
1. **Via Popup**: Click the extension icon → "Add Current Page"
2. **Via Context Menu**: Right-click any link or page → "Add to Link Manager"
3. **Automatically**: Links are automatically categorized based on domain

### Managing Links:
- **Open Link**: Click on any link item to open in new tab
- **Open All**: Use "Open All" button to open all filtered links
- **Delete Link**: Hover over a link and click the trash icon
- **Search**: Use the search bar to filter by title or URL
- **Filter by Category**: Click category tags to filter links

### Categories:
- **Work**: Email, calendar, docs, productivity tools
- **Social**: Social media platforms
- **Shopping**: E-commerce and shopping sites
- **Entertainment**: Video, music, streaming services
- **General**: Everything else

## 🔧 Technical Details

### Permissions:
- `tabs`: To get current page information
- `storage`: To save links in Chrome sync storage
- `contextMenus`: To add right-click menu items

### Storage:
- Links are stored in `chrome.storage.sync`
- Data syncs across Chrome browsers when signed in
- Each link contains: title, URL, category, and timestamp

### Icons:
The extension includes three icon sizes:
- 16×16: Browser action icon
- 48×48: Extension management page
- 128×128: Web Store listing

## 🎨 Customization

### Themes:
The extension uses CSS custom properties for theming. To modify:
1. Edit `themes.css` to change color variables
2. The current theme is "sky-gradient" but can be extended
3. All components use theme variables for consistent styling

### Adding New Categories:
1. Update category detection in `background.js` and `popup.js`
2. Add new category button in `popup.html`
3. Update filtering logic in `popup.js`

## 📝 Development Notes

### Browser Compatibility:
- Chrome 88+ (Manifest V3)
- Edge 88+ (Chromium-based)
- Other Chromium-based browsers

### Future Enhancements:
- [ ] Multiple theme support
- [ ] Link grouping and folders
- [ ] Import/export functionality
- [ ] Custom icons for links
- [ ] Keyboard shortcuts
- [ ] Link statistics and usage tracking
- [ ] Dark mode support

### Code Architecture:
- **Manifest V3**: Uses service workers instead of background pages
- **Modular Design**: Separate files for popup, background, and content
- **Event-Driven**: Uses Chrome extension APIs for communication
- **Responsive UI**: CSS Grid and Flexbox for layout

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is available under the MIT License.

## 🙏 Acknowledgements

- Icons by Font Awesome
- Color palette inspired by Tailwind CSS
- UI design inspired by modern web applications

## 🐛 Troubleshooting

### Common Issues:
1. **Extension not loading**: Check console for errors (Ctrl+Shift+J)
2. **Links not saving**: Verify storage permissions in manifest
3. **Context menu missing**: Reinstall extension or check background.js
4. **UI not updating**: Refresh the popup (close and reopen)

### Debugging:
- Check Chrome Extensions page for errors
- Use DevTools on popup (right-click extension icon → Inspect)
- Monitor background service worker in chrome://extensions/

---

**Made with ❤️ for Chrome extension developers and productivity enthusiasts**