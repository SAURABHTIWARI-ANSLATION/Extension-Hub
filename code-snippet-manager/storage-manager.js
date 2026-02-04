/**
 * StorageManager - Handles all storage operations for Code Snippet Manager
 * Provides reliable storage, syncing, and error handling
 */

class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'snippets';
        this.MAX_SYNC_SIZE = 102400; // 100KB limit for Chrome sync storage
    }

    /**
     * Save snippets to both local and sync storage for redundancy
     */
    async saveSnippets(snippets) {
        try {
            const data = { [this.STORAGE_KEY]: snippets };
            const jsonSize = JSON.stringify(data).length;

            if (jsonSize > this.MAX_SYNC_SIZE) {
                console.warn('Data exceeds sync storage limit, saving to local storage only');
                await this.saveToLocalStorage(snippets);
                return { success: true, warning: 'Sync storage full, saved locally' };
            }

            // Save to both storages
            await Promise.all([
                new Promise((resolve, reject) => {
                    chrome.storage.sync.set(data, () => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve();
                        }
                    });
                }),
                this.saveToLocalStorage(snippets)
            ]);

            return { success: true, message: 'Snippets saved successfully' };
        } catch (error) {
            console.error('Error saving snippets:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Load snippets from sync storage, fallback to local storage
     */
    async loadSnippets() {
        try {
            // Try sync storage first
            const syncData = await this.loadFromSyncStorage();
            if (syncData && syncData.length > 0) {
                return { success: true, snippets: syncData, source: 'sync' };
            }

            // Fallback to local storage
            const localData = await this.loadFromLocalStorage();
            return { success: true, snippets: localData || [], source: 'local' };
        } catch (error) {
            console.error('Error loading snippets:', error);
            return { success: false, snippets: [], error: error.message };
        }
    }

    /**
     * Save to local storage
     */
    saveToLocalStorage(snippets) {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.set(
                    { [this.STORAGE_KEY]: snippets },
                    () => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve();
                        }
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Load from sync storage
     */
    loadFromSyncStorage() {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get(this.STORAGE_KEY, (data) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(data[this.STORAGE_KEY] || []);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Load from local storage
     */
    loadFromLocalStorage() {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.get(this.STORAGE_KEY, (data) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(data[this.STORAGE_KEY] || []);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Delete a snippet
     */
    async deleteSnippet(snippetId, snippets) {
        const updated = snippets.filter(s => s.id !== snippetId);
        return await this.saveSnippets(updated);
    }

    /**
     * Export snippets as JSON
     */
    exportSnippets(snippets) {
        const dataStr = JSON.stringify(snippets, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        return URL.createObjectURL(dataBlob);
    }

    /**
     * Validate snippet data
     */
    validateSnippet(snippet) {
        if (!snippet.title || !snippet.title.trim()) {
            return { valid: false, error: 'Title is required' };
        }
        if (!snippet.code || !snippet.code.trim()) {
            return { valid: false, error: 'Code content is required' };
        }
        if (snippet.title.length > 100) {
            return { valid: false, error: 'Title must be less than 100 characters' };
        }
        return { valid: true };
    }

    /**
     * Clear all snippets (for reset)
     */
    async clearAllSnippets() {
        try {
            await Promise.all([
                new Promise((resolve) => chrome.storage.sync.remove(this.STORAGE_KEY, resolve)),
                new Promise((resolve) => chrome.storage.local.remove(this.STORAGE_KEY, resolve))
            ]);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Create global instance
const storageManager = new StorageManager();
