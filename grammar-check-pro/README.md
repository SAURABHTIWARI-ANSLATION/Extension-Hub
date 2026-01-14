# ✍️ Grammar Check Pro

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Grammar Check Pro** is your intelligent writing assistant. It checks your spelling and grammar in real-time on any text field across the web. Whether writing an email, a tweet, or a blog post, ensure your writing is error-free and professional.

### 🚀 Features
- **Real-Time Checking**: Scans text as you type.
- **Multi-Language**: Supports English, Spanish, French, and more (via API).
- **Context Aware**:Detects misused words in context (e.g., "their" vs "there").
- **One-Click Fix**: Click on underlined errors to apply suggestions.

### 🛠️ Tech Stack
- **HTML5**: Popup and tooltip.
- **JavaScript**: Integration with LanguageTool API (or similar).
- **Chrome Extension (Manifest V3)**: Content scripts.

### 📂 Folder Structure
```
grammar-check-pro/
├── rules/             # Grammar rules
├── content.js         # Input monitoring
├── background.js      # API handler
├── popup.html         # Settings
└── manifest.json      # Config
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `grammar-check-pro`.

### 🧠 How It Works
1.  **Monitor**: `content.js` adds listeners to `input` and `textarea` fields.
2.  **Analyze**: Sends text chunk to the background worker, which queries a grammar API (e.g., LanguageTool).
3.  **Feedback**: Injects overlay elements (red underlines) at error positions.

### 🔐 Permissions Explained
- **`scripting`**: To interact with text fields on webpages.
- **`contextMenus`**: To allow checking selected text via right-click.
- **`host_permissions`**: To contact the grammar checking API service.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Grammar Corrections](https://via.placeholder.com/600x400?text=Grammar+Corrections)

### 🔒 Privacy Policy
- **Transmission**: Text is sent to the grammar API for checking but is not stored permanently.
- **Encryption**: All data transfer is encrypted via HTTPS.

### 📄 License
This project is licensed under the **MIT License**.
