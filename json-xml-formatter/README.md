# 👩‍💻 JSON/XML Formatter

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**JSON/XML Formatter** is a developer's best friend. It automatically detects raw JSON or XML content returned by APIs and reformats it into a beautiful, readable, and collapsible tree view. Say goodbye to messy blobs of text and hello to structured data.

### 🚀 Features
- **Auto-Detection**: Automatically runs when a page contains valid JSON or XML.
- **Syntax Highlighting**: Color-coded keys, strings, numbers, and booleans.
- **Collapsible Trees**: Expand or collapse objects and arrays for easier navigation.
- **Clickable Links**: Detects URLs in the data and makes them clickable.
- **Dark/Light Mode**: toggles between themes.

### 🛠️ Tech Stack
- **HTML5**: Structure.
- **CSS3**: Syntax highlighting themes.
- **JavaScript (Vanilla)**: Parsing and rendering logic.
- **Chrome Extension (Manifest V3)**: Content scripts and background workers.

### 📂 Folder Structure
```
json-xml-formatter/
├── assets/              # Static assets
├── icons/               # Icons
├── background.js        # Service worker
├── content-script.js    # Logic to format page content
├── manifest.json        # Config
├── popup.html           # Settings popup
├── theme.css            # Syntax highlighting styles
└── settings.html        # Options page
```

### ⚙️ Installation (Developer Mode)
1.  Clone this repository.
2.  Go to `chrome://extensions/`.
3.  Turn on **Developer mode**.
4.  Click **Load unpacked**.
5.  Select the `json-xml-formatter` folder.

### 🧠 How It Works
1.  **Interception**: The extension checks the DOM or MIME type of the loaded page.
2.  **Parsing**: If valid JSON/XML is found, it parses the text string into a JavaScript Object or DOM Tree.
3.  **Rendering**: It replaces the raw text body with a structured HTML representation with event listeners for collapsing nodes.

### 🔐 Permissions Explained
- **`activeTab`**: To format the current tab.
- **`host_permissions` ("<all_urls>")**: To run on any API endpoint or website serving raw data.
- **`storage`**: To save your theme preferences (Dark/Light).
- **`declarativeNetRequest`**: To modify headers if necessary for proper rendering (e.g., bypassing CSP for local styles).

### 📸 Screenshots
*(Placeholder for screenshots)*
![Formatted JSON](https://via.placeholder.com/600x400?text=Formatted+JSON)

### 🔒 Privacy Policy
- **No Data Collection**: The formatting happens entirely client-side.
- **Safe**: Your API data is never sent to us.

### 📄 License
This project is licensed under the **MIT License**.
