(function() {
    console.log('🖼️ Image Download Helper content script starting...');
    
    // Ensure we only run once per page
    if (window.__imageHelperLoaded) {
        console.log('Already loaded, skipping...');
        return;
    }
    window.__imageHelperLoaded = true;
})();

// ========== MESSAGE HANDLER ==========
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request.action);
    
    if (request.action === 'scanImages') {
        // Special handling for Poki
        if (window.location.hostname.includes('poki.com')) {
            console.log('Poki.com detected, using enhanced loading...');
            
            forceLoadAllImages().then(() => {
                setTimeout(() => {
                    const images = extractAllImagesPoki();
                    console.log(`Found ${images.length} images on Poki`);
                    sendResponse({ images: images });
                }, 1000);
            });
            
            return true;
        }
        
        // Normal handling for other sites
        forceLoadLazyImages();
        
        setTimeout(() => {
            const images = extractAllImages();
            console.log(`Found ${images.length} images`);
            sendResponse({ images: images });
        }, 300);
        
        return true;
    }
    
    if (request.action === 'highlightImages') {
        highlightImagesOnPage();
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === 'clearHighlights') {
        removeHighlights();
        sendResponse({ success: true });
        return true;
    }
});

// ========== MAIN IMAGE EXTRACTION ==========
function extractAllImages() {
    console.time('extractAllImages');
    const images = [];
    
    // 1. Extract from <img> tags (main source)
    extractImgTags(images);
    
    // 2. Extract background images
    extractBackgroundImages(images);
    
    // 3. Extract from picture/source elements
    extractPictureElements(images);
    
    // 4. Remove duplicates and invalid images
    const filteredImages = filterAndCleanImages(images);
    
    console.timeEnd('extractAllImages');
    return filteredImages;
}

// ========== IMG TAGS EXTRACTION ==========
function extractImgTags(images) {
    const imgElements = document.querySelectorAll('img');
    console.log(`Found ${imgElements.length} <img> tags`);
    
    imgElements.forEach((img, index) => {
        try {
            const src = getBestImageSource(img);
            
            if (src && isValidImageUrl(src)) {
                const imageData = createImageData(img, src, index, 'img');
                images.push(imageData);
            }
        } catch (error) {
            console.warn('Error processing img tag:', error);
        }
    });
}

// Get the best possible image source from an element
function getBestImageSource(img) {
    // Priority order: high quality > available > fallback
    
    // Check for srcset with high-resolution images
    if (img.srcset) {
        const sources = img.srcset.split(',');
        // Get the highest resolution source (last one usually)
        const bestSrc = sources[sources.length - 1].trim().split(' ')[0];
        if (bestSrc && isValidImageUrl(bestSrc)) {
            return makeAbsoluteUrl(bestSrc);
        }
    }
    
    // Check various attributes in priority order
    const attributePriority = [
        'data-highres-src',
        'data-original',
        'data-src',
        'data-lazy-src',
        'data-srcset',
        'src',
        'currentSrc'
    ];
    
    for (const attr of attributePriority) {
        let value = img.getAttribute(attr) || img[attr];
        
        if (attr === 'data-srcset' && value) {
            // Get first source from srcset
            value = value.split(',')[0].trim().split(' ')[0];
        }
        
        if (value && !value.startsWith('data:') && isValidImageUrl(value)) {
            return makeAbsoluteUrl(value);
        }
    }
    
    return null;
}

// Create standardized image data object
function createImageData(element, src, id, type = 'img') {
    const filename = extractFilename(src);
    
    return {
        id: `${type}-${id}`,
        url: src,
        src: src,
        alt: element.alt || element.title || filename,
        title: element.title || '',
        width: getImageDimension(element, 'width'),
        height: getImageDimension(element, 'height'),
        filename: filename,
        sizeKB: estimateImageSize(element),
        type: type,
        element: element,
        domain: extractDomain(src),
        extension: getFileExtension(src)
    };
}

function standardizeImageData(image) {
    return {
        url: image.url || image.src || '',  
        src: image.src || image.url || '',  
        alt: image.alt || '',
        width: image.width || 0,
        height: image.height || 0,
        filename: image.filename || extractFilename(image.url || image.src || ''),
        sizeKB: image.sizeKB || 50,
        type: image.type || 'unknown',
        id: image.id || Date.now() + Math.random()
    };
}

// Get image dimensions with fallbacks
function getImageDimension(element, dimension) {
    const natural = dimension === 'width' ? element.naturalWidth : element.naturalHeight;
    const attribute = element.getAttribute(dimension);
    const offset = dimension === 'width' ? element.offsetWidth : element.offsetHeight;
    const style = window.getComputedStyle(element)[dimension];
    
    return natural || 
           parseInt(attribute) || 
           offset || 
           parseInt(style) || 
           0;
}

// Estimate image size more accurately
function estimateImageSize(element) {
    const width = getImageDimension(element, 'width');
    const height = getImageDimension(element, 'height');
    
    if (width > 0 && height > 0) {
        // Better estimation based on common compression ratios
        const megapixels = (width * height) / 1000000;
        
        if (element.src && element.src.includes('.webp')) {
            return Math.round(megapixels * 30); // WebP is smaller
        } else if (element.src && element.src.includes('.png')) {
            return Math.round(megapixels * 100); // PNG is larger
        } else {
            return Math.round(megapixels * 50); // JPG average
        }
    }
    
    return 100; // Default 100KB
}

// ========== BACKGROUND IMAGES EXTRACTION ==========
function extractBackgroundImages(images) {
    // Method 1: Inline styles
    document.querySelectorAll('[style*="background-image"]').forEach((el, index) => {
        extractBackgroundFromStyle(el, images, index);
    });
    
    // Method 2: Computed styles
    document.querySelectorAll('*').forEach((el, index) => {
        extractBackgroundFromComputedStyle(el, images, index);
    });
}

function extractBackgroundFromStyle(el, images, index) {
    const style = el.getAttribute('style');
    if (!style) return;
    
    const bgMatch = style.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/i);
    if (bgMatch) {
        const url = bgMatch[1];
        if (isValidImageUrl(url)) {
            images.push(createBackgroundImageData(el, url, index));
        }
    }
}

function extractBackgroundFromComputedStyle(el, images, index) {
    const bg = window.getComputedStyle(el).backgroundImage;
    if (bg && bg !== 'none') {
        const matches = bg.match(/url\(['"]?([^'")]+)['"]?\)/g);
        if (matches) {
            matches.forEach(match => {
                const url = match.replace(/url\(['"]?|['"]?\)/g, '');
                if (isValidImageUrl(url)) {
                    images.push(createBackgroundImageData(el, url, index));
                }
            });
        }
    }
}

function createBackgroundImageData(el, url, index) {
    return {
        id: `bg-${index}`,
        url: makeAbsoluteUrl(url),
        src: makeAbsoluteUrl(url), 
        alt: 'background image',
        title: '',
        width: el.offsetWidth || 0,
        height: el.offsetHeight || 0,
        filename: extractFilename(url),
        sizeKB: 50,
        type: 'background',
        element: el,
        domain: extractDomain(url),
        extension: getFileExtension(url)
    };
}

// ========== PICTURE/SOURCE ELEMENTS ==========
function extractPictureElements(images) {
    document.querySelectorAll('picture').forEach((picture, picIndex) => {
        const sources = picture.querySelectorAll('source');
        const img = picture.querySelector('img');
        
        // Check sources first (often higher quality)
        sources.forEach((source, srcIndex) => {
            const srcset = source.srcset;
            if (srcset) {
                const bestSrc = srcset.split(',')[0].trim().split(' ')[0];
                if (bestSrc && isValidImageUrl(bestSrc)) {
                    images.push(createImageData(source, bestSrc, `pic-${picIndex}-src-${srcIndex}`, 'picture-source'));
                }
            }
        });
        
        // Then check the img inside picture
        if (img) {
            const src = getBestImageSource(img);
            if (src && isValidImageUrl(src)) {
                images.push(createImageData(img, src, `pic-${picIndex}-img`, 'picture-img'));
            }
        }
    });
}

// ========== URL & VALIDATION UTILITIES ==========
function makeAbsoluteUrl(url) {
    if (!url) return '';
    
    // Already absolute
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
        if (url.startsWith('//')) {
            return window.location.protocol + url;
        }
        return url;
    }
    
    // Protocol-relative (starts with //)
    if (url.startsWith('//')) {
        return window.location.protocol + url;
    }
    
    // Root-relative (starts with /)
    if (url.startsWith('/')) {
        return window.location.origin + url;
    }
    
    // Relative to current path
    const base = window.location.href;
    try {
        return new URL(url, base).href;
    } catch {
        // Fallback to origin + url
        return window.location.origin + '/' + url;
    }
}

function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Skip data URLs, SVGs, and empty URLs
    if (url.startsWith('data:') || 
        url.includes('.svg') || 
        url.trim() === '' ||
        url.includes('base64')) {
        return false;
    }
    
    // Check for image extensions
    const imageExtensions = [
        '.jpg', '.jpeg', '.jfif', '.pjpeg', '.pjp',
        '.png', '.apng', 
        '.webp', 
        '.gif', 
        '.bmp', 
        '.ico', '.cur',
        '.tiff', '.tif'
    ];
    
    const urlLower = url.toLowerCase();
    const hasValidExtension = imageExtensions.some(ext => urlLower.includes(ext));
    
    // Also accept URLs with common image patterns
    const imagePatterns = [
        '/images/', '/img/', '/photos/', '/pictures/', '/assets/',
        '/media/', '/uploads/', '/static/', '/content/',
        'image=', 'imgurl=', 'photo=', 'picture=',
        '.jpg?', '.png?', '.webp?', '.gif?' // With query params
    ];
    
    const hasImagePattern = imagePatterns.some(pattern => urlLower.includes(pattern));
    
    // Also check if URL ends with common image extensions (without query params)
    const urlWithoutQuery = urlLower.split('?')[0];
    const endsWithImageExt = imageExtensions.some(ext => urlWithoutQuery.endsWith(ext));
    
    return hasValidExtension || hasImagePattern || endsWithImageExt;
}

function extractFilename(url) {
    try {
        const parsed = new URL(url);
        const pathname = parsed.pathname;
        
        // Get last part of path
        const parts = pathname.split('/');
        let filename = parts[parts.length - 1];
        
        // If no filename or too short, create one
        if (!filename || filename.length < 3) {
            const domain = parsed.hostname.replace('www.', '');
            const timestamp = Date.now();
            filename = `${domain}_${timestamp}`;
        }
        
        // Remove query parameters
        filename = filename.split('?')[0];
        
        // Ensure it has an extension
        if (!filename.includes('.')) {
            const ext = getFileExtension(url);
            if (ext) {
                filename += '.' + ext;
            } else {
                filename += '.jpg';
            }
        }
        
        // Clean filename (remove invalid characters)
        filename = filename.replace(/[<>:"/\\|?*]/g, '_');
        
        return filename;
        
    } catch (error) {
        // Fallback for invalid URLs
        const parts = url.split('/');
        let filename = parts[parts.length - 1] || 'image';
        filename = filename.split('?')[0];
        filename = filename.replace(/[<>:"/\\|?*]/g, '_');
        
        if (!filename.includes('.')) {
            filename += '.jpg';
        }
        
        return filename;
    }
}

function getFileExtension(url) {
    try {
        const urlWithoutQuery = url.split('?')[0];
        const match = urlWithoutQuery.match(/\.([a-zA-Z0-9]+)$/);
        if (match) {
            return match[1].toLowerCase();
        }
    } catch (error) {
        // Continue
    }
    
    // Try from content type pattern
    if (url.includes('.jpg') || url.includes('.jpeg')) return 'jpg';
    if (url.includes('.png')) return 'png';
    if (url.includes('.webp')) return 'webp';
    if (url.includes('.gif')) return 'gif';
    if (url.includes('.svg')) return 'svg';
    if (url.includes('.bmp')) return 'bmp';
    
    return 'jpg'; // Default
}

function extractDomain(url) {
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace('www.', '');
    } catch {
        return 'unknown';
    }
}

// ========== FILTER & CLEAN IMAGES ==========
function filterAndCleanImages(images) {
    const seenUrls = new Set();
    const seenHashes = new Set();
    const filtered = [];
    
    images.forEach(img => {
        // Skip if URL is invalid
        if (!img.url || !isValidImageUrl(img.url)) {
            return;
        }
        
        // Skip duplicates by URL (normalized)
        const normalizedUrl = normalizeUrl(img.url);
        if (seenUrls.has(normalizedUrl)) {
            return;
        }
        
        // Skip very small images (likely icons)
        if ((img.width < 50 && img.height < 50) || 
            (img.width === 1 && img.height === 1)) {
            return;
        }
        
        // Create simple hash to detect similar images
        const hash = `${img.width}x${img.height}_${img.filename.substring(0, 20)}`;
        if (seenHashes.has(hash)) {
            return;
        }
        
        // Add to filtered list
        seenUrls.add(normalizedUrl);
        seenHashes.add(hash);
        filtered.push(img);
    });
    
    // Sort by size (largest first)
    return filtered.sort((a, b) => {
        const sizeA = a.width * a.height;
        const sizeB = b.width * b.height;
        return sizeB - sizeA;
    });
}

function normalizeUrl(url) {
    // Remove common tracking parameters and fragments
    return url.split('#')[0]
              .split('?')[0]
              .replace(/\/$/, '') // Remove trailing slash
              .toLowerCase();
}

// ========== LAZY LOADING HANDLING ==========
function forceLoadLazyImages() {
    // 1. Trigger scroll events (many lazy loaders listen to scroll)
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('wheel'));
    
    // 2. Remove loading="lazy" attribute
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        img.removeAttribute('loading');
    });
    
    // 3. Move data-src to src
    document.querySelectorAll('img[data-src], img[data-lazy-src]').forEach(img => {
        const src = img.dataset.src || img.dataset.lazySrc;
        if (src && !img.src.includes(src)) {
            img.src = src;
        }
    });
    
    // 4. Trigger intersection observer callbacks
    setTimeout(() => {
        // Simulate element coming into view
        document.querySelectorAll('img').forEach(img => {
            const rect = img.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                // Image is in viewport
                if (img.dataset.src && !img.src) {
                    img.src = img.dataset.src;
                }
            }
        });
    }, 100);
}

// ========== ENHANCED LAZY LOADING FOR POKI ==========
function forceLoadAllImages() {
    console.log('Forcing all images to load on Poki.com...');
    
    // 1. Remove lazy attributes
    document.querySelectorAll('img[loading="lazy"], [loading="lazy"] img').forEach(img => {
        img.loading = 'eager';
        img.removeAttribute('loading');
    });
    
    // 2. Convert data-src to src
    document.querySelectorAll('[data-src], [data-lazy]').forEach(el => {
        const src = el.dataset.src || el.dataset.lazy;
        if (src && el.tagName === 'IMG') {
            el.src = src;
        } else if (src) {
            el.style.backgroundImage = `url(${src})`;
        }
    });
    
    // 3. Scroll simulation for lazy loading
    const scrollSteps = 5;
    let currentStep = 0;
    
    function scrollPage() {
        window.scrollTo(0, (document.body.scrollHeight / scrollSteps) * currentStep);
        currentStep++;
        
        if (currentStep <= scrollSteps) {
            setTimeout(scrollPage, 300);
        } else {
            // Return to top
            setTimeout(() => window.scrollTo(0, 0), 500);
        }
    }
    
    scrollPage();
    
    // 4. Wait for images to load
    return new Promise(resolve => {
        setTimeout(resolve, 2000);
    });
}

// ========== POKI-SPECIFIC IMAGE EXTRACTION ==========
function extractAllImagesPoki() {
    const images = [];
    
    // Poki specific selectors
    const pokiSelectors = [
        'img[src*="img.poki.com"]',
        'img[src*="cdn-cgi/image"]',
        '.game-item img',
        '.game-thumbnail img',
        '[class*="game"] img',
        '[data-testid*="game"] img',
        'picture img',
        'source[srcset*="poki.com"]'
    ];
    
    pokiSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach((img, index) => {
            try {
                const src = getPokiImageSource(img);
                if (src && isValidImageUrl(src)) {
                    const imageData = createPokiImageData(img, src, index);
                    images.push(imageData);
                }
            } catch (error) {
                console.warn('Error processing Poki image:', error);
            }
        });
    });
    
    // Also check for background images in game cards
    document.querySelectorAll('[class*="game"], [class*="card"]').forEach(el => {
        const style = window.getComputedStyle(el);
        const bgImage = style.backgroundImage;
        
        if (bgImage && bgImage !== 'none') {
            const urlMatch = bgImage.match(/url\(['"]?(.*?)['"]?\)/);
            if (urlMatch && urlMatch[1] && urlMatch[1].includes('poki.com')) {
                images.push({
                    url: makeAbsoluteUrl(urlMatch[1]),
                    alt: el.getAttribute('alt') || 'Poki game',
                    width: el.offsetWidth || 300,
                    height: el.offsetHeight || 200,
                    type: 'background'
                });
            }
        }
    });
    
    return filterAndCleanImages(images);
}

function getPokiImageSource(img) {
    // Priority for Poki images
    const srcsets = [
        img.dataset.srcset,
        img.srcset,
        img.dataset.src,
        img.dataset.original,
        img.currentSrc,
        img.src
    ];
    
    for (const srcset of srcsets) {
        if (!srcset) continue;
        
        // Get the highest quality version
        if (srcset.includes(',')) {
            const sources = srcset.split(',');
            // Find the highest resolution
            for (let i = sources.length - 1; i >= 0; i--) {
                const source = sources[i].trim();
                const parts = source.split(' ');
                if (parts.length >= 2) {
                    const url = parts[0];
                    if (url.includes('poki.com') && isValidImageUrl(url)) {
                        return url;
                    }
                }
            }
        } else if (srcset.includes('poki.com') && isValidImageUrl(srcset)) {
            return srcset;
        }
    }
    
    return img.src || img.currentSrc;
}

function createPokiImageData(img, src, index) {
    // Extract game name
    let gameName = img.alt || '';
    if (!gameName) {
        const parent = img.closest('[class*="game"], [class*="card"]');
        if (parent) {
            gameName = parent.getAttribute('aria-label') || 
                       parent.textContent.trim().substring(0, 50) || 
                       `poki-game-${index}`;
        }
    }
    
    return {
        url: makeAbsoluteUrl(src),
        alt: gameName,
        title: img.title || gameName,
        width: img.naturalWidth || img.width || 300,
        height: img.naturalHeight || img.height || 200,
        filename: `poki_${gameName.replace(/[^a-z0-9]/gi, '_')}_${index}.jpg`,
        sizeKB: estimateImageSize(img),
        type: 'poki-game'
    };
}
// ========== DEBUG/UI FUNCTIONS ==========
function highlightImagesOnPage() {
    document.querySelectorAll('img').forEach(img => {
        img.style.outline = '3px solid #5EEAD4';
        img.style.outlineOffset = '2px';
        img.style.boxShadow = '0 0 10px rgba(94, 234, 212, 0.5)';
    });
    
    // Also highlight elements with background images
    document.querySelectorAll('*').forEach(el => {
        const bg = window.getComputedStyle(el).backgroundImage;
        if (bg && bg !== 'none') {
            el.style.outline = '2px dashed #14B8A6';
            el.style.outlineOffset = '1px';
        }
    });
}

function removeHighlights() {
    document.querySelectorAll('*').forEach(el => {
        el.style.outline = '';
        el.style.outlineOffset = '';
        el.style.boxShadow = '';
    });
}

// ========== AUTO-SCAN FOR IMAGE SITES ==========
const AUTO_SCAN_SITES = [
    'unsplash.com',
    'pixabay.com',
    'pexels.com',
    'pinterest.com',
    'pinterest.',
    'instagram.com',
    'flickr.com',
    'imgur.com',
    'deviantart.com',
    'artstation.com',
    'behance.net',
    'dribbble.com',
    '500px.com',
    'gettyimages',
    'shutterstock',
    'adobestock',
    'istockphoto'
];

function shouldAutoScan() {
    const url = window.location.href.toLowerCase();
    return AUTO_SCAN_SITES.some(site => url.includes(site.toLowerCase()));
}

// Auto-scan on image sites
if (shouldAutoScan()) {
    console.log('Auto-scanning image site:', window.location.hostname);
    
    // Wait for page to load
    setTimeout(() => {
        forceLoadLazyImages();
        
        // Notify popup that images are available
        chrome.runtime.sendMessage({
            action: 'imagesAvailable',
            url: window.location.href,
            count: document.querySelectorAll('img').length
        });
    }, 2000);
}

// Listen for page changes (SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        if (shouldAutoScan()) {
            setTimeout(forceLoadLazyImages, 1000);
        }
    }
}).observe(document, {subtree: true, childList: true});

// Export functions for debugging (optional)
if (typeof window !== 'undefined') {
    window.ImageDownloadHelper = {
        extractAllImages,
        forceLoadLazyImages,
        highlightImagesOnPage,
        removeHighlights
    };
}