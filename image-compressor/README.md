# 📉 Quick Image Compressor

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Quick Image Compressor** reduces image file size significantly without visible quality loss. Optimize your JPEGs and PNGs for faster web loading or email attachments. It processes everything locally in your browser.

### 🚀 Features
- **Compression**: Reduce file size by up to 80%.
- **Preview**: Compare Original vs. Compressed.
- **Format Support**: JPG, PNG, WEBP.
- **Download**: Instant save functionality.

### 🛠️ Tech Stack
- **HTML5**: UI.
- **JavaScript**: Canvas `toDataURL` with quality parameter.
- **Chrome Extension (Manifest V3)**: Popup.

### 📂 Folder Structure
```
image-compressor/
├── manifest.json      # Config
├── popup.html         # UI
└── popup.js           # Compression logic
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `image-compressor`.

### 🧠 How It Works
1.  **Load**: Image is loaded into a `<canvas>`.
2.  **Compress**: `canvas.toBlob(callback, 'image/jpeg', quality)` is used to export the image with lower quality settings.
3.  **Display**: Shows the new size and blob.

### 🔐 Permissions Explained
- **None**: Local processing.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Compression Tool](https://via.placeholder.com/600x400?text=Compression+Tool)

### 🔒 Privacy Policy
- **Offline**: No images are uploaded.

### 📄 License
This project is licensed under the **MIT License**.
