// background.js — Service Worker (Manifest V3)
// ARCHITECTURE:
//   • Mic permission MUST be requested from sidebar (user-visible context).
//   • Never call getUserMedia from here — Chrome silently blocks it.
//   • background.js owns state + routing; offscreen.js owns recording logic.
importScripts('utils/blobStore.js');
importScripts('utils/formatters.js'); // single Formatters definition — no duplication

let recordingState = {
  recording: false,
  paused: false,
  tabId: null,
  startedAt: null,
  mimeType: null,
  level: 0,
  mode: 'tab'
};

let hasHydratedState = false;

/* ── Open sidebar on icon click ─────────────────────────────────────────── */
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (e) {
    console.warn('Side panel open error:', e.message);
  }
});

/* ── Lifecycle ─────────────────────────────────────────────────────────── */
chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.sidePanel.setOptions({ enabled: true });
  } catch (_) {}

  try {
    const data = await chrome.storage.local.get(['recordings', 'settings', 'micPermission']);
    if (!Array.isArray(data.recordings)) {
      await chrome.storage.local.set({ recordings: [] });
    }
    if (!data.settings) {
      await chrome.storage.local.set({
        settings: {
          maxDuration: 0,
          exportFormat: 'webm',
          theme: 'light',
          micDeviceId: '',
          saveToHistory: true,
          maxStorageGB: 1
        }
      });
    }
    if (data.micPermission === undefined) {
      await chrome.storage.local.set({ micPermission: false });
    }
  } catch (_) {}
});

chrome.runtime.onStartup.addListener(() => {
  hydrateState().catch(() => {});
});

/* ── Message Router ────────────────────────────────────────────────────── */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Only accept messages from our own extension
  if (!sender || sender.id !== chrome.runtime.id) {
    sendResponse({ success: false, error: 'Untrusted sender' });
    return false;
  }
  if (!request || typeof request !== 'object') {
    sendResponse({ success: false, error: 'Invalid request' });
    return false;
  }

  const route = async () => {
    const action = String(request.action || '');
    switch (action) {
      case 'status':            return getStatus();
      case 'start':             return startRecording(request.tabId, request.mode);
      case 'stop':              return stopRecording();
      case 'pause':             return pauseRecording();
      case 'resume':            return resumeRecording();
      case 'getHistory':        return getHistory();
      case 'clearHistory':      return clearHistory();
      case 'deleteRecording':   return deleteRecording(request.id);
      case 'showRecording':     return showRecording(request.id);
      case 'getSettings':       return getSettings();
      case 'updateSettings':    return updateSettings(request.settings);
      case 'getStagedRecording':            return getStagedRecording();
      case 'downloadStagedRecording':       return downloadStagedRecording(request.id, request.filename);
      case 'discardStagedRecording':        return discardStagedRecording(request.id);
      case 'replaceStagedRecordingData': {
        if (!request.id || !request.data) return { success: false, error: 'Missing staged recording data' };
        return replaceStagedRecordingData(request.id, request.data, request.mimeType, request.duration);
      }
      case 'listAudioDevices':  return listAudioDevices();
      case 'setMixLevels':      return setMixLevels(request.mic, request.tab);
      case 'getMicPermission':  return getMicPermission();
      case 'setMicPermission':  return setMicPermission(request.granted);
      // NOTE: probeMicPermission intentionally omitted.
      // Mic permission MUST be requested from sidebar.js (user gesture + visible context).
      case 'getRecordingData':  return getRecordingData(request.id);
      case 'replaceRecordingData': {
        if (!request.id || !request.data) return { success: false, error: 'Missing recording data' };
        return replaceRecordingData(request.id, request.data, request.mimeType, request.duration);
      }
      case 'getStorageStats':   return getStorageStats();
      case 'recordingComplete': return stageRecording(request.data, request.mimeType, request.duration, request.mode);
      case 'recordingLevel':    return handleLevelUpdate(request.level);
      case 'recordingWavePeak': return handleWavePeakUpdate(request.peak);
      case 'recordingNotice':   return handleRecordingNotice(request.level, request.message);
      case 'recordingError':    return handleRecordingError(request.error);
      default: return { success: false, error: 'Unknown action: ' + action };
    }
  };

  route().then(sendResponse).catch(e => sendResponse({ success: false, error: e.message }));
  return true; // keep message channel open for async response
});

/* ── State helpers ─────────────────────────────────────────────────────── */
async function hydrateState() {
  if (hasHydratedState) return;
  const data = await chrome.storage.local.get('recordingState');
  if (data.recordingState) {
    recordingState = { ...recordingState, ...data.recordingState };
  }
  hasHydratedState = true;
}

async function persistState() {
  await chrome.storage.local.set({ recordingState });
}

async function getStatus() {
  await hydrateState();
  return { ...recordingState };
}

/* ── Mic Permission ─────────────────────────────────────────────────────── */
async function getMicPermission() {
  const data = await chrome.storage.local.get('micPermission');
  return { granted: data.micPermission === true };
}

async function setMicPermission(granted) {
  await chrome.storage.local.set({ micPermission: granted === true });
  return { success: true };
}

/* ── Recording control ─────────────────────────────────────────────────── */
async function startRecording(tabId, mode) {
  await hydrateState();

  if (recordingState.recording) {
    return { success: false, error: 'Recording already in progress' };
  }

  try {
    await createOffscreenDocument();
    let streamId = null;

    // Tab capture stream must be obtained in the background SW (only place with tabCapture API)
    if (mode === 'tab' || mode === 'tab+mic') {
      if (!tabId) return { success: false, error: 'Missing tab ID' };
      if (!chrome.tabCapture || typeof chrome.tabCapture.getMediaStreamId !== 'function') {
        throw new Error('Tab capture API unavailable. Reload the extension.');
      }
      streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
      if (!streamId) throw new Error('Unable to capture tab audio stream');
    }

    const response = await sendToOffscreen({ action: 'startRecording', tabId, mode, streamId });
    if (!response?.success) throw new Error(response?.error || 'Offscreen start failed');

    // Update mic permission flag after a successful mic or tab+mic start
    if (mode === 'mic' || mode === 'tab+mic') {
      await chrome.storage.local.set({ micPermission: true });
    }

    recordingState = {
      recording: true,
      paused: false,
      tabId: (mode !== 'mic') ? tabId : null,
      startedAt: Date.now(),
      mimeType: response.mimeType || null,
      level: 0,
      mode
    };

    await persistState();
    await chrome.action.setBadgeText({ text: 'REC' });
    await chrome.action.setBadgeBackgroundColor({ color: '#DC2626' });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function stopRecording() {
  await hydrateState();
  if (!recordingState.recording) return { success: false, error: 'No active recording' };

  try {
    const response = await sendToOffscreen({ action: 'stopRecording' });
    if (!response?.success) throw new Error(response?.error || 'Offscreen stop failed');

    recordingState = {
      recording: false, paused: false, tabId: null,
      startedAt: null, mimeType: null, level: 0, mode: 'tab'
    };
    await persistState();
    await chrome.action.setBadgeText({ text: '' });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function pauseRecording() {
  if (!recordingState.recording || recordingState.paused) {
    return { success: false, error: 'Cannot pause' };
  }
  try {
    const response = await sendToOffscreen({ action: 'pauseRecording' });
    if (response?.success) {
      recordingState.paused = true;
      await persistState();
      broadcast({ action: 'recordingPaused' });
      return { success: true };
    }
    return { success: false, error: response?.error };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function resumeRecording() {
  if (!recordingState.recording || !recordingState.paused) {
    return { success: false, error: 'Cannot resume' };
  }
  try {
    const response = await sendToOffscreen({ action: 'resumeRecording' });
    if (response?.success) {
      recordingState.paused = false;
      await persistState();
      broadcast({ action: 'recordingResumed' });
      return { success: true };
    }
    return { success: false, error: response?.error };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/* ── Level updates ─────────────────────────────────────────────────────── */
function handleLevelUpdate(level) {
  const val = Number(level);
  recordingState.level = Number.isFinite(val) ? Math.max(0, Math.min(1, val)) : 0;
  broadcast({ action: 'recordingLevel', level: recordingState.level });
  return { success: true };
}

function handleWavePeakUpdate(peak) {
  const val = Number(peak);
  const p = Number.isFinite(val) ? Math.max(0, Math.min(1, val)) : 0;
  broadcast({ action: 'recordingWavePeak', peak: p });
  return { success: true };
}

function handleRecordingNotice(level, message) {
  broadcast({ action: 'recordingNotice', level: level || 'info', message: String(message || '') });
  return { success: true };
}

/* ── Size utilities ─────────────────────────────────────────────────────── */
const MAX_SINGLE_RECORDING_BYTES = 120 * 1024 * 1024; // must match BlobStore safety cap

function estimateBase64Bytes(base64) {
  const s = String(base64 || '').replace(/[\r\n\s]/g, '');
  const len = s.length;
  if (!len) return 0;
  let padding = 0;
  if (s.endsWith('==')) padding = 2;
  else if (s.endsWith('=')) padding = 1;
  return Math.max(0, Math.floor((len * 3) / 4) - padding);
}

function maxBytesFromSettings(settings) {
  const maxGB = Math.max(1, Number(settings?.maxStorageGB) || 1);
  return maxGB * 1024 * 1024 * 1024;
}

/* ── Save / Stage recording ─────────────────────────────────────────────── */
async function stageRecording(base64Data, mimeType, duration, modeOverride) {
  if (!base64Data) return { success: false, error: 'Missing data' };

  // Discard any previous staged recording to avoid unbounded storage usage
  const prev = await getStagedRecording();
  if (prev?.id) {
    await BlobStore.remove(prev.id).catch(() => {});
    await chrome.storage.local.remove('stagedRecording').catch(() => {});
  }

  const settings = await getSettings();
  const recordingMode = modeOverride || recordingState.mode || 'tab';
  const safeMime = mimeType || 'audio/webm';
  const ext = safeMime.includes('wav') ? 'wav' : safeMime.includes('mpeg') ? 'mp3' : 'webm';

  const estimatedBytes = estimateBase64Bytes(base64Data);
  const maxBytes = maxBytesFromSettings(settings);
  if (!estimatedBytes) return { success: false, error: 'Empty recording data' };
  if (estimatedBytes > MAX_SINGLE_RECORDING_BYTES) return { success: false, error: 'Recording too large' };
  if (estimatedBytes > maxBytes) return { success: false, error: 'Recording exceeds max storage limit' };

  const recordingId = (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
  const filename = await generateFilename(recordingMode, ext);
  const put = await BlobStore.putBase64(recordingId, base64Data, safeMime);
  const sizeBytes = put?.size || Math.floor((base64Data.replace(/=+$/, '').length * 3) / 4);

  const staged = {
    id: String(recordingId),
    filename,
    sizeBytes,
    mimeType: safeMime,
    duration: Number(duration) || 0,
    mode: recordingMode,
    createdAt: Date.now(),
    exportFormat: settings.exportFormat || ext
  };

  await chrome.storage.local.set({ stagedRecording: staged });
  broadcast({ action: 'recordingReady', staged });
  return { success: true, staged };
}

async function getStagedRecording() {
  const data = await chrome.storage.local.get('stagedRecording');
  return data.stagedRecording || null;
}

async function discardStagedRecording(id) {
  const staged = await getStagedRecording();
  if (!staged?.id) return { success: true };
  if (id && String(id) !== String(staged.id)) return { success: false, error: 'Staged recording mismatch' };
  await BlobStore.remove(staged.id).catch(() => {});
  await chrome.storage.local.remove('stagedRecording').catch(() => {});
  broadcast({ action: 'recordingDiscarded', id: staged.id });
  return { success: true };
}

/**
 * FIX: sanitizeFilename had double-escaped backslashes in its regex literals.
 * `\\\\` in a JS string literal = literal `\\`, then the regex engine sees `\\` = one backslash.
 * `\\s+` in a string-constructed regex means whitespace, but here it was a regex literal so
 * `\\s` = a literal backslash followed by 's', NOT whitespace. Fixed both.
 */
function sanitizeFilename(name) {
  const s = String(name || '').trim();
  if (!s) return '';
  return s
    .replace(/[\\/:*?"<>|]+/g, '_')   // FIX: was /[\\\\/:*?\"<>|]+/g (over-escaped)
    .replace(/\s+/g, ' ')              // FIX: was /\\s+/g (broken — matched literal \s)
    .trim()
    .substring(0, 120);
}

async function downloadStagedRecording(id, filenameOverride) {
  const staged = await getStagedRecording();
  if (!staged?.id) return { success: false, error: 'No staged recording' };
  if (id && String(id) !== String(staged.id)) return { success: false, error: 'Staged recording mismatch' };

  const settings = await getSettings();
  const row = await BlobStore.getBase64(staged.id);
  if (!row?.data) return { success: false, error: 'Staged audio data missing' };

  const dataUrl = `data:${staged.mimeType};base64,${row.data}`;
  const safeName = sanitizeFilename(filenameOverride) || staged.filename;
  const dl = await downloadFile({ url: dataUrl, filename: safeName, saveAs: false, conflictAction: 'uniquify' });
  if (!dl?.success) return { success: false, error: dl?.error || 'Download failed' };

  if (settings.saveToHistory !== false) {
    const format = staged.exportFormat || (staged.mimeType.includes('wav') ? 'wav' : staged.mimeType.includes('mpeg') ? 'mp3' : 'webm');
    await saveToHistory(
      staged.id,
      safeName,
      staged.sizeBytes || row.size || 0,
      staged.mimeType,
      staged.duration || 0,
      staged.mode || 'tab',
      format,
      dl.downloadId
    );
  } else {
    await BlobStore.remove(staged.id).catch(() => {});
  }

  await chrome.storage.local.remove('stagedRecording').catch(() => {});
  broadcast({ action: 'recordingDownloaded', filename: safeName, duration: staged.duration, id: staged.id });
  return { success: true, filename: safeName, downloadId: dl.downloadId };
}

async function replaceStagedRecordingData(id, base64Data, mimeType, duration) {
  const staged = await getStagedRecording();
  if (!staged?.id) return { success: false, error: 'No staged recording' };
  if (id && String(id) !== String(staged.id)) return { success: false, error: 'Staged recording mismatch' };
  if (!base64Data) return { success: false, error: 'Missing recording data' };

  const settings = await getSettings();
  const estimatedBytes = estimateBase64Bytes(base64Data);
  const maxBytes = maxBytesFromSettings(settings);
  if (!estimatedBytes) return { success: false, error: 'Empty recording data' };
  if (estimatedBytes > MAX_SINGLE_RECORDING_BYTES) return { success: false, error: 'Recording too large' };
  if (estimatedBytes > maxBytes) return { success: false, error: 'Recording exceeds max storage limit' };

  const safeMime = mimeType || staged.mimeType || 'audio/wav';
  const put = await BlobStore.putBase64(staged.id, base64Data, safeMime);
  const ext = safeMime.includes('wav') ? 'wav' : safeMime.includes('mpeg') ? 'mp3' : 'webm';
  const base = String(staged.filename || 'recording').replace(/\.[a-z0-9]+$/i, '');
  const next = {
    ...staged,
    mimeType: safeMime,
    exportFormat: ext,
    duration: Number(duration) || staged.duration || 0,
    sizeBytes: put.size || staged.sizeBytes || 0,
    filename: base + '.' + ext,
    updatedAt: Date.now()
  };
  await chrome.storage.local.set({ stagedRecording: next });
  broadcast({ action: 'stagedUpdated', staged: next });
  return { success: true, staged: next };
}

/* ── Mix levels ─────────────────────────────────────────────────────────── */
async function setMixLevels(mic, tab) {
  try {
    await createOffscreenDocument();
    const m = Number(mic);
    const t = Number(tab);
    const res = await sendToOffscreen({
      action: 'setMixLevels',
      mic: Number.isFinite(m) ? Math.max(0, Math.min(1, m)) : 1,
      tab: Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 1
    });
    return res || { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/* ── Download helper ────────────────────────────────────────────────────── */
function downloadFile(options) {
  return new Promise(resolve => {
    chrome.downloads.download(options, downloadId => {
      if (chrome.runtime.lastError || !downloadId) {
        resolve({ success: false, error: chrome.runtime.lastError?.message || 'Download failed', downloadId: null });
      } else {
        resolve({ success: true, downloadId });
      }
    });
  });
}

/* ── History ────────────────────────────────────────────────────────────── */
async function saveToHistory(id, filename, size, mimeType, duration, mode, format, downloadId) {
  const data = await chrome.storage.local.get('recordings');
  const recordings = Array.isArray(data.recordings) ? data.recordings : [];
  recordings.unshift({
    id: String(id),
    filename,
    size: size || 0,
    mimeType,
    duration: duration || 0,
    mode: mode || 'tab',
    format: format || 'webm',
    downloadId: Number.isInteger(downloadId) ? downloadId : null,
    timestamp: new Date().toISOString()
  });
  if (recordings.length > 100) recordings.length = 100;
  await chrome.storage.local.set({ recordings });
}

async function getHistory() {
  const data = await chrome.storage.local.get('recordings');
  return Array.isArray(data.recordings) ? data.recordings : [];
}

async function deleteRecording(id) {
  if (!id) return { success: false, error: 'Missing id' };
  const recs = await getHistory();
  await chrome.storage.local.set({ recordings: recs.filter(r => r.id !== id) });
  await BlobStore.remove(id);
  return { success: true };
}

async function showRecording(id) {
  const recs = await getHistory();
  const rec = recs.find(r => r.id === id);
  if (!rec) return { success: false, error: 'Recording not found' };
  if (Number.isInteger(rec.downloadId)) {
    chrome.downloads.show(rec.downloadId);
    return { success: true };
  }
  return { success: false, error: 'File not found' };
}

async function clearHistory() {
  await chrome.storage.local.set({ recordings: [] });
  await BlobStore.clear();
  return { success: true };
}

/* ── Settings ────────────────────────────────────────────────────────────── */
async function getSettings() {
  const data = await chrome.storage.local.get('settings');
  return data.settings || {
    maxDuration: 0,
    exportFormat: 'webm',
    theme: 'light',
    micDeviceId: '',
    saveToHistory: true,
    maxStorageGB: 1
  };
}

async function updateSettings(settings) {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await chrome.storage.local.set({ settings: updated });
  return { success: true, settings: updated };
}

/* ── Device listing ─────────────────────────────────────────────────────── */
async function listAudioDevices() {
  try {
    await createOffscreenDocument();
    const res = await sendToOffscreen({ action: 'listAudioDevices' });
    if (!res?.success) return { success: false, devices: [], error: res?.error || 'Device list failed' };
    return { success: true, devices: Array.isArray(res.devices) ? res.devices : [] };
  } catch (e) {
    return { success: false, devices: [], error: e.message };
  }
}

/* ── Recording data ─────────────────────────────────────────────────────── */
async function getRecordingData(id) {
  if (!id) return { success: false, error: 'Missing id' };
  let row = null;
  try {
    row = await BlobStore.getBase64(id);
  } catch (e) {
    return { success: false, error: e?.message || 'Failed to load recording data' };
  }
  if (!row) return { success: false, error: 'Recording data not found' };
  return { success: true, id: row.id, data: row.data, mimeType: row.mimeType, size: row.size };
}

async function replaceRecordingData(id, base64Data, mimeType, duration) {
  if (!id || !base64Data) return { success: false, error: 'Missing recording data' };
  const settings = await getSettings();
  const estimatedBytes = estimateBase64Bytes(base64Data);
  const maxBytes = maxBytesFromSettings(settings);
  if (!estimatedBytes) return { success: false, error: 'Empty recording data' };
  if (estimatedBytes > MAX_SINGLE_RECORDING_BYTES) return { success: false, error: 'Recording too large' };
  if (estimatedBytes > maxBytes) return { success: false, error: 'Recording exceeds max storage limit' };
  const safeMime = mimeType || 'audio/wav';
  const put = await BlobStore.putBase64(id, base64Data, safeMime);
  const recs = await getHistory();
  const idx = recs.findIndex(r => r.id === id);
  if (idx >= 0) {
    const ext = safeMime.includes('wav') ? 'wav' : 'webm';
    recs[idx] = {
      ...recs[idx],
      mimeType: safeMime,
      format: ext,
      size: put.size || recs[idx].size || 0,
      duration: Number(duration) || recs[idx].duration || 0,
      timestamp: new Date().toISOString()
    };
    await chrome.storage.local.set({ recordings: recs });
  }
  return { success: true };
}

async function getStorageStats() {
  const stats = await BlobStore.usage();
  const settings = await getSettings();
  const maxGB = Math.max(1, Number(settings.maxStorageGB) || 1);
  const maxBytes = maxGB * 1024 * 1024 * 1024;
  return { success: true, count: stats.count, usedBytes: stats.totalBytes, maxBytes };
}

/* ── Utilities ─────────────────────────────────────────────────────────── */
async function generateFilename(mode, extension) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const title = tabs[0]?.title || 'recording';
    return Formatters.generateFilename(title, mode, extension);
  } catch {
    return Formatters.generateFilename('recording', mode, extension);
  }
}

async function handleRecordingError(errorMessage) {
  recordingState = {
    recording: false, paused: false, tabId: null,
    startedAt: null, mimeType: null, level: 0, mode: 'tab'
  };
  await persistState();
  await chrome.action.setBadgeText({ text: '' });
  broadcast({ action: 'recordingError', error: errorMessage });
  return { success: true };
}

/* ── Offscreen document management ─────────────────────────────────────── */
async function createOffscreenDocument() {
  try {
    if (typeof chrome.runtime.getContexts === 'function') {
      const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
      if (contexts.length > 0) return;
    }
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: [chrome.offscreen.Reason.USER_MEDIA],
      justification: 'Capture audio from tab or microphone'
    });
  } catch (error) {
    const message = String(error?.message || '');
    if (!message.includes('Only a single offscreen document')) throw error;
  }
}

function sendToOffscreen(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

function broadcast(message) {
  chrome.runtime.sendMessage(message).catch(() => {});
}
