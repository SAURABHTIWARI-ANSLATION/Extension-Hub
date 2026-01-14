# 🧊 Violet Glow Cube Game

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Violet Glow Cube Game** is a fun, lightweight 3D puzzle game that lives in your browser popup. Rotate the cube, solve the puzzle, and enjoy the calming violet aesthetic. It's the perfect way to pass a few minutes during a break.

### 🚀 Features
- **3D Graphics**: Smooth CSS3D or WebGL rendering.
- **Interactive**: Drag to rotate the cube or rows.
- **Sleek Theme**: Custom "Violet Glow" visual style.
- **Instant Play**: Opens instantly from the toolbar.

### 🛠️ Tech Stack
- **HTML5**: Canvas/Container.
- **CSS3**: 3D transforms and animations.
- **JavaScript**: Game logic and touch controls.
- **Chrome Extension (Manifest V3)**: Popup container.

### 📂 Folder Structure
```
CubeGame/
├── index.html         # Game canvas
├── style.css          # 3D styles
├── game.js            # Logic (implied)
└── manifest.json      # Config
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `CubeGame`.

### 🧠 How It Works
1.  **Rendering**: Uses CSS3 `transform-style: preserve-3d` to create a cube from 6 div faces.
2.  **Interaction**: Listens for mouse events (`mousedown`, `mousemove`) to calculate rotation matrix.
3.  **Logic**: Tracks the state of each face color to determine win condition.

### 🔐 Permissions Explained
- **None**: Simple local game.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Gameplay](https://via.placeholder.com/600x400?text=Gameplay)

### 🔒 Privacy Policy
- **Offline**: No data leaves your machine.
- **Safe**: Safe for all ages.

### 📄 License
This project is licensed under the **MIT License**.
