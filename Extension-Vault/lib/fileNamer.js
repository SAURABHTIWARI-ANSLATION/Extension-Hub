/**
 * @module fileNamer
 * @description Resolves download filenames based on user-defined patterns and metadata.
 * Supports template variables: {name}, {id}, {version}, {date}, {timestamp}
 */

const DEFAULT_ZIP_PATTERN = '{name}-{id}.zip';
const DEFAULT_CRX_PATTERN = '{id}.crx';

/** Characters not allowed in file names across Windows/macOS/Linux */
const ILLEGAL_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
const MAX_FILENAME_LENGTH = 200;

/**
 * Sanitizes a string for use in a filename.
 * @param {string} str
 * @returns {string}
 */
function sanitizeSegment(str) {
    if (!str) return '';
    return str
        .replace(ILLEGAL_CHARS, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^[._]+|[._]+$/g, '')
        .slice(0, 80);
}

/**
 * Gets today's date as YYYY-MM-DD.
 * @returns {string}
 */
function getDateString() {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Gets current timestamp as YYYYMMDD-HHmmss.
 * @returns {string}
 */
function getTimestampString() {
    return new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
}

/**
 * Resolves a filename pattern with actual values.
 *
 * Available tokens:
 *   {name}      - Extension name (sanitized)
 *   {id}        - Extension ID
 *   {version}   - Extension version
 *   {date}      - Current date (YYYY-MM-DD)
 *   {timestamp} - Current timestamp (YYYYMMDD-HHmmss)
 *
 * @param {string} pattern - Filename pattern
 * @param {Object} data - Replacement values
 * @param {string} [data.name] - Extension name
 * @param {string} [data.id] - Extension ID
 * @param {string} [data.version] - Extension version
 * @returns {string} Resolved filename
 */
export function resolveFilename(pattern, data = {}) {
    const tokens = {
        '{name}': sanitizeSegment(data.name || 'extension'),
        '{id}': sanitizeSegment(data.id || 'unknown'),
        '{version}': sanitizeSegment(data.version || 'latest'),
        '{date}': getDateString(),
        '{timestamp}': getTimestampString(),
    };

    let filename = pattern || DEFAULT_ZIP_PATTERN;

    for (const [token, value] of Object.entries(tokens)) {
        filename = filename.replaceAll(token, value);
    }

    // Sanitize the whole filename
    filename = filename
        .replace(ILLEGAL_CHARS, '_')
        .replace(/_+/g, '_')
        .trim();

    // Enforce length limit
    if (filename.length > MAX_FILENAME_LENGTH) {
        const ext = filename.includes('.') ? '.' + filename.split('.').pop() : '';
        filename = filename.slice(0, MAX_FILENAME_LENGTH - ext.length) + ext;
    }

    return filename || 'extension.zip';
}

/**
 * Resolves ZIP filename.
 * @param {Object} data - Extension metadata
 * @param {string} [pattern] - Custom pattern
 * @returns {string}
 */
export function resolveZipFilename(data, pattern) {
    return resolveFilename(pattern || DEFAULT_ZIP_PATTERN, data);
}

/**
 * Resolves CRX filename.
 * @param {Object} data - Extension metadata
 * @param {string} [pattern] - Custom pattern
 * @returns {string}
 */
export function resolveCrxFilename(data, pattern) {
    return resolveFilename(pattern || DEFAULT_CRX_PATTERN, data);
}

/**
 * Returns default patterns for each format.
 * @returns {{ crx: string, zip: string }}
 */
export function getDefaultPatterns() {
    return {
        crx: DEFAULT_CRX_PATTERN,
        zip: DEFAULT_ZIP_PATTERN,
    };
}

/**
 * Validates a filename pattern.
 * @param {string} pattern
 * @returns {{ valid: boolean, warnings: string[] }}
 */
export function validatePattern(pattern) {
    const warnings = [];

    if (!pattern || typeof pattern !== 'string') {
        return { valid: false, warnings: ['Pattern must be a non-empty string'] };
    }

    const knownTokens = ['{name}', '{id}', '{version}', '{date}', '{timestamp}'];
    const tokenMatches = pattern.match(/\{[^}]+\}/g) || [];
    const unknownTokens = tokenMatches.filter(t => !knownTokens.includes(t));

    if (unknownTokens.length > 0) {
        warnings.push(`Unknown tokens: ${unknownTokens.join(', ')}. They will be kept as-is.`);
    }

    if (!pattern.includes('{id}') && !pattern.includes('{name}')) {
        warnings.push('Consider including {id} or {name} for unique filenames.');
    }

    return { valid: true, warnings };
}