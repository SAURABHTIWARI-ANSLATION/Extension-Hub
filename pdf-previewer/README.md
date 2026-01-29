# 📄 PDF Previewer


### 🧩 Description
**PDF Previewer** streamlines your document workflow. Instead of downloading PDFs to view them, this extension opens them in a lightweight, built-in viewer directly within your browser. Perfect for quick checks of invoices, papers, or manuals.

### 🚀 Features
- **Instant View**: Opens local or remote PDFs immediately.
- **No Download Required**: View online PDFs without cluttering your Downloads folder.
- **Zoom/Rotate**: Standard PDF manipulation controls.
- **Dark Mode**: Compatiable with dark themes (if supported).

### 🛠️ Tech Stack
- **HTML5**: Embed container.
- **JavaScript**: Handling blob URLs.
- **Chrome Extension (Manifest V3)**: Popup action.

### 📂 Folder Structure
```
pdf-previewer-final/
├── manifest.json      # Config
├── popup.html         # Viewer container
├── popup.js           # Logic
└── style.css          # Styles
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `pdf-previewer-final`.

### 🧠 How It Works
1.  **Input**: User selects a file or provides a URL.
2.  **Embedding**: Uses `<embed>` or `<iframe>` with the PDF MIME type to trigger Chrome's native PDF viewing engine inside the popup or a new tab.

### 🔐 Permissions Explained
- **None**: Uses standard browser capabilities.

### 📸 Screenshots
*(Placeholder for screenshots)*
![PDF Viewer](https://via.placeholder.com/600x400?text=PDF+Viewer)

### 🔒 Privacy Policy
- **Local**: Your documents stay on your machine.

### 📄 License
This project is licensed under the **MIT License**.
