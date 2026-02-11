// Utility functions for Broken Link Finder

export const Utils = {
    // Format URL for display
    formatUrl: (url, maxLength = 50) => {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength - 3) + '...';
    },
    
    // Get status text from status code
    getStatusText: (statusCode) => {
        const statusMap = {
            200: 'OK',
            301: 'Moved Permanently',
            302: 'Found',
            304: 'Not Modified',
            400: 'Bad Request',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Not Found',
            500: 'Internal Server Error',
            502: 'Bad Gateway',
            503: 'Service Unavailable',
            504: 'Gateway Timeout'
        };
        return statusMap[statusCode] || 'Unknown';
    },
    
    // Calculate SEO impact score
    calculateSEOImpact: (brokenLinks, totalLinks) => {
        if (totalLinks === 0) return 100;
        
        const brokenRatio = brokenLinks / totalLinks;
        let score = 100;
        
        if (brokenRatio > 0.1) score -= 20; // 10% broken = -20 points
        if (brokenRatio > 0.2) score -= 30; // 20% broken = -30 more
        if (brokenRatio > 0.3) score -= 30; // 30% broken = -30 more
        if (brokenRatio > 0.5) score = 0;   // 50%+ broken = 0 score
        
        return Math.max(0, Math.round(score));
    },
    
    // Export data in various formats
    exportFormats: {
        csv: (data) => {
            const headers = ['URL', 'Status', 'Status Text', 'Link Text', 'Type', 'Error'];
            const rows = data.map(item => [
                `"${item.url}"`,
                item.status,
                `"${item.statusText || ''}"`,
                `"${(item.text || '').replace(/"/g, '""')}"`,
                item.type || 'link',
                `"${(item.error || '').replace(/"/g, '""')}"`
            ]);
            
            return [headers, ...rows].map(row => row.join(',')).join('\n');
        },
        
        json: (data) => {
            return JSON.stringify(data, null, 2);
        },
        
        markdown: (data) => {
            let md = '# Broken Links Report\n\n';
            md += `**Scan Date:** ${new Date().toLocaleString()}\n`;
            md += `**Total Links:** ${data.length}\n\n`;
            md += '## Broken Links:\n\n';
            
            data.forEach(item => {
                md += `- **${item.url}**\n`;
                md += `  - Status: ${item.status} ${item.statusText || ''}\n`;
                if (item.text) md += `  - Text: ${item.text}\n`;
                if (item.error) md += `  - Error: ${item.error}\n`;
                md += '\n';
            });
            
            return md;
        }
    },
    
    // Validate URL
    isValidUrl: (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },
    
    // Extract domain from URL
    extractDomain: (url) => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return url;
        }
    },
    
    // Debounce function for performance
    debounce: (func, wait) => {
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
};