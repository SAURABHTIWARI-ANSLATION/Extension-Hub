// Background service worker - Audio Recorder Extension
let isRecording = false;
let recordingTabId = null;

// Initialize storage
chrome.runtime.onInstalled.addListener(() => {
  console.log('Audio Recorder installed');
  chrome.storage.local.set({ recordings: [] });
});

// Handle messages from popup and offscreen
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received:', request.action);
  
  switch(request.action) {
    case 'status':
      sendResponse({ recording: isRecording });
      break;
      
    case 'start':
      startRecording(request.tabId).then(result => sendResponse(result));
      return true;
      
    case 'stop':
      stopRecording().then(result => sendResponse(result));
      return true;
      
    case 'getHistory':
      getHistory().then(result => sendResponse(result));
      return true;
      
    case 'recordingComplete':
      saveRecordingFile(request.data);
      break;
  }
});

async function startRecording(tabId) {
  if (isRecording) {
    return { success: false, error: 'Already recording' };
  }

  try {
    console.log('Starting recording for tab:', tabId);
    
    // Check if tab has audio
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting tab info:', chrome.runtime.lastError);
      } else if (tab.audible === false) {
        console.warn('Warning: Tab is not producing audio');
      }
    });
    
    // Get stream ID from tabCapture API
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tabId
    });
    
    console.log('Got stream ID:', streamId);
    
    // Create offscreen document if needed
    await createOffscreenDocument();
    
    // Start recording in offscreen
    const response = await chrome.runtime.sendMessage({
      action: 'startRecording',
      streamId: streamId
    });
    
    console.log('Offscreen response:', response);
    
    if (response && response.success) {
      isRecording = true;
      recordingTabId = tabId;
      
      // Update badge to show recording status
      chrome.action.setBadgeText({ text: '●' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
      
      console.log('Recording started successfully');
      return { success: true };
    } else {
      throw new Error(response?.error || 'Failed to start recording');
    }
    
  } catch (error) {
    console.error('Start recording failed:', error);
    isRecording = false;
    return { success: false, error: error.message };
  }
}

async function stopRecording() {
  if (!isRecording) {
    return { success: false, error: 'Not recording' };
  }

  try {
    console.log('Stopping recording');
    
    // Stop recording in offscreen
    const response = await chrome.runtime.sendMessage({
      action: 'stopRecording'
    });
    
    if (response && response.success) {
      isRecording = false;
      recordingTabId = null;
      
      // Clear badge
      chrome.action.setBadgeText({ text: '' });
      
      console.log('Recording stopped successfully');
      return { success: true };
    } else {
      throw new Error(response?.error || 'Failed to stop recording');
    }
    
  } catch (error) {
    console.error('Stop recording failed:', error);
    return { success: false, error: error.message };
  }
}

async function createOffscreenDocument() {
  // Check if offscreen document already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });

  // If an offscreen document is already open, do not create a new one.
  for (const context of existingContexts) {
    if (context.contextType === 'OFFSCREEN_DOCUMENT') {
      console.log('Offscreen document already exists');
      return;
    }
  }

  // Create offscreen document
  console.log('Creating offscreen document');
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: [chrome.offscreen.Reason.USER_MEDIA],
    justification: 'Recording audio from tab'
  });
  console.log('Offscreen document created');
}

// FIXED VERSION: No URL.createObjectURL used
function saveRecordingFile(base64data) {
  console.log('Saving recording file, base64 length:', base64data?.length || 0);
  
  if (!base64data) {
    console.error('No data received from offscreen');
    return;
  }
  
  try {
    // Create filename with timestamp
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}-${now.getMinutes().toString().padStart(2,'0')}-${now.getSeconds().toString().padStart(2,'0')}`;
    const filename = `audio_recording_${timestamp}.mp4`;
    
    // Determine the correct MIME type based on the filename
    const mimeType = filename.endsWith('.mp4') ? 'audio/mp4' : 'audio/webm';
    // Create data URL directly (NO URL.createObjectURL used)
    const dataUrl = `data:${mimeType};base64,${base64data}`;
    
    console.log('Attempting to download file:', filename);
    
    // Download the file using Chrome's downloads API
    chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: true,
      conflictAction: 'uniquify'
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download failed:', chrome.runtime.lastError.message);
        
        // Try fallback without saveAs dialog
        chrome.downloads.download({
          url: dataUrl,
          filename: filename,
          saveAs: false
        }, (downloadId2) => {
          if (chrome.runtime.lastError) {
            console.error('Fallback download also failed:', chrome.runtime.lastError.message);
            // Last resort: try to save through popup
            notifyUserToSave(base64data, filename);
          } else {
            console.log('File saved successfully (no dialog)');
            saveToHistory(filename, base64data.length);
          }
        });
      } else {
        console.log('File saved successfully, download ID:', downloadId);
        saveToHistory(filename, base64data.length);
      }
    });
    
  } catch (error) {
    console.error('Save recording file failed:', error);
  }
}

function notifyUserToSave(base64data, filename) {
  // Send message to popup to handle save
  chrome.runtime.sendMessage({
    action: 'saveRecordingFallback',
    data: base64data,
    filename: filename
  }).catch(err => {
    console.error('Could not notify popup:', err);
  });
}

async function saveToHistory(filename, size) {
  try {
    const result = await chrome.storage.local.get('recordings');
    const recordings = result.recordings || [];
    
    recordings.unshift({
      filename: filename,
      size: size,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString()
    });
    
    // Keep only last 10 recordings
    if (recordings.length > 10) {
      recordings.pop();
    }
    
    await chrome.storage.local.set({ recordings });
    console.log('Saved to history:', filename);
    
  } catch (error) {
    console.error('Save to history failed:', error);
  }
}

async function getHistory() {
  try {
    const result = await chrome.storage.local.get('recordings');
    return result.recordings || [];
  } catch (error) {
    console.error('Get history failed:', error);
    return [];
  }
}

// Listen for download events
chrome.downloads.onChanged.addListener((delta) => {
  if (delta.state && delta.state.current === 'complete') {
    console.log('Download completed successfully');
  }
});