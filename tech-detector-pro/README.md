# 🚀 Tech Detector Pro – Chrome Extension

A powerful Chrome extension that detects **technologies used by any website instantly**. Similar to Wappalyzer but free, open-source, and built with Vanilla JavaScript.

Perfect for:
- Web developers
- Tech enthusiasts
- SEO professionals
- Competitive analysis
- Learning & research

---

## ✨ Features

- 🔍 **Instant Detection** - One-click scanning of all technologies
- 📊 **Categorized Results** - Organized by Frontend, Backend, CMS, Analytics, Hosting, and more
- 🎯 **Version Detection** - Detects specific versions where possible
- 📈 **Technology Summary** - Visual summary with technology count
- 📥 **Export Options** - Copy, download, or share detailed reports
- 📚 **Scan History** - Keep track of previous scans with timestamps
- 🎨 **Modern UI** - Indigo Night theme with smooth animations and gradients
- 🔄 **Auto-Scan Feature** - Optional automatic detection on page load
- 🔔 **Desktop Notifications** - Get alerts when technologies are detected
- 💾 **Local Storage** - All data stored locally, no cloud tracking
- Chrome Web Store friendly (Manifest V3)

---

## 🛠️ Technologies Detected

The extension detects 100+ technologies across multiple categories:

### Frontend Frameworks & Libraries:
React, Vue.js, Angular, Svelte, Next.js, Nuxt.js, Ember.js, Backbone.js, Knockout.js, and more

### Backend Technologies:
Node.js, PHP, Python, Ruby, Java, .NET, Go, Rust, Scala

### CMS Platforms:
WordPress, Shopify, Joomla, Drupal, Wix, Squarespace, Webflow, Ghost

### Analytics & Tracking:
Google Analytics, Google Tag Manager, Facebook Pixel, Hotjar, Mixpanel, Segment, Amplitude

### Hosting & CDN:
Cloudflare, AWS, Azure, Google Cloud, Vercel, Netlify, Heroku, DigitalOcean

### JavaScript Libraries:
jQuery, Lodash, Moment.js, Axios, Three.js, D3.js, Chart.js, and more

### And more categories...


---

## 📦 Project Structure

```
tech-detector-pro/
│
├── manifest.json           # Extension configuration (Manifest V3)
├── popup.html              # Main popup interface
├── popup.js                # Popup logic & scanning engine (549 lines)
├── popup.css               # Popup styling (462 lines)
├── background.js           # Service worker for background tasks
├── content.js              # Content script for technology detection
├── technologies.json       # Technology patterns database (511 lines)
├── theme-variables.css     # Indigo Night theme system
│
├── icons/
│ ├── icon16.png
│ ├── icon32.png
│ ├── icon48.png
│ └── icon128.png
│
└── README.md
```

---

## 📥 Installation (Developer Mode)

1. **Download/Clone** this repository

2. **Open Chrome** and navigate to:
   ```
   chrome://extensions/
   ```

3. **Enable Developer Mode** (toggle in top-right corner)

4. **Click "Load unpacked"**

5. **Select the folder**: `tech-detector-pro`

6. **Pin the extension** from your toolbar for quick access

✅ Extension is now installed and ready to use!

---

## 🎯 How to Use

### Basic Scanning:
1. Navigate to any website you want to analyze
2. Click the **Tech Detector Pro** icon in your toolbar
3. Click the **🚀 Scan Technologies** button
4. Wait for the scan to complete (progress bar shows status)
5. View results organized by category

### Result Details:
- Each technology shows an emoji icon and name
- Click on technology names to visit official websites
- See the full list of detected technologies with counts

### Export & History:
- **Copy Results** - Copy all technologies to clipboard
- **Download Report** - Save as JSON or CSV
- **Scan History** - View previous scans with timestamps
- **Clear History** - Reset your scan history anytime

### Advanced Features:
- **Auto-Scan** - Enable in settings to scan automatically on page load
- **Desktop Notifications** - Get alerts when scanning completes
- **Rescan Button** - Quickly re-analyze the same page

---

## 🎨 Theme & Design

- **Indigo Night Theme** - Professional dark theme perfect for extended use
- **Smooth Animations** - Elegant transitions and loading spinners
- **Gradient Design** - Modern visual hierarchy with CSS gradients
- **Responsive Layout** - Works perfectly on all screen sizes

---

## 🔐 Permissions & Privacy

### Permissions Used:
- `activeTab` - Access current website URL and content
- `scripting` - Execute detection scripts on pages
- `storage` - Save scan history and settings locally
- `notifications` - Send desktop alerts
- `<all_urls>` - Scan any website

**Privacy Guarantee:**
- ✅ No data collection or tracking
- ✅ No external API calls
- ✅ All analysis happens locally on your device
- ✅ No accounts or logins required
- ✅ History stored only in your browser

---

## 🧠 How It Works

1. **Pattern Matching** - Content script analyzes HTML, JavaScript, and HTTP headers
2. **Technology Database** - Compares findings against 100+ technology patterns
3. **Version Detection** - Identifies specific versions when available
4. **Categorization** - Organizes results by technology type
5. **Caching** - Stores results for faster access and history

---

## 📊 Technology Database

The `technologies.json` file contains:
- 100+ technology patterns
- Categorized by type (Frontend, Backend, CMS, etc.)
- Detection patterns (regex, string matching)
- Official website links
- Emoji icons for visual identification

### Adding New Technologies:

Edit `technologies.json` and add:

```json
{
  "id": "technology_slug",
  "name": "Technology Name",
  "patterns": ["pattern1", "pattern2", "script_src"],
  "icon": "📦",
  "website": "https://technology.com",
  "category": "frontend"
}
```

---

## 🚀 Development & Contributing

### Getting Started:
1. Fork the repository
2. Clone to your local machine
3. Make changes to the extension
4. Test thoroughly in Chrome

### Making Improvements:

**Add New Technologies:**
- Edit `technologies.json` with new patterns
- Test detection on relevant websites

**Improve Detection:**
- Enhance `content.js` for better pattern matching
- Add new detection methods

**Enhance UI:**
- Modify `popup.html` and `popup.css`
- Update `popup.js` for new features
- Use theme variables from `theme-variables.css`

**Add Features:**
- Settings panel for user preferences
- Export formats (CSV, PDF)
- Search/filter functionality
- Statistics and analytics

### Testing:
1. Load unpacked in Chrome
2. Test on various websites
3. Check console for errors
4. Verify all features work correctly

### Submitting Changes:
1. Create a feature branch
2. Commit your changes
3. Push to your fork
4. Submit a pull request

---

## 📄 Files Reference

| File | Size | Purpose |
|------|------|---------|
| `manifest.json` | - | Extension configuration & permissions |
| `popup.html` | 111 lines | Main popup UI interface |
| `popup.js` | 549 lines | Scanning logic & event handlers |
| `popup.css` | 462 lines | Styling & animations |
| `background.js` | - | Service worker for background tasks |
| `content.js` | - | Content script for pattern detection |
| `technologies.json` | 511 lines | 100+ technology patterns database |
| `theme-variables.css` | 125 lines | Indigo Night theme system |

---

## 🔧 Browser Compatibility

- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Brave
- ✅ Other Chromium-based browsers

---

## 📈 Future Roadmap

- 🎭 Multiple theme options (Dark, Light, Dracula, etc.)
- 🔍 Search & filter detected technologies
- 📊 Advanced statistics and analytics
- 🌍 Multi-language support
- 📱 Mobile version (Firefox extension)
- ⚙️ Custom pattern creation UI
- 🤖 AI-powered insights
- 💾 Cloud sync for history (optional)

---

## 📄 License

**MIT License** - Free to use, modify, and distribute.

See LICENSE file for full details.

---

## 🎓 Credits

Developed for **developers, learners, and tech enthusiasts** who want to understand how websites are built and what technologies power them.

Inspired by tools like Wappalyzer, but built as an open-source, privacy-first alternative.

---

## 💬 Support & Feedback

### Report Issues:
- Create a GitHub issue with:
  - Website that failed detection
  - Expected vs actual results
  - Browser version
  - Extension version

### Suggest Features:
- Open a GitHub discussion
- Describe your use case
- Explain the benefit

### Get Help:
- Check existing issues/discussions
- Review the code comments
- Test on different websites

---

## 🌟 Why Use Tech Detector Pro?

✅ **Free & Open Source** - No hidden costs or ads  
✅ **Privacy First** - All analysis local, no tracking  
✅ **Lightweight** - No heavy dependencies  
✅ **Easy to Extend** - Well-organized, documented code  
✅ **Regular Updates** - Community-driven improvements  
✅ **Works Offline** - No internet required (except to visit websites)  

---

### ⭐ If you find this extension useful, please star the repository!

**Happy technology detecting! 🚀**