📄 Text to PDF Generator

Text to PDF Generator is a clean, lightweight Chrome extension that allows you to convert text into a downloadable PDF instantly, with an additional option to download the same content as a .txt file.

It runs entirely in the browser, with no backend, no APIs, and no data tracking.

🚀 Features

✍️ Type or paste text directly in the popup

📄 Export content as a PDF file

📝 Download content as a .txt file

🧮 Live character & word counter

🏷️ Custom filename support

⚡ Fast, offline, and privacy-safe

🎨 Clean Material-inspired UI

🧠 How It Works

User enters text and an optional filename

Extension enables export buttons once text is present

PDF generation is handled using jsPDF (client-side)

File is downloaded instantly — no server involved

🛠️ Tech Stack

Chrome Extension (Manifest V3)

JavaScript (Vanilla)

HTML5 / CSS3

jsPDF (for PDF generation)

Browser Blob API (for .txt download)

📦 Installation (Local Development)

Clone the repository:

git clone https://github.com/your-username/text-to-pdf-generator.git


Open Chrome and go to:

chrome://extensions


Enable Developer mode (top right)

Click Load unpacked

Select the project folder

✅ The extension will appear in your Chrome toolbar.

📁 Project Structure
Text-to-PDF-Generator/
│
├── manifest.json
├── popup.html
├── popup.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png

🔐 Permissions Explained

This extension requires no special permissions.

Permission	Usage
none	All processing happens locally

✔️ This makes the extension Chrome Web Store–friendly and privacy-safe.

🎨 UI Highlights

Responsive 350px popup

Material-style buttons and inputs

Disabled actions until text is entered

Smooth focus and hover states

Clear feedback via counters

🧩 Supported Formats

📄 PDF (A4, auto line wrapping)

📝 Plain Text (.txt)

🌟 Planned Enhancements (Optional)

📑 Page size selector (A4 / Letter)

🔤 Font size & font family options

🌙 Dark mode

📋 Paste selected text from page

📄 Multi-page PDF support

🧩 Chrome Web Store

Manifest V3 compliant

No tracking

No network access

Ready for Chrome Web Store submission

📄 License

MIT License
Free to use, modify, and distribute.