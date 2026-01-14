# 📱 QR Code Generator

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**QR Code Generator** is a simple yet powerful Chrome extension that allows you to generate a QR code for the current page URL or any custom text instantly. Perfect for sharing links from your desktop to your mobile device without sending emails or messages to yourself.

### 🚀 Features
- **Instant Generation**: Automatically generates a QR code for the current tab's URL upon opening.
- **Custom Input**: Type any text or URL to generate a custom QR code.
- **Offline Support**: Generates QR codes locally without needing an internet connection.
- **Lightweight**: Minimalist design with zero bloat.

### 🛠️ Tech Stack
- **HTML5**: Popup structure.
- **CSS3**: Styles.
- **JavaScript (Vanilla)**: QR generation logic.
- **Chrome Extension (Manifest V2)**: (Note: Legacy manifest, pending upgrade to V3).

### 📂 Folder Structure
```
QR-Generator/
├── manifest.json      # Extension configuration
├── popup.html         # User interface
├── popup.js           # Logic
└── qr.png             # Icon
```

### ⚙️ Installation (Developer Mode)
1.  **Clone** the repository.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode**.
4.  Click **Load unpacked**.
5.  Select the `QR-Generator` folder.
6.  The extension is ready to use!

### 🧠 How It Works
1.  **Input**: Takes the current tab URL or user input.
2.  **Encoding**: Uses a JavaScript library (or API) to encode the text into a QR matrix.
3.  **Rendering**: Renders the matrix as an image or canvas in the popup.

### 🔐 Permissions Explained
- **`activeTab`** (Implicit): To get the URL of the current tab for default generation.

### 📸 Screenshots
*(Placeholder for screenshots)*
![QR Popup](https://via.placeholder.com/600x400?text=QR+Popup)

### 🔒 Privacy Policy
- **No Tracking**: We do not track what you generate.
- **Local Only**: All data stays on your device.

### 📄 License
This project is licensed under the **MIT License**.
