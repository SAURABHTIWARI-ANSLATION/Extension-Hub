# 🍅 Pomodoro Timer

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Pomodoro Timer** is a productivity tool based on the famous Pomodoro Technique. Break your work into 25-minute intervals separated by short breaks. Stay focused, avoid burnout, and track your completed sessions.

### 🚀 Features
- **Timer**: 25m / 5m / 15m presets for Focus, Short Break, Long Break.
- **Notifications**: Audio and visual alerts when time is up.
- **Customizable**: Adjust timer durations in settings.
- **Tasks**: (Optional) Associate timers with specific tasks.

### 🛠️ Tech Stack
- **HTML5**: Timer UI.
- **CSS3**: Circular progress bar.
- **JavaScript**: Interval logic and Alarms.
- **Chrome Extension (Manifest V3)**: Service Worker.

### 📂 Folder Structure
```
pomodoro/
├── icons/             # Icons
├── background.js      # Timer (Service Worker)
├── popup.html         # UI
└── manifest.json      # Config
```

### ⚙️ Installation (Developer Mode)
1.  Download source.
2.  Open `chrome://extensions`.
3.  Turn on **Developer mode**.
4.  Load unpacked -> `pomodoro`.

### 🧠 How It Works
1.  **Start**: `chrome.alarms.create` sets a timer in the background.
2.  **Tick**: The popup queries the remaining time from storage or the background script.
3.  **End**: Service worker fires a notification when the alarm triggers.

### 🔐 Permissions Explained
- **`alarms`**: Essential for the timer to run reliably in the background.
- **`notifications`**: To alert you when the session ends.
- **`storage`**: To save your settings and session history.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Timer Interface](https://via.placeholder.com/600x400?text=Timer+Interface)

### 🔒 Privacy Policy
- **No Tracking**: We do not track your work habits.

### 📄 License
This project is licensed under the **MIT License**.
