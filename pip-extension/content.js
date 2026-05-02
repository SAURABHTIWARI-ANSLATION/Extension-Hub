// PiP Master Content Script - Enhanced Version with Fixes
let isInitialized = false;
let pipButton = null;
let userInteracted = false;

// Find all videos on page
function findVideos() {
  const videos = Array.from(document.querySelectorAll('video'));
  return videos.filter(function(video) {
    const rect = video.getBoundingClientRect();
    return rect.width > 100 && rect.height > 75;
  });
}

// Get main video
function getMainVideo() {
  const videos = findVideos();
  if (videos.length === 0) return null;
  
  const hostname = window.location.hostname;
  
  // Platform-specific selectors
  if (hostname.includes('youtube.com')) {
    const ytVideo = document.querySelector('video.html5-main-video');
    if (ytVideo) return ytVideo;
  }
  
  if (hostname.includes('twitch.tv')) {
    const twitchVideo = document.querySelector('.video-player__container video, [data-test-selector="video-player"] video');
    if (twitchVideo) return twitchVideo;
  }
  
  if (hostname.includes('netflix.com')) {
    const netflixVideo = document.querySelector('video');
    if (netflixVideo) return netflixVideo;
  }
  
  if (hostname.includes('vimeo.com')) {
    const vimeoVideo = document.querySelector('video');
    if (vimeoVideo) return vimeoVideo;
  }
  
  // Return largest video by area
  return videos.reduce(function(largest, video) {
    const rect = video.getBoundingClientRect();
    const largestRect = largest.getBoundingClientRect();
    return (rect.width * rect.height) > (largestRect.width * largestRect.height) ? video : largest;
  });
}

// Simulate user interaction on video (required for some sites)
function simulateUserInteraction(video) {
  if (userInteracted) return true;
  
  // Click the video to give it focus
  video.click();
  
  // Dispatch a click event
  const clickEvent = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  video.dispatchEvent(clickEvent);
  
  userInteracted = true;
  return true;
}

// Start Picture-in-Picture
async function startPiP() {
  const video = getMainVideo();
  
  if (!video) {
    showNotification('No video found on this page', 'error');
    return { success: false, error: 'No video found' };
  }
  
  if (!document.pictureInPictureEnabled) {
    showNotification('PiP is not supported in this browser', 'error');
    return { success: false, error: 'PiP not supported' };
  }
  
  try {
    // Check if already in PiP
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    }
    
    // Ensure video can enter PiP
    if (video.hasAttribute('disablepictureinpicture')) {
      video.removeAttribute('disablepictureinpicture');
    }
    
    // Simulate user interaction for sites that require it
    simulateUserInteraction(video);
    
    // Small delay to ensure user interaction is registered
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Request PiP with error handling for security errors
    try {
      await video.requestPictureInPicture();
    } catch (pipError) {
      // If direct request fails, try alternative approach
      if (pipError.name === 'NotAllowedError') {
        showNotification('Click the video first, then try again', 'info');
        // Highlight the video to guide user
        highlightVideo(video);
        return { success: false, error: 'Please click the video first' };
      }
      throw pipError;
    }
    
    showNotification('PiP mode activated ✓', 'success');
    
    // Set up event handlers
    video.addEventListener('leavepictureinpicture', function onLeave() {
      showNotification('Exited PiP mode', 'info');
      notifyPiPStateChange(false);
      video.removeEventListener('leavepictureinpicture', onLeave);
    }, { once: true });
    
    video.addEventListener('enterpictureinpicture', function onEnter() {
      notifyPiPStateChange(true);
      video.removeEventListener('enterpictureinpicture', onEnter);
    }, { once: true });
    
    notifyPiPStateChange(true);
    return { success: true, isActive: true };
  } catch (error) {
    console.error('PiP error:', error);
    let errorMessage = error.message;
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Click the video first, then try again';
    }
    showNotification('Error: ' + errorMessage, 'error');
    return { success: false, error: errorMessage };
  }
}

// Highlight video to guide user
function highlightVideo(video) {
  const originalOutline = video.style.outline;
  video.style.outline = '3px solid #2563EB';
  video.style.outlineOffset = '2px';
  setTimeout(() => {
    video.style.outline = originalOutline;
  }, 2000);
}

// Stop Picture-in-Picture
async function stopPiP() {
  if (document.pictureInPictureElement) {
    try {
      await document.exitPictureInPicture();
      notifyPiPStateChange(false);
      return { success: true, isActive: false };
    } catch (error) {
      console.error('Exit error:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: true, isActive: false };
}

// Toggle PiP
async function togglePiP() {
  if (document.pictureInPictureElement) {
    return await stopPiP();
  } else {
    return await startPiP();
  }
}

// Notify background script of PiP state change
function notifyPiPStateChange(isActive) {
  try {
    chrome.runtime.sendMessage({
      action: 'pipStateChanged',
      isActive: isActive
    });
  } catch (error) {
    // Background might not be ready
  }
}

// Show notification
function showNotification(message, type) {
  const existingNotification = document.querySelector('.pip-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `pip-notification pip-notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(function() {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

// Add PiP button to YouTube
function addYouTubeButton() {
  if (!window.location.hostname.includes('youtube.com')) return;
  
  const checkInterval = setInterval(function() {
    const controls = document.querySelector('.ytp-right-controls');
    const existingButton = document.querySelector('.pip-youtube-button');
    
    if (controls && !existingButton) {
      pipButton = document.createElement('button');
      pipButton.className = 'ytp-button pip-youtube-button';
      pipButton.setAttribute('title', 'Picture-in-Picture (Ctrl+Shift+P)');
      pipButton.setAttribute('aria-label', 'Picture-in-Picture');
      
      // Create SVG icon
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '22');
      svg.setAttribute('height', '22');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'white');
      svg.setAttribute('stroke-width', '1.5');
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '2');
      rect.setAttribute('y', '4');
      rect.setAttribute('width', '20');
      rect.setAttribute('height', '16');
      rect.setAttribute('rx', '2');
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M10 12h10v4H10z');
      
      svg.appendChild(rect);
      svg.appendChild(path);
      pipButton.appendChild(svg);
      
      pipButton.addEventListener('click', async function(event) {
        event.preventDefault();
        event.stopPropagation();
        userInteracted = true;
        await togglePiP();
      });
      
      controls.appendChild(pipButton);
      clearInterval(checkInterval);
    }
  }, 1000);
}

// Listen for user clicks on videos
function setupVideoClickListener() {
  document.addEventListener('click', function(event) {
    const video = event.target.closest('video');
    if (video) {
      userInteracted = true;
    }
  }, true);
}

// Message listener
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'togglePiP') {
    togglePiP().then(function(result) {
      sendResponse(result);
    }).catch(function(error) {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (message.action === 'getStatus') {
    const videos = findVideos();
    sendResponse({
      hasVideo: videos.length > 0,
      isPiPActive: document.pictureInPictureElement !== null,
      videoCount: videos.length
    });
    return true;
  } else if (message.action === 'ping') {
    sendResponse({ status: 'ok' });
    return true;
  }
  return true;
});

// Initialize content script
function init() {
  if (isInitialized) return;
  isInitialized = true;
  
  addYouTubeButton();
  setupVideoClickListener();
  console.log('PiP Master initialized on', window.location.hostname);
}

// Handle dynamic content loading (SPAs)
let lastUrl = window.location.href;
const observer = new MutationObserver(function() {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    userInteracted = false; // Reset interaction on navigation
    setTimeout(init, 500);
  }
});

observer.observe(document, { subtree: true, childList: true });

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}