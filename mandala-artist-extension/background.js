// Background service worker for Mandala Artist

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  // Set default values
  chrome.storage.sync.set({
    symmetry: '6',
    brushSize: '10',
    brushColor: '#ff6b6b',
    backgroundColor: '#ffffff',
    showShadows: true,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowBlur: 10,
    canvasCenterX: 0.5,
    canvasCenterY: 0.5,
    enableMirroring: true,
    brushType: 'round',
    randomColors: false
  });
  
  console.log('Mandala Artist extension installed!');
});

// Context menu for quick access
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "startMandala",
    title: "Start Mandala Drawing",
    contexts: ["page"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "startMandala") {
    chrome.tabs.sendMessage(tab.id, {action: "toggleCanvas"});
  }
});