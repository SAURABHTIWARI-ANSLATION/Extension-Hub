# 🚫 Focus Mode

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Focus Mode** helps you reclaim your attention. Define a list of distracting websites (like social media or news), and blocking them during your focus hours. When you try to visit them, you'll see a motivational quote instead.

### 🚀 Features
- **Blocklist**: Add any URL to the block list.
- **Toggle**: Easy On/Off switch for focus sessions.
- **Timer**: (Optional) Set a duration for the block.
- **Motivational Page**: Custom block page to get you back to work.

### 🛠️ Tech Stack
- **HTML5**: Settings UI.
- **JavaScript**: URL matching and tab updating.
- **Chrome Extension (Manifest V3)**: declarativeNetRequest or Tabs update logic.

### 📂 Folder Structure
```
focus-mode/
├── icons/             # Icons
├── background.js      # Blocker logic
├── popup.html         # Toggle UI
└── manifest.json      # Config
```

### ⚙️ Installation (Developer Mode)
1.  Download source.
2.  Open `chrome://extensions`.
3.  Turn on **Developer mode**.
4.  Load unpacked -> `focus-mode`.

### 🧠 How It Works
1.  **Listener**: `background.js` listens to `chrome.tabs.onUpdated`.
2.  **Match**: Checks if the new URL is in the stored blocklist.
3.  **Action**: If "Focus Mode" is active, it redirects the tab to `blocked.html` or closes it.

### 🔐 Permissions Explained
- **`storage`**: To save the blocklist and state.
- **`tabs`**: To monitor and redirect tabs.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Focus Toggle](https://via.placeholder.com/600x400?text=Focus+Toggle)

### 🔒 Privacy Policy
- **Local**: Your blocklist is stored locally. We do not track your browsing.

### 📄 License
This project is licensed under the **MIT License**.
