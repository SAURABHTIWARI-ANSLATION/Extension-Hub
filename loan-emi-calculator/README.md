# 🏦 Loan EMI Calculator

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Loan EMI Calculator** is a straightforward financial utility. Calculate your Equated Monthly Installment (EMI) for any loan—home, car, or personal. See exactly how much you'll pay in total interest versus principal.

### 🚀 Features
- **Accurate Formulas**: Uses standard banking formulas for EMI.
- **Breakdown**: Shows Monthly Payment, Total Interest, and Total Amount Payable.
- **Clean UI**: Simple input fields with clear results.

### 🛠️ Tech Stack
- **HTML5**: Calculator form.
- **CSS3**: Styles.
- **JavaScript (Vanilla)**: Financial math functions.
- **Chrome Extension (Manifest V3)**: Platform.

### 📂 Folder Structure
```
loan-emi-calculator/
├── manifest.json      # Config
├── popup.html         # UI
└── popup.js           # Logic
```

### ⚙️ Installation (Developer Mode)
1.  Download source.
2.  Go to `chrome://extensions`.
3.  Turn on **Developer mode**.
4.  Load unpacked -> `loan-emi-calculator`.

### 🧠 How It Works
1.  **Inputs**: Loan Amount (P), Interest Rate (R), Tenure (N).
2.  **Calculation**: `E = P * r * (1+r)^n / ((1+r)^n - 1)`.
3.  **Output**: Displays the calculated EMI and total summaries.

### 🔐 Permissions Explained
- **None**: Runs entirely within the popup.

### 📸 Screenshots
*(Placeholder for screenshots)*
![EMI Result](https://via.placeholder.com/600x400?text=EMI+Result)

### 🔒 Privacy Policy
- **Finance Safe**: No financial data is sent to any server.
- **Ephemeral**: Data clears when you close the popup.

### 📄 License
This project is licensed under the **MIT License**.
