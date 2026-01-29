🔔 Hosting Renewal Alert Chrome Extension
https://img.shields.io/badge/Chrome-Extension-green
https://img.shields.io/badge/Manifest-v3-blue
https://img.shields.io/badge/Version-1.0.0-orange
https://img.shields.io/badge/License-MIT-yellow

Never miss another domain or hosting renewal deadline! This intelligent Chrome extension helps you track expiration dates, sends smart notifications, and keeps you informed with visual alerts and badge counts.

✨ Features
📅 Smart Renewal Tracking
Domain/Hosting Management: Track multiple domains and hosting services

Visual Status Indicators: Color-coded cards (Green/Yellow/Red) based on urgency

Days Countdown: Real-time calculation of days remaining

CRUD Operations: Full Create, Read, Update, Delete functionality

🔔 Intelligent Notifications
Background Alarms: Daily checks for upcoming renewals

Smart Reminders: Notifications at 30, 7, and 1 day thresholds

Browser Badge: Extension icon shows count of urgent renewals (≤7 days)

Desktop Alerts: Native Chrome notifications with domain details

🎨 Modern User Interface
Clean Gradient Design: Professional blue gradient theme

Card-based Layout: Intuitive domain cards with color-coded status

Responsive Popup: Optimized 330px interface

Smooth Animations: Interactive hover effects and transitions

Visual Hierarchy: Clear information organization

⚡ Convenience Features
Quick Add: One-click to add new domains

Inline Editing: Edit domains without deleting/re-adding

Persistent Storage: Data saved locally using Chrome storage

No Account Required: Works completely offline

Zero Configuration: Simple setup, immediate use

📁 Project Structure
text
hosting-renewal-alert/
├── manifest.json          # Extension manifest (Manifest v3)
├── popup.html            # Main extension popup interface
├── popup.css             # Modern styling with gradients
├── popup.js              # Popup logic and DOM manipulation
├── background.js         # Background service worker for notifications
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This documentation file
🚀 Installation
Method 1: Developer Mode (Local Installation)
Download or clone this repository

Open Chrome and navigate to chrome://extensions/

Enable Developer mode (toggle in top-right corner)

Click Load unpacked

Select the folder containing the extension files

The extension icon will appear in your toolbar (may need to pin it)

Method 2: Pack for Distribution
Open chrome://extensions/

Enable Developer mode

Click Pack extension

Select the extension folder

Distribute the generated .crx file to users

📋 How to Use
Adding a Domain/Hosting Service
Click the extension icon in Chrome toolbar

Click "+ Add Domain" button

Enter the domain name (e.g., "example.com")

Select the expiry date from the date picker

Click "Save" to add it to your list

Managing Your List
View All: All tracked domains appear in color-coded cards

Edit: Click the ✏️ icon to modify domain name or date

Delete: Click the 🗑️ icon to remove a domain

Cancel: Click "Cancel" to exit form without saving

Understanding Status Colors
🟢 Green (Safe): More than 7 days remaining

🟡 Yellow (Warning): 1-7 days remaining

🔴 Red (Urgent): Expired or due today/negative days

Notification System
The extension automatically:

Checks renewals daily (24-hour intervals)

Shows browser badge with count of urgent items (≤7 days)

Sends desktop notifications at:

30 days before expiry

7 days before expiry

1 day before expiry

🔧 Technical Details
Permissions
json
{
  "storage": "Local storage for domain data",
  "notifications": "Desktop alerts for renewals",
  "alarms": "Scheduled daily checks"
}
APIs Used
Chrome Storage API: Persistent local data storage

Chrome Alarms API: Daily background checks

Chrome Notifications API: Desktop alerts

Chrome Action API: Badge management

Chrome Runtime API: Message passing

Data Structure
javascript
{
  domains: [
    {
      name: "example.com",
      date: "2024-12-31",  // YYYY-MM-DD format
      // Auto-calculated:
      // days: 45,
      // status: "green"
    }
  ]
}
Background Service Worker
Runs daily at 24-hour intervals

Calculates days remaining for all domains

Updates badge count on extension icon

Triggers notifications based on thresholds

Listens for updates from popup

🎨 Design System
Color Palette
Primary Gradient: #0b4dbd to #1a73e8 (Blue theme)

Status Colors:

Green: #4CAF50 (Safe, >7 days)

Yellow: #f4b400 (Warning, 1-7 days)

Red: #db4437 (Urgent, expired/today)

Card Background: #ffffff with subtle shadows

Text Colors: #ffffff (header), #1a1a1a (content)

UI Components
Domain Cards: Rounded corners with left border indicating status

Form Container: Clean white card with input fields

Buttons: Gradient primary button, red cancel button

Icons: Unicode emojis for edit (✏️) and delete (🗑️)

Badge: Red counter on extension icon

Layout & Spacing
Popup Width: 330px fixed

Padding: 20px outer, 12-16px inner

Border Radius: 14-18px rounded corners

Shadows: Subtle box shadows for depth

Max Height: 230px scrollable list

⚡ Performance Features
Efficient Storage: Minimal data structure

Smart Updates: Only recalculates when needed

Event Delegation: Single event listener for dynamic elements

Background Optimization: Daily checks, not continuous polling

Minimal DOM Updates: Batch rendering of domain list

🔒 Privacy & Security
No Data Collection: All data stays locally in your browser

No Internet Required: Works completely offline

No Third-party Services: Zero external API calls

Local Storage: Uses Chrome's secure storage API

No Tracking: No analytics or telemetry

⚠️ Limitations
Date Format: Only supports YYYY-MM-DD format

No Recurring Renewals: Doesn't track annual renewals automatically

Single User: No multi-user or profile support

No Cloud Sync: Data doesn't sync across devices

Browser Only: Works only in Chrome/Chromium browsers

🔮 Future Roadmap
Planned Enhancements
Recurring Renewals: Track annual subscriptions automatically

Cloud Sync: Sync across Chrome instances via Google Drive

Import/Export: CSV/JSON import and export functionality

Email Reminders: Send email notifications (optional)

Multiple Categories: Separate domains, hosting, SSL certificates

Calendar Integration: Add to Google Calendar automatically

Bulk Operations: Add/edit multiple domains at once

Themes: Dark/Light mode toggle

Backup: Automatic backup of data

Statistics: Visual charts of renewal patterns

Advanced Features
API Integration: Connect with domain registrars (GoDaddy, Namecheap, etc.)

Auto-renew Detection: Scan emails for renewal receipts

Price Tracking: Monitor renewal price changes

Domain Portfolio Value: Estimate total value

WHOIS Integration: Auto-fetch expiry dates

Team Sharing: Share domain lists with team members

Audit Log: Track changes to domain list

🐛 Troubleshooting
Common Issues & Solutions
Issue	Solution
Extension not loading	Ensure Chrome version 88+ (Manifest v3 required)
Notifications not showing	Check Chrome notification settings
Badge not updating	Click extension icon to trigger manual update
Data not saving	Verify storage permission in manifest
Form not showing/hiding	Clear browser cache and reload extension
Debug Mode
Open Chrome DevTools (F12)

Go to Console tab

Check for error messages

Verify storage: chrome.storage.local.get(['domains'])

Check background script: chrome://extensions/ → Service Worker link

Testing Notifications
Add a domain with date set to tomorrow

Wait for daily alarm (or trigger manually in DevTools)

Check for notification and badge update

🧪 Testing Checklist
Add new domain functionality

Edit existing domain

Delete domain

Cancel form operation

Status color calculation (green/yellow/red)

Days remaining calculation

Badge count updates

Desktop notifications

Data persistence after browser restart

Responsive design at 330px

🤝 Contributing
We welcome contributions! Here's how to help:

Report Issues
Check existing issues first

Provide clear reproduction steps

Include Chrome version and OS

Attach screenshots if applicable

Suggest possible solutions

Code Contributions
Fork the repository

Create a feature branch

Follow existing code style

Add comments for complex logic

Test thoroughly before submitting

Update documentation if needed

Feature Requests
Check roadmap for existing plans

Explain the use case clearly

Suggest implementation approach

Consider privacy implications

Keep it simple and focused

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.