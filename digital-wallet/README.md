# 💰 Digital Wallet Tracker


### 🧩 Description
**Digital Wallet Tracker** is a personal finance extension. Track your daily expenses and income streams directly from your browser. With a simple dashboard, stay on top of your budget without needing complex spreadsheet software.

### 🚀 Features
- **Transaction Log**: Add Income or Expense entries with descriptions.
- **Balance Overview**: Real-time calculation of your current wallet balance.
- **History**: Scrollable list of past transactions.
- **categories**: Tag transactions for better organization.

### 🛠️ Tech Stack
- **HTML5**: form and list UI.
- **CSS3**: Styling.
- **JavaScript**: Balance calculation logic.
- **Chrome Extension (Manifest V3)**: Storage.

### 📂 Folder Structure
```
digital-wallet/
├── manifest.json      # Config
├── popup.html         # UI
├── popup.js           # Logic
└── style.css          # Styling
```

### ⚙️ Installation (Developer Mode)
1.  Download source.
2.  Open `chrome://extensions`.
3.  Turn on **Developer mode**.
4.  Load unpacked -> `digital-wallet`.

### 🧠 How It Works
1.  **Input**: User enters Amount, Type (Cr/Dr), and Note.
2.  **Storage**: Object is pushed to a transactions array in `chrome.storage`.
3.  **Calculation**: `Balance = Sum(Income) - Sum(Expense)`.

### 🔐 Permissions Explained
- **`storage`**: Essential to keep your financial records saved locally.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Wallet Dashboard](https://via.placeholder.com/600x400?text=Wallet+Dashboard)

### 🔒 Privacy Policy
- **Local Only**: Financial data is computed and stored on your device only.
- **Secure**: No external connections.

### 📄 License
This project is licensed under the **MIT License**.
