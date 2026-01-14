# 🎥 Simple Screen Recorder

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Simple Screen Recorder** allows you to capture your screen activity with zero hassle. Record your entire desktop, a specific application window, or just a Chrome tab. Ideal for creating tutorials, reporting bugs, or saving video calls.

### 🚀 Features
- **Flexible Capture**: Record Screen, Window, or Tab.
- **Audio Support**: Record system audio or microphone.
- **Instant Download**: Saves video as WebM format immediately after stopping.
- **No Watermark**: Clean, professional recordings.

### 🛠️ Tech Stack
- **HTML5**: Control panel.
- **JavaScript**: `getDisplayMedia` API and `MediaRecorder` API.
- **Chrome Extension (Manifest V3)**: ActiveTab.

### 📂 Folder Structure
```
screen-recorder/
├── manifest.json      # Config
├── popup.html         # Controls
├── popup.js           # Recording logic
└── style.css          # Styles
```

### ⚙️ Installation (Developer Mode)
1.  Download source.
2.  Open `chrome://extensions`.
3.  Turn on **Developer mode**.
4.  Load unpacked -> `screen-recorder`.

### 🧠 How It Works
1.  **Stream**: Calls `navigator.mediaDevices.getDisplayMedia()` to prompt user for screen selection.
2.  **Record**: output stream is fed into a `MediaRecorder` instance.
3.  **Changes**: Chunks of data are pushed to an array.
4.  **Save**: On stop, chunks are assembled into a `Blob` and downloaded.

### 🔐 Permissions Explained
- **`activeTab`**: To identify the source tab if "Current Tab" mode is selected.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Recorder Controls](https://via.placeholder.com/600x400?text=Recorder+Controls)

### 🔒 Privacy Policy
- **Local Processing**: Video encoding happens in your browser.
- **No Uploads**: Recordings are saved locally to your disk.

### 📄 License
This project is licensed under the **MIT License**.
