# 🛒 Grocery List Builder

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Grocery List Builder** is a clean and simple shopping companion. Organize your grocery needs before you head to the store. With a modern, intuitive interface, adding and checking off items is satisfying and efficient.

### 🚀 Features
- **Easy Add**: Quickly type and hit enter to add items.
- **Check-off**: Mark items as bought.
- **Persistent**: Remembers your list until you clear it.
- **Clean UI**: A focused interface for better organization.

### 🛠️ Tech Stack
- **HTML5**: List structure.
- **CSS3**: Modern styling.
- **JavaScript (Vanilla)**: List logic and storage.
- **Chrome Extension (Manifest V3)**: Storage.

### 📂 Folder Structure  
```
GroceryListBuilder/
├── manifest.json      # Config
├── popup.html         # UI
├── popup.js           # Logic
└── style.css          # Styling
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Turn on **Developer mode**.
4.  Load unpacked -> `GroceryListBuilder`.

### 🧠 How It Works
1.  **Input**: Adds text input to a DOM list.
2.  **State**: Toggles a 'completed' class on click.
3.  **Storage**: Syncs the HTML state or data array to local storage.

### 🔐 Permissions Explained
- **`storage`**: To ensure your grocery list survives a browser restart.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Shopping List](https://via.placeholder.com/600x400?text=Shopping+List)

### 🔒 Privacy Policy
- **Offline**: Your shopping habits are your business. Data is local.

### 📄 License
This project is licensed under the **MIT License**.
