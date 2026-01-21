document.addEventListener('DOMContentLoaded', () => {
  // ===== ELEMENTS =====
  const btnVisible = document.getElementById('btn-visible');
  const btnSelection = document.getElementById('btn-selection');
  const settingsIcon = document.getElementById('settings-icon');
  const autoCopyToggle = document.getElementById('auto-copy');
  const autoEditorToggle = document.getElementById('auto-editor');
  const openEditorBtn = document.getElementById('open-editor');

  console.log('📌 Popup elements loaded:', {
    btnVisible: !!btnVisible,
    btnSelection: !!btnSelection,
    settingsIcon: !!settingsIcon,
    autoCopyToggle: !!autoCopyToggle,
    autoEditorToggle: !!autoEditorToggle,
    openEditorBtn: !!openEditorBtn
  });

  // ===== LOAD SETTINGS =====
  chrome.storage.sync.get(
    {
      autoCopy: true,
      autoEditor: true
    },
    (settings) => {
      if (autoCopyToggle) autoCopyToggle.checked = settings.autoCopy;
      if (autoEditorToggle) autoEditorToggle.checked = settings.autoEditor;
    }
  );

  // ===== BUTTON ACTIONS =====
  if (btnVisible) {
    btnVisible.addEventListener('click', () => {
      console.log('🖼️ Visible capture clicked');
      chrome.runtime.sendMessage({ action: 'capture_visible' });
      window.close();
    });
  }

  if (btnSelection) {
    btnSelection.addEventListener('click', () => {
      console.log('🎯 Selection capture clicked');
      chrome.runtime.sendMessage({ action: 'capture_selection' });
      window.close();
    });
  }

  if (settingsIcon) {
    settingsIcon.addEventListener('click', () => {
      console.log('⚙️ Settings clicked');
      chrome.runtime.sendMessage({
        action: 'show_notification',
        message: 'Settings page coming soon 🚧'
      });
    });
  }

  if (openEditorBtn) {
    openEditorBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'editor.html' });
      window.close();
    });
  }

  // ===== TOGGLE SETTINGS =====
  if (autoCopyToggle) {
    autoCopyToggle.addEventListener('change', () => {
      chrome.storage.sync.set({ autoCopy: autoCopyToggle.checked });
    });
  }

  if (autoEditorToggle) {
    autoEditorToggle.addEventListener('change', () => {
      chrome.storage.sync.set({ autoEditor: autoEditorToggle.checked });
    });
  }

  // ===== KEYBOARD SHORTCUTS (POPUP LEVEL) =====
  document.addEventListener('keydown', (e) => {
    // ESC closes popup
    if (e.key === 'Escape') {
      window.close();
    }

    // Alt/Cmd + Shift shortcuts
    const isModifier = e.altKey || e.metaKey;

    if (isModifier && e.shiftKey) {
      switch (e.key) {
        case '1':
          console.log('⌨️ Shortcut → Visible capture');
          btnVisible?.click();
          break;
        case '3':
          console.log('⌨️ Shortcut → Selection capture');
          btnSelection?.click();
          break;
      }
    }
  });
});
