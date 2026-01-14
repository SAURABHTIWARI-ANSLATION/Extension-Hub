# 🛡️ JobShield - Job Scam Detector

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**JobShield** protects job seekers from employment scams. It analyzes job postings on popular platforms (LinkedIn, Indeed, etc.) in real-time to detect red flags like suspicious domains, vague descriptions, or known scam patterns. Search for your dream job with peace of mind.

### 🚀 Features
- **Real-Time Analysis**: Scans job posts as you browse.
- **Risk Score**: Assigns a Low, Medium, or High risk rating.
- **Red Flag Highlighting**: Visual alerts for suspicious keywords (e.g., "Wire transfer", "Easy money").
- **Company Verification**: Cross-checks company names against known databases.

### 🛠️ Tech Stack
- **HTML5**: Popup and alerts.
- **CSS3**: Styles.
- **JavaScript**: Content analysis scripts.
- **Chrome Extension (Manifest V3)**: Service workers and scripting.

### 📂 Folder Structure
```
jobshield-extension/
├── icons/             # Icons
├── content.js         # Page scanner
├── background.js      # Analysis engine
├── popup.html         # Status UI
└── manifest.json      # Config
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `jobshield-extension`.

### 🧠 How It Works
1.  **Scanning**: `content.js` reads the job title and description text from the DOM.
2.  **Heuristics**: Checks for keyword density of scam phrases and verifies the posting domain.
3.  **Alerting**: If the risk score exceeds a threshold, a warning banner is injected into the page.

### 🔐 Permissions Explained
- **`scripting`**: To inject the analyzer into job board websites.
- **`activeTab`**: To access current job post content.
- **`notifications`**: To send urgent security alerts.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Risk Warning](https://via.placeholder.com/600x400?text=Risk+Warning)

### 🔒 Privacy Policy
- **No Storage**: We analyze text on the fly and do not store job application data.

### 📄 License
This project is licensed under the **MIT License**.
