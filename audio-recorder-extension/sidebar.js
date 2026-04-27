// sidebar.js — Main sidebar controller. No innerHTML, no eval. CSP-compliant.
(function () {
  'use strict';

  /* ── State ───────────────────────────────────────────────────────────── */
  let currentTabId = null;
  let currentMode = 'tab';
  let timerInterval = null;
  let recordingStartTime = null;
  let maxDurationTimer = null;
  let levelThrottleTimer = null;
  let micPermissionGranted = false;
  let liveWaveActive = false;
  let liveWaveRaf = null;
  let liveWavePeaks = new Float32Array(180);
  let liveWavePos = 0;

  // Per-card audio players: { recId: { el: Audio, objUrl: string, playing: bool } }
  const players = {};

  // Trim state
  let trimRec = null;
  let trimBlob = null;
  let trimAudioBuffer = null;
  let trimDuration = 0;
  let trimStartSec = 0;
  let trimEndSec = 0;
  let trimDragging = null; // 'start' | 'end'
  let confirmAction = null;

  /* ── DOM refs ────────────────────────────────────────────────────────── */
  const $ = (id) => document.getElementById(id);
  const el = {
    app:              $('app'),
    permissionGate:   $('permissionGate'),
    pgTitle:          $('pgTitle'),
    pgDesc:           $('pgDesc'),
    pgGrantBtn:       $('pgGrantBtn'),
    pgSkipBtn:        $('pgSkipBtn'),
    pgError:          $('pgError'),
    themeToggle:      $('themeToggle'),
    themeToggleIcon:  $('themeToggleIcon'),
    themeToggleText:  $('themeToggleText'),
    resumeStagedBtn:  $('resumeStagedBtn'),
    statusPill:       $('statusPill'),
    statusLabel:      $('statusLabel'),
    statusDot:        $('statusDot'),
    modeTab:          $('modeTab'),
    modeMic:          $('modeMic'),
    modeBoth:         $('modeBoth'),
    timer:            $('timer'),
    timerBlock:       $('timerBlock'),
    timerSub:         $('timerSub'),
    levelFill:        $('levelFill'),
    levelDb:          $('levelDb'),
    liveCanvas:       $('liveCanvas'),
    startBtn:         $('startBtn'),
    pauseBtn:         $('pauseBtn'),
    stopBtn:          $('stopBtn'),
    pauseIcon:        $('pauseIcon'),
    pauseLabel:       $('pauseLabel'),
    qsToggle:         $('qsToggle'),
    qsBody:           $('qsBody'),
    qsRefreshDevices: $('qsRefreshDevices'),
    audioDevice:      $('audioDevice'),
    audioDeviceHint:  $('audioDeviceHint'),
    mixBlock:         $('mixBlock'),
    mixMic:           $('mixMic'),
    mixTab:           $('mixTab'),
    mixMicPct:        $('mixMicPct'),
    mixTabPct:        $('mixTabPct'),
    mixMicReset:      $('mixMicReset'),
    mixTabReset:      $('mixTabReset'),
    completePanel:    $('completePanel'),
    completeOverlay:  $('completeOverlay'),
    completeName:     $('completeName'),
    completeNameHint: $('completeNameHint'),
    completeCanvas:   $('completeCanvas'),
    completeRange:    $('completeRange'),
    completeHandleStart: $('completeHandleStart'),
    completeHandleEnd:   $('completeHandleEnd'),
    completeSelection:   $('completeSelection'),
    completePlay:     $('completePlay'),
    completeTimeCur:  $('completeTimeCur'),
    completeTimeTot:  $('completeTimeTot'),
    completeVol:      $('completeVol'),
    completeCrop:     $('completeCrop'),
    completeCropBox:  $('completeCropBox'),
    cropReset:        $('cropReset'),
    cropCancel:       $('cropCancel'),
    cropApply:        $('cropApply'),
    cropSelStart:     $('cropSelStart'),
    cropSelEnd:       $('cropSelEnd'),
    cropSelDur:       $('cropSelDur'),
    completeSave:     $('completeSave'),
    completeDiscard:  $('completeDiscard'),
    recordingsList:   $('recordingsList'),
    searchInput:      $('searchInput'),
    clearBtn:         $('clearBtn'),
    exportFormat:     $('exportFormat'),
    maxDuration:      $('maxDuration'),
    openSettingsBtn:  $('openSettingsBtn'),
    storageUsedText:  $('storageUsedText'),
    storageUsedBar:   $('storageUsedBar'),
    toastContainer:   $('toastContainer'),
    trimModal:        $('trimModal'),
    trimClose:        $('trimClose'),
    trimCanvas:       $('trimCanvas'),
    trimHandleStart:  $('trimHandleStart'),
    trimHandleEnd:    $('trimHandleEnd'),
    trimSelection:    $('trimSelection'),
    trimStart:        $('trimStart'),
    trimEnd:          $('trimEnd'),
    trimPreview:      $('trimPreview'),
    trimAudio:        $('trimAudio'),
    trimCancel:       $('trimCancel'),
    trimApply:        $('trimApply'),
    confirmModal:     $('confirmModal'),
    confirmMsg:       $('confirmMsg'),
    confirmOk:        $('confirmOk'),
    confirmCancel:    $('confirmCancel'),
    settingsModal:       $('settingsModal'),
    settingsCloseBtn:    $('settingsCloseBtn'),
    settingsDone:        $('settingsDone'),
    settingsExportFormat:$('settingsExportFormat'),
    settingsTheme:       $('settingsTheme'),
    settingsMaxDuration: $('settingsMaxDuration'),
    settingsSaveHistory: $('settingsSaveHistory'),
    settingsMaxStorage:  $('settingsMaxStorage'),
    settingsStorageUsed: $('settingsStorageUsed'),
    settingsStorageBar:  $('settingsStorageBar'),
    settingsClearHistory:$('settingsClearHistory')
  };

  /* ── Init ─────────────────────────────────────────────────────────────── */
  async function init() {
    await getCurrentTab();
    await checkMicPermission();
    await loadSettings();
    initQuickSettingsUI();
    await loadAudioDevices();
    await loadStagedRecording(false);
    await loadHistory();
    await refreshStorageStats();
    await refreshStatus();
    updateMixerVisibility();
    onMixChange();
    bindEvents();
    setInterval(refreshStatus, 2500);
    chrome.runtime.onMessage.addListener(handleBgMessage);
  }

  /* ── Permission gate ─────────────────────────────────────────────────── */
  async function checkMicPermission() {
    const res = await bg('getMicPermission');
    micPermissionGranted = res?.granted === true;

    if (!micPermissionGranted) {
      DOMHelpers.show(el.permissionGate);
      DOMHelpers.hide(el.app);
    } else {
      DOMHelpers.hide(el.permissionGate);
      DOMHelpers.show(el.app);
    }
  }

  async function handleGrantMic() {
    el.pgGrantBtn.disabled = true;
    el.pgGrantBtn.textContent = 'Requesting...';
    DOMHelpers.hide(el.pgError);

    try {
      // Use offscreen context for permission probing to match real recording path.
      const res = await bg('probeMicPermission');
      if (!res?.success) {
        throw Object.assign(new Error(res?.error || 'Microphone permission failed'), {
          name: res?.name || 'NotAllowedError'
        });
      }

      micPermissionGranted = true;
      await bg('setMicPermission', { granted: true });
      DOMHelpers.hide(el.permissionGate);
      DOMHelpers.show(el.app);
      toast('Microphone access granted', 'success');
    } catch (err) {
      micPermissionGranted = false;
      el.pgGrantBtn.disabled = false;
      el.pgGrantBtn.textContent = 'Allow Microphone Access';
      el.pgError.textContent = err.name === 'NotAllowedError'
        ? 'Microphone blocked. Allow mic for this extension and also check system-level mic permission, then try again.'
        : 'Could not access microphone: ' + err.message;
      DOMHelpers.show(el.pgError);
    }
  }

  function handleSkipPermission() {
    micPermissionGranted = false;
    DOMHelpers.hide(el.permissionGate);
    DOMHelpers.show(el.app);
  }

  /* ── Tab detection ────────────────────────────────────────────────────── */
  async function getCurrentTab() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) currentTabId = tabs[0].id;
    } catch (_) {}
  }

  /* ── Background messaging helper ─────────────────────────────────────── */
  function bg(action, extra) {
    return chrome.runtime.sendMessage({ action, ...extra });
  }

  /* ── Status refresh ───────────────────────────────────────────────────── */
  async function refreshStatus() {
    try {
      const status = await bg('status');
      if (status) applyStatus(status);
    } catch (_) {}
  }

  function applyStatus(status) {
    const { recording, paused, startedAt, mode, level } = status;
    currentMode = mode || currentMode;
    syncModeBtns();

    if (recording && !liveWaveActive) {
      liveWaveActive = true;
      resetLiveWave();
    } else if (!recording && liveWaveActive) {
      liveWaveActive = false;
      resetLiveWave();
    }

    if (recording) {
      el.startBtn.disabled = true;
      el.pauseBtn.disabled = false;
      el.stopBtn.disabled  = false;
      el.modeTab.disabled  = true;
      el.modeMic.disabled  = true;
      el.modeBoth.disabled = true;

      el.statusPill.className = 'status-pill ' + (paused ? 'paused' : 'recording');
      el.statusLabel.textContent = paused ? 'Paused' : 'Recording';
      el.timerBlock.className = 'timer-block ' + (paused ? 'paused' : 'recording');
      el.timerSub.textContent = paused ? 'Recording paused' : 'Recording in progress';

      updatePauseBtn(paused);

      if (startedAt && startedAt !== recordingStartTime) {
        recordingStartTime = startedAt;
        startTimer();
      }
      if (paused) { renderTimer(); stopTimer(false); }
      else if (!timerInterval) startTimer();

      if (typeof level === 'number') updateLevel(level, false);
    } else {
      el.startBtn.disabled = false;
      el.pauseBtn.disabled = true;
      el.stopBtn.disabled  = true;
      el.modeTab.disabled  = false;
      el.modeMic.disabled  = false;
      el.modeBoth.disabled = false;

      el.statusPill.className = 'status-pill idle';
      el.statusLabel.textContent = 'Idle';
      el.timerBlock.className = 'timer-block';
      el.timerSub.textContent = 'Ready to record';

      stopTimer();
      updateLevel(0, false);
    }
  }

  function resetLiveWave() {
    if (!el.liveCanvas) return;
    liveWavePeaks.fill(0);
    liveWavePos = 0;
    drawLiveWave();
  }

  function pushLivePeak(peak) {
    if (!el.liveCanvas || !liveWaveActive) return;
    const p = Math.max(0, Math.min(1, Number(peak) || 0));
    liveWavePeaks[liveWavePos] = Math.pow(p, 0.72);
    liveWavePos = (liveWavePos + 1) % liveWavePeaks.length;
    scheduleLiveWaveDraw();
  }

  function scheduleLiveWaveDraw() {
    if (liveWaveRaf) return;
    liveWaveRaf = requestAnimationFrame(() => {
      liveWaveRaf = null;
      drawLiveWave();
    });
  }

  function drawLiveWave() {
    const canvas = el.liveCanvas;
    if (!canvas) return;
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2563EB';
    prepareCanvas(canvas, 44);
    const ordered = new Float32Array(liveWavePeaks.length);
    ordered.set(liveWavePeaks.subarray(liveWavePos));
    ordered.set(liveWavePeaks.subarray(0, liveWavePos), liveWavePeaks.length - liveWavePos);
    drawWaveBars(canvas, ordered, { color: primary, baselineAlpha: 0.22 });
  }

  /* ── Event bindings ───────────────────────────────────────────────────── */
  function bindEvents() {
    el.pgGrantBtn.addEventListener('click', handleGrantMic);
    el.pgSkipBtn.addEventListener('click', handleSkipPermission);

    if (el.themeToggle) el.themeToggle.addEventListener('click', toggleTheme);
    if (el.resumeStagedBtn) el.resumeStagedBtn.addEventListener('click', () => { if (staged?.id) showStaged(staged, true); });

    el.startBtn.addEventListener('click', onStartClick);
    el.pauseBtn.addEventListener('click', onPauseClick);
    el.stopBtn.addEventListener('click', onStopClick);

    [el.modeTab, el.modeMic, el.modeBoth].forEach(btn => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    el.searchInput.addEventListener('input', loadHistory);
    el.clearBtn.addEventListener('click', confirmClearHistory);
    el.exportFormat.addEventListener('change', saveSettings);
    el.maxDuration.addEventListener('change', saveSettings);
    el.openSettingsBtn.addEventListener('click', openSettingsModal);
    el.settingsCloseBtn.addEventListener('click', closeSettingsModal);
    el.settingsDone.addEventListener('click', closeSettingsModal);
    el.settingsExportFormat.addEventListener('change', syncSettingsFromModal);
    el.settingsTheme.addEventListener('change', syncSettingsFromModal);
    el.settingsMaxDuration.addEventListener('change', syncSettingsFromModal);
    el.settingsSaveHistory.addEventListener('change', syncSettingsFromModal);
    el.settingsMaxStorage.addEventListener('change', syncSettingsFromModal);
    el.settingsClearHistory.addEventListener('click', () => {
      closeSettingsModal();
      confirmClearHistory();
    });

    // Trim modal
    el.trimClose.addEventListener('click', closeTrimModal);
    el.trimCancel.addEventListener('click', closeTrimModal);
    el.trimApply.addEventListener('click', applyTrim);
    el.trimStart.addEventListener('input', onTrimInputChange);
    el.trimEnd.addEventListener('input', onTrimInputChange);

    el.trimHandleStart.addEventListener('mousedown', (e) => startTrimDrag(e, 'start'));
    el.trimHandleEnd.addEventListener('mousedown', (e) => startTrimDrag(e, 'end'));
    document.addEventListener('mousemove', onTrimDragMove);
    document.addEventListener('mouseup', onTrimDragEnd);

    // Confirm modal
    el.confirmCancel.addEventListener('click', closeConfirmModal);

    // Quick settings
    if (el.qsToggle) el.qsToggle.addEventListener('click', toggleQuickSettings);
    if (el.qsRefreshDevices) el.qsRefreshDevices.addEventListener('click', loadAudioDevices);
    if (el.audioDevice) el.audioDevice.addEventListener('change', saveSettings);
    document.querySelectorAll('.format-card').forEach(btn => {
      btn.addEventListener('click', () => setExportFormat(btn.dataset.format || 'webm'));
    });

    // Mixer (Tab + Mic)
    if (el.mixMic) el.mixMic.addEventListener('input', onMixChange);
    if (el.mixTab) el.mixTab.addEventListener('input', onMixChange);
    if (el.mixMicReset) el.mixMicReset.addEventListener('click', () => setMixDefaults('mic'));
    if (el.mixTabReset) el.mixTabReset.addEventListener('click', () => setMixDefaults('tab'));

    // Recording complete panel
    if (el.completePlay) el.completePlay.addEventListener('click', toggleCompletePlay);
    if (el.completeVol) el.completeVol.addEventListener('input', onCompleteVol);
    if (el.completeCrop) el.completeCrop.addEventListener('click', toggleCropMode);
    if (el.completeSave) el.completeSave.addEventListener('click', saveStagedFromPanel);
    if (el.completeDiscard) el.completeDiscard.addEventListener('click', discardStaged);
    if (el.completeName) el.completeName.addEventListener('input', () => { if (el.completeNameHint) el.completeNameHint.textContent = '"' + buildStagedFilenameFromInput() + '"'; });
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => setCompleteSpeed(btn.dataset.speed));
    });
    if (el.cropReset) el.cropReset.addEventListener('click', resetCrop);
    if (el.cropCancel) el.cropCancel.addEventListener('click', exitCropMode);
    if (el.cropApply) el.cropApply.addEventListener('click', applyCropInline);

    if (el.completeHandleStart) el.completeHandleStart.addEventListener('mousedown', (e) => startCropDrag(e, 'start'));
    if (el.completeHandleEnd) el.completeHandleEnd.addEventListener('mousedown', (e) => startCropDrag(e, 'end'));
    document.addEventListener('mousemove', onCropDragMove);
    document.addEventListener('mouseup', onCropDragEnd);
  }

  /* ── Mode ─────────────────────────────────────────────────────────────── */
  function setMode(mode) {
    if (!el.startBtn.disabled) {
      currentMode = mode;
      syncModeBtns();
    }
  }

  function syncModeBtns() {
    [el.modeTab, el.modeMic, el.modeBoth].forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === currentMode);
    });
    updateMixerVisibility();
  }

  function updateMixerVisibility() {
    if (!el.mixBlock) return;
    if (currentMode === 'tab+mic') DOMHelpers.show(el.mixBlock);
    else DOMHelpers.hide(el.mixBlock);
  }

  /* ── Recording controls ───────────────────────────────────────────────── */
  async function onStartClick() {
    if ((currentMode === 'mic' || currentMode === 'tab+mic') && !micPermissionGranted) {
      // Re-show permission gate
      DOMHelpers.show(el.permissionGate);
      DOMHelpers.hide(el.app);
      el.pgTitle.textContent = 'Microphone Required';
      el.pgDesc.textContent = 'This recording mode needs microphone access. Grant permission to continue.';
      return;
    }

    if ((currentMode === 'tab' || currentMode === 'tab+mic') && !currentTabId) {
      toast('No active tab detected', 'error'); return;
    }

    el.startBtn.disabled = true;
    try {
      const res = await bg('start', { tabId: currentTabId, mode: currentMode });
      if (res?.success) {
        toast('Recording started', 'success');
        scheduleMaxDuration();
        await refreshStatus();
      } else {
        toast(res?.error || 'Failed to start recording', 'error');
        el.startBtn.disabled = false;
      }
    } catch (e) {
      toast(e.message, 'error');
      el.startBtn.disabled = false;
    }
  }

  async function onPauseClick() {
    const isPaused = el.pauseLabel.textContent === 'Resume';
    const action = isPaused ? 'resume' : 'pause';
    try {
      const res = await bg(action);
      if (res?.success) {
        toast(isPaused ? 'Resumed' : 'Paused', 'info');
        await refreshStatus();
      } else {
        toast(res?.error || 'Failed', 'error');
      }
    } catch (e) { toast(e.message, 'error'); }
  }

  async function onStopClick() {
    el.stopBtn.disabled = true;
    clearMaxDuration();
    try {
      const res = await bg('stop');
      if (res?.success) {
        toast('Stopping — processing...', 'info');
        await refreshStatus();
      } else {
        toast(res?.error || 'Stop failed', 'error');
        el.stopBtn.disabled = false;
      }
    } catch (e) {
      toast(e.message, 'error');
      el.stopBtn.disabled = false;
    }
  }

  function updatePauseBtn(isPaused) {
    el.pauseLabel.textContent = isPaused ? 'Resume' : 'Pause';
    DOMHelpers.clearElement(el.pauseIcon);
    if (isPaused) {
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('points', '5 3 19 12 5 21 5 3');
      poly.setAttribute('fill', 'currentColor');
      el.pauseIcon.appendChild(poly);
    } else {
      ['6','14'].forEach(x => {
        const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r.setAttribute('x', x); r.setAttribute('y', '4');
        r.setAttribute('width', '4'); r.setAttribute('height', '16');
        el.pauseIcon.appendChild(r);
      });
    }
  }

  /* ── Level meter ──────────────────────────────────────────────────────── */
  function updateLevel(level, throttle) {
    if (throttle) {
      if (levelThrottleTimer) return;
      levelThrottleTimer = setTimeout(() => { levelThrottleTimer = null; }, 100);
    }
    const pct = Math.round(level * 100);
    el.levelFill.style.width = pct + '%';
    el.levelFill.className = 'level-fill' + (pct > 90 ? ' hot' : pct > 70 ? ' warn' : '');
    const db = level > 0 ? Math.max(-60, Math.round(20 * Math.log10(level))) : null;
    el.levelDb.textContent = db !== null ? db + ' dB' : '— dB';
  }

  /* ── Timer ────────────────────────────────────────────────────────────── */
  function startTimer() {
    stopTimer(false);
    renderTimer();
    timerInterval = setInterval(renderTimer, 1000);
  }

  function stopTimer(reset) {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    if (reset !== false) {
      recordingStartTime = null;
      el.timer.textContent = '00:00:00';
    }
  }

  function renderTimer() {
    if (!recordingStartTime) return;
    el.timer.textContent = Formatters.formatTime(Date.now() - recordingStartTime);
  }

  /* ── Max duration ─────────────────────────────────────────────────────── */
  function scheduleMaxDuration() {
    clearMaxDuration();
    const mins = parseInt(el.maxDuration.value) || 0;
    if (mins > 0) {
      maxDurationTimer = setTimeout(() => {
        toast('Max duration reached — stopping', 'warning');
        onStopClick();
      }, mins * 60 * 1000);
    }
  }

  function clearMaxDuration() {
    if (maxDurationTimer) { clearTimeout(maxDurationTimer); maxDurationTimer = null; }
  }

  /* ── History ──────────────────────────────────────────────────────────── */
  async function loadHistory() {
    try {
      const recs = await bg('getHistory');
      const list = Array.isArray(recs) ? recs : [];
      const term = (el.searchInput.value || '').toLowerCase().trim();
      const filtered = term ? list.filter(r => r.filename.toLowerCase().includes(term)) : list;
      renderHistory(filtered);
    } catch (_) {
      renderHistory([]);
    }
  }

  function renderHistory(recordings) {
    DOMHelpers.clearElement(el.recordingsList);

    if (!recordings.length) {
      const wrap = document.createElement('div');
      wrap.className = 'empty-state';
      const icon = buildEmptyIcon();
      const p = document.createElement('p');
      p.textContent = 'No recordings yet';
      const sm = document.createElement('small');
      sm.textContent = 'Start recording to see files here';
      wrap.appendChild(icon);
      wrap.appendChild(p);
      wrap.appendChild(sm);
      el.recordingsList.appendChild(wrap);
      return;
    }

    const fragment = document.createDocumentFragment();
    recordings.forEach(rec => fragment.appendChild(buildRecCard(rec)));
    el.recordingsList.appendChild(fragment);
  }

  function buildRecCard(rec) {
    const card = document.createElement('div');
    card.className = 'rec-card';
    card.dataset.recId = rec.id;

    // Header
    const header = document.createElement('div');
    header.className = 'rec-card-header';

    const fname = document.createElement('div');
    fname.className = 'rec-filename';
    fname.textContent = rec.filename;

    const actions = document.createElement('div');
    actions.className = 'rec-actions';

    // Play button
    const playBtn = makeRecBtn(iconPlay(), 'Play preview', 'primary');
    playBtn.addEventListener('click', () => toggleCardPlay(rec, playBtn, card));

    // Trim button
    const trimBtn = makeRecBtn(iconTrim(), 'Trim recording', '');
    trimBtn.addEventListener('click', () => openTrimModal(rec));

    // Download/show button
    const dlBtn = makeRecBtn(iconDownload(), 'Show in folder', '');
    dlBtn.addEventListener('click', () => showFile(rec.id));

    // Delete button
    const delBtn = makeRecBtn(iconDelete(), 'Delete', 'danger');
    delBtn.addEventListener('click', () => confirmDelete(rec.id, rec.filename));

    actions.appendChild(playBtn);
    actions.appendChild(trimBtn);
    actions.appendChild(dlBtn);
    actions.appendChild(delBtn);

    header.appendChild(fname);
    header.appendChild(actions);

    // Meta row
    const meta = document.createElement('div');
    meta.className = 'rec-meta';

    meta.appendChild(metaItem(Formatters.formatDuration(rec.duration || 0)));
    meta.appendChild(metaSep());
    meta.appendChild(metaItem(Formatters.formatSize(rec.size || 0)));
    meta.appendChild(metaSep());
    meta.appendChild(metaItem(Formatters.formatDate(rec.timestamp)));

    const modeClass = rec.mode === 'mic' ? 'mic' : rec.mode === 'tab+mic' ? 'both' : 'tab';
    const modeLabel = rec.mode === 'mic' ? 'MIC' : rec.mode === 'tab+mic' ? 'TAB+MIC' : 'TAB';
    const badge = document.createElement('span');
    badge.className = 'rec-badge ' + modeClass;
    badge.textContent = modeLabel;
    meta.appendChild(badge);

    if (rec.format && rec.format !== 'webm') {
      const fmtBadge = document.createElement('span');
      fmtBadge.className = 'rec-badge';
      fmtBadge.textContent = rec.format.toUpperCase();
      meta.appendChild(fmtBadge);
    }

    // Player (hidden until play clicked)
    const player = document.createElement('div');
    player.className = 'rec-player';
    player.dataset.recId = rec.id;

    const track = document.createElement('div');
    track.className = 'rec-player-track';
    track.addEventListener('click', (e) => seekCardPlayer(rec.id, e, track));

    const fill = document.createElement('div');
    fill.className = 'rec-player-fill';
    fill.id = 'pfill_' + rec.id;
    track.appendChild(fill);

    const times = document.createElement('div');
    times.className = 'rec-player-times';
    const tLeft = document.createElement('span');
    tLeft.id = 'ptime_' + rec.id;
    tLeft.textContent = '0:00';
    const tRight = document.createElement('span');
    tRight.textContent = Formatters.formatDuration(rec.duration || 0);
    times.appendChild(tLeft);
    times.appendChild(tRight);

    player.appendChild(track);
    player.appendChild(times);

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(player);

    return card;
  }

  /* ── Card player ──────────────────────────────────────────────────────── */
  async function toggleCardPlay(rec, btn, card) {
    const playerId = rec.id;
    const player = card.querySelector('.rec-player');

    if (players[playerId] && players[playerId].playing) {
      // Pause
      players[playerId].el.pause();
      players[playerId].playing = false;
      setIconPlay(btn);
      return;
    }

    // If another player is going, stop it
    Object.keys(players).forEach(id => {
      if (players[id].playing) {
        players[id].el.pause();
        players[id].playing = false;
        // Reset its button
        const otherCard = el.recordingsList.querySelector('[data-rec-id="' + id + '"]');
        if (otherCard) {
          const otherBtn = otherCard.querySelector('.rec-actions .primary');
          if (otherBtn) setIconPlay(otherBtn);
          const otherPlayer = otherCard.querySelector('.rec-player');
          if (otherPlayer) otherPlayer.classList.remove('visible');
        }
      }
    });

    if (!players[playerId]) {
      const ready = await ensurePlayerLoaded(rec);
      if (!ready) return;
    }

    player.classList.add('visible');
    players[playerId].el.play().then(() => {
      players[playerId].playing = true;
      setIconPause(btn);
    }).catch(err => {
      toast('Playback error: ' + err.message, 'error');
    });
  }

  async function ensurePlayerLoaded(rec) {
    if (players[rec.id]) return true;
    try {
      const payload = await bg('getRecordingData', { id: rec.id });
      if (!payload?.success || !payload?.data) {
        toast('Recording preview not available for this file', 'error');
        return false;
      }
      const blob = base64ToBlob(payload.data, payload.mimeType || rec.mimeType || 'audio/webm');
      registerCardPlayer(rec.id, blob, rec.duration || 0);
      return true;
    } catch (e) {
      toast('Could not load recording: ' + e.message, 'error');
      return false;
    }
  }

  function seekCardPlayer(recId, e, track) {
    const p = players[recId];
    if (!p) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    p.el.currentTime = ratio * (p.el.duration || 0);
  }

  function registerCardPlayer(recId, blob, duration) {
    if (players[recId]) {
      players[recId].el.pause();
      URL.revokeObjectURL(players[recId].objUrl);
    }
    const objUrl = URL.createObjectURL(blob);
    const audio = new Audio();
    audio.src = objUrl;

    audio.addEventListener('timeupdate', () => {
      const cur = audio.currentTime;
      const total = audio.duration || duration;
      const pct = total > 0 ? (cur / total) * 100 : 0;
      const fill = document.getElementById('pfill_' + recId);
      const timeEl = document.getElementById('ptime_' + recId);
      if (fill) fill.style.width = pct + '%';
      if (timeEl) timeEl.textContent = Formatters.formatDuration(cur);
    });

    audio.addEventListener('ended', () => {
      players[recId].playing = false;
      const fill = document.getElementById('pfill_' + recId);
      if (fill) fill.style.width = '0%';
      // Reset play button
      const card = el.recordingsList.querySelector('[data-rec-id="' + recId + '"]');
      if (card) {
        const btn = card.querySelector('.rec-actions .primary');
        if (btn) setIconPlay(btn);
      }
    });

    players[recId] = { el: audio, objUrl, playing: false, duration };
  }

  /* ── File actions ─────────────────────────────────────────────────────── */
  async function showFile(id) {
    try {
      const res = await bg('showRecording', { id });
      if (!res?.success) toast(res?.error || 'File not found in downloads', 'error');
    } catch (e) { toast(e.message, 'error'); }
  }

  function confirmDelete(id, filename) {
    closeConfirmModal();
    el.confirmMsg.textContent = 'Delete "' + filename + '"? This removes it from history but not from disk.';
    el.confirmModal.classList.remove('hidden');

    const handleOk = async () => {
      closeConfirmModal();
      try {
        const res = await bg('deleteRecording', { id });
        if (res?.success) {
          toast('Recording deleted', 'success');
          if (players[id]) {
            players[id].el.pause();
            URL.revokeObjectURL(players[id].objUrl);
            delete players[id];
          }
          await loadHistory();
          await refreshStorageStats();
        }
      } catch (e) { toast(e.message, 'error'); }
    };

    confirmAction = handleOk;
    el.confirmOk.addEventListener('click', confirmAction);
  }

  function confirmClearHistory() {
    closeConfirmModal();
    el.confirmMsg.textContent = 'Clear all recording history? Files on disk are not deleted.';
    el.confirmModal.classList.remove('hidden');

    const handleOk = async () => {
      closeConfirmModal();
      Object.keys(players).forEach(id => {
        players[id].el.pause();
        URL.revokeObjectURL(players[id].objUrl);
        delete players[id];
      });
      await bg('clearHistory');
      toast('History cleared', 'success');
      await loadHistory();
      await refreshStorageStats();
    };

    confirmAction = handleOk;
    el.confirmOk.addEventListener('click', confirmAction);
  }

  function closeConfirmModal() {
    el.confirmModal.classList.add('hidden');
    if (confirmAction) {
      el.confirmOk.removeEventListener('click', confirmAction);
      confirmAction = null;
    }
  }

  /* ── Trim modal ───────────────────────────────────────────────────────── */
  async function openTrimModal(rec) {
    const isStaged = rec && rec.staged === true;
    if (!isStaged) {
      const loaded = await ensurePlayerLoaded(rec);
      if (!loaded) {
        toast('No audio data available for trimming.', 'error');
        return;
      }
    }

    const res = await bg('getRecordingData', { id: rec.id });
    if (!res?.success || !res.data) {
      toast('Recording data unavailable for trim', 'error');
      return;
    }

    trimBlob = base64ToBlob(res.data, res.mimeType || rec.mimeType || 'audio/webm');
    trimAudioBuffer = await decodeAudioBuffer(trimBlob);
    trimRec = rec;
    trimDuration = trimAudioBuffer?.duration || rec.duration || (players[rec.id] ? players[rec.id].el.duration : 0) || 0;
    trimStartSec = 0;
    trimEndSec = trimDuration;

    el.trimStart.value = '0';
    el.trimEnd.value   = trimDuration.toFixed(1);
    el.trimStart.max   = trimDuration;
    el.trimEnd.max     = trimDuration;

    el.trimModal.classList.remove('hidden');
    drawTrimWaveform();
    updateTrimHandles();
  }

  function closeTrimModal() {
    el.trimModal.classList.add('hidden');
    el.trimPreview.classList.add('hidden');
    el.trimAudio.src = '';
    trimRec = null;
    trimBlob = null;
    trimAudioBuffer = null;
  }

  async function applyTrim() {
    if (!trimRec) return;
    const isStaged = trimRec.staged === true;

    const start = parseFloat(el.trimStart.value) || 0;
    const end   = parseFloat(el.trimEnd.value)   || trimDuration;

    if (start >= end) { toast('Start must be before end', 'error'); return; }

    el.trimApply.disabled = true;
    el.trimApply.textContent = 'Processing...';

    try {
      const audioBuffer = trimAudioBuffer || await decodeAudioBuffer(trimBlob);

      const sampleRate   = audioBuffer.sampleRate;
      const startSample  = Math.floor(start * sampleRate);
      const endSample    = Math.min(Math.floor(end * sampleRate), audioBuffer.length);
      const trimmedLength = endSample - startSample;

      const trimCtx = new AudioContext();
      const trimmedBuffer = trimCtx.createBuffer(
        audioBuffer.numberOfChannels,
        trimmedLength,
        sampleRate
      );

      for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const channelData = audioBuffer.getChannelData(ch);
        trimmedBuffer.copyToChannel(channelData.subarray(startSample, endSample), ch);
      }
      trimCtx.close().catch(() => {});

      // Encode as WAV
      const wavBlob = encodeWavFromBuffer(trimmedBuffer);
      const objUrl  = URL.createObjectURL(wavBlob);
      const base64 = await blobToBase64(wavBlob);

      const update = isStaged
        ? await bg('replaceStagedRecordingData', { id: trimRec.id, data: base64, mimeType: 'audio/wav', duration: end - start })
        : await bg('replaceRecordingData', { id: trimRec.id, data: base64, mimeType: 'audio/wav', duration: end - start });
      if (!update?.success) throw new Error(update?.error || 'Failed to save trimmed recording');

      // Preview
      el.trimAudio.src = objUrl;
      el.trimPreview.classList.remove('hidden');

      if (!isStaged) {
        registerCardPlayer(trimRec.id, wavBlob, end - start);
        await loadHistory();
        toast('Trimmed recording saved to history', 'success');
      } else {
        await loadStagedRecording(true);
        toast('Trim applied to recording', 'success');
      }
      await refreshStorageStats();
      closeTrimModal();
    } catch (err) {
      toast('Trim failed: ' + err.message, 'error');
    } finally {
      el.trimApply.disabled = false;
      el.trimApply.textContent = 'Trim and Save';
    }
  }

  function encodeWavFromBuffer(buffer) {
    const numCh = buffer.numberOfChannels;
    const sr    = buffer.sampleRate;
    const len   = buffer.length;
    const bps   = 2;
    const block = numCh * bps;
    const dataSize = len * block;
    const ab = new ArrayBuffer(44 + dataSize);
    const view = new DataView(ab);
    const ws = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
    ws(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); ws(8, 'WAVE');
    ws(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, numCh, true); view.setUint32(24, sr, true);
    view.setUint32(28, sr * block, true); view.setUint16(32, block, true);
    view.setUint16(34, 16, true); ws(36, 'data'); view.setUint32(40, dataSize, true);
    const chs = [];
    for (let c = 0; c < numCh; c++) chs.push(buffer.getChannelData(c));
    let off = 44;
    for (let i = 0; i < len; i++) {
      for (let c = 0; c < numCh; c++) {
        const s = Math.max(-1, Math.min(1, chs[c][i] || 0));
        view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        off += 2;
      }
    }
    return new Blob([ab], { type: 'audio/wav' });
  }

  function onTrimInputChange() {
    trimStartSec = Math.max(0, parseFloat(el.trimStart.value) || 0);
    trimEndSec   = Math.min(trimDuration, parseFloat(el.trimEnd.value) || trimDuration);
    updateTrimHandles();
  }

  function startTrimDrag(e, handle) {
    trimDragging = handle;
    e.preventDefault();
  }

  function onTrimDragMove(e) {
    if (!trimDragging) return;
    const canvas = el.trimCanvas;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const sec = ratio * trimDuration;

    if (trimDragging === 'start') {
      trimStartSec = Math.min(sec, trimEndSec - 0.1);
      el.trimStart.value = trimStartSec.toFixed(1);
    } else {
      trimEndSec = Math.max(sec, trimStartSec + 0.1);
      el.trimEnd.value = trimEndSec.toFixed(1);
    }
    updateTrimHandles();
  }

  function onTrimDragEnd() { trimDragging = null; }

  function updateTrimHandles() {
    if (!trimDuration) return;
    const startPct = (trimStartSec / trimDuration) * 100;
    const endPct   = (trimEndSec   / trimDuration) * 100;
    el.trimHandleStart.style.left = startPct + '%';
    el.trimHandleEnd.style.left   = endPct   + '%';
    el.trimSelection.style.left   = startPct + '%';
    el.trimSelection.style.width  = (endPct - startPct) + '%';
  }

  function drawTrimWaveform() {
    const canvas = el.trimCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const metrics = prepareCanvas(canvas, 60);
    const w = metrics.width;
    const h = metrics.height;
    ctx.clearRect(0, 0, w, h);

    if (trimAudioBuffer) {
      const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2563EB';
      const peaks = buildWavePeaks(trimAudioBuffer, Math.floor(w / 2));
      drawWaveBars(canvas, peaks, { color: primary, baselineAlpha: 0.18 });
    }
  }

  /* ── Settings ─────────────────────────────────────────────────────────── */
  async function loadSettings() {
    try {
      const s = await bg('getSettings');
      if (s) {
        el.exportFormat.value = s.exportFormat || 'webm';
        el.maxDuration.value  = s.maxDuration  || '0';
        el.settingsExportFormat.value = s.exportFormat || 'webm';
        el.settingsTheme.value = (s.theme === 'dark') ? 'dark' : 'light';
        el.settingsMaxDuration.value = String(s.maxDuration || 0);
        el.settingsSaveHistory.checked = s.saveToHistory !== false;
        el.settingsMaxStorage.value = String(Math.max(1, Number(s.maxStorageGB) || 1));
        if (el.audioDevice && s.micDeviceId) el.audioDevice.value = String(s.micDeviceId);
        applyTheme(el.settingsTheme.value);
        syncExportFormatUI();
        syncDropdowns();
      }
    } catch (_) {}
  }

  async function saveSettings() {
    try {
      el.settingsExportFormat.value = el.exportFormat.value;
      el.settingsMaxDuration.value = el.maxDuration.value;
      await bg('updateSettings', {
        settings: {
          exportFormat: el.exportFormat.value,
          theme: (el.settingsTheme && el.settingsTheme.value === 'dark') ? 'dark' : 'light',
          maxDuration:  parseInt(el.maxDuration.value) || 0,
          micDeviceId: (el.audioDevice && el.audioDevice.value) ? String(el.audioDevice.value) : '',
          saveToHistory: !!el.settingsSaveHistory.checked,
          maxStorageGB: Math.max(1, parseInt(el.settingsMaxStorage.value) || 1)
        }
      });
      applyTheme((el.settingsTheme && el.settingsTheme.value === 'dark') ? 'dark' : 'light');
      syncExportFormatUI();
      syncDropdowns();
      await refreshStorageStats();
    } catch (_) {}
  }

  function openSettingsModal() {
    el.settingsModal.classList.remove('hidden');
    refreshStorageStats();
  }

  function closeSettingsModal() {
    el.settingsModal.classList.add('hidden');
  }

  function syncSettingsFromModal() {
    el.exportFormat.value = el.settingsExportFormat.value;
    el.maxDuration.value = el.settingsMaxDuration.value;
    applyTheme((el.settingsTheme && el.settingsTheme.value === 'dark') ? 'dark' : 'light');
    syncExportFormatUI();
    syncDropdowns();
    saveSettings();
  }

  /* ── Theme ────────────────────────────────────────────────────────────── */
  function applyTheme(theme) {
    const t = (theme === 'dark') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);

    if (el.themeToggle) el.themeToggle.setAttribute('aria-pressed', String(t === 'dark'));
    if (el.themeToggleText) el.themeToggleText.textContent = (t === 'dark') ? 'Dark' : 'Light';
    if (el.themeToggleIcon) el.themeToggleIcon.textContent = (t === 'dark') ? 'D' : 'L';
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = (cur === 'dark') ? 'light' : 'dark';
    if (el.settingsTheme) el.settingsTheme.value = next;
    applyTheme(next);
    syncDropdowns();
    saveSettings();
  }

  function syncDropdowns() {
    try {
      if (window.CADropdowns && typeof window.CADropdowns.syncAll === 'function') {
        window.CADropdowns.syncAll();
      }
    } catch (_) {}
  }

  /* ── Mixer (Tab + Mic) ──────────────────────────────────────────────── */
  let mixMicVal = 1;
  let mixTabVal = 1;
  let mixSendTimer = null;

  function onMixChange() {
    const micPct = el.mixMic ? (parseInt(el.mixMic.value, 10) || 0) : 100;
    const tabPct = el.mixTab ? (parseInt(el.mixTab.value, 10) || 0) : 100;
    mixMicVal = Math.max(0, Math.min(1, micPct / 100));
    mixTabVal = Math.max(0, Math.min(1, tabPct / 100));
    if (el.mixMicPct) el.mixMicPct.textContent = Math.round(mixMicVal * 100) + '%';
    if (el.mixTabPct) el.mixTabPct.textContent = Math.round(mixTabVal * 100) + '%';

    // Throttle sends while dragging.
    if (mixSendTimer) return;
    mixSendTimer = setTimeout(() => { mixSendTimer = null; sendMixLevels(); }, 80);
  }

  function setMixDefaults(which) {
    if (which === 'mic' && el.mixMic) el.mixMic.value = '100';
    if (which === 'tab' && el.mixTab) el.mixTab.value = '100';
    onMixChange();
    sendMixLevels();
  }

  async function sendMixLevels() {
    if (currentMode !== 'tab+mic') return;
    try {
      await bg('setMixLevels', { mic: mixMicVal, tab: mixTabVal });
    } catch (_) {}
  }

  /* ── Quick settings UI ──────────────────────────────────────────────── */
  function initQuickSettingsUI() {
    if (!el.qsToggle || !el.qsBody) return;
    const saved = localStorage.getItem('qsOpen');
    const open = saved === '1';
    setQuickSettingsOpen(open);
  }

  function toggleQuickSettings() {
    const isOpen = !el.qsBody.classList.contains('hidden');
    setQuickSettingsOpen(!isOpen);
  }

  function setQuickSettingsOpen(open) {
    if (!el.qsToggle || !el.qsBody) return;
    el.qsToggle.setAttribute('aria-expanded', String(!!open));
    if (open) DOMHelpers.show(el.qsBody);
    else DOMHelpers.hide(el.qsBody);
    localStorage.setItem('qsOpen', open ? '1' : '0');
  }

  function setExportFormat(fmt) {
    const safe = (fmt === 'wav' || fmt === 'mp3') ? fmt : 'webm';
    if (safe === 'mp3' && !supportsMp3()) {
      toast('MP3 export is not supported in this browser build. Use WebM or WAV.', 'warning');
      return;
    }
    el.exportFormat.value = safe;
    if (el.settingsExportFormat) el.settingsExportFormat.value = safe;
    syncExportFormatUI();
    saveSettings();
  }

  function syncExportFormatUI() {
    const current = (el.exportFormat && (el.exportFormat.value === 'wav' || el.exportFormat.value === 'mp3')) ? el.exportFormat.value : 'webm';
    document.querySelectorAll('.format-card').forEach(btn => {
      const active = (btn.dataset.format || 'webm') === current;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
      if ((btn.dataset.format || '') === 'mp3') {
        const ok = supportsMp3();
        btn.classList.toggle('is-disabled', !ok);
        btn.setAttribute('title', ok ? 'MP3' : 'MP3 not supported on this browser');
      }
    });
  }

  function supportsMp3() {
    try {
      return typeof MediaRecorder !== 'undefined'
        && typeof MediaRecorder.isTypeSupported === 'function'
        && MediaRecorder.isTypeSupported('audio/mpeg');
    } catch (_) {
      return false;
    }
  }

  async function loadAudioDevices() {
    if (!el.audioDevice) return;
    try {
      const res = await bg('listAudioDevices');
      const devices = Array.isArray(res?.devices) ? res.devices : [];
      const existing = el.audioDevice.value;

      DOMHelpers.clearElement(el.audioDevice);

      if (!devices.length) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Default microphone';
        el.audioDevice.appendChild(opt);
        if (el.audioDeviceHint) el.audioDeviceHint.textContent = 'No device list available';
        syncDropdowns();
        return;
      }

      devices.forEach((d, idx) => {
        const opt = document.createElement('option');
        opt.value = String(d.deviceId || '');
        const label = String(d.label || '').trim();
        opt.textContent = label || ('Microphone ' + (idx + 1));
        el.audioDevice.appendChild(opt);
      });

      // Restore selection if possible, else pick the first device.
      el.audioDevice.value = existing && devices.some(d => String(d.deviceId) === String(existing)) ? existing : String(devices[0].deviceId || '');

      if (el.audioDeviceHint) el.audioDeviceHint.textContent = devices.length + ' device' + (devices.length === 1 ? '' : 's') + ' available';
      syncDropdowns();
      saveSettings();
    } catch (e) {
      if (el.audioDeviceHint) el.audioDeviceHint.textContent = 'Could not load devices';
    }
  }

  async function refreshStorageStats() {
    try {
      const res = await bg('getStorageStats');
      if (!res?.success) return;
      const used = Number(res.usedBytes) || 0;
      const max = Math.max(1, Number(res.maxBytes) || 1);
      const pct = Math.max(0, Math.min(100, (used / max) * 100));
      const usedLabel = Formatters.formatSize(used);
      const maxLabel = formatCap(max);
      el.storageUsedText.textContent = usedLabel + ' / ' + maxLabel;
      el.storageUsedBar.style.width = pct + '%';
      el.settingsStorageUsed.textContent = usedLabel + ' used';
      el.settingsStorageBar.style.width = pct + '%';
    } catch (_) {}
  }

  /* ── Background message handler ───────────────────────────────────────── */
  function handleBgMessage(msg) {
    switch (msg.action) {
      case 'recordingLevel':
        updateLevel(msg.level, true);
        break;

      case 'recordingWavePeak':
        pushLivePeak(msg.peak);
        break;

      case 'recordingReady':
        showStaged(msg.staged, true);
        toast('Recording ready: ' + (msg?.staged?.filename || ''), 'success');
        refreshStorageStats();
        refreshStatus();
        break;

      case 'recordingDownloaded':
        toast('Downloaded: ' + (msg.filename || ''), 'success');
        hideStaged();
        loadHistory();
        refreshStorageStats();
        refreshStatus();
        break;

      case 'recordingDiscarded':
        toast('Recording discarded', 'info');
        hideStaged();
        refreshStorageStats();
        refreshStatus();
        break;

      case 'stagedUpdated':
        // If the overlay is open, keep it open and refresh content; otherwise just update the staged ref.
        showStaged(msg.staged, isOverlayOpen());
        toast('Recording updated', 'success');
        refreshStorageStats();
        break;

      case 'recordingError':
        toast(msg.error || 'Recording error', 'error');
        refreshStatus();
        break;

      case 'recordingNotice':
        toast(msg.message || 'Notice', msg.level || 'info');
        break;

      case 'recordingPaused':
      case 'recordingResumed':
        refreshStatus();
        break;
    }
  }

  /* ── Staged recording (Complete panel) ──────────────────────────────── */
  let staged = null;
  let completeAudio = null; // HTMLAudioElement
  let completeObjUrl = null;
  let completeAudioBuffer = null;
  let cropStartSec = 0;
  let cropEndSec = 0;
  let cropDragging = null; // 'start' | 'end'
  let cropMode = false;

  function isOverlayOpen() {
    return document.documentElement.classList.contains('overlay-open');
  }

  function updateResumeButton() {
    if (!el.resumeStagedBtn) return;
    if (staged?.id && !isOverlayOpen()) DOMHelpers.show(el.resumeStagedBtn);
    else DOMHelpers.hide(el.resumeStagedBtn);
  }

  async function loadStagedRecording(openOverlay) {
    try {
      const res = await bg('getStagedRecording');
      if (res && res.id) {
        staged = res;
        updateResumeButton();
        if (openOverlay === true) await showStaged(res, true);
        else hideOverlayOnly();
      } else {
        hideStaged();
      }
    } catch (_) {
      hideStaged();
    }
  }

  function stagedExt() {
    if (!staged?.mimeType) return (el.exportFormat && el.exportFormat.value === 'wav') ? 'wav' : 'webm';
    return String(staged.mimeType).includes('wav') ? 'wav' : 'webm';
  }

  function stagedBaseName() {
    const fn = String(staged?.filename || 'recording');
    return fn.replace(/\.[a-z0-9]+$/i, '');
  }

  function buildStagedFilenameFromInput() {
    const base = (el.completeName && String(el.completeName.value || '').trim()) || stagedBaseName();
    const clean = base.replace(/[\\\\/:*?\"<>|]+/g, '_').replace(/\\s+/g, ' ').trim().substring(0, 80);
    const ext = stagedExt();
    if (!clean) return 'recording.' + ext;
    return clean.toLowerCase().endsWith('.' + ext) ? clean : (clean + '.' + ext);
  }

  function hideOverlayOnly() {
    // Keep staged reference (if any), but ensure overlay is not shown on initial open.
    if (el.completeOverlay) el.completeOverlay.classList.add('hidden');
    document.documentElement.classList.remove('overlay-open');
    if (el.completeCropBox) el.completeCropBox.classList.add('hidden');
    if (el.completeRange) el.completeRange.classList.add('hidden');
  }

  async function showStaged(s, openOverlay) {
    staged = s || null;
    if (!staged || !el.completePanel || !el.completeOverlay) return;

    if (el.completeName) el.completeName.value = stagedBaseName();
    if (el.completeNameHint) el.completeNameHint.textContent = '"' + buildStagedFilenameFromInput() + '"';

    if (openOverlay === true) {
      document.documentElement.classList.add('overlay-open');
      el.completeOverlay.classList.remove('hidden');
      updateResumeButton();
    } else {
      hideOverlayOnly();
      updateResumeButton();
      return;
    }
    DOMHelpers.show(el.completePanel);
    await loadCompleteAudio();

    if (el.completeName) setTimeout(() => { try { el.completeName.focus(); el.completeName.select(); } catch (_) {} }, 30);
  }

  function hideStaged() {
    staged = null;
    if (completeAudio) {
      completeAudio.pause();
      completeAudio.src = '';
      completeAudio = null;
    }
    if (completeObjUrl) {
      URL.revokeObjectURL(completeObjUrl);
      completeObjUrl = null;
    }
    completeAudioBuffer = null;
    cropMode = false;
    cropDragging = null;
    if (el.completeCropBox) el.completeCropBox.classList.add('hidden');
    if (el.completeRange) el.completeRange.classList.add('hidden');
    if (el.completePanel) DOMHelpers.hide(el.completePanel);
    if (el.completeOverlay) el.completeOverlay.classList.add('hidden');
    document.documentElement.classList.remove('overlay-open');
    updateResumeButton();
  }

  async function loadCompleteAudio() {
    if (!staged?.id) return;
    try {
      const payload = await bg('getRecordingData', { id: staged.id });
      if (!payload?.success || !payload?.data) throw new Error('Audio data unavailable');

      const blob = base64ToBlob(payload.data, payload.mimeType || staged.mimeType || 'audio/webm');
      if (completeObjUrl) URL.revokeObjectURL(completeObjUrl);
      completeObjUrl = URL.createObjectURL(blob);

      if (!completeAudio) {
        completeAudio = new Audio();
        completeAudio.addEventListener('timeupdate', updateCompleteTime);
        completeAudio.addEventListener('ended', () => { if (el.completePlay) el.completePlay.textContent = '▶'; });
      }
      completeAudio.src = completeObjUrl;
      completeAudio.volume = (el.completeVol ? (parseInt(el.completeVol.value, 10) || 0) : 90) / 100;

      if (el.completeTimeTot) el.completeTimeTot.textContent = Formatters.formatDuration(staged.duration || 0);
      if (el.completeTimeCur) el.completeTimeCur.textContent = '0:00';
      if (el.completePlay) el.completePlay.textContent = '▶';

      const buf = await decodeAudioBuffer(blob);
      completeAudioBuffer = buf;
      drawCompleteWaveform(buf);

      const total = buf?.duration || staged?.duration || 0;
      cropStartSec = 0;
      cropEndSec = total;
      updateCropUI();
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  function updateCompleteTime() {
    if (!completeAudio) return;
    if (el.completeTimeCur) el.completeTimeCur.textContent = Formatters.formatDuration(completeAudio.currentTime || 0);
    if (el.completeTimeTot) {
      const total = completeAudio.duration || staged?.duration || 0;
      el.completeTimeTot.textContent = Formatters.formatDuration(total);
    }
  }

  function toggleCompletePlay() {
    if (!completeAudio) return;
    if (completeAudio.paused) {
      completeAudio.play().then(() => {
        if (el.completePlay) el.completePlay.textContent = '❚❚';
      }).catch(e => toast(e.message, 'error'));
    } else {
      completeAudio.pause();
      if (el.completePlay) el.completePlay.textContent = '▶';
    }
  }

  function onCompleteVol() {
    if (!completeAudio || !el.completeVol) return;
    completeAudio.volume = (parseInt(el.completeVol.value, 10) || 0) / 100;
  }

  function setCompleteSpeed(speed) {
    if (!completeAudio) return;
    const s = Math.max(0.25, Math.min(4, parseFloat(speed) || 1));
    completeAudio.playbackRate = s;
    document.querySelectorAll('.speed-btn').forEach(btn => {
      const active = String(btn.dataset.speed || '1') === String(s);
      btn.classList.toggle('active', active);
    });
  }

  async function saveStagedFromPanel() {
    if (!staged?.id) return;
    if (el.completeSave) el.completeSave.disabled = true;
    if (el.completeDiscard) el.completeDiscard.disabled = true;
    try {
      const filename = buildStagedFilenameFromInput();
      const res = await bg('downloadStagedRecording', { id: staged.id, filename });
      if (!res?.success) throw new Error(res?.error || 'Save failed');
      // completion handled via broadcast; keep UI snappy.
      hideStaged();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      if (el.completeSave) el.completeSave.disabled = false;
      if (el.completeDiscard) el.completeDiscard.disabled = false;
    }
  }

  async function discardStaged() {
    if (!staged?.id) return;
    if (el.completeDiscard) el.completeDiscard.disabled = true;
    try {
      const res = await bg('discardStagedRecording', { id: staged.id });
      if (!res?.success) throw new Error(res?.error || 'Discard failed');
      hideStaged();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      if (el.completeDiscard) el.completeDiscard.disabled = false;
    }
  }

  function drawCompleteWaveform(audioBuffer) {
    const canvas = el.completeCanvas;
    if (!canvas || !audioBuffer) return;
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2563EB';
    const metrics = prepareCanvas(canvas, 64);
    const peaks = buildWavePeaks(audioBuffer, Math.floor(metrics.width / 2));
    drawWaveBars(canvas, peaks, { color: primary, baselineAlpha: 0.16 });
  }

  function prepareCanvas(canvas, fallbackHeight) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssWidth = Math.max(1, Math.floor(canvas.clientWidth || canvas.width || 300));
    const cssHeight = Math.max(1, Math.floor(canvas.clientHeight || fallbackHeight || canvas.height || 64));
    const targetW = Math.floor(cssWidth * dpr);
    const targetH = Math.floor(cssHeight * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    return { width: targetW, height: targetH, dpr };
  }

  function buildWavePeaks(audioBuffer, bucketCount) {
    const data = audioBuffer.getChannelData(0);
    const count = Math.max(24, Math.min(2400, bucketCount || 300));
    const step = Math.max(1, Math.floor(data.length / count));
    const peaks = new Float32Array(count);
    let peakMax = 0;

    for (let i = 0; i < count; i++) {
      const start = i * step;
      const end = Math.min(data.length, start + step);
      let p = 0;
      for (let j = start; j < end; j++) {
        const v = Math.abs(data[j] || 0);
        if (v > p) p = v;
      }
      peaks[i] = p;
      if (p > peakMax) peakMax = p;
    }

    const norm = peakMax > 0 ? peakMax : 1;
    for (let i = 0; i < peaks.length; i++) {
      peaks[i] = Math.pow(peaks[i] / norm, 0.72);
    }
    return peaks;
  }

  function drawWaveBars(canvas, peaks, options) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const color = options?.color || '#2563EB';
    const baselineAlpha = options?.baselineAlpha ?? 0.15;
    const mid = h / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.globalAlpha = baselineAlpha;
    ctx.fillRect(0, mid - 1, w, 2);
    ctx.globalAlpha = 1;

    const barWidth = 2;
    const gap = 1;
    const strideX = barWidth + gap;
    const maxBars = Math.max(1, Math.floor(w / strideX));
    const peakStride = Math.max(1, Math.floor(peaks.length / maxBars));
    let x = 0;

    for (let i = 0; i < peaks.length && x < w; i += peakStride) {
      const amp = peaks[i];
      const half = Math.max(2, Math.round(amp * h * 0.46));
      const y = Math.round(mid - half);
      const barH = Math.max(2, half * 2);
      ctx.fillRect(x, y, barWidth, barH);
      x += strideX;
    }
  }

  /* ── Inline Crop (Recording Complete Panel) ─────────────────────────── */
  function toggleCropMode() {
    if (!staged?.id || !completeAudioBuffer) return;
    cropMode ? exitCropMode() : enterCropMode();
  }

  function enterCropMode() {
    cropMode = true;
    if (el.completeCropBox) el.completeCropBox.classList.remove('hidden');
    if (el.completeRange) {
      el.completeRange.classList.remove('hidden');
      el.completeRange.setAttribute('aria-hidden', 'false');
    }
    updateCropUI();
  }

  function exitCropMode() {
    cropMode = false;
    cropDragging = null;
    if (el.completeCropBox) el.completeCropBox.classList.add('hidden');
    if (el.completeRange) {
      el.completeRange.classList.add('hidden');
      el.completeRange.setAttribute('aria-hidden', 'true');
    }
  }

  function resetCrop() {
    const total = completeAudioBuffer?.duration || staged?.duration || 0;
    cropStartSec = 0;
    cropEndSec = total;
    updateCropUI();
  }

  function updateCropUI() {
    const total = completeAudioBuffer?.duration || staged?.duration || 0;
    if (!total) return;
    cropStartSec = Math.max(0, Math.min(cropStartSec, total));
    cropEndSec = Math.max(0, Math.min(cropEndSec, total));
    if (cropEndSec <= cropStartSec) cropEndSec = Math.min(total, cropStartSec + 0.05);

    if (el.cropSelStart) el.cropSelStart.textContent = Formatters.formatDuration(cropStartSec);
    if (el.cropSelEnd) el.cropSelEnd.textContent = Formatters.formatDuration(cropEndSec);
    if (el.cropSelDur) el.cropSelDur.textContent = Formatters.formatDuration(Math.max(0, cropEndSec - cropStartSec));

    if (!el.completeSelection || !el.completeHandleStart || !el.completeHandleEnd) return;
    const startPct = (cropStartSec / total) * 100;
    const endPct = (cropEndSec / total) * 100;
    el.completeHandleStart.style.left = startPct + '%';
    el.completeHandleEnd.style.left = endPct + '%';
    el.completeSelection.style.left = startPct + '%';
    el.completeSelection.style.width = (endPct - startPct) + '%';
  }

  function startCropDrag(e, which) {
    if (!cropMode) enterCropMode();
    cropDragging = which;
    e.preventDefault();
  }

  function onCropDragMove(e) {
    if (!cropDragging || !cropMode || !completeAudioBuffer) return;
    const canvas = el.completeCanvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const total = completeAudioBuffer.duration || staged?.duration || 0;
    const sec = ratio * total;
    if (cropDragging === 'start') cropStartSec = Math.min(sec, cropEndSec - 0.05);
    else cropEndSec = Math.max(sec, cropStartSec + 0.05);
    updateCropUI();
  }

  function onCropDragEnd() { cropDragging = null; }

  async function applyCropInline() {
    if (!staged?.id || !completeAudioBuffer) return;
    const total = completeAudioBuffer.duration || staged?.duration || 0;
    const start = Math.max(0, Math.min(cropStartSec, total));
    const end = Math.max(0, Math.min(cropEndSec, total));
    if (start >= end) { toast('Invalid crop selection', 'error'); return; }

    if (el.cropApply) el.cropApply.disabled = true;
    try {
      const audioBuffer = completeAudioBuffer;
      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(start * sampleRate);
      const endSample = Math.min(Math.floor(end * sampleRate), audioBuffer.length);
      const trimmedLength = endSample - startSample;

      const trimCtx = new AudioContext();
      const trimmedBuffer = trimCtx.createBuffer(audioBuffer.numberOfChannels, trimmedLength, sampleRate);
      for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const channelData = audioBuffer.getChannelData(ch);
        trimmedBuffer.copyToChannel(channelData.subarray(startSample, endSample), ch);
      }
      trimCtx.close().catch(() => {});

      const wavBlob = encodeWavFromBuffer(trimmedBuffer);
      const base64 = await blobToBase64(wavBlob);
      const update = await bg('replaceStagedRecordingData', {
        id: staged.id,
        data: base64,
        mimeType: 'audio/wav',
        duration: end - start
      });
      if (!update?.success) throw new Error(update?.error || 'Crop failed');

      exitCropMode();
      await loadStagedRecording(true);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      if (el.cropApply) el.cropApply.disabled = false;
    }
  }

  /* ── Toast ────────────────────────────────────────────────────────────── */
  function toast(msg, type) {
    type = type || 'info';
    const t = document.createElement('div');
    t.className = 'toast ' + type;

    const dot = document.createElement('span');
    dot.className = 'toast-dot';
    const txt = document.createElement('span');
    txt.textContent = String(msg || '');

    t.appendChild(dot);
    t.appendChild(txt);
    el.toastContainer.appendChild(t);

    setTimeout(() => {
      t.classList.add('fade-out');
      setTimeout(() => { if (t.parentNode) t.remove(); }, 220);
    }, 2800);
  }

  /* ── SVG icon builders ─────────────────────────────────────────────────── */
  function makeSvg(w, h) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', w || 14); s.setAttribute('height', h || 14);
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '2');
    s.setAttribute('stroke-linecap', 'round');
    s.setAttribute('stroke-linejoin', 'round');
    return s;
  }

  function addEl(svg, tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    svg.appendChild(el);
    return el;
  }

  function iconPlay() {
    const s = makeSvg();
    addEl(s, 'polygon', { points: '5 3 19 12 5 21 5 3', fill: 'currentColor', stroke: 'none' });
    return s;
  }

  function iconPause() {
    const s = makeSvg();
    addEl(s, 'rect', { x: '6', y: '4', width: '4', height: '16' });
    addEl(s, 'rect', { x: '14', y: '4', width: '4', height: '16' });
    return s;
  }

  function setIconPlay(btn) {
    DOMHelpers.clearElement(btn);
    btn.appendChild(iconPlay());
  }

  function setIconPause(btn) {
    DOMHelpers.clearElement(btn);
    btn.appendChild(iconPause());
  }

  function iconDownload() {
    const s = makeSvg();
    addEl(s, 'path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' });
    addEl(s, 'polyline', { points: '7 10 12 15 17 10' });
    addEl(s, 'line', { x1: '12', y1: '15', x2: '12', y2: '3' });
    return s;
  }

  function iconDelete() {
    const s = makeSvg();
    addEl(s, 'polyline', { points: '3 6 5 6 21 6' });
    addEl(s, 'path', { d: 'M19 6l-1 14H6L5 6' });
    addEl(s, 'path', { d: 'M10 11v6M14 11v6' });
    return s;
  }

  function iconTrim() {
    const s = makeSvg();
    addEl(s, 'circle', { cx: '6', cy: '6', r: '3' });
    addEl(s, 'circle', { cx: '6', cy: '18', r: '3' });
    addEl(s, 'line', { x1: '20', y1: '4', x2: '8.12', y2: '15.88' });
    addEl(s, 'line', { x1: '14.47', y1: '14.48', x2: '20', y2: '20' });
    addEl(s, 'line', { x1: '8.12', y1: '8.12', x2: '12', y2: '12' });
    return s;
  }

  function buildEmptyIcon() {
    const s = makeSvg(32, 32);
    addEl(s, 'path', { d: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z' });
    addEl(s, 'path', { d: 'M19 10v2a7 7 0 0 1-14 0v-2' });
    addEl(s, 'line', { x1: '12', y1: '19', x2: '12', y2: '22' });
    s.setAttribute('stroke', 'var(--border-strong)');
    return s;
  }

  /* ── Helper builders ───────────────────────────────────────────────────── */
  function makeRecBtn(svgIcon, title, extraClass) {
    const btn = document.createElement('button');
    btn.className = 'rec-btn' + (extraClass ? ' ' + extraClass : '');
    btn.title = title;
    btn.appendChild(svgIcon);
    return btn;
  }

  const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const BASE64_LOOKUP = (() => {
    const table = new Int16Array(128);
    for (let i = 0; i < table.length; i++) table[i] = -1;
    for (let i = 0; i < BASE64_ALPHABET.length; i++) table[BASE64_ALPHABET.charCodeAt(i)] = i;
    return table;
  })();
  const MAX_BLOB_BYTES = 120 * 1024 * 1024;

  function base64ToBytes(base64) {
    if (!base64 || typeof base64 !== 'string') throw new Error('Invalid base64');
    const s = base64.replace(/[\r\n\s]/g, '');
    if (s.length % 4 === 1) throw new Error('Invalid base64 length');
    let padding = 0;
    if (s.endsWith('==')) padding = 2;
    else if (s.endsWith('=')) padding = 1;
    const byteLen = Math.floor((s.length * 3) / 4) - padding;
    if (byteLen < 0) throw new Error('Invalid base64');
    if (byteLen > MAX_BLOB_BYTES) throw new Error('Audio too large');

    const out = new Uint8Array(byteLen);
    let outIdx = 0;
    for (let i = 0; i < s.length; i += 4) {
      const c1 = s.charCodeAt(i);
      const c2 = s.charCodeAt(i + 1);
      const c3 = s.charCodeAt(i + 2);
      const c4 = s.charCodeAt(i + 3);

      const v1 = c1 < 128 ? BASE64_LOOKUP[c1] : -1;
      const v2 = c2 < 128 ? BASE64_LOOKUP[c2] : -1;
      const v3 = c3 === 61 ? 0 : (c3 < 128 ? BASE64_LOOKUP[c3] : -1);
      const v4 = c4 === 61 ? 0 : (c4 < 128 ? BASE64_LOOKUP[c4] : -1);
      if (v1 < 0 || v2 < 0 || v3 < 0 || v4 < 0) throw new Error('Invalid base64');

      const triple = (v1 << 18) | (v2 << 12) | (v3 << 6) | v4;
      if (outIdx < byteLen) out[outIdx++] = (triple >> 16) & 255;
      if (outIdx < byteLen) out[outIdx++] = (triple >> 8) & 255;
      if (outIdx < byteLen) out[outIdx++] = triple & 255;
    }
    return out;
  }

  function base64ToBlob(base64, mimeType) {
    const bytes = base64ToBytes(base64);
    return new Blob([bytes], { type: mimeType || 'audio/webm' });
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const size = Number(blob?.size) || 0;
      if (size <= 0) { reject(new Error('Empty audio blob')); return; }
      if (size > MAX_BLOB_BYTES) { reject(new Error('Audio too large')); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const str = String(reader.result || '');
        const data = str.split(',')[1];
        if (!data) return reject(new Error('Failed to read blob'));
        resolve(data);
      };
      reader.onerror = () => reject(reader.error || new Error('Blob read failed'));
      reader.readAsDataURL(blob);
    });
  }

  async function decodeAudioBuffer(blob) {
    const ctx = new AudioContext();
    try {
      const ab = await blob.arrayBuffer();
      return await ctx.decodeAudioData(ab);
    } finally {
      await ctx.close().catch(() => {});
    }
  }

  function formatCap(bytes) {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return gb.toFixed(2) + ' GB';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(1) + ' MB';
  }

  function metaItem(text) {
    const span = document.createElement('span');
    span.className = 'rec-meta-item';
    span.textContent = text;
    return span;
  }

  function metaSep() {
    const span = document.createElement('span');
    span.className = 'rec-meta-sep';
    return span;
  }

  /* ── Boot ─────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', init);

})();
