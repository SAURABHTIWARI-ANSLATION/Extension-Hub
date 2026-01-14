# ⛽ Fuel Cost Estimator

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Fuel Cost Estimator** is a handy utility for drivers and road trippers. It helps you quickly calculate the estimated fuel cost for a trip based on distance, fuel efficiency, and gas price. Plan your travel budget effectively with this simple browser extension.

### 🚀 Features
- **Quick Calculation**: Enter Distance, Efficiency (MPG/KPL), and Price to get immediate results.
- **Save Settings**: Remembers your vehicle's efficiency for future calculations.
- **Currency Agnostic**: Works with any currency (USD, EUR, INR, etc.).

### 🛠️ Tech Stack
- **HTML5**: Form structure.
- **CSS3**: Styling.
- **JavaScript (Vanilla)**: Calculation logic.
- **Chrome Extension (Manifest V3)**: Extension framework.

### 📂 Folder Structure
```
fuel-cost-estimator/
├── manifest.json      # Config
├── popup.html         # UI
├── popup.js           # Logic
└── style.css          # Styling
```

### ⚙️ Installation (Developer Mode)
1.  Download or clone the repo.
2.  Go to `chrome://extensions/`.
3.  Toggle **Developer mode** on.
4.  Click **Load unpacked**.
5.  Choose the `fuel-cost-estimator` folder.

### 🧠 How It Works
1.  **Input**: User inputs Trip Distance, Fuel Efficiency, and Fuel Price.
2.  **Formula**: `(Distance / Efficiency) * Price = Total Cost`.
3.  **Storage**: Uses `chrome.storage` to save frequently used values like efficiency.

### 🔐 Permissions Explained
- **`storage`**: To save your vehicle's fuel efficiency so you don't have to type it every time.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Calculator Interface](https://via.placeholder.com/600x400?text=Calculator+Interface)

### 🔒 Privacy Policy
- **Offline Tool**: No data is sent to the cloud.
- **Private**: Your travel data is stored locally on your machine.

### 📄 License
This project is licensed under the **MIT License**.
