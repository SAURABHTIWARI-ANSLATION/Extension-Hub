// ================================
// POPUP MAIN CONTROLLER
// ================================

// Keyboard navigation (Enter key support)
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const active = document.activeElement;
    if (active && active.tagName === "INPUT") {
      active.blur();
    }
  }
});

// ================================
// SEARCH BOOKMARKS & HISTORY
// ================================
const searchInput = document.getElementById("search");

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();

    if (!query) return;

    chrome.bookmarks.search(query, (bookmarks) => {
      console.clear();
      console.log("Bookmarks:");
      bookmarks.forEach(b => {
        if (b.url) console.log(b.title, "-", b.url);
      });
    });

    chrome.history.search(
      { text: query, maxResults: 5 },
      (historyItems) => {
        console.log("History:");
        historyItems.forEach(h => console.log(h.title, "-", h.url));
      }
    );
  });
}

// ================================
// SAVE TABS AS SESSION
// ================================
document.getElementById("saveSession")?.addEventListener("click", () => {
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

// ================================
// RESTORE LAST SESSION
// ================================
document.getElementById("restoreSession")?.addEventListener("click", () => {
  chrome.storage.local.get("lastSession", (res) => {
    if (!res.lastSession) return;

    res.lastSession.forEach(tab => {
      chrome.tabs.create({ url: tab.url });
    });
  });
});

// ================================
// BUTTON CLICK FEEDBACK
// ================================
document.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.add("active");
    setTimeout(() => btn.classList.remove("active"), 150);
  });
});
