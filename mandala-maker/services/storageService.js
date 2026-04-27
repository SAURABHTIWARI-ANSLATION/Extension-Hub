'use strict';

const StorageService = (() => {
  const SETTINGS_KEY = 'mandalaSettings';
  const ARTWORK_KEY = 'mandalaArtworks';
  const AUTOSAVE_KEY = 'mandalaAutosave';

  const defaults = {
    symmetry: 6,
    brushSize: 10,
    brushColor: '#2563EB',
    brushType: 'round',
    brushOpacity: 1,
    backgroundColor: '#ffffff',
    shadowEnabled: false,
    shadowColor: '#000000',
    shadowBlur: 10,
    centerX: 0.5,
    centerY: 0.5,
    mirrorEnabled: true,
    randomColors: false,
    showGuides: true,
    darkMode: false
  };

  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(SETTINGS_KEY, (data) => {
        resolve({ ...defaults, ...(data[SETTINGS_KEY] || {}) });
      });
    });
  }

  function saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [SETTINGS_KEY]: settings }, resolve);
    });
  }

  async function loadArtworks() {
    return new Promise((resolve) => {
      chrome.storage.local.get(ARTWORK_KEY, (data) => {
        resolve(data[ARTWORK_KEY] || []);
      });
    });
  }

  async function saveArtwork(name, canvasJSON, thumbnail) {
    const artworks = await loadArtworks();
    const id = 'art_' + Date.now();
    artworks.unshift({ id, name, canvasJSON, thumbnail, createdAt: Date.now() });
    const trimmed = artworks.slice(0, 20);
    return new Promise((resolve) => {
      chrome.storage.local.set({ [ARTWORK_KEY]: trimmed }, () => resolve(id));
    });
  }

  async function deleteArtwork(id) {
    const artworks = await loadArtworks();
    const filtered = artworks.filter(a => a.id !== id);
    return new Promise((resolve) => {
      chrome.storage.local.set({ [ARTWORK_KEY]: filtered }, resolve);
    });
  }

  function saveAutosave(canvasJSON) {
    chrome.storage.local.set({ [AUTOSAVE_KEY]: { json: canvasJSON, ts: Date.now() } });
  }

  async function loadAutosave() {
    return new Promise((resolve) => {
      chrome.storage.local.get(AUTOSAVE_KEY, (data) => {
        resolve(data[AUTOSAVE_KEY] || null);
      });
    });
  }

  return { loadSettings, saveSettings, loadArtworks, saveArtwork, deleteArtwork, saveAutosave, loadAutosave, defaults };
})();
