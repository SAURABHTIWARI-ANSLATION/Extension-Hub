# ⌚ Floating Analog Watch

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Floating Analog Watch** adds a stylish, draggable analog clock to every webpage you visit. Never lose track of time while browsing in full-screen mode or reading long articles.

### 🚀 Features
- **Always Visible**: Floats on top of page content.
- **Draggable**: Move it anywhere on the screen.
- **Real-Time**: Accurate analog movement (Hour, Minute, Second hands).
- **Non-Intrusive**: Small footprint and transparent design.

### 🛠️ Tech Stack
- **HTML5**: Clock dial structure.
- **CSS3**: Hand animations and positioning.
- **JavaScript**: Time calculation and drag-and-drop logic.
- **Chrome Extension (Manifest V3)**: Content scripts.

### 📂 Folder Structure
```
analog-watch-extension/
├── content.js         # Injection & Drag logic
├── style.css          # Clock styling
├── popup.html         # Settings
└── manifest.json      # Config
```

### ⚙️ Installation (Developer Mode)
1.  Download source.
2.  Open `chrome://extensions`.
3.  Turn on **Developer mode**.
4.  Load unpacked -> `analog-watch-extension`.

### 🧠 How It Works
1.  **Injection**: On page load, `content.js` creates a DOM element (the clock) and appends it to `document.body`.
2.  **Animation**: JavaScript updates the rotation degrees of the hands every second based on `new Date()`.
3.  **Interaction**: Mouse events update the clock's `top` and `left` CSS properties to drag it.

### 🔐 Permissions Explained
- **`activeTab`**: To inject the clock into the current page.
- **`host_permissions`**: To ensure the clock appears on all websites.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Watch on Page](https://via.placeholder.com/600x400?text=Watch+on+Page)

### 🔒 Privacy Policy
- **No Tracking**: The clock does not read page content.
- **Local**: Time is read from your system clock.

### 📄 License
This project is licensed under the **MIT License**.
