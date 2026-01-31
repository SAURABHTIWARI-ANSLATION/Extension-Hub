🎯 Daily Goal Tracker — Chrome Extension

A beautifully designed, productivity-focused Chrome extension that helps you set daily goals, track your progress, maintain a streak, and view history — all with an elegant dark UI and seamless syncing.

🚀 Features

✔️ Add daily goals easily

🔥 Streak tracking — build your consistency

🕒 Auto-reset daily goals using Chrome Alarms
(resets completed tasks every new day)

📅 Smart History — shows your last accomplishments

📝 Working / Complete status per goal

🗑️ Remove individual goals

🌙 Modern dark theme with beautiful UI & animations

🔄 Chrome Storage Sync support — your goals travel with you

⚙️ Lightweight, fast, offline

📦 Project Structure
extension/
│── manifest.json
│── background.js
│── popup.html
│── popup.js
│── styles.css
│── icons/
│     ├── icon16.png
│     ├── icon48.png
│     ├── icon128.png

🖥️ How It Works
⭐ 1. Add Your Daily Goals

Use the input bar to add tasks you want to complete today.

🔄 2. Track Progress

Each goal has a status selector:

Working

Complete

🔥 3. Streak System

Your streak increases only once per day when all completed tasks are cleared.

🕒 4. Automatic Daily Reset

The extension runs a reset check every hour (via alarms) and:

Logs completed tasks into history

Clears daily goals

Updates streak

(Logic handled in background.js)

🗂️ 5. History

Shows the most recent completed tasks (auto-grouped by date).

🌙 UI & Theme

Your extension uses a premium dark-mode interface:

Soft gradients

Smooth animations

Highlighted primary blue elements

Glass-like card UI

Custom list animations

Clean minimalistic layout

🔧 Manifest (V3)

Based on your uploaded manifest.json:

{
  "manifest_version": 3,
  "name": "Daily Goal Tracker",
  "version": "1.0",
  "description": "Track your daily goals and habits",
  "permissions": ["storage", "alarms"],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}


manifest

🛠️ Technologies Used

JavaScript (ES6)

Chrome Storage API

Chrome Alarms API

Service Worker (background.js)

HTML5

CSS3 (modern dark UI)

📥 Installation (Developer Mode)

Download this repository

Open Chrome → chrome://extensions/

Enable Developer Mode

Click Load Unpacked

Select the extension folder

Done! You're ready to focus 🔥

🤝 Contribution

Want to improve this extension?
Pull requests and feature suggestions are welcome!

📄 License

Released under MIT License — free to use and modify.