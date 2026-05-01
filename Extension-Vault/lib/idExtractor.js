/**
 * @module idExtractor
 * @description Extracts and validates Chrome Web Store extension IDs from URLs and raw strings.
 * Supports both chromewebstore.google.com and legacy chrome.google.com/webstore URLs.
 */

/** Chrome extension IDs are exactly 32 lowercase Latin characters */
const EXT_ID_PATTERN = /^[a-z]{32}$/;

/**
 * URL patterns for Chrome Web Store
 * Both new and legacy endpoints are handled.
 */
const CWS_URL_PATTERNS = [
    // New Web Store: https://chromewebstore.google.com/detail/name/extensionid
    /chromewebstore\.google\.com\/detail\/[^/]+\/([a-z]{32})/,
    // New Web Store: https://chromewebstore.google.com/detail/extensionid
    /chromewebstore\.google\.com\/detail\/([a-z]{32})/,
    // Legacy: https://chrome.google.com/webstore/detail/name/extensionid
    /chrome\.google\.com\/webstore\/detail\/[^/]+\/([a-z]{32})/,
    // Legacy: https://chrome.google.com/webstore/detail/extensionid
    /chrome\.google\.com\/webstore\/detail\/([a-z]{32})/,
    // Bare ID anywhere in URL path
    /\/([a-z]{32})(?:[/?#]|$)/,
];

/**
 * Validates whether a string is a valid Chrome extension ID.
 * @param {string} id - Candidate extension ID
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateExtensionId(id) {
    if (!id || typeof id !== 'string') {
        return { valid: false, reason: 'ID must be a non-empty string' };
    }
    const trimmed = id.trim().toLowerCase();
    if (trimmed.length !== 32) {
        return { valid: false, reason: `ID must be exactly 32 characters (got ${trimmed.length})` };
    }
    if (!EXT_ID_PATTERN.test(trimmed)) {
        return { valid: false, reason: 'ID must contain only lowercase letters a–z' };
    }
    return { valid: true, id: trimmed };
}

/**
 * Extracts extension ID from a Chrome Web Store URL.
 * @param {string} url - URL to parse
 * @returns {string|null} Extension ID or null if not found
 */
export function extractIdFromUrl(url) {
    if (!url || typeof url !== 'string') return null;

    for (const pattern of CWS_URL_PATTERNS) {
        const match = url.match(pattern);
        if (match && match[1]) {
            const candidate = match[1].trim().toLowerCase();
            if (EXT_ID_PATTERN.test(candidate)) {
                return candidate;
            }
        }
    }
    return null;
}

/**
 * Extracts extension ID from raw user input (URL or bare ID).
 * @param {string} input - User-provided string
 * @returns {{ id: string|null, source: 'url'|'raw'|null, error?: string }}
 */
export function extractId(input) {
    if (!input || typeof input !== 'string') {
        return { id: null, source: null, error: 'No input provided' };
    }

    const trimmed = input.trim();

    // Try URL extraction first
    if (trimmed.startsWith('http') || trimmed.includes('.google.com')) {
        const id = extractIdFromUrl(trimmed);
        if (id) return { id, source: 'url' };
    }

    // Try treating as bare ID
    const bare = trimmed.toLowerCase();
    const validation = validateExtensionId(bare);
    if (validation.valid) {
        return { id: validation.id, source: 'raw' };
    }

    return {
        id: null,
        source: null,
        error: `Could not extract a valid extension ID. ${validation.reason || ''}`.trim(),
    };
}

/**
 * Checks whether the current tab URL is a Chrome Web Store page.
 * @param {string} url - Tab URL
 * @returns {boolean}
 */
export function isChromeWebStorePage(url) {
    if (!url) return false;
    return (
        url.includes('chromewebstore.google.com') ||
        url.includes('chrome.google.com/webstore')
    );
}

/**
 * Detects the extension page type from a CWS URL.
 * @param {string} url
 * @returns {'detail'|'search'|'category'|'home'|'unknown'}
 */
export function detectCWSPageType(url) {
    if (!url) return 'unknown';
    if (url.includes('/detail/')) return 'detail';
    if (url.includes('/search')) return 'search';
    if (url.includes('/category')) return 'category';
    if (
        url === 'https://chromewebstore.google.com/' ||
        url === 'https://chromewebstore.google.com' ||
        url.endsWith('google.com/webstore')
    ) return 'home';
    return 'unknown';
}