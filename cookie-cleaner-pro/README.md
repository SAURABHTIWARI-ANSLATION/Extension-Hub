🍪 Cookie Cleaner Pro - Chrome Extension
A smart cookie management extension that cleans non-essential cookies while keeping you logged into important websites.

https://img.shields.io/badge/Version-1.0.0-blue
https://img.shields.io/badge/Platform-Chrome%2520Extension-important
https://img.shields.io/badge/License-MIT-green

✨ Features
🛡️ Smart Cookie Management
One-click cleaning of non-essential cookies

Auto-protection for logged-in sites

Whitelist system to keep important cookies

Visual cookie stats and counters

🎯 Intelligent Protection
Automatically detects and protects current site

Manually add/remove domains from whitelist

Real-time cookie scanning and cleaning

Settings persistence across sessions

🎨 Beautiful Interface
Modern gradient design

Intuitive user interface

Real-time status updates

Responsive layout

📸 Screenshots
https://via.placeholder.com/380x500/667eea/ffffff?text=Cookie+Cleaner+Pro+Interface
Clean and modern popup interface

🚀 Installation
Method 1: Load Unpacked (Development)
Download or clone this repository

bash
git clone https://github.com/yourusername/cookie-cleaner-pro.git
Open Chrome Extensions Page

Navigate to chrome://extensions/

Or: Chrome Menu → More Tools → Extensions

Enable Developer Mode

Toggle switch in top-right corner

Load the Extension

Click "Load unpacked" button

Select the cookie-cleaner-pro folder

Click Select Folder

Pin the Extension

Click puzzle icon in toolbar

Find "Cookie Cleaner Pro"

Click pin icon 📌

Method 2: Chrome Web Store (Coming Soon)
This extension will be available on Chrome Web Store soon

🎯 How to Use
Basic Usage
Click the extension icon in Chrome toolbar

Add sites to whitelist:

Click "Protect Current Site" while on any website

Or manually add domains in the input field

Clean cookies:

Click "Clean Non-Essential Cookies"

Watch as non-essential cookies are removed

Whitelisted sites remain logged in

Advanced Features
Auto-protect: Enable in settings to automatically protect visited sites

Notifications: Get alerts when cookies are cleaned

Cookie Stats: Track how many cookies you've cleaned

Manual Management: Add/remove domains from whitelist anytime

🛠️ For Developers
Project Structure
text
cookie-cleaner-pro/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.js              # Popup JavaScript logic
├── background.js         # Background service worker
├── content.js            # Content script (future use)
├── styles.css            # All styling
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── images/               # Additional images
APIs Used
chrome.cookies - Cookie management

chrome.storage - Data persistence

chrome.tabs - Tab information

chrome.runtime - Extension messaging

Build From Source
Ensure you have the required files

No build process required - it's plain HTML/CSS/JS

Just load the folder in Chrome extensions

🔧 Technical Details
Cookie Filtering Logic
javascript
// Simplified logic:
1. Get all cookies from browser
2. Check each cookie's domain against whitelist
3. If domain is in whitelist → keep cookie
4. If domain NOT in whitelist → delete cookie
5. Update statistics and show results
Storage Schema
json
{
  "whitelist": ["google.com", "github.com", "youtube.com"],
  "stats": {
    "cleaned": 150
  },
  "settings": {
    "autoProtect": true,
    "notifications": true
  }
}
Permissions
cookies: Required to read and delete cookies

storage: Required to save user preferences

activeTab: Required to get current tab URL

<all_urls>: Required to access cookies from all sites

📝 Testing
Manual Testing
bash
1. Load extension in Chrome
2. Test "Protect Current Site" button
3. Test "Clean Non-Essential Cookies" button
4. Verify whitelist persistence
5. Test settings toggles
Test Scenarios
✅ Add site to whitelist → clean cookies → stay logged in

✅ Don't add site → clean cookies → get logged out

✅ Multiple sites in whitelist → all stay logged in

✅ Extension reload → data persists

✅ Chrome restart → data persists

🤝 Contributing
We welcome contributions! Here's how:

Fork the repository

Create a feature branch: git checkout -b feature/amazing-feature

Commit your changes: git commit -m 'Add amazing feature'

Push to the branch: git push origin feature/amazing-feature

Open a Pull Request

Development Setup
bash
# Clone the repository
git clone https://github.com/yourusername/cookie-cleaner-pro.git

# Navigate to project
cd cookie-cleaner-pro

# Load in Chrome as described above
🐛 Troubleshooting
Common Issues
Issue: Extension doesn't load

Solution: Check manifest.json for errors

Solution: Ensure all required files exist

Issue: Buttons not working

Solution: Check Chrome Console for errors

Solution: Right-click popup → Inspect → Console tab

Issue: Cookies not being cleaned

Solution: Check permissions in manifest

Solution: Verify website has cookies to clean

Issue: Whitelist not saving

Solution: Check Chrome storage quota

Solution: Clear extension data and reload

Debug Commands
javascript
// In Chrome Console (popup or background)
chrome.storage.sync.get(null, console.log);  // View all data
chrome.cookies.getAll({}, console.log);      // View all cookies
📈 Roadmap
Planned Features
Scheduled cleaning (daily/weekly auto-clean)

Cookie viewer (see all cookies per site)

Export/import whitelist

Dark mode

Keyboard shortcuts

Firefox/Safari/Edge versions

Current Version: 1.0.0
Basic cookie cleaning

Whitelist management

Statistics tracking

Settings persistence

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

text
MIT License

Copyright (c) 2023 Cookie Cleaner Pro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
...
🙏 Acknowledgments
Chrome Extension API - For making browser extensions possible

Font Awesome - For beautiful icons

Open Source Community - For inspiration and support

👨‍💻 Author
Your Name

GitHub: @yourusername

Twitter: @yourhandle

Website: yourwebsite.com

⭐ Support
If you like this project, please give it a star on GitHub! ⭐

🔗 Links
Repository: GitHub

Issues: Report a Bug

Chrome Web Store: Coming Soon

📧 Contact
For questions, suggestions, or feedback:

Email: your.email@example.com

GitHub Issues: Create New Issue

Happy Browsing! 🚀 Keep your cookies clean and your logins secure with Cookie Cleaner Pro.

Last updated: December 2023
Version: 1.0.0
*Compatibility: Chrome 88+*