popup

📄 PDF Previewer (Chrome Extension)

A fast and simple Chrome Extension that allows you to instantly preview PDF files directly inside the popup using Chrome’s built-in PDF viewer.
No uploads, no servers — everything works locally and offline.

✨ Features
📥 Open PDF Instantly

Select any PDF file from your device → preview loads immediately.
Uses Chrome's native embed viewer for smooth display.


popup

⚡ Completely Offline

Your PDF files never leave your computer.
No backend, no API, no internet required.

🎨 Beautiful Blue UI

A polished, modern design with:

Gradient blue background

Stylish buttons

Smooth shadows

Rounded preview frame


popup

📄 Large Preview Window

The viewer displays PDFs inside a 400px high preview box, perfect for reading inside popup.


popup

📂 Project Structure
PDF-Previewer/
│── manifest.json
│── popup.html
│── popup.css
│── popup.js
│── icons/
│     ├── icon16.png
│     ├── icon48.png
│     ├── icon128.png

🧠 How It Works
1️⃣ Select a File

User clicks Select PDF File → hidden input opens the file picker.


popup

2️⃣ File Validation

Only PDF files are accepted:

if (!file || file.type !== "application/pdf") return;


popup

3️⃣ Generate Preview URL

Uses URL.createObjectURL() to generate a secure local blob for display.


popup

4️⃣ Embed Viewer

The preview is shown inside an <embed> element.


popup

📜 Manifest (MV3)

Your extension uses a popup-only configuration.


manifest

{
  "manifest_version": 3,
  "name": "PDF Previewer",
  "version": "1.0",
  "description": "Preview PDF files instantly using Chrome's built-in PDF viewer.",
  "action": {
    "default_popup": "popup.html"
  }
}

🔧 Technologies Used

HTML5

CSS3

JavaScript

Chrome Extension Manifest V3

Chrome Native PDF Viewer (embed)

🚀 Installation (Developer Mode)

Go to chrome://extensions/

Enable Developer mode

Click Load Unpacked

Select the extension folder

The extension will now appear in your Chrome toolbar.

🌟 Future Improvements

Drag-and-drop PDF support

Thumbnail preview mode

Dark/light theme toggle

Zoom controls

PDF page navigation

📄 License

MIT — free to use and modify.