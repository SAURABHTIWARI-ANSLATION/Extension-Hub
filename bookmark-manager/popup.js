// Keyboard navigation using Enter key
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const el = document.activeElement;
    if (el && el.tagName === "BUTTON") {
      el.click();
    }
  }
});

// Search bookmarks & history
const searchInput = document.getElementById("search");

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();
  if (!query) return;

  chrome.bookmarks.search(query, (bookmarks) => {
    console.clear();
    console.log("Bookmarks:");
    bookmarks.forEach(b => b.url && console.log(b.title, b.url));
  });

  chrome.history.search(
    { text: query, maxResults: 5 },
    (history) => {
      console.log("History:");
      history.forEach(h => console.log(h.title, h.url));
    }
  );
});
