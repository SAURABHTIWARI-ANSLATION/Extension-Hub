# 📧 Gmail Analytics (Checker)

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Gmail Analytics** keeps you updated on your inbox without opening Gmail. See your unread count directly on the extension icon and get notified of new messages. It's a lightweight wrapper to keep you connected.

### 🚀 Features
- **Badge Count**: Shows unread email count on the toolbar icon.
- **Preview**: Click to see a snippet of recent emails.
- **Notifications**: Desktop alerts for new mail.
- **Secure**: Uses official Gmail authentication cookies.

### 🛠️ Tech Stack
- **JavaScript**: Fetching feed data.
- **Chrome Extension (Manifest V3)**: Alarms for polling.

### 📂 Folder Structure
```
GmailAnalytics/
├── background.js      # Polling service
├── popup.html         # Preview UI
└── manifest.json      # Config
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `GmailAnalytics`.

### 🧠 How It Works
1.  **Polling**: Periodically fetches the Gmail Atom feed (`https://mail.google.com/mail/feed/atom`).
2.  **Parsing**: XML parsing to extract unread count and latest 5 emails.
3.  **Badge**: Updates `chrome.action.setBadgeText`.

### 🔐 Permissions Explained
- **`host_permissions`**: Access to `mail.google.com` to fetch the feed.
- **`alarms`**: To schedule background checks.
- **`offscreen`**: (Manifest V3) To parse DOM/XML in background if needed.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Inbox Preview](https://via.placeholder.com/600x400?text=Inbox+Preview)

### 🔒 Privacy Policy
- **Direct Connection**: Connects directly to Gmail. No middleman servers.
- **Credentials**: Uses your existing browser session.

### 📄 License
This project is licensed under the **MIT License**.
