document.addEventListener('DOMContentLoaded', function() {
  // Add keyboard shortcuts hint
  console.log('%c⚡ Tab Context Saver Loaded!', 'color: #8b5cf6; font-size: 16px; font-weight: bold;');
  console.log('%cShortcuts: Ctrl+S = Save, Ctrl+F = Search, Esc = Close', 'color: #94a3b8;');
  
  // Focus management for accessibility
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('saveModal');
      if (modal && modal.classList.contains('show')) {
        const cancelButton = document.getElementById('cancelSaveBtn');
        if (cancelButton) {
          cancelButton.click();
        }
      }
      const searchInput = document.getElementById('searchInput');
      if (searchInput && document.activeElement === searchInput && searchInput.value) {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
      }
    }
  });
  
  // Add active state to custom mode button by default
  const customModeBtn = document.querySelector('.mode-btn[data-mode="custom"]');
  if (customModeBtn) {
    customModeBtn.classList.add('active');
  }
});