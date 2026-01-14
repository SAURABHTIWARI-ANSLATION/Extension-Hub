# 📏 Quick Unit Converter

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Quick Unit Converter** is a handy reference tool for everyday conversions. No more Googling "cm to inches" or "kg to lbs". Access a fast, offline converter directly from your browser toolbar.

### 🚀 Features
- **Multi-Category**: Length, Weight, Temperature, Area, Speed.
- **Instant Calculation**: Results appear as you type.
- **Swap**: Quickly reverse the conversion direction.
- **Clean Design**: Focused and easy to use.

### 🛠️ Tech Stack
- **HTML5**: UI.
- **JavaScript**: Math logic.
- **Chrome Extension (Manifest V3)**: Popup.

### 📂 Folder Structure
```
unit-converter/
├── manifest.json      # Config
├── popup.html         # UI
├── script.js          # Logic
└── style.css          # Styling
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Open `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `unit-converter`.

### 🧠 How It Works
1.  **Select**: User chooses category (e.g., Length).
2.  **Input**: Enters value (e.g., 100).
3.  **Convert**: Logic applies factor (e.g., `value * 0.3937` for cm to in).

### 🔐 Permissions Explained
- **None**: Local calculation.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Converter UI](https://via.placeholder.com/600x400?text=Converter+UI)

### 🔒 Privacy Policy
- **Offline**: No data tracking.

### 📄 License
This project is licensed under the **MIT License**.
