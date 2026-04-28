// Background Service Worker - SnapCam Pro v3.0.0

let offscreenCreated = false;

async function ensureOffscreen() {
  const existing = await chrome.offscreen.hasDocument();
  if (existing) { offscreenCreated = true; return; }
  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL('offscreen.html'),
    reasons: ['USER_MEDIA', 'DISPLAY_MEDIA'],
    justification: 'Screen recording that persists across tab switches'
  });
  offscreenCreated = true;
}

async function sendToOffscreen(msg) {
  await ensureOffscreen();
  return chrome.runtime.sendMessage(msg);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // Popup -> start recording
  if (msg.action === 'startScreenRecording') {
    ensureOffscreen()
      .then(() => chrome.runtime.sendMessage({ action: 'offscreen_start', audio: msg.audio }))
      .then(res => sendResponse(res))
      .catch(e => sendResponse({ error: e.message }));
    return true;
  }

  // Popup -> stop recording
  if (msg.action === 'stopScreenRecording') {
    sendToOffscreen({ action: 'offscreen_stop' })
      .then(res => sendResponse(res || { ok: true }))
      .catch(e => sendResponse({ error: e.message }));
    return true;
  }

  // Popup -> get status
  if (msg.action === 'getRecordingStatus') {
    chrome.offscreen.hasDocument()
      .then((hasDocument) => {
        if (!hasDocument) {
          sendResponse({ isRecording: false, elapsed: 0 });
          return;
        }
        offscreenCreated = true;
        return chrome.runtime.sendMessage({ action: 'offscreen_status' })
          .then(res => sendResponse(res))
          .catch(() => sendResponse({ isRecording: false, elapsed: 0 }));
      })
      .catch(() => sendResponse({ isRecording: false, elapsed: 0 }));
    return true;
  }

  if (msg.action === 'recordingReady') {
    sendResponse({ ok: true });
    return true;
  }

  if (msg.action === 'recordingTick') {
    return true;
  }

  if (msg.action === 'recordingStarted') {
    return true;
  }

});

chrome.runtime.onInstalled.addListener(() => {
  console.log('SnapCam Pro v3.0.0 installed');
});