📦 Extension Manager
A sleek, professional browser extension to manage all your other extensions from a single popup interface. Enable, disable, search, and filter extensions with ease.

https://via.placeholder.com/400x600/1a1a2e/ffffff?text=Extension+Manager

✨ Features
🎯 Core Functionality
One-Click Management - Enable/disable extensions directly from popup

Instant Search - Find extensions quickly by name

Smart Filtering - View all, enabled only, or disabled only extensions

Bulk Actions - Enable or disable all extensions at once

Real-time Stats - See enabled/disabled counts at a glance

🎨 Design Highlights
Dark Theme - Easy on the eyes with professional indigo color scheme

Clean Interface - Minimalist design focusing on functionality

Toggle Switches - Intuitive on/off controls

Hover Effects - Smooth animations and transitions

Responsive Layout - Optimized for 400px width popup

⚡ Performance
Instant Loading - Extensions load in under 1 second

No Side Panel - Direct management from popup

Keyboard Friendly - Quick shortcuts for power users

Lightweight - Minimal memory footprint

🚀 Installation
Method 1: Load Unpacked (Development)
Download or clone this repository

Open Chrome/Edge and go to chrome://extensions/

Enable Developer mode (toggle in top-right)

Click "Load unpacked"

Select the extension-manager folder

Pin the extension to your toolbar

Method 2: From Chrome Web Store
(Coming soon)

🎮 How to Use
Basic Usage
Click the Extension Manager icon in your toolbar

Browse your extensions in the clean list

Toggle extensions on/off using the switches

Search for specific extensions using the search bar

Filter by status using the dropdown filter

Use bulk actions to enable/disable all at once

Keyboard Shortcuts
Ctrl+Shift+E (Windows/Linux) or Cmd+Shift+E (Mac) - Open Extension Manager

/ or Ctrl+F - Focus search bar

Escape - Close popup

Features Breakdown
🔍 Search
Type in the search box to instantly filter extensions by name. Works in real-time as you type.

🎯 Filters
All Extensions - View everything (default)

Enabled Only - See only active extensions

Disabled Only - See only inactive extensions

⚡ Quick Actions
Refresh Button - Reload extension list

Enable All - Turn on every extension

Disable All - Turn off every enabled extension (with confirmation)

🛠️ Technical Details
Browser Compatibility
✅ Chrome 88+

✅ Edge 88+

✅ Brave 1.20+

✅ Opera 74+

Permissions Required
management - To view and manage extensions

(No other permissions needed)

File Structure
text
extension-manager/
├── manifest.json          # Extension configuration
├── popup.html            # Main interface
├── popup.js              # Core logic
├── background.js         # Background service worker
└── icons/
    ├── icon16.png        # Toolbar icon (small)
    ├── icon48.png        # Extension icon (medium)
    └── icon128.png       # Store icon (large)
🔧 Development
Prerequisites
Basic knowledge of HTML, CSS, JavaScript

Chrome/Edge browser

Text editor (VS Code recommended)

Building from Source
Clone repository:

bash
git clone https://github.com/yourusername/extension-manager.git
cd extension-manager
Install dependencies (if any):

bash
npm install
Load extension in browser as described above

Customizing
Change Colors: Modify CSS variables in popup.html

Add Features: Extend popup.js functionality

Update Icons: Replace files in icons/ folder

🤝 Contributing
Contributions are welcome! Here's how:

Fork the repository

Create a feature branch: git checkout -b feature-name

Make your changes

Test thoroughly

Commit: git commit -m 'Add some feature'

Push: git push origin feature-name

Open a Pull Request

Code Guidelines
Use meaningful variable names

Comment complex logic

Follow existing code style

Test on multiple browsers

Ensure accessibility compliance

📝 Changelog
v1.0.0 (Current)
Initial release

Complete extension management

Dark theme interface

Search and filter functionality

Bulk enable/disable actions

Keyboard shortcuts

🚨 Known Issues & Limitations
Cannot manage extensions marked as "Required by browser"

Some enterprise-managed extensions may be restricted

Extension icons may not load for some extensions

No export/import functionality for extension lists

🔮 Roadmap
Planned Features
Export/import extension configurations

Extension grouping/categorization

Startup delay configuration

Extension usage statistics

Backup/restore functionality

Light theme option

Multi-language support

In Progress
Chrome Web Store submission

Firefox compatibility

Safari compatibility

📊 Privacy Policy
Extension Manager does NOT:

Collect any personal data

Track your browsing activity

Send data to external servers

Store extension data in the cloud

Extension Manager does:

Operate entirely locally in your browser

Use Chrome's built-in management API

Store preferences locally using Chrome storage

Respect your browser's privacy settings

⚖️ License
MIT License - See LICENSE file for details.

🙏 Acknowledgments
Chrome Extensions API documentation

Icons from Material Design Icons

Inspired by various extension managers

Testers and contributors

📧 Support
Having issues? Here's how to get help:

Check Known Issues section above

Search GitHub Issues for similar problems

Create a new Issue with:

Browser version

Extension version

Steps to reproduce

Screenshots if applicable

Quick Troubleshooting
Extension not loading? Check browser compatibility

Permissions denied? Reinstall the extension

Icons not showing? Some extensions restrict icon access

Toggle not working? Extension may be required by browser

🌟 Why Choose Extension Manager?
🏆 For Users
Save Time - Manage all extensions in one place

Reduce Clutter - Quickly disable unused extensions

Improve Performance - Disable heavy extensions when not needed

Stay Organized - Find extensions instantly

🛠️ For Developers
Clean Codebase - Well-structured and documented

Easy to Extend - Modular design for new features

Best Practices - Follows Chrome extension guidelines

Active Development - Regular updates and improvements

Made with ❤️ for the browser extension community