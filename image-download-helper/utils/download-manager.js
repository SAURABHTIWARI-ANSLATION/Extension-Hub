// Download Manager for Image Download Helper

class DownloadManager {
    constructor() {
        this.queue = [];
        this.activeDownloads = new Set();
        this.progressCallbacks = new Map();
        this.maxConcurrent = 3;
        this.canceled = false;
        this.stats = {
            total: 0,
            success: 0,
            failed: 0,
            skipped: 0,
            totalSize: 0
        };
    }

    // Download images with options
    async downloadImages(images, options = {}, progressCallback = null) {
        this.canceled = false;
        this.stats = {
            total: images.length,
            success: 0,
            failed: 0,
            skipped: 0,
            totalSize: 0
        };
        
        this.queue = [...images];
        const downloadPromises = [];
        
        // Create folder name if not provided
        if (!options.folderName) {
            options.folderName = this.generateFolderName();
        }
        
        // Process in batches
        const batches = this.chunkArray(images, this.maxConcurrent);
        
        for (let i = 0; i < batches.length; i++) {
            if (this.canceled) break;
            
            const batch = batches[i];
            const batchPromises = batch.map((img, index) => 
                this.downloadSingleImage(img, options, i * this.maxConcurrent + index + 1)
            );
            
            // Wait for batch to complete
            const results = await Promise.allSettled(batchPromises);
            
            // Update progress
            if (progressCallback) {
                const progress = (i + 1) * this.maxConcurrent;
                progressCallback(progress, this.stats.success, images.length, 0);
            }
            
            // Small delay between batches to avoid rate limiting
            if (i < batches.length - 1 && !this.canceled) {
                await this.delay(100);
            }
        }
        
        return this.stats;
    }

    // Download single image
    async downloadSingleImage(image, options, index) {
        if (this.canceled) return { success: false, reason: 'canceled' };
        
        try {
            // Generate filename
            const filename = this.generateFilename(image, options.filenamePattern, index);
            
            // Get image data
            const response = await this.fetchImage(image.url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            let blob = await response.blob();
            let originalSize = blob.size;
            
            // Apply conversion if needed
            if (options.convertTo && options.convertTo !== 'none') {
                blob = await this.convertImage(blob, options.convertTo, options.quality);
            }
            
            // Apply compression if needed
            if (options.quality && options.quality < 1) {
                blob = await this.compressImage(blob, options.quality);
            }
            
            // Create download URL
            const url = URL.createObjectURL(blob);
            
            // Prepare download path
            const downloadPath = `${options.folderName}/${filename}`;
            
            // Start download
            await new Promise((resolve, reject) => {
                chrome.downloads.download({
                    url: url,
                    filename: downloadPath,
                    saveAs: false,
                    conflictAction: 'uniquify'
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        // Store download info for tracking
                        this.activeDownloads.add(downloadId);
                        resolve(downloadId);
                    }
                });
            });
            
            // Clean up
            URL.revokeObjectURL(url);
            
            // Update stats
            this.stats.success++;
            this.stats.totalSize += blob.size;
            
            return { success: true, filename, size: blob.size };
            
        } catch (error) {
            console.error('Download failed:', image.url, error);
            this.stats.failed++;
            return { success: false, error: error.message };
        }
    }

    // Fetch image with error handling
    async fetchImage(url) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    'Accept': 'image/*'
                }
            });
            
            clearTimeout(timeout);
            return response;
        } catch (error) {
            clearTimeout(timeout);
            throw error;
        }
    }

    // Convert image format
    async convertImage(blob, targetFormat, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob((convertedBlob) => {
                    if (convertedBlob) {
                        resolve(convertedBlob);
                    } else {
                        reject(new Error('Conversion failed'));
                    }
                }, `image/${targetFormat}`, quality);
            };
            
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = URL.createObjectURL(blob);
        });
    }

    // Compress image
    async compressImage(blob, quality) {
        // This is a simplified compression
        // In production, you might want to use more sophisticated compression
        return this.convertImage(blob, this.getImageType(blob), quality);
    }

    // Get image type from blob
    getImageType(blob) {
        const type = blob.type.split('/')[1];
        if (type === 'jpeg') return 'jpg';
        return type;
    }

    // Generate filename based on pattern
    generateFilename(image, pattern, index) {
        let filename = pattern;
        
        const replacements = {
            '{index}': String(index).padStart(3, '0'),
            '{name}': image.filename.split('.')[0] || 'image',
            '{width}': image.width,
            '{height}': image.height,
            '{alt}': image.alt.replace(/[^\w\s]/g, '_').substring(0, 20) || 'image',
            '{timestamp}': new Date().getTime(),
            '{date}': new Date().toISOString().split('T')[0]
        };
        
        // Replace patterns
        Object.entries(replacements).forEach(([key, value]) => {
            filename = filename.replace(key, value);
        });
        
        // Ensure proper extension
        const originalExt = this.getFileExtension(image.url);
        if (!filename.includes('.')) {
            filename += `.${originalExt}`;
        }
        
        // Clean filename
        filename = filename.replace(/[<>:"/\\|?*]/g, '_');
        
        return filename;
    }

    // Get file extension
    getFileExtension(url) {
        const match = url.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
        return match ? match[1].toLowerCase() : 'jpg';
    }

    // Generate folder name
    generateFolderName() {
        const date = new Date();
        const timestamp = date.toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .split('.')[0];
        
        return `ImageDownloads/${timestamp}`;
    }

    // Split array into chunks
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    // Cancel all downloads
    cancel() {
        this.canceled = true;
        
        // Cancel active downloads
        this.activeDownloads.forEach(downloadId => {
            chrome.downloads.cancel(downloadId);
        });
        
        this.activeDownloads.clear();
        this.queue = [];
    }

    // Utility: delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get download statistics
    getStats() {
        return { ...this.stats };
    }

    // Reset statistics
    resetStats() {
        this.stats = {
            total: 0,
            success: 0,
            failed: 0,
            skipped: 0,
            totalSize: 0
        };
    }
}

if (typeof window !== 'undefined') {
    window.DownloadManager = DownloadManager;
}