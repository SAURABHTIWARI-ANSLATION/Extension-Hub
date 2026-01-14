# 🔗 Link Redirect Trace

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Link Redirect Trace** is an SEO power tool. Analyze the full path of a redirect chain, including HTTP headers, Status Codes (301, 302, 404, 500), and Rel-Canonicals. Inspect cookies and robots.txt rules to debug complex link issues.

### 🚀 Features
- **Full Trace**: Shows every hop in a redirect chain.
- **Header Analysis**: Inspect HTTP response headers for every hop.
- **SEO Metrics**: Checks for Robots.txt, Canonicals, and Backlink Power.
- **Status Codes**: Clearly identifies 301 vs 302 redirects.

### 🛠️ Tech Stack
- **JavaScript**: WebRequest API listeners.
- **Chrome Extension (Manifest V3)**: WebRequest, Storage.

### 📂 Folder Structure
```
Redirect-main/
├── html/              # UI
├── js/                # Analysis scripts
├── sw_background.js   # Service Worker
└── manifest.json      # Config
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `Redirect-main`.

### 🧠 How It Works
1.  **Listen**: Background script listens to `chrome.webRequest.onBeforeRedirect` and `onHeadersReceived`.
2.  **Record**: Logs every request details into an array associated with the tab.
3.  **Visualize**: Popup queries this array to display the timeline of the redirect chain.

### 🔐 Permissions Explained
- **`webRequest`**: To capture headers and redirect events.
- **`webNavigation`**: To track page transitions.
- **`activeTab`**: To analyze the current page.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Trace Analysis](https://via.placeholder.com/600x400?text=Trace+Analysis)

### 🔒 Privacy Policy
- **Analysis Only**: Data is used for real-time analysis and is not stored remotely.

### 📄 License
This project is licensed under the **MIT License**.
