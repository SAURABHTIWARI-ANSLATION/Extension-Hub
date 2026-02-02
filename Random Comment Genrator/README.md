📱 QR Code Generator
QR Code Generator is a streamlined Chrome extension designed for instant link sharing and data encoding. It allows users to convert the current page URL or any custom text into a scannable QR code directly from their browser toolbar.

👨‍💻 Developed By
Saurabh Tiwari

🚀 Key Features
Instant Generation: Automatically creates a QR code for the active tab's URL as soon as the popup is opened.

Custom Input: Supports manual entry of any text or URL to generate bespoke QR codes.

Offline Functionality: Operates locally on your device without requiring an active internet connection.

Lightweight Design: Built with a minimalist aesthetic and zero unnecessary bloat.

🛠️ Tech Stack
HTML5: Defines the popup structure.

CSS3: Provides the visual styling.

Vanilla JavaScript: Powers the core QR generation logic.

Manifest V2: Utilizes the legacy Chrome Extension framework (pending upgrade to V3).

📂 Project Structure
Plaintext
QR-Generator/
├── manifest.json      # Extension configuration
├── popup.html         # User interface
├── popup.js           # Logic and event handling
└── qr.png             # Extension icon
⚙️ Installation Guide (Developer Mode)
Clone or download the repository to your local machine.

Open Chrome and go to chrome://extensions/.

Toggle the Developer mode switch in the top-right corner.

Click the Load unpacked button.

Select the QR-Generator folder from your file explorer.

The extension is now installed and ready for use!

🔐 Privacy & Permissions
Permissions: Uses activeTab to retrieve the current URL for the default QR code.

No Tracking: No user activity or generated data is tracked.

Local Processing: All encoding happens locally on your device; data is never sent to external servers.

📄 License
This project is licensed under the MIT License.