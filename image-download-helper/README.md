Image Download Helper 📸
A powerful Chrome extension that makes downloading images from any website effortless. Smart scanning, intelligent filtering, and bulk downloads all in one click.

https://img.shields.io/badge/Chrome-Extension-brightgreen
https://img.shields.io/badge/Version-1.0.0-blue
https://img.shields.io/badge/License-MIT-green

🌟 Features
🔍 Smart Image Detection
Auto-scan all images on any webpage

Support for lazy-loaded images

Extract images from backgrounds, picture elements, and sources

Poki.com optimized scanning

🎯 Intelligent Filtering
Size-based filtering (min width/height)

File type selection (JPG, PNG, WebP, GIF, SVG)

Skip ads, icons, and blurry images

Real-time preview with filtering

📥 Smart Downloads
Bulk download selected/all images

Custom folder naming patterns

WebP to JPG/PNG conversion

Quality adjustment (10-100%)

Resume failed downloads

🎨 Beautiful UI
Modern Mint Teal theme

Image preview grid with pagination

Real-time progress tracking

Interactive selection system

🚀 Installation
From Chrome Web Store
Visit [Chrome Web Store Link]

Click "Add to Chrome"

Confirm installation

Manual Installation (Developer)
bash
# Clone the repository
git clone https://github.com/yourusername/image-download-helper.git

# Load unpacked extension
1. Open Chrome → Extensions (chrome://extensions/)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension folder
📖 How to Use
Basic Usage
Click the extension icon to open the popup

Click "Scan Page" to find all images

Select images from the preview grid

Click "Download Selected" to start downloading

Advanced Features
Context Menu: Right-click on any image → "Download this image"

Bulk Download: Right-click on page → "Download all images on this page"

Custom Settings: Set folder names, filename patterns, and quality

Filters: Apply filters before downloading to get only relevant images

🛠️ File Structure
text
image-download-helper/
├── manifest.json          # Extension manifest
├── icons/                # Extension icons (16, 48, 128px)
├── background/
│   └── background.js     # Background service worker
├── content/
│   ├── content.js        # Content script for image extraction
│   └── content.css       # Styles for content script overlays
├── popup/
│   ├── popup.html        # Popup interface
│   ├── popup.css         # Popup styles
│   └── popup.js          # Popup logic
├── utils/
│   ├── filter-engine.js  # Image filtering logic
│   └── download-manager.js # Download management
└── themes/
    └── mint-teal.css     # Mint Teal theme
⚙️ Configuration
Settings Available
Folder Name: Custom download folder (supports patterns)

Filename Pattern:

{index}_{name} → 1_image.jpg

{name}_{index} → image_1.jpg

{width}x{height}_{name} → 800x600_image.jpg

{alt}_{index} → description_1.jpg

{timestamp}_{name} → 20240101_image.jpg

WebP Conversion: Convert WebP to JPG/PNG or keep original

Quality: Adjust compression quality (10-100%)

Filters: Size, file type, and content filters

🖼️ Image Sources Supported
Detection Methods
<img> tags with src, srcset, data-src

Background images from CSS styles

Picture & source elements

Lazy-loaded images (scroll triggered)

Dynamic content (SPA support)

File Formats
JPEG/JPG

PNG

WebP

GIF

SVG

BMP

ICO/TIFF

🔧 Technical Details
Browser Compatibility
✅ Chrome 88+

✅ Edge 88+

✅ Opera 74+

✅ Brave 1.20+

Permissions Required
activeTab: To access current page content

downloads: To save images to disk

storage: To save user settings

scripting: To inject content scripts

Performance Features
Smart Caching: Avoids duplicate downloads

Batch Processing: Downloads multiple images efficiently

Memory Efficient: Handles large image sets

Progress Tracking: Real-time download updates

📱 Pro Features (Upgrade Available)
Enhanced Features
Batch conversion: Convert all images to specific format

Watermarking: Add custom watermarks

Metadata preservation: Keep EXIF data

Cloud backup: Auto-sync to Google Drive/Dropbox

AI filtering: Smart content detection

Priority support: Faster response times

Upgrade at: [Your Website Link]

🐛 Troubleshooting
Common Issues
Images Not Detected
Refresh the page and try scanning again

Check if images are lazy-loaded (scroll down)

Disable ad-blockers temporarily

Try "Force Load Images" from context menu

Download Fails
Check disk space availability

Ensure folder permissions are correct

Try reducing batch size

Check if antivirus is blocking downloads

Extension Not Working
Reload the extension from chrome://extensions/

Clear browser cache

Update Chrome to latest version

Reinstall the extension

Debug Mode
Enable debug logs:

javascript
// In content.js
localStorage.setItem('debug', 'true');

// In popup.js
window.DEBUG_MODE = true;
🔒 Privacy & Security
Data Collection
❌ No personal data collected

❌ No tracking of browsing history

❌ No upload of your images

✅ All processing happens locally

✅ Settings stored locally only

Permissions Justification
Permission	Why Needed
downloads	To save images to your computer
activeTab	To access images on current page
storage	To remember your preferences
scripting	To extract images from webpages
🤝 Contributing
We welcome contributions! Here's how:

Fork the repository

Create a feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

Development Setup
bash
# Install dependencies
npm install

# Build extension
npm run build

# Test in Chrome
npm run test
Coding Standards
Use meaningful variable names

Add comments for complex logic

Follow existing code structure

Test all changes thoroughly

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
Icons: Material Design Icons

Color Scheme: Tailwind CSS Colors

Inspiration: Various image download tools

Testing: Community feedback and bug reports

📞 Support
Documentation
User Guide

Developer Guide

API Reference

Contact
Issues: GitHub Issues

Email: support@yourdomain.com

Discord: Join Community

Roadmap
Image editing before download

Support for more image formats

Cloud storage integration

Batch image processing

Firefox/Edge versions

Made with ❤️ for the Chrome community

⭐ Star this project if you find it useful! ⭐