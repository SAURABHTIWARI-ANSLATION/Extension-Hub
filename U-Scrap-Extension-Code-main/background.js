// Background script for Quick Web Scraper extension

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === "fetchDetailPage" && message.url) {
    fetchDetailPage(message.url)
      .then((content) => sendResponse({ content }))
      .catch((e) => sendResponse({ error: e?.message || String(e) }));
    return true; // async
  }
});

/**
 * Fetch detail page content for user-initiated detailed scraping.
 * 
 * SECURITY NOTE: This fetch only runs when user selects "Detailed" scraping mode
 * and clicks "Start Scraping". It fetches the currently active tab's linked pages
 * to provide enhanced scraping capabilities.
 * 
 * Safety measures:
 * - Only allows http/https protocols (blocks file://, chrome://, data:, etc.)
 * - 10-second timeout to prevent hanging
 * - Validates content type (must be text/html)
 * - No credentials sent with request
 */
async function fetchDetailPage(url) {
  // Strict URL validation - only allow http/https
  const validProtocols = ['http:', 'https:'];
  let urlObj;

  try {
    urlObj = new URL(url);
    if (!validProtocols.includes(urlObj.protocol)) {
      throw new Error(`Invalid protocol: ${urlObj.protocol}. Only http/https allowed.`);
    }
  } catch (error) {
    throw new Error(`Invalid URL: ${error.message}`);
  }

  // Fetch with safety headers and timeout
  try {
    const res = await fetch(url, {
      credentials: "omit",
      cache: "no-store",
      redirect: "follow",
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000)
    });

    const ct = res.headers.get("content-type") || "";

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    if (!ct.includes("text/html")) {
      throw new Error(`Invalid content type: ${ct}. Expected text/html.`);
    }

    return await res.text();
  } catch (error) {
    // Provide clear error messages
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: Page took too long to respond');
    }
    throw new Error(`Fetch failed: ${error.message}`);
  }
}

// Log initialization
console.log('Quick Web Scraper extension initialized');