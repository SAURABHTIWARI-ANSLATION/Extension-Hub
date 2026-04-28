// recorder.js — SnapCam Pro Screen Recorder Window

let liveStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let timerInterval = null;
let elapsedSeconds = 0;
let captures = [];

const liveVideo   = document.getElementById('liveVideo');
const placeholder = document.getElementById('placeholder');
const placeholderText = document.getElementById('placeholderText');
const recBadge    = document.getElementById('recBadge');
const recTimer    = document.getElementById('recTimer');
const statusBar   = document.getElementById('statusBar');
const controls    = document.getElementById('controls');
const gallery     = document.getElementById('gallery');
const fileCount   = document.getElementById('fileCount');

// Build controls
const btnStart = document.createElement('button');
btnStart.className = 'btn btn-purple';
btnStart.textContent = 'Start Recording';
btnStart.addEventListener('click', startRecording);

const btnStop = document.createElement('button');
btnStop.className = 'btn btn-stop';
btnStop.textContent = 'Stop Recording';
btnStop.disabled = true;
btnStop.addEventListener('click', stopRecording);

controls.appendChild(btnStart);
controls.appendChild(btnStop);

function showStatus(msg, type) {
  statusBar.textContent = msg;
  statusBar.className = 'status-bar show ' + type;
}

function hideStatus() { statusBar.className = 'status-bar'; }

function showPreview() {
  placeholder.style.display = 'none';
  liveVideo.style.display = 'block';
}

function resetPreview() {
  liveVideo.style.display = 'none';
  liveVideo.srcObject = null;
  placeholder.style.display = 'flex';
}

function startTimer() {
  elapsedSeconds = 0;
  recTimer.textContent = '00:00';
  recTimer.style.display = 'block';
  recBadge.style.display = 'block';
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    recTimer.textContent =
      String(Math.floor(elapsedSeconds/60)).padStart(2,'0') + ':' +
      String(elapsedSeconds%60).padStart(2,'0');
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval); timerInterval = null;
  recTimer.style.display = 'none';
  recBadge.style.display = 'none';
}

function formatTime(sec) {
  return String(Math.floor(sec/60)).padStart(2,'0') + ':' + String(sec%60).padStart(2,'0');
}

function getBestMime() {
  for (const t of ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4'])
    if (MediaRecorder.isTypeSupported(t)) return t;
  return '';
}

let _pickerOpen = false;

async function startRecording() {
  // Re-entry guard: prevent multiple share pickers opening simultaneously
  if (_pickerOpen) return;
  _pickerOpen = true;

  try {
    showStatus('Choose what to share...', 'info');
    btnStart.disabled = true;

    const audioOpt = document.getElementById('screenAudio').value;

    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: audioOpt === 'system'
    });

    // Picker resolved — clear the guard
    _pickerOpen = false;

    liveStream = displayStream;

    // Add mic if requested
    if (audioOpt === 'mic') {
      try {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        mic.getAudioTracks().forEach(t => liveStream.addTrack(t));
      } catch(e) { /* mic optional */ }
    }

    liveVideo.srcObject = liveStream;
    // Ensure screen preview is never flipped
    liveVideo.classList.remove('video-mirror');
    liveVideo.classList.add('video-normal');
    showPreview();

    recordedChunks = [];
    const mime = getBestMime();
    mediaRecorder = new MediaRecorder(liveStream, mime ? { mimeType: mime } : {});

    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'video/webm' });
      const url  = URL.createObjectURL(blob);
      addToGallery(url, 'screen_' + Date.now() + '.webm');
      showStatus('Recording saved! Duration: ' + formatTime(elapsedSeconds), 'ok');
      resetPreview();
      btnStart.disabled = false;
      btnStop.disabled  = true;
      liveStream = null;
    };

    // User stops via Chrome share bar — fire only once
    const vTrack = displayStream.getVideoTracks()[0];
    if (vTrack) vTrack.addEventListener('ended', stopRecording, { once: true });

    mediaRecorder.start(500);
    startTimer();
    btnStart.disabled = true;
    btnStop.disabled  = false;
    showStatus('Recording in progress — press Stop when done.', 'rec');

  } catch(e) {
    _pickerOpen = false;
    if (e.name === 'NotAllowedError') {
      showStatus('Screen share cancelled.', 'info');
    } else {
      showStatus('Error: ' + e.message, 'err');
    }
    btnStart.disabled = false;
  }
}

function stopRecording() {
  _pickerOpen = false;
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  if (liveStream) { liveStream.getTracks().forEach(t => t.stop()); liveStream = null; }
  stopTimer();
  btnStart.disabled = false;
  btnStop.disabled  = true;
}

function addToGallery(url, filename) {
  const empty = gallery.querySelector('.gallery-empty');
  if (empty) empty.remove();

  const item = document.createElement('div');
  item.className = 'gallery-item';

  const vid = document.createElement('video');
  vid.src = url; vid.muted = true; vid.loop = true;
  item.addEventListener('mouseenter', () => vid.play().catch(()=>{}));
  item.addEventListener('mouseleave', () => { vid.pause(); vid.currentTime = 0; });

  const overlay = document.createElement('div');
  overlay.className = 'dl-overlay';
  overlay.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M12 3v11"/><path d="m7 10 5 5 5-5"/><path d="M4 20h16"/></svg>';

  const badge = document.createElement('div');
  badge.className = 'item-badge screen'; badge.textContent = 'SCREEN';

  item.appendChild(vid); item.appendChild(overlay); item.appendChild(badge);

  item.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  });

  gallery.prepend(item);
  captures.push({ url, filename });
  fileCount.textContent = captures.length;
}

window.addEventListener('beforeunload', () => {
  if (liveStream) liveStream.getTracks().forEach(t => t.stop());
});