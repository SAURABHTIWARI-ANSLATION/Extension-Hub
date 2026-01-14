# ⚡ QuickFill Pro - Smart Form Autofill

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**QuickFill Pro** helps you breeze through repetitive forms. Whether for testing, applying to jobs, or creating accounts, create profiles with predefined data and fill entire forms with a single click (or shortcut).

### 🚀 Features
- **Multiple Profiles**: Create "Work", "Personal", or "Testing" profiles.
- **Smart Matching**: Matches fields by Name, ID, or Label (e.g., "Full Name", "email").
- **Shortcut**: `Ctrl+Shift+F` to fill instantly.
- **Secure Storage**: Data is stored locally.

### 🛠️ Tech Stack
- **HTML5**: Settings UI.
- **JavaScript**: DOM traversal and heuristic matching.
- **Chrome Extension (Manifest V3)**: Scripting.

### 📂 Folder Structure
```
quickfill-pro/
├── icons/             # Icons
├── popup.html         # Profile Manager
├── background.js      # Shortcut handler
├── options.html       # Full options
└── manifest.json      # Config
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `quickfill-pro`.

### 🧠 How It Works
1.  **Profiles**: User saves a JSON object `{name: "John", email: "john@doe.com"}`.
2.  **Scan**: Content script scans inputs on the page.
3.  **Match**: Fuzzy matches input `name` or `id` attributes against profile keys.
4.  **Fill**: Sets the `value` property of the inputs.

### 🔐 Permissions Explained
- **`activeTab`**: To access forms on the current page.
- **`scripting`**: To execute the filling logic.
- **`storage`**: To save your profiles.
- **`contextMenus`**: Right-click to fill.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Profile Settings](https://via.placeholder.com/600x400?text=Profile+Settings)

### 🔒 Privacy Policy
- **Local Encyption**: Profiles are stored in local storage.
- **No Cloud**: Your personal data never leaves your browser.

### 📄 License
This project is licensed under the **MIT License**.