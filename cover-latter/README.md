✍️ Cover Letter Generator (Chrome Extension)

A simple, fast, and clean Chrome Extension that generates a professional cover letter instantly based on form inputs.
Just enter your details → click Generate → copy or download your formatted cover letter.

✨ Features
🔹 Easy Form-Based Input

Just fill in:

Your Name

Phone

Email

Company Name

Address

Hiring Manager

Job Title

Subject

Experience

Skills

🔹 Instant Cover Letter Generator

One click builds a complete cover letter using your inputs.
No AI, no waiting — everything works offline.

🔹 Save & Restore (Local Storage)

Your last generated letter is automatically saved and restored on extension reload.


popup

🔹 Copy, Download & Reset

Copy the final letter

Download as a .txt file

Reset clears all fields

🔹 Beautiful Blue Gradient UI

Built with a premium, modern theme:
✔ Rounded inputs
✔ Soft gradients
✔ Smooth shadows
✔ Responsive layout


style

📁 Project Structure
CoverLetterGenerator/
│── manifest.json
│── popup.html
│── popup.js
│── style.css
│── icons/
│     ├── icon16.png
│     ├── icon48.png
│     ├── icon128.png

🧠 How It Works

User fills out the form

popup.js collects all data → builds a formatted cover letter
(Name & Job Title are required)

Output is displayed inside <pre>

User can:

Copy

Download

Reset

Chrome local storage remembers the last generated letter

🔧 Manifest (MV3)

From your uploaded manifest.json:


manifest

{
  "manifest_version": 3,
  "name": "Cover Letter Generator (Form Based)",
  "description": "Fill details and instantly generate a professional cover letter.",
  "version": "1.0",
  "action": {
    "default_popup": "popup.html"
  },
  "permissions": ["storage"]
}

🚀 Installation (Developer Mode)

Download or clone this repository

Open Chrome → go to chrome://extensions/

Enable Developer Mode

Click Load unpacked

Select the extension folder

Done! The extension will now appear in your toolbar.

🛠 Technologies Used

HTML5 (Form UI)

CSS3 (Blue gradient styling)

JavaScript (popup.js logic)

Chrome Local Storage API

📌 Future Improvements (Optional)

If you want, I can help you add:

AI-generated improved cover letters

Templates (short, detailed, modern, creative)

PDF download option

Auto-save field inputs

Multiple letter profiles

🧡 License

MIT — free to use, modify, and publish.