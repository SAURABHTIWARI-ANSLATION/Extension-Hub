/* ===========================
   Helpers
=========================== */

const $ = (id) => document.getElementById(id);

const searchInput = $("search");
const resultsList = $("results");
const statusBox = $("status");

/* ===========================
   Status
=========================== */

function showStatus(message, type = "success") {
  statusBox.textContent = message;
  statusBox.className = type;
  statusBox.style.display = "block";

  setTimeout(() => {
    statusBox.style.display = "none";
  }, 2000);
}

/* ===========================
   Keyboard Support
=========================== */

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const el = document.activeElement;
    if (el && el.tagName === "BUTTON") {
      el.click();
    }
  }
});

/* ===========================
   Bookmark Search
=========================== */

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();
  resultsList.innerHTML = "";

  if (!query) return;

  chrome.bookmarks.search(query, (bookmarks) => {
    if (!bookmarks.length) {
      const li = document.createElement("li");
      li.textContent = "No results found";
      resultsList.appendChild(li);
      return;
    }

    bookmarks.slice(0, 7).forEach((b) => {
      if (!b.url) return;

      const li = document.createElement("li");
      li.textContent = b.title || b.url;
      li.title = b.url;

      li.onclick = () => chrome.tabs.create({ url: b.url });
      resultsList.appendChild(li);
    });
  });
});

searchInput.addEventListener("blur", () => {
  setTimeout(() => (resultsList.innerHTML = ""), 150);
});

/* ===========================
   Bookmark Overlay
=========================== */

const overlay = $("bookmarkOverlay");
const openOverlayBtn = $("openBookmarkOverlay");
const confirmBtn = $("confirmAddBookmark");
const cancelBtn = $("cancelOverlay");
const categoryInput = $("category");

openOverlayBtn.addEventListener("click", () => {
  overlay.classList.remove("hidden");
  categoryInput.value = "";
  setTimeout(() => categoryInput.focus(), 50);
});

function closeOverlay() {
  overlay.classList.add("hidden");
}

cancelBtn.addEventListener("click", closeOverlay);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !overlay.classList.contains("hidden")) {
    closeOverlay();
  }
});

confirmBtn.addEventListener("click", () => {
  document.getElementById("addBookmark")?.click();
  closeOverlay();
});

categoryInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    confirmBtn.click();
  }
});
