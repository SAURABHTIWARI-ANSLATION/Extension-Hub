/* ===========================
   Helpers
=========================== */

// Get currently active tab
function getActiveTab(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length) callback(tabs[0]);
  });
}

// Show UI feedback (defined in popup.js)
function notify(message, type = "success") {
  if (typeof showStatus === "function") {
    showStatus(message, type);
  }
}

/* ===========================
   Add Bookmark (Category-wise)
=========================== */

document.getElementById("addBookmark").addEventListener("click", () => {
  const input = document.getElementById("category");
  const category = input.value.trim() || "Unsorted";

  getActiveTab((tab) => {
    if (!tab.url) {
      notify("Invalid tab URL", "error");
      return;
    }

    // Prevent duplicate URLs
    chrome.bookmarks.search({ url: tab.url }, (existing) => {
      if (existing && existing.length) {
        notify("Bookmark already exists", "error");
        return;
      }

      // Find or create category folder
      chrome.bookmarks.search({ title: category }, (results) => {
        let folder = results.find(r => !r.url);

        const createBookmark = (parentId) => {
          chrome.bookmarks.create(
            {
              parentId,
              title: tab.title || tab.url,
              url: tab.url
            },
            () => notify("Bookmark saved ✔")
          );
        };

        if (folder) {
          createBookmark(folder.id);
        } else {
          chrome.bookmarks.create({ title: category }, (newFolder) => {
            createBookmark(newFolder.id);
          });
        }
      });
    });
  });
});

/* ===========================
   Remove Duplicate Bookmarks
   (URL + Title safe check)
=========================== */

document.getElementById("removeDuplicates").addEventListener("click", () => {
  chrome.bookmarks.getTree((tree) => {
    const seen = new Map();
    let removed = 0;

    function walk(nodes) {
      nodes.forEach((node) => {
        if (node.url) {
          const key = `${node.title}|${node.url}`;
          if (seen.has(key)) {
            chrome.bookmarks.remove(node.id);
            removed++;
          } else {
            seen.set(key, true);
          }
        }
        if (node.children) walk(node.children);
      });
    }

    walk(tree);
    notify(`Removed ${removed} duplicate bookmark(s)`);
  });
});

/* ===========================
   Delete Empty Bookmark Folders
=========================== */

document.getElementById("cleanFolders").addEventListener("click", () => {
  chrome.bookmarks.getTree((tree) => {
    let deleted = 0;

    function walk(nodes) {
      nodes.forEach((node) => {
        if (node.children) {
          walk(node.children);

          // Delete folder if empty
          if (node.children.length === 0 && !node.url) {
            chrome.bookmarks.remove(node.id);
            deleted++;
          }
        }
      });
    }

    walk(tree);
    notify(`Deleted ${deleted} empty folder(s)`);
  });
});
