/**
 * @module crxParser
 * @description Parses CRX2 and CRX3 format files to extract ZIP payload.
 * Implements the full CRX specification with no external dependencies.
 *
 * CRX2 Format:
 *   4 bytes - Magic "Cr24"
 *   4 bytes - Version (2)
 *   4 bytes - Public key length
 *   4 bytes - Signature length
 *   N bytes - Public key
 *   N bytes - Signature
 *   N bytes - ZIP payload
 *
 * CRX3 Format:
 *   4 bytes - Magic "Cr24"
 *   4 bytes - Version (3)
 *   4 bytes - Header size (little-endian)
 *   N bytes - CrxFileHeader proto
 *   N bytes - ZIP payload
 */

import { logger } from './logger.js';

/** CRX magic bytes: ASCII "Cr24" */
const CRX_MAGIC = [0x43, 0x72, 0x32, 0x34];
/** ZIP magic bytes: "PK" */
const ZIP_MAGIC = [0x50, 0x4B];

const CRX_VERSION_2 = 2;
const CRX_VERSION_3 = 3;

/**
 * Result structure for CRX parsing.
 * @typedef {Object} CrxParseResult
 * @property {boolean} success
 * @property {Uint8Array|null} zipData - ZIP payload bytes
 * @property {number|null} version - CRX version (2 or 3)
 * @property {number|null} zipOffset - Byte offset where ZIP starts
 * @property {string|null} error
 */

/**
 * Reads a 32-bit little-endian unsigned integer from a DataView.
 * @param {DataView} view
 * @param {number} offset
 * @returns {number}
 */
function readUInt32LE(view, offset) {
    return view.getUint32(offset, true); // true = little-endian
}

/**
 * Validates that the first 4 bytes match CRX magic "Cr24".
 * @param {DataView} view
 * @returns {boolean}
 */
function validateMagic(view) {
    if (view.byteLength < 4) return false;
    return CRX_MAGIC.every((byte, i) => view.getUint8(i) === byte);
}

/**
 * Validates that the given bytes start with ZIP magic "PK".
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @returns {boolean}
 */
function validateZipMagic(bytes, offset = 0) {
    if (bytes.length < offset + 2) return false;
    return bytes[offset] === ZIP_MAGIC[0] && bytes[offset + 1] === ZIP_MAGIC[1];
}

/**
 * Parses a CRX2 file and extracts the ZIP payload.
 * @param {DataView} view
 * @param {Uint8Array} bytes
 * @returns {CrxParseResult}
 */
function parseCrx2(view, bytes) {
    // CRX2: magic(4) + version(4) + pubkeyLen(4) + sigLen(4) = 16 bytes header minimum
    if (view.byteLength < 16) {
        return { success: false, zipData: null, version: 2, zipOffset: null, error: 'CRX2 file too small (< 16 bytes)' };
    }

    const pubkeyLen = readUInt32LE(view, 8);
    const sigLen = readUInt32LE(view, 12);
    const zipOffset = 16 + pubkeyLen + sigLen;

    logger.debug('crxParser: CRX2 header', { pubkeyLen, sigLen, zipOffset });

    if (zipOffset >= bytes.length) {
        return {
            success: false,
            zipData: null,
            version: 2,
            zipOffset: null,
            error: `CRX2 ZIP offset (${zipOffset}) exceeds file size (${bytes.length})`,
        };
    }

    const zipData = bytes.slice(zipOffset);

    if (!validateZipMagic(zipData)) {
        return {
            success: false,
            zipData: null,
            version: 2,
            zipOffset,
            error: `CRX2: ZIP magic "PK" not found at offset ${zipOffset}. Got: 0x${zipData[0]?.toString(16)} 0x${zipData[1]?.toString(16)}`,
        };
    }

    return { success: true, zipData, version: 2, zipOffset, error: null };
}

/**
 * Parses a CRX3 file and extracts the ZIP payload.
 * CRX3 uses a protobuf header; we skip it by reading the header size field.
 * @param {DataView} view
 * @param {Uint8Array} bytes
 * @returns {CrxParseResult}
 */
function parseCrx3(view, bytes) {
    // CRX3: magic(4) + version(4) + headerSize(4) = 12 bytes minimum
    if (view.byteLength < 12) {
        return { success: false, zipData: null, version: 3, zipOffset: null, error: 'CRX3 file too small (< 12 bytes)' };
    }

    const headerSize = readUInt32LE(view, 8);
    const zipOffset = 12 + headerSize;

    logger.debug('crxParser: CRX3 header', { headerSize, zipOffset });

    if (zipOffset >= bytes.length) {
        return {
            success: false,
            zipData: null,
            version: 3,
            zipOffset: null,
            error: `CRX3 ZIP offset (${zipOffset}) exceeds file size (${bytes.length})`,
        };
    }

    const zipData = bytes.slice(zipOffset);

    if (!validateZipMagic(zipData)) {
        return {
            success: false,
            zipData: null,
            version: 3,
            zipOffset,
            error: `CRX3: ZIP magic "PK" not found at offset ${zipOffset}. Got: 0x${zipData[0]?.toString(16)} 0x${zipData[1]?.toString(16)}`,
        };
    }

    return { success: true, zipData, version: 3, zipOffset, error: null };
}

/**
 * Main CRX parsing function. Auto-detects CRX version and extracts ZIP payload.
 * @param {ArrayBuffer} arrayBuffer - Raw CRX file bytes
 * @returns {CrxParseResult}
 */
export function parseCrx(arrayBuffer) {
    try {
        const bytes = new Uint8Array(arrayBuffer);
        const view = new DataView(arrayBuffer);

        // Validate magic
        if (!validateMagic(view)) {
            // Could be a plain ZIP (some "CRX" downloads are just ZIPs)
            if (validateZipMagic(bytes)) {
                logger.info('crxParser: File appears to be a plain ZIP (no CRX header)');
                return { success: true, zipData: bytes, version: null, zipOffset: 0, error: null };
            }
            return {
                success: false,
                zipData: null,
                version: null,
                zipOffset: null,
                error: `Invalid CRX magic bytes. Expected "Cr24", got: ${Array.from(bytes.slice(0, 4)).map(b => String.fromCharCode(b)).join('')}`,
            };
        }

        // Read version
        const version = readUInt32LE(view, 4);
        logger.info('crxParser: Detected CRX version', { version });

        switch (version) {
            case CRX_VERSION_2: return parseCrx2(view, bytes);
            case CRX_VERSION_3: return parseCrx3(view, bytes);
            default:
                return {
                    success: false,
                    zipData: null,
                    version,
                    zipOffset: null,
                    error: `Unknown CRX version: ${version}. Only CRX2 and CRX3 are supported.`,
                };
        }
    } catch (err) {
        logger.error('crxParser: Unexpected error', { error: err.message });
        return { success: false, zipData: null, version: null, zipOffset: null, error: err.message };
    }
}

/**
 * Converts CRX ArrayBuffer to ZIP Blob.
 * @param {ArrayBuffer} crxBuffer - Raw CRX file
 * @returns {{ success: boolean, blob?: Blob, error?: string, version?: number }}
 */
export function crxToZipBlob(crxBuffer) {
    const result = parseCrx(crxBuffer);

    if (!result.success) {
        return { success: false, error: result.error };
    }

    const blob = new Blob([result.zipData], { type: 'application/zip' });
    return { success: true, blob, version: result.version };
}

/**
 * Extracts and parses manifest.json from ZIP bytes.
 * Uses a simple ZIP local file header scanner — no external libraries.
 * @param {Uint8Array} zipBytes
 * @returns {{ found: boolean, manifest?: object, error?: string }}
 */
export function extractManifestFromZip(zipBytes) {
    try {
        // ZIP Local File Header signature: PK\x03\x04
        const LOCAL_FILE_SIG = [0x50, 0x4B, 0x03, 0x04];

        let offset = 0;
        while (offset < zipBytes.length - 30) {
            // Check for local file header signature
            if (
                zipBytes[offset] === LOCAL_FILE_SIG[0] &&
                zipBytes[offset + 1] === LOCAL_FILE_SIG[1] &&
                zipBytes[offset + 2] === LOCAL_FILE_SIG[2] &&
                zipBytes[offset + 3] === LOCAL_FILE_SIG[3]
            ) {
                const view = new DataView(zipBytes.buffer, zipBytes.byteOffset + offset);
                const compMethod = view.getUint16(8, true);
                const compSize = view.getUint32(18, true);
                const uncompSize = view.getUint32(22, true);
                const fileNameLen = view.getUint16(26, true);
                const extraLen = view.getUint16(28, true);

                const fileNameBytes = zipBytes.slice(offset + 30, offset + 30 + fileNameLen);
                const fileName = new TextDecoder().decode(fileNameBytes);

                const dataOffset = offset + 30 + fileNameLen + extraLen;

                if (fileName === 'manifest.json') {
                    logger.debug('crxParser: Found manifest.json in ZIP', { compMethod, compSize, uncompSize });

                    if (compMethod === 0) {
                        // Stored (no compression)
                        const manifestBytes = zipBytes.slice(dataOffset, dataOffset + uncompSize);
                        const manifestText = new TextDecoder().decode(manifestBytes);
                        try {
                            const manifest = JSON.parse(manifestText);
                            return { found: true, manifest };
                        } catch (parseErr) {
                            return { found: false, error: 'manifest.json parse error: ' + parseErr.message };
                        }
                    } else {
                        // Compressed — would need inflate implementation
                        logger.warn('crxParser: manifest.json is compressed (method=' + compMethod + '), cannot extract without decompression');
                        return { found: false, error: 'manifest.json is compressed; extraction requires decompression support' };
                    }
                }

                offset = dataOffset + compSize;
            } else {
                offset++;
            }
        }

        return { found: false, error: 'manifest.json not found in ZIP' };
    } catch (err) {
        logger.error('crxParser: extractManifestFromZip error', { error: err.message });
        return { found: false, error: err.message };
    }
}

/**
 * Scans ZIP for a list of all file names (for display purposes).
 * @param {Uint8Array} zipBytes
 * @returns {string[]} List of file paths in the ZIP
 */
export function listZipFiles(zipBytes) {
    const files = [];
    const LOCAL_FILE_SIG = [0x50, 0x4B, 0x03, 0x04];

    try {
        let offset = 0;
        while (offset < zipBytes.length - 30) {
            if (
                zipBytes[offset] === LOCAL_FILE_SIG[0] &&
                zipBytes[offset + 1] === LOCAL_FILE_SIG[1] &&
                zipBytes[offset + 2] === LOCAL_FILE_SIG[2] &&
                zipBytes[offset + 3] === LOCAL_FILE_SIG[3]
            ) {
                const view = new DataView(zipBytes.buffer, zipBytes.byteOffset + offset);
                const compSize = view.getUint32(18, true);
                const fileNameLen = view.getUint16(26, true);
                const extraLen = view.getUint16(28, true);

                const fileNameBytes = zipBytes.slice(offset + 30, offset + 30 + fileNameLen);
                const fileName = new TextDecoder().decode(fileNameBytes);
                files.push(fileName);

                offset = offset + 30 + fileNameLen + extraLen + compSize;
            } else {
                offset++;
            }
        }
    } catch (_) { }

    return files;
}