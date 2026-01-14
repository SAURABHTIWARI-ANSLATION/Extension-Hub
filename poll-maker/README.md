# 📊 Poll Maker

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Poll Maker** allows you to create quick polls and surveys directly from your browser. Whether you're deciding on lunch or gathering feedback, generate a poll and share the link (or collect votes locally) in seconds.

### 🚀 Features
- **Create**: Add questions and multiple options.
- **Vote**: Interface to select an option.
- **Results**: Real-time bar chart of votes.
- **History**: View past polls.

### 🛠️ Tech Stack
- **HTML5**: Form builder.
- **CSS3**: Chart styling.
- **JavaScript**: Voting logic.
- **Chrome Extension (Manifest V3)**: Storage.

### 📂 Folder Structure
```
poll-maker/
├── manifest.json      # Config
├── popup.html         # UI
├── popup.js           # Logic
└── style.css          # Styles
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `poll-maker`.

### 🧠 How It Works
1.  **Draft**: User enters a question and options.
2.  **Save**: Poll object is saved to `chrome.storage`.
3.  **Interact**: User clicks an option, updating the count in the stored object.

### 🔐 Permissions Explained
- **`storage`**: To persist your polls and vote counts.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Poll Results](https://via.placeholder.com/600x400?text=Poll+Results)

### 🔒 Privacy Policy
- **Local**: Votes are stored on your machine (unless an external backend is configured).

### 📄 License
This project is licensed under the **MIT License**.
