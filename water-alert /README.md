# 💧 Water Alert

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Water Alert** is your personal hydration coach. Spending hours at the screen often means forgetting to drink water. This extension sends you gentle, customizable reminders to stay hydrated, keeping you healthy and focused.

### 🚀 Features
- **Smart Reminders**: Set intervals (e.g., every 30 mins, 1 hour).
- **Notification Popups**: Non-intrusive system notifications.
- **Progress Tracking**: Log your glasses and see your daily intake.
- **Custom Sounds**: Choose your alert tone.

### 🛠️ Tech Stack
- **HTML5**: UI.
- **CSS3**: Styling.
- **JavaScript**: Alarms and storage.
- **Chrome Extension (Manifest V3)**: Alarms API.

### 📂 Folder Structure
```
water-alert /
├── icons/             # Icons
├── alert.html         # Notification UI
├── background.js      # Scheduler
├── popup.html         # Settings
└── manifest.json      # Config
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `water-alert `.

### 🧠 How It Works
1.  **Scheduling**: Uses `chrome.alarms.create` to schedule recurring events.
2.  **Trigger**: When alarm fires, `background.js` creates a `chrome.notifications` alert or opens a small window.
3.  **Logging**: User interactions (drinking water) are saved to tracking history.

### 🔐 Permissions Explained
- **`alarms`**: Critical permission to run the timer in the background.
- **`notifications`**: To show the hydration alert.
- **`storage`**: To save your preferences and daily count.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Reminder Notification](https://via.placeholder.com/600x400?text=Reminder+Notification)

### 🔒 Privacy Policy
- **Health Data**: Logs are stored locally.
- **Private**: We do not collect health info.

### 📄 License
This project is licensed under the **MIT License**.
