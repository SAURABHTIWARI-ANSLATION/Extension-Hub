🕶️ Open Incognito Tab (Chrome Extension)

Open Incognito Tab is a lightweight Chrome extension that lets you instantly open the current tab in Incognito mode — with extra privacy controls like clearing history, fullscreen mode, and auto-closing the original tab.

Fast, simple, and privacy-focused.

🧩 Description

This extension allows you to:

Open the current active tab in an Incognito window

Optionally remove the URL from browsing history

Open Incognito in fullscreen

Close the original normal tab automatically

You can trigger it via:

Extension popup button

Right-click context menu

Keyboard shortcut

🚀 Features

🕶️ One-Click Incognito

Open the current tab instantly in Incognito mode

🧹 Clear History Option

Automatically delete the URL from Chrome history

🖥️ Fullscreen Incognito

Open Incognito window in fullscreen mode

❌ Close Original Tab

Close the normal tab after opening Incognito

🖱️ Right-Click Support

Context menu: Open this tab in incognito

⌨️ Keyboard Shortcut

Alt + I (Windows/Linux)

Option + I (Mac)

⚙️ Settings Page

Simple options page to control behavior

🛠️ Tech Stack

HTML5 – Popup & options UI

CSS3 – Clean minimal styling

JavaScript (Vanilla) – Logic

Chrome Extension API

Manifest V3

📂 Folder Structure
open-incognito-tab/
├── manifest.json        # Extension configuration
├── background.js        # Service worker logic
├── popup.html           # Popup UI
├── popup.js             # Popup actions
├── popup.css            # Popup styles
├── options.html         # Settings page
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png

⚙️ Installation (Developer Mode)

Clone or download this repository

Open Chrome and go to chrome://extensions

Enable Developer mode (top-right)

Click Load unpacked

Select the project folder

The extension icon will appear in the toolbar 🕶️

🧠 How It Works

User triggers the extension (popup, shortcut, or right-click)

Extension reads user settings from chrome.storage

Opens a new Incognito window with the current tab URL

Optional actions:

Remove URL from history

Close original tab

Launch in fullscreen

All logic runs locally using Chrome APIs.

🔐 Permissions Explained
Permission	Reason
tabs	Get current active tab
history	Remove URL from history (optional)
contextMenus	Right-click menu support
storage	Save user settings

No page content access. No tracking.

🔒 Privacy Policy

✅ No data collection

✅ No analytics

✅ No network requests

✅ No external servers

✅ Everything runs locally

Your browsing activity never leaves your browser.

⚠️ Notes

Incognito windows still follow Chrome’s Incognito limitations

History removal only affects the opened URL

Does not bypass Chrome or website tracking mechanisms

📄 License

MIT License
Free to use, modify, and distribute.
 
👨‍💻 Author

Open Incognito Tab
Built for users who want speed + privacy without complexity.