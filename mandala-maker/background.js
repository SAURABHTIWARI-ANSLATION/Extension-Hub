'use strict';
const STUDIO_URL = chrome.runtime.getURL('content/mandala-canvas.html');

const DEFAULT_SETTINGS = {
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

chrome.runtime.onInstalled.addListener((details) => {
  // Only write defaults on fresh install, not updates
  if (details.reason === 'install') {
    chrome.storage.sync.set({ mandalaSettings: DEFAULT_SETTINGS });
  }

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'openMandalaStudio',
      title: 'Open Mandala Studio',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'openMandalaOverlay',
      title: 'Draw Mandala Overlay',
      contexts: ['page']
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'openMandalaStudio') {
    chrome.tabs.create({
      url: STUDIO_URL,
      active: true
    });
  } else if (info.menuItemId === 'openMandalaOverlay' && tab) {
    // Avoid empty executeScript payloads (review risk). Until a dedicated
    // overlay content script exists, route this action to Studio.
    chrome.tabs.create({
      url: STUDIO_URL,
      active: true
    });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message && message.action === 'openMandalaStudio') {
    chrome.tabs.create({ url: STUDIO_URL, active: true });
    return true;
  }
  return false;
});
