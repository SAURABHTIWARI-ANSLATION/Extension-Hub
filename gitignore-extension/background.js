// Background script for auto-detection
async function detectTechStack(tabId) {
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: async () => {
        // Modern async detection using fetch
        const checkFile = async (url) => {
          try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
          } catch { 
            return false; 
          }
        };
        
        const checks = [
          { name: 'node', file: '/package.json' },
          { name: 'python', file: '/requirements.txt' },
          { name: 'next', file: '/next.config.js' },
          { name: 'react', file: '/src/App.js' },
          { name: 'java', file: '/pom.xml' },
          { name: 'php', file: '/composer.json' },
          { name: 'go', file: '/go.mod' },
          { name: 'rust', file: '/Cargo.toml' },
          { name: 'docker', file: '/Dockerfile' }
        ];
        
        const results = await Promise.all(
          checks.map(async (check) => {
            const exists = await checkFile(check.file);
            return exists ? check.name : null;
          })
        );
        
        return results.filter(Boolean);
      }
    });
    
    return result[0]?.result || [];
  } catch (error) {
    console.log('Detection error:', error);
    return [];
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'detectTechStack') {
    detectTechStack(request.tabId).then(result => {
      sendResponse(result);
    });
    return true; // Required for async sendResponse
  }
});