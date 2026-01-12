/**
 * Image Processing Logic
 * Handles resizing, format conversion, and compression.
 */

class ImageProcessor {
    constructor() {
        this.useOffscreen = typeof OffscreenCanvas !== 'undefined';
    }

    /**
     * Process an image file
     * @param {File} file - The original image file
     * @param {Object} options - { width, height, quality, format }
     * @returns {Promise<Blob>}
     */
    async processImage(file, options) {
        const { width, height, quality, format } = options;

        // Create ImageBitmap from file (efficient decoding)
        const bitmap = await createImageBitmap(file);

        // Calculate dimensions if one is missing (maintain aspect ratio)
        let targetWidth = width;
        let targetHeight = height;

        if (!targetWidth && !targetHeight) {
            targetWidth = bitmap.width;
            targetHeight = bitmap.height;
        } else if (!targetWidth) {
            targetWidth = Math.round(targetHeight * (bitmap.width / bitmap.height));
        } else if (!targetHeight) {
            targetHeight = Math.round(targetWidth * (bitmap.height / bitmap.width));
        }

        // Draw to canvas
        let canvas;
        let ctx;

        if (this.useOffscreen) {
            canvas = new OffscreenCanvas(targetWidth, targetHeight);
        } else {
            canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
        }

        ctx = canvas.getContext('2d');

        // High quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

        // Convert to Blob
        const mimeType = this.getMimeType(format);

        // Clean up bitmap
        bitmap.close();

        if (this.useOffscreen) {
            return canvas.convertToBlob({ type: mimeType, quality: quality });
        } else {
            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, mimeType, quality);
            });
        }
    }

    getMimeType(format) {
        switch (format.toLowerCase()) {
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'webp':
                return 'image/webp';
            default:
                return 'image/jpeg';
        }
    }
}

// Attach to window for popup to use
window.ImageProcessor = ImageProcessor;
