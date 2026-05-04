// popup.js - Live Web Editor popup logic (all-in-one: toolbar removed)

document.addEventListener("DOMContentLoaded", () => {

  // ── Elements ──
  const toggleEl          = document.getElementById("edit-mode-toggle");
  const badgeEl           = document.getElementById("mode-badge");
  const modeTextEl        = document.getElementById("mode-text");
  const selectionPreview  = document.getElementById("selection-preview");
  const selectionPlaceholderText = "Select text on the page, then right-click to save it";

  const btnBold           = document.getElementById("btn-bold");
  const btnItalic         = document.getElementById("btn-italic");
  const btnUnderline      = document.getElementById("btn-underline");

  const btnFontInc        = document.getElementById("btn-font-inc");
  const btnFontDec        = document.getElementById("btn-font-dec");
  const fontsizeDisplay   = document.getElementById("fontsize-display");

  const textColorPicker   = document.getElementById("text-color-picker");
  const bgColorPicker     = document.getElementById("bg-color-picker");
  const btnApplyTextColor = document.getElementById("btn-apply-text-color");
  const btnApplyBgColor   = document.getElementById("btn-apply-bg-color");

  const replaceInput      = document.getElementById("replace-input");
  const btnReplaceApply   = document.getElementById("btn-replace-apply");

  const btnUndo           = document.getElementById("btn-undo");
  const btnRedo           = document.getElementById("btn-redo");
  const btnReset          = document.getElementById("btn-reset");

  // ── Helpers ──

  function queryActiveTab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) callback(tabs[0]);
    });
  }

  function sendMsg(message, callback) {
    queryActiveTab((tab) => {
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        if (chrome.runtime.lastError) { callback?.(null, chrome.runtime.lastError); return; }
        callback?.(response, null);
      });
    });
  }

  function syncToggleState(editMode) {
    toggleEl.checked = editMode;
    updateBadge(editMode);
  }

  function updateBadge(editMode) {
    if (editMode) {
      badgeEl.classList.add("active");
      modeTextEl.textContent = "Edit Mode On";
    } else {
      badgeEl.classList.remove("active");
      modeTextEl.textContent = "Edit Mode Off";
    }
  }

  // ── Init: load state from content script ──

  sendMsg({ action: "getEditModeState" }, (response) => {
    if (response) syncToggleState(response.editMode);
  });

  sendMsg({ action: "getSelectionInfo" }, (response) => {
    if (response) {
      updateSelectionPreview(response.text, response.fontSize);
    }
  });

  // ── Edit Mode Toggle ──

  toggleEl.addEventListener("change", () => {
    const editMode = toggleEl.checked;
    updateBadge(editMode);
    const action = editMode ? "enableEditMode" : "disableEditMode";
    sendMsg({ action }, (_res, err) => {
      if (err) syncToggleState(false);
    });
  });

  // ── Selection Preview ──

  function showSelectionPlaceholder() {
    const placeholder = document.createElement("span");
    placeholder.className = "selection-placeholder";
    placeholder.id = "selection-placeholder";
    placeholder.textContent = selectionPlaceholderText;

    selectionPreview.replaceChildren(placeholder);
  }

  function updateSelectionPreview(text, fontSize) {
    if (text && text.trim().length > 0) {
      // Remove placeholder, show selected text
      selectionPreview.textContent = text.length > 80 ? text.slice(0, 80) + "…" : text;
      selectionPreview.style.color = "#000";
      if (fontSize) fontsizeDisplay.textContent = Math.round(fontSize) + "px";
    } else {
      showSelectionPlaceholder();
      fontsizeDisplay.textContent = "--";
    }
  }

  // ── Text Formatting ──

  btnBold.addEventListener("click", () => {
    sendMsg({ action: "applyStyle", property: "fontWeight", value: "bold" });
  });
  btnItalic.addEventListener("click", () => {
    sendMsg({ action: "applyStyle", property: "fontStyle", value: "italic" });
  });
  btnUnderline.addEventListener("click", () => {
    sendMsg({ action: "applyStyle", property: "textDecoration", value: "underline" });
  });

  // ── Font Size ──

  btnFontInc.addEventListener("click", () => {
    sendMsg({ action: "applyFontSize", direction: "inc" }, (res) => {
      if (res && res.fontSize) fontsizeDisplay.textContent = Math.round(res.fontSize) + "px";
    });
  });
  btnFontDec.addEventListener("click", () => {
    sendMsg({ action: "applyFontSize", direction: "dec" }, (res) => {
      if (res && res.fontSize) fontsizeDisplay.textContent = Math.round(res.fontSize) + "px";
    });
  });

  // ── Colors ──

  btnApplyTextColor.addEventListener("click", () => {
    sendMsg({ action: "applyTextColor", value: textColorPicker.value });
  });
  btnApplyBgColor.addEventListener("click", () => {
    sendMsg({ action: "applyBackgroundColor", value: bgColorPicker.value });
  });

  // ── Replace ──

  btnReplaceApply.addEventListener("click", () => {
    const newText = replaceInput.value;
    if (!newText) return;
    sendMsg({ action: "replaceSelectedText", value: newText }, (res) => {
      if (res && res.success) replaceInput.value = "";
    });
  });
  replaceInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btnReplaceApply.click();
  });

  // ── Undo / Redo / Reset ──

  btnUndo.addEventListener("click", () => sendMsg({ action: "undo" }));
  btnRedo.addEventListener("click", () => sendMsg({ action: "redo" }));
  btnReset.addEventListener("click", () => sendMsg({ action: "resetStyling" }));

  // ── Listen for messages from content script ──

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "editModeChanged") {
      syncToggleState(message.editMode);
    }
    if (message.action === "selectionSaved") {
      updateSelectionPreview(message.text, message.fontSize);
    }
  });

});
