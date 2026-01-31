🌐 HTML Previewer Pro

A powerful, modern, offline HTML/CSS/JS previewer built directly into a Chrome Extension.
Write code → Preview instantly → Export as an HTML file.

Fast. Clean. Professional.

✨ Features
🧩 Multi-Language Code Tabs

Switch between three languages:

HTML

CSS

JavaScript

Tabs include active indicators and smooth UI transitions.


popup

⚡ Live Preview (Instant Rendering)

One-click Run button updates the <iframe> preview with your latest HTML, CSS & JS.
Uses MV3-friendly sandboxed preview via srcdoc.


popup

💾 Auto-Save Code (LocalStorage)

Your code is automatically saved:

HTML

CSS

JS

Reloading the extension restores your last session.


popup

📤 Export as HTML File

Download the combined output as a standalone:

project.html


with embedded CSS & JS.


popup

🧹 Clear Editor

Instantly clear only the current active tab’s code.

🎨 Clean Gradient UI

A modern blue gradient, floating cards, and smooth visual hierarchy create a premium coding environment.


popup

📂 Project Structure
HTML-Previewer-Pro/
│── manifest.json
│── popup.html
│── popup.css
│── popup.js
│── icons/
│     ├── icon16.png
│     ├── icon48.png
│     ├── icon128.png

🧠 How It Works
1. Choose a Tab

Switch between HTML, CSS, and JS.

2. Write Code

The editor updates and auto-saves.

3. Preview

Press Run to render inside the iframe.

4. Export

Press Export to download a complete HTML file containing:

HTML

<style> CSS

<script> JS

5. Clear Code

Press Clear to remove code from the active tab.

🗂 Manifest (MV3)

Your extension uses Manifest V3 with a simple popup-based UI:


manifest

{
  "manifest_version": 3,
  "name": "HTML Previewer Pro",
  "version": "1.8",
  "description": "Professional HTML, CSS & JS Previewer with live output, tabs, export and offline support.",
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

iframe srcdoc rendering

🚀 Installation (Developer Mode)

Go to chrome://extensions/

Enable Developer Mode

Click Load Unpacked

Select the extension folder

The extension will appear in your Chrome toolbar.

📈 Possible Future Upgrades

Dark mode toggle

Code auto-formatting

Syntax highlighting

Download as ZIP project

Templates (Boilerplate HTML)

📄 License

MIT License — free for personal & commercial use.