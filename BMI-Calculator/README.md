# ⚖️ BMI Calculator

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**BMI Calculator** is a clean, modern, and easy-to-use tool to track your Body Mass Index (BMI). Enter your weight and height, and instantly get your BMI score and category (Userweight, Normal, Overweight, etc.). It's a great little utility for health-conscious users.

### 🚀 Features
- **Instant Calculation**: Enter standard or metric units (depending on settings).
- **Health Category**: Tells you if you are in a healthy range.
- **Modern UI**: Clean design with clear typography.
- **Privacy First**: No data is ever stored remotely.

### 🛠️ Tech Stack
- **HTML5**: Input form.
- **CSS3**: Styles.
- **JavaScript (Vanilla)**: BMI Formula logic.
- **Chrome Extension (Manifest V3)**: Extension platform.

### 📂 Folder Structure
```
BMI-Calculator/
├── manifest.json      # Config
├── popup.html         # UI
├── script.js          # Logic
└── style.css          # Styling
```

### ⚙️ Installation (Developer Mode)
1.  Clone the repository.
2.  Open `chrome://extensions/`.
3.  Enable **Developer mode**.
4.  Select **Load unpacked**.
5.  Choose the `BMI-Calculator` folder.

### 🧠 How It Works
1.  **Input**: User enters Height (cm/in) and Weight (kg/lbs).
2.  **Formula**: Calculates `Weight / (Height * Height)` (adjusted for units).
3.  **Display**: Updates the DOM with the result and color-coded category.

### 🔐 Permissions Explained
- **None**: Does not require any special permissions to run.

### 📸 Screenshots
*(Placeholder for screenshots)*
![BMI Calculator](https://via.placeholder.com/600x400?text=BMI+Calculator)

### 🔒 Privacy Policy
- **Zero Data Collection**: Your health data is calculated temporarily and never stored.

### 📄 License
This project is licensed under the **MIT License**.
