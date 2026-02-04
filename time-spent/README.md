# ⏱️ Time Spent Tracker

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Time Spent Tracker** helps you regain control of your digital life. It automatically tracks how much time you spend on each website you visit, giving you clear insights into your browsing habits. Whether you want to improve productivity or limit social media usage, this extension provides the data you need.

### 🚀 Features
- **Automatic Tracking**: Runs in the background and tracks active time on tabs.
- **Idle Detection**: Stops tracking when you are away from the computer.
- **Daily Reports**: View your usage stats for the day.
- **Visual Charts**: Easy-to-read breakdown of your most visited sites.

### 🛠️ Tech Stack
- **HTML5**: Popup stats view.
- **CSS3**: Styles.
- **JavaScript (Vanilla)**: Tracking logic.
- **Chrome Extension (Manifest V3)**: Background service worker for persistent tracking.

### 📂 Folder Structure
```
time spent/
├── icons/             # App icons
├── background.js      # Core tracking logic
├── manifest.json      # Config
├── popup.html         # Stats UI
└── popup.js           # UI logic
```

### ⚙️ Installation (Developer Mode)
1.  Clone the repository.
2.  Open `chrome://extensions/`.
3.  Enable **Developer mode**.
4.  Select **Load unpacked**.
5.  Navigate to the `time spent` folder.

### 🧠 How It Works
1.  **Listeners**: The `background.js` listens for `tabs.onActivated` and `tabs.onUpdated`.
2.  **Timer**: When a tab is active, a timer starts.
3.  **Idle Check**: It uses `chrome.idle` to pause the timer if the user is inactive.
4.  **Storage**: Aggregated time data is saved in `chrome.storage.local`.

### 🔐 Permissions Explained
- **`tabs`**: To know which website URL is currently active.
- **`storage`**: To save your time tracking data persistently.
- **`idle`**: To stop the timer when you are not using the computer.
- **`alarms`**: To trigger periodic cleanups or checks.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Dashboard](https://via.placeholder.com/600x400?text=Dashboard)

### 🔒 Privacy Policy
- **Local Data**: All tracking data is stored locally on your browser.
- **No Export**: We do not send your browsing history to any server.

### 📄 License
This project is licensed under the **MIT License**.
