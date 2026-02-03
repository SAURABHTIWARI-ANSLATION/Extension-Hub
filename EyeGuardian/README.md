🔵 Eye Guardian: Auto Mode — Chrome Extension

A smart, lightweight eye-protection tool that applies Warm/Cool screen filters and Auto-Night mode directly inside your browser. Designed with a beautiful blue-gradient UI, smooth overlays, and modern controls.

Protect your eyes during late-night browsing and reduce screen strain instantly.

✨ Features
🎨 Adjustable Warm/Cool Filter

Use the slider to apply a custom screen tint:

Warm (Orange) → Great for night use

Cool (Blue) → Reduces eye fatigue in bright environments

0 Level → Turns off the filter

🌙 Auto Night Mode (6PM – 6AM)

One click automatically applies warm mode only during night hours.
Logic based on your system time.
(Handled in popup.js logic) 

popup

♻️ Toggle & Reset

Instantly remove the overlay and return to normal mode.
Works on all standard websites.

🔒 Safe Execution

Built-in checks prevent running on restricted pages like:

chrome://*

edge://*

⚡ Modern & Lightweight

No background service worker

Runs only when the user interacts

Minimal permissions: "scripting" + "activeTab" only 

manifest

🎨 Beautiful UI

From your popup:

Premium blue gradient background

Rounded white control card

Clean modern slider

Smooth button animations

Centered “icon circle” design
(Defined in popup.html) 

popup

📂 Project Structure
EyeGuardian/
│── manifest.json      # Permissions + popup config
│── popup.html         # UI + layout
│── popup.js           # Filter logic + Auto mode + Reset
│── icons/
│     ├── icon16.png
│     ├── icon48.png
│     └── icon128.png

🧠 How It Works
1️⃣ Apply Manual Mode

User moves the slider → clicks Apply Manual Mode →
injectFilter() sends value to the active tab via chrome.scripting.executeScript to update the overlay.
(From popup.js) 

popup

2️⃣ Auto Night Mode

Checks system hour →

If 6PM–6AM → applies warm tint

Otherwise → sets filter to neutral

3️⃣ Overlay Rendering in Webpage

applyOverlayColor() creates or updates a fullscreen transparent overlay:

Uses rgba() colors

Smooth transition

mix-blend-mode: multiply for eye-friendly tint
Runs inside the webpage via injection.
(From popup.js) 

popup

4️⃣ Reset

Removes overlay div from DOM.

🔧 Manifest (V3)

Directly from your file:

{
  "manifest_version": 3,
  "name": "Eye Guardian: Auto Mode",
  "version": "1.0",
  "description": "Protects eyes with Warm/Cool filters and Auto-Night mode.",
  "permissions": ["scripting", "activeTab"],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_popup": "popup.html"
  }
}


manifest

🚀 Installation (Developer Mode)

Download or clone project

Open Chrome → chrome://extensions

Enable Developer Mode

Click Load unpacked

Select your extension folder

Done! The Eye Guardian icon will appear in your toolbar.

🛠 Technologies Used

HTML5 (Popup UI)

CSS3 (Blue gradient, modern card layout)

JavaScript (Overlay logic, auto mode)

Chrome Extensions API

Manifest V3

chrome.scripting.executeScript

🧿 Usage
Apply Warm/Cool

Use slider → press Apply Manual Mode

Enable Auto Night Mode

Click → Automatically adjusts filter based on time

Reset

Removes overlay and returns to default mode

📄 License

MIT — free to use, modify, and publish.
