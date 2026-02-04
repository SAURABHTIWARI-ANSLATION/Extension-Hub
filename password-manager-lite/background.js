// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    // Popup will open automatically
    console.log('Password Manager opened via keyboard shortcut');
  }
});

// Listen for tab updates to suggest saving passwords
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is a login page
    const url = new URL(tab.url);
    if (url.pathname.includes('login') || 
        url.pathname.includes('signin') ||
        url.search.includes('login')) {
      
      // Can send message to content script
      chrome.tabs.sendMessage(tabId, {
        action: 'detectLoginPage',
        url: tab.url
      });
    }
  }
});