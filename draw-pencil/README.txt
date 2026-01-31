📘 Draw Pencil – Chrome Extension

Version: 9.3
Draw freely on any webpage with a clean pencil overlay, smooth strokes, modern UI toolbar, and PNG export support.

🚀 Features

✏️ Draw Anywhere — Sketch directly on any webpage.

🎨 Color Picker — Choose any stroke color.

📏 Brush Size Slider — Adjust line thickness (1–16px).

↩️ Undo Last Stroke — Quickly revert mistakes.

🧹 Clear Canvas — Wipe everything instantly.

💾 Save Drawing — Export as PNG.

❌ Toggle On/Off — Activate or hide the pencil overlay anytime.

⚡ Fast & Stable — Smart PING/PONG detection prevents double-injections.

🌐 Works on all URLs.

📂 Project Structure
/Draw-Pencil/
│── ⚙️ background.js     # Handles extension icon click + script injection
│── ⚙️ content.js        # Main drawing logic + toolbar + canvas
│── 📄 manifest.json     # Chrome extension config (MV3)
│── 🎨 style.css         # Canvas & toolbar base styling
│── 🖼️ icons/           # Extension icons (16, 48, 128px)
│── 📝 README.txt        # Documentation and project notes

🧠 How It Works
1. 🛰 background.js – Smart Script Injection
Uses a PING/PONG method to check if the content script is already active.
If not active → injects content.js, waits briefly, then toggles drawing.

2. 🖌 content.js – Full Drawing Engine
This is the heart of the extension. It includes:
✅ Canvas creation + resizing
✅ Smooth quadratic-curve line drawing
✅ Undo, clear, save actions
✅ Color & size controls
✅ Toolbar UI (blue gradient theme)
✅ Toggle logic & cursor switching

3. 📑 manifest.json – MV3 Compatible
Defines permissions, background service worker, and toggle action.

4. 💄 style.css – Styling for Canvas & Toolbar
Adds base styling (some overridden by JS for better control).

🛠 Installation (Developer Mode)
1️⃣ Open Chrome → chrome://extensions/
2️⃣ Enable "Developer Mode" (top right toggle)
3️⃣ Click "Load unpacked"
4️⃣ Select the folder containing these files
5️⃣ The extension will appear in your toolbar

🎮 Usage
🖱 Click the Magic Pencil icon in your Chrome extensions bar.
✨ Toolbar will appear in the top-right.
✏️ Start drawing on any webpage!

Keyboard/Mouse Controls:
🖱 Left-click + Drag → Draw
🔘 Toolbar Buttons → Undo, Clear, Save, Close

📝 Changelog
✔ Latest Updates (v9.3)
🚀 Added PING/PONG detection for stable injection
🐞 Fixed toggling & reload issues
🎨 Upgraded toolbar to a professional blue theme
⚡ Improved performance & message handling
🛠 Full Manifest V3 support

📄 License

This project is fully customizable and free to use in your extensions.