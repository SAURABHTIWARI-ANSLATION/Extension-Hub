# 🎨 Design Token Generator

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Design Token Generator** is a developer tool that bridges the gap between design and development. It automatically extracts design system tokens—like colors, typography, spacing, and shadows—from any live website and converts them into ready-to-use code formats.

Perfect for developers who need to replicate a design system or designers auditing a website's consistency.

### 🚀 Features
- **Auto-Extraction**: Instantly scans CSS styles to find colors, fonts, spacing, and shadows.
- **Multi-Format Export**: Export tokens as:
    - CSS Variables (`:root`)
    - Tailwind CSS Config
    - JSON (Design System Standard)
    - SCSS Variables
    - Figma Tokens
- **Customizable Scan**: Choose which categories to extract (e.g., only Colors).
- **Preview**: View extracted tokens directly in the popup before exporting.

### 🛠️ Tech Stack
- **HTML5**: Structure.
- **CSS3**: Styling for the popup interface.
- **JavaScript (Vanilla)**: DOM analysis and format conversion logic.
- **Chrome Extension (Manifest V3)**: Extension framework.

### 📂 Folder Structure
```
design-token-generator/
├── icons/                      # Extension icons
├── styles/                     # CSS files
│   ├── content.css
│   └── popup.css
├── templates/                  # Output format templates
│   └── template-generator.js
├── background.js               # Service worker
├── content.js                  # DOM extraction logic
├── manifest.json               # Configuration
├── popup.html                  # UI entry point
└── popup.js                    # UI logic
```

### ⚙️ Installation (Developer Mode)
1.  **Clone** this repository.
2.  Go to `chrome://extensions/` in Chrome.
3.  Enable **Developer mode**.
4.  Click **Load unpacked**.
5.  Select the `design-token-generator` folder.
6.  Start extracting design tokens!

### 🧠 How It Works
1.  **Injection**: The extension injects `content.js` into the active tab.
2.  **Analysis**: The script iterates through the DOM and computed styles (using `getComputedStyle`) to aggregate unique colors, fonts, and spacing values.
3.  **Processing**: It filters and sorts the data by usage frequency.
4.  **Formatting**: The `template-generator.js` converts the raw data into your selected format (CSS, Tailwind, etc.).

### 🔐 Permissions Explained
- **`activeTab`**: To access the DOM and styles of the current page.
- **`scripting`**: To run the extraction scripts on the page.
- **`storage`**: To save your export format preferences.
- **`host_permissions` ("<all_urls>")**: Design tokens can be extracted from any website.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Scanner Interface](https://via.placeholder.com/600x400?text=Scanner+Interface)
![Export Options](https://via.placeholder.com/600x400?text=Export+Options)

### 🔒 Privacy Policy
- **No Analytics**: We do not track your usage.
- **No Servers**: All processing is done locally on your machine.
- **No Data Sharing**: Extracted data stays in your browser.

### 📄 License
This project is licensed under the **MIT License**.
