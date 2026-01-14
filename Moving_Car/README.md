# 🚗 Moving Car Animation

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Moving Car** is a delightful animation extension. Watch a car drive across your extension popup with smooth CSS animations. It serves as a great example of using CSS keyframes and animation properties within a browser extension context.

### 🚀 Features
- **Smooth Animation**: High-performance CSS-based movement.
- **Looping**: Endless driving action.
- **Custom Graphics**: Unique car and background assets.

### 🛠️ Tech Stack
- **HTML5**: Scene container.
- **CSS3**: `@keyframes` for movement and wheel rotation.
- **Chrome Extension (Manifest V2)**: Legacy structure.

### 📂 Folder Structure
```
Moving_Car/
├── manifest.json      # Config
├── index.html         # Animation Stage
├── style.css          # Animation Rules
└── mycar.png          # Assets
```

### ⚙️ Installation (Developer Mode)
1.  Download source.
2.  Open `chrome://extensions`.
3.  Turn on **Developer mode**.
4.  Load unpacked -> `Moving_Car`.

### 🧠 How It Works
1.  **Scene**: A `div` representing the road and another for the car.
2.  **Animation**: CSS `transform: translateX()` moves the background or car to simulate speed.

### 🔐 Permissions Explained
- **`activeTab`**: Standard permission.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Car Animation](https://via.placeholder.com/600x400?text=Car+Animation)

### 🔒 Privacy Policy
- **None**: It's just an animation. No data involved.

### 📄 License
This project is licensed under the **MIT License**.
