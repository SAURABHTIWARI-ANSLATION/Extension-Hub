// Create floating search box
class QuickSearchPopup {
  constructor() {
    this.selectedText = '';
    this.createPopup();
    this.setupListeners();
  }

  createPopup() {
    // Remove existing popup
    const existing = document.getElementById('quick-search-popup');
    if (existing) existing.remove();

    // Create popup element
    this.popup = document.createElement('div');
    this.popup.id = 'quick-search-popup';
    this.popup.innerHTML = `
      <div class="quick-search-header">
        <h3>🔍 Quick Search</h3>
        <button class="close-btn">×</button>
      </div>
      <div class="quick-search-body">
        <div class="selected-text">
          <label>Selected Text:</label>
          <input type="text" id="quick-search-text" placeholder="Select text first..." readonly>
        </div>
        
        <div class="search-options">
          <h4>Search On:</h4>
          <div class="engine-buttons">
            <button class="engine-btn" data-engine="google">🔎 Google</button>
            <button class="engine-btn" data-engine="youtube">▶️ YouTube</button>
            <button class="engine-btn" data-engine="wikipedia">📚 Wikipedia</button>
            <button class="engine-btn" data-engine="amazon">🛒 Amazon</button>
            <button class="engine-btn" data-engine="github">💻 GitHub</button>
            <button class="engine-btn" data-engine="stackoverflow">❓ StackOverflow</button>
            <button class="engine-btn" data-engine="twitter">🐦 Twitter</button>
            <button class="engine-btn" data-engine="reddit">👥 Reddit</button>
            <button class="engine-btn" data-engine="images">🖼️ Images</button>
            <button class="engine-btn" data-engine="translate">🌐 Translate</button>
          </div>
        </div>
        
        <div class="custom-search">
          <h4>Custom Search:</h4>
          <div class="custom-input">
            <input type="text" id="custom-url" placeholder="https://example.com/search?q=%s">
            <button id="custom-search-btn">Search</button>
          </div>
          <small>Use %s for search text placeholder</small>
        </div>
      </div>
    `;

    document.body.appendChild(this.popup);
    this.positionPopup();
  }

  positionPopup() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      this.popup.style.position = 'absolute';
      this.popup.style.top = (rect.bottom + window.scrollY + 10) + 'px';
      this.popup.style.left = (rect.left + window.scrollX) + 'px';
      this.popup.style.zIndex = '10000';
    }
  }

  setupListeners() {
    // Close button
    this.popup.querySelector('.close-btn').addEventListener('click', () => {
      this.hide();
    });

    // Engine buttons
    this.popup.querySelectorAll('.engine-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const engine = e.target.dataset.engine;
        this.performSearch(engine);
      });
    });

    // Custom search button
    this.popup.querySelector('#custom-search-btn').addEventListener('click', () => {
      this.performCustomSearch();
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this.popup.contains(e.target)) {
        this.hide();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    });

    // Update selected text
    this.updateSelectedText();
  }

  updateSelectedText() {
    const text = window.getSelection().toString().trim();
    this.selectedText = text;
    const input = this.popup.querySelector('#quick-search-text');
    input.value = text || 'No text selected';
  }

  performSearch(engine) {
    if (!this.selectedText) {
      alert('Please select some text first!');
      return;
    }

    const searchUrls = {
      google: `https://www.google.com/search?q=${encodeURIComponent(this.selectedText)}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(this.selectedText)}`,
      wikipedia: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(this.selectedText)}`,
      amazon: `https://www.amazon.com/s?k=${encodeURIComponent(this.selectedText)}`,
      github: `https://github.com/search?q=${encodeURIComponent(this.selectedText)}`,
      stackoverflow: `https://stackoverflow.com/search?q=${encodeURIComponent(this.selectedText)}`,
      twitter: `https://twitter.com/search?q=${encodeURIComponent(this.selectedText)}`,
      reddit: `https://www.reddit.com/search/?q=${encodeURIComponent(this.selectedText)}`,
      translate: `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(this.selectedText)}`,
      images: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(this.selectedText)}`
    };

    if (searchUrls[engine]) {
      window.open(searchUrls[engine], '_blank');
      this.hide();
    }
  }

  performCustomSearch() {
    if (!this.selectedText) {
      alert('Please select some text first!');
      return;
    }

    const urlInput = this.popup.querySelector('#custom-url');
    let url = urlInput.value.trim();
    
    if (!url) {
      alert('Please enter a search URL');
      return;
    }

    if (!url.includes('%s')) {
      url += (url.includes('?') ? '&' : '?') + 'q=%s';
    }

    const finalUrl = url.replace('%s', encodeURIComponent(this.selectedText));
    window.open(finalUrl, '_blank');
    this.hide();
  }

  show(text = '') {
    if (text) this.selectedText = text;
    this.popup.style.display = 'block';
    this.updateSelectedText();
  }

  hide() {
    if (this.popup) {
      this.popup.style.display = 'none';
    }
  }
}

// Initialize popup
let quickSearchPopup = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "showQuickSearchPopup") {
    if (!quickSearchPopup) {
      quickSearchPopup = new QuickSearchPopup();
    }
    
    if (message.text) {
      quickSearchPopup.selectedText = message.text;
    }
    
    quickSearchPopup.show();
    sendResponse({ success: true });
  }
});

// Listen for text selection (show popup automatically)
document.addEventListener('mouseup', (e) => {
  const selectedText = window.getSelection().toString().trim();
  
  if (selectedText && selectedText.length > 2 && selectedText.length < 100) {
    // Show after a short delay
    setTimeout(() => {
      if (quickSearchPopup) {
        quickSearchPopup.selectedText = selectedText;
        quickSearchPopup.show();
      }
    }, 300);
  }
});

// Add CSS
const style = document.createElement('style');
style.textContent = `
  #quick-search-popup {
    display: none;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    width: 350px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border: 1px solid #e0e0e0;
    z-index: 10000;
  }
  
  .quick-search-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 20px;
    border-radius: 12px 12px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .quick-search-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
  
  .close-btn {
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
  }
  
  .close-btn:hover {
    background: rgba(255,255,255,0.3);
  }
  
  .quick-search-body {
    padding: 20px;
  }
  
  .selected-text {
    margin-bottom: 20px;
  }
  
  .selected-text label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
    font-size: 14px;
  }
  
  #quick-search-text {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    background: #f8f9fa;
  }
  
  .search-options h4, .custom-search h4 {
    margin: 0 0 12px 0;
    color: #333;
    font-size: 14px;
  }
  
  .engine-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 20px;
  }
  
  .engine-btn {
    padding: 10px;
    border: 1px solid #e0e0e0;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    text-align: left;
    transition: all 0.2s;
  }
  
  .engine-btn:hover {
    background: #f5f5f5;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  .custom-input {
    display: flex;
    gap: 10px;
    margin-bottom: 8px;
  }
  
  #custom-url {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
  }
  
  #custom-search-btn {
    padding: 10px 20px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  }
  
  #custom-search-btn:hover {
    background: #45a049;
  }
  
  small {
    color: #666;
    font-size: 12px;
  }
`;
document.head.appendChild(style);