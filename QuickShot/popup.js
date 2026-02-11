document.addEventListener('DOMContentLoaded', () => {
  // ===== ELEMENTS =====
  const btnVisible = document.getElementById('btn-visible');
  const btnSelection = document.getElementById('btn-selection');
  const openEditorBtn = document.getElementById('open-editor');

  console.log('📌 Popup elements loaded:', {
    btnVisible: !!btnVisible,
    btnSelection: !!btnSelection,
    openEditorBtn: !!openEditorBtn
  });

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

  if (openEditorBtn) {
    openEditorBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'editor.html' });
      window.close();
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
