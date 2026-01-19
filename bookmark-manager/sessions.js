document.getElementById("saveSession").onclick = () => {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    const session = tabs.map(tab => tab.url);
    chrome.storage.local.set({ lastSession: session });
  });
};

document.getElementById("restoreSession").onclick = () => {
  chrome.storage.local.get("lastSession", (res) => {
    (res.lastSession || []).forEach(url => {
      chrome.tabs.create({ url });
    });
  });
};
