# 🤖 Smart Auto Form Filler

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Smart Auto Form Filler** automates data entry on web forms. Unlike basic autofill, it allows for custom rules and multiple data sets. Perfect for developers testing registration flows or users repeatedly filling similar forms.

### 🚀 Features
- **Intelligent Filling**: Detects fields like "Name", "Email", "Address".
- **Custom Data**: Define what values to use for specific fields.
- **One-Click**: Fill entire forms instantly.
- **Privacy**: Data stays in your browser.

### 🛠️ Tech Stack
- **JavaScript**: DOM manipulation.
- **Chrome Extension (Manifest V3)**: Scripting.

### 📂 Folder Structure
```
auto-form-filler/
├── manifest.json      # Config
├── popup.html         # UI
├── content.js         # Filler script
└── background.js      # Worker
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `auto-form-filler`.

### 🧠 How It Works
1.  **Mapping**: Uses Regex to match input `name`, `id`, or `placeholder` attributes (e.g., `/email/i`).
2.  **Action**: User clicks "Fill".
3.  **Execute**: Script runs over all `input` elements and sets values based on the matched type.

### 🔐 Permissions Explained
- **`activeTab`**: To interact with the form.
- **`storage`**: To save your fill data preferences.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Filler Action](https://via.placeholder.com/600x400?text=Filler+Action)

### 🔒 Privacy Policy
- **Local Storage**: Personal data is encrypted (if password protected) or stored in local storage.

### 📄 License
This project is licensed under the **MIT License**.
