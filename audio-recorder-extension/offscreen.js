// offscreen.js — Audio capture and recording (Manifest V3 offscreen document)
// ─────────────────────────────────────────────────────────────────────────────
// ARCHITECTURE NOTE:
//   • Mic permission is NEVER requested here. It must be granted via the
//     sidebar (user-visible context) before any recording involving mic starts.
//   • All streams are cleaned up on every stop/error path via cleanup().
// ─────────────────────────────────────────────────────────────────────────────

/* ── Module state ──────────────────────────────────────────────────────────── */
let mediaRecorder     = null;
let audioChunks       = [];
let currentStream     = null;     // the stream fed into MediaRecorder
let originalStreams   = [];       // pre-mix streams that need separate cleanup
let audioContext      = null;     // shared AudioContext (created once per recording)
let analyserNode      = null;
let sourceNode        = null;
let levelInterval     = null;
let recordingMimeType = null;
let stopResolver      = null;
let stopPromise       = null;
let isPaused          = false;
let recordingStartTime = null;
let pausedDuration    = 0;
let pausedAt          = null;
let recordingMode     = 'tab';
let mixMicGainNode    = null;
let mixTabGainNode    = null;

/* ── Message router ────────────────────────────────────────────────────────── */
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  const handlers = {
    startRecording:   () => startRecording(request.tabId, request.mode, request.streamId),
    stopRecording:    () => stopRecording(),
    pauseRecording:   () => pauseRecording(),
    resumeRecording:  () => resumeRecording(),
    listAudioDevices: () => listAudioDevices(),
    setMixLevels:     () => setMixLevels(request.mic, request.tab)
  };

  const handler = handlers[request.action];
  if (!handler) return false;

  Promise.resolve()
    .then(handler)
    .then(sendResponse)
    .catch(err => sendResponse({ success: false, error: err.message || 'Offscreen error' }));

  return true; // keep channel open for async response
});

/* ── Recording start ───────────────────────────────────────────────────────── */
async function startRecording(tabId, mode, streamId) {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    return { success: false, error: 'Recorder already running' };
  }

  const ALLOWED_MODES = ['tab', 'mic', 'tab+mic'];
  recordingMode = ALLOWED_MODES.includes(mode) ? mode : 'tab';

  try {
    let stream;

    // ── Tab only ──────────────────────────────────────────────────────────
    if (recordingMode === 'tab') {
      if (!streamId) throw new Error('Missing tab stream ID');
      stream = await getTabStream(streamId);

    // ── Mic only ──────────────────────────────────────────────────────────
    } else if (recordingMode === 'mic') {
      // NOTE: permission must already be granted by the sidebar at this point.
      stream = await getMicStream();

    // ── Tab + Mic (mixed) ─────────────────────────────────────────────────
    } else {
      // recordingMode === 'tab+mic'
      if (!streamId) throw new Error('Missing tab stream ID for combined mode');

      const tabStream = await getTabStream(streamId);

      let micStream = null;
      try {
        micStream = await getMicStream();
      } catch (micErr) {
        // Mic failed after permission was supposedly granted.
        // Fall back to tab-only gracefully and notify the UI.
        const reason = friendlyMicError(micErr);
        notifyBackground('recordingNotice', {
          level: 'warning',
          message: `${reason} — recording tab audio only.`
        });
        recordingMode = 'tab';
        stream = tabStream;
      }

      // BUG FIX: original code used `if (!stream)` which is correct in logic
      // but relied on stream being undefined after mic failure. We now use an
      // explicit flag: if micStream was obtained successfully, mix the two.
      if (!stream && micStream) {
        // Both streams available — mix via Web Audio API
        stream = await mixStreams(tabStream, micStream);
      } else if (!stream) {
        // Mic acquisition failed above, stream was set to tabStream
        stream = tabStream;
      }
    }

    currentStream = stream;

    // Set up level analyser — reuses audioContext if mixStreams already created it
    setupLevelAnalyser(stream);

    // Pick the best supported MIME type
    const settings = await getStoredSettings();
    recordingMimeType = pickMimeType(settings.exportFormat);

    // Create and configure MediaRecorder
    mediaRecorder = new MediaRecorder(currentStream, {
      mimeType: recordingMimeType,
      audioBitsPerSecond: 128_000
    });

    audioChunks       = [];
    isPaused          = false;
    pausedDuration    = 0;
    pausedAt          = null;
    recordingStartTime = Date.now();

    stopPromise = new Promise(resolve => { stopResolver = resolve; });

    mediaRecorder.ondataavailable = ({ data }) => {
      if (data && data.size > 0) audioChunks.push(data);
    };

    mediaRecorder.onerror = ({ error }) => {
      const msg = error?.message || 'MediaRecorder error';
      notifyBackground('recordingError', { error: msg });
      if (stopResolver) { stopResolver(); stopResolver = null; }
      cleanup();
    };

    mediaRecorder.onstop = async () => {
      const blob     = new Blob(audioChunks, { type: recordingMimeType || 'audio/webm' });
      const duration = getElapsedSeconds();
      if (stopResolver) { stopResolver(); stopResolver = null; }
      try {
        await saveRecording(blob, duration);
      } catch (err) {
        notifyBackground('recordingError', { error: err?.message || 'Failed to save recording' });
      } finally {
        cleanup();
      }
    };

    mediaRecorder.start(1000);
    return { success: true, mimeType: recordingMimeType };

  } catch (err) {
    cleanup();
    return { success: false, error: err.message };
  }
}

/* ── Stream helpers ────────────────────────────────────────────────────────── */
async function getTabStream(streamId) {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource:   'tab',
        chromeMediaSourceId: streamId
      }
    },
    video: false
  });
}

async function getMicStream() {
  const settings = await getStoredSettings();
  const deviceId = String(settings.micDeviceId || '').trim();

  if (deviceId) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
        video: false
      });
    } catch {
      // Saved device is gone — fall back to system default
    }
  }
  return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
}

function friendlyMicError(err) {
  if (err.name === 'NotAllowedError')  return 'Microphone permission denied';
  if (err.name === 'NotFoundError')    return 'No microphone found';
  if (err.name === 'NotReadableError') return 'Microphone busy or in use';
  return 'Microphone unavailable';
}

/* ── Web Audio mixing ──────────────────────────────────────────────────────── */
async function mixStreams(tabStream, micStream) {
  // Create a single AudioContext for mixing (also used later by setupLevelAnalyser)
  const ctx = new AudioContext();
  audioContext = ctx;

  const dest     = ctx.createMediaStreamDestination();
  const tabSrc   = ctx.createMediaStreamSource(tabStream);
  const micSrc   = ctx.createMediaStreamSource(micStream);

  mixTabGainNode = ctx.createGain();
  mixMicGainNode = ctx.createGain();
  mixTabGainNode.gain.value = 1.0;
  mixMicGainNode.gain.value = 1.0;

  tabSrc.connect(mixTabGainNode).connect(dest);
  micSrc.connect(mixMicGainNode).connect(dest);

  // Track original streams so cleanup() can stop their tracks properly
  originalStreams = [tabStream, micStream];

  return dest.stream;
}

function setMixLevels(mic, tab) {
  const m = Number(mic);
  const t = Number(tab);
  if (mixMicGainNode && Number.isFinite(m)) {
    mixMicGainNode.gain.value = Math.max(0, Math.min(1, m));
  }
  if (mixTabGainNode && Number.isFinite(t)) {
    mixTabGainNode.gain.value = Math.max(0, Math.min(1, t));
  }
  return { success: true };
}

/* ── Level analyser ────────────────────────────────────────────────────────── */
function setupLevelAnalyser(stream) {
  try {
    // Reuse the audioContext created by mixStreams, or create a new one.
    const ctx = audioContext || new AudioContext();
    if (!audioContext) audioContext = ctx;

    sourceNode   = ctx.createMediaStreamSource(stream);
    analyserNode = ctx.createAnalyser();
    analyserNode.fftSize              = 256;
    analyserNode.smoothingTimeConstant = 0.8;
    sourceNode.connect(analyserNode);

    const samples = new Uint8Array(analyserNode.fftSize);

    levelInterval = setInterval(() => {
      if (!analyserNode || isPaused) return;
      analyserNode.getByteTimeDomainData(samples);

      let sumSq = 0;
      let peak  = 0;
      for (let i = 0; i < samples.length; i++) {
        const n = (samples[i] - 128) / 128;
        sumSq += n * n;
        const a = Math.abs(n);
        if (a > peak) peak = a;
      }

      const level = Math.max(0, Math.min(1, Math.sqrt(sumSq / samples.length)));
      notifyBackground('recordingLevel',    { level });
      notifyBackground('recordingWavePeak', { peak: Math.max(0, Math.min(1, peak)) });
    }, 100);
  } catch {
    // Level metering is non-critical; swallow errors silently
  }
}

/* ── Pause / Resume ────────────────────────────────────────────────────────── */
function pauseRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording' && !isPaused) {
    mediaRecorder.pause();
    isPaused  = true;
    pausedAt  = Date.now();
    return { success: true };
  }
  return { success: false, error: 'Cannot pause — recorder not active' };
}

function resumeRecording() {
  if (mediaRecorder && mediaRecorder.state === 'paused' && isPaused) {
    mediaRecorder.resume();
    if (pausedAt) pausedDuration += Date.now() - pausedAt;
    pausedAt = null;
    isPaused = false;
    return { success: true };
  }
  return { success: false, error: 'Cannot resume — recorder not paused' };
}

/* ── Stop ──────────────────────────────────────────────────────────────────── */
async function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') {
    cleanup();
    return { success: true };
  }
  try {
    mediaRecorder.stop();
    await Promise.race([
      stopPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Stop timed out after 12s')), 12_000)
      )
    ]);
    return { success: true };
  } catch (err) {
    cleanup();
    return { success: false, error: err.message };
  }
}

/* ── Device enumeration ────────────────────────────────────────────────────── */
async function listAudioDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const inputs  = devices
      .filter(d => d && d.kind === 'audioinput')
      .map(d => ({ deviceId: d.deviceId, label: d.label || `Microphone (${d.deviceId.slice(0, 8)})` }));
    return { success: true, devices: inputs };
  } catch (err) {
    return { success: false, devices: [], error: err.message };
  }
}

/* ── MIME type selection ───────────────────────────────────────────────────── */
function pickMimeType(exportFormat) {
  // Prefer the user's chosen format, then fall back gracefully
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];

  try {
    if (
      exportFormat === 'mp3'
      && typeof MediaRecorder !== 'undefined'
      && MediaRecorder.isTypeSupported('audio/mpeg')
    ) {
      candidates.unshift('audio/mpeg');
    }
  } catch {/* ignore */}

  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return 'audio/webm';
}

/* ── Timing ────────────────────────────────────────────────────────────────── */
function getElapsedSeconds() {
  if (!recordingStartTime) return 0;
  const currentPausedMs = (isPaused && pausedAt) ? (Date.now() - pausedAt) : 0;
  return Math.max(0, Date.now() - recordingStartTime - pausedDuration - currentPausedMs) / 1000;
}

/* ── Save recording ────────────────────────────────────────────────────────── */
async function saveRecording(blob, duration) {
  const settings  = await getStoredSettings();
  let outputBlob  = blob;
  let mimeType    = blob.type || recordingMimeType || 'audio/webm';

  // WAV conversion (in-process, no external library)
  if (settings.exportFormat === 'wav') {
    try {
      outputBlob = await convertToWav(blob);
      mimeType   = 'audio/wav';
    } catch {
      // Silently fall back to WebM
    }
  } else if (settings.exportFormat === 'mp3' && !String(mimeType).includes('mpeg')) {
    notifyBackground('recordingNotice', {
      level:   'warning',
      message: 'MP3 export not supported in this browser build — saved as WebM instead.'
    });
  }

  const maxGB   = Math.max(1, Number(settings.maxStorageGB) || 1);
  const maxBytes = maxGB * 1024 * 1024 * 1024;
  const HARD_CAP = 120 * 1024 * 1024; // 120 MB per recording
  const size     = Number(outputBlob?.size) || 0;

  if (size <= 0)                         throw new Error('Recording data is empty');
  if (size > Math.min(maxBytes, HARD_CAP)) throw new Error('Recording too large to save safely');

  const base64 = await blobToBase64(outputBlob);
  notifyBackground('recordingComplete', {
    data:     base64,
    mimeType,
    duration,
    mode:     recordingMode
  });
}

/* ── WAV encoder ───────────────────────────────────────────────────────────── */
async function convertToWav(blob) {
  const AC  = window.AudioContext || window.webkitAudioContext;
  if (!AC) throw new Error('WAV conversion not supported');
  const ctx = new AC();
  try {
    const audioBuffer = await ctx.decodeAudioData(await blob.arrayBuffer());
    return encodeWav(audioBuffer);
  } finally {
    ctx.close().catch(() => {});
  }
}

function encodeWav(buffer) {
  const numChannels   = buffer.numberOfChannels;
  const sampleRate    = buffer.sampleRate;
  const totalSamples  = buffer.length;
  const blockAlign    = numChannels * 2;
  const dataSize      = totalSamples * blockAlign;
  const wavBuf        = new ArrayBuffer(44 + dataSize);
  const view          = new DataView(wavBuf);

  const str = (offset, s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  str(0,  'RIFF');  view.setUint32(4,  36 + dataSize, true);
  str(8,  'WAVE');  str(12, 'fmt ');
  view.setUint32(16, 16, true);        // PCM chunk size
  view.setUint16(20, 1,  true);        // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate,  true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign,  true);
  view.setUint16(34, 16, true);        // bits per sample
  str(36, 'data'); view.setUint32(40, dataSize, true);

  const channels = [];
  for (let ch = 0; ch < numChannels; ch++) channels.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const s = Math.max(-1, Math.min(1, channels[ch][i] || 0));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
  }
  return new Blob([wavBuf], { type: 'audio/wav' });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader    = new FileReader();
    reader.onload   = () => {
      const result  = String(reader.result || '');
      const encoded = result.split(',')[1] || '';
      if (!encoded) { reject(new Error('Failed to encode recording as base64')); return; }
      resolve(encoded);
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

/* ── Settings helper ───────────────────────────────────────────────────────── */
async function getStoredSettings() {
  try {
    const data = await chrome.storage.local.get('settings');
    return data.settings || { exportFormat: 'webm', maxStorageGB: 1 };
  } catch {
    return { exportFormat: 'webm', maxStorageGB: 1 };
  }
}

/* ── Message helper ────────────────────────────────────────────────────────── */
function notifyBackground(action, payload) {
  chrome.runtime.sendMessage({ action, ...payload }).catch(() => {});
}

/* ── Cleanup ───────────────────────────────────────────────────────────────── */
function cleanup() {
  if (levelInterval) { clearInterval(levelInterval); levelInterval = null; }

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try { mediaRecorder.stop(); } catch {/* ignore */}
  }

  // Stop the main stream's tracks
  if (currentStream) {
    currentStream.getTracks().forEach(t => t.stop());
  }

  // Stop original pre-mix streams (tab + mic individually)
  for (const s of originalStreams) {
    try { s.getTracks().forEach(t => t.stop()); } catch {/* ignore */}
  }

  if (sourceNode)  { try { sourceNode.disconnect();  } catch {/* ignore */} }
  if (analyserNode){ try { analyserNode.disconnect(); } catch {/* ignore */} }
  if (audioContext){ audioContext.close().catch(() => {}); }

  // Reset all state
  mediaRecorder     = null;
  audioChunks       = [];
  currentStream     = null;
  originalStreams   = [];
  audioContext      = null;
  sourceNode        = null;
  analyserNode      = null;
  recordingMimeType = null;
  stopPromise       = null;
  stopResolver      = null;
  isPaused          = false;
  pausedDuration    = 0;
  pausedAt          = null;
  recordingStartTime = null;
  recordingMode     = 'tab';
  mixMicGainNode    = null;
  mixTabGainNode    = null;
}