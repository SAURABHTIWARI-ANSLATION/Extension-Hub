🌙 Universal Dark Mode – Chrome Extension

Transform any website into a beautiful dark mode experience with adjustable brightness and a modern UI.

📌 Overview

Universal Dark Mode is a Chrome extension that automatically applies a global dark-mode effect to any website.
It inverts page colors intelligently and provides brightness control, ensuring comfortable browsing during day and night.

The modern popup UI uses a blue gradient theme inspired by your BMI Calculator design.

🚀 Features
✅ Dark Mode Toggle

Switch instantly between Light Mode and Dark Mode from the popup.

🔆 Adjustable Brightness

Customize page brightness using an intuitive slider.

🎨 Modern UI

A clean, gradient-based popup interface designed with glassmorphism effects.

⚡ Real-Time Page Updates

Changes apply instantly using the content script and message passing.

🧠 Persistent Settings

Your mode and brightness settings are saved in Chrome storage.

📁 Project Structure
/Universal-Dark-Mode
│── manifest.json
│── content.js
│── popup.html
│── popup.js
│── icons/
│     ├── icon16.png
│     ├── icon48.png
│     └── icon128.png

🛠️ How It Works
1. Content Script

The core logic that applies and removes the dark mode filter runs inside
📄 content.js 

content

It:

Applies invert() and hue-rotate() filters

Corrects images/videos to avoid double inversion

Listens for messages from the popup

Displays toast notifications

2. Popup Interface

The popup uses a modern gradient UI:
📄 popup.html 

popup

Elements included:

Light / Dark buttons

Brightness slider

Status display

UI behavior is handled in:
📄 popup.js 

popup

3. Extension Manifest

Configuration file for Chrome:
📄 manifest.json 

manifest

Key components:

MV3 service architecture

Permissions: storage, scripting, activeTab, tabs

Injects content.js into all URLs

Popup defined under "action"

📦 Installation (Developer Mode)

Open chrome://extensions/

Enable Developer Mode

Click Load unpacked

Select your project folder

🖥️ Usage

Click the extension icon

Use the Light/Dark mode toggle

Adjust brightness as needed

Changes apply instantly to the current tab

🧩 Technical Highlights

Chrome Storage API

Chrome Tabs API

Chrome Scripting API

Real-time message passing

Automatic re-injection if content script fails

UI animations & glass card effects

Responsive gradient design

📜 License

This project is released under your personal or company license.
Feel free to customize it as you wish.