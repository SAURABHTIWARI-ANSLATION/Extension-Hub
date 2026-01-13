// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  // Remove existing items first
  chrome.contextMenus.removeAll(() => {
    // Create parent menu
    chrome.contextMenus.create({
      id: "quick-search-parent",
      title: "🔍 Quick Search",
      contexts: ["selection"]
    });

    // Create search options
    const searchEngines = [
      { id: "google", title: "Google Search", icon: "🔎", url: "https://www.google.com/search?q=%s" },
      { id: "youtube", title: "YouTube Search", icon: "▶️", url: "https://www.youtube.com/results?search_query=%s" },
      { id: "wikipedia", title: "Wikipedia", icon: "📚", url: "https://en.wikipedia.org/wiki/Special:Search?search=%s" },
      { id: "amazon", title: "Amazon Search", icon: "🛒", url: "https://www.amazon.com/s?k=%s" },
      { id: "github", title: "GitHub Search", icon: "💻", url: "https://github.com/search?q=%s" },
      { id: "stackoverflow", title: "StackOverflow", icon: "❓", url: "https://stackoverflow.com/search?q=%s" },
      { id: "twitter", title: "Twitter Search", icon: "🐦", url: "https://twitter.com/search?q=%s" },
      { id: "reddit", title: "Reddit Search", icon: "👥", url: "https://www.reddit.com/search/?q=%s" },
      { id: "translate", title: "Google Translate", icon: "🌐", url: "https://translate.google.com/?sl=auto&tl=en&text=%s" },
      { id: "images", title: "Google Images", icon: "🖼️", url: "https://www.google.com/search?tbm=isch&q=%s" }
    ];

    searchEngines.forEach(engine => {
      chrome.contextMenus.create({
        id: engine.id,
        parentId: "quick-search-parent",
        title: `${engine.icon} ${engine.title}`,
        contexts: ["selection"]
      });
    });

    // Separator
    chrome.contextMenus.create({
      id: "separator",
      type: "separator",
      parentId: "quick-search-parent",
      contexts: ["selection"]
    });

    // Custom search option
    chrome.contextMenus.create({
      id: "custom-search",
      parentId: "quick-search-parent",
      title: "➕ Add Custom Search",
      contexts: ["selection"]
    });

    console.log("Quick Search extension installed!");
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText.trim();
  
  if (!selectedText) return;

  const searchUrls = {
    google: `https://www.google.com/search?q=${encodeURIComponent(selectedText)}`,
    youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(selectedText)}`,
    wikipedia: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(selectedText)}`,
    amazon: `https://www.amazon.com/s?k=${encodeURIComponent(selectedText)}`,
    github: `https://github.com/search?q=${encodeURIComponent(selectedText)}`,
    stackoverflow: `https://stackoverflow.com/search?q=${encodeURIComponent(selectedText)}`,
    twitter: `https://twitter.com/search?q=${encodeURIComponent(selectedText)}`,
    reddit: `https://www.reddit.com/search/?q=${encodeURIComponent(selectedText)}`,
    translate: `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(selectedText)}`,
    images: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(selectedText)}`
  };

  if (info.menuItemId === "custom-search") {
    // Open popup for custom search
    chrome.tabs.sendMessage(tab.id, {
      type: "showQuickSearchPopup",
      text: selectedText
    });
  } 
  else if (searchUrls[info.menuItemId]) {
    // Open search in new tab
    chrome.tabs.create({
      url: searchUrls[info.menuItemId],
      active: true
    });
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === "quick-search") {
    // Get active tab and send message to show popup
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "showQuickSearchPopup"
        });
      }
    });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "performSearch") {
    const url = message.url.replace("%s", encodeURIComponent(message.text));
    chrome.tabs.create({
      url: url,
      active: true
    });
    sendResponse({ success: true });
  }
  
  if (message.type === "saveCustomEngine") {
    chrome.storage.local.get(["customEngines"], (data) => {
      const engines = data.customEngines || [];
      engines.push(message.engine);
      chrome.storage.local.set({ customEngines: engines });
      sendResponse({ success: true });
    });
    return true;
  }
});