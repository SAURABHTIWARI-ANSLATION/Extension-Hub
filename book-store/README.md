📚 Mini Book Store

👨‍💻 Made by Raman Vanjare

🧩 Description

Mini Book Store is a feature-rich Chrome extension that brings a curated library of classic literature, philosophy, and spiritual texts directly to your browser. It serves as a portable digital bookshelf, allowing users to discover and read free PDFs without leaving their workspace.

🚀 Features

Curated Library: Instant access to over 20+ timeless titles, including The Art of War, Meditations, and the Complete Works of Swami Vivekananda.

Built-in Reader: Opens books in a custom, distraction-free internal PDF viewer instead of cluttered browser tabs.

Search Functionality: Quickly find books by title or author with a real-time filtering system.

Favorites System: Save your favorite books using Chrome's local storage so they remain marked even after closing the browser.

Clean UI: A modern, mobile-inspired interface with smooth transitions and easy navigation.

🛠️ Tech Stack
HTML5: Structured popup and reader interfaces.

CSS3: Responsive design with a custom scrollbar and polished "Book Card" components.

JavaScript (Vanilla): Dynamic rendering, search logic, and tab management.

Chrome Extension (Manifest V3): Utilizes the latest extension architecture for better performance and security.

📂 Folder Structure

Mini-Book-Store/
├── manifest.json      # Metadata and permissions (storage, tabs)
├── popup.html         # Main library interface
├── popup.js           # Library logic and search filtering
├── popup.css          # Modern UI styling
├── reader.html        # Custom PDF viewer container
├── reader.js          # Logic to load selected book via URL parameters
└── icons/             # Extension icons (16, 48, 128)

⚙️ Installation (Developer Mode)
Download the source code folder.

Open Chrome and navigate to chrome://extensions/.

Enable Developer mode via the toggle in the top right.

Click Load unpacked.

Select the Mini-Book-Store folder.

Click the extension icon to start reading!

🧠 How It Works

Data Management: The extension maintains a local database of book metadata and hosted PDF links.

Storage: It uses chrome.storage.local to persist your "Favorite" (❤️) selections across sessions.

Dynamic Routing: When a user clicks "Read," the extension generates a unique URL for reader.html containing the book's link as a parameter, which the reader then loads into an iframe.

🔐 Permissions Explained

storage: Used to save your favorited books locally on your device.

tabs: Required to open the custom reader in a new browser tab.

📄 License

This project is licensed under the MIT License.