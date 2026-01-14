# 🗣️ Text to Voice

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Text to Voice** brings your text to life. Paste any paragraph, article, or note, and listen to it using your browser's built-in text-to-speech engine. Perfect for proofreading, accessibility, or just resting your eyes.

### 🚀 Features
- **Text-to-Speech**: High-quality speech synthesis.
- **Playback Control**: Play, Pause, and Resume.
- **Voice Selection**: Choose from available system voices.
- **Adjustable Speed**: Control the rate of speech.

### 🛠️ Tech Stack
- **HTML5**: Interface.
- **CSS3**: Styles.
- **JavaScript**: Web Speech API (`SpeechSynthesis`).
- **Chrome Extension (Manifest V3)**: Popup.

### 📂 Folder Structure
```
text-to-voice/
├── manifest.json      # Config
├── popup.html         # UI
├── popup.js           # Speech logic
└── style.css          # Styling
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Turn on **Developer mode**.
4.  Load unpacked -> `text-to-voice`.

### 🧠 How It Works
1.  **API**: Uses the `window.speechSynthesis` API.
2.  **Voice Loading**: Fetches available voices from the operating system.
3.  **Utterance**: Creates a `SpeechSynthesisUtterance` object with the user's text and preferences.

### 🔐 Permissions Explained
- **None**: Uses standard Web APIs available to the popup.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Speech Controls](https://via.placeholder.com/600x400?text=Speech+Controls)

### 🔒 Privacy Policy
- **Local**: Speech synthesis happens locally on your device (browser dependent).
- **No Tracking**: We do not store your text.

### 📄 License
This project is licensed under the **MIT License**.
