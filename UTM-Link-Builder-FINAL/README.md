# 🔗 UTM Link Builder

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**UTM Link Builder** is essential for digital marketers. Create trackable URLs for your campaigns without messy spreadsheets. Add Source, Medium, Campaign, and other parameters to your links instantly.

### 🚀 Features
- **Presets**: Save frequent values (e.g., "newsletter", "social").
- **Templates**: Create full parameter templates.
- **Shorten**: (Optional) Integration with bit.ly (if configured).
- **History**: Access previously built links.
- **Dark Mode**: Easy on the eyes.
- **CSV Export**: Export your link history.

### 🛠️ Tech Stack
- **HTML5**: Form builder.
- **JavaScript**: URL construction.
- **Chrome Extension (Manifest V3)**: Storage.

### 📂 Folder Structure
```
UTM-Link-Builder-FINAL/
├── manifest.json      # Config
├── popup.html         # Builder UI
├── popup.js           # Logic
└── style.css          # Styles
```

### ⚙️ Installation (Developer Mode)
1.  Download source.
2.  Go to `chrome://extensions`.
3.  Turn on **Developer mode**.
4.  Load unpacked -> `UTM-Link-Builder-FINAL`.

### 🧠 How It Works
1.  **Input**: User enters Base URL and params (utm_source, utm_medium, etc.).
2.  **Build**: Concatenates them into a query string: `url?utm_source=...`.
3.  **Validate**: Checks for URL validity.
4.  **Save**: Stores the generated link in history.

### 🔐 Permissions Explained
- **`clipboardWrite`**: To copy the final URL.
- **`tabs`**: To grab the current tab URL as the base URL.
- **`storage`**: To save your presets and history.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Builder Interface](https://via.placeholder.com/600x400?text=Builder+Interface)

### 🔒 Privacy Policy
- **Local History**: Your marketing data is stored locally.

### 📄 License
This project is licensed under the **MIT License**.