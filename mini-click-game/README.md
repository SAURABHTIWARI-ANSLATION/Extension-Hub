# 🖱️ Mini Click Game

### 🧩 Description
**Mini Click Game** is a fun challenge to test your finger speed. How many times can you click in 10 seconds? Challenge your friends or just try to beat your own high score during a quick break.

### 🚀 Features
- **Speed Test**: Measures your clicking speed (CPS - Clicks Per Second).
- **Timer**: Automatic 10-second countdown.
- **High Score**: Remembers your personal best.
- **Instant Reset**: Quick restart for endless attempts.

### 🛠️ Tech Stack
- **HTML5**: Game UI.
- **CSS3**: Styling and animations.
- **JavaScript (Vanilla)**: Game loop and logic.
- **Chrome Extension (Manifest V3)**: Popup container.

### 📂 Folder Structure
```
mini-click-game/
├── manifest.json      # Config
├── popup.html         # UI
├── script.js          # Game logic
└── style.css          # Styling
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Open `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `mini-click-game`.

### 🧠 How It Works
1.  **Start**: Clicking starts the timer `setInterval`.
2.  **Count**: Each click increments a counter.
3.  **End**: When timer hits 0, it stops listening for clicks and displays the score.

### 🔐 Permissions Explained
- **None**: Runs entirely locally.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Game Interface](https://via.placeholder.com/600x400?text=Game+Interface)

### 🔒 Privacy Policy
- **Local Game**: Scores are stored locally (if implemented) or just in memory.
- **No Tracking**: We don't track your clicks.

### 📄 License
This project is licensed under the **MIT License**.
