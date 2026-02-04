// ===============================
// QuickShot – Background Service Worker (MV3)
// ===============================

console.log('🔧 QuickShot Background Service Worker Loaded');

// -------------------------------
// Helpers
// -------------------------------

function isRestrictedPage(url) {
  return (
    !url ||
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.includes('chrome.google.com/webstore')
  );
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// -------------------------------
// Command Listener (Keyboard)
// -------------------------------

chrome.commands.onCommand.addListener(async (command) => {
  console.log('⌨️ Command received:', command);

  if (command === 'capture_visible') {
    await captureVisible();
  }

  if (command === 'capture_selection') {
    await captureSelection();
  }
});

// -------------------------------
// Runtime Message Listener
// -------------------------------

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Message received:', request.action);

  if (request.action === 'capture_visible') {
    captureVisible();
  }

  if (request.action === 'capture_selection') {
    captureSelection();
  }

  if (request.action === 'selection_completed') {
    captureAndCrop(request.coords);
  }

  if (request.action === 'show_notification') {
    showNotification(request.message);
  }

  return true; // keep async channel open
});

// -------------------------------
// Capture Visible Screen
// -------------------------------

async function captureVisible() {
  try {
    const tab = await getActiveTab();
    if (!tab || isRestrictedPage(tab.url)) {
      console.error('❌ Cannot capture restricted page:', tab?.url);
      showNotification('This page cannot be captured.');
      return;
    }

    console.log('🖼️ Capturing visible tab:', tab.url);

    // Wait if tab is loading
    if (tab.status === 'loading') {
      await new Promise(resolve => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        });
        // Timeout after 2s
        setTimeout(resolve, 2000);
      });
    }

    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png'
    });

    openEditor({
      image: dataUrl,
      cropCoords: null
    });

  } catch (error) {
    console.error('❌ Visible capture failed:', error);
    showNotification('Visible capture failed.');
  }
}

// -------------------------------
// Capture Area Selection
// -------------------------------

async function captureSelection() {
  try {
    const tab = await getActiveTab();
    if (!tab || isRestrictedPage(tab.url)) {
      console.error('❌ Cannot start selection on restricted page:', tab?.url);
      showNotification('Area selection not allowed on this page.');
      return;
    }

    console.log('🎯 Starting area selection on:', tab.url);

    // Inject content script (safe even if already injected)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    // Small delay for script init
    await new Promise((r) => setTimeout(r, 200));

    // Ask content script to start selection
    await chrome.tabs.sendMessage(tab.id, {
      action: 'QS_START_SELECTION'
    });

  } catch (error) {
    console.error('❌ Area selection failed completely:', error);
    showNotification('Area selection failed.');
  }
}

// -------------------------------
// Capture & Crop After Selection
// -------------------------------

async function captureAndCrop(coords) {
  try {
    const tab = await getActiveTab();
    if (!tab || isRestrictedPage(tab.url)) {
      console.error('❌ Cannot crop on restricted page');
      return;
    }

    console.log('📐 Cropping with coords:', coords);

    // Scroll page so captureVisibleTab aligns correctly
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (x, y) => window.scrollTo(x, y),
      args: [coords.scrollX, coords.scrollY]
    });

    await new Promise((r) => setTimeout(r, 120));

    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png'
    });

    openEditor({
      image: dataUrl,
      cropCoords: coords
    });

  } catch (error) {
    console.error('❌ Crop capture failed:', error);
    showNotification('Crop capture failed.');
  }
}

// -------------------------------
// Open Editor
// -------------------------------

function openEditor({ image, cropCoords }) {
  const data = {
    qs_current_image: image,
    qs_capture_mode: 'single',
    qs_crop_coords: cropCoords || null
  };

  chrome.storage.local.set(data, () => {
    console.log('📝 Editor data saved');
    chrome.tabs.create({ url: 'editor.html' });
  });
}

// -------------------------------
// Notifications
// -------------------------------

function showNotification(message) {
  if (!chrome.notifications) {
    console.warn('⚠️ Notifications API unavailable');
    return;
  }

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'QuickShot',
    message,
    priority: 1
  });
}
