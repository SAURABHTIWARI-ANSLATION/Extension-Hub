🌐 Hosting Renewal Alert – Chrome Extension

A smart and beautiful Chrome Extension that helps you track domain & hosting expiry dates, get automatic reminders, view days left, and receive badge alerts — all with a clean blue gradient UI.

Never miss a renewal again.

🚀 Features
🔔 Smart Renewal Alerts

Auto-fetches expiry date using IP2WHOIS API

Sends reminders when a domain expires in 30 days, 7 days, or 1 day

Uses Chrome Notifications API

📍 Badge Expiry Counter

Chrome action badge shows:

Number of domains expiring within 7 days
(Automatically updated by the background worker)


background

📅 Daily Auto-Check

A scheduled Chrome Alarm runs every 24 hours:

Refreshes badge

Sends notifications

🗂️ Domain Manager

Add, edit, delete domain records easily:

Domain name

Auto-retrieved expiry date

Days left

Status color:

🟢 Green – Safe

🟡 Yellow – < 7 days

🔴 Red – Expired


popup

🎨 Beautiful UI

Clean blue gradient theme, modern cards, rounded edges


popup

🔐 Secure & Local

All data saved in chrome.storage.local

📦 Project Structure
HostingRenewalAlert/
│── manifest.json
│── background.js
│── popup.html
│── popup.js
│── popup.css
│── icons/
│     ├── icon16.png
│     ├── icon48.png
│     ├── icon128.png

🧠 How It Works
1️⃣ Add a Domain

Enter domain:

example.com

2️⃣ Auto-Fetch Expiry

Extension calls:

https://api.ip2whois.com/v2?key=API_KEY&domain=example.com


Returns real expiry date.

3️⃣ Display Domain Status

Each domain card shows:

Domain name

Expiry date

Days remaining

Color status

Edit / Delete icons

4️⃣ Background Service Worker

Handles:

Daily alarms

Notifications

Badge updates


background

📜 Manifest (MV3)

Your extension uses Manifest V3 with service worker support:


manifest

{
  "manifest_version": 3,
  "name": "Hosting Renewal Alert",
  "description": "Never miss domain or hosting renewals. Smart alerts, badge count & reminders.",
  "version": "1.1.0",
  "action": { "default_popup": "popup.html" },
  "permissions": [
    "storage",
    "notifications",
    "alarms",
    "https://api.ip2whois.com/*"
  ],
  "background": { "service_worker": "background.js" },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}

🛠️ Installation (Developer Mode)

Download or clone this repo

Open Chrome → chrome://extensions/

Enable Developer Mode

Click Load unpacked

Select the extension folder

Done! 🎉

💻 Technologies Used

JavaScript (ES6)

Chrome Extensions API

Chrome Storage

Chrome Notifications

Chrome Alarms

IP2WHOIS API

HTML + CSS

🌟 Future Enhancements

Export CSV / JSON

Multiple reminder schedules

Custom API key support

Auto-sync across browsers

📄 License

MIT License — free to use & modify.

