# 🎨 Pixel Perfect Color Picker

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Pixel Perfect Color Picker** allows designers and developers to grab the exact color code of any pixel on their screen. Whether you need a specific shade of blue from an image or a button's background color, get the Hex, RGB, or HSL code instantly.

### 🚀 Features
- **Eyedropper Tool**: Pick colors from anywhere in the browser window.
- **Format Conversion**: Auto-converts to HEX, RGB, and HSL.
- **Copy to Clipboard**: One-click copying.
- **Recent Colors**: Remembers your recently picked colors.

### 🛠️ Tech Stack
- **HTML5**: Interface.
- **CSS3**: Styling.
- **JavaScript**: EyeDropper API integration.
- **Chrome Extension (Manifest V3)**: Extension platform.

### 📂 Folder Structure
```
color-picker-extension/
├── icons/             # App icons
├── popup.html         # Main UI
├── popup.js           # Picking logic
└── manifest.json      # Config
```

### ⚙️ Installation (Developer Mode)
1.  Clone this repository.
2.  Navigate to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Select **Load unpacked**.
5.  Choose `color-picker-extension`.

### 🧠 How It Works
1.  **API**: Uses the modern `EyeDropper` API built into Chromium browsers.
2.  **Activation**: User clicks "Pick Color", which creates a magnifying lens cursor.
3.  **Selection**: Clicking a pixel returns the color data.
4.  **Display**: The extension parses the color and displays it in multiple formats.

### 🔐 Permissions Explained
- **`storage`**: To save your history of picked colors.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Color Picker](https://via.placeholder.com/600x400?text=Color+Picker)

### 🔒 Privacy Policy
- **No Tracking**: We do not track what colors you pick or sites you visit.
- **Local History**: Color history is stored locally.

### 📄 License
This project is licensed under the **MIT License**.
