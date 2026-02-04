💰 Budget Planner Pro Chrome Extension
https://img.shields.io/badge/Chrome-Extension-green
https://img.shields.io/badge/Manifest-v3-blue
https://img.shields.io/badge/License-MIT-yellow
https://img.shields.io/badge/Version-1.0-purple

A comprehensive budget management Chrome extension with visual analytics, alerts, and export capabilities. Track expenses, set limits, and visualize your spending habits directly from your browser toolbar.

✨ Features
📊 Financial Tracking
Income & Expense Logging: Add transactions with title, amount, type, and category

Real-time Balance Calculation: Instant balance updates as you add transactions

Transaction History: View all past transactions with color-coded income/expense

Monthly Reports: Filter transactions by specific month for detailed analysis

🔔 Smart Alerts
Budget Limit Alarms: Set monthly spending limits

Automatic Notifications: Get browser alerts when exceeding budget (hourly checks)

Background Monitoring: Service worker runs even when extension is closed

📈 Visual Analytics
Interactive Pie Chart: Visual breakdown of spending by category

Dynamic Colors: Auto-generated color palette for different categories

Real-time Updates: Chart refreshes instantly with new transactions

📁 Data Management
CSV Export: Export all transaction data to Excel-compatible CSV

Local Storage: Data persists locally in Chrome storage

Clear History: One-click option to reset all transaction data

🎨 UI/UX Highlights
Modern Gradient Design: Beautiful purple gradient theme

Glassmorphism Effects: Translucent sections with backdrop blur

Responsive Layout: Optimized 320px popup design

Interactive Elements: Hover effects and smooth animations

Color Coding: Green for income, red for expenses

Clean Typography: Inter font family for better readability

📁 Project Structure
text
budget-planner-pro/
├── manifest.json          # Extension manifest (Manifest v3)
├── popup.html            # Main extension popup interface
├── popup.css             # Modern styling with gradients
├── popup.js              # Core popup logic and rendering
├── background.js         # Background service worker for alarms
├── chart.js             # Pie chart visualization functions
└── README.md            # This file
🚀 Installation
Method 1: Developer Mode (Local)
Download or clone this repository

Open Chrome and navigate to chrome://extensions/

Enable Developer mode (toggle in top-right corner)

Click Load unpacked

Select the folder containing the extension files

Pin the extension to your toolbar for easy access

Method 2: Pack Extension (Distribution)
bash
# In Chrome extensions page:
# 1. Enable Developer Mode
# 2. Click "Pack extension"
# 3. Select the extension folder
# 4. Distribute the generated .crx file
📋 How to Use
Adding Transactions
Click the extension icon in Chrome toolbar

Fill in transaction details:

Title: Description (e.g., "Salary", "Groceries")

Amount: Transaction value in ₹ (Indian Rupees)

Type: Income or Expense

Category: Food, Rent, Travel, Shopping, Other

Click "Add Entry" to save

Setting Budget Limits
Navigate to "Monthly Budget Limit" section

Enter your monthly spending limit

Click "Save Limit"

Receive notifications if you exceed the limit

Viewing Reports
Select a month in the "Select Month" field (YYYY-MM format)

Click "View Monthly Report" to filter transactions

See spending breakdown in the pie chart

Exporting Data
Click "Export to Excel" to download all transactions as CSV

Open the CSV file in Excel, Google Sheets, or any spreadsheet software

Clearing History
Click "Clear All History" button

Confirm the action when prompted

All transaction data will be permanently deleted

🔧 Technical Details
Permissions
json
{
  "storage": "Store transaction data locally",
  "alarms": "Schedule hourly budget checks",
  "notifications": "Show budget alerts",
  "downloads": "Export CSV files"
}
APIs Used
Chrome Storage API: Persistent local data storage

Chrome Alarms API: Background periodic checks

Chrome Notifications API: Desktop alerts

Chrome Downloads API: CSV file export

Canvas API: Pie chart rendering

Data Structure
javascript
{
  wallet: [
    {
      title: "Groceries",
      amount: 1500,
      type: "expense",
      category: "Food",
      time: "2024-01-15T10:30:00.000Z"
    }
  ],
  limit: 20000
}
🎨 Design System
Color Palette
Primary Gradient: #6d28d9 to #a78bfa (Purple theme)

Income: #bbf7d0 (Light green)

Expense: #fecaca (Light red)

Background: Semi-transparent white overlays

Text: White with varying opacities

Typography
Font Family: Inter, system-ui, sans-serif

Font Sizes: 11px (labels) to 22px (balance)

Font Weights: Regular (400) to Bold (600)

Spacing & Layout
Popup Width: 320px fixed

Padding: 12px container, 10px sections

Border Radius: 8-12px rounded corners

Margins: Consistent vertical spacing

⚙️ Background Service Worker
The extension includes a background script that:

Creates an hourly alarm to check budget limits

Compares total expenses against set limit

Triggers desktop notifications when limit is exceeded

Runs even when the extension popup is closed

📊 Chart Visualization
The pie chart features:

Dynamic Slices: Proportional to category spending

Auto-coloring: HSL color generation for each category

Real-time Updates: Redraws on every transaction

Responsive Canvas: Fixed 280x200px with white background

🔒 Privacy & Security
No Data Collection: All data stays locally in your browser

No Internet Required: Works completely offline

No Third-party Tracking: Zero external API calls

Local Storage: Uses Chrome's secure storage API

⚠️ Limitations
Currency: Currently shows ₹ (Indian Rupees) but works with any currency

Single User: No multi-user or profile support

No Cloud Sync: Data doesn't sync across devices

No Backup: Manual export needed for data backup

No Recurring Transactions: Each entry must be added manually

🔮 Future Roadmap
Planned enhancements:

Multi-currency support

Recurring transactions

Budget categories with individual limits

Dark/light mode toggle

Data import functionality

Cloud sync via Google Drive

Spending predictions

Receipt image attachment

Voice input for transactions

Monthly/yearly comparison charts

🐛 Troubleshooting
Common Issues
Issue	Solution
Extension not loading	Check Chrome version (88+ required)
Notifications not showing	Ensure Chrome notifications are enabled
Data not saving	Verify storage permission in manifest
Chart not displaying	Check console for canvas errors
Export not working	Ensure downloads permission is granted
Debug Mode
Open Chrome DevTools (F12)

Go to Console tab

Look for any error messages

Check chrome://extensions/ for extension errors

🤝 Contributing
Contributions are welcome! Please follow these steps:

Fork the repository

Create a feature branch (git checkout -b feature/Enhancement)

Commit changes (git commit -m 'Add some feature')

Push to branch (git push origin feature/Enhancement)

Open a Pull Request

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.