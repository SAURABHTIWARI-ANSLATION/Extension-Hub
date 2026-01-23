chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "GET_SELECTED_TEXT") return;

  let selectedText = "";

  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    sendResponse({ text: "" });
    return;
  }

  // Combine text from all selected ranges
  for (let i = 0; i < selection.rangeCount; i++) {
    selectedText += selection.getRangeAt(i).toString() + " ";
  }

  selectedText = selectedText
    .replace(/\s+/g, " ")      // normalize spaces
    .replace(/\n+/g, " ")      // remove newlines
    .trim();

  // Optional safety limit (prevents very large selections)
  const MAX_LENGTH = 5000;
  if (selectedText.length > MAX_LENGTH) {
    selectedText = selectedText.slice(0, MAX_LENGTH) + "...";
  }

  sendResponse({ text: selectedText });
});
