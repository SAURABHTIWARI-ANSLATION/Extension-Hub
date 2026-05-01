/**
 * @module cwsResolver
 * @description Builds Chrome Web Store CRX download URLs and validates responses.
 * Uses the official Omaha update endpoint used by Chrome itself.
 */

const CRX_URL_BASE = 'https://clients2.google.com/service/update2/crx';
const DEFAULT_BROWSER_VERSION = '130.0.0.0';

/**
 * Returns the current Chrome browser version string.
 * Falls back to a modern default if unavailable.
 * @returns {string}
 */
export function getChromeBrowserVersion() {
    try {
        const ua = navigator.userAgent;
        const match = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
        return match ? match[1] : DEFAULT_BROWSER_VERSION;
    } catch (_) {
        return DEFAULT_BROWSER_VERSION;
    }
}

/**
 * Builds the CRX download URL for a given extension ID using the Omaha update protocol.
 * @param {string} extensionId - 32-char extension ID
 * @param {string} [browserVersion] - Chrome version string
 * @returns {string} Full download URL
 */
export function buildCrxUrl(extensionId, browserVersion) {
    const version = browserVersion || getChromeBrowserVersion();

    // The 'x' parameter must be a raw (unencoded) string.
    // URLSearchParams will encode it correctly exactly once.
    // Pre-encoding it (using %3D, %26) causes double-encoding → 400 from Google.
    const xParam = `id=${extensionId}&installsource=ondemand&uc`;

    const params = new URLSearchParams({
        response: 'redirect',
        os: 'win',
        arch: 'x86-64',
        os_arch: 'x86-64',
        nacl_arch: 'x86-64',
        prod: 'chromecrx',
        prodchannel: 'unknown',
        prodversion: version,
        lang: 'en',
        acceptformat: 'crx3,crx2',
        x: xParam,
    });

    return `${CRX_URL_BASE}?${params.toString()}`;
}

/**
 * Validates a CRX download response.
 * @param {Response} response - Fetch API Response object
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCrxResponse(response) {
    if (!response.ok) {
        if (response.status === 204) {
            return { valid: false, error: 'Extension not found on Chrome Web Store (204 No Content).' };
        }
        if (response.status === 404) {
            return { valid: false, error: 'Extension not found (404). Check the extension ID.' };
        }
        if (response.status === 403) {
            return { valid: false, error: 'Access denied (403). Extension may be restricted.' };
        }
        return { valid: false, error: `Server returned ${response.status}: ${response.statusText}` };
    }

    const contentType = response.headers.get('Content-Type') || '';
    const allowedTypes = [
        'application/x-chrome-extension',
        'application/octet-stream',
        'application/zip',
        'binary/octet-stream',
    ];

    // Some servers return text/html for errors
    if (contentType.startsWith('text/html')) {
        return { valid: false, error: 'Server returned an HTML error page instead of a CRX file.' };
    }

    return { valid: true };
}

/**
 * Extracts the file size from response headers.
 * @param {Response} response
 * @returns {number|null}
 */
export function getResponseFileSize(response) {
    const contentLength = response.headers.get('Content-Length');
    const parsed = parseInt(contentLength, 10);
    return isNaN(parsed) ? null : parsed;
}