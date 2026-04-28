# 📝 Text Summarizer

### 🧩 Description
**Text Summarizer** is a productivity tool intended to shorten long paragraphs of text into concise summaries. Paste any article, email, or report into the extension, and it will attempt to extract the key sentences to give you the gist of the content.

### 🚀 Features
- **Simple Interface**: A distraction-free text area.
- **Instant Summary**: Client-side processing for quick results.
- **Copy to Clipboard**: Easily copy the generated summary.
- **Offline Capable**: Works without an internet connection (depending on implementation).

### 🛠️ Tech Stack
- **HTML5**: Text input and output areas.
- **CSS3**: Basic styling.
- **JavaScript (Vanilla)**: Text processing algorithms.
- **Chrome Extension (Manifest V3)**: Deployment format.

### 📂 Folder Structure
```
text-summarizer/
├── manifest.json      # Extension settings
├── popup.html         # User interface
├── popup.js           # Summarization logic
└── style.css          # Styling
```

### ⚙️ Installation (Developer Mode)
1.  Download or clone the repository.
2.  Open Chrome and go to `chrome://extensions`.
3.  Switch on **Developer mode**.
4.  Select **Load unpacked**.
5.  Browse to the `text-summarizer` folder.

### 🧠 How It Works
1.  **Input**: User pastes text into the popup.
2.  **Processing**: The JavaScript logic splits the text into sentences and scores them based on keyword frequency or position (simple extractive summarization).
3.  **Output**: It returns the top-ranked sentences as the summary.

### 🔐 Permissions Explained
- **None**: This extension operates entirely within the popup and requires no special permissions to access web pages.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Summarizer Interface](https://via.placeholder.com/600x400?text=Summarizer+Interface)

### 🔒 Privacy Policy
- **100% Client-Side**: Your text is processed locally in your browser's memory.
- **No Data Storage**: We do not save or upload your text.

### 📄 License
This project is licensed under the **MIT License**.
