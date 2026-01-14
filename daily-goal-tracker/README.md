# 🎯 Daily Goal Tracker

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Daily Goal Tracker** is a minimalist productivity extension designed to help you focus on what matters. List your top 3-5 goals for the day, check them off as you go, and build a streak of productivity. It's your simple, digital daily planner that lives in your browser.

### 🚀 Features
- **Task Management**: Add, edit, and delete daily goals.
- **Progress Tracking**: Visual progress bar shows how much you've achieved.
- **Daily Reset**: Goals can be set to reset automatically or manually.
- **Persistent storage**: Your goals are saved even if you close the browser.

### 🛠️ Tech Stack
- **HTML5**: Task list interface.
- **CSS3**: Styling.
- **JavaScript (Vanilla)**: CRUD operations for tasks.
- **Chrome Extension (Manifest V3)**: Storage and alarms.

### 📂 Folder Structure
```
daily-goal-tracker/
├── background.js      # Service worker
├── manifest.json      # Config
├── popup.html         # UI
└── popup.js           # Logic
```

### ⚙️ Installation (Developer Mode)
1.  Download source code.
2.  Go to `chrome://extensions`.
3.  Switch on **Developer mode**.
4.  Click **Load unpacked**.
5.  Select the `daily-goal-tracker` directory.

### 🧠 How It Works
1.  **UI**: A list of input fields or specific goal items.
2.  **Storage**: Every change is saved to `chrome.storage.sync` or `local`.
3.  **Alarms**: (Optional) Use `chrome.alarms` to send reminders or reset goals at midnight.

### 🔐 Permissions Explained
- **`storage`**: Essential to save your list of goals.
- **`alarms`**: Used for reminders or daily reset functionality.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Goal List](https://via.placeholder.com/600x400?text=Goal+List)

### 🔒 Privacy Policy
- **Local Data**: Your goals are yours effectively. They are stored locally.
- **No Cloud**: We do not sync your data to any external server.

### 📄 License
This project is licensed under the **MIT License**.
