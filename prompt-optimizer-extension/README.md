# 🤖 Prompt Optimizer - AI Prompt Assistant

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Prompt Optimizer** is a powerful sidekick for AI users. It integrates directly with ChatGPT, Claude, Bard, and other LLM platforms to help you refine your prompts before you send them. Transform vague requests into structured, high-quality prompts that yield better results.

### 🚀 Features
- **Optimization Templates**: Choose from frameworks like "Role-Task-Format" or "Chain of Thought".
- **Tone Adjustment**: Quickly change the tone of your prompt (Professional, Creative, Concise).
- **Direct Integration**: Adds a helper button or context menu inside ChatGPT/Claude.
- **Library**: Save your favorite prompts for reuse.

### 🛠️ Tech Stack
- **HTML5**: UI elements.
- **CSS3**: Theming matches the AI platform.
- **JavaScript (Vanilla)**: DOM manipulation and prompt string processing.
- **Chrome Extension (Manifest V3)**: Content scripts for injection.

### 📂 Folder Structure
```
prompt-optimizer-extension/
├── images/             # Icons
├── themes/             # CSS Themes
├── content.js          # Injection script
├── background.js       # Background logic
├── popup.html          # Extension popup
└── manifest.json       # Config
```

### ⚙️ Installation (Developer Mode)
1.  Clone this repository.
2.  Open `chrome://extensions/`.
3.  Toggle **Developer mode**.
4.  Click **Load unpacked**.
5.  Select the `prompt-optimizer-extension` folder.
6.  Open ChatGPT or Claude to see it in action.

### 🧠 How It Works
1.  **Injection**: `content.js` matches against AI chatbot URLs (openai.com, anthropic.com, etc.).
2.  **DOM Insertion**: It looks for the text input area and injects an overlay or button.
3.  **Rewrite Logic**: When clicked, it takes the user's current draft and applies string manipulation rules (or calls an API if configured) to enhance structure and clarity.

### 🔐 Permissions Explained
- **`activeTab`**: To interact with the AI chat page.
- **`scripting`**: To inject the optimization UI.
- **`storage`**: To save your custom templates and preferences.
- **`host_permissions`**: Needs access to `*.openai.com`, `*.anthropic.com` etc. to function on those sites.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Optimizer Button](https://via.placeholder.com/600x400?text=Optimizer+Button)

### 🔒 Privacy Policy
- **No Logging**: We do not log your prompts.
- **Local Processing**: Unless you use an external API feature, all string optimization happens locally.

### 📄 License
This project is licensed under the **MIT License**.
