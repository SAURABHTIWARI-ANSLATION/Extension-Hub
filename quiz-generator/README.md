# ❓ Quiz Generator

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Quiz Generator** is a fun tool for teachers and students. Create custom quizzes with multiple-choice questions, share them via a generated file, or take them yourself to test your knowledge.

### 🚀 Features
- **Builder**: Easy interface to add questions and answers.
- **Viewer**: Built-in quiz taker interface.
- **Scoring**: Auto-grading at the end of the quiz.
- **Export**: Save quizzes as JSON files.

### 🛠️ Tech Stack
- **HTML5**: Forms.
- **CSS3**: Layouts.
- **JavaScript**: Logic for creation and grading.
- **Chrome Extension (Manifest V3)**: Storage.

### 📂 Folder Structure
```
quiz-generator/
├── viewer.html        # Quiz Player
├── popup.html         # Quiz Builder
├── manifest.json      # Config
└── style.css          # Styling
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `quiz-generator`.

### 🧠 How It Works
1.  **Create**: User builds an array of Question objects.
2.  **Store**: Saves to `chrome.storage`.
3.  **Play**: Loads the array, renders questions one by one, tracks score.

### 🔐 Permissions Explained
- **`storage`**: To save your created quizzes.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Quiz Builder](https://via.placeholder.com/600x400?text=Quiz+Builder)

### 🔒 Privacy Policy
- **Local**: Quizzes created and taken are local relative to your machine.

### 📄 License
This project is licensed under the **MIT License**.
