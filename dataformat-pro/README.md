# DataFormat Pro

**Professional JSON/XML Formatter with Modern UI**

A powerful Chrome extension that combines the best features from multiple JSON formatters into one unified, professional tool with stunning modern design and enhanced user experience.

## 🌟 Features

### Core Functionality
- **Multi-format Support**: Format both JSON and XML with auto-detection
- **Enhanced Syntax Highlighting**: Beautiful color-coded syntax with modern gradients
- **Line Numbers**: Toggle line numbers for easier navigation
- **Validation**: Check if your JSON/XML is valid
- **Minification**: Compress your data to save space
- **Escape/Unescape**: Handle HTML entities properly
- **Format Conversion**: Convert between JSON and XML formats

### Advanced Features
- **Auto-detection**: Automatically detects JSON/XML format
- **File Upload/Download**: Import from files and export formatted data
- **Text to JSON**: Convert plain text to JSON format
- **Find & Replace**: Search and replace within your data
- **Sample Data**: Load example JSON/XML for testing
- **Statistics**: View character count, line count, and file size
- **Auto-format**: Automatically format when pasting data

### Web Page Integration
- **Auto-detection on Pages**: Automatically detects JSON/XML on web pages
- **Syntax Highlighting**: Highlights JSON/XML content on websites
- **Hover Tooltips**: Shows format information on hover
- **One-click Formatting**: Format content directly from web pages

### Customization
- **Multiple Themes**: 5 beautiful color themes to choose from
- **Customizable Indentation**: Choose 2/4 spaces, tabs, or minified output
- **Sort Options**: Alphabetically sort JSON keys
- **Personal Settings**: Save your preferences

## 🎨 Available Themes

1. **Ocean Blue** (Default) - Professional blue gradient
2. **Indigo Night** - Dark purple theme
3. **Mint Teal** - Fresh teal/cyan colors
4. **Violet Glow** - Modern purple gradient
5. **Sky Gradient** - Light blue theme

## 🚀 Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `dataformat-pro` folder
5. The extension icon will appear in your toolbar

## 📖 Usage

### Basic Formatting
1. Click the DataFormat Pro icon in your toolbar
2. Paste your JSON or XML data
3. Click "Format Now" or use Ctrl+Enter
4. Copy or download the formatted result

### Advanced Features
- **Auto-detect**: Leave format as "Auto Detect" to automatically identify the format
- **Themes**: Go to Settings to change the color theme
- **Web Pages**: JSON/XML on web pages will be automatically detected and highlighted
- **File Operations**: Use the upload/download buttons for file-based operations

### Keyboard Shortcuts
- **Ctrl+Enter**: Format the current data
- **Ctrl+S** (in settings): Save settings
- **Escape** (in settings): Cancel changes

## ⚙️ Settings

Access settings through:
- Click the gear icon in the popup
- Right-click the extension icon → Options

### Configuration Options
- **Default Format**: Set your preferred format (JSON/XML/Auto)
- **Indentation**: Choose spacing preference
- **Auto-format**: Enable/disable automatic formatting
- **Syntax Highlighting**: Toggle code highlighting
- **Line Numbers**: Show/hide line numbers
- **Theme**: Select your preferred color scheme

## 🔧 Technical Details

### Permissions Used
- `activeTab`: Access current tab for formatting
- `storage`: Save your settings and preferences
- `scripting`: Inject content scripts for web page detection
- `declarativeNetRequest`: Monitor network requests for API responses
- `contextMenus`: Add right-click menu options
- `notifications`: Show installation/update notifications

### Architecture
- **Manifest V3**: Modern Chrome extension standards
- **Service Worker**: Background processing and event handling
- **Content Script**: Web page integration and auto-detection
- **Modular Design**: Clean separation of concerns

## 🆚 What Makes DataFormat Pro Different?

Unlike other JSON formatters, DataFormat Pro offers:

✅ **Unified Experience**: Combines features from multiple extensions
✅ **Modern UI Design**: Stunning visual design with animations and gradients
✅ **Enhanced User Experience**: Smooth interactions and intuitive workflows
✅ **Web Integration**: Works seamlessly on web pages
✅ **Advanced Features**: Text-to-JSON, find/replace, file operations
✅ **Performance**: Optimized for speed and efficiency
✅ **Developer-Focused**: Built specifically for developer workflows
✅ **Theme Consistency**: Cohesive design language across all themes

## 🐛 Troubleshooting

### Common Issues

**Extension not working:**
- Ensure Developer Mode is enabled
- Check that all files are present
- Reload the extension from chrome://extensions/

**Themes not applying:**
- Go to Settings and re-select your theme
- Refresh the popup window
- Check console for errors (Ctrl+Shift+J)

**Auto-detection not working on web pages:**
- Ensure "Auto-format on Pages" is enabled in Settings
- Check that the content script is loaded
- Try refreshing the web page

## 📝 Changelog

### v1.0.0
- Initial release
- Combined features from multiple JSON formatters
- Added 5 color themes
- Implemented web page auto-detection
- Added file upload/download functionality
- Created comprehensive settings page

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Credits

This extension combines and improves upon features from:
- JSONBeautifyinator
- JSON/XML Formatter
- JSON Formatter

Special thanks to all the original developers whose work inspired this project.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues, suggestions, or questions, please open an issue on GitHub.

---

**Made with ❤️ for Developers**