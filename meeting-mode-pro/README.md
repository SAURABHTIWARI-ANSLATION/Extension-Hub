# Meeting Mode Pro - Chrome Extension

## 🎯 Overview
Meeting Mode Pro is a powerful Chrome extension that helps you maintain professionalism during screen sharing and virtual meetings by automatically hiding personal tabs, cleaning URLs, and providing meeting management tools.

## ✨ Features

### Core Features
- **One-Click Meeting Mode** - Toggle professional mode with a single click
- **Auto-Hide Personal Tabs** - Automatically hides social media and personal tabs
- **URL Cleaner** - Removes tracking parameters from URLs for clean sharing
- **Meeting Timer** - Track meeting duration with visual timer
- **Meeting Sidebar** - Access tools without leaving your current tab
- **Action Item Extraction** - Automatically extract action items from pages
- **Smart Notifications** - Block distracting notifications during meetings

### Advanced Features
- **Tab Categorization** - Automatically detects work vs personal tabs
- **Meeting Agenda** - Take notes and track meeting agenda
- **Keyboard Shortcuts** - Quick access with Ctrl+Shift+M
- **Privacy Protection** - Hide sensitive content during screen sharing

## 📦 Installation Instructions

### Step 1: Download the Extension
1. Download the `meeting-mode-pro.zip` file
2. Extract it to a folder on your computer

### Step 2: Enable Developer Mode in Chrome
1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Toggle **"Developer mode"** ON (top right corner)

### Step 3: Load the Extension
1. Click **"Load unpacked"** button
2. Select the extracted `meeting-mode-pro` folder
3. The extension will now appear in your extensions list

### Step 4: Pin the Extension (Optional)
1. Click the puzzle icon (🧩) in Chrome toolbar
2. Find "Meeting Mode Pro"
3. Click the pin icon to keep it visible

## 🚀 How to Use

### Basic Usage
1. **Activate Meeting Mode**
   - Click the extension icon
   - Toggle the "Meeting Mode" switch
   - Personal tabs will be automatically hidden

2. **Hide Personal Tabs**
   - Click "Hide Personal Tabs" button
   - Social media and personal sites will be grouped and collapsed

3. **Clean URLs**
   - Click "Clean URL" to remove tracking parameters
   - Share clean, professional-looking links

4. **Start Meeting Timer**
   - Click "Meeting Timer"
   - Set your meeting duration
   - Timer will alert you when time is up

### Keyboard Shortcuts
- **Ctrl+Shift+M** (Windows/Linux) or **Cmd+Shift+M** (Mac) - Toggle Meeting Mode

### Customization
1. Click the extension icon
2. Scroll to **Settings** section
3. Enable/disable features:
   - Auto-hide notifications
   - Clean URLs automatically
   - Meeting timer sound
   - Action item extraction

## 🔧 Technical Details

### Files Structure
```
meeting-mode-pro/
├── manifest.json           # Extension configuration
├── background.js          # Service worker (background processes)
├── content.js             # Content script (injected into pages)
├── popup.html             # Extension popup UI
├── popup.js               # Popup functionality
├── styles.css             # Popup styles
├── meeting-sidebar.html   # Sidebar UI
├── meeting-sidebar.js     # Sidebar functionality
├── sidebar-styles.css     # Sidebar styles
├── privacy-policy.html    # Privacy policy
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

### Permissions Explained
- **tabs** - To manage and hide tabs
- **storage** - To save your settings and preferences
- **notifications** - To send meeting alerts
- **alarms** - For meeting timers
- **scripting** - To inject sidebar and features
- **activeTab** - To clean URLs and extract content
- **tabGroups** - To group and collapse personal tabs

## 🔒 Privacy & Security

### Data Storage
- All data is stored **locally** on your device
- No data is sent to external servers
- Your browsing history is never accessed

### Permissions
- The extension only accesses tabs when Meeting Mode is active
- URL cleaning only removes tracking parameters
- Notification blocking is temporary and reversible

## 🐛 Troubleshooting

### Extension not working?
1. **Refresh the extension**
   - Go to `chrome://extensions/`
   - Click the refresh icon on Meeting Mode Pro
   - Reload any open tabs

2. **Check permissions**
   - Ensure all required permissions are granted
   - Some features may not work on chrome:// pages

3. **Clear extension data**
   - Right-click the extension icon
   - Select "Remove from Chrome"
   - Reinstall the extension

### Tabs not hiding?
- Make sure Meeting Mode is toggled ON
- Check that domains are in the personal list
- Some system tabs cannot be hidden

### Timer not working?
- Ensure notifications are enabled
- Check Chrome notification settings
- Try refreshing the extension

## 📝 Customizing Personal/Work Domains

### Adding Custom Domains
Edit the settings in `popup.js`:

```javascript
personalDomains: [
    'facebook.com', 'instagram.com', 'twitter.com',
    // Add your custom personal domains here
],
workDomains: [
    'docs.google.com', 'github.com', 'slack.com',
    // Add your custom work domains here
]
```

## 🔄 Updates & Changelog

### Version 1.0.0
- Initial release
- Meeting Mode toggle
- Tab hiding and grouping
- URL cleaner
- Meeting timer
- Action item extraction
- Meeting sidebar

## 🤝 Support

### Getting Help
- Check the troubleshooting section above
- Review the privacy policy
- Submit feedback through the extension

### Reporting Issues
If you encounter any issues:
1. Note the Chrome version
2. Describe the problem
3. Include steps to reproduce
4. Check console for errors (F12 → Console)

## 📄 License

This extension is provided as-is for personal and professional use.

## 🙏 Credits

Built with:
- Chrome Extensions Manifest V3
- Vanilla JavaScript
- Modern CSS
- Chrome APIs

---

**Enjoy professional screen sharing with Meeting Mode Pro!** 🎯
