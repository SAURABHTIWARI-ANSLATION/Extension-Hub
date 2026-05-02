/**
 * @file offscreen.js
 * @description Offscreen document for heavy CRX/ZIP processing.
 * Runs in a full DOM context, enabling ArrayBuffer and Blob operations.
 * Receives PARSE_CRX messages from the service worker.
 */

import { parseCrx, extractManifestFromZip, listZipFiles } from '../lib/crxParser.js';
import { logger } from '../lib/logger.js';

/**
 * Handles CRX parsing requests from the service worker.
 * Responds with CRX_PARSE_RESULT message.
 */
chrome.runtime.onMessage.addListener((message) => {
    if (message.type !== 'PARSE_CRX') return;

    const { buffer } = message.payload;

    try {
        logger.debug('offscreen: Parsing CRX buffer', { bytes: buffer.byteLength });

        const result = parseCrx(buffer);

        if (!result.success) {
            chrome.runtime.sendMessage({
                type: 'CRX_PARSE_RESULT',
                payload: { success: false, error: result.error },
            });
            return;
        }

        // Also extract manifest and file list for metadata viewer
        let manifest = null;
        let files = [];

        if (result.zipData) {
            const manifestResult = extractManifestFromZip(result.zipData);
            if (manifestResult.found) {
                manifest = manifestResult.manifest;
            }
            files = listZipFiles(result.zipData).slice(0, 50); // Limit to 50 files for display
        }

        // Convert Uint8Array to regular array for message passing
        const zipDataArray = Array.from(result.zipData);

        chrome.runtime.sendMessage({
            type: 'CRX_PARSE_RESULT',
            payload: {
                success: true,
                zipData: zipDataArray,
                version: result.version,
                zipOffset: result.zipOffset,
                manifest,
                files,
            },
        });

        logger.info('offscreen: CRX parsed successfully', {
            crxVersion: result.version,
            zipBytes: result.zipData.length,
            hasManifest: !!manifest,
        });

    } catch (err) {
        logger.error('offscreen: Parse error', { error: err.message });
        chrome.runtime.sendMessage({
            type: 'CRX_PARSE_RESULT',
            payload: { success: false, error: err.message },
        });
    }
});

logger.debug('offscreen: Offscreen document ready');