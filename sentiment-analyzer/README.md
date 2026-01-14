# 😊 Sentiment Analyzer

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Sentiment Analyzer** helps you understand the emotional tone of any text. Whether analyzing an email, a tweet, or a review, simply paste the text to see if it's Positive, Negative, or Neutral. Great for social media managers and writers.

### 🚀 Features
- **Tone Analysis**: Detects Positive, Negative, and Neutral sentiments.
- **Score**: Provides a confidence score for the analysis.
- **History**: Keeps a log of your past analyses.
- **Visuals**: Color-coded results (Green, Red, Gray).
- **Export**: Download your analysis history.

### 🛠️ Tech Stack
- **HTML5**: Analyzer UI.
- **JavaScript**: Sentiment analysis library (e.g., VADER or AFINN based).
- **Chrome Extension (Manifest V3)**: Storage.

### 📂 Folder Structure
```
sentiment-analyzer/
├── manifest.json      # Config
├── popup.html         # UI
├── popup.js           # Logic
└── style.css          # Styles
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `sentiment-analyzer`.

### 🧠 How It Works
1.  **Input**: User pastes text into the analyzer.
2.  **Tokenize**: Splits text into words.
3.  **Score**: Matches words against a sentiment lexicon/dictionary to calculate a total score.
4.  **Classify**: Determines sentiment based on the score threshold.

### 🔐 Permissions Explained
- **`storage`**: To save your analysis history.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Sentiment Score](https://via.placeholder.com/600x400?text=Sentiment+Score)

### 🔒 Privacy Policy
- **Local**: All analysis runs locally in your browser.
- **No API**: No external calls are made.

### 📄 License
This project is licensed under the **MIT License**.
