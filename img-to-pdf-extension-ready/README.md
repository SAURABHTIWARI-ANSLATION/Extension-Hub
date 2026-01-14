# 🖼️ Image to PDF Converter

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Image to PDF Converter** turns a collection of images into a single PDF document. Combine multiple screenshots, photos, or scans into a shareable PDF file in seconds.

### 🚀 Features
- **Batch Upload**: Select multiple images at once.
- **Ordering**: Reorder images before conversion.
- **Settings**: Adjust page size (A4, Letter) and orientation.
- **Instant Create**: Generates PDF using jsPDF or similar library.

### 🛠️ Tech Stack
- **HTML5**: File input.
- **JavaScript**: PDF generation (jspdf).
- **Chrome Extension (Manifest V3)**: Popup.

### 📂 Folder Structure
```
img-to-pdf-extension-ready/
├── manifest.json      # Config
├── popup.html         # UI
└── popup.js           # Conversion Logic
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `img-to-pdf-extension-ready`.

### 🧠 How It Works
1.  **Input**: Reads image files as Data URLs (base64).
2.  **PDF**: Creates a new PDF instance.
3.  **Loop**: Iterates through images, adding a new page for each and drawing the image.
4.  **Save**: Outputs the PDF blob.

### 🔐 Permissions Explained
- **`storage`**: To briefly hold preferences.

### 📸 Screenshots
*(Placeholder for screenshots)*
![PDF Maker](https://via.placeholder.com/600x400?text=PDF+Maker)

### 🔒 Privacy Policy
- **Offline**: Conversion happens in the client.

### 📄 License
This project is licensed under the **MIT License**.
