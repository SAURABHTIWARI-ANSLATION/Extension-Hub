# 🔍 Tech Detector Pro

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Tech Detector Pro** is a powerful browser extension designed for developers, designers, and tech enthusiasts. It allows you to instantly detect and analyze the technology stack used by any website you visit. From frontend frameworks to backend technologies, CMS, and analytics tools, get a comprehensive report with a single click.

Whether you are competitive analysis, learning about new tech stacks, or just curious, Tech Detector Pro gives you the insights you need instantly.

### 🚀 Features
- **Comprehensive Detection**: Identifies frontend frameworks, backend technologies, CMS, analytics, hosting providers, and detailed libraries.
- **Instant Scan**: One-click analysis of the current tab.
- **Detailed Categorization**: Results are organized by category (Frontend, Backend, CMS, etc.) for easy reading.
- **Export Options**: Copy results to clipboard, download as JSON, or share the report.
- **Scan History**: Keeps a local history of your recent scans for quick reference.
- **Responsive Design**: Modern, clean, and user-friendly interface with a dark mode theme.

### 🛠️ Tech Stack
- **HTML5**: semantic structure for the popup.
- **CSS3**: Modern styling with CSS variables and flexbox/grid layouts.
- **JavaScript (Vanilla)**: Core logic for detection and UI interaction.
- **Chrome Extension (Manifest V3)**: Secure and performant extension architecture.

### 📂 Folder Structure
```
tech-detector-pro/
├── icons/                  # Extension icons
├── background.js           # Service worker background logic
├── content.js              # Content script for analyzing page DOM
├── manifest.json           # Extension configuration
├── popup.css               # Styling for the extension popup
├── popup.html              # Main interface
├── popup.js                # Popup logic and event handlers
├── technologies.json       # Database of technology signatures
└── theme-variables.css     # Design tokens and theme variables
```

### ⚙️ Installation (Developer Mode)
1.  **Clone the repository** to your local machine.
2.  Open Google Chrome and navigate to `chrome://extensions/`.
3.  Toggle **Developer mode** in the top-right corner.
4.  Click **Load unpacked**.
5.  Select the `tech-detector-pro` folder from the cloned repository.
6.  The extension is now installed and ready to use!

### 🧠 How It Works
1.  **Detection**: When you click "Scan", the extension injects a script into the current page to analyze the DOM, scripts, and meta tags.
2.  **Matching**: It compares the found data against a local database (`technologies.json`) of known technology signatures.
3.  **Display**: The results are processed and displayed in the popup, categorized for clarity.
4.  **Storage**: Scan results are saved to local storage for the History feature.

### 🔐 Permissions Explained
- **`activeTab`**: Required to analyze the current webpage you are visiting.
- **`scripting`**: Needed to inject the analysis script into the page to detect technologies.
- **`storage`**: Used to save your scan history and user preferences locally.
- **`notifications`**: (Optional) To notify you when a scan is complete or if an error occurs.
- **`host_permissions` ("<all_urls>")**: Necessary to allow the extension to work on any website you visit.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Main Interface](https://via.placeholder.com/600x400?text=Tech+Detector+Pro+Interface)
![Scan Results](https://via.placeholder.com/600x400?text=Scan+Results)

### 🔒 Privacy Policy
We value your privacy.
- **No Data Collection**: This extension does not collect, store, or transmit any personal data or browsing history to external servers.
- **No Tracking**: There are no analytics or tracking scripts included in this extension.
- **Local Processing**: All analysis happens directly in your browser.

### 📄 License
This project is licensed under the **MIT License**.