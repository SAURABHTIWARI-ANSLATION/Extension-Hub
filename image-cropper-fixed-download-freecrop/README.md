# ✂️ Image Cropper

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Image Cropper** is a focused tool to trim your images. Upload an image, select the area you want to keep with a draggable overlay, and crop it instantly. Useful for profile pictures, thumbnails, or removing unwanted borders.

### 🚀 Features
- **Free Crop**: No aspect ratio restrictions.
- **Drag & Resize**: Intuitive selection box.
- **Zoom**: Zoom in for precision cropping.
- **Download**: Save cropped result as PNG.

### 🛠️ Tech Stack
- **HTML5**: Canvas.
- **JavaScript**: Cropping library (e.g., Cropper.js) or custom Canvas slicing.
- **Chrome Extension (Manifest V3)**: Popup.

### 📂 Folder Structure
```
image-cropper-fixed-download-freecrop/
├── manifest.json      # Config
├── popup.html         # UI
└── popup.js           # Logic
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `image-cropper-fixed-download-freecrop`.

### 🧠 How It Works
1.  **Overlay**: Draws a crop box over the image.
2.  **Coordinates**: Calculates the X, Y, Width, and Height of the box relative to the image.
3.  **Slice**: Uses `context.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)` to extract the region.

### 🔐 Permissions Explained
- **None**: Local canvas operations.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Crop Interface](https://via.placeholder.com/600x400?text=Crop+Interface)

### 🔒 Privacy Policy
- **Local**: Your photos stay on your device.

### 📄 License
This project is licensed under the **MIT License**.
