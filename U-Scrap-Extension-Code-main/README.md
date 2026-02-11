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

---

## Security & Privacy Architecture

U-Scrap is designed with privacy-first principles and enterprise-grade security:

### 🔒 Privacy Guarantees
- **No automatic background scraping** - Extension only runs when you click "Start Scraping"
- **No remote data transmission** - All data stays on your device
- **No cloud processing** - Everything processed locally in your browser
- **No tracking or analytics** - We don't collect any usage data
- **No third-party services** - Zero external dependencies

### 🛡️ Security Architecture
- **Content script injected dynamically** - No automatic injection on all websites
- **Fully Manifest V3 compliant** - Uses latest Chrome extension security standards
- **CSP-compliant** - No inline scripts or unsafe-eval
- **XSS-safe** - All scraped data sanitized before display using safe DOM methods
- **URL validation** - Only works on http/https websites (blocks chrome://, file://, etc.)
- **Performance limits** - Built-in safeguards prevent browser freeze
- **Timeout protection** - 15-second timeout prevents runaway scraping
- **Retry limits** - Prevents infinite injection loops

### ✅ Chrome Web Store Compliance
- **Minimal permissions** - Only requests activeTab, scripting, storage, downloads
- **User-triggered only** - No background activity without explicit user action
- **Transparent operation** - Clear UI shows exactly what's happening
- **No overbroad permissions** - No `<all_urls>` host permissions
- **Production-grade code** - Enterprise-level error handling and validation

### 🔐 Data Storage
- All scraped data stored locally using Chrome's storage API
- No data leaves your computer unless you explicitly export it
- Export formats: JSON, CSV (saved to your Downloads folder)
- History entries stored locally (can be cleared anytime)

### 🚀 Performance Safety
- DOM query limits (max 1000 paragraphs, 500 headings)
- Email regex scanning only on reasonable text lengths (< 500KB)
- Strict scroll limit (max 20 scrolls) prevents infinite loops
- All intervals and timeouts properly cleaned up

---

### 📄 License
This project is licensed under the **MIT License**.