# 📲 Web to Phone Bridge (SaveContact)

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Web to Phone Bridge** simplifies the process of saving contacts from the web. Instead of manually typing numbers into your phone, simply right-click any phone number or email address on a website to save it directly to your "Saved Contacts" list in the extension.

### 🚀 Features
- **Context Menu Integration**: Right-click on selection to save instantly.
- **Auto-Detection**: Smartly classifies selected text as phone or email.
- **Centralized List**: View all saved contacts in the popup.
- **QR Sharing**: (Optional feature) Scan to move contacts to mobile.

### 🛠️ Tech Stack
- **HTML5**: Popup list.
- **CSS3**: Styles.
- **JavaScript (Vanilla)**: Regex and storage logic.
- **Chrome Extension (Manifest V3)**: Context Menus API.

### 📂 Folder Structure
```
SaveContact/
├── bg.js              # Background service worker
├── content.js         # Content interaction
├── popup.html         # Saved list UI
├── popup.js           # List management
└── manifest.json      # Config
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions/`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `SaveContact`.

### 🧠 How It Works
1.  **Context Menu**: `bg.js` creates a context menu item "Save to Contacts".
2.  **Selection**: When clicked, it captures `info.selectionText`.
3.  **Validation**: It checks if the text looks like a number or email.
4.  **Storage**: Saves the valid contact to `chrome.storage.sync/local`.

### 🔐 Permissions Explained
- **`contextMenus`**: To add the right-click "Save Contact" option.
- **`storage`**: To persist your saved contact list.
- **`host_permissions`**: To ensure the context menu works on all pages.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Context Menu](https://via.placeholder.com/600x400?text=Context+Menu)

### 🔒 Privacy Policy
- **Private Storage**: Contacts are stored in your browser.
- **No Sync**: We do not upload your contacts to any server.

### 📄 License
This project is licensed under the **MIT License**.
