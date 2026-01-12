# 💬 DM Manager Pro - Chrome Extension

DM Manager Pro is a powerful Chrome extension designed to streamline your business social media communications. Create and manage templates and auto-responses for LinkedIn, Twitter, Instagram, and Facebook.

Perfect for:
- Social media managers
- Business account owners
- Customer service teams
- Marketing professionals
- Community managers

---

## ✨ Features

- 📋 **Template Management**: Create, save, and organize response templates
- 🚀 **Quick Auto-Responses**: One-click responses for common messages
- 🔗 **Multi-Platform Support**: Works with LinkedIn, Twitter, Instagram, and Facebook
- 💾 **Cloud Sync**: Templates sync across all your devices
- 🎨 **Context Menu Integration**: Easy access from right-click menu
- ⚙️ **Customizable Settings**: Personalize your templates and preferences
- 🔒 **Secure & Private**: All data stored locally in Chrome Storage

---

## 📦 Project Structure

```
dm-manager-extension/
├── manifest.json
├── background.js
├── content.js
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── options/
│   ├── options.html
│   ├── options.js
│   └── options.css
├── assets/
│   ├── styles.css
│   └── templates.json
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## 🛠️ Installation (Developer Mode)

1. **Clone or download** the extension folder
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer Mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `dm-manager-extension` folder
6. The extension icon will appear in your Chrome toolbar

---

## 🚀 How to Use

### Create a Template
1. Click the extension icon in your toolbar
2. Click "New Template"
3. Enter a title and your template content
4. Save the template

### Use a Template
1. Open LinkedIn, Twitter, Instagram, or Facebook
2. Click the extension icon or right-click and select "DM Manager"
3. Choose your template
4. Customize if needed and send

### Manage Settings
1. Click the extension icon
2. Go to Settings/Options
3. Configure your preferences
4. Changes sync automatically

---

## 🔧 Supported Platforms

- ✅ LinkedIn (`linkedin.com`)
- ✅ Twitter (`twitter.com`)
- ✅ Instagram (`instagram.com`)
- ✅ Facebook (`facebook.com`)

---

## 💡 Tips & Best Practices

- **Keep templates concise**: Shorter templates are faster to customize
- **Use variables**: Create flexible templates with placeholders (e.g., `[Name]`, `[Company]`)
- **Regular updates**: Update templates based on common questions
- **Backup data**: Periodically export your templates
- **Test thoroughly**: Test templates before relying on them in production

---

## 🔐 Privacy & Security

- ✅ No data sent to external servers
- ✅ All templates stored locally in Chrome Storage
- ✅ No tracking or analytics
- ✅ No personal data collection
- ✅ Chrome Storage encryption (device-level)

---

## 📋 Permissions Used

- **storage**: To save your templates and settings
- **activeTab**: To detect which tab you're on
- **scripting**: To inject templates into web pages
- **contextMenus**: To add right-click menu options

---

## 🐛 Troubleshooting

### Templates not saving?
- Check if Chrome Storage is enabled
- Clear browser cache and try again
- Verify extension permissions in settings

### Extension not showing on certain sites?
- The extension works on supported social platforms
- Make sure you're on the correct domain
- Try refreshing the page

### Templates not syncing?
- Ensure you're signed into the same Google account
- Check your internet connection
- Wait a few moments for sync to complete

---

## 📝 Support & Feedback

Found a bug? Have suggestions? Create an issue or contact the extension developer.

---

## 📄 License

This extension is provided as-is for personal and business use.

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Compatibility**: Chrome 88+, Edge 88+, Brave, Opera
