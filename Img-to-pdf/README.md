🖼️➡️📄 Image to PDF Converter (Chrome Extension)

A lightweight, offline, and privacy-safe Chrome extension that converts selected images into a PDF file instantly — without using any external libraries.

🚀 Features

100% Offline – No servers, no API calls. Everything runs in your browser.

Privacy Safe – Your images never leave your device.

Library-Free PDF Generation – Pure JavaScript PDF builder inside popup.js.

Modern UI – Clean gradient theme with card-style upload button.
(See styling in popup.css 

popup

)

Multi-Image Support – Select multiple images and merge them into one PDF.

A4 Auto-Scaling – Each image is automatically scaled to fit an A4 page.

One-Click Download – Generates and downloads the PDF instantly.

📦 Project Structure
Image-to-PDF-Extension/
│
├── manifest.json        # Chrome extension manifest (v3)
├── popup.html           # Extension UI layout
├── popup.css            # UI styling
└── popup.js             # Full logic: image processing + custom PDF generator

📄 File Details
manifest.json

Defines metadata and links popup.html as the extension UI.


manifest

popup.html

Builds the UI: upload button, file counter, action button, and status messages.


popup

popup.css

Handles the beautiful gradient UI, button styles, card look, and layout.


popup

popup.js

Contains the full working logic:

Reads images

Converts them to JPEG via <canvas>

Builds a valid PDF manually (no libraries!)

Downloads the final PDF


popup

🛠️ How It Works
1. Image Selection

Using <input type="file" multiple> the user selects images.
Popup updates file count accordingly.

2. Convert images to JPEG data

Each image is rendered on a <canvas> → converted to Base64 JPEG.

3. Build PDF manually

The PDF is constructed using:

Custom XObject image embedding

A4 page size (595×842 pt)

Manual xref, trailer, and header building

All in pure JavaScript.

4. Download the PDF

A Blob is created and force-downloaded as images-to-pdf.pdf.

📥 Installation (Manual)

Download this project folder.

Go to chrome://extensions/

Enable Developer Mode.

Click Load Unpacked.

Select the project directory.

Your extension is now active!

▶️ Usage

Click the extension icon.

Click Upload Images.

Select one or multiple images.

Click Convert to PDF.

Your ready PDF will download instantly.

📚 Tech Used

JavaScript (Vanilla)

HTML5 Canvas

Chrome Extension Manifest V3

Pure PDF Construction (no libraries)

🧩 Compatibility

Works on Chrome & all Chromium-based browsers (Brave, Edge, Opera).

Works offline.

📜 License

Free to use, modify, and improve.