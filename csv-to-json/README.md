🔵 CSV ⇄ JSON Converter (Chrome Extension)

A fast, offline, beautifully designed Chrome Extension that converts CSV ↔ JSON with drag-and-drop support, progress indicator, and optional Dark Mode based on the BMI-style blue gradient theme.

Works entirely offline, uses a Web Worker for heavy processing, and never uploads your files anywhere.

🚀 Features

🔄 Convert CSV to JSON and JSON to CSV

⚡ Super-fast processing using worker.js (Web Worker)

📁 Drag & drop file support

🌙 Day / Night theme toggle (Light / Dark mode)

📥 Download converted output

📋 Copy converted text with one click

🔐 100% offline – no data leaves your device

📊 Visual progress bar for large files

📂 Project Structure
extension/
│── manifest.json
│── popup.html
│── popup.css
│── popup.js
│── worker.js
│── options.html
│── icons/
│     ├── icon16.png
│     ├── icon48.png
│     ├── icon128.png

🧱 How It Works
1. Select or drag-and-drop a file

Upload a .csv or .json file.

2. Choose conversion mode

CSV → JSON

JSON → CSV

3. Worker processes file

worker.js reads file in a separate thread:

Parses CSV or JSON

Sends real-time progress updates

Returns final converted result

4. Export

You can:

Download as .json or .csv

Copy converted text

Preview inside extension

🖥️ UI Preview

The extension uses a BMI-style gradient UI with smooth blue tones:

✔ Rounded inputs
✔ Gradient buttons
✔ Glass-effect drop zone
✔ Compact clean layout
✔ Dark mode support

📜 Manifest (V3)

Your extension uses Manifest V3 with popup + options page:

{
  "manifest_version": 3,
  "name": "__MSG_extName__",
  "description": "__MSG_extDesc__",
  "version": "1.4",
  "default_locale": "en",
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "options_page": "options.html",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}

🔧 Technologies Used

HTML5

CSS3 (Custom gradient theme)

JavaScript

Web Workers (worker.js)

Chrome Extension API (Manifest V3)

📘 Options Page

A simple options page is included:

“This extension works fully offline. No data is collected.”


options

🛠 Developer Installation

Download or clone this repository

Open Chrome → chrome://extensions/

Enable Developer Mode

Click Load unpacked

Select your extension folder

Done! 🚀

🙌 Contributing

Pull requests are welcome.
You can also request:

New features

New UI theme

More converters

Performance improvements

📄 License

This project is released under the MIT License — free for personal & commercial use.