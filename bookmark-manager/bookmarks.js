// Get active tab
function getActiveTab(cb) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length) cb(tabs[0]);
  });
}

// Add bookmark category-wise
document.getElementById("addBookmark").addEventListener("click", () => {
  const category =
    document.getElementById("category").value.trim() || "Unsorted";

  chrome.bookmarks.search({ title: category }, (results) => {
    let folder = results.find(r => !r.url);

    const addToFolder = (folderId) => {
      getActiveTab(tab => {
        chrome.bookmarks.create({
          parentId: folderId,
          title: tab.title,
          url: tab.url
        });
      });
    };

    if (folder) {
      addToFolder(folder.id);
    } else {
      chrome.bookmarks.create({ title: category }, (newFolder) => {
        addToFolder(newFolder.id);
      });
    }
  });
});

// Remove duplicate bookmarks
document.getElementById("removeDuplicates").addEventListener("click", () => {
  chrome.bookmarks.getTree((tree) => {
    const seen = new Set();

    function walk(nodes) {
      nodes.forEach(n => {
        if (n.url) {
          if (seen.has(n.url)) {
            chrome.bookmarks.remove(n.id);
          } else {
            seen.add(n.url);
          }
        }
        if (n.children) walk(n.children);
      });
    }

    walk(tree);
  });
});

// Delete empty folders
document.getElementById("cleanFolders").addEventListener("click", () => {
  chrome.bookmarks.getTree((tree) => {
    function walk(nodes) {
      nodes.forEach(n => {
        if (n.children) {
          walk(n.children);
          if (n.children.length === 0 && !n.url) {
            chrome.bookmarks.remove(n.id);
          }
        }
      });
    }
    walk(tree);
  });
});
