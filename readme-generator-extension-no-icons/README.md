# 📝 README.md Generator

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**README.md Generator** is the very tool used to document projects like this one! It provides a template-based interface to generate professional, standard-compliant `README.md` files for your GitHub projects. Fill in the blanks, and get perfect Markdown instantly.

### 🚀 Features
- **Templates**: Structured sections for Features, Installation, Tech Stack, etc.
- **Live Preview**: See how the markdown renders.
- **One-Click Copy**: Grab the raw markdown code.
- **Offline**: Works entirely without an internet connection.

### 🛠️ Tech Stack
- **HTML5**: Form inputs.
- **CSS3**: Styles.
- **JavaScript**: String concatenation and template logic.
- **Chrome Extension (Manifest V3)**: Popup.

### 📂 Folder Structure
```
readme-generator-extension-no-icons/
├── popup.html         # Generator Form
├── popup.js           # Template Logic
├── options.html       # Settings
└── manifest.json      # Config
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `readme-generator-extension-no-icons`.

### 🧠 How It Works
1.  **Input**: User fills defined text fields (Title, Description, etc.).
2.  **Generate**: JS replaces placeholders in a Markdown string template with user input.
3.  **Output**: Displays the result in a text area.

### 🔐 Permissions Explained
- **`storage`**: To verify or save your default templates.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Generator UI](https://via.placeholder.com/600x400?text=Generator+UI)

### 🔒 Privacy Policy
- **Private**: No data collection. Generates text locally.

### 📄 License
This project is licensed under the **MIT License**.
