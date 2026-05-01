/**
 * @module downloader
 * @description Orchestrates CRX download, format conversion, hash generation, and file saving.
 * All operations are performed locally — no third-party services involved.
 */

import { logger } from './logger.js';
import { buildCrxUrl, getChromeBrowserVersion, validateCrxResponse, getResponseFileSize } from './cwsResolver.js';
import { resolveCrxFilename, resolveZipFilename } from './fileNamer.js';

/**
 * @typedef {Object} DownloadOptions
 * @property {string} extensionId - 32-char extension ID
 * @property {'crx'|'zip'} format - Output format
 * @property {string} [extensionName] - Extension name for filename
 * @property {string} [version] - Extension version
 * @property {string} [crxPattern] - Custom CRX filename pattern
 * @property {string} [zipPattern] - Custom ZIP filename pattern
 * @property {function} [onProgress] - Progress callback (0–1)
 * @property {function} [onStatus] - Status string callback
 * @property {AbortSignal} [signal] - AbortController signal
 */

/**
 * @typedef {Object} DownloadResult
 * @property {boolean} success
 * @property {string} [filename]
 * @property {number} [fileSize]
 * @property {string} [sha256]
 * @property {number} [crxVersion]
 * @property {string} [error]
 * @property {ArrayBuffer} [buffer] - Raw bytes (for offscreen processing)
 */

/**
 * Downloads a CRX file from Google's update service.
 * @param {string} extensionId
 * @param {AbortSignal} [signal]
 * @param {function} [onProgress]
 * @returns {Promise<{ buffer: ArrayBuffer, fileSize: number }>}
 */
export async function fetchCrxBuffer(extensionId, signal, onProgress) {
    const browserVersion = getChromeBrowserVersion();
    const url = buildCrxUrl(extensionId, browserVersion);

    logger.info('downloader: Fetching CRX', { extensionId, url: url.slice(0, 100) + '...' });

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/x-chrome-extension,application/octet-stream,*/*',
        },
        redirect: 'follow',
        signal,
    });

    const validation = validateCrxResponse(response);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const contentLength = getResponseFileSize(response);
    let loaded = 0;

    // Stream with progress tracking
    const reader = response.body.getReader();
    const chunks = [];

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.length;

        if (onProgress && contentLength) {
            onProgress(Math.min(loaded / contentLength, 0.99));
        }
    }

    // Combine all chunks
    const totalBytes = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
    }

    if (onProgress) onProgress(1.0);

    logger.info('downloader: CRX downloaded', { bytes: totalBytes });
    return { buffer: combined.buffer, fileSize: totalBytes };
}

/**
 * Generates SHA-256 hash of an ArrayBuffer using WebCrypto API.
 * @param {ArrayBuffer} buffer
 * @returns {Promise<string>} Hex-encoded SHA-256 digest
 */
export async function generateSha256(buffer) {
    try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
        logger.error('downloader: SHA-256 failed', { error: err.message });
        throw new Error('Hash generation failed: ' + err.message);
    }
}

/**
 * Triggers a file download in the browser using the downloads API (via message to SW).
 * This function is called from the popup context.
 * @param {Blob} blob - File blob
 * @param {string} filename - Desired filename
 * @returns {Promise<number>} Download ID
 */
export async function triggerBlobDownload(blob, filename) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);

        chrome.downloads.download(
            { url, filename, saveAs: false, conflictAction: 'uniquify' },
            (downloadId) => {
                URL.revokeObjectURL(url);
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(downloadId);
                }
            }
        );
    });
}

/**
 * Main download orchestrator for the popup context.
 * Sends messages to service worker for heavy processing.
 * @param {DownloadOptions} options
 * @returns {Promise<DownloadResult>}
 */
export async function orchestrateDownload(options) {
    const {
        extensionId,
        format = 'zip',
        extensionName,
        version,
        crxPattern,
        zipPattern,
        onStatus,
        onProgress,
    } = options;

    try {
        onStatus?.('Fetching CRX from Google...');
        onProgress?.(0.05);

        // Send download request to service worker
        const result = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Download timed out after 60s')), 60000);

            chrome.runtime.sendMessage(
                {
                    type: 'DOWNLOAD_EXTENSION',
                    payload: { extensionId, format, extensionName, version, crxPattern, zipPattern },
                },
                (response) => {
                    clearTimeout(timeout);
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                }
            );
        });

        return result;
    } catch (err) {
        logger.error('downloader: orchestrateDownload failed', { error: err.message });
        return { success: false, error: err.message };
    }
}