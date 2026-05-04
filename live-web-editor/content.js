// content.js - Live Web Editor (toolbar-free version)
// All formatting is controlled via the popup. Toolbar UI is fully removed.

(function () {
  "use strict";

  // ── State ──

  const state = {
    editMode: false,
    selectedRange: null,
    activeElement: null,
    undoStack: [],
    redoStack: [],
  };

  const STYLED_SPAN_CLASS = "lwe-styled-span";
  const MAX_UNDO = 100;

  // ── Undo / Redo ──

  function pushUndo(snapshot) {
    state.undoStack.push(snapshot);
    if (state.undoStack.length > MAX_UNDO) state.undoStack.shift();
    state.redoStack = [];
  }

  function snapshotElement(el) {
    return { element: el, html: el.innerHTML, outerStyle: el.getAttribute("style") || "" };
  }

  function applySnapshot(snapshot) {
    snapshot.element.innerHTML = snapshot.html;
    if (snapshot.outerStyle) {
      snapshot.element.setAttribute("style", snapshot.outerStyle);
    } else {
      snapshot.element.removeAttribute("style");
    }
  }

  function undo() {
    if (!state.undoStack.length) return;
    const snap = state.undoStack.pop();
    state.redoStack.push(snapshotElement(snap.element));
    applySnapshot(snap);
  }

  function redo() {
    if (!state.redoStack.length) return;
    const snap = state.redoStack.pop();
    state.undoStack.push(snapshotElement(snap.element));
    applySnapshot(snap);
  }

  // ── Selection Utilities ──

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      state.selectedRange = sel.getRangeAt(0).cloneRange();
      return true;
    }
    return false;
  }

  function restoreSelection() {
    if (!state.selectedRange) return false;
    const sel = window.getSelection();
    if (!sel) return false;
    sel.removeAllRanges();
    sel.addRange(state.selectedRange);
    return true;
  }

  function getSelectedText() {
    if (!state.selectedRange) return "";
    return state.selectedRange.toString();
  }

  function getSelectionFontSize() {
    if (!state.selectedRange) return null;
    const node = state.selectedRange.commonAncestorContainer;
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    if (!el) return null;
    return parseFloat(window.getComputedStyle(el).fontSize) || null;
  }

  // ── Span Utilities ──

  function findStyledSpanInRange(range) {
    const node = range.commonAncestorContainer;
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    if (!el) return null;
    if (el.classList.contains(STYLED_SPAN_CLASS)) return el;
    if (el.parentElement && el.parentElement.classList.contains(STYLED_SPAN_CLASS)) return el.parentElement;
    return null;
  }

  function wrapSelectionWithSpan(range) {
    if (range.collapsed) return null;

    const commonAncestor = range.commonAncestorContainer;
    const blockEl =
      commonAncestor.nodeType === Node.ELEMENT_NODE
        ? commonAncestor
        : commonAncestor.parentElement;

    if (!blockEl || blockEl === document.body || blockEl === document.documentElement) return null;

    pushUndo(snapshotElement(blockEl));

    const span = document.createElement("span");
    span.classList.add(STYLED_SPAN_CLASS);

    try {
      range.surroundContents(span);
    } catch {
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
    }

    // Update saved selection to the new span
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    state.selectedRange = newRange.cloneRange();
    const sel = window.getSelection();
    if (sel) { sel.removeAllRanges(); sel.addRange(newRange); }

    return span;
  }

  // ── Style Application ──

  function applyStyle(styleProperty, value) {
    if (!state.selectedRange) return false;
    restoreSelection();

    const range = state.selectedRange.cloneRange();
    if (range.collapsed) return false;

    const existingSpan = findStyledSpanInRange(range);
    if (existingSpan) {
      const parent = existingSpan.parentElement;
      if (parent) pushUndo(snapshotElement(parent));
      existingSpan.style[styleProperty] = value;
    } else {
      const span = wrapSelectionWithSpan(range);
      if (span) span.style[styleProperty] = value;
      else return false;
    }
    return true;
  }

  function applyFontSize(direction) {
    if (!state.selectedRange) return null;
    restoreSelection();

    const range = state.selectedRange.cloneRange();
    const existingSpan = findStyledSpanInRange(range);
    const targetEl = existingSpan || (
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer
    );

    if (!targetEl) return null;

    const currentSize = parseFloat(window.getComputedStyle(targetEl).fontSize) || 16;
    const newSize = direction === "inc"
      ? Math.min(currentSize + 2, 96)
      : Math.max(currentSize - 2, 6);

    if (existingSpan) {
      const parent = existingSpan.parentElement;
      if (parent) pushUndo(snapshotElement(parent));
      existingSpan.style.fontSize = newSize + "px";
    } else {
      const span = wrapSelectionWithSpan(range);
      if (span) span.style.fontSize = newSize + "px";
    }

    return newSize;
  }

  function resetStyling() {
    if (!state.selectedRange) return false;
    restoreSelection();

    const range = state.selectedRange;
    const existingSpan = findStyledSpanInRange(range);
    if (existingSpan) {
      const parent = existingSpan.parentElement;
      if (parent) pushUndo(snapshotElement(parent));
      existingSpan.removeAttribute("style");
      existingSpan.classList.remove(STYLED_SPAN_CLASS);
      return true;
    }
    return false;
  }

  // ── Replace ──

  function replaceSelectedText(newText) {
    if (!state.selectedRange) return false;
    restoreSelection();

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;

    const range = sel.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    const blockEl = ancestor.nodeType === Node.ELEMENT_NODE
      ? ancestor : ancestor.parentElement;

    if (blockEl) pushUndo(snapshotElement(blockEl));

    range.deleteContents();
    const textNode = document.createTextNode(newText);
    range.insertNode(textNode);

    const newRange = document.createRange();
    newRange.setStartAfter(textNode);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    state.selectedRange = null;
    return true;
  }

  // ── Edit Mode ──

  function enableEditMode() {
    state.editMode = true;
    chrome.runtime.sendMessage({ action: "setEditModeState", editMode: true });
    notifyPopup(true);
  }

  function disableEditMode() {
    state.editMode = false;
    if (state.activeElement) commitInlineEdit(state.activeElement);
    chrome.runtime.sendMessage({ action: "setEditModeState", editMode: false });
    notifyPopup(false);
  }

  function toggleEditMode() {
    state.editMode ? disableEditMode() : enableEditMode();
  }

  function notifyPopup(editMode) {
    chrome.runtime.sendMessage({ action: "editModeChanged", editMode }).catch?.(() => {});
  }

  function notifyPopupSelection() {
    const text = getSelectedText();
    const fontSize = getSelectionFontSize();
    chrome.runtime.sendMessage({ action: "selectionSaved", text, fontSize }).catch?.(() => {});
  }

  // ── Inline Editing (Edit Mode clicks) ──

  function makeElementEditable(el) {
    if (state.activeElement && state.activeElement !== el) {
      commitInlineEdit(state.activeElement);
    }
    const blockEl = findEditableBlock(el);
    if (!blockEl || blockEl === document.body || blockEl === document.documentElement) return;

    pushUndo(snapshotElement(blockEl));
    blockEl.contentEditable = "true";
    blockEl.focus();
    state.activeElement = blockEl;
  }

  function commitInlineEdit(el) {
    if (!el) return;
    el.contentEditable = "false";
    el.removeAttribute("contenteditable");
    state.activeElement = null;
  }

  function findEditableBlock(el) {
    const blockTags = [
      "P","H1","H2","H3","H4","H5","H6",
      "LI","TD","TH","DIV","SPAN","ARTICLE",
      "SECTION","LABEL","A","FIGCAPTION","BLOCKQUOTE",
    ];
    let node = el;
    while (node && node !== document.body) {
      if (blockTags.includes(node.tagName)) return node;
      node = node.parentElement;
    }
    return el;
  }

  // ── Document Event Listeners ──

  function onMouseUp(e) {
    if (state.editMode) {
      if (state.activeElement && !state.activeElement.contains(e.target)) {
        commitInlineEdit(state.activeElement);
      }
    }

    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : "";
      if (text.length > 0) {
        saveSelection();
        // No auto-popup: selection is just saved for when popup is opened
      }
    }, 10);
  }

  function onClickEditMode(e) {
    if (!state.editMode) return;
    if (e.target.id === "lwe-toolbar-host") return;
    if (state.activeElement && state.activeElement.contains(e.target)) return;
    makeElementEditable(e.target);
  }

  function onKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
      if (!isEditingText(e.target)) { e.preventDefault(); undo(); }
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
      if (!isEditingText(e.target)) { e.preventDefault(); redo(); }
    }
    if (e.key === "Escape") {
      if (state.activeElement) commitInlineEdit(state.activeElement);
      else if (state.editMode)  disableEditMode();
    }
  }

  function isEditingText(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || el.contentEditable === "true" || el.isContentEditable;
  }

  // ── Message Handler ──

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // Context menu: "Save Selection" — save current selection + notify popup
    if (message.action === "saveSelectionFromContextMenu") {
      const saved = saveSelection();
      if (saved) notifyPopupSelection();
      sendResponse({ success: saved, text: getSelectedText(), fontSize: getSelectionFontSize() });
    }

    if (message.action === "toggleEditMode") {
      toggleEditMode();
      sendResponse({ editMode: state.editMode });
    }

    if (message.action === "getEditModeState") {
      sendResponse({ editMode: state.editMode });
    }

    if (message.action === "getSelectionInfo") {
      sendResponse({ text: getSelectedText(), fontSize: getSelectionFontSize() });
    }

    if (message.action === "enableEditMode") {
      enableEditMode(); sendResponse({ success: true });
    }

    if (message.action === "disableEditMode") {
      disableEditMode(); sendResponse({ success: true });
    }

    if (message.action === "undo") {
      undo(); sendResponse({ success: true });
    }

    if (message.action === "redo") {
      redo(); sendResponse({ success: true });
    }

    if (message.action === "applyStyle") {
      const ok = applyStyle(message.property, message.value);
      sendResponse({ success: ok });
    }

    if (message.action === "applyFontSize") {
      const newSize = applyFontSize(message.direction);
      sendResponse({ success: newSize !== null, fontSize: newSize });
    }

    if (message.action === "applyTextColor") {
      const ok = applyStyle("color", message.value);
      sendResponse({ success: ok });
    }

    if (message.action === "applyBackgroundColor") {
      const ok = applyStyle("backgroundColor", message.value);
      sendResponse({ success: ok });
    }

    if (message.action === "replaceSelectedText") {
      const ok = replaceSelectedText(message.value);
      sendResponse({ success: ok });
    }

    if (message.action === "resetStyling") {
      const ok = resetStyling();
      sendResponse({ success: ok });
    }

    return true; // keep channel open for async
  });

  // ── Init ──

  function init() {
    document.addEventListener("mouseup",  onMouseUp,      true);
    document.addEventListener("click",    onClickEditMode, true);
    document.addEventListener("keydown",  onKeyDown,      true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
