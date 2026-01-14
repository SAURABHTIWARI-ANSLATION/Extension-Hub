# 🔧 JSON Formatter

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**JSON Formatter** is a sleek, developer-focused utility. It takes messy JSON strings and transforms them into a clean, hierarchical tree view. Unlike other complicated tools, this one focuses on speed and readability.

### 🚀 Features
- **Fast Parsing**: Handles large JSON files efficiently.
- **Clean UI**: Minimalist design with syntax highlighting.
- **Validation**: instantly alerts you to syntax errors in your JSON.
- **Collapsible Nodes**: Navigate deep nested structures easily.

### 🛠️ Tech Stack
- **HTML5**: UI.
- **CSS3**: Styles.
- **JavaScript**: Parsing logic.
- **Chrome Extension (Manifest V3)**: Popup.

### 📂 Folder Structure
```
JSONFileFormatter/
├── manifest.json      # Config
├── popup.html         # Viewer
├── popup.js           # Logic
└── style.css          # Styles
```

### ⚙️ Installation (Developer Mode)
1.  Download source.
2.  Open `chrome://extensions`.
3.  Turn on **Developer mode**.
4.  Load unpacked -> `JSONFileFormatter`.

### 🧠 How It Works
1.  **Input**: User pastes JSON.
2.  **Process**: `JSON.parse()` validates structure.
3.  **Render**: Recursive function builds a collapsible HTML list structure representing the object.

### 🔐 Permissions Explained
- **None**: Runs locally.

### 📸 Screenshots
*(Placeholder for screenshots)*
![JSON Tree](https://via.placeholder.com/600x400?text=JSON+Tree)

### 🔒 Privacy Policy
- **Local**: Data is processed in-memory.

### 📄 License
This project is licensed under the **MIT License**.
