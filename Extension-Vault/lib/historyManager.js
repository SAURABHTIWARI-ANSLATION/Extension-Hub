/**
 * @module historyManager
 * @description Manages download history with chrome.storage.local.
 * Privacy-first: all data stays local, never synced externally.
 */

import { logger } from './logger.js';

const STORAGE_KEY = 'extensionvault_history';
const MAX_HISTORY_ENTRIES = 100;

/**
 * @typedef {Object} HistoryEntry
 * @property {string} id - Unique entry ID (timestamp + random)
 * @property {string} extensionId - Chrome extension ID
 * @property {string} extensionName - Extension display name
 * @property {'crx'|'zip'} format - Downloaded format
 * @property {number} fileSize - File size in bytes
 * @property {string} sha256 - SHA-256 hash of downloaded file
 * @property {string} filename - Saved filename
 * @property {number} timestamp - Unix timestamp (ms)
 * @property {boolean} success - Whether download succeeded
 * @property {string} [error] - Error message if failed
 */

/**
 * Loads history from chrome.storage.local.
 * @returns {Promise<HistoryEntry[]>}
 */
export async function loadHistory() {
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            if (chrome.runtime.lastError) {
                logger.warn('historyManager: Failed to load history', { error: chrome.runtime.lastError.message });
                resolve([]);
                return;
            }
            resolve(result[STORAGE_KEY] || []);
        });
    });
}

/**
 * Saves history to chrome.storage.local.
 * @param {HistoryEntry[]} entries
 * @returns {Promise<void>}
 */
async function saveHistory(entries) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [STORAGE_KEY]: entries }, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve();
            }
        });
    });
}

/**
 * Adds a new entry to download history.
 * @param {Omit<HistoryEntry, 'id' | 'timestamp'>} entry
 * @returns {Promise<HistoryEntry>}
 */
export async function addHistoryEntry(entry) {
    const fullEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
    };

    try {
        const history = await loadHistory();
        history.unshift(fullEntry); // newest first

        // Trim to max size
        const trimmed = history.slice(0, MAX_HISTORY_ENTRIES);
        await saveHistory(trimmed);

        logger.debug('historyManager: Entry added', { id: fullEntry.id });
        return fullEntry;
    } catch (err) {
        logger.error('historyManager: Failed to add entry', { error: err.message });
        return fullEntry; // Return entry even if save fails
    }
}

/**
 * Removes a specific history entry by ID.
 * @param {string} entryId
 * @returns {Promise<void>}
 */
export async function removeHistoryEntry(entryId) {
    const history = await loadHistory();
    const filtered = history.filter(e => e.id !== entryId);
    await saveHistory(filtered);
}

/**
 * Clears all download history.
 * @returns {Promise<void>}
 */
export async function clearHistory() {
    await saveHistory([]);
    logger.info('historyManager: History cleared');
}

/**
 * Gets history statistics.
 * @returns {Promise<{ total: number, crxCount: number, zipCount: number, totalBytes: number }>}
 */
export async function getHistoryStats() {
    const history = await loadHistory();
    return {
        total: history.length,
        crxCount: history.filter(e => e.format === 'crx').length,
        zipCount: history.filter(e => e.format === 'zip').length,
        totalBytes: history.reduce((sum, e) => sum + (e.fileSize || 0), 0),
    };
}