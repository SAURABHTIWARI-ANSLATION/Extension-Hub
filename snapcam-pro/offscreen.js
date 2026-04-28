// offscreen.js - Persistent screen recorder with direct IndexedDB save

let mediaRecorder = null;
let recordedChunks = [];
let liveStream = null;
let elapsedSeconds = 0;
let timerInterval = null;
let isRecording = false;

// IndexedDB - same DB as popup uses
const DB_NAME = 'snapcam_db';
const DB_VERSION = 1;
const STORE_NAME = 'captures';
let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORE_NAME))
        d.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror   = e => reject(e.target.error);
  });
}

function saveToDB(record) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}

// Open DB immediately
openDB().catch(e => console.error('Offscreen DB error:', e));

function getBestMime() {
  for (const t of ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'])
    if (MediaRecorder.isTypeSupported(t)) return t;
  return 'video/webm';
}

function formatTime(sec) {
  return String(Math.floor(sec/60)).padStart(2,'0') + ':' + String(sec%60).padStart(2,'0');
}

function startTick() {
  elapsedSeconds = 0;
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    // Send tick to the popup when it is open. Failure is fine.
    chrome.runtime.sendMessage({ action: 'recordingTick', elapsed: elapsedSeconds }).catch(() => {});
  }, 1000);
}

function stopTick() {
  clearInterval(timerInterval);
  timerInterval = null;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.action === 'offscreen_start') {
    startCapture(msg.audio)
      .then(res => sendResponse(res))
      .catch(e => sendResponse({ error: e.message }));
    return true;
  }

  if (msg.action === 'offscreen_stop') {
    stopCapture();
    sendResponse({ ok: true });
    return true;
  }

  if (msg.action === 'offscreen_status') {
    sendResponse({ isRecording, elapsed: elapsedSeconds });
    return true;
  }

});

async function startCapture(audioOpt) {
  try {
    liveStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: audioOpt === 'system'
    });

    if (audioOpt === 'mic') {
      try {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        mic.getAudioTracks().forEach(t => liveStream.addTrack(t));
      } catch(e) {}
    }

    recordedChunks = [];
    const mime = getBestMime();
    mediaRecorder = new MediaRecorder(liveStream, { mimeType: mime });

    mediaRecorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      isRecording = false;
      stopTick();

      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'video/webm' });
      const id = Date.now();
      const filename = 'screen_' + id + '.webm';
      const duration = formatTime(elapsedSeconds);

      // Save directly to IndexedDB from offscreen so the popup does not
      // need to stay open for the recording to finish.
      try {
        if (!db) await openDB();
        await saveToDB({
          id,
          type: 'screen',
          filename,
          blob,
          createdAt: id,
          sizeBytes: blob.size,
          durationSeconds: elapsedSeconds,
          sourceMode: 'screen'
        });
        console.log('Screen recording saved to DB:', filename);
      } catch(e) {
        console.error('Failed to save to DB:', e);
      }

      if (liveStream) { liveStream.getTracks().forEach(t => t.stop()); liveStream = null; }

      // Notify popup if it's open
      chrome.runtime.sendMessage({
        action: 'recordingReady',
        id, filename, duration
      }).catch(() => {}); // OK if popup is closed
    };

    liveStream.getVideoTracks()[0].addEventListener('ended', () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    });

    mediaRecorder.start(1000);
    isRecording = true;
    startTick();

    chrome.runtime.sendMessage({ action: 'recordingStarted' }).catch(() => {});
    return { ok: true };

  } catch(e) {
    isRecording = false;
    return { error: e.name === 'NotAllowedError' ? 'cancelled' : e.message };
  }
}

function stopCapture() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  } else {
    isRecording = false;
    stopTick();
    if (liveStream) { liveStream.getTracks().forEach(t => t.stop()); liveStream = null; }
  }
}
