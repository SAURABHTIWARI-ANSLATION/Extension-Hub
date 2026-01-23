// Detect browser opening
let browserOpenedTime = Date.now();

// Send message to background when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', handleBrowserOpen);
} else {
  handleBrowserOpen();
}

function handleBrowserOpen() {
  // Check if this is a new browser session
  const currentTime = Date.now();
  const timeSinceLastOpen = currentTime - browserOpenedTime;
  
  // If it's been more than 30 minutes since last detection, show puzzle
  if (timeSinceLastOpen > 30 * 60 * 1000) {
    chrome.runtime.sendMessage({ action: 'showPuzzleNotification' });
    browserOpenedTime = currentTime;
  }
  
  // Check if user is on a distracting site
  checkDistractingSite();
}

// Check if user is on a distracting site
function checkDistractingSite() {
  const distractingSites = [
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'youtube.com',
    'netflix.com',
    'reddit.com'
  ];
  
  const currentHost = window.location.hostname;
  const isDistracting = distractingSites.some(site => currentHost.includes(site));
  
  if (isDistracting) {
    // Check if focus mode is enabled
    chrome.storage.local.get(['focusMode'], (result) => {
      if (result.focusMode && result.focusMode.enabled) {
        showFocusModePuzzle();
      }
    });
  }
}

// Show puzzle for focus mode
function showFocusModePuzzle() {
  const puzzleOverlay = document.createElement('div');
  puzzleOverlay.id = 'puzzle-pulse-focus-overlay';
  puzzleOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    z-index: 999999;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-family: Arial, sans-serif;
  `;
  
  const puzzleContent = document.createElement('div');
  puzzleContent.style.cssText = `
    background: #1a1a2e;
    padding: 30px;
    border-radius: 10px;
    text-align: center;
    max-width: 400px;
  `;
  
  puzzleContent.innerHTML = `
    <h2>Focus Mode Active</h2>
    <p>Solve this puzzle to continue browsing:</p>
    <div style="margin: 20px 0; font-size: 18px;">
      What has keys but can't open locks?
    </div>
    <input type="text" id="focus-puzzle-answer" 
           style="padding: 10px; width: 100%; margin-bottom: 15px; border-radius: 5px; border: none;">
    <button id="submit-focus-puzzle" 
            style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
      Submit
    </button>
    <p style="margin-top: 15px; font-size: 12px; color: #aaa;">
      Answer: piano (or keyboard)
    </p>
  `;
  
  puzzleOverlay.appendChild(puzzleContent);
  document.body.appendChild(puzzleOverlay);
  
  // Handle puzzle submission
  document.getElementById('submit-focus-puzzle').addEventListener('click', () => {
    const answer = document.getElementById('focus-puzzle-answer').value.toLowerCase();
    if (answer === 'piano' || answer === 'keyboard') {
      puzzleOverlay.remove();
      // Allow 5 minutes of browsing before next check
      setTimeout(() => {
        if (document.body.contains(puzzleOverlay)) {
          puzzleOverlay.remove();
        }
      }, 5 * 60 * 1000);
    }
  });
}