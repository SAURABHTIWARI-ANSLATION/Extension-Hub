// My Web Library - Main Popup Script
// CSP 10/10 Compliant - Security Hardened for Production

// Global variables
let currentPage = { title: '', url: '' };
let allItems = [];
let selectedPriority = 'medium';
let settings = {
  autoTag: true,
  saveScreenshot: false,
  defaultView: 'save'
};

// Validation constants
const MAX_TAG_LENGTH = 30;
const MAX_NOTES_LENGTH = 2000;
const MAX_TAGS_COUNT = 20;
const MAX_LIBRARY_ITEMS = 500;

// Common tags for suggestions
const commonTags = [
  'javascript', 'python', 'react', 'vue', 'angular', 'nodejs',
  'design', 'ui/ux', 'css', 'html', 'tutorial', 'guide',
  'inspiration', 'productivity', 'work', 'personal', 'study',
  'ai', 'machine-learning', 'database', 'api', 'security'
];

// Load settings from storage
function loadSettings() {
  chrome.storage.local.get(['librarySettings'], (result) => {
    if (result.librarySettings) {
      settings = result.librarySettings;
      const autoTagSetting = document.getElementById('autoTagSetting');
      const saveScreenshotSetting = document.getElementById('saveScreenshotSetting');
      const defaultViewSetting = document.getElementById('defaultViewSetting');
      
      if (autoTagSetting) autoTagSetting.checked = settings.autoTag;
      if (saveScreenshotSetting) saveScreenshotSetting.checked = settings.saveScreenshot;
      if (defaultViewSetting) defaultViewSetting.value = settings.defaultView;
      
      if (window.CADropdowns && defaultViewSetting) {
        window.CADropdowns.sync('defaultViewSetting');
      }
    }
    applySettings();
  });
}

function saveSettings() {
  chrome.storage.local.set({ librarySettings: settings });
}

function applySettings() {
  if (settings.defaultView === 'library') {
    showLibraryView();
  }
}

// Load dark mode preference
function loadDarkMode() {
  chrome.storage.local.get(['darkMode'], (result) => {
    if (result.darkMode) {
      document.body.classList.add('dark-mode');
    }
  });
}

// Load current page info
async function loadCurrentPageInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && isValidUrl(tab.url)) {
      currentPage.title = sanitizeText(tab.title || 'Untitled', 200);
      currentPage.url = sanitizeUrl(tab.url);
    } else {
      currentPage.title = 'Cannot save Chrome internal page';
      currentPage.url = tab?.url || 'N/A';
    }
    
    const titleEl = document.getElementById('pageTitle');
    const urlEl = document.getElementById('pageUrl');
    const domainEl = document.getElementById('pageDomain');
    if (titleEl) titleEl.textContent = currentPage.title;
    if (urlEl) urlEl.textContent = currentPage.url;
    if (domainEl) domainEl.textContent = getDomainLabel(currentPage.url);
  } catch (error) {
    console.error('Error loading page info:', error);
    const titleEl = document.getElementById('pageTitle');
    const urlEl = document.getElementById('pageUrl');
    const domainEl = document.getElementById('pageDomain');
    if (titleEl) titleEl.textContent = 'Error loading page';
    if (urlEl) urlEl.textContent = 'Please refresh and try again';
    if (domainEl) domainEl.textContent = 'Unavailable';
  }
}

function loadLibraryFromStorage() {
  chrome.storage.local.get(['webLibrary'], (result) => {
    allItems = result.webLibrary || [];
    displayLibraryItems();
    updateTagFilters();
    updateStats();
  });
}

function saveLibraryToStorage() {
  chrome.storage.local.set({ webLibrary: allItems }, () => {
    updateStats();
  });
}

function setupEventListeners() {
  // Main buttons
  const saveBtn = document.getElementById('saveBtn');
  const viewLibraryBtn = document.getElementById('viewLibraryBtn');
  const backBtn = document.getElementById('backToSaveBtn');
  const searchInput = document.getElementById('searchInput');
  const exportBtn = document.getElementById('exportBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const darkModeBtn = document.getElementById('darkModeBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  
  if (saveBtn) saveBtn.addEventListener('click', saveCurrentPage);
  if (viewLibraryBtn) viewLibraryBtn.addEventListener('click', showLibraryView);
  if (backBtn) backBtn.addEventListener('click', showSaveView);
  if (searchInput) searchInput.addEventListener('input', debounce(() => displayLibraryItems(), 300));
  if (exportBtn) exportBtn.addEventListener('click', exportLibrary);
  if (settingsBtn) settingsBtn.addEventListener('click', showSettingsModal);
  if (darkModeBtn) darkModeBtn.addEventListener('click', toggleDarkMode);
  if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllData);
  if (closeModalBtn) closeModalBtn.addEventListener('click', () => {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.style.display = 'none';
  });
  
  // Close modal on outside click
  const modal = document.getElementById('settingsModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
  
  // Priority buttons
  const priorityBtns = document.querySelectorAll('.priority-btn');
  priorityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      priorityBtns.forEach(b => b.classList.remove('priority-active'));
      btn.classList.add('priority-active');
      selectedPriority = btn.getAttribute('data-priority') || 'medium';
    });
  });
  
  // Filter status buttons
  const filterStatusBtns = document.querySelectorAll('.filter-status-btn');
  filterStatusBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterStatusBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      displayLibraryItems();
    });
  });
  
  // Settings toggles
  const autoTagSetting = document.getElementById('autoTagSetting');
  const saveScreenshotSetting = document.getElementById('saveScreenshotSetting');
  const defaultViewSetting = document.getElementById('defaultViewSetting');
  
  if (autoTagSetting) {
    autoTagSetting.addEventListener('change', (e) => {
      settings.autoTag = e.target.checked;
      saveSettings();
    });
  }
  
  if (saveScreenshotSetting) {
    saveScreenshotSetting.addEventListener('change', (e) => {
      settings.saveScreenshot = e.target.checked;
      saveSettings();
    });
  }
  
  if (defaultViewSetting) {
    defaultViewSetting.addEventListener('change', (e) => {
      settings.defaultView = e.target.value;
      saveSettings();
      if (settings.defaultView === 'library') {
        showLibraryView();
      } else {
        showSaveView();
      }
    });
  }
  
  // Tags input suggestions
  const tagsInput = document.getElementById('tagsInput');
  if (tagsInput) {
    tagsInput.addEventListener('input', (e) => {
      if (settings.autoTag) {
        showTagSuggestions(e.target.value);
      }
    });
  }
}

// Debounce helper for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function loadTagSuggestions() {
  const container = document.getElementById('tagSuggestions');
  if (!container) return;
  
  container.innerHTML = commonTags.slice(0, 8).map(tag => 
    `<span class="suggestion-tag" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>`
  ).join('');
  
  const suggestionTags = document.querySelectorAll('.suggestion-tag');
  suggestionTags.forEach(tag => {
    tag.addEventListener('click', () => {
      const tagsInput = document.getElementById('tagsInput');
      if (tagsInput) {
        const currentTags = tagsInput.value;
        const newTag = tag.getAttribute('data-tag');
        if (newTag) {
          tagsInput.value = currentTags ? `${currentTags}, ${newTag}` : newTag;
        }
      }
    });
  });
}

function showTagSuggestions(input) {
  const container = document.getElementById('tagSuggestions');
  if (!container) return;
  
  if (!input || input.length < 1) {
    container.style.display = 'flex';
    return;
  }
  
  const filtered = commonTags.filter(tag => 
    tag.toLowerCase().includes(input.toLowerCase())
  ).slice(0, 5);
  
  container.innerHTML = filtered.map(tag => 
    `<span class="suggestion-tag" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>`
  ).join('');
  
  const suggestionTags = document.querySelectorAll('.suggestion-tag');
  suggestionTags.forEach(tag => {
    tag.addEventListener('click', () => {
      const tagsInput = document.getElementById('tagsInput');
      if (tagsInput) {
        const tagValue = tag.getAttribute('data-tag');
        if (tagValue) {
          tagsInput.value = tagsInput.value ? `${tagsInput.value}, ${tagValue}` : tagValue;
        }
      }
    });
  });
}

function isValidUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitizeText(text, maxLength = 5000) {
  if (!text) return '';
  return text.substring(0, maxLength).replace(/[^\w\s\-.,!?;:()@#$%&*+=/\\[\]{}|<>~`'"]/g, '');
}

function sanitizeUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.href;
  } catch {
    return '';
  }
}

function validateTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter(tag => tag && typeof tag === 'string')
    .map(tag => tag.substring(0, MAX_TAG_LENGTH))
    .slice(0, MAX_TAGS_COUNT);
}

function saveCurrentPage() {
  const tagsInput = document.getElementById('tagsInput');
  const notesInput = document.getElementById('notesInput');
  const statusSelect = document.getElementById('statusSelect');
  
  let tags = tagsInput ? tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];
  let notes = notesInput ? notesInput.value : '';
  
  // Validate and sanitize inputs
  tags = validateTags(tags);
  notes = sanitizeText(notes, MAX_NOTES_LENGTH);
  const status = statusSelect ? statusSelect.value : 'read-later';
  
  if (!isValidUrl(currentPage.url)) {
    showMessage('Cannot save Chrome internal pages', 'error');
    return;
  }
  
  // Check for duplicate
  const exists = allItems.some(item => item.url === currentPage.url);
  if (exists) {
    showMessage('Page already in library!', 'error');
    return;
  }
  
  // Check library size limit
  if (allItems.length >= MAX_LIBRARY_ITEMS) {
    showMessage('Library is full. Delete some items first.', 'error');
    return;
  }
  
  const savedItem = {
    id: Date.now(),
    title: sanitizeText(currentPage.title, 200),
    url: sanitizeUrl(currentPage.url),
    tags: tags,
    notes: notes,
    status: status,
    priority: selectedPriority,
    favorite: false,
    savedDate: new Date().toISOString()
  };
  
  allItems.push(savedItem);
  saveLibraryToStorage();
  
  if (tagsInput) tagsInput.value = '';
  if (notesInput) notesInput.value = '';
  
  showMessage('Page saved to library!', 'success');
  
  const libraryView = document.getElementById('libraryView');
  if (libraryView && libraryView.style.display !== 'none') {
    displayLibraryItems();
    updateTagFilters();
  }
}

function showLibraryView() {
  const saveSection = document.getElementById('saveSection');
  const libraryView = document.getElementById('libraryView');
  
  if (saveSection) saveSection.style.display = 'none';
  if (libraryView) libraryView.style.display = 'block';
  
  displayLibraryItems();
  updateTagFilters();
  updateStats();
}

function showSaveView() {
  const saveSection = document.getElementById('saveSection');
  const libraryView = document.getElementById('libraryView');
  
  if (saveSection) saveSection.style.display = 'block';
  if (libraryView) libraryView.style.display = 'none';
  
  loadCurrentPageInfo();
}

function displayLibraryItems() {
  const container = document.getElementById('savedItemsList');
  const searchInput = document.getElementById('searchInput');
  const activeFilter = document.querySelector('.filter-status-btn.active');
  
  const searchTerm = searchInput ? sanitizeText(searchInput.value.toLowerCase()) : '';
  const activeStatus = activeFilter ? activeFilter.getAttribute('data-status') : 'all';
  
  let filteredItems = [...allItems];
  
  if (activeStatus !== 'all') {
    filteredItems = filteredItems.filter(item => item.status === activeStatus);
  }
  
  if (searchTerm) {
    filteredItems = filteredItems.filter(item => 
      (item.title && item.title.toLowerCase().includes(searchTerm)) ||
      (item.url && item.url.toLowerCase().includes(searchTerm)) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm)) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
  }
  
  if (!container) return;
  
  if (filteredItems.length === 0) {
    const emptyMessage = allItems.length === 0
      ? 'No pages saved yet. Start by capturing the current tab.'
      : 'No saved items match the current search or filters.';
    container.innerHTML = `<div class="empty-state"><p>${escapeHtml(emptyMessage)}</p></div>`;
    return;
  }
  
  container.innerHTML = filteredItems.map(item => `
    <div class="saved-item" data-id="${item.id}">
      <div class="item-header">
        <div class="item-title" data-url="${escapeHtml(item.url)}" title="Click to open">
          ${escapeHtml(item.title || 'Untitled')}
        </div>
        <span class="favorite-star ${item.favorite ? 'active' : ''}" data-id="${item.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#FBBF24" stroke-width="2" stroke-linejoin="round" ${item.favorite ? 'fill="#FBBF24"' : ''}/>
          </svg>
        </span>
      </div>
      <div class="item-meta-row">
        <span class="item-status-badge status-${escapeHtml(item.status)}">${escapeHtml(getStatusText(item.status))}</span>
        <span class="item-priority priority-${escapeHtml(item.priority)}">
          ${getPriorityMarkup(item.priority)}
        </span>
      </div>
      <div class="item-url">${escapeHtml(item.url)}</div>
      <div class="item-tags">
        ${item.tags && item.tags.length > 0 ? item.tags.map(tag => `<span class="item-tag">${escapeHtml(tag)}</span>`).join('') : '<span class="item-tag item-tag-muted">No tags</span>'}
      </div>
      ${item.notes ? `<div class="item-notes">${escapeHtml(item.notes)}</div>` : ''}
      <div class="item-meta">
        <span>${escapeHtml(formatSavedDate(item.savedDate))}</span>
        <div class="item-actions">
          <button class="open-btn" data-url="${escapeHtml(item.url)}">Open</button>
          <button class="delete-btn" data-id="${item.id}">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
  
  // Add event listeners for dynamically created elements
  const itemTitles = document.querySelectorAll('.item-title');
  itemTitles.forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = el.getAttribute('data-url');
      if (url && isValidUrl(url)) openInNewTab(url);
    });
  });
  
  const openBtns = document.querySelectorAll('.open-btn');
  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = btn.getAttribute('data-url');
      if (url && isValidUrl(url)) openInNewTab(url);
    });
  });
  
  const deleteBtns = document.querySelectorAll('.delete-btn');
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute('data-id') || '0');
      if (id && !isNaN(id)) deleteItem(id);
    });
  });
  
  const favoriteStars = document.querySelectorAll('.favorite-star');
  favoriteStars.forEach(star => {
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(star.getAttribute('data-id') || '0');
      if (id && !isNaN(id)) toggleFavorite(id);
    });
  });
}

function getStatusText(status) {
  const statusMap = {
    'read-later': 'Read Later',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'archived': 'Archived'
  };
  return statusMap[status] || status;
}

function getPriorityMarkup(priority) {
  const priorityMap = {
    high: 'High Priority',
    medium: 'Medium Priority',
    low: 'Low Priority'
  };
  const label = priorityMap[priority] || 'Priority';
  return `<span class="priority-dot" aria-hidden="true"></span><span>${escapeHtml(label)}</span>`;
}

function toggleFavorite(id) {
  const item = allItems.find(i => i.id === id);
  if (item) {
    item.favorite = !item.favorite;
    saveLibraryToStorage();
    displayLibraryItems();
  }
}

function updateStats() {
  const total = allItems.length;
  const completed = allItems.filter(i => i.status === 'completed').length;
  const reading = allItems.filter(i => i.status === 'in-progress').length;
  
  const totalEl = document.getElementById('totalCount');
  const completedEl = document.getElementById('completedCount');
  const readingEl = document.getElementById('readingCount');
  
  if (totalEl) totalEl.textContent = total.toString();
  if (completedEl) completedEl.textContent = completed.toString();
  if (readingEl) readingEl.textContent = reading.toString();
}

function exportLibrary() {
  const exportData = {
    version: "2.0.0",
    exportedAt: new Date().toISOString(),
    items: allItems.map(item => ({
      ...item,
      // Ensure all fields are clean
      title: sanitizeText(item.title, 200),
      notes: sanitizeText(item.notes, MAX_NOTES_LENGTH),
      tags: validateTags(item.tags)
    }))
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const exportFileDefaultName = `web-library-export-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  showMessage('Library exported successfully!', 'success');
}

function clearAllData() {
  if (confirm('⚠️ WARNING: This will permanently delete ALL saved items. This action cannot be undone. Are you sure?')) {
    allItems = [];
    saveLibraryToStorage();
    displayLibraryItems();
    updateTagFilters();
    updateStats();
    showMessage('All data cleared', 'success');
  }
}

function showSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.style.display = 'flex';
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  chrome.storage.local.set({ darkMode: isDark });
}

function openInNewTab(url) {
  if (!url || !isValidUrl(url)) {
    showMessage('Cannot open invalid URL', 'error');
    return;
  }
  chrome.tabs.create({ url: url, active: true });
}

function updateTagFilters() {
  const allTags = new Set();
  allItems.forEach(item => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach(tag => {
        if (tag && typeof tag === 'string') {
          allTags.add(tag.substring(0, MAX_TAG_LENGTH));
        }
      });
    }
  });
  
  const filterTagsContainer = document.getElementById('filterTags');
  if (!filterTagsContainer) return;
  
  if (allTags.size === 0) {
    filterTagsContainer.innerHTML = '<div class="empty-inline">No tags yet</div>';
    return;
  }
  
  filterTagsContainer.innerHTML = Array.from(allTags).map(tag => `
    <span class="filter-tag" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>
  `).join('');
  
  const filterTags = document.querySelectorAll('.filter-tag');
  filterTags.forEach(tag => {
    tag.addEventListener('click', () => {
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.value = tag.getAttribute('data-tag') || '';
        displayLibraryItems();
      }
    });
  });
}

function deleteItem(id) {
  if (confirm('Delete this item?')) {
    allItems = allItems.filter(item => item.id !== id);
    saveLibraryToStorage();
    displayLibraryItems();
    updateTagFilters();
    showMessage('Item deleted', 'success');
  }
}

function showMessage(message, type) {
  const messageDiv = document.getElementById('saveMessage');
  if (!messageDiv) return;
  
  messageDiv.textContent = escapeHtml(message);
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = 'block';
  
  setTimeout(() => {
    messageDiv.style.display = 'none';
    messageDiv.className = 'message';
  }, 3000);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getDomainLabel(url) {
  if (!url || !isValidUrl(url)) return 'Unavailable';
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host || 'Website';
  } catch (error) {
    return 'Website';
  }
}

function formatSavedDate(savedDate) {
  if (!savedDate) return 'Saved recently';
  try {
    const date = new Date(savedDate);
    if (isNaN(date.getTime())) return 'Saved recently';
    return `Saved ${date.toLocaleDateString()}`;
  } catch (error) {
    return 'Saved recently';
  }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentPageInfo();
  loadLibraryFromStorage();
  loadSettings();
  loadDarkMode();
  setupEventListeners();
  loadTagSuggestions();
  if (window.CADropdowns) {
    window.CADropdowns.init();
  }
});