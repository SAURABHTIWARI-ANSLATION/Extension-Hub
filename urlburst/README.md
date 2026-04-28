# 🚀 URLBurst  
**Premium Bulk URL Opener & Manager**

URLBurst is a powerful Chrome extension designed for SEO professionals, developers, researchers, and anyone who needs to efficiently manage and open multiple URLs at once.

It provides a clean, intuitive interface with advanced features for bulk URL processing, organization, and automation. :contentReference[oaicite:0]{index=0}  

---

## ✨ Features

### 🔹 Core Functionality
- **Bulk URL Opening** — Open hundreds of URLs instantly with a single click  
- **Smart URL Extraction** — Extract URLs from messy text automatically  
- **One-by-One Mode** — Sequential opening with delay control  
- **Flexible Opening Options** —  
  - New Tabs  
  - New Windows  
  - Group by Domain  

---

### 🔹 URL Management
- Paste raw text, CSV, or URLs (one per line)
- Capture all currently open tabs
- Remove duplicates and invalid URLs
- Real-time validation stats
- Clipboard integration (copy/paste shortcuts)

---

### 🔹 Saved Lists System
- Create and manage named URL lists
- Load lists instantly
- Import / Export collections
- Timestamp-based tracking

---

### 🔹 Session History
- Automatic logging of every bulk open
- Restore previous sessions
- Stores last 20 sessions

---

### ⚙️ Advanced Settings

| Setting | Description |
|--------|------------|
| Open Mode | New Tab / Window / Group by Domain |
| Delay Control | 0–60 seconds |
| Limit URLs | Open first N URLs |
| Random Order | Shuffle URLs |
| Reverse Order | Open last first |
| Inactive Tabs | Open in background |
| Ignore Duplicates | Auto cleanup |
| Search Integration | Convert text → Google search |
| Memory Persistence | Restore last session |

---

## 📦 Installation

### 🔹 Chrome Web Store (Coming Soon)
1. Visit URLBurst listing  
2. Click **Add to Chrome**  
3. Confirm installation  

---

### 🔹 Developer Mode Installation

```bash
# Clone repo
git clone https://github.com/yourusername/urlburst.git

# Open Chrome extensions
chrome://extensions/

# Enable Developer Mode
# Click "Load unpacked"
# Select project folder
````

---

## 🎯 Usage Guide

### 🔹 Quick Start

1. Click extension icon
2. Paste URLs or raw text
3. Review validation stats
4. Click **Open Links**

---

### 🔹 Saved Lists

* Go to **Saved Lists tab**
* Create → Save → Load anytime

---

### 🔹 History

* Open via clock icon
* Reload previous sessions
* Clear history anytime

---

### ⌨️ Shortcuts

| Action        | Method                    |
| ------------- | ------------------------- |
| Paste         | Click Paste               |
| Copy URLs     | Click Copy                |
| Clear Input   | Click Clear               |
| Import        | Upload .txt / .csv        |
| Export        | Download file             |
| Extract Links | Extract button            |
| Cleanup       | Remove invalid/duplicates |

---

## ⚙️ Configuration

### 🔹 Open Modes

| Mode            | Behavior         |
| --------------- | ---------------- |
| New Tab         | Default          |
| New Window      | Separate windows |
| Group by Domain | Tab grouping     |

---

### 🔹 Behavior Toggles

* Shuffle URLs
* Reverse order
* Preserve input
* Ignore duplicates
* Enable search fallback
* Restore last session

---

## 📁 Project Structure

```
urlburst/
├── manifest.json
├── background.js
├── popup.html
├── popup.css
│
├── ui/
│   └── popup.js
│
├── services/
│   ├── openService.js
│   ├── storageService.js
│   └── urlParserService.js
│
├── utils/
│   ├── validator.js
│   └── formatter.js
│
└── icons/
```

---

## 🔐 Permissions

| Permission     | Purpose     |
| -------------- | ----------- |
| tabs           | Manage tabs |
| tabGroups      | Group tabs  |
| storage        | Save data   |
| clipboardRead  | Paste       |
| clipboardWrite | Copy        |

---

## 🧠 Technical Details

### Requirements

* Chrome 88+ (Manifest V3)
* Node.js (optional for dev)

---

### Data Storage

* Uses `chrome.storage.local`
* No external servers
* Fully offline & private

---

### URL Handling

* Supports HTTP/HTTPS
* Auto-adds `https://`
* Regex-based extraction
* Supports international domains

---

## 🐛 Troubleshooting

### Common Issues

**URLs not opening?**
→ Ensure valid URLs (http/https)

**Popup not opening?**
→ Reload extension

**Saved lists missing?**
→ Avoid Incognito mode

**Grouping not working?**
→ Enable tabGroups permission

---

### Debug Mode

```bash
Right click extension → Inspect popup
Check Console logs
chrome://extensions/ → Errors
```

---

## 🧪 Development

### Setup

```bash
git clone https://github.com/yourusername/urlburst.git
cd urlburst
```

No build required 🚀

---

### Workflow

1. Edit files
2. Go to `chrome://extensions/`
3. Click refresh
4. Test

---

## 📄 License

MIT License — Free for personal & commercial use

---

## 🤝 Contributing

* Fork repo
* Create feature branch
* Submit PR

---

## 📞 Support

* GitHub Issues
* Email: [support@urlburst.com](mailto:support@urlburst.com)
* Docs: docs.urlburst.com

---

## 🎨 Credits

* Font: Manrope
* Icons: Custom SVG
* Design: Clean & modern UI

---

## 📌 Version

**v1.0.0**
**Last Updated: 2026**
**Compatible: Chrome 88+**