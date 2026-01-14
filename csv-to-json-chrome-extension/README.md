# 🔄 CSV to JSON Converter

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**CSV to JSON Converter** empowers developers to transform data formats instantly. Upload a CSV file or paste CSV text, and get clean, valid JSON output. It handles headers, custom delimiters, and nested structures.

### 🚀 Features
- **Drag & Drop**: Upload .csv files easily.
- **Preview**: See the data before conversion.
- **Download**: Save the result as a `.json` file.
- **Options**: Configure separator (comma, semicolon, tab).

### 🛠️ Tech Stack
- **HTML5**: File API.
- **CSS3**: Layout.
- **JavaScript**: CSV parsing engine.
- **Chrome Extension (Manifest V3)**: Options page.

### 📂 Folder Structure
```
csv-to-json-chrome-extension/
├── popup.html         # Converter UI
├── popup.js           # Logic
├── options.html       # Settings
└── manifest.json      # Config
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `csv-to-json-chrome-extension`.

### 🧠 How It Works
1.  **Input**: Reads text or file stream.
2.  **Split**: Splits lines by newline `\n` and values by delimiter `,`.
3.  **Map**: Maps the first row as keys (headers) and subsequent rows as values to build Objects.
4.  **Stringify**: Converts the array of objects to JSON string.

### 🔐 Permissions Explained
- **None**: Local data transformation.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Conversion Result](https://via.placeholder.com/600x400?text=Conversion+Result)

### 🔒 Privacy Policy
- **Secure**: Data is processed in browser memory. No uploads.

### 📄 License
This project is licensed under the **MIT License**.
