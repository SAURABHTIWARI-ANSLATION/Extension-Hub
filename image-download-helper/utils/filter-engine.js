// Filter Engine for Image Download Helper

class ImageFilter {
    constructor() {
        this.defaultFilters = {
            minWidth: 100,
            minHeight: 100,
            minSizeKB: 10,
            allowedTypes: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
            skipAds: true,
            skipIcons: true,
            skipBlurry: true,
            skipDuplicates: true,
            maxImages: 1000
        };
        
        this.cache = new Map();
        this.duplicateCache = new Set();
    }

    // Apply filters to image array
    filterImages(images, userFilters = {}) {
        const filters = { ...this.defaultFilters, ...userFilters };
        
        return images.filter((img, index) => {
            // Check cache
            const cacheKey = `${img.url}_${JSON.stringify(filters)}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
            
            let passes = true;
            
            // Size filters
            if (filters.minWidth && img.width < filters.minWidth) passes = false;
            if (filters.minHeight && img.height < filters.minHeight) passes = false;
            if (filters.minSizeKB && img.sizeKB < filters.minSizeKB) passes = false;
            
            // Type filter
            if (passes && filters.allowedTypes.length > 0) {
                const ext = this.getFileExtension(img.url);
                if (!filters.allowedTypes.includes(ext.toLowerCase())) {
                    passes = false;
                }
            }
            
            // Ad detection
            if (passes && filters.skipAds && this.isLikelyAd(img)) {
                passes = false;
            }
            
            // Icon detection
            if (passes && filters.skipIcons && this.isLikelyIcon(img)) {
                passes = false;
            }
            
            // Blurry detection
            if (passes && filters.skipBlurry && this.isLikelyBlurry(img)) {
                passes = false;
            }
            
            // Duplicate detection
            if (passes && filters.skipDuplicates && this.isDuplicate(img)) {
                passes = false;
            }
            
            // Cache result
            this.cache.set(cacheKey, passes);
            
            return passes;
        }).slice(0, filters.maxImages || 1000);
    }

    // Get file extension from URL
    getFileExtension(url) {
        try {
            const pathname = new URL(url).pathname;
            const parts = pathname.split('.');
            return parts.length > 1 ? parts.pop().toLowerCase() : '';
        } catch {
            const parts = url.split('.');
            return parts.length > 1 ? parts.pop().toLowerCase().split('?')[0] : '';
        }
    }

    // Check if image is likely an advertisement
    isLikelyAd(img) {
        const url = img.url.toLowerCase();
        const alt = img.alt.toLowerCase();
        const src = img.src || '';
        
        const adKeywords = ['ad', 'ads', 'advert', 'banner', 'sponsor', 'promo', 'affiliate'];
        const adPatterns = [
            /\/ads?\//,
            /\/banner/,
            /\/sponsor/,
            /doubleclick/,
            /googleads/,
            /amazon-adsystem/
        ];
        
        // Check URL patterns
        if (adPatterns.some(pattern => pattern.test(url))) {
            return true;
        }
        
        // Check filename/alt text
        if (adKeywords.some(keyword => 
            alt.includes(keyword) || 
            url.includes(keyword) ||
            (img.filename && img.filename.toLowerCase().includes(keyword))
        )) {
            return true;
        }
        
        // Check dimensions (common ad sizes)
        const adSizes = [
            {w: 300, h: 250},  // Medium Rectangle
            {w: 728, h: 90},   // Leaderboard
            {w: 160, h: 600},  // Wide Skyscraper
            {w: 300, h: 600},  // Half Page
            {w: 970, h: 250},  // Billboard
            {w: 320, h: 50},   // Mobile Banner
            {w: 320, h: 100}   // Large Mobile Banner
        ];
        
        if (adSizes.some(size => 
            Math.abs(img.width - size.w) <= 5 && 
            Math.abs(img.height - size.h) <= 5
        )) {
            return true;
        }
        
        return false;
    }

    // Check if image is likely an icon/logo
    isLikelyIcon(img) {
        // Small dimensions
        if (img.width <= 32 && img.height <= 32) {
            return true;
        }
        
        // Square aspect ratio (common for icons)
        const aspectRatio = img.width / img.height;
        if (Math.abs(aspectRatio - 1) < 0.1 && img.width <= 100) {
            return true;
        }
        
        // Filename/alt text clues
        const iconKeywords = ['icon', 'logo', 'favicon', 'button', 'arrow', 'menu'];
        const alt = img.alt.toLowerCase();
        const filename = img.filename.toLowerCase();
        
        if (iconKeywords.some(keyword => 
            alt.includes(keyword) || 
            filename.includes(keyword) ||
            img.url.toLowerCase().includes(keyword)
        )) {
            return true;
        }
        
        // Common icon sizes
        const iconSizes = [16, 24, 32, 48, 64, 96, 128];
        if (iconSizes.includes(img.width) && iconSizes.includes(img.height)) {
            return true;
        }
        
        return false;
    }

    // Simple blurry image detection
    isLikelyBlurry(img) {
        // Very small images are often blurry when enlarged
        if (img.width < 50 || img.height < 50) {
            return true;
        }
        
        // Low resolution for expected size
        const element = img.element;
        if (element) {
            const displayWidth = element.offsetWidth;
            const displayHeight = element.offsetHeight;
            
            if (displayWidth > img.width * 2 || displayHeight > img.height * 2) {
                return true; // Image is being stretched
            }
        }
        
        return false;
    }

    // Simple duplicate detection
    isDuplicate(img) {
        // Create signature from URL, dimensions, and size
        const signature = `${img.url}_${img.width}_${img.height}_${img.sizeKB}`;
        
        if (this.duplicateCache.has(signature)) {
            return true;
        }
        
        this.duplicateCache.add(signature);
        return false;
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
        this.duplicateCache.clear();
    }

    // Sort images by different criteria
    sortImages(images, sortBy = 'size', order = 'desc') {
        const sorted = [...images];
        
        switch(sortBy) {
            case 'size':
                sorted.sort((a, b) => (b.sizeKB || 0) - (a.sizeKB || 0));
                break;
                
            case 'width':
                sorted.sort((a, b) => b.width - a.width);
                break;
                
            case 'height':
                sorted.sort((a, b) => b.height - a.height);
                break;
                
            case 'filename':
                sorted.sort((a, b) => a.filename.localeCompare(b.filename));
                break;
                
            case 'url':
                sorted.sort((a, b) => a.url.localeCompare(b.url));
                break;
        }
        
        if (order === 'asc') {
            sorted.reverse();
        }
        
        return sorted;
    }

    // Group images by extension
    groupByExtension(images) {
        const groups = {};
        
        images.forEach(img => {
            const ext = this.getFileExtension(img.url);
            if (!groups[ext]) {
                groups[ext] = [];
            }
            groups[ext].push(img);
        });
        
        return groups;
    }

    // Get statistics about images
    getStatistics(images) {
        const stats = {
            total: images.length,
            byType: {},
            totalSizeKB: 0,
            avgWidth: 0,
            avgHeight: 0,
            largest: null,
            smallest: null
        };
        
        if (images.length === 0) return stats;
        
        let totalWidth = 0;
        let totalHeight = 0;
        let maxArea = 0;
        let minArea = Infinity;
        
        images.forEach(img => {
            // Count by type
            const ext = this.getFileExtension(img.url);
            stats.byType[ext] = (stats.byType[ext] || 0) + 1;
            
            // Size
            stats.totalSizeKB += img.sizeKB || 0;
            
            // Dimensions
            totalWidth += img.width;
            totalHeight += img.height;
            
            // Find largest/smallest
            const area = img.width * img.height;
            if (area > maxArea) {
                maxArea = area;
                stats.largest = img;
            }
            if (area < minArea) {
                minArea = area;
                stats.smallest = img;
            }
        });
        
        stats.avgWidth = Math.round(totalWidth / images.length);
        stats.avgHeight = Math.round(totalHeight / images.length);
        stats.avgSizeKB = Math.round(stats.totalSizeKB / images.length);
        
        return stats;
    }
}

// Export for Chrome extension
if (typeof window !== 'undefined') {
    // Export the class so popup.js can create instances
    window.ImageFilter = ImageFilter;
    
    // Also export a pre-made instance (optional, for convenience)
    window.imageFilter = new ImageFilter();
}