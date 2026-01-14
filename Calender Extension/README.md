# 📅 Dynamic Calendar

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Dynamic Calendar** puts a fully functional calendar in your browser toolbar. Check dates, days, and plan your month without leaving your current tab. It updates dynamically to show the current day.

### 🚀 Features
- **Month View**: Navigate previous and next months.
- **Today Highlight**: Automatically highlights the current date.
- **Dynamic Icon**: (Optional) The extension icon shows the current date.
- **Minimalist**: Clean grid layout.

### 🛠️ Tech Stack
- **HTML5**: Grid structure.
- **CSS3**: Calendar styling.
- **JavaScript**: Date generation and navigation logic.
- **Chrome Extension (Manifest V3)**: Popup.

### 📂 Folder Structure
```
Calender Extension/
├── manifest.json      # Config
├── index.html         # Calendar Grid
├── script.js          # Logic
└── style.css          # Styles
```

### ⚙️ Installation (Developer Mode)
1.  Download source.
2.  Open `chrome://extensions`.
3.  Turn on **Developer mode**.
4.  Load unpacked -> `Calender Extension`.

### 🧠 How It Works
1.  **Render**: JS looping through days of the month to build a grid.
2.  **Navigation**: Buttons increment/decrement the `currentMonth` variable and re-render the grid.

### 🔐 Permissions Explained
- **None**: Basic functionality only.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Calendar View](https://via.placeholder.com/600x400?text=Calendar+View)

### 🔒 Privacy Policy
- **No Data**: We don't track your schedule.

### 📄 License
This project is licensed under the **MIT License**.
