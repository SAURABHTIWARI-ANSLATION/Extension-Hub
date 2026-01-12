/**
 * Utility functions for the Image Resizer Extension
 */

const Utils = {
  /**
   * Format bytes into a readable string (KB, MB, etc.)
   * @param {number} bytes 
   * @param {number} decimals 
   * @returns {string}
   */
  formatBytes: (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  /**
   * Truncate a filename if it's too long
   * @param {string} str 
   * @param {number} maxLength 
   * @returns {string}
   */
  truncateString: (str, maxLength = 20) => {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
  },

  /**
   * Generate a unique ID
   * @returns {string}
   */
  generateId: () => {
    return Math.random().toString(36).substr(2, 9);
  },

  /**
   * Get file extension from filename
   * @param {string} filename 
   * @returns {string}
   */
  getExtension: (filename) => {
    return filename.slice((Math.max(0, filename.lastIndexOf(".")) || Infinity) + 1);
  }
};
