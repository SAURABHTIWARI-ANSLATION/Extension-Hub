📚 Bookmark Manager Chrome Extension
A powerful and intuitive Chrome extension for managing bookmarks, tab sessions, and performing cleanup tasks with a clean, modern interface.

https://img.shields.io/badge/Chrome-Extension-green
https://img.shields.io/badge/Manifest-v3-blue
https://img.shields.io/badge/License-MIT-yellow

✨ Features
🔖 Bookmark Management
Category-based Bookmarking: Save bookmarks to custom folders/categories

Automatic Folder Creation: Creates folders on-the-fly for new categories

Duplicate Detection: Find and remove duplicate bookmarks

Folder Cleanup: Automatically delete empty bookmark folders

🗂️ Tab Session Management
Save Current Session: Save all open tabs in the current window

Restore Last Session: Reopen all tabs from your last saved session

Persistent Storage: Sessions are saved locally using Chrome's storage API

🔍 Search Functionality
Unified Search: Search across both bookmarks and browsing history

Real-time Results: See search results in Chrome DevTools console

Smart Filtering: Returns relevant matches from both sources

🧹 Cleanup Tools
Remove Duplicates: Automatically detects and removes duplicate bookmarks

Clean Empty Folders: Removes all empty bookmark folders

One-click Operations: Simple buttons for all cleanup tasks

📁 Project Structure
text
bookmark-manager/
├── manifest.json          # Extension manifest (Manifest v3)
├── popup.html            # Main extension popup UI
├── popup.css             # Styling for the popup
├── popup.js              # Main popup logic and search functionality
├── bookmarks.js          # Bookmark management functions
├── sessions.js           # Tab session saving/restoring
└── README.md             # This file
🚀 Installation
Method 1: Load Unpacked (Development)
Download or clone this repository

Open Chrome and navigate to chrome://extensions/

Enable Developer mode (toggle in top right)

Click Load unpacked

Select the folder containing the extension files

The extension icon will appear in your Chrome toolbar

Method 2: Pack Extension (Distribution)
Open chrome://extensions/

Enable Developer mode

Click Pack extension

Select the extension folder

Use the generated .crx file for distribution

🎯 How to Use
Accessing the Extension
Click the extension icon in your Chrome toolbar to open the popup interface.

Adding Bookmarks
Navigate to any webpage you want to bookmark

Click the extension icon

Enter a category name (or leave blank for "Unsorted")

Click "Bookmark current page"

Managing Sessions
Save Current Tabs: Click "Save current tabs" to save all open tabs

Restore Session: Click "Restore last session" to reopen saved tabs

Searching
Type in the search box to find bookmarks and browsing history. Results appear in the Chrome DevTools console (F12 → Console).

Cleanup Tools
Remove Duplicates: Removes all duplicate bookmarks across all folders

Delete Empty Folders: Cleans up any bookmark folders with no items

🔧 Technical Details
Permissions Used
tabs: Access to browser tabs for session management

bookmarks: Create, read, and manage bookmarks

history: Search browsing history

storage: Save and restore session data locally

APIs Used
Chrome Bookmarks API: For all bookmark operations

Chrome Tabs API: For tab management and session handling

Chrome History API: For search functionality

Chrome Storage API: For persisting session data

Chrome Runtime API: For extension lifecycle management

Key Functions
Bookmark Management (bookmarks.js)
getActiveTab(): Gets the currently active tab

Category-based bookmark creation with folder management

Recursive duplicate detection and removal

Empty folder cleanup

Session Management (sessions.js)
saveSession(): Saves all current tabs

restoreSession(): Restores last saved session

Search (popup.js)
Real-time search across bookmarks and history

Console-based results display

🎨 UI/UX Features
Modern Design: Clean, minimal interface with proper spacing

Keyboard Navigation: Press Enter to activate focused buttons

Responsive Layout: Fixed width (300px) optimized for popup

Visual Feedback: Hover effects and clear button states

Accessibility: Proper focus management and keyboard support

⚠️ Limitations & Considerations
Search Results: Currently displayed in console only (not in UI)

Session Storage: Only one session is stored at a time

No Sync: Data is stored locally, not synced across Chrome instances

No Undo: Cleanup operations (duplicate removal, folder deletion) are permanent

🔮 Future Enhancements
Potential features for future versions:

UI-based search results display

Multiple named sessions

Bookmark import/export functionality

Cloud sync across devices

Batch operations (select multiple bookmarks)

Keyboard shortcuts

Dark mode toggle

Statistics and analytics

🤝 Contributing
Fork the repository

Create a feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.