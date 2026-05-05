/**
 * Video to Audio Converter — popup.js
 * White/Blue theme · Manrope font · In-popup audio preview + download
 * 100% local — ffmpeg.wasm, no server, no API.
 *
 * FIX: Changed '-c:a', 'mp3'  →  '-c:a', 'libmp3lame'
 *      ffmpeg.wasm ships libmp3lame, not a codec named "mp3".
 *      Using the wrong name causes FFmpeg to exit without writing
 *      output.mp3, which then makes FS.readFile throw the error you saw.
 *
 *      Also added a post-run FS existence check so future codec/input
 *      failures surface a clear message instead of a cryptic readFile error.
 */

'use strict';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const dropzone   = document.getElementById('dropzone');
const fileInput  = document.getElementById('file-input');
const fnameBadge = document.getElementById('fname-badge');
const convertBtn = document.getElementById('convert-btn');
const btnText    = document.getElementById('btn-text');
const outputName = document.getElementById('output-name');
const qualitySel = document.getElementById('quality');
const logEl      = document.getElementById('log');

// Progress
const progWrap = document.getElementById('prog-wrap');
const progFill = document.getElementById('prog-fill');
const progLbl  = document.getElementById('prog-lbl');
const progPct  = document.getElementById('prog-pct');

// Player
const playerSection = document.getElementById('player-section');
const audioEl       = document.getElementById('audio-el');
const playBtn       = document.getElementById('play-btn');
const playIcon      = document.getElementById('play-icon');
const seekBar       = document.getElementById('seek-bar');
const volBar        = document.getElementById('vol-bar');
const volIco        = document.getElementById('vol-ico');
const tCur          = document.getElementById('t-cur');
const tTot          = document.getElementById('t-tot');
const plName        = document.getElementById('pl-name');
const plMeta        = document.getElementById('pl-meta');
const dlBtn         = document.getElementById('dl-btn');

// ── State ─────────────────────────────────────────────────────────────────────
let selectedFile   = null;
let ffmpegReady    = false;
let ffmpegLoading  = false;
let ffmpeg         = null;
let currentBlobURL  = null;   // current audio blob URL for download
let currentFileName = 'output.mp3';
let ffmpegLogBuffer = [];

// ── SVG paths ─────────────────────────────────────────────────────────────────
const SVG_PLAY_D  = 'M8 5v14l11-7z';
const SVG_PAUSE_D = 'M6 19h4V5H6v14zm8-14v14h4V5h-4z';
const SVG_VOL_D   = 'M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07';
const SVG_MUTE_D  = 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 4v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z';

// ── Logging ───────────────────────────────────────────────────────────────────
function ts() {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':');
}

function log(msg, type = 'info') {
  const row = document.createElement('div');
  row.className = `log-line ${type}`;

  const stamp = document.createElement('span');
  stamp.className = 'log-ts';
  stamp.textContent = ts();

  const text = document.createElement('span');
  text.className = 'log-msg';
  text.textContent = String(msg);

  row.appendChild(stamp);
  row.appendChild(text);
  logEl.appendChild(row);
  logEl.scrollTop = logEl.scrollHeight;
}

function clearLog() { logEl.textContent = ''; }

function setSvgPath(svg, d) {
  svg.textContent = '';
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  svg.appendChild(path);
}

function pushFFmpegLog(message) {
  if (!message) return;
  ffmpegLogBuffer.push(String(message));
  if (ffmpegLogBuffer.length > 25) {
    ffmpegLogBuffer = ffmpegLogBuffer.slice(-25);
  }
}

function getLastFFmpegError() {
  const recent = [...ffmpegLogBuffer].reverse();
  return recent.find((line) => {
    const normalized = line.toLowerCase();
    return normalized.includes('error')
      || normalized.includes('invalid')
      || normalized.includes('failed')
      || normalized.includes('unknown encoder')
      || normalized.includes('could not');
  }) || recent[0] || '';
}

// ── Progress ──────────────────────────────────────────────────────────────────
function showProgress(indeterminate = true, label = 'Processing…') {
  progWrap.classList.add('visible');
  progLbl.textContent = label;
  if (indeterminate) {
    progFill.classList.add('indeterminate');
    progFill.style.width = '';
    progPct.textContent = '';
  } else {
    progFill.classList.remove('indeterminate');
  }
}

function setProgress(ratio) {
  progFill.classList.remove('indeterminate');
  const pct = Math.min(Math.round(ratio * 100), 100);
  progFill.style.width = pct + '%';
  progPct.textContent  = pct + '%';
  progLbl.textContent  = pct < 100 ? 'Converting…' : 'Finalizing…';
}

function hideProgress() {
  progWrap.classList.remove('visible');
  progFill.classList.remove('indeterminate');
  progFill.style.width = '0%';
  progPct.textContent  = '';
}

// ── Button state ──────────────────────────────────────────────────────────────
function setBusy(busy, label = 'Convert to MP3') {
  convertBtn.disabled = busy || !selectedFile;
  btnText.textContent = label;

  // spinner ↔ icon swap
  const sp  = convertBtn.querySelector('.spinner');
  const ico = convertBtn.querySelector('.btn-svg');

  if (busy) {
    if (!sp) {
      if (ico) ico.remove();
      const s = document.createElement('div');
      s.className = 'spinner';
      convertBtn.insertBefore(s, btnText);
    }
  } else {
    if (sp) sp.remove();
    if (!convertBtn.querySelector('.btn-svg')) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.classList.add('btn-svg');
      setSvgPath(svg, 'M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3S3 19.657 3 18s1.343-3 3-3 3 1.343 3 3zm12-2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z');
      convertBtn.insertBefore(svg, btnText);
    }
  }
}

// ── File selection ────────────────────────────────────────────────────────────
function setFile(file) {
  if (!file) return;

  // Extended type/ext list — covers WhatsApp formats:
  //   .mp4  (regular & video notes)   .opus (voice notes)
  //   .3gp  (older WhatsApp videos)   .m4a  (audio messages)
  //   .webm .mov (other sources)
  const allowedTypes = [
    'video/mp4', 'video/webm', 'video/quicktime',
    'video/3gpp', 'video/3gpp2',
    'audio/opus', 'audio/ogg', 'audio/mp4', 'audio/x-m4a',
    'application/octet-stream', // WhatsApp Android often sends this MIME
  ];
  const allowedExts = ['mp4', 'webm', 'mov', 'mkv', '3gp', '3gpp', 'opus', 'm4a', 'm4v', 'avi'];
  const ext = file.name.split('.').pop().toLowerCase();

  // WhatsApp on Android often reports file.type as '' — allow if ext is known
  if (file.type && !allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
    log(`Unsupported file type: ${file.type || ext}`, 'err');
    return;
  }
  if (!file.type && !allowedExts.includes(ext)) {
    log(`Unsupported file extension: .${ext}`, 'err');
    return;
  }

  selectedFile = file;
  fnameBadge.textContent = file.name;
  dropzone.classList.add('has-file');
  convertBtn.disabled = false;

  // hide player from any previous conversion
  playerSection.classList.remove('visible');
  if (currentBlobURL) { URL.revokeObjectURL(currentBlobURL); currentBlobURL = null; }
  audioEl.src = '';

  const mb = (file.size / 1024 / 1024).toFixed(1);
  log(`Selected: ${file.name} (${mb} MB)`, 'accent');

  if (!outputName.value) {
    outputName.placeholder = file.name.replace(/\.[^.]+$/, '');
  }
}

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) setFile(fileInput.files[0]);
});

dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  const f = e.dataTransfer?.files?.[0];
  if (f) setFile(f);
});

// ── Load ffmpeg.wasm ──────────────────────────────────────────────────────────
async function loadFFmpeg() {
  if (ffmpegReady) return;
  if (ffmpegLoading) {
    await new Promise(res => {
      const t = setInterval(() => { if (ffmpegReady) { clearInterval(t); res(); } }, 120);
    });
    return;
  }

  ffmpegLoading = true;
  log('Loading ffmpeg.wasm engine…', 'info');
  showProgress(true, 'Loading engine…');

  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('ffmpeg/ffmpeg.min.js');

    script.onload = async () => {
      try {
        const { createFFmpeg } = window.FFmpeg;

        ffmpeg = createFFmpeg({
          corePath: chrome.runtime.getURL('ffmpeg/ffmpeg-core.js'),
          log: false,
          progress: ({ ratio }) => { if (ratio > 0) setProgress(ratio); },
        });

        ffmpeg.setLogger(({ type, message }) => {
          pushFFmpegLog(message);

          if (type === 'fferr') {
            const normalized = String(message).toLowerCase();
            if (
              normalized.includes('error')
              || normalized.includes('invalid')
              || normalized.includes('failed')
              || normalized.includes('unknown encoder')
            ) {
              log(`FFmpeg: ${message}`, 'warn');
            }
          }
        });

        log('Initialising FFmpeg core…', 'info');
        await ffmpeg.load();

        ffmpegReady   = true;
        ffmpegLoading = false;
        hideProgress();
        log('Engine ready ✓', 'ok');
        resolve();
      } catch (err) {
        ffmpegLoading = false;
        hideProgress();
        log(`Engine init failed: ${err.message}`, 'err');
        reject(err);
      }
    };

    script.onerror = () => {
      ffmpegLoading = false;
      hideProgress();
      log('ffmpeg.min.js not found — check the /ffmpeg/ folder.', 'err');
      reject(new Error('Script load failed'));
    };

    document.head.appendChild(script);
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Check whether a file exists in the ffmpeg.wasm in-memory FS.
 * ffmpeg.wasm v0.11 exposes FS('readdir', path) which we can use
 * to verify the file was actually written before trying to read it.
 */
function fsFileExists(filename) {
  try {
    // FS('stat') throws if file doesn't exist — safer than readdir
    // which itself throws when WASM FS is not initialised
    ffmpeg.FS('stat', filename);
    return true;
  } catch (_) {
    return false;
  }
}

// ── Conversion ────────────────────────────────────────────────────────────────
convertBtn.addEventListener('click', async () => {
  if (!selectedFile) { log('No file selected.', 'warn'); return; }

  clearLog();
  playerSection.classList.remove('visible');

  try {
    setBusy(true, 'Loading engine…');
    await loadFFmpeg();
    ffmpegLogBuffer = [];

    // Quality args
    const qval = qualitySel.value;
    const audioArgs = qval.endsWith('k')
      ? ['-b:a', qval]         // CBR
      : ['-q:a', qval];        // VBR

    // Filenames
    const ext     = selectedFile.name.split('.').pop().toLowerCase();
    const inFile  = `input.${ext}`;
    const base    = outputName.value.trim() || selectedFile.name.replace(/\.[^.]+$/, '');
    currentFileName = `${base}.mp3`;

    log(`Converting → ${currentFileName}`, 'accent');
    setBusy(true, 'Processing…');
    showProgress(false, 'Converting…');
    setProgress(0);

    // Write input to FS
    const { fetchFile } = window.FFmpeg;
    log('Reading video into memory…', 'info');
    ffmpeg.FS('writeFile', inFile, await fetchFile(selectedFile));

    // ─────────────────────────────────────────────────────────────────────────
    // FIX: Use 'libmp3lame' (the actual encoder name in ffmpeg.wasm) instead
    //      of 'mp3'. Passing '-c:a mp3' causes FFmpeg to exit with a codec-not-
    //      found error and write no output file, making readFile throw below.
    // ─────────────────────────────────────────────────────────────────────────
    log('Running FFmpeg conversion…', 'info');

    // Detect if this is an audio-only file (WhatsApp voice notes: .opus, .m4a)
    const audioOnlyExts = ['opus', 'm4a', 'ogg', 'mp3', 'aac', 'wav', 'flac'];
    const isAudioOnly   = audioOnlyExts.includes(ext);

    // Build the ffmpeg command:
    // • Skip -vn for audio-only files (there is no video stream to strip)
    // • Use -movflags +faststart to handle WhatsApp fragmented mp4
    // • Use -avoid_negative_ts make_zero to fix WhatsApp timestamp issues
    const runArgs = [
      '-fflags', '+genpts',          // re-generate timestamps (fixes WhatsApp pts errors)
      '-i', inFile,
    ];
    if (!isAudioOnly) runArgs.push('-vn');   // strip video (not needed for audio files)
    runArgs.push(
      '-c:a', 'libmp3lame',
      ...audioArgs,
      '-ar', '44100',
      '-ac', '2',
      '-avoid_negative_ts', 'make_zero',  // fix WhatsApp negative timestamp issues
      'output.mp3'
    );

    await ffmpeg.run(...runArgs);

    // ─────────────────────────────────────────────────────────────────────────
    // FIX: Verify the output file exists before attempting readFile.
    //      ffmpeg.run() resolves even when FFmpeg exits non-zero, so without
    //      this check a bad codec/input silently leaves no output file.
    // ─────────────────────────────────────────────────────────────────────────
    if (!fsFileExists('output.mp3')) {
      const details = getLastFFmpegError();
      // Surface a helpful WhatsApp-specific hint when possible
      const hint = details.toLowerCase().includes('audio')
        ? details
        : details
          ? `${details} — If this is a WhatsApp video, it may be muted or use an unsupported codec`
          : 'No audio track found. WhatsApp muted videos or screen-recordings without audio cannot be converted.';
      throw new Error(hint);
    }

    // Read result
    let data;
    try {
      data = ffmpeg.FS('readFile', 'output.mp3');
    } catch (readErr) {
      const details = getLastFFmpegError();
      throw new Error(details || readErr.message || String(readErr));
    }
    const blob = new Blob([data.buffer], { type: 'audio/mpeg' });

    // Clean FS
    try { ffmpeg.FS('unlink', inFile); }       catch (_) {}
    try { ffmpeg.FS('unlink', 'output.mp3'); } catch (_) {}

    // Store blob URL for download
    if (currentBlobURL) URL.revokeObjectURL(currentBlobURL);
    currentBlobURL = URL.createObjectURL(blob);

    const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
    log(`Done! ${currentFileName} · ${sizeMB} MB ✓`, 'ok');

    setProgress(1);
    setBusy(false, 'Convert to MP3');
    setTimeout(hideProgress, 900);

    // Show player
    showPlayer(currentBlobURL, currentFileName, sizeMB);

  } catch (err) {
    log(`Error: ${err.message || err}`, 'err');
    setBusy(false, 'Convert to MP3');
    hideProgress();
    console.error('[V2A]', err);
  }
});

// ── Audio Player ──────────────────────────────────────────────────────────────
function fmtTime(sec) {
  if (!isFinite(sec) || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function showPlayer(blobURL, filename, sizeMB) {
  // Update metadata
  plName.textContent = filename;
  plMeta.textContent = `MP3 · 44.1 kHz · Stereo · ${sizeMB} MB`;

  // Load into audio element
  audioEl.src = blobURL;
  audioEl.volume = parseFloat(volBar.value);

  // Reset UI
  seekBar.value = 0;
  tCur.textContent = '0:00';
  tTot.textContent = '0:00';
  setPlayIcon(false);

  // Show section
  playerSection.classList.add('visible');
  log('Preview ready — press Play to listen.', 'info');
}

function setPlayIcon(playing) {
  setSvgPath(playIcon, playing ? SVG_PAUSE_D : SVG_PLAY_D);
}

// Play / Pause
playBtn.addEventListener('click', () => {
  if (!audioEl.src) return;
  if (audioEl.paused) {
    audioEl.play();
  } else {
    audioEl.pause();
  }
});

audioEl.addEventListener('play',  () => setPlayIcon(true));
audioEl.addEventListener('pause', () => setPlayIcon(false));
audioEl.addEventListener('ended', () => setPlayIcon(false));

// Duration loaded
audioEl.addEventListener('loadedmetadata', () => {
  tTot.textContent  = fmtTime(audioEl.duration);
  seekBar.max       = audioEl.duration || 100;
});

// Time update → seek bar
audioEl.addEventListener('timeupdate', () => {
  if (!isFinite(audioEl.duration)) return;
  tCur.textContent = fmtTime(audioEl.currentTime);
  seekBar.value    = audioEl.currentTime;

  // Update seek bar fill colour via background-size trick
  const pct = (audioEl.currentTime / audioEl.duration) * 100;
  seekBar.style.background =
    `linear-gradient(to right, #2563EB ${pct}%, #DBEAFE ${pct}%)`;
});

// Seek bar → audio
seekBar.addEventListener('input', () => {
  audioEl.currentTime = parseFloat(seekBar.value);
});

// Volume
volBar.addEventListener('input', () => {
  audioEl.volume = parseFloat(volBar.value);
  updateVolIcon();
});

function updateVolIcon() {
  setSvgPath(volIco, audioEl.volume === 0 ? SVG_MUTE_D : SVG_VOL_D);
}

// Mute toggle
volIco.addEventListener('click', () => {
  if (audioEl.volume > 0) {
    volBar._prev   = audioEl.volume;
    audioEl.volume = 0;
    volBar.value   = 0;
  } else {
    audioEl.volume = volBar._prev || 1;
    volBar.value   = audioEl.volume;
  }
  updateVolIcon();
});

// Download button inside player
dlBtn.addEventListener('click', () => {
  if (!currentBlobURL) return;
  const a = document.createElement('a');
  a.href     = currentBlobURL;
  a.download = currentFileName;
  a.click();
  log(`Downloading ${currentFileName}…`, 'accent');
});

// ── Init ──────────────────────────────────────────────────────────────────────
log('Drop a video file above, then click Convert.', 'info');
log('Supported: MP4 · WebM · MOV', 'info');
