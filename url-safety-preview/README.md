# 🛡️ URL Safety Preview

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**URL Safety Preview** is your first line of defense against malicious websites. Before you visit a shortened or suspicious link, this extension scans it to provide a safety score and unmasks the destination URL. Browse with confidence knowing what lies ahead.

### 🚀 Features
- **Link Scanning**: Analyzes links for malware, phishing, and scam reports.
- **Unshorten URLs**: Reveals the true destination of bit.ly or other short links.
- **Safety Score**: Provides a clear 0-100 safety rating.
- **Real-time Alerts**: Warnings appear before you navigate to dangerous sites.

### 🛠️ Tech Stack
- **HTML5**: Popup UI.
- **CSS3**: Warning styles.
- **JavaScript**: API integration for reputation checks.
- **Chrome Extension (Manifest V3)**: WebNavigation and Notifications.

### 📂 Folder Structure
```
url-safety-preview/
├── icons/             # Icons
├── background.js      # Scanning service
├── content-script.js  # Page interaction
├── popup.html         # Status UI
└── manifest.json      # Config
```

### ⚙️ Installation (Developer Mode)
1.  Download source.
2.  Open `chrome://extensions`.
3.  Toggle **Developer mode**.
4.  Load unpacked -> `url-safety-preview`.

### 🧠 How It Works
1.  **Event**: Detects navigation events or link clicks.
2.  **API Call**: Sends the target URL to a safety API (like Google Safe Browsing or VirusTotal, depending on implementation).
3.  **Result**: Returns a JSON response with threat level.
4.  **Action**: If malicious, it sends a notification or blocks the request.

### 🔐 Permissions Explained
- **`webNavigation`**: To monitor when you are about to visit a new site.
- **`notifications`**: To alert you immediately if a site is unsafe.
- **`activeTab`**: To show details for the current site.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Safety Report](https://via.placeholder.com/600x400?text=Safety+Report)

### 🔒 Privacy Policy
- **Anonymity**: URL checks are performed anonymously.
- **No History**: We do not store your browsing history.

### 📄 License
This project is licensed under the **MIT License**.
