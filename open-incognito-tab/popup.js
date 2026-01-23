document.getElementById("openIncognito").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "OPEN_INCOGNITO" });
});
