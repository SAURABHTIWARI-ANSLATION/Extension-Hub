# 🌡️ Fahrenheit Celsius Converter

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Fahrenheit Celsius Converter** is a simple yet essential tool for anyone working with international temperature data. Instantly convert values between Fahrenheit (°F) and Celsius (°C) without opening a new tab or searching Google.

### 🚀 Features
- **Bidirectional Conversion**: Type in either field to update the other.
- **Instant Results**: Real-time calculation as you type.
- **Decimal Precision**: Accurate to 2 decimal places.
- **Clean UI**: No-nonsense interface.

### 🛠️ Tech Stack
- **HTML5**: Input fields.
- **CSS3**: Layout.
- **JavaScript (Vanilla)**: Conversion formulas.
- **Chrome Extension (Manifest V3)**: Popup.

### 📂 Folder Structure
```
Fahrenheit_Celsius_Converter/
├── manifest.json      # Config
├── popup.html         # UI
├── script.js          # Logic
└── style.css          # Styling
```

### ⚙️ Installation (Developer Mode)
1.  Clone repository.
2.  Open `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `Fahrenheit_Celsius_Converter`.

### 🧠 How It Works
1.  **Formulas**:
    - `C = (F - 32) * 5/9`
    - `F = (C * 9/5) + 32`
2.  **Events**: Listens for `input` events on both fields to trigger the reverse calculation.

### 🔐 Permissions Explained
- **`activeTab`**: Generic permission, not strictly used for logic here.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Converter UI](https://via.placeholder.com/600x400?text=Converter+UI)

### 🔒 Privacy Policy
- **Local**: All math happens on your device.
- **Private**: No data collection.

### 📄 License
This project is licensed under the **MIT License**.
