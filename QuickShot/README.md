# 📸 QuickShot - Advanced Screen Capture

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**QuickShot** is a professional-grade screen capture and annotation tool for Chrome. Designed for speed and precision, it allows you to capture exactly what you need—whether it's a specific button, the visible viewport, or (coming soon) the entire scrolling page—and edit it instantly.

### 🚀 Features
- **3 Capture Modes**:
    - **Visible Part**: Instant snapshot of what you see.
    - **Selected Area**: Drag-to-select specific region.
    - **Full Page**: (Beta) Captures the entire document.
    - **Light Theme**: Clean, modern interface designed for clarity.
- **Powerful Editor**:
    - **Annotation Tools**: Pen, Arrow, Rectangle, Text.
    - **Color Palette**: Choose from vibrant presets.
    - **Undo Support**: Mistakes happen; fix them with `Ctrl+Z`.
- **Shortcuts**: Power user friendly.
    - `Alt+Shift+1`: Visible
    - `Alt+Shift+2`: Full Page
    - `Alt+Shift+3`: Selection
- **Privacy First**: Everything stays local. Use the clipboard or download to disk.

### 🛠️ Tech Stack
- **Manifest V3**: Future-proof extension architecture.
- **HTML5 Canvas**: High-performance rendering for the editor.
- **Service Worker**: Efficient background processing.
- **Modern CSS**: Glassmorphism UI and responsive layout.

### 📂 Folder Structure
```
QuickShot/
├── manifest.json      # Config & Hotkeys
├── popup.html         # Control Center
├── popup.js           # Interactive UI Logic
├── background.js      # Capture Orchestrator
├── content.js         # Selection Overlay
├── editor.html        # Image Editor UI
├── editor.js          # Canvas Drawing Engine
└── style.css          # Global Styles
```

### ⚙️ Installation (Developer Mode)
1.  Clone this repository.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Toggle **Developer mode** (top right).
4.  Click **Load unpacked**.
5.  Select the `QuickShot` folder.

### 🧠 How It Works
1.  **Trigger**: User clicks the popup or hits a usage shortcut (e.g., `Alt+Shift+3`).
2.  **Capture**:
    - **Visible**: `background.js` calls `captureVisibleTab`.
    - **Selection**: `content.js` injects an overlay. User drags a box. `content.js` sends coordinates to `background.js`, which captures the tab and crops it to your selection.
3.  **Edit**: The captured image is sent to `editor.html` via `chrome.storage.local`.
4.  **Annotate**: The editor typically uses the HTML Canvas API to overlay drawing paths on top of the image.
5.  **Export**: The final canvas state is converted to a Blob/DataURL for download.

### 🔐 Permissions Explained
- **`activeTab`**: To capture screenshots of the current tab.
- **`scripting`**: To inject the selection overlay.
- **`storage`**: To pass image data between the background script and the editor.
- **`downloads`**: To save your creations.

### 📸 Screenshots
*(Placeholder)*
![Editor Interface](https://via.placeholder.com/600x400?text=QuickShot+Editor)

### 🔒 Privacy Policy
- **100% Local**: No images are uploaded to any server. Your screenshots never leave your device.

### 📄 License
This project is licensed under the **MIT License**.
