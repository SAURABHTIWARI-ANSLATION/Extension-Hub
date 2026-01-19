// ================================
// BOOKMARK MANAGER LOGIC
// ================================

// Utility: Get active tab
function getActiveTab(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0) {
      callback(tabs[0]);
    }
  });
}

// ================================
// ADD BOOKMARK CATEGORY-WISE
// ================================
document.getElementById("addBookmark")?.addEventListener("click", () => {
  const categoryInput = document.getElementById("category");
  const categoryName = categoryInput.value.trim() || "Unsorted";

  // Find or create category folder
  chrome.bookmarks.search({ title: categoryName }, (results) => {
    let folder = results.find(item => !item.url);

    const addBookmarkToFolder = (folderId) => {
      getActiveTab((tab) => {
        chrome.bookmarks.create({
          parentId: folderId,
          title: tab.title,
          url: tab.url
        });
      });
    };

    if (folder) {
      addBookmarkToFolder(folder.id);
    } else {
      chrome.bookmarks.create({ title: categoryName }, (newFolder) => {
        addBookmarkToFolder(newFolder.id);
      });
    }
  });
});

// ================================
// REMOVE DUPLICATE BOOKMARKS
// ================================
document.getElementById("removeDuplicates")?.addEventListener("click", () => {
  chrome.bookmarks.getTree((tree) => {
    const seenUrls = new Set();
    let removedCount = 0;

    function traverse(nodes) {
      nodes.forEach(node => {
        if (node.url) {
          if (seenUrls.has(node.url)) {
            chrome.bookmarks.remove(node.id);
            removedCount++;
          } else {
            seenUrls.add(node.url);
          }
        }

        if (node.children) {
          traverse(node.children);
        }
      });
    }

    traverse(tree);
    console.log(`Duplicate bookmarks removed: ${removedCount}`);
  });
});

// ================================
// DELETE EMPTY BOOKMARK FOLDERS
// ================================
document.getElementById("cleanFolders")?.addEventListener("click", () => {
  chrome.bookmarks.getTree((tree) => {
    let removedFolders = 0;

    function traverse(nodes) {
      nodes.forEach(node => {
        if (node.children) {
          traverse(node.children);

          if (node.children.length === 0 && !node.url) {
            chrome.bookmarks.remove(node.id);
            removedFolders++;
          }
        }
      });
    }

    traverse(tree);
    console.log(`Empty folders deleted: ${removedFolders}`);
  });
});

// ================================
// SEARCH BOOKMARKS
// ================================
const searchInput = document.getElementById("search");

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();

    if (!query) return;

    chrome.bookmarks.search(query, (results) => {
      console.clear();
      console.log("Bookmark search results:");
      results.forEach(item => {
        if (item.url) {
          console.log(item.title, "-", item.url);
        }
      });
    });
  });
}

// ================================
// MOVE BOOKMARKS BY URL KEYWORD
// Example: move all "github" links to "GitHub" folder
// ================================
function moveBookmarksByKeyword(keyword, folderName) {
  chrome.bookmarks.search(keyword, (results) => {
    chrome.bookmarks.search({ title: folderName }, (folders) => {
      let targetFolder = folders.find(f => !f.url);

      const moveItems = (folderId) => {
        results.forEach(item => {
          if (item.url && item.url.includes(keyword)) {
            chrome.bookmarks.move(item.id, { parentId: folderId });
          }
        });
      };

      if (targetFolder) {
        moveItems(targetFolder.id);
      } else {
        chrome.bookmarks.create({ title: folderName }, (newFolder) => {
          moveItems(newFolder.id);
        });
      }
    });
  });
}

// ================================
// OPTIONAL: EXPOSE FUNCTION FOR DEBUG
// ================================
window.moveBookmarksByKeyword = moveBookmarksByKeyword;
