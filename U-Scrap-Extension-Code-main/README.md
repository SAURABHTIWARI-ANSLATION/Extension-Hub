# 🕷️ Quick Web Scraper

## 👨‍💻 Made by Saurabh Tiwari

### 🧩 Description
**Quick Web Scraper (U-Scrap)** democratizes data extraction. Turn any website into a spreadsheet without writing a single line of code. Simply define what you want to scrape by clicking on elements, and export the structured data to CSV or JSON.

### 🚀 Features
- **Visual Selector**: Point and click to select elements (e.g., product titles, prices).
- **Auto-Pagination**: Crawl multiple pages automatically.
- **Instant Export**: Download data as CSV or JSON.
- **Templates**: Save scraping recipes for favorite sites.

### 🛠️ Tech Stack
- **HTML5**: Dashboard.
- **CSS3**: Selector overlay styles.
- **JavaScript**: DOM traversal and data extraction.
- **Chrome Extension (Manifest V3)**: Scripts and Downloads API.

### 📂 Folder Structure
```
U-Scrap-Extension-Code-main/
├── icons/             # Icons
├── content.js         # Selector logic
├── background.js      # Export handler
├── popup.html         # UI
└── manifest.json      # Config
```

### ⚙️ Installation (Developer Mode)
1.  Clone repo.
2.  Go to `chrome://extensions`.
3.  Enable **Developer mode**.
4.  Load unpacked -> `U-Scrap-Extension-Code-main`.

### 🧠 How It Works
1.  **Selection**: User activates "Select Mode". Extension highlights DOM elements under cursor.
2.  **Pattern Matching**: When an element is clicked, it identifies the CSS selector.
3.  **Extraction**: It queries all matching elements and extracts `innerText` or `href`.
4.  **Export**: Converts the array of objects to a CSV string and triggers a download.

### 🔐 Permissions Explained
- **`activeTab`**: To scrape the current page.
- **`downloads`**: To save the extracted data file to your computer.
- **`storage`**: To save your scraping templates.

### 📸 Screenshots
*(Placeholder for screenshots)*
![Scraper Interface](https://via.placeholder.com/600x400?text=Scraper+Interface)

### 🔒 Privacy Policy
- **Your Data**: Scraped data is saved directly to your Downloads folder.
- **No Cloud**: We do not see what you scrape.

### 📄 License
This project is licensed under the **MIT License**.