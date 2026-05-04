// Popup script for PiP Master
document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleButton');
  const videoCountElement = document.getElementById('videoCount');
  const pipStatusElement = document.getElementById('pipStatus');
  const pipCard = document.getElementById('pipCard');

  let updateInterval = null;

  async function getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
  }

  async function updateStatus() {
    try {
      const tab = await getCurrentTab();

      if (!tab || !tab.id) {
        videoCountElement.textContent = '0';
        pipStatusElement.textContent = '—';
        pipCard.classList.remove('active');
        return;
      }

      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))) {
        videoCountElement.textContent = '0';
        pipStatusElement.textContent = 'N/A';
        pipCard.classList.remove('active');
        return;
      }

      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });

        if (response) {
          videoCountElement.textContent = response.videoCount || 0;

          if (response.isPiPActive) {
            pipStatusElement.textContent = 'ON';
            pipCard.classList.add('active');
          } else if (response.hasVideo) {
            pipStatusElement.textContent = 'OFF';
            pipCard.classList.remove('active');
          } else {
            pipStatusElement.textContent = '—';
            pipCard.classList.remove('active');
          }
        }
      } catch (sendError) {
        videoCountElement.textContent = '?';
        pipStatusElement.textContent = '...';
        pipCard.classList.remove('active');
      }
    } catch (error) {
      console.error('Status update error:', error);
      videoCountElement.textContent = '!';
      pipStatusElement.textContent = '—';
      pipCard.classList.remove('active');
    }
  }

  toggleButton.addEventListener('click', async function() {
    const originalHTML = toggleButton.innerHTML;
    toggleButton.innerHTML = `<span class="btn-label">Processing...</span>`;
    toggleButton.disabled = true;

    try {
      const tab = await getCurrentTab();

      if (tab && tab.id && !(tab.url && tab.url.startsWith('chrome://'))) {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: 'togglePiP' });
          if (response && response.success) {
            setTimeout(updateStatus, 300);
          }
        } catch (sendError) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
            });
            await chrome.scripting.insertCSS({
              target: { tabId: tab.id },
              files: ['content.css']
            });

            setTimeout(async () => {
              const response = await chrome.tabs.sendMessage(tab.id, { action: 'togglePiP' });
              if (response && response.success) {
                setTimeout(updateStatus, 300);
              }
            }, 100);
          } catch (injectError) {
            console.error('Injection error:', injectError);
          }
        }
      }
    } catch (error) {
      console.error('Toggle error:', error);
    }

    setTimeout(function() {
      toggleButton.innerHTML = originalHTML;
      toggleButton.disabled = false;
    }, 1500);
  });

  updateStatus();
  updateInterval = setInterval(updateStatus, 2000);

  window.addEventListener('unload', function() {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
  });
});