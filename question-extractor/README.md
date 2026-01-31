📝 Auto Question Extractor
👨‍💻 Made by Raman Vanjare
🧩 Description
Auto Question Extractor is a powerful Chrome extension designed for students, researchers, and lifelong learners. It automatically transforms dense webpage content or pasted notes into a structured list of questions and answers. Whether you are preparing for an exam or trying to summarize a long article, this tool helps identify key definitions and causal relationships instantly.

🚀 Features
Smart Selection: Grab text directly from any webpage using the "Use selected text" feature.

Automated Q&A: Uses internal logic to detect definitions ("is/are"), processes, and explanations ("because").

Custom Input: A dedicated text area allows you to paste and process your own notes or textbook content.

One-Click Export: Easily copy all generated questions to your clipboard for use in study apps like Anki or Notion.

Length Control: Automatically normalizes text and limits output to the top 10 most relevant questions to prevent information overload.

🛠️ Tech Stack
HTML5: Popup structure and semantic sections.

CSS3: Minimalist, high-contrast UI design.

JavaScript (Vanilla): Core extraction logic and DOM manipulation.

Chrome Extension (Manifest V3): Built on the latest, more secure extension standard.

📂 Folder Structure
Auto-Question-Extractor/
├── manifest.json      # Extension configuration and permissions
├── content.js         # Text selection and cleaning script
├── popup.html         # User interface structure
├── popup.js           # Generation logic and UI events
└── popup.css          # Styling and layout
⚙️ Installation (Developer Mode)
Clone or download this repository.

Open Chrome and navigate to chrome://extensions/.

Enable Developer mode in the top-right corner.

Click Load unpacked.

Select the Auto-Question-Extractor folder.

Pin the extension to your toolbar for easy access!

🧠 How It Works
Capture: The content.js script identifies the text you have highlighted on the page.

Clean: The extension removes extra white space and newlines to ensure clean formatting.

Analyze: The generateQuestions function scans the text for keywords like "is", "process", or "because".

Render: Results are instantly displayed in the popup as a numbered list of Q&A pairs.

🔐 Permissions Explained
activeTab: Used to interact with the page you are currently viewing.

scripting: Required to inject the extraction script into the webpage to "read" your selection.

📄 License
This project is licensed under the MIT License.