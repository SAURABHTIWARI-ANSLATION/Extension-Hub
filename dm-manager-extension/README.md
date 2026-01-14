# 💬 DM Manager Pro

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**DM Manager Pro** streamlines your social media communication. Save frequently used responses, templates, and outreach messages for LinkedIn, Twitter, Instagram, and Facebook. Reply faster and more consistently with context-aware templates.

### 🚀 Features
- **Template Library**: Create categories for different types of messages (Sales, Support, Networking).
- **Auto-Fill**: One-click insertion into the chat box.
- **Cross-Platform**: Works on major social networks.
- **Context Menu**: Right-click to insert templates.

### 🛠️ Tech Stack
- **HTML5**: Manager UI.
- **JavaScript**: DOM manipulation for text injection.
- **Chrome Extension (Manifest V3)**: Content scripts and Context Menus.

### 📂 Folder Structure
```
dm-manager-extension/
├── popup/             # UI
├── content.js         # Injection script
├── background.js      # Context menu handler
└── manifest.json      # Config
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `dm-manager-extension`.

### 🧠 How It Works
1.  **Storage**: Templates are saved in `chrome.storage`.
2.  **Detection**: `content.js` identifies the active input field on supported sites.
3.  **Insertion**: Uses `document.execCommand('insertText')` or newer APIs to place the template text at the cursor.

### 🔐 Permissions Explained
- **`host_permissions`**: Needs access to social media sites to function.
- **`scripting`**: To inject text into third-party iframes or pages.
- **`storage`**: To save your templates.
- **`contextMenus`**: For right-click access.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Template Manager](https://via.placeholder.com/600x400?text=Template+Manager)

### 🔒 Privacy Policy
- **Private Data**: Your templates are stored locally. We do not read your DMs.

### 📄 License
This project is licensed under the **MIT License**.
