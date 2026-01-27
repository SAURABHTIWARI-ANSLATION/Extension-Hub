// Background script for auto-detection
async function detectTechStack(tabId) {
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Check for package.json
        const checkFile = async (url) => {
          try {
            const response = await fetch(url);
            return response.ok;
          } catch { return false; }
        };
        
        const checks = [
          { name: 'node', file: '/package.json' },
          { name: 'python', file: '/requirements.txt' },
          { name: 'next', file: '/next.config.js' },
          { name: 'react', file: '/src/App.js' }
        ];
        
        return Promise.all(checks.map(async (check) => {
          const exists = await checkFile(check.file);
          return exists ? check.name : null;
        }));
      }
    });
    
    return result[0].filter(Boolean);
  } catch (error) {
    return [];
  }
}