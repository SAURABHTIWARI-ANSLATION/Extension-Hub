// offscreen.js — Audio capture and recording (Manifest V3 offscreen document)

let mediaRecorder = null;
let audioChunks = [];
let currentStream = null;
let audioContext = null;
let sourceNode = null;
let analyserNode = null;
let levelInterval = null;
let recordingMimeType = null;
let stopPromise = null;
let stopResolver = null;
let isPaused = false;
let recordingStartTime = null;
let pausedDuration = 0;
let pausedAt = null;
let recordingMode = 'tab';
let mixMicGainNode = null;
let mixTabGainNode = null;

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  const handlers = {
    startRecording: () => startRecording(request.tabId, request.mode, request.streamId),
    stopRecording:  () => stopRecording(),
    pauseRecording: () => pauseRecording(),
    resumeRecording: () => resumeRecording(),
    probeMicrophone: () => probeMicrophone(),
    listAudioDevices: () => listAudioDevices(),
    setMixLevels: () => setMixLevels(request.mic, request.tab)
  };

  const handler = handlers[request.action];
  if (!handler) return false;

  Promise.resolve()
    .then(() => handler())
    .then(sendResponse)
    .catch((error) => sendResponse({ success: false, error: error.message || 'Unknown offscreen error' }));

  return true;
});

async function probeMicrophone() {
  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    return { success: true };
  } catch (error) {
    const name = error?.name || 'Error';
    const message = error?.message || 'Microphone permission failed';
    return { success: false, name, error: message };
  } finally {
    if (stream) stream.getTracks().forEach(track => track.stop());
  }
}

async function startRecording(tabId, mode, streamId) {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    return { success: false, error: 'Recorder already running' };
  }

  try {
    let stream;
    const allowedModes = ['tab', 'mic', 'tab+mic'];
    recordingMode = mode || 'tab';
    if (!allowedModes.includes(recordingMode)) {
      throw new Error('Invalid recording mode: ' + recordingMode);
    }

    if (mode === 'tab') {
      if (!streamId) throw new Error('Missing tab stream ID');
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'tab',
            chromeMediaSourceId: streamId
          }
        }
      });
    } else if (mode === 'mic') {
      // Microphone — getUserMedia triggered after user interaction in sidebar
      stream = await getMicStreamWithSettings();
    } else if (mode === 'tab+mic') {
      // Combine tab audio + microphone using Web Audio API
      if (!streamId) throw new Error('Missing tab stream ID for combined mode');
      const tabStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'tab',
            chromeMediaSourceId: streamId
          }
        }
      });
      const micStream = await getMicStreamWithSettings();
      stream = await mixStreams(tabStream, micStream);
    } else {
      throw new Error('Invalid recording mode: ' + mode);
    }

    currentStream = stream;
    setupLevelAnalyser(stream);

    const settings = await getExportSettings();
    recordingMimeType = pickMimeType(settings.exportFormat);
    mediaRecorder = new MediaRecorder(currentStream, {
      mimeType: recordingMimeType,
      audioBitsPerSecond: 128000
    });

    audioChunks = [];
    isPaused = false;
    pausedDuration = 0;
    pausedAt = null;
    recordingStartTime = Date.now();

    stopPromise = new Promise((resolve) => { stopResolver = resolve; });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onerror = async (event) => {
      const message = event?.error?.message || 'MediaRecorder error';
      chrome.runtime.sendMessage({ action: 'recordingError', error: message }).catch(() => {});
      if (stopResolver) { stopResolver(); stopResolver = null; }
      cleanup();
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: recordingMimeType || 'audio/webm' });
      const duration = getElapsedSeconds();
      if (stopResolver) { stopResolver(); stopResolver = null; }
      try {
        await saveRecording(blob, duration);
      } catch (error) {
        chrome.runtime.sendMessage({
          action: 'recordingError',
          error: error?.message || 'Failed to save recording'
        }).catch(() => {});
      } finally {
        cleanup();
      }
    };

    mediaRecorder.start(1000);
    return { success: true, mimeType: recordingMimeType };
  } catch (error) {
    cleanup();
    return { success: false, error: error.message };
  }
}

async function getSettings() {
  try {
    const data = await chrome.storage.local.get('settings');
    return data.settings || {};
  } catch (_) {
    return {};
  }
}

async function getMicStreamWithSettings() {
  const s = await getSettings();
  const id = String(s.micDeviceId || '').trim();
  if (id) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: id } },
        video: false
      });
    } catch (_) {
      // Fall back to default mic if the saved device is unavailable.
    }
  }
  return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
}

async function listAudioDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices
      .filter(d => d && d.kind === 'audioinput')
      .map(d => ({ deviceId: d.deviceId, label: d.label || '' }));
    return { success: true, devices: audioInputs };
  } catch (e) {
    return { success: false, devices: [], error: e.message };
  }
}

async function mixStreams(tabStream, micStream) {
  const ctx = new AudioContext();
  audioContext = ctx;

  const tabSource = ctx.createMediaStreamSource(tabStream);
  const micSource = ctx.createMediaStreamSource(micStream);
  const dest = ctx.createMediaStreamDestination();

  const tabGain = ctx.createGain();
  tabGain.gain.value = 1.0;
  const micGain = ctx.createGain();
  micGain.gain.value = 1.0;
  mixTabGainNode = tabGain;
  mixMicGainNode = micGain;

  tabSource.connect(tabGain);
  micSource.connect(micGain);
  tabGain.connect(dest);
  micGain.connect(dest);

  // Keep original streams for cleanup
  dest._originalStreams = [tabStream, micStream];
  return dest.stream;
}

function setMixLevels(mic, tab) {
  const m = Number(mic);
  const t = Number(tab);
  if (mixMicGainNode && Number.isFinite(m)) mixMicGainNode.gain.value = Math.max(0, Math.min(1, m));
  if (mixTabGainNode && Number.isFinite(t)) mixTabGainNode.gain.value = Math.max(0, Math.min(1, t));
  return { success: true };
}

function pauseRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording' && !isPaused) {
    mediaRecorder.pause();
    isPaused = true;
    pausedAt = Date.now();
    return { success: true };
  }
  return { success: false, error: 'Cannot pause' };
}

function resumeRecording() {
  if (mediaRecorder && mediaRecorder.state === 'paused' && isPaused) {
    mediaRecorder.resume();
    if (pausedAt) pausedDuration += Date.now() - pausedAt;
    pausedAt = null;
    isPaused = false;
    return { success: true };
  }
  return { success: false, error: 'Cannot resume' };
}

async function stopRecording() {
  try {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      cleanup();
      return { success: true };
    }
    mediaRecorder.stop();
    await Promise.race([
      stopPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Stop timed out')), 12000))
    ]);
    return { success: true };
  } catch (error) {
    cleanup();
    return { success: false, error: error.message };
  }
}

function setupLevelAnalyser(stream) {
  try {
    const ctx = audioContext || new AudioContext();
    if (!audioContext) audioContext = ctx;

    const source = ctx.createMediaStreamSource(stream);
    sourceNode = source;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    analyserNode = analyser;
    source.connect(analyser);

    const samples = new Uint8Array(analyser.fftSize);
    levelInterval = setInterval(() => {
      if (!analyserNode || isPaused) return;
      analyserNode.getByteTimeDomainData(samples);
      let sumSq = 0;
      let peak = 0;
      for (let i = 0; i < samples.length; i++) {
        const n = (samples[i] - 128) / 128;
        sumSq += n * n;
        const a = Math.abs(n);
        if (a > peak) peak = a;
      }
      const rms = Math.sqrt(sumSq / samples.length);
      const level = Math.max(0, Math.min(1, rms));
      chrome.runtime.sendMessage({ action: 'recordingLevel', level }).catch(() => {});
      chrome.runtime.sendMessage({ action: 'recordingWavePeak', peak: Math.max(0, Math.min(1, peak)) }).catch(() => {});
    }, 100);
  } catch (_) {}
}

function pickMimeType(exportFormat) {
  const options = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  // Best-effort MP3 support (not available on all Chromium builds).
  try {
    if (typeof MediaRecorder !== 'undefined'
      && typeof MediaRecorder.isTypeSupported === 'function'
      && MediaRecorder.isTypeSupported('audio/mpeg')) {
      // Prefer MP3 only when user selected it.
      if (exportFormat === 'mp3') options.unshift('audio/mpeg');
    }
  } catch (_) {}
  for (const mime of options) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return 'audio/webm';
}

function getElapsedSeconds() {
  if (!recordingStartTime) return 0;
  const currentPause = (isPaused && pausedAt) ? (Date.now() - pausedAt) : 0;
  return Math.max(0, Date.now() - recordingStartTime - pausedDuration - currentPause) / 1000;
}

async function saveRecording(blob, duration) {
  let outputBlob = blob;
  let mimeType = blob.type || recordingMimeType || 'audio/webm';

  const settings = await getExportSettings();
  if (settings.exportFormat === 'mp3' && !String(mimeType || '').includes('mpeg')) {
    // If the build can't record MP3 natively, fall back to WebM and inform the UI.
    chrome.runtime.sendMessage({
      action: 'recordingNotice',
      level: 'warning',
      message: 'MP3 export is not supported in this browser build. Saved as WebM instead.'
    }).catch(() => {});
  }
  if (settings.exportFormat === 'wav') {
    try {
      outputBlob = await convertToWav(blob);
      mimeType = 'audio/wav';
    } catch (_) {
      // Fall back to webm if WAV conversion fails
    }
  }

  // Guard against huge payloads that can freeze/crash base64 encoding.
  const maxGB = Math.max(1, Number(settings.maxStorageGB) || 1);
  const maxBytes = maxGB * 1024 * 1024 * 1024;
  const hardCap = 120 * 1024 * 1024; // 120MB per recording, safety cap
  const size = Number(outputBlob?.size) || 0;
  if (size <= 0) throw new Error('Recording data is empty');
  if (size > Math.min(maxBytes, hardCap)) throw new Error('Recording too large to process safely');

  const base64 = await blobToBase64(outputBlob);
  chrome.runtime.sendMessage({
    action: 'recordingComplete',
    data: base64,
    mimeType,
    duration,
    mode: recordingMode
  }).catch(() => {});
}

async function getExportSettings() {
  try {
    const data = await chrome.storage.local.get('settings');
    return data.settings || { exportFormat: 'webm', maxStorageGB: 1 };
  } catch (_) {
    return { exportFormat: 'webm', maxStorageGB: 1 };
  }
}

async function convertToWav(blob) {
  const AC = window.AudioContext || window.webkitAudioContext;
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
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const samplesPerChannel = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = samplesPerChannel * blockAlign;
  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);
  const writeStr = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels = [];
  for (let ch = 0; ch < numChannels; ch++) channels.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < samplesPerChannel; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const s = Math.max(-1, Math.min(1, channels[ch][i] || 0));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
  }
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || '');
      const encoded = value.split(',')[1] || '';
      if (!encoded) { reject(new Error('Failed to encode recording')); return; }
      resolve(encoded);
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

function cleanup() {
  if (levelInterval) { clearInterval(levelInterval); levelInterval = null; }

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try { mediaRecorder.stop(); } catch (_) {}
  }

  if (currentStream) {
    currentStream.getTracks().forEach(t => t.stop());
    // Clean up mixed streams
    if (currentStream._originalStreams) {
      currentStream._originalStreams.forEach(s => s.getTracks().forEach(t => t.stop()));
    }
  }

  if (sourceNode) { try { sourceNode.disconnect(); } catch (_) {} }
  if (analyserNode) { try { analyserNode.disconnect(); } catch (_) {} }
  if (audioContext) { audioContext.close().catch(() => {}); }

  mediaRecorder = null;
  audioChunks = [];
  currentStream = null;
  audioContext = null;
  sourceNode = null;
  analyserNode = null;
  recordingMimeType = null;
  stopPromise = null;
  stopResolver = null;
  isPaused = false;
  pausedDuration = 0;
  pausedAt = null;
  recordingStartTime = null;
  recordingMode = 'tab';
  mixMicGainNode = null;
  mixTabGainNode = null;
}
