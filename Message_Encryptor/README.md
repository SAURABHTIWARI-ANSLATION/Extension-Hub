# 🔐 Message Encryptor & Decryptor (Chrome Extension)

**Message Encryptor & Decryptor** is a lightweight Chrome extension that lets you securely **encrypt and decrypt text messages** directly in your browser using strong AES encryption.  
Ideal for protecting sensitive notes, passwords, or private messages — all **offline**.

---

## 🧩 Description

This extension allows you to:
- Encrypt plain text into unreadable cipher text
- Decrypt previously encrypted text back to its original form
- Copy results instantly with one click

All encryption happens **locally** using a built-in secret key.  
No data is sent to any server.

---

## 🚀 Features

- 🔒 **AES Encryption**
  - Uses industry-standard AES encryption (via CryptoJS)
- 🔓 **Instant Decryption**
  - Decrypt encrypted text with one click
- 📋 **Copy to Clipboard**
  - Quickly copy encrypted or decrypted output
- 🧹 **Clear Button**
  - Reset inputs instantly
- 🎨 **Modern UI**
  - Clean, card-based interface with smooth feedback
- 🌐 **Offline First**
  - Works without internet

---

## 🛠️ Tech Stack

- **HTML5** – Popup structure
- **CSS3** – Modern gradient UI
- **JavaScript (Vanilla)** – Logic
- **CryptoJS** – AES encryption
- **Chrome Extension (Manifest V3)**

---

## 📂 Folder Structure

message-encryptor/
├── manifest.json # Extension config
├── popup.html # UI
├── popup.js # Encryption / decryption logic
├── crypto.js # CryptoJS library
└── icons/
├── icon16.png
├── icon48.png
└── icon128.png


---

## ⚙️ Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top-right)
4. Click **Load unpacked**
5. Select the project folder

The extension icon will appear in your toolbar 🔐

---

## 🧠 How It Works

1. **Input**
   - User enters a message or encrypted text
2. **Encryption**
   - Uses `CryptoJS.AES.encrypt(text, SECRET_KEY)`
3. **Decryption**
   - Uses `CryptoJS.AES.decrypt(cipher, SECRET_KEY)`
4. **Output**
   - Result is shown and auto-selected for easy copying

> 🔑 The secret key is **internally defined** and hidden from the UI.

---

## 🔐 Permissions Explained

| Permission | Reason |
|---------|-------|
| None | Runs fully inside the popup |

No page access. No tracking.

---

## 🔒 Privacy Policy

- ✅ No data collection
- ✅ No analytics
- ✅ No network requests
- ✅ Everything runs locally

Your messages never leave your browser.

---

## ⚠️ Security Note

- This tool is ideal for **casual / personal encryption**
- Not recommended for military-grade or enterprise security use
- Anyone with the same secret key can decrypt the message

---

## 📸 Screenshots

*(Add screenshots here for Chrome Web Store listing)*

---

## 📄 License

MIT License  
Free to use, modify, and distribute.

---

## 👨‍💻 Author

**Message Encryptor & Decryptor**  
Built for privacy-focused users who want simplicity with security.