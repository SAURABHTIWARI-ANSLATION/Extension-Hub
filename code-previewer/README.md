🌐 Code Previewer – Chrome Extension

A powerful, modern, offline HTML/CSS/JS previewer built directly inside a Chrome Extension.

Write code → Preview instantly → Export as a complete HTML file.

Fast. Clean. Professional.

✨ Features
🧩 Multi-Language Code Tabs

Switch between three languages:

HTML

CSS

JavaScript

Each tab includes active indicators and smooth UI transitions.

⚡ Live Preview (Instant Rendering)

One-click Run button updates the preview using a sandboxed iframe with srcdoc, fully MV3-compatible.

💾 Auto-Save Code (LocalStorage)

Your project is continuously saved:

HTML

CSS

JS

Reloading the extension instantly restores your last session.

📤 Export as HTML File

Download a complete output file:

project.html


This export contains:

Your HTML content

Embedded <style> section for CSS

Embedded <script> section for JS

🧹 Clear Editor

Clear code per tab without affecting the other two languages.

🎨 Beautiful Gradient UI

Clean blue-gradient theme, floating card UI, and polished coding layout.

📂 Project Structure
Code-Previewer/
│── manifest.json
│── popup.html
│── popup.css
│── popup.js
│── icons/
│     ├── icon16.png
│     ├── icon48.png
│     ├── icon128.png

🧠 How It Works

Choose a Tab
Switch between HTML, CSS, and JS.

Write Your Code
The editor auto-saves in real-time.

Preview Output
Click Run to render the preview instantly.

Export Project
Download your fully combined HTML file.

Clear Code
Remove code only from the active tab.

🗂 Manifest (MV3)
{
  "manifest_version": 3,
  "name": "Code Previewer",
  "version": "1.8",
  "description": "Professional HTML, CSS & JS previewer with live output, tabs, export, and full offline support.",
  "action": {
    "default_popup": "popup.html"
  }
}

🔌 Technologies Used

HTML5

CSS3

JavaScript

LocalStorage

Chrome Extensions (MV3)

iframe srcdoc live rendering

🚀 Installation (Developer Mode)

Open chrome://extensions/

Enable Developer Mode

Click Load Unpacked

Select the extension folder

The Code Previewer icon will appear in your toolbar

📈 Possible Future Upgrades

Dark mode

Auto code formatting

Syntax highlighting

Download as ZIP project

HTML/CSS/JS templates

Multi-file editing

📄 License

MIT License — free for personal & commercial use.