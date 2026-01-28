# 💻 HTML Previewer Pro

### 🧩 Description
**HTML Previewer Pro** is a robust real-time playground for web developers. Write HTML, CSS, and JavaScript in separate tabs and instantly glimpse the result in a live preview pane. It's like having a mini CodePen directly in your browser popup.

### 🚀 Features
- **Live Preview**: See changes as you type (or on run).
- **Multi-Tab Editor**: Separate editors for HTML, CSS, and JS.
- **Offline Support**: Code anywhere, no internet required.
- **Export**: Save your creations as a `.html` file.
- **Syntax Highlighting**: Clean, readable code editor interface.

### 🛠️ Tech Stack
- **HTML5**: Editor layout.
- **CSS3**: Editor styling and output frame.
- **JavaScript (Vanilla)**: Code injection and preview logic.
- **Chrome Extension (Manifest V3)**: Extension platform.

### 📂 Folder Structure
```
html-previewer-extension-step9/
├── popup.html         # Main UI
├── popup.js           # Editor logic
└── style.css          # Styling
```

### ⚙️ Installation (Developer Mode)
1.  Clone repository.
2.  Go to `chrome://extensions`.
3.  Turn on **Developer mode**.
4.  Click **Load unpacked**.
5.  Select `html-previewer-extension-step9`.

### 🧠 How It Works
1.  **Input**: User types code into three `textarea` elements.
2.  **Assembly**: The extension combines the HTML, inserts the CSS into `<style>` tags, and the JS into `<script>` tags.
3.  **Rendering**: The combined blob is injected into an `<iframe>` within the popup, effectively sandboxing the preview while allowing full rendering.

### 🔐 Permissions Explained
- **None**: This tool runs locally within the popup context.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Code Editor](https://via.placeholder.com/600x400?text=Code+Editor)

### 🔒 Privacy Policy
- **Local Only**: Your code stays in your browser.
- **No Uploads**: We never see your code.

### 📄 License
This project is licensed under the **MIT License**.
