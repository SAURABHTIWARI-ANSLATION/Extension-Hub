# 📖 Dictionary Search

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Dictionary Search** is your instant vocabulary companion. Double-click any word on a webpage or type it into the popup to get definitions, synonyms, and pronunciation. Expand your vocabulary without breaking your reading flow.

### 🚀 Features
- **Double-Click Lookups**: (Optional) highlight word to define.
- **Comprehensive Definitions**: Meanings, parts of speech, and examples.
- **Audio Pronunciation**: Listen to the correct pronunciation.
- **Synonyms**: Find similar words easily.

### 🛠️ Tech Stack
- **HTML5**: Popup.
- **JavaScript**: Fetch API for Dictionary API.
- **Chrome Extension (Manifest V2)**: (Legacy).

### 📂 Folder Structure
```
Dictionary/
├── manifest.json      # Config
├── popup.html         # UI
├── popup.js           # API Logic
└── logo.png           # Icon
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `Dictionary`.

### 🧠 How It Works
1.  **Query**: Sends the selected word to a Free Dictionary API.
2.  **Response**: Parses JSON response containing definitions and audio links.
3.  **Display**: Renders the result in a clean card format.

### 🔐 Permissions Explained
- **Internet Access**: Implicitly required to query the API.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Definition Popup](https://via.placeholder.com/600x400?text=Definition+Popup)

### 🔒 Privacy Policy
- **Anonymous**: Lookups are not tied to your identity.

### 📄 License
This project is licensed under the **MIT License**.
