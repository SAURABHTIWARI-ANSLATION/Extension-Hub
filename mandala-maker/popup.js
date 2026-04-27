'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const STUDIO_URL = chrome.runtime.getURL('content/mandala-canvas.html');
  const startDrawingBtn = document.getElementById('startDrawing');
  const openCanvasBtn   = document.getElementById('openCanvas');
  const symmetrySelect  = document.getElementById('symmetry');
  const brushSizeSlider = document.getElementById('brushSize');
  const brushSizeValue  = document.getElementById('brushSizeValue');
  const brushColorPicker= document.getElementById('brushColor');
  const patternItems    = Array.from(document.querySelectorAll('.pattern-item'));
  const openOptionsBtn  = document.getElementById('openOptions');

  const data = await chrome.storage.sync.get(['mandalaSettings']);
  const s = data.mandalaSettings || {};
  if (s.symmetry) symmetrySelect.value = String(s.symmetry);
  if (s.brushSize) {
    brushSizeSlider.value = String(s.brushSize);
    brushSizeValue.textContent = s.brushSize;
  }
  if (s.brushColor) brushColorPicker.value = s.brushColor;
  syncDropdowns();

  brushSizeSlider.addEventListener('input', () => {
    brushSizeValue.textContent = brushSizeSlider.value;
    saveSetting('brushSize', parseInt(brushSizeSlider.value, 10));
  });

  symmetrySelect.addEventListener('change', () => {
    saveSetting('symmetry', parseInt(symmetrySelect.value, 10));
  });

  brushColorPicker.addEventListener('input', () => {
    saveSetting('brushColor', brushColorPicker.value);
  });

  openCanvasBtn.addEventListener('click', async () => {
    await persistCurrentSettings();
    chrome.tabs.create({ url: STUDIO_URL, active: true });
    window.close();
  });

  startDrawingBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || isRestrictedUrl(tab.url || '')) {
        chrome.tabs.create({ url: STUDIO_URL, active: true });
        window.close();
        return;
      }

      await persistCurrentSettings();
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/overlay.js']
      });
      window.close();
    } catch (_) {
      chrome.tabs.create({ url: STUDIO_URL, active: true });
      window.close();
    }
  });

  patternItems.forEach(item => {
    item.addEventListener('click', () => {
      patternItems.forEach(btn => btn.classList.remove('is-active'));
      item.classList.add('is-active');
    });
  });

  openOptionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage().catch(() => {
      chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    });
  });

  function currentSettings() {
    return {
      symmetry: symmetrySelect.value,
      brushSize: brushSizeSlider.value,
      brushColor: brushColorPicker.value,
      // Keep drawing origin centered when opening Studio from popup.
      centerX: 0.5,
      centerY: 0.5
    };
  }

  async function persistCurrentSettings() {
    const existing = await chrome.storage.sync.get(['mandalaSettings']);
    const merged = { ...(existing.mandalaSettings || {}), ...currentSettings() };
    await chrome.storage.sync.set({ mandalaSettings: merged });
  }

  function saveSetting(key, value) {
    chrome.storage.sync.get(['mandalaSettings'], (stored) => {
      const merged = { ...(stored.mandalaSettings || {}), [key]: value };
      chrome.storage.sync.set({ mandalaSettings: merged });
    });
  }

  function isRestrictedUrl(url) {
    return url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url.startsWith('edge://') ||
      url.startsWith('about:');
  }

  function syncDropdowns() {
    if (window.MMDropdowns && typeof window.MMDropdowns.syncAll === 'function') {
      window.MMDropdowns.syncAll();
    }
  }
});
