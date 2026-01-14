# 🔊 Volume Master Ultimate

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Volume Master Ultimate** gives you complete control over your browser's audio. It allows you to boost the volume of any tab up to 600%, surpassing the standard 100% limit of your hardware. Perfect for quiet videos, low-quality audio streams, or just blasting your favorite tunes.

### 🚀 Features
- **Volume Boost**: Amplify audio up to 600%.
- **Tab-Specific Control**: Adjust volume for each tab individually.
- **Audio Visualizer**: Real-time visual feedback of audio levels.
- **Granular Control**: Fine-tune volume levels with a precise slider.

### 🛠️ Tech Stack
- **HTML5**: Popup interface.
- **CSS3**: Slider and visualizer styling.
- **JavaScript (Vanilla)**: Web Audio API integration.
- **Chrome Extension (Manifest V3)**: Uses offscreen documents for audio processing.

### 📂 Folder Structure
```
Volume-Master-Ultimate/
├── icon/             # Icons
├── html/             # UI files
│   └── popup.html
├── js/               # Logic
│   └── service-worker.js
└── manifest.json     # Config
```

### ⚙️ Installation (Developer Mode)
1.  Download this repository.
2.  Navigate to `chrome://extensions/`.
3.  Switch on **Developer mode**.
4.  Click **Load unpacked**.
5.  Select the `Volume-Master-Ultimate` folder.

### 🧠 How It Works
1.  **Tab Capture**: The extension uses the `chrome.tabCapture` API to intercept the audio stream of the active tab.
2.  **Audio Context**: It creates an `AudioContext` and passes the stream through a `GainNode`.
3.  **Amplification**: The gain value is adjusted by the user slider (1.0 = 100%, 6.0 = 600%).
4.  **Output**: The processed audio is connected back to the destination (your speakers).

### 🔐 Permissions Explained
- **`activeTab`**: To control the audio of the current tab.
- **`tabCapture`**: Essential to capture and manipulate the audio stream.
- **`offscreen`**: Required in Manifest V3 to manipulate DOM-based audio APIs in the background.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Volume Controller](https://via.placeholder.com/600x400?text=Volume+Controller)

### 🔒 Privacy Policy
- **No Recording**: Audio is processed in real-time and never recorded.
- **Local Only**: No audio data leaves your browser.

### 📄 License
This project is licensed under the **MIT License**.
