🔍 SEO Tracker (Chrome Extension)

SEO Tracker is a lightweight Chrome extension that analyzes on-page SEO health of the currently opened website in one click.
It runs entirely locally, requires no external APIs, and gives an instant SEO score out of 100 with actionable warnings.

🚀 Features

🔍 One-click SEO analysis of the active tab

🧠 Automatic SEO score (0–100)

🏷️ Title tag length check (30–60 chars)

📝 Meta description presence & length (70–160 chars)

🧱 Heading structure audit (H1–H6)

🖼️ Image ALT attribute detection

📄 Total word count analysis

⚠️ Clear SEO warnings & best-practice hints

⚡ Runs fully on the client (privacy-safe)

📊 SEO Scoring Logic

The SEO score is calculated out of 100 points, with 20 points each for:

Check	Condition
Title	30–60 characters
Meta Description	70–160 characters
Headings	Exactly 1 H1
Images	No missing ALT attributes
Content Length	≥ 300 words
🧠 How It Works

User clicks “Analyze Current Page”

popup.js sends a message to the content script

content.js extracts SEO data directly from the DOM

Data is scored, rendered, and warnings are displayed instantly

No data leaves your browser at any point.

🛠️ Tech Stack

Chrome Extension (Manifest V3)

JavaScript (Vanilla)

HTML5

CSS3

Chrome scripting & activeTab APIs

Content Scripts

📦 Installation (Local Development)

Clone the repository:

git clone https://github.com/your-username/seo-tracker.git


Open Chrome and navigate to:

chrome://extensions


Enable Developer mode (top-right)

Click Load unpacked

Select the project folder

✅ The SEO Tracker icon will appear in your toolbar.

📁 Project Structure
SEO-Tracker/
│
├── manifest.json        # Extension configuration (MV3)
├── content.js           # Extracts SEO data from webpages
├── popup.html           # Extension UI
├── popup.js             # UI logic & scoring
├── style.css            # UI styling
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png

🔐 Permissions Explained
Permission	Purpose
activeTab	Analyze the currently open webpage
scripting	Communicate with content scripts

🔒 No tracking. No analytics. No data collection.

🎨 UI Highlights

Clean MVP-style layout

SEO score indicator with color feedback:

🟢 Green ≥ 80

🟡 Yellow 50–79

🔴 Red < 50

Clear issue list with emoji-based warnings

Responsive popup (320px width)

🌟 Planned Enhancements

📊 Detailed SEO breakdown per section

🚀 Page speed & performance hints

🔍 Keyword density analysis

📋 Export SEO report (TXT / PDF)

🌙 Dark mode

⭐ Overall SEO health badge

🧩 Chrome Web Store

Fully compatible with Manifest V3

Uses only essential permissions

Privacy-safe and store-ready

📄 License

MIT License
Free to use, modify, and distribute.