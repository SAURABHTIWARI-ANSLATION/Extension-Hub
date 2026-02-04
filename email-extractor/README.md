# 📧 Email Extractor Pro - Chrome Extension

A beautiful, modern Chrome extension that extracts email addresses from any webpage with stunning UI and individual copy buttons for each email.

## ✨ Key Features

### 🎨 **Beautiful Modern Interface**
- Stunning purple gradient design
- Smooth animations and transitions
- Clean, intuitive layout
- Professional UI/UX

### 📋 **Individual Copy Buttons**
- Copy button for EACH extracted email
- Visual feedback when copied
- Quick and easy one-click copying
- "Copied!" confirmation animation

### 📊 **Live Statistics Dashboard**
- Real-time email count
- Unique domain counter
- Beautiful stats cards with icons

### 💾 **Smart Storage**
- Auto-saves all extracted emails
- Persistent storage across sessions
- Never lose your extracted data

### ⚡ **Powerful Extraction**
- Scans entire webpage (visible & hidden)
- Extracts from text, HTML, and mailto links
- Smart duplicate removal
- Filters out placeholder emails

### 🎯 **Additional Features**
- Copy all emails at once
- Export to CSV with domain info
- Clear all with confirmation
- Toast notifications for actions
- Protected against browser internal pages

## 🚀 Installation Guide

### Method 1: Load as Unpacked Extension (Recommended for Testing)

1. **Extract the ZIP File**
   - Unzip `email-extractor-extension.zip` to a folder

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Or: Menu (⋮) → More tools → Extensions

3. **Enable Developer Mode**
   - Toggle the switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the `email-extractor-extension` folder
   - Click "Select Folder"

5. **Start Using!**
   - Extension icon appears in toolbar
   - Click to open and start extracting

### Method 2: Chrome Web Store (For Public Release)

To publish to Chrome Web Store:
1. Register as Chrome Web Store developer ($5 one-time fee)
2. Create ZIP of extension folder
3. Upload through [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Submit for review

## 📖 How to Use

### Basic Usage

1. **Visit Any Webpage** with email addresses
2. **Click Extension Icon** in Chrome toolbar
3. **Press "Extract Emails from Page"** button
4. **View Results** in beautiful card layout

### Copy Single Email
- Click the **"Copy"** button next to any email
- Button changes to "Copied!" with checkmark
- Email is now in your clipboard

### Copy All Emails
- Click **"Copy All"** button at bottom
- All emails copied as list (one per line)
- Ready to paste anywhere

### Export to CSV
- Click **"Export CSV"** button
- Downloads CSV file with emails and domains
- Timestamped filename for easy organization

### Clear All
- Click **"Clear All"** button
- Confirmation dialog prevents accidents
- Removes all stored emails

## 🎨 UI Preview

Open `preview.html` in your browser to see the extension interface and features showcase!

## 🔧 Technical Details

### Built With
- **Manifest V3** (Latest Chrome standard)
- **Pure JavaScript** (No external dependencies)
- **Modern CSS3** (Gradients, animations, grid)
- **Chrome Storage API**

### Permissions Required
- `activeTab` - Access current webpage content
- `storage` - Save emails locally
- `scripting` - Inject extraction script

### Browser Compatibility
- ✅ Google Chrome (Primary)
- ✅ Microsoft Edge (Chromium)
- ✅ Brave Browser
- ✅ Opera
- ✅ Any Chromium-based browser

## 🔒 Privacy & Security

- ✅ **100% Local** - All data stored on your device
- ✅ **No External Servers** - Zero data transmission
- ✅ **No Tracking** - No analytics or telemetry
- ✅ **Open Source** - Review the code yourself
- ✅ **Minimal Permissions** - Only what's needed
- ✅ **Protected Pages** - Won't run on chrome:// URLs

## 📁 File Structure

```
email-extractor-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Main UI (beautiful interface)
├── popup.css             # Styling (gradients & animations)
├── popup.js              # Logic (extraction & copy functions)
├── preview.html          # UI preview page
├── icons/                # Extension icons
│   ├── icon16.png       # Toolbar icon (small)
│   ├── icon48.png       # Extension manager (medium)
│   └── icon128.png      # Chrome Web Store (large)
└── README.md            # This file
```

## 🎯 What Makes This Special?

### Compared to Other Email Extractors:

✨ **Individual Copy Buttons** - Most extensions only offer "copy all"  
🎨 **Modern Beautiful UI** - Professional gradient design, not basic  
📊 **Live Statistics** - See email count and unique domains  
💾 **Smart Storage** - Auto-saves everything, persists forever  
⚡ **Fast Animations** - Smooth, delightful user experience  
🔒 **Safe Extraction** - Protected against restricted pages  

## 🐛 Troubleshooting

**"Cannot extract from this page" error:**
- This appears on browser internal pages (chrome://, chrome-extension://)
- Navigate to a regular website to extract emails

**No emails found:**
- Ensure page has finished loading
- Try scrolling to load dynamic content
- Some emails might be in images (can't extract those)

**Extension not appearing:**
- Make sure Developer Mode is enabled
- Check that all files are in the folder
- Reload the extension from chrome://extensions/

**Copy button not working:**
- Make sure clipboard permissions are granted
- Try using "Copy All" instead
- Check browser console for errors

## 🚀 Future Enhancements

Possible additions for v3.0:
- 🌓 Dark mode toggle
- 🔍 Search/filter emails by domain
- ✅ Email validation (check if valid)
- 📧 Email verification (check if active)
- 🏷️ Tag and categorize emails
- 📱 Mobile browser support
- 🌐 Multi-tab extraction
- 📝 Custom export formats (JSON, TXT)

## 💡 Tips & Best Practices

1. **Extract from Multiple Pages** - Results accumulate
2. **Export Regularly** - Save CSV backups of important lists
3. **Check Stats** - Domain count shows variety
4. **Use Individual Copy** - When you need just one email
5. **Clear When Done** - Start fresh for new projects

## 📝 Version History

**v2.0.0** (Current) - Major UI Overhaul
- ✨ Completely redesigned beautiful interface
- 📋 Individual copy button for each email
- 📊 Live statistics dashboard
- 🎨 Gradient design with smooth animations
- 🔒 Protected against chrome:// URLs
- 💾 Enhanced storage management

**v1.0.0** - Initial Release
- Basic email extraction
- Copy all functionality
- CSV export
- Simple UI

## 📄 License

Free and open source. Use, modify, and distribute freely.  
No attribution required.

## 🤝 Support

Having issues or suggestions?
- Check troubleshooting section above
- Review code to understand functionality
- Modify for your specific needs

## 💖 Credits

**Made with love for productivity enthusiasts**

Enjoy extracting emails with style! 🚀

---

**Star this project if you find it useful!** ⭐
