PiP Master
Picture-in-Picture for any video - A Chrome extension that enables Picture-in-Picture mode on any video across the web with a single click or keyboard shortcut.

Features
🎥 Universal PiP - Works on any website with HTML5 video content

⌨️ Keyboard Shortcut - Ctrl+Shift+P to toggle PiP mode instantly

🎯 Smart Video Detection - Automatically identifies the main video on popular platforms

🎨 YouTube Integration - Adds a custom PiP button to YouTube's control bar

📱 Modern UI - Clean, responsive popup with real-time status updates

🔄 SPA Support - Works on single-page applications with dynamic content loading

🛡️ CSP Compliant - Uses inline styles and safe DOM manipulation to avoid Content Security Policy restrictions

Supported Platforms
Platform	Support
YouTube	✅ Full (custom button + main video detection)
Netflix	✅ Automatic detection
Twitch	✅ Automatic detection
Vimeo	✅ Automatic detection
Disney+	✅ Works
Amazon Prime	✅ Works
Hotstar	✅ Works
MxPlayer	✅ Works
Any HTML5 video	✅ Works
Installation
From Chrome Web Store (Coming Soon)
Visit the Chrome Web Store

Click "Add to Chrome"

Pin the extension to your toolbar for easy access

Manual Installation (Developer Mode)
Download or clone this repository

Open Chrome and navigate to chrome://extensions/

Enable "Developer mode" (toggle in top-right corner)

Click "Load unpacked"

Select the extension folder

The PiP Master icon should appear in your toolbar

Usage
Quick Start
Navigate to any page with a video (YouTube, Netflix, etc.)

Click the PiP Master icon in your toolbar

Click the "Toggle PiP Mode" button

Or simply press Ctrl+Shift+P

YouTube
A dedicated PiP button appears in the video control bar

Click it to enter/exit Picture-in-Picture mode

Tips for Best Results
Click the video first to give it focus before using PiP

Use the keyboard shortcut for fastest access

Resize the PiP window by dragging its edges

Works in the background while you browse other tabs

Keyboard Shortcut
Action	Shortcut
Toggle PiP	Ctrl + Shift + P
To customize the shortcut:

Go to chrome://extensions/

Click the menu icon (☰) in the top-left

Select "Keyboard shortcuts"

Find PiP Master and set your preferred shortcut

Development
Project Structure
text
pip-master/
├── manifest.json      # Extension configuration
├── background.js      # Service worker for background tasks
├── content.js         # Content script injected into pages
├── content.css        # Styles for notifications and UI elements
├── popup.html         # Extension popup interface
├── popup.css          # Popup styles
├── popup.js           # Popup interaction logic
├── icon16.png         # 16px icon
├── icon48.png         # 48px icon
├── icon128.png        # 128px icon
└── README.md          # This file
Building from Source
Clone the repository

Make any desired changes to the source files

Load the extension in Chrome using Developer mode (see Installation)

Key Files
content.js - Main PiP logic, video detection, and UI injection

background.js - Keyboard shortcut handling and extension state management

popup.js - Popup UI and communication with content script

Technical Details
Permissions Required
activeTab - To interact with the current tab's video content

scripting - To inject content scripts when needed

commands - For keyboard shortcut support

How It Works
The content script scans the page for video elements

On PiP request, it identifies the main video using platform-specific selectors

Requests Picture-in-Picture mode using the native browser API

Handles errors and user interactions gracefully

Browser Compatibility
Chrome 70+ (full PiP API support)

Edge (Chromium-based)

Opera (Chromium-based)

Brave (Chromium-based)

Known Limitations
Some sites (like certain DRM-protected content) may block PiP

Firefox uses a different PiP API (not supported)

First interaction on some sites may require clicking the video

Troubleshooting
"No video found on this page"
Ensure there's a playable video on the page

Try refreshing the page if the video loaded dynamically

"Click the video first, then try again"
The site requires user interaction before PiP can activate

Simply click on the video once, then use the shortcut

Extension not working on a specific site
The video might be using a custom player

Try clicking the video to focus it first

Some DRM-protected content (Netflix, etc.) may restrict PiP

Contributing
Contributions are welcome! Please:

Fork the repository

Create a feature branch

Submit a pull request with clear description of changes

License
MIT License - Free for personal and commercial use

Version History
v1.0.0 - Initial release

Universal PiP support

YouTube button integration

Keyboard shortcuts

Popup with status monitoring

Support
For issues or feature requests, please open an issue on GitHub.


