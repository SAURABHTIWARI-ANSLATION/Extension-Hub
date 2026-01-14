# 🔍 WhatFont - Font Identifier

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**WhatFont** is the easiest way to identify fonts on web pages. Instead of inspecting elements via DevTools to find font families, simply hover over any text on a webpage, and WhatFont will instantly tell you the font name, size, weight, line height, and color.

It's an essential utility for web designers, developers, and typographers who want to inspect web typography effortlessly.

### 🚀 Features
- **Hover Mode**: Instantly identify fonts by moving your mouse over text.
- **Click Mode**: Click on any text to pin detailed font information.
- **Scan All Mode**: Get a report of all fonts used on the current page.
- **Detailed Info**: Shows Family, Style, Weight, Size, Line Height, and Hex Color.
- **CSS Snippet**: One-click copy for the font's CSS rule.
- **Dark/Light Theme**: Auto-adapts or uses a custom theme.

### 🛠️ Tech Stack
- **HTML5**: Popup structure.
- **CSS3**: Styling for the popup and the injected tooltips.
- **JavaScript (Vanilla)**: Detection and interaction logic.
- **Chrome Extension (Manifest V3)**: Modern extension architecture.

### 📂 Folder Structure
```
whatfont-extension/
├── images/                 # Icons and assets
├── themes/                 # Theme stylesheets
│   └── themes.css
├── background.js           # Background service worker
├── content.js              # Script injected into pages
├── manifest.json           # Extension manifest
├── popup.css               # Popup styling
├── popup.html              # Popup UI
└── popup.js                # Popup logic
```

### ⚙️ Installation (Developer Mode)
1.  **Clone** the repository.
2.  Open Chrome to `chrome://extensions/`.
3.  Turn on **Developer mode**.
4.  Click **Load unpacked**.
5.  Select the `whatfont-extension` folder.
6.  Pin the extension and start inspecting fonts!

### 🧠 How It Works
1.  **Activation**: Clicking the extension icon or "Start Detection" injects a script.
2.  **Event Listeners**: The script listens for `mouseover` and `click` events on DOM elements.
3.  **Computation**: It uses `window.getComputedStyle(element)` to fetch typography properties.
4.  **Display**: A custom tooltip is rendered in the DOM near your cursor with the font details.

### 🔐 Permissions Explained
- **`activeTab`**: Only runs on the tab you are currently using.
- **`scripting`**: Required to inject the font detection tooltips and listeners.
- **`storage`**: Saves your settings (e.g., theme, default mode).
- **`host_permissions` ("<all_urls>")**: To allow font identification on any website.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Hover Detection](https://via.placeholder.com/600x400?text=Hover+Detection)
![Font Details](https://via.placeholder.com/600x400?text=Font+Details)

### 🔒 Privacy Policy
- **Respectful & Private**: We purely read the styling of the text you hover over.
- **No Data Collected**: No text content or browsing data is sent anywhere.
- **Zero Tracking**: No user tracking or analytics.

### 📄 License
This project is licensed under the **MIT License**.