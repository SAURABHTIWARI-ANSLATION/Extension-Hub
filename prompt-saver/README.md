# 💾 Prompt Saver

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Prompt Saver** is your personal library for AI prompts. Stop rewriting the same ChatGPT or Midjourney prompts over and over. Save your best-engineered prompts here and access them instantly.

### 🚀 Features
- **Save Prompts**: Title and Body storage.
- **One-Click Copy**: Copy prompt to clipboard instantly.
- **Search**: Filter your library to find the right prompt.
- **Edit/Delete**: Manage your collection.

### 🛠️ Tech Stack
- **HTML5**: List UI.
- **CSS3**: Styles.
- **JavaScript**: Storage and clipboard interactions.
- **Chrome Extension (Manifest V3)**: Storage API.

### 📂 Folder Structure
```
prompt-saver/
├── manifest.json      # Config
├── popup.html         # UI
├── popup.js           # Logic
└── style.css          # Styling
```

### ⚙️ Installation (Developer Mode)
1.  Download source.
2.  Open `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `prompt-saver`.

### 🧠 How It Works
1.  **Storage**: Uses `chrome.storage` to persist an array of prompt objects.
2.  **Clipboard**: Uses `navigator.clipboard.writeText()` to copy content.

### 🔐 Permissions Explained
- **`storage`**: To save your prompts permanently.
- **`clipboardWrite`**: To copy prompts to your clipboard.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Prompt Library](https://via.placeholder.com/600x400?text=Prompt+Library)

### 🔒 Privacy Policy
- **Local Storage**: Your prompts are stored on your device.
- **No Sync**: We do not see or sync your prompts.

### 📄 License
This project is licensed under the **MIT License**.
