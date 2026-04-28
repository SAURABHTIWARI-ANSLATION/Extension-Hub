const DB_NAME = "snapcam_db";
const DB_VERSION = 1;
const STORE_NAME = "captures";
const PREFS_KEY = "snapcam_preferences_v3";

const urlParams = new URLSearchParams(window.location.search);
const isDetachedWindow = urlParams.get("detached") === "1";
const requestedMode = urlParams.get("mode");
const requestedAutostart = urlParams.get("autostart") === "1";

const DEFAULT_PREFS = {
  lastMode: "camera",
  photoQuality: "95",
  photoCountdown: "0",
  photoCamera: "",
  photoMirror: "on",
  camQuality: "720",
  camDevice: "",
  camMic: "true",
  camMirror: "on",
  screenAudio: "none",
  galleryFilter: "all",
  annotateColor: "#2563eb",
  annotateSize: "4",
  cameraFilter: "none",
  photoFilter: "none"
};

const MODE_META = {
  photo: {
    title: "Photo Capture",
    description: "Camera is ready. Fine tune the shot, and capture a still image.",
    placeholder: "Starting camera preview...",
    label: "Photo Mode"
  },
  camera: {
    title: "Camera Video",
    description: "Camera is ready. Record webcam video with microphone and resolution controls.",
    placeholder: "Starting camera preview...",
    label: "Camera Video"
  },
  screen: {
    title: "Screen Recorder",
    description: "Capture your entire screen, a window, or browser tab with background recording.",
    placeholder: "Click Start Recording and choose what to share: entire screen, window, or tab.",
    label: "Screen Mode"
  },
  screenshot: {
    title: "Screenshot Capture",
    description: "Capture the visible area, full page, or a custom region of the active tab as a PNG.",
    placeholder: "Select a screenshot mode above and click Capture Screenshot.",
    label: "Screenshot Mode"
  }
};

// ── Custom Dropdown System (CSP-safe · MV3 compliant · no inline styles) ──────
// Mirrors the reference dropdowns.js pattern.
// All selects in settingsBox are enhanced via CADropdowns.build().
// populateCameraSelect() calls CADropdowns.sync() after updating options so the
// custom UI stays in sync with the underlying <select>.

(function () {
  'use strict';

  var WRAP  = 'ca-dropdown';
  var MENU  = 'ca-menu';
  var ITEM  = 'ca-item';
  var OPEN  = 'ca-open';
  var ACT   = 'ca-active';

  function positionMenu(trigger, menu) {
    var rect = trigger.getBoundingClientRect();
    var vp   = window.innerHeight || document.documentElement.clientHeight;
    var mH   = 200;
    menu.style.width = rect.width + 'px';
    menu.style.left  = rect.left  + 'px';
    if (rect.bottom + mH + 8 <= vp) {
      menu.style.top    = (rect.bottom + 4) + 'px';
      menu.style.bottom = 'auto';
    } else {
      menu.style.bottom = (vp - rect.top + 4) + 'px';
      menu.style.top    = 'auto';
    }
  }

  function selText(select) {
    var o = select.options[select.selectedIndex];
    return o ? o.text : '';
  }

  // Build a custom dropdown widget around an existing <select>.
  // The <select> stays hidden so all native .value reads and change listeners
  // continue to work unchanged everywhere else in popup.js.
  function buildSelectDropdown(select) {
    if (!select || select._caBuilt) return null;
    select._caBuilt = true;

    var wrap = document.createElement('div');
    wrap.className = WRAP;

    // Trigger button
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'ca-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    var tText = document.createElement('span');
    tText.className = 'ca-trigger-text';
    tText.textContent = selText(select);

    // Caret — built via DOM API (CSP-safe, no innerHTML, no inline style)
    var tCaret = document.createElement('span');
    tCaret.className = 'ca-caret';
    var ns = 'http://www.w3.org/2000/svg';
    var cSvg = document.createElementNS(ns, 'svg');
    cSvg.setAttribute('width', '12'); cSvg.setAttribute('height', '12');
    cSvg.setAttribute('viewBox', '0 0 24 24'); cSvg.setAttribute('fill', 'none');
    cSvg.setAttribute('stroke', 'currentColor'); cSvg.setAttribute('stroke-width', '2.5');
    cSvg.setAttribute('stroke-linecap', 'round'); cSvg.setAttribute('stroke-linejoin', 'round');
    var cPoly = document.createElementNS(ns, 'polyline');
    cPoly.setAttribute('points', '6 9 12 15 18 9');
    cSvg.appendChild(cPoly);
    tCaret.appendChild(cSvg);

    trigger.appendChild(tText);
    trigger.appendChild(tCaret);

    // Floating menu — appended to body so it overflows any overflow:hidden parent
    var menu = document.createElement('div');
    menu.className = MENU;
    menu.setAttribute('role', 'listbox');
    document.body.appendChild(menu);
    menu._ownerWrap = wrap;

    var listWrap = document.createElement('div');
    menu.appendChild(listWrap);

    function populate() {
      listWrap.innerHTML = '';
      Array.from(select.options).forEach(function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = ITEM;
        btn.dataset.val = opt.value;
        btn.setAttribute('role', 'option');

        var lbl = document.createElement('span');
        lbl.className = 'ca-lbl';
        lbl.textContent = opt.text;

        // Checkmark — DOM-built SVG, CSP-safe
        var chk = document.createElement('span');
        chk.className = 'ca-chk';
        var kSvg = document.createElementNS(ns, 'svg');
        kSvg.setAttribute('width', '14'); kSvg.setAttribute('height', '14');
        kSvg.setAttribute('viewBox', '0 0 24 24'); kSvg.setAttribute('fill', 'none');
        kSvg.setAttribute('stroke', 'currentColor'); kSvg.setAttribute('stroke-width', '2.5');
        kSvg.setAttribute('stroke-linecap', 'round'); kSvg.setAttribute('stroke-linejoin', 'round');
        var kPoly = document.createElementNS(ns, 'polyline');
        kPoly.setAttribute('points', '20 6 9 17 4 12');
        kSvg.appendChild(kPoly);
        chk.appendChild(kSvg);

        btn.appendChild(lbl);
        btn.appendChild(chk);

        if (opt.value === select.value) btn.classList.add(ACT);

        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          select.value = opt.value;
          tText.textContent = opt.text;
          listWrap.querySelectorAll('.' + ITEM).forEach(function (i) { i.classList.remove(ACT); });
          btn.classList.add(ACT);
          closeMenu();
          // Fire native change so all existing change listeners in popup.js fire
          select.dispatchEvent(new Event('change', { bubbles: true }));
        });

        listWrap.appendChild(btn);
      });
    }

    populate();

    var isOpen = false;

    function openMenu() {
      document.querySelectorAll('.' + MENU + '.ca-vis').forEach(function (m) {
        if (m !== menu) { m.classList.remove('ca-vis'); if (m._ownerWrap) m._ownerWrap.classList.remove(OPEN); }
      });
      isOpen = true;
      positionMenu(trigger, menu);
      menu.classList.add('ca-vis');
      wrap.classList.add(OPEN);
      trigger.setAttribute('aria-expanded', 'true');
      var active = listWrap.querySelector('.' + ITEM + '.' + ACT);
      if (active) setTimeout(function () { active.scrollIntoView({ block: 'nearest' }); }, 20);
    }

    function closeMenu() {
      isOpen = false;
      menu.classList.remove('ca-vis');
      wrap.classList.remove(OPEN);
      trigger.setAttribute('aria-expanded', 'false');
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      isOpen ? closeMenu() : openMenu();
    });

    document.addEventListener('click', function (e) {
      if (isOpen && !wrap.contains(e.target) && !menu.contains(e.target)) closeMenu();
    });

    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); if (!isOpen) openMenu();
      } else if (e.key === 'Escape') { closeMenu(); }
    });

    window.addEventListener('scroll', function () { if (isOpen) positionMenu(trigger, menu); }, { passive: true });
    window.addEventListener('resize', function () { if (isOpen) positionMenu(trigger, menu); }, { passive: true });

    // Re-populate when options change (e.g. populateCameraSelect adds <option> nodes)
    var obs = new MutationObserver(function () {
      populate();
      tText.textContent = selText(select);
    });
    obs.observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] });

    wrap._sync = function () {
      tText.textContent = selText(select);
      populate();
    };

    select.style.display = 'none';
    select.parentNode.insertBefore(wrap, select.nextSibling);
    wrap.appendChild(trigger);

    return wrap;
  }

  function initAllSelects() {
    document.querySelectorAll('select').forEach(function (s) { buildSelectDropdown(s); });
  }

  // Call after programmatically changing a <select>'s options or value
  function syncDropdown(selectElement) {
    if (!selectElement) return;
    // The wrapper is inserted right after the hidden <select>
    var wrap = selectElement.nextSibling;
    if (wrap && typeof wrap._sync === 'function') wrap._sync();
  }

  window.CADropdowns = { init: initAllSelects, build: buildSelectDropdown, sync: syncDropdown };
}());

const ICONS = {
  photo: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 8h3l1.5-2h7L17 8h3a2 2 0 0 1 2 2v7a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-7a2 2 0 0 1 2-2Z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  `,
  camera: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 8h1.5a2.5 2.5 0 0 1 2.5 2.5v3A2.5 2.5 0 0 1 16.5 16H7.5A2.5 2.5 0 0 1 5 13.5v-3A2.5 2.5 0 0 1 7.5 8H9"></path>
      <path d="M15 8V6a3 3 0 0 0-6 0v2"></path>
      <path d="m19 10 3-2v8l-3-2"></path>
      <circle cx="12" cy="12" r="2.8"></circle>
    </svg>
  `,
  screen: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="12" rx="2"></rect>
      <path d="M8 20h8"></path>
      <path d="M12 16v4"></path>
      <path d="m9.5 9 2 2 3-3"></path>
    </svg>
  `,
  preview: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `,
  download: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3v11"></path>
      <path d="m7 10 5 5 5-5"></path>
      <path d="M4 20h16"></path>
    </svg>
  `,
  trash: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 6h18"></path>
      <path d="M8 6V4h8v2"></path>
      <path d="M19 6l-1 14H6L5 6"></path>
      <path d="M10 11v5"></path>
      <path d="M14 11v5"></path>
    </svg>
  `,
  library: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 7a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"></path>
      <path d="M8 12h8"></path>
    </svg>
  `,
  annotate: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="m12 20 9-9"></path>
      <path d="M18 5a2.1 2.1 0 1 1 3 3l-1 1-3-3 1-1Z"></path>
      <path d="m15 8-9.5 9.5L4 21l3.5-1.5L17 10"></path>
    </svg>
  `,
  screenshot: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"></rect>
      <path d="M8 3v3"></path>
      <path d="M16 3v3"></path>
      <path d="M3 9h18"></path>
      <path d="M9 15l2 2 4-4"></path>
    </svg>
  `
};

const state = {
  db: null,
  prefs: { ...DEFAULT_PREFS },
  currentMode: "",
  liveStream: null,
  screenPreviewStream: null,
  mediaRecorder: null,
  recordedChunks: [],
  timerInterval: null,
  elapsedSeconds: 0,
  recordingMode: null,
  screenRecordingActive: false,
  captures: [],
  previewCaptureId: null,
  modeButtons: {},
  autostartHandled: false,
  annotateImageBlob: null,
  annotateSourceName: "",
  annotateHistory: [],
  annotateTool: "pen",
  annotateDrawing: false,
  annotateStartX: 0,
  annotateStartY: 0,
  annotateSnapshotData: null,
  annotateInitialized: false,
  screenshotMode: "visible",
  screenshotBlob: null,
  screenshotUrl: null
};

const modeTabs = Array.from(document.querySelectorAll(".mode-tab"));
const previewWrap = document.getElementById("previewWrap");
const liveVideo = document.getElementById("liveVideo");
const placeholder = document.getElementById("placeholder");
const placeholderIcon = document.getElementById("placeholderIcon");
const placeholderText = document.getElementById("placeholderText");
const annotateStage = document.getElementById("annotateStage");
const annotateCanvas = document.getElementById("annotateCanvas");
const annotateEmpty = document.getElementById("annotateEmpty");
const recBadge = document.getElementById("recBadge");
const recTimer = document.getElementById("recTimer");
const controls = document.getElementById("controls");
const settingsBox = document.getElementById("settingsBox");
const statusBar = document.getElementById("statusBar");
const modeTitle = document.getElementById("modeTitle");
const modeDescription = document.getElementById("modeDescription");
const gallery = document.getElementById("gallery");
const galleryFilterChips = Array.from(document.querySelectorAll(".library-filter-chip"));
const libraryCount = document.getElementById("libraryCount");
const librarySummary = document.getElementById("librarySummary");
const previewModal = document.getElementById("previewModal");
const previewBackdrop = document.getElementById("previewBackdrop");
const previewMediaContainer = document.getElementById("previewMediaContainer");
const previewModeLabel = document.getElementById("previewModeLabel");
const previewFilename = document.getElementById("previewFilename");
const previewMeta = document.getElementById("previewMeta");
const downloadPreviewBtn = document.getElementById("downloadPreviewBtn");
const deletePreviewBtn = document.getElementById("deletePreviewBtn");
const closePreviewBtn = document.getElementById("closePreview");
const fullscreenPreviewBtn = document.getElementById("fullscreenPreviewBtn");
const metricTotalValue = document.getElementById("metricTotalValue");
const metricTotalMeta = document.getElementById("metricTotalMeta");
const metricStorageValue = document.getElementById("metricStorageValue");
const metricStorageMeta = document.getElementById("metricStorageMeta");
const metricLatestValue = document.getElementById("metricLatestValue");
const metricLatestMeta = document.getElementById("metricLatestMeta");
const sessionPill = document.getElementById("sessionPill");
const openStudioBtn = document.getElementById("openStudioBtn");
const exportAllBtn = document.getElementById("exportAllBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const annotateFileInput = document.getElementById("annotateFileInput");
const canvas = document.getElementById("captureCanvas");

if (isDetachedWindow) {
  document.body.classList.add("is-detached");
  openStudioBtn.hidden = true;
}

modeTabs.forEach((tab) => {
  tab.addEventListener("click", () => switchMode(tab.dataset.mode));
});

galleryFilterChips.forEach((chip) => {
  chip.addEventListener("click", async () => {
    state.prefs.galleryFilter = chip.dataset.filter;
    syncGalleryFilterUI();
    await persistPreferences();
    renderGallery();
  });
});

gallery.addEventListener("click", handleGalleryClick);
previewBackdrop.addEventListener("click", closePreview);
closePreviewBtn.addEventListener("click", closePreview);
downloadPreviewBtn.addEventListener("click", async () => {
  const capture = getPreviewCapture();
  if (capture) {
    await downloadCapture(capture);
  }
});
deletePreviewBtn.addEventListener("click", async () => {
  const capture = getPreviewCapture();
  if (!capture) {
    return;
  }
  await deleteCaptureRecord(capture.id);
  closePreview();
});

if (fullscreenPreviewBtn) {
  fullscreenPreviewBtn.addEventListener("click", () => {
    const el = previewMediaContainer.querySelector("video, img");
    if (!el) return;
    // Extension popups cannot go fullscreen — open the media in a new window instead
    const url = el.src || el.currentSrc || "";
    if (url) {
      window.open(url, "_blank", "noopener");
    }
  });
}

openStudioBtn.addEventListener("click", openStudioWindow);
exportAllBtn.addEventListener("click", exportVisibleCaptures);
clearAllBtn.addEventListener("click", clearLibrary);
annotateFileInput.addEventListener("change", handleAnnotateFileSelection);

document.addEventListener("keydown", handleGlobalKeydown);
window.addEventListener("beforeunload", cleanupBeforeUnload);

if (navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === "function") {
  navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "recordingStarted") {
    state.screenRecordingActive = true;
    state.recordingMode = "screen";
    state.elapsedSeconds = 0;
    if (state.currentMode === "screen") {
      setRecordingIndicators(true, 0);
    }
    if (state.currentMode === "camera" && state.modeButtons.recordButton) {
      state.modeButtons.recordButton.disabled = true;
    }
    updateSessionPill();
    if (state.currentMode === "screen") {
      updateScreenButtons(true);
      showStatus("Screen recording is live in the background.", "recording");
    }
    return;
  }

  if (message.action === "recordingTick") {
    state.elapsedSeconds = message.elapsed || 0;
    if (state.currentMode === "screen") {
      setRecordingIndicators(true, state.elapsedSeconds);
    }
    updateSessionPill();
    return;
  }

  if (message.action === "recordingReady") {
    handleScreenRecordingReady(message);
  }
});

void init();

async function init() {
  setPlaceholderForMode("photo");
  showStatus("Loading your capture studio...", "info");

  try {
    state.db = await openDB();
  } catch (error) {
    console.error("IndexedDB error:", error);
    showStatus("Local storage is unavailable. Captures may not persist.", "error");
  }

  await loadPreferences();
  syncGalleryFilterUI();
  initializeAnnotateCanvas();

  if (state.db) {
    await loadSavedCaptures();
  } else {
    renderGallery();
    void updateMetrics();
  }

  const screenStatus = await getScreenRecordingStatus();
  state.screenRecordingActive = Boolean(screenStatus.isRecording);
  if (state.screenRecordingActive) {
    state.recordingMode = "screen";
    state.elapsedSeconds = screenStatus.elapsed || 0;
    setRecordingIndicators(true, state.elapsedSeconds);
  } else {
    setRecordingIndicators(false, 0);
  }

  const initialMode = resolveInitialMode(screenStatus.isRecording);
  await switchMode(initialMode, {
    force: true,
    preserveStatus: state.screenRecordingActive
  });

  if (state.screenRecordingActive) {
    showStatus("Screen recording is already running in the background.", "recording");
  } else {
    hideStatus();
  }
}

function resolveInitialMode(isScreenRecording) {
  if (isScreenRecording) {
    return "screen";
  }
  if (requestedMode && MODE_META[requestedMode]) {
    return requestedMode;
  }
  if (state.prefs.lastMode && MODE_META[state.prefs.lastMode]) {
    return state.prefs.lastMode;
  }
  return "photo";
}

function runtimeMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

function storageGet(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve);
  });
}

function storageSet(items) {
  return new Promise((resolve) => {
    chrome.storage.local.set(items, resolve);
  });
}

async function loadPreferences() {
  try {
    const stored = await storageGet(PREFS_KEY);
    state.prefs = {
      ...DEFAULT_PREFS,
      ...(stored[PREFS_KEY] || {})
    };
  } catch (error) {
    console.error("Could not load preferences:", error);
    state.prefs = { ...DEFAULT_PREFS };
  }
}

async function persistPreferences() {
  try {
    await storageSet({ [PREFS_KEY]: state.prefs });
  } catch (error) {
    console.error("Could not persist preferences:", error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

function getAllCapturesFromDB() {
  return new Promise((resolve, reject) => {
    const transaction = state.db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = (event) => resolve(event.target.result || []);
    request.onerror = (event) => reject(event.target.error);
  });
}

function getCaptureFromDB(id) {
  return new Promise((resolve, reject) => {
    const transaction = state.db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(id);
    request.onsuccess = (event) => resolve(event.target.result || null);
    request.onerror = (event) => reject(event.target.error);
  });
}

function saveCaptureToDB(capture) {
  return new Promise((resolve, reject) => {
    const transaction = state.db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(capture);
    transaction.oncomplete = () => resolve(capture);
    transaction.onerror = (event) => reject(event.target.error);
  });
}

function deleteCaptureFromDB(id) {
  return new Promise((resolve, reject) => {
    const transaction = state.db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = resolve;
    transaction.onerror = (event) => reject(event.target.error);
  });
}

function clearCapturesFromDB() {
  return new Promise((resolve, reject) => {
    const transaction = state.db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).clear();
    transaction.oncomplete = resolve;
    transaction.onerror = (event) => reject(event.target.error);
  });
}

async function loadSavedCaptures() {
  try {
    const items = await getAllCapturesFromDB();
    state.captures = items
      .map(hydrateCapture)
      .sort((left, right) => right.createdAt - left.createdAt);
  } catch (error) {
    console.error("Failed to load captures:", error);
    state.captures = [];
  }

  renderGallery();
  updateAnnotateActionState();
  void updateMetrics();
}

function hydrateCapture(capture) {
  const createdAt = capture.createdAt || capture.id || Date.now();
  const hydrated = {
    ...capture,
    createdAt,
    sizeBytes: capture.sizeBytes || (capture.blob ? capture.blob.size : 0),
    url: capture.blob ? URL.createObjectURL(capture.blob) : (capture.url || "")
  };

  if (!hydrated.sourceMode) {
    hydrated.sourceMode = capture.type;
  }

  return hydrated;
}

function getCaptureById(id) {
  return state.captures.find((capture) => capture.id === id) || null;
}

function getPreviewCapture() {
  return state.previewCaptureId ? getCaptureById(state.previewCaptureId) : null;
}

function syncGalleryFilterUI() {
  galleryFilterChips.forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.filter === state.prefs.galleryFilter);
  });
}

function bytesToSize(bytes) {
  if (!bytes) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function formatTimestamp(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function describeCaptureMeta(capture) {
  if (capture.durationSeconds) {
    return `Duration ${formatTime(capture.durationSeconds)}`;
  }

  if (capture.sourceMode === "annotate") {
    return "Annotated copy";
  }

  if (capture.type === "photo") {
    return "Still image";
  }

  if (capture.type === "video") {
    return "Webcam recording";
  }

  return "Screen capture";
}

function describeCaptureBreakdown() {
  const counts = {
    photo: 0,
    video: 0,
    screen: 0
  };

  state.captures.forEach((capture) => {
    counts[capture.type] = (counts[capture.type] || 0) + 1;
  });

  return `Photos ${counts.photo} | Camera ${counts.video} | Screen ${counts.screen}`;
}

function updateSessionPill() {
  if (!sessionPill) {
    return;
  }

  if (state.recordingMode === "camera") {
    sessionPill.textContent = `Camera REC ${formatTime(state.elapsedSeconds)}`;
    sessionPill.classList.add("is-recording");
    return;
  }

  if (state.screenRecordingActive) {
    sessionPill.textContent = `Screen REC ${formatTime(state.elapsedSeconds)}`;
    sessionPill.classList.add("is-recording");
    return;
  }

  const activeModeMeta =
    MODE_META[state.currentMode] ||
    MODE_META[state.prefs.lastMode] ||
    MODE_META.photo;

  sessionPill.textContent = activeModeMeta.label;
  sessionPill.classList.remove("is-recording");
}

async function updateMetrics() {
  const totalCount = state.captures.length;
  const totalBytes = state.captures.reduce((sum, capture) => sum + (capture.sizeBytes || 0), 0);
  const latestCapture = state.captures[0];

  metricTotalValue.textContent = `${totalCount} ${totalCount === 1 ? "capture" : "captures"}`;
  metricTotalMeta.textContent = describeCaptureBreakdown();

  metricStorageValue.textContent = bytesToSize(totalBytes);

  let quotaMeta = "Stored locally in Chrome";
  if (navigator.storage && typeof navigator.storage.estimate === "function") {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota) {
        const usagePercentage = ((totalBytes / estimate.quota) * 100).toFixed(1);
        quotaMeta = `${usagePercentage}% of available extension storage`;
      }
    } catch (error) {
      console.warn("Storage estimate unavailable:", error);
    }
  }
  metricStorageMeta.textContent = quotaMeta;

  if (latestCapture) {
    metricLatestValue.textContent = formatTimestamp(latestCapture.createdAt);
    metricLatestMeta.textContent = latestCapture.filename;
  } else {
    metricLatestValue.textContent = "Nothing yet";
    metricLatestMeta.textContent = "Your next capture will appear here";
  }
}

async function switchMode(mode, options = {}) {
  if (!MODE_META[mode] || state.currentMode === mode && !options.force) {
    if (state.currentMode === mode) {
      updateSessionPill();
    }
    return;
  }

  // Clean up screenshot-specific injected DOM elements when leaving screenshot mode
  if (state.currentMode === "screenshot") {
    cleanupScreenshotMode();
  }

  if (mode !== "screen") {
    stopScreenDisplayOnly();
  }

  await stopLiveSession();

  state.currentMode = mode;
  state.prefs.lastMode = mode;
  await persistPreferences();

  modeTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.mode === mode);
  });

  modeTitle.textContent = MODE_META[mode].title;
  modeDescription.textContent = MODE_META[mode].description;
  if (mode === "annotate") {
    showAnnotateSurface();
  } else {
    setPlaceholderForMode(mode);
  }
  buildControlsForMode(mode);
  
  // Add filter section for photo and camera modes only
  if (mode === "photo" || mode === "camera") {
    addFilterSection(mode);
  }
  
  updateSessionPill();

  // Auto-start camera for photo and camera modes (with slight delay to ensure UI is ready)
  if (mode === "photo") {
    setTimeout(async () => {
      try {
        await startPhotoCamera();
      } catch (error) {
        console.error("Auto-start photo failed:", error);
      }
    }, 300);
  } else if (mode === "camera") {
    setTimeout(async () => {
      try {
        await startCameraPreview();
      } catch (error) {
        console.error("Auto-start camera preview failed:", error);
      }
    }, 300);
  }

  if (mode === "screen") {
    await refreshScreenModeState();
  } else {
    setRecordingIndicators(false, 0);
    if (!options.preserveStatus) {
      hideStatus();
    }
  }

  maybeAutostartDetachedMode();
}

function setPlaceholderForMode(mode) {
  annotateStage.hidden = true;
  previewWrap.classList.remove("is-annotate-mode");
  placeholderIcon.innerHTML = ICONS[mode];
  placeholderText.textContent = MODE_META[mode].placeholder;
  placeholder.hidden = false;
  liveVideo.hidden = true;
  liveVideo.srcObject = null;
  liveVideo.style.filter = "none";
}

function showLivePreview() {
  annotateStage.hidden = true;
  previewWrap.classList.remove("is-annotate-mode");
  placeholder.hidden = true;
  liveVideo.hidden = false;
  // Always resolve the correct mirror orientation for the active mode.
  // This prevents a camera-mode mirror from bleeding into screen mode.
  applyPreviewMirror();
  // Apply saved filter for current mode
  if (state.currentMode === "photo") {
    applyVideoFilter(state.prefs.photoFilter || "none");
  } else if (state.currentMode === "camera") {
    applyVideoFilter(state.prefs.cameraFilter || "none");
  }
}

function showAnnotateSurface() {
  previewWrap.classList.add("is-annotate-mode");
  placeholder.hidden = true;
  liveVideo.hidden = true;
  liveVideo.srcObject = null;
  annotateStage.hidden = false;
  annotateEmpty.hidden = Boolean(state.annotateImageBlob);
  annotateCanvas.hidden = !state.annotateImageBlob;
}

function showStatus(message, tone) {
  statusBar.hidden = false;
  statusBar.dataset.tone = tone;
  statusBar.textContent = message;
}

function hideStatus() {
  statusBar.hidden = true;
  statusBar.textContent = "";
  delete statusBar.dataset.tone;
}

function setRecordingIndicators(isVisible, seconds) {
  recBadge.hidden = !isVisible;
  recTimer.hidden = !isVisible;
  if (isVisible) {
    recTimer.textContent = formatTime(seconds || 0);
  } else {
    recTimer.textContent = "00:00";
  }
}

function startTimer(recordingMode) {
  clearInterval(state.timerInterval);
  state.recordingMode = recordingMode;
  state.elapsedSeconds = 0;
  setRecordingIndicators(true, 0);
  updateSessionPill();

  state.timerInterval = window.setInterval(() => {
    state.elapsedSeconds += 1;
    setRecordingIndicators(true, state.elapsedSeconds);
    updateSessionPill();
  }, 1000);
}

function stopTimer(options = {}) {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  state.recordingMode = options.keepRecordingMode ? state.recordingMode : null;

  if (options.hideIndicators !== false) {
    setRecordingIndicators(false, 0);
  }

  if (options.resetElapsed !== false) {
    state.elapsedSeconds = 0;
  }

  updateSessionPill();
}

function applyPreviewMirror() {
  // Screen recordings must never be mirrored — the captured content is
  // already the correct orientation.  Remove any mirror class unconditionally.
  if (state.currentMode === "screen") {
    liveVideo.classList.remove("video-mirror");
    liveVideo.classList.add("video-normal");
    return;
  }
  const shouldMirror = state.currentMode === "photo"
    ? state.prefs.photoMirror === "on"
    : state.prefs.camMirror === "on";
  liveVideo.classList.toggle("video-mirror", shouldMirror);
  liveVideo.classList.toggle("video-normal", !shouldMirror);
}

function applyVideoFilter(filterValue) {
  const filterMap = {
    none:       "none",
    grayscale:  "grayscale(1)",
    sepia:      "sepia(0.85)",
    contrast:   "contrast(1.4) saturate(1.2)",
    brightness: "brightness(1.35)",
    blur:       "blur(2px)",
    vivid:      "saturate(1.8) contrast(1.1)",
    warm:       "sepia(0.3) saturate(1.4)"
  };
  liveVideo.style.filter = filterMap[filterValue] || "none";
}

// Returns the CSS filter string for the currently active filter in a given mode.
// Used by takePhoto() and startCameraRecording() so the saved output always
// matches what the user sees in the live preview.
function getActiveCssFilter(mode) {
  const filterMap = {
    none:       "none",
    grayscale:  "grayscale(1)",
    sepia:      "sepia(0.85)",
    contrast:   "contrast(1.4) saturate(1.2)",
    brightness: "brightness(1.35)",
    blur:       "blur(2px)",
    vivid:      "saturate(1.8) contrast(1.1)",
    warm:       "sepia(0.3) saturate(1.4)"
  };
  const key = mode === "camera"
    ? (state.prefs.cameraFilter || "none")
    : (state.prefs.photoFilter  || "none");
  return filterMap[key] || "none";
}




function addFilterSection(mode) {
  // Remove existing filter section if any (prevent duplicates)
  const existingFilter = document.querySelector('.camera-filter-section');
  if (existingFilter) {
    existingFilter.remove();
  }

  // Create filter section container - simple horizontal list with names only
  const filterSection = document.createElement('div');
  filterSection.className = 'camera-filter-section';
  filterSection.innerHTML = `
    <div class="camera-filter-list" id="${mode}FilterList">
      <button class="camera-filter-chip is-active" data-filter="none" type="button">Normal</button>
      <button class="camera-filter-chip" data-filter="grayscale" type="button">Grayscale</button>
      <button class="camera-filter-chip" data-filter="sepia" type="button">Sepia</button>
      <button class="camera-filter-chip" data-filter="contrast" type="button">Contrast</button>
      <button class="camera-filter-chip" data-filter="brightness" type="button">Brightness</button>
      <button class="camera-filter-chip" data-filter="vivid" type="button">Vivid</button>
      <button class="camera-filter-chip" data-filter="warm" type="button">Warm</button>
      <button class="camera-filter-chip" data-filter="blur" type="button">Blur</button>
    </div>
  `;

  // Insert before the controls (above the buttons)
  const captureTab = document.getElementById('tab-capture');
  captureTab.insertBefore(filterSection, controls);

  // Add event listeners
  const filterChips = filterSection.querySelectorAll('.camera-filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', async () => {
      const filterValue = chip.dataset.filter;
      
      // Update active state
      filterChips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      
      // Apply filter
      applyVideoFilter(filterValue);
      
      // Save preference for the correct mode
      if (mode === 'camera') {
        state.prefs.cameraFilter = filterValue;
      } else {
        state.prefs.photoFilter = filterValue;
      }
      await persistPreferences();
    });
  });

  // Restore saved filter
  const savedFilter = mode === 'camera' 
    ? (state.prefs.cameraFilter || 'none') 
    : (state.prefs.photoFilter || 'none');
  filterChips.forEach(chip => {
    if (chip.dataset.filter === savedFilter) {
      chip.classList.add('is-active');
    } else {
      chip.classList.remove('is-active');
    }
  });
}

function makeButton(label, className, id) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.id = id;
  button.textContent = label;
  return button;
}

function buildControlsForMode(mode) {
  controls.innerHTML = "";
  settingsBox.innerHTML = "";
  state.modeButtons = {};

  // Always remove the filter strip — it's only re-added for photo / camera
  const existingFilter = document.querySelector('.camera-filter-section');
  if (existingFilter) existingFilter.remove();

  if (mode === "photo") {
    buildPhotoMode();
    return;
  }

  if (mode === "camera") {
    buildCameraMode();
    return;
  }

  if (mode === "annotate") {
    buildAnnotateMode();
    return;
  }

  if (mode === "screenshot") {
    buildScreenshotMode();
    return;
  }

  buildScreenMode();
}

function buildPhotoMode() {
  const snapButton = makeButton("Snap Photo", "primary-button", "photoSnapButton");
  snapButton.disabled = true;

  snapButton.addEventListener("click", () => {
    void takePhoto();
  });

  controls.append(snapButton);
  state.modeButtons = { snapButton };

  // Build photo settings using DOM API — settingsBox.innerHTML would re-create
  // elements and lose CADropdowns wrappers; DOM construction keeps them stable.
  (function () {
    function makeField(labelText, forId) {
      var lbl = document.createElement('label');
      lbl.className = 'field';
      lbl.htmlFor = forId;
      var span = document.createElement('span');
      span.className = 'field__label';
      span.textContent = labelText;
      lbl.appendChild(span);
      return lbl;
    }
    function makeSelect(id, opts) {
      var sel = document.createElement('select');
      sel.id = id;
      opts.forEach(function (o) {
        var opt = document.createElement('option');
        opt.value = o[0]; opt.textContent = o[1];
        sel.appendChild(opt);
      });
      return sel;
    }

    var fQuality  = makeField('Photo Quality',  'photoQuality');
    var fCamera   = makeField('Camera Device',  'photoCamera');
    var fMirror   = makeField('Mirror Preview', 'photoMirror');
    var fCountdown = makeField('Countdown',     'photoCountdown');

    var qualitySelect   = makeSelect('photoQuality',   [['png','PNG Max'],['95','JPEG 95%'],['80','JPEG 80%'],['60','JPEG 60%']]);
    var cameraSelect    = makeSelect('photoCamera',    [['','Default camera']]);
    var mirrorSelect    = makeSelect('photoMirror',    [['on','On'],['off','Off']]);
    var countdownSelect = makeSelect('photoCountdown', [['0','Off'],['3','3 seconds'],['5','5 seconds'],['10','10 seconds']]);

    fQuality.appendChild(qualitySelect);
    fCamera.appendChild(cameraSelect);
    fMirror.appendChild(mirrorSelect);
    fCountdown.appendChild(countdownSelect);

    settingsBox.appendChild(fQuality);
    settingsBox.appendChild(fCamera);
    settingsBox.appendChild(fMirror);
    settingsBox.appendChild(fCountdown);

    // Set initial values before building dropdowns
    qualitySelect.value   = state.prefs.photoQuality;
    mirrorSelect.value    = state.prefs.photoMirror;
    countdownSelect.value = state.prefs.photoCountdown;

    // Enhance all four selects with custom dropdown UI
    CADropdowns.build(qualitySelect);
    CADropdowns.build(cameraSelect);
    CADropdowns.build(mirrorSelect);
    CADropdowns.build(countdownSelect);

    qualitySelect.addEventListener('change', async function (event) {
      state.prefs.photoQuality = event.target.value;
      await persistPreferences();
    });

    cameraSelect.addEventListener('change', async function (event) {
      state.prefs.photoCamera = event.target.value;
      await persistPreferences();
      if (state.liveStream && state.currentMode === 'photo') {
        await startPhotoCamera(true);
      }
    });

    mirrorSelect.addEventListener('change', async function (event) {
      state.prefs.photoMirror = event.target.value;
      await persistPreferences();
      applyPreviewMirror();
    });

    countdownSelect.addEventListener('change', async function (event) {
      state.prefs.photoCountdown = event.target.value;
      await persistPreferences();
    });

    void populateCameraSelect(cameraSelect, state.prefs.photoCamera);
  }());
}

function buildCameraMode() {
  const recordButton = makeButton("Record Video", "primary-button", "cameraRecordButton");
  const stopButton = makeButton("Stop Recording", "secondary-button secondary-button--danger", "cameraStopButton");
  recordButton.disabled = true;
  stopButton.disabled = true;

  recordButton.addEventListener("click", startCameraRecording);
  stopButton.addEventListener("click", stopCameraRecording);

  controls.append(recordButton, stopButton);
  state.modeButtons = { recordButton, stopButton };

  if (state.screenRecordingActive) {
    recordButton.disabled = true;
  }

  (function () {
    var fQuality = document.createElement('label');
    fQuality.className = 'field'; fQuality.htmlFor = 'camQuality';
    var fQualityLabel = document.createElement('span');
    fQualityLabel.className = 'field__label'; fQualityLabel.textContent = 'Resolution';
    var qualitySelect = document.createElement('select');
    qualitySelect.id = 'camQuality';
    [['1080','1080p'],['720','720p'],['480','480p']].forEach(function (o) {
      var opt = document.createElement('option'); opt.value = o[0]; opt.textContent = o[1];
      qualitySelect.appendChild(opt);
    });
    fQuality.appendChild(fQualityLabel); fQuality.appendChild(qualitySelect);
    settingsBox.appendChild(fQuality);

    var fDevice = document.createElement('label');
    fDevice.className = 'field'; fDevice.htmlFor = 'camDevice';
    var fDeviceLabel = document.createElement('span');
    fDeviceLabel.className = 'field__label'; fDeviceLabel.textContent = 'Camera Device';
    var cameraSelect = document.createElement('select');
    cameraSelect.id = 'camDevice';
    var defaultOpt = document.createElement('option'); defaultOpt.value = ''; defaultOpt.textContent = 'Default camera';
    cameraSelect.appendChild(defaultOpt);
    fDevice.appendChild(fDeviceLabel); fDevice.appendChild(cameraSelect);
    settingsBox.appendChild(fDevice);

    var fMic = document.createElement('label');
    fMic.className = 'field'; fMic.htmlFor = 'camMic';
    var fMicLabel = document.createElement('span');
    fMicLabel.className = 'field__label'; fMicLabel.textContent = 'Microphone';
    var micSelect = document.createElement('select');
    micSelect.id = 'camMic';
    [['true','Enabled'],['false','Disabled']].forEach(function (o) {
      var opt = document.createElement('option'); opt.value = o[0]; opt.textContent = o[1];
      micSelect.appendChild(opt);
    });
    fMic.appendChild(fMicLabel); fMic.appendChild(micSelect);
    settingsBox.appendChild(fMic);

    var fMirror = document.createElement('label');
    fMirror.className = 'field'; fMirror.htmlFor = 'camMirror';
    var fMirrorLabel = document.createElement('span');
    fMirrorLabel.className = 'field__label'; fMirrorLabel.textContent = 'Mirror Preview';
    var mirrorSelect = document.createElement('select');
    mirrorSelect.id = 'camMirror';
    [['on','On'],['off','Off']].forEach(function (o) {
      var opt = document.createElement('option'); opt.value = o[0]; opt.textContent = o[1];
      mirrorSelect.appendChild(opt);
    });
    fMirror.appendChild(fMirrorLabel); fMirror.appendChild(mirrorSelect);
    settingsBox.appendChild(fMirror);

    qualitySelect.value = state.prefs.camQuality;
    micSelect.value     = state.prefs.camMic;
    mirrorSelect.value  = state.prefs.camMirror;

    CADropdowns.build(qualitySelect);
    CADropdowns.build(cameraSelect);
    CADropdowns.build(micSelect);
    CADropdowns.build(mirrorSelect);

    qualitySelect.addEventListener('change', async function (event) {
      state.prefs.camQuality = event.target.value;
      await persistPreferences();
      if (state.liveStream && state.currentMode === 'camera') { await startCameraPreview(true); }
    });

    cameraSelect.addEventListener('change', async function (event) {
      state.prefs.camDevice = event.target.value;
      await persistPreferences();
      if (state.liveStream && state.currentMode === 'camera') { await startCameraPreview(true); }
    });

    micSelect.addEventListener('change', async function (event) {
      state.prefs.camMic = event.target.value;
      await persistPreferences();
      if (state.liveStream && state.currentMode === 'camera') { await startCameraPreview(true); }
    });

    mirrorSelect.addEventListener('change', async function (event) {
      state.prefs.camMirror = event.target.value;
      await persistPreferences();
      applyPreviewMirror();
    });

    void populateCameraSelect(cameraSelect, state.prefs.camDevice);
  }());
}

function buildScreenMode() {
  const startButton = makeButton("Start Recording", "primary-button", "screenStartButton");
  const stopButton = makeButton("Stop Recording", "secondary-button secondary-button--danger", "screenStopButton");
  stopButton.disabled = true;

  startButton.addEventListener("click", startScreenRecording);
  stopButton.addEventListener("click", stopScreenRecording);

  controls.append(startButton, stopButton);
  state.modeButtons = { startButton, stopButton };

  (function () {
    var fAudio = document.createElement('label');
    fAudio.className = 'field'; fAudio.htmlFor = 'screenAudio';
    var fAudioLabel = document.createElement('span');
    fAudioLabel.className = 'field__label'; fAudioLabel.textContent = 'Audio Source';
    fAudio.appendChild(fAudioLabel);

    var audioSelect = document.createElement('select');
    audioSelect.id = 'screenAudio';
    [['system','System audio'],['mic','Microphone'],['none','No audio']].forEach(function (o) {
      var opt = document.createElement('option'); opt.value = o[0]; opt.textContent = o[1];
      audioSelect.appendChild(opt);
    });
    fAudio.appendChild(audioSelect);
    settingsBox.appendChild(fAudio);

    audioSelect.value = state.prefs.screenAudio;
    CADropdowns.build(audioSelect);

    audioSelect.addEventListener('change', async function (event) {
      state.prefs.screenAudio = event.target.value;
      await persistPreferences();
    });
  }());

  updateScreenButtons(state.screenRecordingActive);
}

function buildAnnotateMode() {
  const uploadButton = makeButton("Upload Image", "secondary-button", "annotateUploadButton");
  const latestButton = makeButton("Use Latest Photo", "secondary-button", "annotateLatestButton");
  const resetButton = makeButton("Reset", "ghost-button", "annotateResetButton");
  const undoButton = makeButton("Undo", "ghost-button", "annotateUndoButton");
  const saveButton = makeButton("Save Copy", "primary-button", "annotateSaveButton");

  uploadButton.addEventListener("click", () => {
    annotateFileInput.click();
  });
  latestButton.addEventListener("click", () => {
    const latestPhoto = getLatestPhotoCapture();
    if (!latestPhoto) {
      showStatus("Capture a photo first or upload an image to annotate.", "info");
      return;
    }

    void openCaptureInAnnotate(latestPhoto);
  });
  resetButton.addEventListener("click", () => {
    void resetAnnotateCanvas();
  });
  undoButton.addEventListener("click", undoAnnotate);
  saveButton.addEventListener("click", () => {
    void saveAnnotatedCopy();
  });

  controls.append(uploadButton, latestButton, resetButton, undoButton, saveButton);
  state.modeButtons = { uploadButton, latestButton, resetButton, undoButton, saveButton };

  (function () {
    // Tool selector row
    var fTools = document.createElement('div');
    fTools.className = 'field field--full';
    var fToolsLabel = document.createElement('span');
    fToolsLabel.className = 'field__label'; fToolsLabel.textContent = 'Markup Tool';
    fTools.appendChild(fToolsLabel);

    var toolsDiv = document.createElement('div');
    toolsDiv.className = 'annotate-tools'; toolsDiv.id = 'annotateTools';
    [['pen','Pen'],['eraser','Eraser'],['arrow','Arrow'],['line','Line'],
     ['rect','Rectangle'],['circle','Circle'],['text','Text']].forEach(function (t) {
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'annotate-tool';
      btn.dataset.tool = t[0]; btn.textContent = t[1];
      toolsDiv.appendChild(btn);
    });
    fTools.appendChild(toolsDiv);
    settingsBox.appendChild(fTools);

    // Color picker
    var fColor = document.createElement('label');
    fColor.className = 'field'; fColor.htmlFor = 'annotateColor';
    var fColorLabel = document.createElement('span');
    fColorLabel.className = 'field__label'; fColorLabel.textContent = 'Stroke Color';
    var annotateColor = document.createElement('input');
    annotateColor.type = 'color'; annotateColor.id = 'annotateColor';
    fColor.appendChild(fColorLabel); fColor.appendChild(annotateColor);
    settingsBox.appendChild(fColor);

    // Size select
    var fSize = document.createElement('label');
    fSize.className = 'field'; fSize.htmlFor = 'annotateSize';
    var fSizeLabel = document.createElement('span');
    fSizeLabel.className = 'field__label'; fSizeLabel.textContent = 'Stroke Size';
    var annotateSize = document.createElement('select');
    annotateSize.id = 'annotateSize';
    [['2','Fine'],['4','Medium'],['6','Bold'],['8','Extra Bold']].forEach(function (o) {
      var opt = document.createElement('option'); opt.value = o[0]; opt.textContent = o[1];
      annotateSize.appendChild(opt);
    });
    fSize.appendChild(fSizeLabel); fSize.appendChild(annotateSize);
    settingsBox.appendChild(fSize);

    annotateColor.value = state.prefs.annotateColor;
    annotateSize.value  = state.prefs.annotateSize;
    CADropdowns.build(annotateSize);

    annotateColor.addEventListener('change', async function (event) {
      state.prefs.annotateColor = event.target.value;
      await persistPreferences();
    });

    annotateSize.addEventListener('change', async function (event) {
      state.prefs.annotateSize = event.target.value;
      await persistPreferences();
    });
  }());

  document.querySelectorAll(".annotate-tool").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tool === state.annotateTool);
    button.addEventListener("click", () => {
      state.annotateTool = button.dataset.tool;
      updateAnnotateToolUI();
    });
  });

  showAnnotateSurface();
  updateAnnotateToolUI();
  updateAnnotateActionState();
}

function capitalize(value) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getAnnotateToolLabel(tool) {
  const labels = {
    pen: "Pen",
    eraser: "Eraser",
    arrow: "Arrow",
    line: "Line",
    rect: "Rectangle",
    circle: "Circle",
    text: "Text"
  };

  return labels[tool] || capitalize(tool);
}

function getLatestPhotoCapture() {
  return state.captures.find((capture) => capture.type === "photo") || null;
}

function updateAnnotateToolUI() {
  document.querySelectorAll(".annotate-tool").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tool === state.annotateTool);
  });
}

function updateAnnotateActionState() {
  const latestPhoto = getLatestPhotoCapture();
  const hasImage = Boolean(state.annotateImageBlob);
  const canUndo = state.annotateHistory.length > 1;

  if (state.modeButtons.latestButton) {
    state.modeButtons.latestButton.disabled = !latestPhoto;
  }

  if (state.modeButtons.resetButton) {
    state.modeButtons.resetButton.disabled = !hasImage;
  }

  if (state.modeButtons.undoButton) {
    state.modeButtons.undoButton.disabled = !canUndo;
  }

  if (state.modeButtons.saveButton) {
    state.modeButtons.saveButton.disabled = !hasImage;
  }
}

function initializeAnnotateCanvas() {
  if (state.annotateInitialized || !annotateCanvas) {
    return;
  }

  state.annotateInitialized = true;

  annotateCanvas.addEventListener("pointerdown", handleAnnotatePointerDown);
  annotateCanvas.addEventListener("pointermove", handleAnnotatePointerMove);
  annotateCanvas.addEventListener("pointerup", handleAnnotatePointerUp);
  annotateCanvas.addEventListener("pointerleave", handleAnnotatePointerUp);
  annotateCanvas.addEventListener("pointercancel", handleAnnotatePointerUp);
}

function getAnnotateContext() {
  return annotateCanvas.getContext("2d", { willReadFrequently: true });
}

function getAnnotatePoint(event) {
  const bounds = annotateCanvas.getBoundingClientRect();
  const scaleX = annotateCanvas.width / bounds.width;
  const scaleY = annotateCanvas.height / bounds.height;

  return {
    x: (event.clientX - bounds.left) * scaleX,
    y: (event.clientY - bounds.top) * scaleY
  };
}

function applyAnnotateStrokeStyle(context) {
  context.strokeStyle = state.prefs.annotateColor;
  context.fillStyle = state.prefs.annotateColor;
  context.lineWidth = Number.parseInt(state.prefs.annotateSize, 10) || 4;
  context.lineCap = "round";
  context.lineJoin = "round";
}

function handleAnnotatePointerDown(event) {
  if (state.currentMode !== "annotate" || !state.annotateImageBlob) {
    return;
  }

  if (event.pointerType !== "touch" && event.button !== 0) {
    return;
  }

  const context = getAnnotateContext();
  const { x, y } = getAnnotatePoint(event);
  state.annotateDrawing = true;
  state.annotateStartX = x;
  state.annotateStartY = y;
  state.annotateSnapshotData = context.getImageData(0, 0, annotateCanvas.width, annotateCanvas.height);

  if (state.annotateTool === "text") {
    state.annotateDrawing = false;
    const text = window.prompt("Enter your note");
    if (!text) {
      return;
    }

    context.putImageData(state.annotateSnapshotData, 0, 0);
    context.fillStyle = state.prefs.annotateColor;
    context.font = `700 ${(Number.parseInt(state.prefs.annotateSize, 10) || 4) * 6}px Manrope, sans-serif`;
    context.fillText(text, x, y);
    saveAnnotateHistory();
    showStatus("Text added to the annotation.", "success");
    return;
  }

  if (state.annotateTool === "pen" || state.annotateTool === "eraser") {
    context.beginPath();
    context.moveTo(x, y);
  }

  event.preventDefault();
}

function handleAnnotatePointerMove(event) {
  if (!state.annotateDrawing || state.currentMode !== "annotate" || !state.annotateImageBlob) {
    return;
  }

  const context = getAnnotateContext();
  const { x, y } = getAnnotatePoint(event);

  if (state.annotateTool === "pen") {
    applyAnnotateStrokeStyle(context);
    context.lineTo(x, y);
    context.stroke();
    return;
  }

  if (state.annotateTool === "eraser") {
    context.save();
    context.globalCompositeOperation = "destination-out";
    context.lineWidth = (Number.parseInt(state.prefs.annotateSize, 10) || 4) * 4;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineTo(x, y);
    context.stroke();
    context.restore();
    return;
  }

  context.putImageData(state.annotateSnapshotData, 0, 0);
  applyAnnotateStrokeStyle(context);
  context.beginPath();

  if (state.annotateTool === "line") {
    context.moveTo(state.annotateStartX, state.annotateStartY);
    context.lineTo(x, y);
    context.stroke();
    return;
  }

  if (state.annotateTool === "rect") {
    context.strokeRect(state.annotateStartX, state.annotateStartY, x - state.annotateStartX, y - state.annotateStartY);
    return;
  }

  if (state.annotateTool === "circle") {
    const radiusX = Math.abs(x - state.annotateStartX) / 2;
    const radiusY = Math.abs(y - state.annotateStartY) / 2;
    const centerX = state.annotateStartX + (x - state.annotateStartX) / 2;
    const centerY = state.annotateStartY + (y - state.annotateStartY) / 2;
    context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    context.stroke();
    return;
  }

  if (state.annotateTool === "arrow") {
    drawAnnotateArrow(context, state.annotateStartX, state.annotateStartY, x, y);
  }
}

function handleAnnotatePointerUp() {
  if (!state.annotateDrawing) {
    return;
  }

  state.annotateDrawing = false;
  if (state.annotateTool !== "text") {
    saveAnnotateHistory();
  }
}

function drawAnnotateArrow(context, startX, startY, endX, endY) {
  const headLength = 16;
  const angle = Math.atan2(endY - startY, endX - startX);

  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();

  context.beginPath();
  context.moveTo(endX, endY);
  context.lineTo(
    endX - headLength * Math.cos(angle - Math.PI / 6),
    endY - headLength * Math.sin(angle - Math.PI / 6)
  );
  context.moveTo(endX, endY);
  context.lineTo(
    endX - headLength * Math.cos(angle + Math.PI / 6),
    endY - headLength * Math.sin(angle + Math.PI / 6)
  );
  context.stroke();
}

function saveAnnotateHistory() {
  const context = getAnnotateContext();
  state.annotateHistory.push(context.getImageData(0, 0, annotateCanvas.width, annotateCanvas.height));

  if (state.annotateHistory.length > 30) {
    state.annotateHistory.shift();
  }

  updateAnnotateActionState();
}

function undoAnnotate() {
  if (state.currentMode !== "annotate" || state.annotateHistory.length <= 1) {
    return;
  }

  state.annotateHistory.pop();
  const previousFrame = state.annotateHistory[state.annotateHistory.length - 1];
  getAnnotateContext().putImageData(previousFrame, 0, 0);
  updateAnnotateActionState();
}

async function resetAnnotateCanvas() {
  if (!state.annotateImageBlob) {
    return;
  }

  try {
    await loadImageIntoAnnotate(state.annotateImageBlob, state.annotateSourceName);
    showStatus("Annotation reset to the original image.", "info");
  } catch (error) {
    console.error("Could not reset annotation:", error);
    showStatus("Could not reset the annotation canvas.", "error");
  }
}

async function handleAnnotateFileSelection(event) {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  try {
    await switchMode("annotate");
    await loadImageIntoAnnotate(file, file.name);
    showStatus(`Loaded ${file.name} for annotation.`, "success");
  } catch (error) {
    console.error("Could not load uploaded image:", error);
    showStatus("That image could not be opened for annotation.", "error");
  }

  annotateFileInput.value = "";
}

async function openCaptureInAnnotate(capture) {
  if (!capture || capture.type !== "photo") {
    console.warn("Invalid capture for annotation:", capture);
    showStatus("Only photo captures can be annotated right now.", "info");
    return;
  }

  try {
    await switchMode("annotate");
    
    if (!capture.blob) {
      throw new Error("Capture blob is missing");
    }
    
    await loadImageIntoAnnotate(capture.blob, capture.filename);
    showStatus(`Ready to annotate ${capture.filename}.`, "success");
  } catch (error) {
    console.error("Could not open capture in annotate mode:", error);
    showStatus("Could not open that image for annotation. Error: " + error.message, "error");
  }
}

async function loadImageIntoAnnotate(blob, filename = "capture") {
  if (!blob || !blob.type.startsWith("image/")) {
    showStatus("Please choose an image file for annotation.", "error");
    return;
  }

  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not load image"));
      element.src = objectUrl;
    });

    const maxDimension = 1800;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = getAnnotateContext();

    annotateCanvas.width = width;
    annotateCanvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    state.annotateImageBlob = blob;
    state.annotateSourceName = filename;
    state.annotateHistory = [context.getImageData(0, 0, width, height)];
    state.annotateSnapshotData = null;
    state.annotateDrawing = false;

    showAnnotateSurface();
    updateAnnotateActionState();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function saveAnnotatedCopy() {
  if (!state.annotateImageBlob) {
    showStatus("Choose an image before saving an annotated copy.", "info");
    return;
  }

  try {
    const baseName = (state.annotateSourceName || "capture").replace(/\.[^.]+$/, "");
    const blob = await new Promise((resolve, reject) => {
      annotateCanvas.toBlob((createdBlob) => {
        if (createdBlob) {
          resolve(createdBlob);
          return;
        }

        reject(new Error("Could not export the annotation"));
      }, "image/png");
    });

    const filename = `${baseName}_annotated_${Date.now()}.png`;
    await saveAndInsertCapture(blob, "photo", filename, {
      sourceMode: "annotate"
    });
    showStatus(`Annotated copy saved as ${filename}.`, "success");
  } catch (error) {
    console.error("Could not save annotated copy:", error);
    showStatus("Could not save the annotated copy.", "error");
  }
}

async function populateCameraSelect(selectElement, selectedValue) {
  const devices = await loadVideoInputs();
  selectElement.innerHTML = "";

  if (devices.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Default camera";
    selectElement.appendChild(option);
    selectElement.disabled = true;
    // Sync custom dropdown UI with the updated options
    CADropdowns.sync(selectElement);
    return;
  }

  selectElement.disabled = false;

  devices.forEach((device, index) => {
    const option = document.createElement("option");
    option.value = device.deviceId;
    option.textContent = device.label || `Camera ${index + 1}`;
    selectElement.appendChild(option);
  });

  const usableValue = devices.some((device) => device.deviceId === selectedValue)
    ? selectedValue
    : devices[0].deviceId;
  selectElement.value = usableValue;

  // Sync custom dropdown UI so the trigger label and checkmark reflect the
  // newly populated options and selected value
  CADropdowns.sync(selectElement);
}

async function loadVideoInputs() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return [];
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "videoinput");
  } catch (error) {
    console.warn("Could not enumerate video inputs:", error);
    return [];
  }
}

async function startPhotoCamera(forceRestart = false) {
  if (state.currentMode !== "photo") {
    return;
  }

  const { snapButton } = state.modeButtons;

  if (state.liveStream && !forceRestart) {
    await stopLiveSession();
    setPlaceholderForMode("photo");
    if (snapButton) snapButton.disabled = true;
    showStatus("Camera preview stopped.", "info");
    return;
  }

  try {
    if (forceRestart) {
      await stopLiveSession();
    }

    showStatus("Requesting camera access...", "info");
    state.liveStream = await requestCameraStream({
      devicePreferenceKey: "photoCamera",
      width: 1920,
      height: 1080,
      audio: false
    });

    liveVideo.srcObject = state.liveStream;
    applyPreviewMirror();
    showLivePreview();

    const cameraSelect = document.getElementById("photoCamera");
    if (cameraSelect) {
      await populateCameraSelect(cameraSelect, state.prefs.photoCamera);
      state.prefs.photoCamera = cameraSelect.value;
      await persistPreferences();
    }

    if (snapButton) snapButton.disabled = false;
    showStatus("Camera ready. Snap when you are happy with the frame.", "success");
  } catch (error) {
    console.error("Photo camera error:", error);
    showStatus(formatCameraError(error, "photo"), "error");
  }
}

async function takePhoto() {
  if (!state.liveStream || state.currentMode !== "photo") {
    return;
  }

  const snapButton = state.modeButtons.snapButton;
  if (snapButton) {
    snapButton.disabled = true;
  }

  try {
    const countdownSeconds = Number.parseInt(state.prefs.photoCountdown, 10) || 0;
    await runCountdown(countdownSeconds);

    canvas.width  = liveVideo.videoWidth  || 1280;
    canvas.height = liveVideo.videoHeight || 720;
    const context = canvas.getContext("2d");

    // Apply the active camera filter directly onto the canvas so the saved
    // image matches exactly what the user sees in the preview.
    const cssFilter = getActiveCssFilter("photo");
    context.filter = cssFilter;

    // Mirror the canvas if the preview mirror is on so the saved photo
    // matches the on-screen orientation.
    if (state.prefs.photoMirror === "on") {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }

    context.drawImage(liveVideo, 0, 0, canvas.width, canvas.height);

    // Reset transform so the canvas is clean for future uses
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.filter = "none";

    const quality = state.prefs.photoQuality;
    const extension = quality === "png" ? "png" : "jpg";
    const mimeType  = quality === "png" ? "image/png" : "image/jpeg";
    const qualityValue = quality === "png" ? undefined : Number(quality) / 100;
    const blob = await canvasToBlob(mimeType, qualityValue);

    const filename = `photo_${Date.now()}.${extension}`;
    await saveAndInsertCapture(blob, "photo", filename);
    showStatus(`Photo saved at ${canvas.width}x${canvas.height}.`, "success");
  } catch (error) {
    console.error("Photo capture error:", error);
    showStatus("Photo capture failed. Please try again.", "error");
  } finally {
    if (snapButton) {
      snapButton.disabled = false;
    }
  }
}

async function startCameraPreview(forceRestart = false) {
  if (state.currentMode !== "camera") {
    return;
  }

  const { recordButton, stopButton } = state.modeButtons;

  if (state.liveStream && !forceRestart) {
    await stopLiveSession();
    setPlaceholderForMode("camera");
    if (recordButton) recordButton.disabled = true;
    if (stopButton) stopButton.disabled = true;
    showStatus("Camera preview stopped.", "info");
    return;
  }

  try {
    if (forceRestart) {
      await stopLiveSession();
    }

    showStatus("Preparing camera and microphone...", "info");
    const preset = getResolutionPreset(state.prefs.camQuality);
    state.liveStream = await requestCameraStream({
      devicePreferenceKey: "camDevice",
      width: preset.width,
      height: preset.height,
      audio: state.prefs.camMic === "true"
    });

    liveVideo.srcObject = state.liveStream;
    applyPreviewMirror();
    showLivePreview();

    const cameraSelect = document.getElementById("camDevice");
    if (cameraSelect) {
      await populateCameraSelect(cameraSelect, state.prefs.camDevice);
      state.prefs.camDevice = cameraSelect.value;
      await persistPreferences();
    }

    if (recordButton) recordButton.disabled = state.screenRecordingActive;
    if (stopButton) stopButton.disabled = true;
    showStatus(
      state.screenRecordingActive
        ? "Camera preview is ready. Finish the screen recording before starting webcam video capture."
        : "Camera ready. Use Record when you are set.",
      "success"
    );
  } catch (error) {
    console.error("Camera preview error:", error);
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    showStatus(formatCameraError(error, "camera"), "error");
  }
}

function startCameraRecording() {
  if (!state.liveStream || state.currentMode !== "camera") {
    return;
  }

  if (state.screenRecordingActive) {
    showStatus("Finish the background screen recording before starting webcam video capture.", "info");
    return;
  }

  const { startButton, recordButton, stopButton } = state.modeButtons;
  state.recordedChunks = [];

  // ── Build a filtered canvas stream so the recording matches the preview ──
  // CSS filters on liveVideo do NOT affect MediaRecorder (it reads raw frames).
  // Instead we paint each frame onto a hidden canvas with ctx.filter applied,
  // then record canvas.captureStream() mixed with the original audio tracks.

  const filterCanvas  = document.createElement("canvas");
  filterCanvas.width  = liveVideo.videoWidth  || 1280;
  filterCanvas.height = liveVideo.videoHeight || 720;
  const filterCtx = filterCanvas.getContext("2d");

  const cssFilter = getActiveCssFilter("camera");
  const isMirrored = state.prefs.camMirror === "on";

  let rafId = null;
  let recordingStopped = false;

  function drawFrame() {
    if (recordingStopped) return;
    filterCtx.save();
    filterCtx.filter = cssFilter;
    if (isMirrored) {
      filterCtx.translate(filterCanvas.width, 0);
      filterCtx.scale(-1, 1);
    }
    filterCtx.drawImage(liveVideo, 0, 0, filterCanvas.width, filterCanvas.height);
    filterCtx.restore();
    rafId = requestAnimationFrame(drawFrame);
  }
  drawFrame();

  // Combine canvas video stream with original audio tracks
  const canvasStream = filterCanvas.captureStream(30);
  state.liveStream.getAudioTracks().forEach(t => canvasStream.addTrack(t));

  try {
    state.mediaRecorder = new MediaRecorder(canvasStream, getRecorderOptions());
  } catch (error) {
    console.error("MediaRecorder setup error:", error);
    cancelAnimationFrame(rafId);
    showStatus("Recording is not supported with the current camera settings.", "error");
    return;
  }

  state.mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      state.recordedChunks.push(event.data);
    }
  };

  state.mediaRecorder.onstop = async () => {
    // Stop the canvas render loop
    recordingStopped = true;
    cancelAnimationFrame(rafId);

    const mimeType = state.mediaRecorder && state.mediaRecorder.mimeType
      ? state.mediaRecorder.mimeType
      : "video/webm";
    const blob = new Blob(state.recordedChunks, { type: mimeType });
    const extension = mimeType.includes("mp4") ? "mp4" : "webm";
    const duration = formatTime(state.elapsedSeconds);

    stopTimer();

    if (blob.size > 0) {
      await saveAndInsertCapture(blob, "video", `camera_${Date.now()}.${extension}`, {
        durationSeconds: state.elapsedSeconds
      });
      showStatus(`Camera recording saved. Duration ${duration}.`, "success");
    }

    if (startButton) startButton.disabled = false;
    if (recordButton) recordButton.disabled = false;
    if (stopButton)   stopButton.disabled   = true;
  };

  state.mediaRecorder.start(500);
  startTimer("camera");

  if (startButton) startButton.disabled = true;
  if (recordButton) recordButton.disabled = true;
  if (stopButton)   stopButton.disabled   = false;

  showStatus("Camera recording is live.", "recording");
}

function stopCameraRecording() {
  if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    state.mediaRecorder.stop();
    showStatus("Finishing the recording and saving the file...", "info");
  }
}

async function requestCameraStream({ devicePreferenceKey, width, height, audio }) {
  const attempt = async (deviceId) => {
    const video = {
      width: { ideal: width },
      height: { ideal: height }
    };

    if (deviceId) {
      video.deviceId = { exact: deviceId };
    }

    return navigator.mediaDevices.getUserMedia({
      video,
      audio
    });
  };

  const selectedDeviceId = state.prefs[devicePreferenceKey];

  try {
    return await attempt(selectedDeviceId);
  } catch (error) {
    if (
      selectedDeviceId &&
      (error.name === "OverconstrainedError" || error.name === "NotFoundError")
    ) {
      state.prefs[devicePreferenceKey] = "";
      await persistPreferences();
      return attempt("");
    }
    throw error;
  }
}

function getResolutionPreset(preset) {
  if (preset === "1080") {
    return { width: 1920, height: 1080 };
  }
  if (preset === "480") {
    return { width: 854, height: 480 };
  }
  return { width: 1280, height: 720 };
}

function formatCameraError(error, mode) {
  if (!error) {
    return "Camera access failed.";
  }

  // Extract error details from DOMException or other error types
  const errorName = error.name || "";
  const errorMessage = error.message || "";

  if (errorName === "NotAllowedError") {
    const baseMessage = mode === "camera"
      ? "Camera or microphone access was blocked."
      : "Camera access was blocked.";
    return isDetachedWindow
      ? `${baseMessage} Please allow the permission prompt and try again.`
      : `${baseMessage} If Chrome closes the popup prompt, use Open Studio for a steadier permission flow.`;
  }

  if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
    return mode === "camera"
      ? "No usable camera or microphone device was found."
      : "No usable camera device was found.";
  }

  if (errorName === "NotReadableError") {
    return "Your camera is currently being used by another application.";
  }

  if (errorName === "OverconstrainedError") {
    return "Camera does not support the selected resolution. Try a lower resolution.";
  }

  if (errorName === "TypeError") {
    return "Invalid camera configuration. Please check your settings.";
  }

  // Return the error message if available, otherwise a generic message
  if (errorMessage) {
    return `Camera error: ${errorMessage}`;
  }

  return mode === "camera"
    ? "Failed to access camera. Please check permissions and try again."
    : "Failed to access camera. Please check permissions and try again.";
}

async function runCountdown(seconds) {
  if (!seconds) {
    return;
  }

  const previewWrap = document.getElementById("previewWrap");
  const overlay = document.createElement("div");
  overlay.className = "countdown-overlay";

  const number = document.createElement("div");
  number.className = "countdown-number";
  overlay.appendChild(number);
  previewWrap.appendChild(overlay);

  for (let remaining = seconds; remaining >= 1; remaining -= 1) {
    number.textContent = String(remaining);
    await wait(1000);
  }

  overlay.remove();
}

function wait(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

function canvasToBlob(mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error("Could not create blob."));
    }, mimeType, quality);
  });
}

function getRecorderOptions() {
  const mimeTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4"
  ];

  const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
  return mimeType ? { mimeType } : {};
}

async function stopLiveSession() {
  const shouldStopLocalTimer = Boolean(state.recordingMode && state.recordingMode !== "screen");

  if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") {
    state.mediaRecorder.stop();
  } else if (shouldStopLocalTimer) {
    stopTimer();
  }

  if (state.liveStream) {
    state.liveStream.getTracks().forEach((track) => track.stop());
    state.liveStream = null;
  }

  // Clean up playback src set after recording finishes
  liveVideo.src = "";
  liveVideo.controls = false;
  liveVideo.srcObject = null;
  liveVideo.hidden = true;

  // Remove the per-session download button if present
  const dlBtn = document.getElementById("screenDlBtn");
  if (dlBtn) dlBtn.remove();
}

function stopScreenDisplayOnly() {
  if (state.screenPreviewStream) {
    state.screenPreviewStream.getTracks().forEach(t => t.stop());
    state.screenPreviewStream = null;
  }
  if (state.currentMode === "screen") {
    liveVideo.srcObject = null;
    liveVideo.hidden = true;
  }
  setRecordingIndicators(false, 0);
  updateSessionPill();
}

async function getScreenRecordingStatus() {
  try {
    const response = await runtimeMessage({ action: "getRecordingStatus" });
    return response || { isRecording: false, elapsed: 0 };
  } catch (error) {
    console.warn("Could not fetch screen status:", error);
    return { isRecording: false, elapsed: 0 };
  }
}

async function refreshScreenModeState() {
  const status = await getScreenRecordingStatus();
  state.screenRecordingActive = Boolean(status.isRecording);

  if (state.screenRecordingActive) {
    state.recordingMode = "screen";
    state.elapsedSeconds = status.elapsed || 0;
    setRecordingIndicators(true, state.elapsedSeconds);
    updateScreenButtons(true);
    updateSessionPill();
    showStatus("Screen recording is live in the background.", "recording");
    return;
  }

  state.recordingMode = null;
  state.elapsedSeconds = 0;
  setRecordingIndicators(false, 0);
  updateScreenButtons(false);
  updateSessionPill();
}

function updateScreenButtons(isRecording) {
  const { startButton, stopButton } = state.modeButtons;
  if (!startButton || !stopButton) {
    return;
  }

  startButton.disabled = isRecording;
  stopButton.disabled = !isRecording;
}

function startScreenRecording() {
  const audio = state.prefs.screenAudio;
  updateScreenButtons(true);
  showStatus("Opening the Chrome share picker…", "info");

  const constraints = {
    video: { cursor: "always" },
    audio: audio === "system"
  };

  navigator.mediaDevices.getDisplayMedia(constraints)
    .then(async (displayStream) => {
      // Optionally add mic track
      if (audio === "mic") {
        try {
          const mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          mic.getAudioTracks().forEach(t => displayStream.addTrack(t));
        } catch (_) { /* mic optional */ }
      }

      // Show live preview using the SAME stream (no second permission)
      state.liveStream = displayStream;
      liveVideo.srcObject = displayStream;
      liveVideo.controls = false;
      showLivePreview();

      // Set up local MediaRecorder
      state.recordedChunks = [];
      const recOptions = getRecorderOptions();
      state.mediaRecorder = new MediaRecorder(displayStream, recOptions);

      state.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) state.recordedChunks.push(e.data);
      };

      state.mediaRecorder.onstop = async () => {
        stopTimer();
        state.screenRecordingActive = false;
        state.recordingMode = null;
        updateSessionPill();

        const blob = new Blob(state.recordedChunks, {
          type: state.mediaRecorder.mimeType || "video/webm"
        });
        state.recordedChunks = [];

        // Stop all tracks
        if (state.liveStream) {
          state.liveStream.getTracks().forEach(t => t.stop());
          state.liveStream = null;
        }

        // Show playback in the preview box
        const blobUrl = URL.createObjectURL(blob);
        liveVideo.srcObject = null;
        liveVideo.src = blobUrl;
        liveVideo.controls = true;
        liveVideo.loop = false;
        showLivePreview();

        // Save to DB and update gallery
        const id = Date.now();
        const filename = `screen_${id}.webm`;
        const duration = formatTime(state.elapsedSeconds);

        try {
          await saveAndInsertCapture(blob, "screen", filename, {
            durationSeconds: state.elapsedSeconds,
            sourceMode: "screen"
          });
          showStatus(`Recording saved — ${duration}. Showing playback below.`, "success");
        } catch (err) {
          console.error("Could not save recording:", err);
          showStatus("Recording finished but could not save to gallery.", "error");
        }

        updateScreenButtons(false);

        // Add a "Save / Download" shortcut button under the preview
        const existingDl = document.getElementById("screenDlBtn");
        if (!existingDl) {
          const dlBtn = makeButton("Download Recording", "secondary-button", "screenDlBtn");
          dlBtn.addEventListener("click", () => {
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          });
          controls.appendChild(dlBtn);
        }
      };

      // Handle user stopping via Chrome's share bar
      displayStream.getVideoTracks()[0].addEventListener("ended", () => {
        if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") {
          state.mediaRecorder.stop();
        }
      });

      state.mediaRecorder.start(500);
      state.screenRecordingActive = true;
      startTimer("screen");
      updateScreenButtons(true);
      showStatus("Recording — press Stop when done.", "recording");
    })
    .catch((err) => {
      updateScreenButtons(false);
      if (err.name === "NotAllowedError") {
        showStatus("Screen share was cancelled.", "info");
      } else {
        showStatus("Could not start screen recording: " + err.message, "error");
      }
    });
}

function stopScreenRecording() {
  updateScreenButtons(true);
  if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") {
    state.mediaRecorder.stop();
    showStatus("Finishing the recording…", "info");
  } else {
    // No active recorder — just clean up
    if (state.liveStream) {
      state.liveStream.getTracks().forEach(t => t.stop());
      state.liveStream = null;
    }
    state.screenRecordingActive = false;
    stopTimer();
    updateScreenButtons(false);
    setPlaceholderForMode("screen");
  }
}

async function handleScreenRecordingReady(message) {
  state.screenRecordingActive = false;
  if (state.recordingMode === "screen") {
    state.recordingMode = null;
    stopTimer();
    setRecordingIndicators(false, 0);
    updateSessionPill();
  } else {
    updateSessionPill();
  }

  if (message.id && state.db) {
    try {
      const capture = await getCaptureFromDB(message.id);
      if (capture) {
        insertCaptureIntoState(hydrateCapture(capture));
      } else {
        await loadSavedCaptures();
      }
    } catch (error) {
      console.error("Could not load saved screen capture:", error);
      await loadSavedCaptures();
    }
  } else {
    await loadSavedCaptures();
  }

  if (state.currentMode === "screen") {
    updateScreenButtons(false);
    showStatus(`Screen recording saved. Duration ${message.duration || "00:00"}.`, "success");
  } else if (state.currentMode === "camera" && state.modeButtons.recordButton && state.liveStream) {
    state.modeButtons.recordButton.disabled = false;
    showStatus(`Screen recording saved. Duration ${message.duration || "00:00"}.`, "success");
  } else {
    showStatus(`Screen recording saved. Duration ${message.duration || "00:00"}.`, "success");
  }
}

async function saveAndInsertCapture(blob, type, filename, extras = {}) {
  const id = Date.now();
  const captureRecord = {
    id,
    type,
    filename,
    blob,
    createdAt: id,
    sizeBytes: blob.size,
    ...extras
  };

  if (state.db) {
    await saveCaptureToDB(captureRecord);
  }

  insertCaptureIntoState(hydrateCapture(captureRecord));
}

function insertCaptureIntoState(capture) {
  const existingIndex = state.captures.findIndex((item) => item.id === capture.id);
  if (existingIndex >= 0) {
    revokeCaptureUrl(state.captures[existingIndex]);
    state.captures.splice(existingIndex, 1, capture);
  } else {
    state.captures.unshift(capture);
  }

  state.captures.sort((left, right) => right.createdAt - left.createdAt);
  renderGallery();
  updateAnnotateActionState();
  void updateMetrics();
}

function revokeCaptureUrl(capture) {
  if (capture && capture.url) {
    URL.revokeObjectURL(capture.url);
  }
}

function getVisibleCaptures() {
  const filter = state.prefs.galleryFilter || "all";

  const visibleCaptures = state.captures.filter((capture) => {
    return filter === "all" ? true : capture.type === filter;
  });

  // Sort by newest first by default
  const sortedCaptures = [...visibleCaptures];
  sortedCaptures.sort((left, right) => right.createdAt - left.createdAt);

  return sortedCaptures;
}

function renderGallery() {
  const visibleCaptures = getVisibleCaptures();
  gallery.innerHTML = "";
  syncGalleryFilterUI();

  libraryCount.textContent = `${visibleCaptures.length} ${visibleCaptures.length === 1 ? "item" : "items"}`;
  if (visibleCaptures.length === state.captures.length) {
    librarySummary.textContent = "Everything stays inside this extension.";
  } else {
    const activeFilter = state.prefs.galleryFilter === "all"
      ? "all saved captures"
      : `${state.prefs.galleryFilter} captures`;
    librarySummary.textContent = `Showing ${visibleCaptures.length} of ${state.captures.length} ${activeFilter}.`;
  }

  if (visibleCaptures.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "gallery-empty";
    emptyState.innerHTML = `
      <div class="gallery-empty__icon" aria-hidden="true">${ICONS.library}</div>
      <strong>No captures match the current view.</strong>
      <span>Try another filter or capture something new to fill the gallery.</span>
    `;
    gallery.appendChild(emptyState);
    return;
  }

  visibleCaptures.forEach((capture) => {
    gallery.appendChild(createGalleryCard(capture));
  });
}

function createGalleryCard(capture) {
  const card = document.createElement("article");
  card.className = "gallery-item";
  card.dataset.id = String(capture.id);
  card.tabIndex = 0;

  const mediaWrap = document.createElement("div");
  mediaWrap.className = "gallery-item__media";

  let media;
  if (capture.type === "photo") {
    media = document.createElement("img");
    media.alt = capture.filename;
    media.src = capture.url;
  } else {
    media = document.createElement("video");
    media.src = capture.url;
    media.muted = true;
    media.loop = true;
    media.playsInline = true;
    card.addEventListener("mouseenter", () => {
      media.play().catch(() => {});
    });
    card.addEventListener("mouseleave", () => {
      media.pause();
      media.currentTime = 0;
    });
  }

  const overlay = document.createElement("div");
  overlay.className = "gallery-item__overlay";
  const actions = [
    makeGalleryAction("preview", ICONS.preview, "Preview"),
    makeGalleryAction("download", ICONS.download, "Download"),
    makeGalleryAction("delete", ICONS.trash, "Delete", true)
  ];
  overlay.append(...actions);

  mediaWrap.append(media, overlay);

  const meta = document.createElement("div");
  meta.className = "gallery-item__meta";
  meta.innerHTML = `
    <div class="gallery-item__topline">
      <span class="gallery-badge" data-type="${capture.type}">${capture.type}</span>
      <span class="gallery-item__size">${bytesToSize(capture.sizeBytes)}</span>
    </div>
    <strong class="gallery-item__name">${capture.filename}</strong>
    <span class="gallery-item__details">${describeCaptureMeta(capture)}</span>
    <span class="gallery-item__time">${formatTimestamp(capture.createdAt)}</span>
  `;

  card.append(mediaWrap, meta);
  return card;
}

function makeGalleryAction(action, icon, label, isDanger = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `gallery-action${isDanger ? " gallery-action--danger" : ""}`;
  button.dataset.action = action;
  button.setAttribute("aria-label", label);
  button.innerHTML = icon;
  return button;
}

function handleGalleryClick(event) {
  const actionButton = event.target.closest("[data-action]");
  const card = event.target.closest(".gallery-item");
  if (!card) {
    return;
  }

  const captureId = Number(card.dataset.id);
  if (!captureId) {
    return;
  }

  if (actionButton) {
    event.stopPropagation();
    const action = actionButton.dataset.action;
    if (action === "preview") {
      openPreview(captureId);
      return;
    }
    if (action === "download") {
      const capture = getCaptureById(captureId);
      if (capture) {
        void downloadCapture(capture);
      }
      return;
    }
    if (action === "annotate") {
      const capture = getCaptureById(captureId);
      if (capture) {
        void openCaptureInAnnotate(capture);
      }
      return;
    }
    if (action === "delete") {
      void deleteCaptureRecord(captureId);
      return;
    }
  }

  openPreview(captureId);
}

function openPreview(captureId) {
  const capture = getCaptureById(captureId);
  if (!capture) {
    return;
  }

  state.previewCaptureId = captureId;
  previewMediaContainer.innerHTML = "";
  previewModeLabel.textContent = capture.type === "photo"
    ? "Photo Preview"
    : capture.type === "video"
      ? "Camera Video Preview"
      : "Screen Recording Preview";
  previewFilename.textContent = capture.filename;
  previewMeta.textContent = `${describeCaptureMeta(capture)} | ${bytesToSize(capture.sizeBytes)} | ${formatTimestamp(capture.createdAt)}`;

  let element;
  if (capture.type === "photo") {
    element = document.createElement("img");
    element.src = capture.url;
    element.alt = capture.filename;
  } else {
    element = document.createElement("video");
    element.src = capture.url;
    element.controls = true;
    element.autoplay = true;
    element.loop = true;
  }

  previewMediaContainer.appendChild(element);
  previewModal.hidden = false;
  document.body.classList.add("has-modal");
}

function closePreview() {
  state.previewCaptureId = null;
  previewMediaContainer.innerHTML = "";
  previewModal.hidden = true;
  document.body.classList.remove("has-modal");
}

async function downloadCapture(capture) {
  const targetFilename = `SnapCam Pro/${capture.filename}`;

  if (chrome.downloads && chrome.downloads.download) {
    await new Promise((resolve) => {
      chrome.downloads.download(
        {
          url: capture.url,
          filename: targetFilename,
          saveAs: false
        },
        () => {
          if (chrome.runtime.lastError) {
            fallbackDownload(capture);
          }
          resolve();
        }
      );
    });
    return;
  }

  fallbackDownload(capture);
}

function fallbackDownload(capture) {
  const anchor = document.createElement("a");
  anchor.href = capture.url;
  anchor.download = capture.filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

async function exportVisibleCaptures() {
  const captures = getVisibleCaptures();
  if (captures.length === 0) {
    showStatus("There are no visible captures to export.", "info");
    return;
  }

  showStatus(`Starting ${captures.length} download${captures.length === 1 ? "" : "s"}...`, "info");

  for (const capture of captures) {
    await downloadCapture(capture);
  }

  showStatus(`Exported ${captures.length} capture${captures.length === 1 ? "" : "s"}.`, "success");
}

async function deleteCaptureRecord(captureId) {
  const capture = getCaptureById(captureId);
  if (!capture) {
    return;
  }

  if (state.db) {
    try {
      await deleteCaptureFromDB(captureId);
    } catch (error) {
      console.error("Could not delete capture:", error);
      showStatus("Could not delete the selected file.", "error");
      return;
    }
  }

  revokeCaptureUrl(capture);
  state.captures = state.captures.filter((item) => item.id !== captureId);
  renderGallery();
  updateAnnotateActionState();
  void updateMetrics();

  if (state.previewCaptureId === captureId) {
    closePreview();
  }

  showStatus("Capture removed from the gallery.", "success");
}

async function clearLibrary() {
  if (state.captures.length === 0) {
    showStatus("The gallery is already empty.", "info");
    return;
  }

  const shouldClear = window.confirm("Clear all saved captures from the local library?");
  if (!shouldClear) {
    return;
  }

  if (state.db) {
    try {
      await clearCapturesFromDB();
    } catch (error) {
      console.error("Could not clear library:", error);
      showStatus("Could not clear the gallery.", "error");
      return;
    }
  }

  state.captures.forEach(revokeCaptureUrl);
  state.captures = [];
  closePreview();
  renderGallery();
  updateAnnotateActionState();
  void updateMetrics();
  showStatus("All saves cleared from the gallery.", "success");
}

function handleGlobalKeydown(event) {
  if (event.key === "Escape" && !previewModal.hidden) {
    closePreview();
    return;
  }

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z" && state.currentMode === "annotate") {
    event.preventDefault();
    undoAnnotate();
    return;
  }
}

async function handleDeviceChange() {
  if (state.currentMode === "photo") {
    const select = document.getElementById("photoCamera");
    if (select) {
      await populateCameraSelect(select, state.prefs.photoCamera);
    }
    return;
  }

  if (state.currentMode === "camera") {
    const select = document.getElementById("camDevice");
    if (select) {
      await populateCameraSelect(select, state.prefs.camDevice);
    }
  }
}

function maybeAutostartDetachedMode() {
  if (!isDetachedWindow || !requestedAutostart || state.autostartHandled) {
    return;
  }

  if (state.currentMode === "photo") {
    state.autostartHandled = true;
    window.setTimeout(() => {
      void startPhotoCamera();
    }, 180);
    return;
  }

  if (state.currentMode === "camera") {
    state.autostartHandled = true;
    window.setTimeout(() => {
      void startCameraPreview();
    }, 180);
  }
}

function openStudioWindow() {
  if (isDetachedWindow) {
    return;
  }

  const autostart = state.currentMode === "photo" || state.currentMode === "camera" ? "&autostart=1" : "";
  chrome.windows.create(
    {
      url: chrome.runtime.getURL(`popup.html?detached=1&mode=${state.currentMode}${autostart}`),
      type: "popup",
      width: 980,
      height: 900,
      focused: true
    },
    () => {
      if (chrome.runtime.lastError) {
        showStatus("Could not open the studio window.", "error");
      }
    }
  );
}

function cleanupBeforeUnload() {
  if (state.liveStream) {
    state.liveStream.getTracks().forEach((track) => track.stop());
  }
  if (state.screenPreviewStream) {
    state.screenPreviewStream.getTracks().forEach((track) => track.stop());
  }
  state.captures.forEach(revokeCaptureUrl);
}
// ══════════════════════════════════════════
// SCREENSHOT MODE
// ══════════════════════════════════════════

function cleanupScreenshotMode() {
  // Remove injected mode-selector and preview-card elements
  const sel = document.querySelector(".screenshot-mode-selector");
  if (sel) sel.remove();
  const card = document.getElementById("screenshotPreviewCard");
  if (card) card.remove();
  // Restore the main preview card
  previewWrap.hidden = false;
  // Release any held object URL
  if (state.screenshotUrl) {
    URL.revokeObjectURL(state.screenshotUrl);
    state.screenshotUrl = null;
  }
  state.screenshotBlob = null;
}

function buildScreenshotMode() {
  controls.innerHTML = "";
  settingsBox.innerHTML = "";
  state.modeButtons = {};

  const modeSelector = document.createElement("div");
  modeSelector.className = "screenshot-mode-selector";

  const screenshotModes = [
    {
      id: "full",
      label: "Full Page",
      svgPath: '<rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18"></path><path d="M9 21V9"></path>'
    },
    {
      id: "visible",
      label: "Visible Area",
      svgPath: '<rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8"></path><path d="M12 17v4"></path>'
    }
  ];

  screenshotModes.forEach(({ id, label, svgPath }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "screenshot-mode-btn" + (state.screenshotMode === id ? " is-active" : "");
    btn.dataset.ssmode = id;

    const iconWrap = document.createElement("span");
    iconWrap.className = "screenshot-mode-btn__icon";
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.innerHTML = svgPath;
    iconWrap.appendChild(svg);

    const labelEl = document.createElement("span");
    labelEl.className = "screenshot-mode-btn__label";
    labelEl.textContent = label;

    btn.appendChild(iconWrap);
    btn.appendChild(labelEl);
    btn.addEventListener("click", () => {
      state.screenshotMode = id;
      document.querySelectorAll(".screenshot-mode-btn").forEach(b =>
        b.classList.toggle("is-active", b.dataset.ssmode === id)
      );
    });

    modeSelector.appendChild(btn);
  });

  const previewCard = document.createElement("div");
  previewCard.className = "screenshot-preview-card";
  previewCard.id = "screenshotPreviewCard";

  const previewPlaceholder = document.createElement("div");
  previewPlaceholder.className = "screenshot-preview-placeholder";
  previewPlaceholder.id = "screenshotPlaceholder";

  const phIcon = document.createElement("div");
  phIcon.className = "placeholder-state__icon";
  phIcon.innerHTML = ICONS.screenshot || "";

  const phText = document.createElement("p");
  phText.className = "placeholder-state__text";
  phText.textContent = "Choose a mode above and click Capture Screenshot.";

  previewPlaceholder.appendChild(phIcon);
  previewPlaceholder.appendChild(phText);
  previewCard.appendChild(previewPlaceholder);

  const captureBtn = makeButton("Capture Screenshot", "primary-button", "screenshotCaptureBtn");

  captureBtn.addEventListener("click", () => {
    captureBtn.textContent = "Capture Screenshot";
    void doScreenshot(previewCard, previewPlaceholder, captureBtn);
  });

  controls.parentNode.insertBefore(modeSelector, controls);
  controls.parentNode.insertBefore(previewCard, controls);

  controls.appendChild(captureBtn);

  previewWrap.hidden = true;

  state.modeButtons = { captureBtn };
}

function resetScreenshotPreview(previewCard, previewPlaceholder, captureBtn) {
  const existing = previewCard.querySelector("img");
  if (existing) existing.remove();

  if (state.screenshotUrl) {
    URL.revokeObjectURL(state.screenshotUrl);
    state.screenshotUrl = null;
  }
  state.screenshotBlob = null;

  previewPlaceholder.hidden = false;
  captureBtn.hidden    = false;
  captureBtn.disabled  = false;
  captureBtn.textContent = "Capture Screenshot";
  hideStatus();
}

// ── Tab guard helper ──────────────────────────────────────────────────────────
// Returns a friendly error string if the active tab cannot be screenshotted,
// or null if the tab is safe to capture.
async function getRestrictedTabReason() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return "No active tab found.";
    const url = tab.url;
    if (
      url.startsWith("chrome://") ||
      url.startsWith("chrome-extension://") ||
      url.startsWith("edge://") ||
      url.startsWith("about:") ||
      url.startsWith("devtools://") ||
      url.startsWith("view-source:")
    ) {
      return "Screenshots are not allowed on browser internal pages (chrome://, extension pages, etc.). Please navigate to a regular website and try again.";
    }
    return null;
  } catch (e) {
    return "Could not determine active tab: " + e.message;
  }
}

// doScreenshot — captures and immediately saves to gallery (no manual save step).
async function doScreenshot(previewCard, previewPlaceholder, captureBtn) {
  captureBtn.disabled = true;
  showStatus("Preparing screenshot…", "info");

  // ── Guard: reject restricted pages immediately, before any Chrome API call ──
  const restrictedReason = await getRestrictedTabReason();
  if (restrictedReason) {
    showStatus(restrictedReason, "error");
    captureBtn.disabled = false;
    return;
  }

  try {
    let blob;

    if (state.screenshotMode === "visible") {
      blob = await captureVisibleTab();
    } else if (state.screenshotMode === "full") {
      blob = await captureFullPage();
    } else {
      // area mode: injected selector returns null when user cancels
      blob = await captureAreaSelection();
    }

    if (!blob) {
      // User cancelled area selection — silently re-enable the button
      captureBtn.disabled = false;
      captureBtn.textContent = "Capture Screenshot";
      hideStatus();
      return;
    }

    // ── Show inline preview ──────────────────────────────────────────────────
    if (state.screenshotUrl) URL.revokeObjectURL(state.screenshotUrl);
    state.screenshotUrl = URL.createObjectURL(blob);

    previewPlaceholder.hidden = true;
    const previewImg = document.createElement("img");
    previewImg.src = state.screenshotUrl;
    previewImg.alt = "Screenshot preview";
    const existingImg = previewCard.querySelector("img");
    if (existingImg) existingImg.remove();
    previewCard.appendChild(previewImg);

    // ── Auto-save directly to gallery ────────────────────────────────────────
    showStatus("Saving to gallery…", "info");

    const id       = Date.now();
    const filename = `screenshot_${id}.png`;

    const captureRecord = {
      id,
      type:       "photo",
      filename,
      blob,
      createdAt:  id,
      sizeBytes:  blob.size,
      sourceMode: "screenshot"
    };

    try {
      if (state.db) await saveCaptureToDB(captureRecord);
    } catch (dbErr) {
      console.error("Auto-save screenshot error:", dbErr);
      showStatus("Screenshot captured but could not be saved to gallery.", "error");
      captureBtn.disabled = false;
      return;
    }

    const hydrated = hydrateCapture(captureRecord);
    state.captures.unshift(hydrated);
    renderGallery();
    updateAnnotateActionState();
    void updateMetrics();

    showStatus(`Saved to gallery — ${filename}`, "success");
    captureBtn.disabled   = false;
    captureBtn.textContent = "Capture Another";

  } catch (err) {
    console.error("Screenshot error:", err);
    const msg = err.message || "Unknown error";
    if (
      msg.includes("Cannot access") ||
      msg.includes("chrome://") ||
      msg.includes("extension://") ||
      msg.includes("restricted")
    ) {
      showStatus("Cannot screenshot this page. Navigate to a regular website and try again.", "error");
    } else {
      showStatus("Screenshot failed: " + msg, "error");
    }
    captureBtn.disabled = false;
  }
}

async function captureVisibleTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!dataUrl) {
        reject(new Error("No image data returned."));
        return;
      }
      dataUrlToBlob(dataUrl).then(resolve).catch(reject);
    });
  });
}

function dataUrlToBlob(dataUrl) {
  return new Promise((resolve, reject) => {
    try {
      const arr  = dataUrl.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      const u8arr = new Uint8Array(bstr.length);
      for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
      resolve(new Blob([u8arr], { type: mime }));
    } catch (e) {
      reject(e);
    }
  });
}


// ── Area-selection capture ────────────────────────────────────────────────────
// Uses chrome.storage.local as a reliable mailbox between the injected overlay
// (content-script context) and the popup.  No message-routing required.
//
//  Flow:
//  1. Clear any stale result key from storage.
//  2. Inject _injectAreaOverlay() into the active tab (synchronous, returns immediately).
//  3. Poll storage every 100 ms until the overlay writes its result.
//  4. Crop captureVisibleTab() output to the selected rectangle.
//  5. Return the cropped PNG Blob (doScreenshot saves it to the gallery).

const AREA_STORAGE_KEY = "__snapcam_area_result";

async function captureAreaSelection() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) throw new Error("No active tab found.");

  // 1. Clear any previous stale result
  await new Promise(r => chrome.storage.local.remove(AREA_STORAGE_KEY, r));

  showStatus("Switch to the page · drag to select an area · Esc to cancel", "info");

  // 2. Inject the overlay (fire-and-forget synchronous function)
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func:   _injectAreaOverlay,
      args:   [AREA_STORAGE_KEY]
    });
  } catch (e) {
    throw new Error("Cannot inject selector on this page. " + e.message);
  }

  // 3. Poll chrome.storage.local until the overlay writes its result (max 5 min)
  const POLL_MS    = 100;
  const TIMEOUT_MS = 5 * 60 * 1000;
  const deadline   = Date.now() + TIMEOUT_MS;

  const result = await new Promise((resolve) => {
    function poll() {
      if (Date.now() > deadline) { resolve({ cancelled: true }); return; }
      chrome.storage.local.get(AREA_STORAGE_KEY, (data) => {
        const val = data[AREA_STORAGE_KEY];
        if (val) {
          chrome.storage.local.remove(AREA_STORAGE_KEY);
          resolve(val);
        } else {
          setTimeout(poll, POLL_MS);
        }
      });
    }
    poll();
  });

  if (!result || result.cancelled) { hideStatus(); return null; }

  const { x, y, w, h, dpr } = result;

  // 4. Give the page a moment to repaint after overlay removal, then capture
  await new Promise(r => setTimeout(r, 300));

  const dataUrl = await new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (url) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(url);
    });
  });

  if (!dataUrl) throw new Error("captureVisibleTab returned no data.");

  // 5. Crop to the selected region
  const fullBlob   = await dataUrlToBlob(dataUrl);
  const fullBitmap = await createImageBitmap(fullBlob);

  // Coordinates from the overlay are CSS-pixels relative to viewport top-left.
  // captureVisibleTab outputs physical pixels, so multiply by dpr.
  const relX  = Math.round(x * dpr);
  const relY  = Math.round(y * dpr);
  const cropW = Math.min(Math.round(w * dpr), fullBitmap.width  - relX);
  const cropH = Math.min(Math.round(h * dpr), fullBitmap.height - relY);

  fullBitmap.close();

  if (cropW <= 0 || cropH <= 0) {
    throw new Error("Selection is out of bounds — please try again.");
  }

  // Reuse the hidden shared canvas
  canvas.width  = cropW;
  canvas.height = cropH;
  const cropCtx = canvas.getContext("2d");

  // Redraw from the full bitmap
  const fullBitmap2 = await createImageBitmap(fullBlob);
  cropCtx.drawImage(fullBitmap2, relX, relY, cropW, cropH, 0, 0, cropW, cropH);
  fullBitmap2.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      canvas.width = 0; canvas.height = 0;
      if (blob) resolve(blob);
      else reject(new Error("Crop canvas export failed."));
    }, "image/png");
  });
}

// ── _injectAreaOverlay ────────────────────────────────────────────────────────
// Injected verbatim into the active tab.  MUST be self-contained.
// Writes result to chrome.storage.local under the key passed as storageKey.
// Result shape: { x, y, w, h, dpr }  or  { cancelled: true }
function _injectAreaOverlay(storageKey) {
  if (document.__snapcamAreaOverlayActive) return;
  document.__snapcamAreaOverlayActive = true;

  const dpr = window.devicePixelRatio || 1;

  // Build overlay elements
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;cursor:crosshair;" +
    "background:rgba(0,0,0,0.4);user-select:none;-webkit-user-select:none";

  const selBox = document.createElement("div");
  selBox.style.cssText =
    "position:fixed;border:2px solid #2563eb;background:rgba(37,99,235,0.15);" +
    "box-shadow:0 0 0 2px rgba(255,255,255,0.4);pointer-events:none;" +
    "display:none;z-index:2147483648";

  const hint = document.createElement("div");
  hint.textContent = "Drag to select area  ·  Esc to cancel";
  hint.style.cssText =
    "position:fixed;top:20px;left:50%;transform:translateX(-50%);" +
    "background:rgba(10,10,20,0.9);color:#fff;" +
    "font:700 13px/1.4 system-ui,sans-serif;" +
    "padding:10px 24px;border-radius:999px;" +
    "pointer-events:none;white-space:nowrap;" +
    "z-index:2147483649;border:1px solid rgba(255,255,255,0.2);" +
    "box-shadow:0 4px 20px rgba(0,0,0,0.5)";

  const sizeLabel = document.createElement("div");
  sizeLabel.style.cssText =
    "position:fixed;background:rgba(10,10,20,0.85);color:#a5b4fc;" +
    "font:600 11px/1 monospace;padding:4px 10px;border-radius:5px;" +
    "pointer-events:none;display:none;z-index:2147483649";

  document.body.appendChild(overlay);
  document.body.appendChild(selBox);
  document.body.appendChild(hint);
  document.body.appendChild(sizeLabel);

  var startX = 0, startY = 0, dragging = false;

  function cleanup() {
    document.__snapcamAreaOverlayActive = false;
    overlay.remove(); selBox.remove(); hint.remove(); sizeLabel.remove();
    document.removeEventListener("keydown", onKey, true);
  }

  function writeResult(val) {
    var obj = {};
    obj[storageKey] = val;
    chrome.storage.local.set(obj);
  }

  overlay.addEventListener("mousedown", function(e) {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    selBox.style.left = startX + "px"; selBox.style.top = startY + "px";
    selBox.style.width = "0"; selBox.style.height = "0";
    selBox.style.display = "block";
    sizeLabel.style.display = "block";
  }, true);

  overlay.addEventListener("mousemove", function(e) {
    if (!dragging) return;
    var x = Math.min(e.clientX, startX), y = Math.min(e.clientY, startY);
    var w = Math.abs(e.clientX - startX),  h = Math.abs(e.clientY - startY);
    selBox.style.left = x + "px"; selBox.style.top = y + "px";
    selBox.style.width = w + "px"; selBox.style.height = h + "px";
    sizeLabel.textContent = Math.round(w) + " × " + Math.round(h) + " px";
    sizeLabel.style.left = Math.min(e.clientX + 14, window.innerWidth  - 130) + "px";
    sizeLabel.style.top  = Math.min(e.clientY + 14, window.innerHeight -  30) + "px";
  }, true);

  overlay.addEventListener("mouseup", function(e) {
    if (!dragging) return;
    dragging = false;
    var x = Math.min(e.clientX, startX), y = Math.min(e.clientY, startY);
    var w = Math.abs(e.clientX - startX),  h = Math.abs(e.clientY - startY);
    cleanup();
    if (w < 10 || h < 10) { writeResult({ cancelled: true }); return; }
    writeResult({ x: x, y: y, w: w, h: h, dpr: dpr });
  }, true);

  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault(); e.stopPropagation();
      cleanup();
      writeResult({ cancelled: true });
    }
  }
  document.addEventListener("keydown", onKey, true);
}

// ── captureFullPage ───────────────────────────────────────────────────────────
// Scrolls the active tab in viewport-sized steps, captures each tile with
// captureVisibleTab, stitches them onto a canvas, and returns a PNG Blob.
async function captureFullPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) throw new Error("No active tab found.");

  // 1. Read page geometry
  let info;
  try {
    [info] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        totalH:  document.documentElement.scrollHeight,
        totalW:  document.documentElement.scrollWidth,
        vpH:     window.innerHeight,
        vpW:     window.innerWidth,
        dpr:     window.devicePixelRatio || 1,
        origX:   window.scrollX,
        origY:   window.scrollY
      })
    });
  } catch (e) {
    throw new Error("Cannot access this page. " + e.message);
  }

  const { totalH, totalW, vpH, vpW, dpr, origX, origY } = info.result;

  // 2. Short page — single capture
  if (totalH <= vpH + 4 && totalW <= vpW + 4) {
    return captureVisibleTab();
  }

  showStatus("Capturing full page — scrolling…", "info");

  // 3. Prepare canvas (Chrome hard-limits canvas at 32 767 px per side)
  const MAX = 32767;
  const cW = Math.min(Math.round(totalW * dpr), MAX);
  const cH = Math.min(Math.round(totalH * dpr), MAX);
  canvas.width  = cW;
  canvas.height = cH;
  const ctx = canvas.getContext("2d");

  // 4. Build unique scroll-position list
  const maxSY = Math.max(0, totalH - vpH);
  const maxSX = Math.max(0, totalW  - vpW);
  const seen = new Set();
  const steps = [];
  for (let gy = 0; gy < totalH; gy += vpH) {
    for (let gx = 0; gx < totalW; gx += vpW) {
      const sy = Math.min(gy, maxSY);
      const sx = Math.min(gx, maxSX);
      const key = sx + "," + sy;
      if (!seen.has(key)) { seen.add(key); steps.push({ sx, sy }); }
    }
  }

  const total = steps.length;
  let done = 0;

  // 5. Scroll → settle → capture → draw
  for (const { sx, sy } of steps) {
    // Scroll the tab to this position
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (x, y) => window.scrollTo(x, y),
      args: [sx, sy]
    });

    // Wait for repaint (sticky headers / lazy images need time)
    await new Promise(r => setTimeout(r, 220));

    // Capture whatever is now visible
    const dataUrl = await new Promise((resolve, reject) => {
      chrome.tabs.captureVisibleTab(null, { format: "png" }, (url) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(url);
      });
    });

    // Draw tile at the scroll-offset position (physical pixels)
    const img = await createImageBitmap(await dataUrlToBlob(dataUrl));
    ctx.drawImage(img, Math.round(sx * dpr), Math.round(sy * dpr));
    img.close();

    done++;
    showStatus("Stitching full page — tile " + done + " / " + total + "…", "info");
  }

  // 6. Restore original scroll position
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (x, y) => window.scrollTo(x, y),
    args: [origX, origY]
  });

  // 7. Export PNG blob from the DOM canvas
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      canvas.width = 0; canvas.height = 0;
      if (blob) resolve(blob);
      else reject(new Error("Canvas export failed — page may be too large."));
    }, "image/png");
  });
}