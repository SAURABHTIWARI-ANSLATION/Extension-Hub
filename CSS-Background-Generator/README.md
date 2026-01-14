# 🎨 Background Generator

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Background Generator** is a designated design tool for web developers. Create stunning CSS gradients, solid colors, and pattern backgrounds instantly. Experiment with colors and get the CSS code ready to copy-paste into your project.

### 🚀 Features
- **Gradient Builder**: Linear and Radial gradient support.
- **Color Palettes**: Pre-selected harmonious color combinations.
- **Live Preview**: See the background on the popup body.
- **CSS Output**: One-click copy for `background: linear-gradient(...)`.

### 🛠️ Tech Stack
- **HTML5**: Controls.
- **CSS3**: Gradient rendering.
- **JavaScript**: Color manipulation.
- **Chrome Extension (Manifest V3)**: Platform.

### 📂 Folder Structure
```
CSS-Background-Generator/
├── manifest.json      # Config
├── popup.html         # Generator UI
├── script.js          # Logic
└── style.css          # Styling
```

### ⚙️ Installation (Developer Mode)
1.  Download source.
2.  Go to `chrome://extensions`.
3.  Turn on **Developer mode**.
4.  Load unpacked -> `CSS-Background-Generator`.

### 🧠 How It Works
1.  **Inputs**: Color pickers for Start and End colors.
2.  **Logic**: JS listens for input changes and updates the `document.body.style.background`.
3.  **Output**: Generates the corresponding CSS string and displays it in a text area.

### 🔐 Permissions Explained
- **`storage`**: To save your favorite gradients (if feature implemented).
- **`activeTab`**: If it supports applying background to current page.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Generator UI](https://via.placeholder.com/600x400?text=Generator+UI)

### 🔒 Privacy Policy
- **Client-Side**: All generation happens in the browser.
- **No Data**: No designs are uploaded.

### 📄 License
This project is licensed under the **MIT License**.
