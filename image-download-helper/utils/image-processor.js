// Image Processor for advanced image operations

class ImageProcessor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    // Get image dimensions without loading full image
    async getImageDimensions(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.naturalWidth,
                    height: img.naturalHeight
                });
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    // Create thumbnail
    async createThumbnail(url, maxSize = 150) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                // Calculate thumbnail dimensions
                let width = img.width;
                let height = img.height;
                
                if (width > height && width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                } else if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
                
                // Create thumbnail
                this.canvas.width = width;
                this.canvas.height = height;
                this.ctx.drawImage(img, 0, 0, width, height);
                
                this.canvas.toBlob(blob => {
                    resolve({
                        blob: blob,
                        width: width,
                        height: height,
                        url: URL.createObjectURL(blob)
                    });
                }, 'image/jpeg', 0.7);
            };
            
            img.onerror = reject;
            img.src = url;
        });
    }

    // Convert image format
    async convertFormat(blob, targetFormat, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.ctx.drawImage(img, 0, 0);
                
                const mimeType = `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`;
                
                this.canvas.toBlob(
                    convertedBlob => {
                        if (convertedBlob) {
                            resolve(convertedBlob);
                        } else {
                            reject(new Error('Conversion failed'));
                        }
                    },
                    mimeType,
                    quality
                );
            };
            
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    }

    // Compress image
    async compress(blob, maxSizeKB, qualityStep = 0.1) {
        let currentQuality = 0.9;
        let compressedBlob = blob;
        
        while (compressedBlob.size > maxSizeKB * 1024 && currentQuality > 0.1) {
            compressedBlob = await this.convertFormat(
                blob, 
                this.getImageType(blob), 
                currentQuality
            );
            currentQuality -= qualityStep;
        }
        
        return compressedBlob;
    }

    // Get dominant color
    async getDominantColor(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                // Create small version for faster processing
                this.canvas.width = 50;
                this.canvas.height = 50;
                this.ctx.drawImage(img, 0, 0, 50, 50);
                
                const imageData = this.ctx.getImageData(0, 0, 50, 50);
                const data = imageData.data;
                
                // Simple color detection (could be improved)
                let r = 0, g = 0, b = 0;
                
                for (let i = 0; i < data.length; i += 4) {
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                }
                
                const pixelCount = data.length / 4;
                const avgR = Math.round(r / pixelCount);
                const avgG = Math.round(g / pixelCount);
                const avgB = Math.round(b / pixelCount);
                
                resolve(`rgb(${avgR}, ${avgG}, ${avgB})`);
            };
            
            img.onerror = reject;
            img.src = url;
        });
    }

    // Check if image is transparent
    async hasTransparency(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.ctx.drawImage(img, 0, 0);
                
                const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
                const data = imageData.data;
                
                for (let i = 3; i < data.length; i += 4) {
                    if (data[i] < 255) {
                        resolve(true);
                        return;
                    }
                }
                
                resolve(false);
            };
            
            img.onerror = reject;
            img.src = url;
        });
    }

    // Get image type from blob
    getImageType(blob) {
        const type = blob.type.split('/')[1];
        if (type === 'jpeg') return 'jpg';
        return type;
    }

    // Create image hash for duplicate detection
    async createImageHash(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                // Create 8x8 thumbnail
                this.canvas.width = 8;
                this.canvas.height = 8;
                this.ctx.drawImage(img, 0, 0, 8, 8);
                
                const imageData = this.ctx.getImageData(0, 0, 8, 8);
                const data = imageData.data;
                
                // Convert to grayscale and average
                let sum = 0;
                for (let i = 0; i < data.length; i += 4) {
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    sum += gray;
                }
                
                const avg = sum / (data.length / 4);
                
                // Create hash
                let hash = 0;
                for (let i = 0; i < data.length; i += 4) {
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    if (gray > avg) {
                        hash |= (1 << (i / 4 % 64));
                    }
                }
                
                resolve(hash.toString(16));
            };
            
            img.onerror = reject;
            img.src = url;
        });
    }

    // Clean up resources
    cleanup() {
        URL.revokeObjectURL(this.canvas.toDataURL());
    }
}

// Export as singleton
const imageProcessor = new ImageProcessor();