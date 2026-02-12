// ======== CHROME REVIEWER-SAFE BACKGROUND SCRIPT ========
// ✅ NO network requests
// ✅ NO file probing
// ✅ DOM-only detection
// ✅ Privacy-first approach

/**
 * Detect tech stack using ONLY DOM analysis (no network requests)
 * This function is injected into the active tab and analyzes the page's DOM
 * @param {number} tabId - The ID of the active tab
 * @returns {Promise<string[]>} Array of detected technology names
 */
async function detectTechStack(tabId) {
  try {
    const injectionResult = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const detected = [];

        // ============================================
        // REACT DETECTION
        // ============================================
        // Check for React script tags
        if (document.querySelector('script[src*="react"]') ||
          document.querySelector('script[src*="React"]')) {
          detected.push('react');
        }

        // Check for React DevTools marker
        if (window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
          detected.push('react');
        }

        // Check for React root element markers
        if (document.querySelector('[data-reactroot]') ||
          document.querySelector('[data-reactid]')) {
          detected.push('react');
        }

        // ============================================
        // NEXT.JS DETECTION
        // ============================================
        // Check for Next.js data
        if (window.__NEXT_DATA__) {
          detected.push('next');
        }

        // Check for Next.js script tags
        if (document.querySelector('script[src*="_next/"]') ||
          document.querySelector('script[src*="next/"]')) {
          detected.push('next');
        }

        // Check for Next.js meta tags
        if (document.querySelector('meta[name="next-head-count"]')) {
          detected.push('next');
        }

        // ============================================
        // NODE.JS DETECTION
        // ============================================
        // Check for common Node.js/npm indicators
        const bodyText = document.body?.textContent || '';

        // Check for package.json viewer on GitHub/GitLab
        if (bodyText.includes('package.json') &&
          (window.location.hostname.includes('github') ||
            window.location.hostname.includes('gitlab'))) {
          detected.push('node');
        }

        // Check for Express.js
        if (window.express || document.querySelector('meta[name="generator"][content*="Express"]')) {
          detected.push('node');
        }

        // ============================================
        // PYTHON DETECTION
        // ============================================
        // Check for Django
        if (window.django || document.querySelector('meta[name="generator"][content*="Django"]') ||
          document.querySelector('[data-django-app]')) {
          detected.push('python');
        }

        // Check for Flask
        if (window.flask || document.querySelector('meta[name="generator"][content*="Flask"]')) {
          detected.push('python');
        }

        // ============================================
        // DOCKER DETECTION
        // ============================================
        // Check for Docker-related content
        if (bodyText.includes('Dockerfile') || bodyText.includes('docker-compose')) {
          detected.push('docker');
        }

        // ============================================
        // PHP DETECTION
        // ============================================
        // Check for PHP indicators
        if (document.querySelector('meta[name="generator"][content*="PHP"]') ||
          window.location.pathname.endsWith('.php')) {
          detected.push('php');
        }

        // Check for Laravel
        if (document.querySelector('meta[name="csrf-token"]') &&
          document.querySelector('script[src*="laravel"]')) {
          detected.push('php');
        }

        // ============================================
        // JAVA DETECTION
        // ============================================
        // Check for Java-based frameworks
        if (document.querySelector('meta[name="generator"][content*="Spring"]') ||
          document.querySelector('meta[name="generator"][content*="Java"]')) {
          detected.push('java');
        }

        // ============================================
        // GO DETECTION
        // ============================================
        // Check for Go indicators
        if (document.querySelector('meta[name="generator"][content*="Hugo"]') ||
          document.querySelector('meta[name="go-import"]')) {
          detected.push('go');
        }

        // ============================================
        // RUST DETECTION
        // ============================================
        // Check for Rust/WASM indicators
        if (window.WebAssembly &&
          (bodyText.includes('rust') || bodyText.includes('wasm'))) {
          detected.push('rust');
        }

        // Remove duplicates
        return [...new Set(detected)];
      }
    });

    return Array.isArray(injectionResult?.[0]?.result)
      ? injectionResult[0].result
      : [];
  } catch (error) {
    console.log('Detection error:', error);
    return [];
  }
}

// Message listener for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.action === 'detectTechStack') {
    detectTechStack(request.tabId)
      .then(sendResponse)
      .catch(() => sendResponse([]));

    return true; // keeps message channel open for async response
  }
});
