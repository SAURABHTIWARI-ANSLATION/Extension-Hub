// services/storageService.js — URLBurst
"use strict";

const StorageService = (() => {
  const KEYS = {
    URL_LIST:    "urlList",
    SETTINGS:    "settings",
    HISTORY:     "history",
    SAVED_LISTS: "savedLists",
    DRAFT:       "draft"
  };

  const DEFAULT_SETTINGS = {
    openMode:         "tab",
    groupBy:          "domain",
    limitEnabled:     false,
    limitCount:       10,
    delay:            0.5,
    oneByOneWait:     5,
    randomOrder:      false,
    reverseOrder:     false,
    preserveInput:    false,
    ignoreDuplicates: true,
    handleNonURLs:    false,
    rememberList:     true,
    inactiveLoad:     false
  };

  function get(key) {
    return new Promise((res) => chrome.storage.local.get(key, (r) => res(r[key])));
  }
  function set(key, value) {
    return new Promise((res) => chrome.storage.local.set({ [key]: value }, res));
  }

  // ── URL List ─────────────────────────────────────────────────────────────
  async function saveURLList(text) { return set(KEYS.URL_LIST, text); }
  async function loadURLList()     { return (await get(KEYS.URL_LIST)) || ""; }

  // ── Draft (auto-save) ────────────────────────────────────────────────────
  async function saveDraft(text)   { return set(KEYS.DRAFT, text); }
  async function loadDraft()       { return (await get(KEYS.DRAFT)) || ""; }
  async function clearDraft()      { return set(KEYS.DRAFT, ""); }

  // ── Settings ─────────────────────────────────────────────────────────────
  async function saveSettings(s)   { return set(KEYS.SETTINGS, s); }
  async function loadSettings() {
    const saved = await get(KEYS.SETTINGS);
    return Object.assign({}, DEFAULT_SETTINGS, saved || {});
  }

  // ── History ──────────────────────────────────────────────────────────────
  async function addHistory(entry) {
    const h = (await get(KEYS.HISTORY)) || [];
    h.unshift(entry);
    return set(KEYS.HISTORY, h.slice(0, 30)); // keep last 30
  }
  async function loadHistory()  { return (await get(KEYS.HISTORY)) || []; }
  async function clearHistory() { return set(KEYS.HISTORY, []); }

  // ── Saved Lists ──────────────────────────────────────────────────────────
  async function loadSavedLists() { return (await get(KEYS.SAVED_LISTS)) || []; }

  async function saveList(id, name, urlsText) {
    const lists = await loadSavedLists();
    const safeName = (name || "").trim().slice(0, 80) || "Untitled List";
    const urls = urlsText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const existing = lists.findIndex((l) => l.id === id);
    const entry = {
      id:        id || Date.now().toString(36),
      name:      safeName,
      urlsText,
      urls,
      count:     urls.length,
      timestamp: Formatter.formatTimestamp(),
      createdAt: existing >= 0 ? (lists[existing].createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now()
    };
    if (existing >= 0) { lists[existing] = entry; }
    else { lists.push(entry); }
    await set(KEYS.SAVED_LISTS, lists);
    return entry;
  }

  async function duplicateList(id) {
    const lists = await loadSavedLists();
    const src = lists.find((l) => l.id === id);
    if (!src) return null;
    return saveList(null, src.name + " (copy)", src.urlsText);
  }

  async function renameList(id, newName) {
    const lists = await loadSavedLists();
    const idx = lists.findIndex((l) => l.id === id);
    if (idx < 0) return;
    lists[idx].name = (newName || "").trim().slice(0, 80) || lists[idx].name;
    lists[idx].updatedAt = Date.now();
    await set(KEYS.SAVED_LISTS, lists);
  }

  async function reorderLists(sortBy) {
    const lists = await loadSavedLists();
    if (sortBy === "name") lists.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "date") lists.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    await set(KEYS.SAVED_LISTS, lists);
    return lists;
  }

  async function deleteList(id) {
    const lists = await loadSavedLists();
    await set(KEYS.SAVED_LISTS, lists.filter((l) => l.id !== id));
  }

  async function getListById(id) {
    const lists = await loadSavedLists();
    return lists.find((l) => l.id === id) || null;
  }

  return {
    DEFAULT_SETTINGS,
    saveURLList, loadURLList,
    saveDraft, loadDraft, clearDraft,
    saveSettings, loadSettings,
    addHistory, loadHistory, clearHistory,
    loadSavedLists, saveList, duplicateList, renameList,
    reorderLists, deleteList, getListById
  };
})();

if (typeof module !== "undefined") module.exports = StorageService;
