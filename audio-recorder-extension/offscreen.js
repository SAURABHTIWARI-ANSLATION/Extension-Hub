// Offscreen document for audio recording
let mediaRecorder = null;
let audioChunks = [];
let currentStream = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Offscreen received:', request.action);
  
  switch(request.action) {
    case 'startRecording':
      startRecording(request.streamId).then(sendResponse);
      return true;
      
    case 'stopRecording':
      stopRecording().then(sendResponse);
      return true;
  }
});

async function startRecording(streamId) {
  try {
    console.log('Starting recording with stream ID:', streamId);
    
    // Get the media stream
    currentStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      },
      video: false
    });
    
    console.log('Got media stream, audio tracks:', currentStream.getAudioTracks().length);
    
    // Check available MIME types - prioritize MP4
    const mimeType = MediaRecorder.isTypeSupported('audio/mp4') 
      ? 'audio/mp4' 
      : MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/webm';
    
    if (!mimeType) {
      throw new Error('No supported audio format found');
    }
    
    console.log('Using MIME type:', mimeType);
    
    // Create media recorder
    mediaRecorder = new MediaRecorder(currentStream, {
      mimeType: mimeType,
      audioBitsPerSecond: 128000 // 128 kbps
    });
    
    // Reset chunks
    audioChunks = [];
    
    // Handle data available
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
        console.log('Data chunk received, size:', event.data.size, 'Total chunks:', audioChunks.length);
      }
    };
    
    // Handle recording stop
    mediaRecorder.onstop = saveRecording;
    
    // Handle errors
    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event.error);
    };
    
    // Start recording with 1-second chunks
    mediaRecorder.start(1000);
    console.log('MediaRecorder started, state:', mediaRecorder.state);
    
    return { success: true };
    
  } catch (error) {
    console.error('Start recording failed:', error);
    cleanup();
    return { success: false, error: error.message };
  }
}

async function stopRecording() {
  try {
    console.log('Stopping recording...');
    
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      // Set up promise to wait for recording to complete
      const stopPromise = new Promise((resolve) => {
        mediaRecorder.onstop = () => {
          console.log('MediaRecorder stopped, saving recording');
          saveRecording();
          resolve();
        };
      });
      
      mediaRecorder.stop();
      
      // Wait for the recording to be saved
      await Promise.race([
        stopPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for recording to stop')), 5000))
      ]);
    }
    
    cleanup();
    console.log('Recording stopped successfully');
    return { success: true };
    
  } catch (error) {
    console.error('Stop recording failed:', error);
    cleanup();
    return { success: false, error: error.message };
  }
}

function saveRecording() {
  try {
    console.log('Saving recording, chunks:', audioChunks.length);
    
    if (audioChunks.length === 0) {
      console.error('No audio chunks to save');
      return;
    }
    
    const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
    console.log('Blob created, size:', blob.size);
    
    // Convert to base64 using Promise-based approach
    const reader = new FileReader();
    
    reader.onload = () => {
      const base64data = reader.result;
      console.log('FileReader loaded, result length:', base64data?.length || 0);
      
      // Extract only the base64 part
      const base64Match = base64data.match(/base64,(.*)$/);
      if (base64Match && base64Match[1]) {
        const base64Content = base64Match[1];
        console.log('Sending recording to background, base64 length:', base64Content.length);
        
        chrome.runtime.sendMessage({
          action: 'recordingComplete',
          data: base64Content
        }).catch(error => {
          console.error('Failed to send recording to background:', error);
        });
      } else {
        console.error('Failed to extract base64 data from result');
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
    };
    
    reader.readAsDataURL(blob);
    
  } catch (error) {
    console.error('Save recording failed:', error);
  }
}

function cleanup() {
  console.log('Cleaning up...');
  
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      mediaRecorder.stop();
    } catch (e) {
      // Ignore
    }
  }
  
  if (currentStream) {
    currentStream.getTracks().forEach(track => {
      track.stop();
    });
    currentStream = null;
  }
  
  mediaRecorder = null;
  audioChunks = [];
}