# 🚀 Website Performance Estimator

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Website Performance Estimator** is a lightweight utility that gives you a quick snapshot of a webpage's performance. It analyzes the page load time and resource weight to give you immediate feedback on "speed" and "bloat".

Unlike heavy audits like Lighthouse, this tool is designed for instant, rough estimates to spot heavy pages at a glance.

### 🚀 Features
- **Load Time Analysis**: Calculates how long the page took to load (using Navigation Timing API).
- **Resource Weight**: Estimates the total size of resources on the page.
- **Instant Feedback**: Simple "Good", "Fair", or "Poor" rating.
- **Minimalist UI**: Clean and distraction-free popup.

### 🛠️ Tech Stack
- **HTML5**: UI structure.
- **CSS3**: Styles.
- **JavaScript (Vanilla)**: Performance API logic.
- **Chrome Extension (Manifest V3)**: Core framework.

### 📂 Folder Structure
```
website-performance-estimator/
├── manifest.json       # Config
├── popup.css           # Styles
├── popup.html          # UI
└── popup.js            # Logic
```

### ⚙️ Installation (Developer Mode)
1.  Clone this repo.
2.  Navigate to `chrome://extensions/`.
3.  Enable **Developer mode**.
4.  Button **Load unpacked**.
5.  Choose the `website-performance-estimator` directory.

### 🧠 How It Works
1.  **Timing API**: It uses `performance.timing` or `performance.getEntriesByType('navigation')` to calculate Load Time.
2.  **Resource API**: It iterates through `performance.getEntriesByType('resource')` to sum up the transfer sizes of images, scripts, and CSS.
3.  **Scoring**: It compares these values against thresholds (e.g., < 1s Load is Good) to display a status.

### 🔐 Permissions Explained
- **`activeTab`**: To query performance metrics of the current tab.
- **`scripting`**: To execute the performance analysis script in the context of the page.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Performance Score](https://via.placeholder.com/600x400?text=Performance+Score)

### 🔒 Privacy Policy
- **No External Requests**: All analysis is computed locally using browser APIs.
- **No Tracking**: We do not store or share your performance data.

### 📄 License
This project is licensed under the **MIT License**.
