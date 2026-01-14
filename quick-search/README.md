# 🔍 Quick Search

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Quick Search** supercharges your browsing by allowing you to search selected text on multiple engines instantly. Highlight any text, right-click (or use a shortcut), and jump directly to results on Google, Wikipedia, YouTube, or Amazon.

### 🚀 Features
- **Context Menu**: "Search on..." right-click option.
- **Keyboard Shortcut**: `Ctrl+Shift+S` (or `Cmd+Shift+S`).
- **Multiple Engines**: Configurable search providers.
- **Popup Search**: Type directly in the popup for quick results.

### 🛠️ Tech Stack
- **HTML5**: Popup.
- **JavaScript**: Tab creation logic.
- **Chrome Extension (Manifest V3)**: Context Menus.

### 📂 Folder Structure
```
quick-search/
├── icons/             # Icons
├── content.js         # Selection handler
├── background.js      # Menu handler
├── popup.html         # Search bar
└── manifest.json      # Config
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `quick-search`.

### 🧠 How It Works
1.  **Selection**: User highlights text.
2.  **Event**: On click, `background.js` constructs the search URL (e.g., `google.com/search?q=text`).
3.  **Action**: Opens a new tab with the result.

### 🔐 Permissions Explained
- **`contextMenus`**: To add the search option to the right-click menu.
- **`storage`**: To save your preferred search engines.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Search Menu](https://via.placeholder.com/600x400?text=Search+Menu)

### 🔒 Privacy Policy
- **No Logs**: We do not log your search queries.

### 📄 License
This project is licensed under the **MIT License**.
