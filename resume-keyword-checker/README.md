# 📄 Resume Keyword Checker

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Resume Keyword Checker** is an essential tool for job seekers. It compares your resume text against a specific job description to identify missing keywords. This helps you optimize your resume for Applicant Tracking Systems (ATS) and increases your chances of getting an interview.

### 🚀 Features
- **Keyword Matching**: Scans job descriptions for high-frequency keywords.
- **Match Score**: Gives you a percentage score of how well your resume matches.
- **Missing Keywords**: Highlights critical words found in the JD but missing from your resume.
- **Highlighting**: Visually highlights keywords on the job page itself.

### 🛠️ Tech Stack
- **HTML5**: Popup interface.
- **CSS3**: Highlighting styles and UI.
- **JavaScript (Vanilla)**: Text analysis and frequency counting algorithms.
- **Chrome Extension (Manifest V3)**: Page interaction.

### 📂 Folder Structure
```
resume-keyword-checker/
├── icons/              # Icons
├── content.js          # Text extraction script
├── popup.html          # Main UI
├── background.js       # Worker
└── manifest.json       # Config
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Hit **Load unpacked**.
5.  Select `resume-keyword-checker`.

### 🧠 How It Works
1.  **Input**: You paste your resume text into the extension storage.
2.  **Scan**: On a job post page, the extension extracts the visible text (content script).
3.  **Analysis**: It tokenizes both texts, removes stop words (and, the, a), and finds the intersection of keywords.
4.  **Result**: Displays the match percentage and lists hard skills missing from your resume.

### 🔐 Permissions Explained
- **`activeTab`**: To read the job description from the current tab.
- **`storage`**: To save your resume text so you don't paste it every time.
- **`scripting`**: To highlight keywords directly on the webpage.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Match Report](https://via.placeholder.com/600x400?text=Match+Report)

### 🔒 Privacy Policy
- **Local Storage**: Your resume is stored in your browser's local storage.
- **No Uploads**: We never send your personal resume data to any server.

### 📄 License
This project is licensed under the **MIT License**.
