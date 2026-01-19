// ========== DOM ELEMENTS WITH ERROR HANDLING ==========
function getElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`Element #${id} not found`);
        // Create a dummy element to prevent errors
        const dummy = document.createElement('div');
        dummy.style.display = 'none';
        return dummy;
    }
    return el;
}

const CONFIG = {
    NOTIFICATION_TIMEOUT: 3000, // 3 seconds
    IMAGES_PER_PAGE: 9,
    DEFAULT_QUALITY: 85,
    DEFAULT_SETTINGS: {
        folderName: 'ImageDownloads',
        filenamePattern: '{index}_{name}',
        convertWebP: 'none',
        quality: 85,
        filters: {
            minWidth: 100,
            minHeight: 100,
            fileTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            skipAds: true,
            skipIcons: true,
            skipBlurry: false
        }
    }
};

const elements = {
    // Stats
    imagesFound: getElement('images-found'),
    imagesSelected: getElement('images-selected'),
    totalSize: getElement('total-size'),
    
    // Buttons
    scanPageBtn: getElement('scan-page'),
    downloadSelectedBtn: getElement('download-selected'),
    downloadAllBtn: getElement('download-all'),
    openFolderBtn: getElement('open-folder'),
    selectAllBtn: getElement('select-all'),
    clearSelectionBtn: getElement('clear-selection'),
    refreshPreviewBtn: getElement('refresh-preview'),
    cancelDownloadBtn: getElement('cancel-download'),
    upgradeProBtn: getElement('upgrade-pro'),
    
    // Preview
    previewContainer: getElement('preview-container'),
    emptyState: getElement('empty-state'),
    
    // Progress
    progressContainer: getElement('progress-container'),
    progressFill: getElement('progress-fill'),
    progressPercent: getElement('progress-percent'),
    progressText: getElement('progress-text'),
    progressSpeed: getElement('progress-speed'),
    
    // Pagination
    currentPage: getElement('current-page'),
    totalPages: getElement('total-pages'),
    prevPage: getElement('prev-page'),
    nextPage: getElement('next-page')
};

// ========== STATE ==========
let currentImages = [];
let selectedImages = new Set();
let currentPage = 1;
const imagesPerPage = CONFIG.IMAGES_PER_PAGE;
let currentDownloadManager = null;
let imageFilter = null;
let isScanning = false;

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup initialized');
    
    // Initialize theme
    document.documentElement.setAttribute('data-theme', 'mint-teal');
    
    // Check if utility classes are loaded
    if (typeof ImageFilter === 'undefined') {
        console.warn('ImageFilter not found. Creating simple filter.');
        createSimpleImageFilter();
    } else {
        imageFilter = new ImageFilter();
    }
    
    if (typeof DownloadManager === 'undefined') {
        console.error('DownloadManager not loaded! Download functionality will not work.');
        showNotification('Download system not loaded. Please refresh extension.', 'error');
    }
    
    // Initialize UI
    initializeUI();
    
    // Load settings and scan current page
    loadSettings();
    scanCurrentPage();
});

// ========== SIMPLE FILTER (FALLBACK) ==========
function createSimpleImageFilter() {
    imageFilter = {
        filterImages: function(images, filters = {}) {
            return images.filter(img => {
                // Size filter
                if (filters.minWidth && img.width < filters.minWidth) return false;
                if (filters.minHeight && img.height < filters.minHeight) return false;
                
                // Type filter
                if (filters.fileTypes && filters.fileTypes.length > 0) {
                    const ext = getFileExtension(img.url).toLowerCase();
                    if (!filters.fileTypes.includes(ext)) return false;
                }
                
                return true;
            });
        }
    };
}

function getFileExtension(url) {
    try {
        const match = url.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
        return match ? match[1].toLowerCase() : '';
    } catch (error) {
        console.error('Error getting file extension:', error);
        return '';
    }
}

// ========== UI INITIALIZATION ==========
function initializeUI() {
    // Set up event listeners
    setupEventListeners();
    
    // Initialize quality slider
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('quality-value');
    
    if (qualitySlider && qualityValue) {
        qualitySlider.addEventListener('input', function(e) {
            qualityValue.textContent = `${e.target.value}%`;
            saveSettings();
        });
    }
    
    // Initialize other settings listeners
    document.querySelectorAll('input, select').forEach(element => {
        if (element.id !== 'quality') {
            element.addEventListener('change', saveSettings);
        }
    });
}

// ========== SETTINGS MANAGEMENT ==========
function loadSettings() {
    chrome.storage.sync.get([
        'folderName',
        'filenamePattern',
        'convertWebP',
        'quality',
        'filters'
    ], (result) => {
        try {
            // Set default values from CONFIG if not in storage
            const settings = {
                folderName: result.folderName || CONFIG.DEFAULT_SETTINGS.folderName,
                filenamePattern: result.filenamePattern || CONFIG.DEFAULT_SETTINGS.filenamePattern,
                convertWebP: result.convertWebP || CONFIG.DEFAULT_SETTINGS.convertWebP,
                quality: result.quality || CONFIG.DEFAULT_SETTINGS.quality,
                filters: result.filters || CONFIG.DEFAULT_SETTINGS.filters
            };
            
            // Apply settings to UI
            const folderInput = document.getElementById('folder-name');
            if (folderInput) folderInput.value = settings.folderName;
            
            const filenameSelect = document.getElementById('filename-pattern');
            if (filenameSelect) filenameSelect.value = settings.filenamePattern;
            
            const convertRadio = document.querySelector(`input[name="convert"][value="${settings.convertWebP}"]`);
            if (convertRadio) convertRadio.checked = true;
            
            const qualitySlider = document.getElementById('quality');
            const qualityValue = document.getElementById('quality-value');
            if (qualitySlider) qualitySlider.value = settings.quality;
            if (qualityValue) qualityValue.textContent = `${settings.quality}%`;
            
            if (settings.filters) {
                applySavedFilters(settings.filters);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            // Apply default settings on error
            applySavedFilters(CONFIG.DEFAULT_SETTINGS.filters);
        }
    });
}

function applySavedFilters(filters) {
    try {
        if (filters.minWidth) {
            const el = document.getElementById('min-width');
            if (el) el.value = filters.minWidth;
        }
        
        if (filters.minHeight) {
            const el = document.getElementById('min-height');
            if (el) el.value = filters.minHeight;
        }
        
        if (filters.fileTypes && Array.isArray(filters.fileTypes)) {
            document.querySelectorAll('.checkbox-item input').forEach(cb => {
                cb.checked = filters.fileTypes.includes(cb.value);
            });
        }
        
        const skipAds = document.getElementById('skip-ads');
        const skipIcons = document.getElementById('skip-icons');
        const skipBlurry = document.getElementById('skip-blurry');
        
        if (skipAds && filters.skipAds !== undefined) skipAds.checked = filters.skipAds;
        if (skipIcons && filters.skipIcons !== undefined) skipIcons.checked = filters.skipIcons;
        if (skipBlurry && filters.skipBlurry !== undefined) skipBlurry.checked = filters.skipBlurry;
        
    } catch (error) {
        console.error('Error applying filters:', error);
    }
}

function saveSettings() {
    try {
        const folderInput = document.getElementById('folder-name');
        const filenameSelect = document.getElementById('filename-pattern');
        const convertRadio = document.querySelector('input[name="convert"]:checked');
        const qualitySlider = document.getElementById('quality');
        
        const settings = {
            folderName: folderInput ? folderInput.value : CONFIG.DEFAULT_SETTINGS.folderName,
            filenamePattern: filenameSelect ? filenameSelect.value : CONFIG.DEFAULT_SETTINGS.filenamePattern,
            convertWebP: convertRadio ? convertRadio.value : CONFIG.DEFAULT_SETTINGS.convertWebP,
            quality: qualitySlider ? qualitySlider.value : CONFIG.DEFAULT_SETTINGS.quality,
            filters: getCurrentFilters()
        };
        
        chrome.storage.sync.set(settings);
        console.log('Settings saved');
        showNotification('Settings saved', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Error saving settings', 'error');
    }
}

function getCurrentFilters() {
    const checkedTypes = [];
    try {
        document.querySelectorAll('.checkbox-item input:checked').forEach(cb => {
            if (cb.value) checkedTypes.push(cb.value);
        });
    } catch (error) {
        console.error('Error getting checked types:', error);
    }
    
    const minWidth = document.getElementById('min-width');
    const minHeight = document.getElementById('min-height');
    const skipAds = document.getElementById('skip-ads');
    const skipIcons = document.getElementById('skip-icons');
    const skipBlurry = document.getElementById('skip-blurry');
    
    return {
        minWidth: minWidth ? parseInt(minWidth.value) || 100 : 100,
        minHeight: minHeight ? parseInt(minHeight.value) || 100 : 100,
        fileTypes: checkedTypes.length > 0 ? checkedTypes : CONFIG.DEFAULT_SETTINGS.filters.fileTypes,
        skipAds: skipAds ? skipAds.checked : true,
        skipIcons: skipIcons ? skipIcons.checked : true,
        skipBlurry: skipBlurry ? skipBlurry.checked : false
    };
}

// ========== IMAGE SCANNING ==========
function scanCurrentPage() {
    if (isScanning) return;
    
    isScanning = true;
    setScanButtonState(true);
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0]) {
            console.error('No active tab found');
            setScanButtonState(false);
            isScanning = false;
            showNotification('No active tab found', 'error');
            return;
        }
        
        const tabId = tabs[0].id;
        
        // Send message to content script
        chrome.tabs.sendMessage(tabId, { action: 'scanImages' }, (response) => {
            isScanning = false;
            setScanButtonState(false);
            
            if (chrome.runtime.lastError) {
                console.error('Content script error:', chrome.runtime.lastError.message);
                showNotification('Error: Content script not loaded on this page', 'error');
                currentImages = [];
                updateImageGrid();
                updateStats();
                return;
            }
            
            // In scanCurrentPage function, around line 179-190:
                if (response && response.images && response.images.length > 0) {
                    console.log(`Found ${response.images.length} images`);
                    
                    // Don't apply filters on initial scan
                    currentImages = response.images; // Use all images initially
                    selectedImages.clear();
                    currentPage = 1;
                    
                    updateImageGrid();
                    updateStats();
                    
                    showNotification(`Found ${response.images.length} images`, 'info');
                } else {
                        console.log('No images found');
                        showNotification('No images found on this page', 'info');
                        currentImages = [];
                        selectedImages.clear();
                        updateImageGrid();
                        updateStats();
            }
        });
    });
}

function setScanButtonState(scanning) {
    if (!elements.scanPageBtn) return;
    
    if (scanning) {
        elements.scanPageBtn.disabled = true;
        elements.scanPageBtn.innerHTML = '<span class="icon">⏳</span><span class="text">Scanning...</span>';
    } else {
        elements.scanPageBtn.disabled = false;
        elements.scanPageBtn.innerHTML = '<span class="icon">🔍</span><span class="text">Scan Page</span>';
    }
}

// ========== IMAGE GRID & PREVIEW ==========
function updateImageGrid() {
    if (!elements.previewContainer || !elements.emptyState) return;
    
    if (currentImages.length === 0) {
        elements.previewContainer.innerHTML = '';
        elements.emptyState.style.display = 'flex';
        elements.previewContainer.appendChild(elements.emptyState);
        updatePagination();
        return;
    }
    
    elements.emptyState.style.display = 'none';
    
    // Calculate pagination
    const totalPages = Math.ceil(currentImages.length / imagesPerPage);
    const startIdx = (currentPage - 1) * imagesPerPage;
    const endIdx = Math.min(startIdx + imagesPerPage, currentImages.length);
    const pageImages = currentImages.slice(startIdx, endIdx);
    
    // Create image grid
    const grid = document.createElement('div');
    grid.className = 'image-grid';
    
    pageImages.forEach((img, index) => {
        const actualIndex = startIdx + index;
        const isSelected = selectedImages.has(actualIndex);
        
        const item = createImageItem(img, actualIndex, isSelected);
        grid.appendChild(item);
    });
    
    elements.previewContainer.innerHTML = '';
    elements.previewContainer.appendChild(grid);
    updatePagination();
    
    // Load images with better handling
    loadImagesWithRetry(pageImages, startIdx);
}

function createImageItem(img, index, isSelected) {
    const item = document.createElement('div');
    item.className = `image-item ${isSelected ? 'selected' : ''}`;
    item.dataset.index = index;
    
    // Create loading placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'image-placeholder';
    placeholder.innerHTML = '<div class="loading-spinner"></div>';
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';
    overlay.textContent = `${img.width}×${img.height}`;
    
    // Create checkbox if selected
    let checkbox = null;
    if (isSelected) {
        checkbox = document.createElement('div');
        checkbox.className = 'checkbox-overlay';
        checkbox.textContent = '✓';
    }
    
    // Assemble
    item.appendChild(placeholder);
    item.appendChild(overlay);
    if (checkbox) item.appendChild(checkbox);
    
    // Add click handler
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleImageSelection(index);
    });
    
    return item;
}

function loadImagesWithRetry(images, startIdx) {
    images.forEach((img, index) => {
        const actualIndex = startIdx + index;
        const item = document.querySelector(`.image-item[data-index="${actualIndex}"]`);
        if (!item) return;
        
        loadSingleImage(item, img);
    });
}

function loadSingleImage(item, img) {
    const placeholder = item.querySelector('.image-placeholder');
    if (!placeholder) return;
    
    const imageElement = new Image();
    imageElement.crossOrigin = 'anonymous';
    
    // Set timeout
    const timeout = setTimeout(() => {
        if (!imageElement.complete) {
            showImageError(item, img, 'Timeout');
        }
    }, 5000);
    
    imageElement.onload = function() {
        clearTimeout(timeout);
        showImageSuccess(item, imageElement.src, img);
    };
    
    imageElement.onerror = function() {
        clearTimeout(timeout);
        showImageError(item, img, 'Load failed');
    };
    
    imageElement.src = img.url;
}

function showImageSuccess(item, src, img) {
    const placeholder = item.querySelector('.image-placeholder');
    if (!placeholder) return;
    
    const imgElement = document.createElement('img');
    imgElement.className = 'image-preview loaded';
    imgElement.src = src;
    imgElement.alt = img.alt || 'image';
    imgElement.title = img.filename || '';
    
    // Replace placeholder with image
    placeholder.replaceWith(imgElement);
}

function showImageError(item, img, error) {
    const placeholder = item.querySelector('.image-placeholder');
    if (!placeholder) return;
    
    const fallback = document.createElement('div');
    fallback.className = 'image-fallback';
    fallback.innerHTML = '⚠️';
    fallback.title = `Failed to load: ${error}`;
    
    // Add retry on click
    fallback.addEventListener('click', (e) => {
        e.stopPropagation();
        loadSingleImage(item, img);
    });
    
    placeholder.replaceWith(fallback);
    
    // Update overlay to show error
    const overlay = item.querySelector('.image-overlay');
    if (overlay) {
        overlay.textContent = 'Load Failed';
        overlay.style.color = '#EF4444';
    }
}

// ========== SELECTION MANAGEMENT ==========
function toggleImageSelection(index) {
    if (selectedImages.has(index)) {
        selectedImages.delete(index);
    } else {
        selectedImages.add(index);
    }
    
    const item = document.querySelector(`.image-item[data-index="${index}"]`);
    if (item) {
        item.classList.toggle('selected');
        
        // Update checkbox
        const checkbox = item.querySelector('.checkbox-overlay');
        if (selectedImages.has(index)) {
            if (!checkbox) {
                const newCheckbox = document.createElement('div');
                newCheckbox.className = 'checkbox-overlay';
                newCheckbox.textContent = '✓';
                item.appendChild(newCheckbox);
            }
        } else if (checkbox) {
            checkbox.remove();
        }
    }
    
    updateStats();
}

function selectAllImages() {
    if (currentImages.length === 0) {
        showNotification('No images to select', 'warning');
        return;
    }
    
    for (let i = 0; i < currentImages.length; i++) {
        selectedImages.add(i);
    }
    updateImageGrid();
    updateStats();
    showNotification(`Selected all ${currentImages.length} images`, 'info');
}

function clearSelection() {
    if (selectedImages.size === 0) {
        showNotification('No selection to clear', 'info');
        return;
    }
    
    selectedImages.clear();
    updateImageGrid();
    updateStats();
    showNotification('Selection cleared', 'info');
}

// ========== PAGINATION ==========
function updatePagination() {
    const totalPages = Math.ceil(currentImages.length / imagesPerPage);
    
    if (elements.currentPage) {
        elements.currentPage.textContent = currentPage;
    }
    
    if (elements.totalPages) {
        elements.totalPages.textContent = totalPages;
    }
    
    if (elements.prevPage) {
        elements.prevPage.disabled = currentPage <= 1;
        elements.prevPage.style.opacity = currentPage <= 1 ? '0.5' : '1';
    }
    
    if (elements.nextPage) {
        elements.nextPage.disabled = currentPage >= totalPages;
        elements.nextPage.style.opacity = currentPage >= totalPages ? '0.5' : '1';
    }
}

function goToPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        updateImageGrid();
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(currentImages.length / imagesPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        updateImageGrid();
    }
}

// ========== STATISTICS ==========
function updateStats() {
    if (elements.imagesFound) {
        elements.imagesFound.textContent = currentImages.length;
    }
    
    if (elements.imagesSelected) {
        elements.imagesSelected.textContent = selectedImages.size;
    }
    
    if (elements.totalSize) {
        // Calculate total size
        const totalSizeKB = currentImages.reduce((sum, img) => {
            return sum + (img.sizeKB || (img.width * img.height / 10000)); // Estimate size
        }, 0);
        const totalSizeMB = (totalSizeKB / 1024).toFixed(1);
        elements.totalSize.textContent = `${totalSizeMB} MB`;
    }
}

// ========== DOWNLOAD MANAGEMENT ==========
async function downloadSelectedImages() {
    if (selectedImages.size === 0) {
        showNotification('Please select images to download', 'warning');
        return;
    }
    
    const imagesToDownload = Array.from(selectedImages).map(idx => currentImages[idx]);
    await startDownload(imagesToDownload);
}

async function downloadAllImages() {
    if (currentImages.length === 0) {
        showNotification('No images found to download', 'warning');
        return;
    }
    
    await startDownload(currentImages);
}

async function startDownload(images) {
    // Check if DownloadManager is available
    if (typeof DownloadManager === 'undefined') {
        showNotification('Download system not available. Please refresh extension.', 'error');
        return;
    }
    
    // Get settings
    const settings = {
        folderName: document.getElementById('folder-name')?.value || generateFolderName(),
        filenamePattern: document.getElementById('filename-pattern')?.value || '{index}_{name}',
        convertTo: document.querySelector('input[name="convert"]:checked')?.value || 'none',
        quality: parseInt(document.getElementById('quality')?.value || CONFIG.DEFAULT_QUALITY) / 100
    };
    
    // Save settings
    saveSettings();
    
    // Show progress
    showProgress(true);
    updateProgress(0, images.length);
    
    try {
        // Create download manager
        currentDownloadManager = new DownloadManager();
        
        // Start download
        const result = await currentDownloadManager.downloadImages(images, settings, 
            (current, total) => {
                const percent = Math.round((current / total) * 100);
                updateProgress(current, total, percent);
            }
        );
        
        // Download complete
        setTimeout(() => {
            showProgress(false);
            
            if (result.success > 0) {
                showNotification(`✅ Downloaded ${result.success} images successfully!`, 'success');
            }
            if (result.failed > 0) {
                showNotification(`⚠️ ${result.failed} images failed to download`, 'warning');
            }
        }, 1000);
        
    } catch (error) {
        console.error('Download error:', error);
        showProgress(false);
        showNotification(`❌ Download failed: ${error.message}`, 'error');
    } finally {
        currentDownloadManager = null;
    }
}

function generateFolderName() {
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const pageTitle = document.title.substring(0, 30).replace(/[^\w\s]/gi, '') || 'images';
    return `ImageDownloads/${pageTitle}_${timestamp}`;
}

function showProgress(show) {
    if (elements.progressContainer) {
        elements.progressContainer.style.display = show ? 'block' : 'none';
    }
}

function updateProgress(current, total, percent = 0) {
    if (elements.progressFill) {
        elements.progressFill.style.width = `${percent}%`;
    }
    
    if (elements.progressPercent) {
        elements.progressPercent.textContent = `${percent}%`;
    }
    
    if (elements.progressText) {
        elements.progressText.textContent = `${current}/${total} images`;
    }
}

function cancelDownload() {
    if (currentDownloadManager) {
        currentDownloadManager.cancel();
        showProgress(false);
        showNotification('Download cancelled', 'warning');
    } else {
        showProgress(false);
    }
}

// ========== NOTIFICATION SYSTEM ==========
function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const colors = {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6'
    };
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: notificationSlideIn 0.3s ease;
    `;
    
    // Add animation styles if not present
    if (!document.querySelector('#notification-animations')) {
        const style = document.createElement('style');
        style.id = 'notification-animations';
        style.textContent = `
            @keyframes notificationSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes notificationSlideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after timeout
    setTimeout(() => {
        notification.style.animation = 'notificationSlideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, CONFIG.NOTIFICATION_TIMEOUT);
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    // Scan page
    if (elements.scanPageBtn) {
        elements.scanPageBtn.addEventListener('click', scanCurrentPage);
    }
    
    // Download buttons
    if (elements.downloadSelectedBtn) {
        elements.downloadSelectedBtn.addEventListener('click', downloadSelectedImages);
    }
    
    if (elements.downloadAllBtn) {
        elements.downloadAllBtn.addEventListener('click', downloadAllImages);
    }
    
    // Open folder
    if (elements.openFolderBtn) {
        elements.openFolderBtn.addEventListener('click', () => {
            chrome.downloads.showDefaultFolder();
        });
    }
    
    // Selection controls
    if (elements.selectAllBtn) {
        elements.selectAllBtn.addEventListener('click', selectAllImages);
    }
    
    if (elements.clearSelectionBtn) {
        elements.clearSelectionBtn.addEventListener('click', clearSelection);
    }
    
    if (elements.refreshPreviewBtn) {
        elements.refreshPreviewBtn.addEventListener('click', () => {
            updateImageGrid();
            showNotification('Preview refreshed', 'info');
        });
    }
    
    // Pagination
    if (elements.prevPage) {
        elements.prevPage.addEventListener('click', goToPreviousPage);
    }
    
    if (elements.nextPage) {
        elements.nextPage.addEventListener('click', goToNextPage);
    }
    
    // Cancel download
    if (elements.cancelDownloadBtn) {
        elements.cancelDownloadBtn.addEventListener('click', cancelDownload);
    }
    
    // Upgrade to Pro
    if (elements.upgradeProBtn) {
        elements.upgradeProBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://your-website.com/pro' });
        });
    }
    
    // Filter changes
    const filterIds = ['min-width', 'min-height', 'skip-ads', 'skip-icons', 'skip-blurry'];
    filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                if (currentImages.length > 0) {
                    const filteredImages = imageFilter.filterImages(currentImages, getCurrentFilters());
                    currentImages = filteredImages;
                    selectedImages.clear();
                    currentPage = 1;
                    updateImageGrid();
                    updateStats();
                    showNotification('Filters applied', 'info');
                }
            });
        }
    });
    
    // File type checkboxes
    document.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
            if (currentImages.length > 0) {
                const filteredImages = imageFilter.filterImages(currentImages, getCurrentFilters());
                currentImages = filteredImages;
                selectedImages.clear();
                currentPage = 1;
                updateImageGrid();
                updateStats();
                showNotification('Filters applied', 'info');
            }
        });
    });
}

// ========== UTILITY FUNCTIONS ==========
function openDownloadsFolder() {
    chrome.downloads.showDefaultFolder();
}

// Make functions available globally (for inline event handlers in HTML if needed)
window.selectAllImages = selectAllImages;
window.clearSelection = clearSelection;
window.goToPreviousPage = goToPreviousPage;
window.goToNextPage = goToNextPage;