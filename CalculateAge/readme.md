# 🎂 Age Calculator

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Age Calculator** is a simple utility to find out your exact age. Enter your date of birth, and it tells you your age in years, months, days, and even computes the days remaining until your next birthday.

### 🚀 Features
- **Precise Calculation**: Years, months, and days breakdown.
- **Birthday Countdown**: See how many days left to party.
- **Simple Interface**: Date picker and a calculate button.

### 🛠️ Tech Stack
- **HTML5**: Date input.
- **CSS3**: Styles.
- **JavaScript**: Date math logic.
- **Chrome Extension (Manifest V3)**: Popup action.

### 📂 Folder Structure
```
CalculateAge/
├── manifest.json      # Config
├── index.html         # UI
├── script.js          # Logic
└── style.css          # Styles
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `CalculateAge`.

### 🧠 How It Works
1.  **Input**: User selects DOB via `<input type="date">`.
2.  **Logic**: JS gets current date (`new Date()`) and subtracts DOB. It adjusts for leap years and month lengths.
3.  **Result**: Displays the age components.

### 🔐 Permissions Explained
- **None**: Local calculation only.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Age Result](https://via.placeholder.com/600x400?text=Age+Result)

### 🔒 Privacy Policy
- **Offline**: Your birthdate is not stored or shared.

### 📄 License
This project is licensed under the **MIT License**.
