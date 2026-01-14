# 🧮 CSS Specificity Calculator

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**CSS Specificity Calculator** helps developers understand the "cascade" in Cascading Style Sheets. Enter a CSS selector, and get a visual breakdown of its specificity (IDs, Classes, Elements). Stop guessing why your styles aren't applying.

### 🚀 Features
- **Visual Breakdown**: Specificity Graph or "0-0-0" score.
- **Comparison**: Compare two selectors to see which one wins.
- **History**: Keeps track of recent calculations.
- **Educational**: Learn how specificity works as you use it.

### 🛠️ Tech Stack
- **HTML5**: Input UI.
- **CSS3**: Visualization.
- **JavaScript**: Parsing logic (Regex or Parser).
- **Chrome Extension (Manifest V3)**: Storage.

### 📂 Folder Structure
```
css-specificity-calculator/
├── icons/             # Icons
├── manifest.json      # Config
├── popup.html         # UI
├── popup.js           # Calculation logic
└── style.css          # Styles
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `css-specificity-calculator`.

### 🧠 How It Works
1.  **Parse**: Analyzes string for `#id`, `.class`, `[attr]`, and `tag`.
2.  **Score**: Assigns values (ID=100, Class=10, Tag=1).
3.  **Display**: Updates the UI with the calculated tuple (A, B, C).

### 🔐 Permissions Explained
- **`storage`**: To save your calculation history.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Specificity Score](https://via.placeholder.com/600x400?text=Specificity+Score)

### 🔒 Privacy Policy
- **Local**: Selectors are analyzed locally.

### 📄 License
This project is licensed under the **MIT License**.
