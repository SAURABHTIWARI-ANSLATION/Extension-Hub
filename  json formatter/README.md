# 💻 JSON Beautifyinator

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**JSON Beautifyinator** is a utility for developers dealing with raw JSON data. Paste your minified or messy JSON, and instantly beautify it with proper indentation and syntax highlighting. It also validates your JSON to catch errors.

### 🚀 Features
- **Beautify**: Formats valid JSON with 2-space or 4-space indentation.
- **Minify**: Compresses JSON into a single line for production use.
- **Validate**: Checks if the JSON is valid and reports syntax errors.
- **Copy**: One-click copy for the result.

### 🛠️ Tech Stack
- **HTML5**: Editor layout.
- **CSS3**: Syntax colors.
- **JavaScript**: `JSON.parse` and `JSON.stringify`.
- **Chrome Extension (Manifest V3)**: Popup action.

### 📂 Folder Structure
```
json formatter/
├── icons/             # Icons
├── manifest.json      # Config
├── popup.html         # UI
├── popup.js           # Logic
└── style.css          # Styling
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Open `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> ` json formatter` (Note: select the folder).

### 🧠 How It Works
1.  **Parse**: Attempts to run `JSON.parse()` on input.
2.  **Format**: If successful, runs `JSON.stringify(obj, null, 2)` to format.
3.  **Error Handling**: Catches parsing errors and displays the error message to the user.

### 🔐 Permissions Explained
- **None**: Operates locally on pasted text.

### 📸 Screenshots
*(Placeholder for screenshots)*
![JSON Editor](https://via.placeholder.com/600x400?text=JSON+Editor)

### 🔒 Privacy Policy
- **Client-Side**: Input data is processed in-memory and never sent to a server.

### 📄 License
This project is licensed under the **MIT License**.
