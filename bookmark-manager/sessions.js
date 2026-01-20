// Save current tabs as a session
document.getElementById("saveSession").addEventListener("click", () => {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    const session = tabs.map(tab => ({
      title: tab.title,
      url: tab.url
    }));

    chrome.storage.local.set({ lastSession: session }, () => {
      console.log("Session saved");
    });
  });
});

// Restore last saved session
document.getElementById("restoreSession").addEventListener("click", () => {
  chrome.storage.local.get("lastSession", (res) => {
    if (!res.lastSession) return;

    res.lastSession.forEach(tab => {
      chrome.tabs.create({ url: tab.url });
    });
  });
});
