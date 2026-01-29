.

🗓️ Free-Slots – Simple Scheduler

Free-Slots – Simple Scheduler is a lightweight Chrome extension that lets you share your availability instantly inside Gmail and LinkedIn messages — with no APIs, no backend, and no sign-ups.

Designed for speed, privacy, and simplicity.

🚀 What It Does

📅 Create quick availability slots

✉️ Insert them directly into Gmail messages

💼 Insert them into LinkedIn chats

⚡ Works instantly via right page context

🔒 Runs 100% locally in your browser

No accounts. No tracking. No external services.

🎯 Perfect For

Recruiters

Freelancers

Founders

Sales professionals

Anyone scheduling meetings via chat or email

✨ Features

🕒 Share availability in seconds

📋 One-click insertion into messages

💾 Stores slots locally using Chrome storage

🌐 Works only on Gmail & LinkedIn (no unnecessary access)

🧠 Zero backend, zero API dependencies

🔐 Privacy-first design

🛠️ Tech Stack

Chrome Extension (Manifest V3)

JavaScript (Vanilla)

HTML / CSS

Chrome Content Scripts

Chrome Storage API

📦 Installation (Local Development)

Clone the repository:

git clone https://github.com/your-username/free-slots-simple-scheduler.git


Open Chrome and go to:

chrome://extensions


Enable Developer mode (top-right)

Click Load unpacked

Select the project folder

✅ The extension will appear in your Chrome toolbar.

📁 Project Structure
Free-Slots/
│
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── popup.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png

🔐 Permissions Explained
Permission	Why It’s Needed
storage	Save availability slots locally
activeTab	Insert availability into current page
scripting	Inject content into Gmail & LinkedIn
host_permissions	Limit access strictly to Gmail & LinkedIn

🔒 No data leaves your browser. Ever.

🧠 How It Works (High Level)

User defines availability in the popup

Extension detects Gmail or LinkedIn message box

Availability text is injected at cursor position

User sends the message — done 🎉

🌟 Planned Enhancements

🌍 Time-zone support

⏱️ Preset slot durations (15 / 30 / 60 mins)

⭐ Recently used slots

📋 Copy-only mode

🌙 Dark mode UI

🧩 Chrome Web Store

Fully compatible with Manifest V3

Minimal permissions

Privacy-safe

Designed to pass Chrome Web Store review

🤝 Contributing

Contributions are welcome!

Fork the repo

Create a new branch

Make your changes

Open a pull request

📄 License

MIT License
Free to use, modify, and distribute.