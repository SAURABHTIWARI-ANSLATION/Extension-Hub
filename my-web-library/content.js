// Content script for My Web Library extension
// Security hardened version

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageContent') {
    try {
      // Validate document access
      if (!document || !document.title) {
        sendResponse({ error: 'Cannot access page content' });
        return true;
      }
      
      const selectedText = window.getSelection()?.toString() || '';
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      
      // Sanitize content
      const sanitizedTitle = sanitizeText(document.title || '');
      const sanitizedUrl = sanitizeUrl(window.location.href || '');
      const sanitizedDescription = sanitizeText(description);
      const sanitizedSelectedText = sanitizeText(selectedText);
      
      sendResponse({
        title: sanitizedTitle,
        url: sanitizedUrl,
        selectedText: sanitizedSelectedText,
        description: sanitizedDescription
      });
    } catch (err) {
      sendResponse({ error: err.message });
    }
    return true;
  }
  
  if (request.action === 'ping') {
    sendResponse({ status: 'alive' });
    return true;
  }
  
  return false;
});

// Helper: Sanitize text
function sanitizeText(text) {
  if (!text) return '';
  return text.substring(0, 5000).replace(/[^\w\s\-.,!?;:()@#$%&*+=/\\[\]{}|<>~`'"]/g, '');
}

// Helper: Sanitize URL
function sanitizeUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.href;
  } catch {
    return '';
  }
}

console.log('My Web Library content script loaded');