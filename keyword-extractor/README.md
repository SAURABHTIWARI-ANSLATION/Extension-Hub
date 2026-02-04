# 🗝️ Keyword Extractor


### 🧩 Description
**Keyword Extractor** is a powerful SEO and research tool. Instantly analyze the current webpage to find the most frequent and relevant keywords. Perfect for content creators, marketers, and students who need to grasp the core topics of a text quickly.

### 🚀 Features
- **Frequency Analysis**: Counts word occurrences.
- **Stop Word Removal**: Filters out common words (the, and, is) to focus on meaning.
- **Top List**: Displays the top 10/20 keywords.
- **Export**: Copy results to clipboard.

### 🛠️ Tech Stack
- **HTML5**: Results view.
- **JavaScript**: Text processing algorithms.
- **Chrome Extension (Manifest V3)**: Scripting API.

### 📂 Folder Structure
```
keyword-extractor/
├── manifest.json      # Config
├── popup.html         # UI
├── popup.js           # Logic
└── style.css          # Styling
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `keyword-extractor`.

### 🧠 How It Works
1.  **Extract**: `content.js` or `scripting.executeScript` grabs `document.body.innerText`.
2.  **Clean**: Removes punctuation, numbers, and stop words.
3.  **Count**: Maps words to frequency counts.
4.  **Sort**: Orders by count and displays the top results.

### 🔐 Permissions Explained
- **`activeTab`**: To read the content of the tab you are analyzing.
- **`scripting`**: To execute the extraction script.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Keyword List](https://via.placeholder.com/600x400?text=Keyword+List)

### 🔒 Privacy Policy
- **Local**: Text analysis happens in your browser.
- **No Data**: We do not store the analyzed text.

### 📄 License
This project is licensed under the **MIT License**.
