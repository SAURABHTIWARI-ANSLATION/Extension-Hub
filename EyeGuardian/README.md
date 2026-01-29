📄 Image to PDF Converter — Chrome Extension

Convert any image into a high-quality PDF instantly — offline, fast, and secure.

This Chrome extension allows users to upload images (JPG, PNG, JPEG, WEBP) and convert them to a PDF document directly inside the browser without sending any data to external servers.

🚀 Features

🖼️ Convert Images to PDF in one click

⚡ Fast & Offline — No internet required

🛡️ 100% Private — Your files never leave your device

🌗 Clean UI with Blue Gradient Theme

📁 Download-ready PDF output

🧩 Works on Chrome, Edge & Brave

📦 Project Structure
📁 Image-to-PDF-Extension
│── manifest.json
│── popup.html
│── popup.js
│── icon16.png
│── icon48.png
│── icon128.png
│── styles.css (optional)

🔧 Installation (Developer Mode)

Download or clone this repository.

Open Chrome → go to:
chrome://extensions/

Enable Developer mode (top-right corner)

Click Load unpacked

Select the project folder
→ Your extension will be installed.

🛠️ How It Works

Open the extension

Upload your image

The tool converts it to a PDF internally (offline)

Click Download PDF

Done!

🧿 Icons

Your extension uses a consistent blue theme:

icon16.png

icon48.png

icon128.png

(Background removed as requested)

🔐 Permissions
"permissions": []


This extension does NOT use any special or dangerous permissions.

📜 Manifest (V3)
{
  "manifest_version": 3,
  "name": "Image to PDF Converter",
  "description": "Convert images to PDF instantly. Offline, private, and fast.",
  "version": "1.3.0",
  "permissions": [],
  "action": {
    "default_popup": "popup.html"
  },
  "icons": {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  }
}

🧑‍💻 Technologies Used

HTML5

CSS3 (Blue Gradient Theme)

JavaScript

Chrome Extension API (Manifest V3)

📥 Download PDF Generation

PDF is generated using the browser's built-in canvas rendering — no external libraries required.

🤝 Contribution

Want to improve this project?
Pull requests are welcome!

📄 License

This project is licensed under MIT License — free for personal and commercial use.