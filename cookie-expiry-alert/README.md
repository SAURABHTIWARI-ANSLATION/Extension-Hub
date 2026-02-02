# 🍪 Cookie Expiry Alert - Chrome Extension

A powerful Chrome extension that monitors your browser cookies in real-time and alerts you before they expire!

## 🌟 Features

✅ **Real-time Cookie Monitoring** - Automatically tracks all cookies across all websites
✅ **Smart Alerts** - Get notifications at 24 hours, 1 hour, 15 minutes, and 5 minutes before expiry
✅ **Beautiful Dashboard** - See all your cookies with countdown timers
✅ **Search & Filter** - Easily find specific cookies by name or domain
✅ **Status Categories** - Color-coded alerts (Critical, Warning, Soon, OK, Session)
✅ **Live Countdown** - Real-time countdown showing exactly when cookies expire
✅ **Session Cookie Detection** - Identifies cookies that expire when browser closes
✅ **Security Badges** - Shows secure and httpOnly cookie flags

## 📦 Installation

### Method 1: Load Unpacked Extension (For Development/Testing)

1. **Extract the ZIP file** to a folder on your computer
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable "Developer mode"** using the toggle in the top-right corner
4. **Click "Load unpacked"** button
5. **Select the extracted folder** (cookie-expiry-alert)
6. **Done!** The extension icon will appear in your Chrome toolbar

### Method 2: Install from Chrome Web Store (Coming Soon)
The extension will be available on the Chrome Web Store soon!

## 🚀 How to Use

1. **Click the extension icon** in your Chrome toolbar to open the dashboard
2. **View all cookies** with their expiration status and countdown timers
3. **Search for specific cookies** using the search bar
4. **Filter by status**: All, Critical, Warning, Soon, or Session cookies
5. **Enable/Disable monitoring** using the toggle switch at the top
6. **Refresh** cookie list anytime with the refresh button

## 🎨 Cookie Status Indicators

- 🔴 **Critical** - Expires in less than 5 minutes
- 🟠 **Warning** - Expires in less than 1 hour
- 🔵 **Soon** - Expires in less than 24 hours
- 🟢 **OK** - Expires in more than 24 hours
- ⚫ **Session** - Expires when browser closes

## 🔔 Notification System

The extension sends desktop notifications at these intervals:
- **24 hours** before expiry
- **1 hour** before expiry
- **15 minutes** before expiry (requires interaction)
- **5 minutes** before expiry (requires interaction)

## 🛠️ Technical Details

### Built With
- Chrome Extension Manifest V3
- Vanilla JavaScript (no frameworks needed)
- Chrome Cookies API
- Chrome Notifications API
- Chrome Storage API

### Permissions Required
- `cookies` - To read and monitor cookie data
- `notifications` - To send expiry alerts
- `storage` - To save user preferences
- `alarms` - For periodic checking
- `<all_urls>` - To access cookies from all websites

### Files Structure
```
cookie-expiry-alert/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for monitoring
├── popup.html            # Dashboard interface
├── popup.css             # Styling
├── popup.js              # Dashboard logic
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## 🔐 Privacy & Security

- ✅ **No data collection** - All data stays on your device
- ✅ **No external servers** - Extension works completely offline
- ✅ **No tracking** - Your cookie data is never sent anywhere
- ✅ **Open source** - Code is fully transparent and auditable

## 🐛 Troubleshooting

**Extension not showing cookies?**
- Make sure you've granted all required permissions
- Try clicking the refresh button
- Check if cookies exist for the current websites

**Notifications not working?**
- Check Chrome notification permissions
- Ensure the extension is enabled
- Check system notification settings

**Extension stopped working?**
- Reload the extension from `chrome://extensions/`
- Check for any browser updates
- Try reinstalling the extension

## 📝 Future Updates

Coming soon:
- ⚙️ Customizable alert thresholds
- 📊 Cookie statistics and analytics
- 🎨 Theme customization
- 📤 Export cookie data
- 🔍 Advanced filtering options
- 📱 Better mobile support

## 🤝 Contributing

Found a bug or have a feature request? Feel free to:
- Report issues
- Submit pull requests
- Suggest improvements

## 📄 License

This extension is provided as-is for personal and educational use.

## 👨‍💻 Developer

Created with ❤️ to help users manage their browser cookies effectively!

---

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Compatible with:** Chrome 88+
