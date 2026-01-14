# 📝 Markdown Converter

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Markdown Converter** is a dedicated tool for technical writers and developers. It allows you to write Markdown syntax and instantly preview it as formatted HTML. You can then copy the resulting HTML or formatted text for use in emails, blogs, or documentation.

### 🚀 Features
- **Live Preview**: See your Markdown render as you type.
- **Syntax Support**: Headers, Lists, Bold, Italic, Code Blocks, Links, and Images.
- **Copy HTML**: One-click button to copy the generated HTML code.
- **Clean Interface**: Split-screen editor for maximum productivity.

### 🛠️ Tech Stack
- **HTML5**: Editor interface.
- **CSS3**: Markdown styling.
- **JavaScript (Vanilla)**: Markdown parsing engine (or Regex-based parser).
- **Chrome Extension (Manifest V3)**: Extension platform.

### 📂 Folder Structure
```
MarkdownPreview/
├── icon16.png        # Icons
├── icon48.png
├── logo.png
├── index.html        # Main editor UI
├── manifest.json     # Settings
├── script.js         # Converter logic
└── style.css         # Editor styles
```

### ⚙️ Installation (Developer Mode)
1.  Clone the repository.
2.  Navigate to `chrome://extensions/`.
3.  Enable **Developer mode**.
4.  Click **Load unpacked**.
5.  Select the `MarkdownPreview` folder.
6.  Open the extension to start writing!

### 🧠 How It Works
1.  **Input**: User types markdown in the left pane (`textarea`).
2.  **Conversion**: `script.js` listens for input events and runs a parser function to convert Markdown symbols (like `**bold**`, `# Header`) into HTML tags (`<b>bold</b>`, `<h1>Header</h1>`).
3.  **Output**: The resulting HTML is injected into the right pane (`div`) for display.

### 🔐 Permissions Explained
- **`clipboardWrite`**: To allow the "Copy" button to write the formatted HTML to your clipboard.
- **`activeTab`**: Generic permission for popup actions.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Editor View](https://via.placeholder.com/600x400?text=Editor+View)

### 🔒 Privacy Policy
- **Local Processing**: Your drafts are processed locally and are not saved to any server.
- **Secure**: No external scripts are loaded.

### 📄 License
This project is licensed under the **MIT License**.
