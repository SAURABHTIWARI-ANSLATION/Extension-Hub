# AgreeSafe Privacy Protector

🔒 **Block Hidden Trackers • Protect Personal Data • Browse Confidently**

AgreeSafe is a Chrome extension that blocks website trackers to safeguard your personal data and give you back control over your online privacy.

## Features

### 🔒 Block Hidden Trackers
Automatically detect and block a wide range of web trackers, including:
- Google Analytics
- Facebook Pixel
- Hotjar
- Mixpanel
- And many more...

### 🛡️ Protect Personal Data
Prevent third-party companies from gathering your personal data and browsing behavior without your consent.

### 🔧 Simple Controls
- Pause blocking with a single click
- Add trusted sites to your whitelist
- Clear statistics anytime
- Toggle protection on/off per site

### ⚡ Faster, Cleaner Browsing
Enjoy speed boosts as pages load without privacy trackers slowing them down.

## Installation Instructions

### Method 1: Load Unpacked Extension (Development Mode)

1. **Extract the ZIP file** to a folder on your computer

2. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Type `chrome://extensions/` in the address bar and press Enter
   - OR click the three dots menu (⋮) → More Tools → Extensions

3. **Enable Developer Mode**
   - Look for the "Developer mode" toggle in the top-right corner
   - Click to enable it

4. **Load the Extension**
   - Click the "Load unpacked" button that appears
   - Navigate to the folder where you extracted the extension files
   - Select the `agreesafe-extension` folder
   - Click "Select Folder" (or "Open" on Mac)

5. **Verify Installation**
   - You should see the AgreeSafe icon appear in your browser toolbar
   - The extension card will show in your extensions list
   - Pin the extension to your toolbar for easy access (click the puzzle piece icon → pin AgreeSafe)

### Method 2: Pack and Install as CRX (Optional)

1. After loading the extension in developer mode
2. Click "Pack extension" button
3. Select the extension folder
4. Chrome will create a `.crx` file and a `.pem` key file
5. You can share the `.crx` file with others to install

## How to Use

### Basic Usage

1. **Check Protection Status**
   - Click the AgreeSafe icon in your toolbar
   - See the number of trackers blocked (badge on icon)
   - View protection status (Active/Disabled)

2. **View Statistics**
   - Total trackers blocked across all sites
   - Number of sites protected
   - List of recently blocked trackers

3. **Toggle Protection**
   - Use the toggle switch in the popup to enable/disable protection
   - Protection is ON by default

### Whitelist Management

1. **Add a Site to Whitelist**
   - Visit the website you want to whitelist
   - Click the AgreeSafe icon
   - Click "Add to Whitelist" button
   - The site will now allow trackers through

2. **Remove from Whitelist**
   - Click the AgreeSafe icon
   - Scroll to "Whitelisted Sites" section
   - Click the "×" button next to the site you want to remove

### Clear Statistics

- Click the "Clear" button in the tracker list section to reset all statistics

## What Gets Blocked

AgreeSafe blocks common tracking domains including:

- **Analytics Trackers**: Google Analytics, Mixpanel, Segment
- **Social Media Trackers**: Facebook Pixel, Twitter analytics
- **Advertising Trackers**: DoubleClick, Amazon ads
- **Behavior Trackers**: Hotjar, Mouseflow, Crazy Egg, Microsoft Clarity
- **Generic Tracking**: Any URLs containing "tracking" or "analytics"

## Technical Details

### Technologies Used
- Manifest V3 (latest Chrome extension format)
- Declarative Net Request API (for efficient blocking)
- Chrome Storage API (for persistent settings)
- Vanilla JavaScript (no dependencies)

### Files Structure
```
agreesafe-extension/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── popup.html            # Popup interface
├── popup.css             # Popup styles
├── popup.js              # Popup logic
├── rules.json            # Tracker blocking rules
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon128.png
│   ├── icon-disabled16.png
│   ├── icon-disabled32.png
│   ├── icon-disabled48.png
│   └── icon-disabled128.png
└── README.md             # This file
```

### Permissions Explained

- **storage**: Save your settings and statistics
- **declarativeNetRequest**: Block tracking requests efficiently
- **tabs**: Access current tab information
- **activeTab**: Interact with the current page
- **host_permissions**: Monitor all websites for trackers

## Privacy Policy

AgreeSafe respects your privacy:

- ✅ All data is stored locally on your device
- ✅ No data is sent to external servers
- ✅ No analytics or tracking of any kind
- ✅ Open source - you can inspect all code

## Troubleshooting

### Extension Not Blocking Trackers

1. Make sure the extension is enabled (toggle switch is ON)
2. Check if the current site is whitelisted
3. Try refreshing the page after enabling protection
4. Check Chrome's extension permissions

### Popup Not Opening

1. Try reloading the extension:
   - Go to `chrome://extensions/`
   - Click the refresh icon on the AgreeSafe card
2. Make sure you're using a compatible Chrome version (v88+)

### Website Not Working Properly

Some websites require certain trackers to function. If you experience issues:

1. Add the site to your whitelist
2. Refresh the page
3. The site should now work normally

## Customization

### Adding Custom Blocking Rules

You can add more tracker domains to block by editing `rules.json`:

1. Open `rules.json` in a text editor
2. Add a new rule following this format:
```json
{
  "id": 16,
  "priority": 1,
  "action": {
    "type": "block"
  },
  "condition": {
    "urlFilter": "*tracker-domain.com*",
    "resourceTypes": ["script", "xmlhttprequest", "image"]
  }
}
```
3. Reload the extension in Chrome

## Updates & Maintenance

To update the extension:

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on the AgreeSafe card
4. Changes will take effect immediately

## Browser Compatibility

- ✅ Google Chrome (v88+)
- ✅ Microsoft Edge (Chromium-based)
- ✅ Brave Browser
- ✅ Other Chromium-based browsers

❌ Not compatible with Firefox (requires different manifest format)

## Support & Feedback

If you encounter issues or have suggestions:

1. Check the troubleshooting section above
2. Review the code to understand how it works
3. Modify the extension to suit your needs

## License

This extension is provided as-is for educational and personal use.

## Version History

**v1.0.0** (Initial Release)
- Block common web trackers
- Whitelist management
- Statistics tracking
- Simple on/off toggle
- Modern, user-friendly interface

---

**Made with 🔐 for Privacy-Conscious Users**

Browse safely and confidently with AgreeSafe!
