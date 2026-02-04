# README Generator Chrome Extension

privacy

📘 README.md Generator – Offline & Private

A fast, modern, and privacy-focused Chrome Extension that generates high-quality README.md files instantly from project descriptions.
Everything runs 100% locally inside your browser — no servers, no data collection.

✨ Features
📝 Instant README Generation

Paste your project details → get a clean, formatted README preview in real-time.
The UI includes a live preview panel:


popup

🎨 Beautiful Dual-Theme UI (Dark & Light)

Switch between Dark and Light themes with a single click.
Theme variables come from your CSS system:


popup

🧩 Template Support

Choose between:

Standard Template

Minimal Template

Available from the dropdown menu:


popup

💾 Local Settings Storage

The extension saves:

Selected theme

Selected template

Onboarding status

All via chrome.storage.sync:


options

📥 Export & Copy

Copy README to clipboard

Download README as .md file
Buttons are enabled dynamically based on input:


popup

🔒 100% Local. 0% Tracking.

Your privacy policy clearly states no data collection:


privacy

📂 Project Structure
README-Generator/
│── manifest.json
│── popup.html
│── popup.css
│── popup.js
│── options.html
│── options.css
│── options.js
│── privacy.html
│── icons/
│     ├── icon16.png
│     ├── icon48.png
│     ├── icon128.png

🧠 How It Works
1️⃣ Enter Project Description

Users paste project text into a <textarea> input.

2️⃣ Choose Template

From the dropdown (standard or minimal).

3️⃣ Generate README

The extension formats a Markdown README and displays it in the preview panel.

4️⃣ Export

Users can:

Copy the README text

Download as .md


popup

⚙️ Options Page

The extension includes a dedicated Options Page where users can:

Change theme

Change default template

Reset onboarding

Built using options.html:


options


Styled with options.css:


options


Logic implemented in options.js:


options

📜 Manifest (MV3)

Your extension uses Manifest V3 with popup and options page support:


manifest

{
  "manifest_version": 3,
  "name": "README.md Generator – Offline & Private",
  "description": "Create professional README.md files from project descriptions. Runs entirely in your browser.",
  "version": "1.0.0",
  "permissions": ["storage"],
  "action": {
    "default_popup": "popup.html"
  },
  "options_page": "options.html"
}

🚀 Installation (Developer Mode)

Open Chrome → chrome://extensions/

Enable Developer Mode

Click Load unpacked

Select the project folder

🛠 Technologies Used

HTML5

CSS3 (Theme Variables)

JavaScript (DOM + Markdown Generator)

Chrome Storage API

Manifest V3

🌟 Future Enhancements

More README templates

AI-powered improvement suggestions

GitHub-optimized badges and sections

Local templates library

📄 License

MIT — open-source and free to modify.