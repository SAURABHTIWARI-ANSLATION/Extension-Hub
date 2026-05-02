/**
 * @file service-worker.js
 * @description ExtensionVault Service Worker — orchestrates all background operations.
 * Handles CRX download, format conversion, hashing, and download triggering.
 * Uses Offscreen Document API for heavy ArrayBuffer processing.
 */

import { logger } from '../lib/logger.js';
import { buildCrxUrl, getChromeBrowserVersion, validateCrxResponse } from '../lib/cwsResolver.js';
import { generateSha256 } from '../lib/downloader.js';
import { resolveCrxFilename, resolveZipFilename } from '../lib/fileNamer.js';
import { addHistoryEntry, loadHistory, clearHistory, removeHistoryEntry } from '../lib/historyManager.js';
import { parseCrx } from '../lib/crxParser.js';

const OFFSCREEN_URL = chrome.runtime.getURL('html/offscreen.html');
let offscreenCreating = false;

// ─────────────────────────────────────────────
// Offscreen Document Management
// ─────────────────────────────────────────────

async function ensureOffscreenDocument() {
    const existing = await chrome.offscreen.hasDocument();
    if (existing) return;

    if (offscreenCreating) {
        await new Promise(r => setTimeout(r, 200));
        return ensureOffscreenDocument();
    }

    offscreenCreating = true;
    try {
        await chrome.offscreen.createDocument({
            url: OFFSCREEN_URL,
            reasons: ['WORKERS'],
            justification: 'CRX parsing and ZIP conversion require ArrayBuffer processing',
        });
        logger.debug('sw: Offscreen document created');
    } catch (err) {
        logger.warn('sw: Offscreen document error', { error: err.message });
    } finally {
        offscreenCreating = false;
    }
}

async function parseWithOffscreen(crxBuffer) {
    await ensureOffscreenDocument();

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Offscreen processing timed out')), 30000);

        const handler = (msg) => {
            if (msg.type === 'CRX_PARSE_RESULT') {
                clearTimeout(timeout);
                chrome.runtime.onMessage.removeListener(handler);
                resolve(msg.payload);
            }
        };
        chrome.runtime.onMessage.addListener(handler);

        chrome.runtime.sendMessage({
            type: 'PARSE_CRX',
            payload: { buffer: crxBuffer },
        }, { includeTlsChannelId: false });
    });
}

// ─────────────────────────────────────────────
// CRX Download Core
// ─────────────────────────────────────────────

async function downloadCrxBuffer(extensionId) {
    const browserVersion = getChromeBrowserVersion();
    const url = buildCrxUrl(extensionId, browserVersion);

    logger.info('sw: Downloading CRX', { extensionId });

    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/x-chrome-extension,application/octet-stream,*/*' },
        redirect: 'follow',
    });

    const validation = validateCrxResponse(response);
    if (!validation.valid) throw new Error(validation.error);

    const buffer = await response.arrayBuffer();
    logger.info('sw: CRX buffer received', { bytes: buffer.byteLength });

    return buffer;
}

// ─────────────────────────────────────────────
// Main Download Handler
// ─────────────────────────────────────────────

async function handleDownloadExtension(payload) {
    const {
        extensionId,
        format = 'zip',
        extensionName = 'extension',
        version = 'latest',
        crxPattern,
        zipPattern,
    } = payload;

    const startTime = Date.now();

    try {
        // 1. Download CRX
        logger.info('sw: Starting download pipeline', { extensionId, format });
        const crxBuffer = await downloadCrxBuffer(extensionId);

        // 2. Generate hash (on original CRX bytes)
        const sha256 = await generateSha256(crxBuffer);
        logger.debug('sw: SHA-256 computed', { sha256: sha256.slice(0, 16) + '...' });

        let downloadUrl, filename, finalSize;

        // Fast base64 encoder for ArrayBuffer/Uint8Array
        function bufferToDataUrl(buffer, mimeType) {
            let binary = '';
            const bytes = new Uint8Array(buffer);
            const len = bytes.byteLength;
            const chunkSize = 8192;
            for (let i = 0; i < len; i += chunkSize) {
                binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
            }
            return `data:${mimeType};base64,${btoa(binary)}`;
        }

        if (format === 'crx') {
            // Serve raw CRX
            filename = resolveCrxFilename({ name: extensionName, id: extensionId, version }, crxPattern);
            downloadUrl = bufferToDataUrl(crxBuffer, 'application/x-chrome-extension');
            finalSize = crxBuffer.byteLength;

        } else {
            // Convert to ZIP via offscreen document
            logger.info('sw: Converting CRX to ZIP');

            let zipBytes;
            try {
                const result = await parseWithOffscreen(crxBuffer);
                if (!result.success) throw new Error(result.error || 'CRX parsing failed');
                // Ensure we have a Uint8Array. If it came from message passing, it might be a regular array.
                zipBytes = new Uint8Array(result.zipData); 
            } catch (offscreenErr) {
                // Fallback: parse inline (limited environment)
                logger.warn('sw: Offscreen failed, using inline parser', { error: offscreenErr.message });
                const parseResult = parseCrx(crxBuffer);
                if (!parseResult.success) throw new Error(parseResult.error);
                zipBytes = new Uint8Array(parseResult.zipData);
            }

            filename = resolveZipFilename({ name: extensionName, id: extensionId, version }, zipPattern);
            downloadUrl = bufferToDataUrl(zipBytes.buffer, 'application/zip');
            finalSize = zipBytes.byteLength;
        }

        // 3. Trigger download
        const downloadId = await new Promise((resolve, reject) => {
            chrome.downloads.download(
                { url: downloadUrl, filename, saveAs: false, conflictAction: 'uniquify' },
                (id) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(id);
                    }
                }
            );
        });

        logger.info('sw: Download initiated', { downloadId, filename, ms: Date.now() - startTime });

        // 4. Record in history
        await addHistoryEntry({
            extensionId,
            extensionName,
            format,
            fileSize: finalSize,
            sha256,
            filename,
            success: true,
        });

        return {
            success: true,
            filename,
            fileSize: finalSize,
            sha256,
            downloadId,
            durationMs: Date.now() - startTime,
        };

    } catch (err) {
        logger.error('sw: Download failed', { extensionId, error: err.message });

        // Record failure in history
        await addHistoryEntry({
            extensionId,
            extensionName,
            format,
            fileSize: 0,
            sha256: null,
            filename: null,
            success: false,
            error: err.message,
        }).catch(() => { });

        return { success: false, error: err.message };
    }
}

// ─────────────────────────────────────────────
// Message Router
// ─────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { type, payload } = message;

    logger.debug('sw: Message received', { type });

    if (type === 'DOWNLOAD_EXTENSION') {
        handleDownloadExtension(payload)
            .then(sendResponse)
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true; // Keep channel open for async response
    }

    if (type === 'GET_HISTORY') {
        loadHistory().then(sendResponse);
        return true;
    }

    if (type === 'CLEAR_HISTORY') {
        clearHistory().then(() => sendResponse({ success: true }));
        return true;
    }

    if (type === 'REMOVE_HISTORY_ENTRY') {
        removeHistoryEntry(payload.id).then(() => sendResponse({ success: true }));
        return true;
    }

    if (type === 'SET_DEBUG_MODE') {
        logger.setDebugMode(payload.enabled);
        sendResponse({ success: true });
        return false;
    }

    if (type === 'GET_LOGS') {
        sendResponse({ logs: logger.exportLogs(), entries: logger.getEntries() });
        return false;
    }

    return false;
});

// ─────────────────────────────────────────────
// Extension Lifecycle
// ─────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(({ reason }) => {
    logger.info('sw: Extension installed/updated', { reason });

    if (reason === 'install') {
        chrome.storage.local.set({
            settings: {
                debugMode: false,
                defaultFormat: 'zip',
                crxPattern: '{id}.crx',
                zipPattern: '{name}-{id}.zip',
                showHashInStatus: true,
            }
        });
    }
});

logger.info('sw: Service Worker initialized');