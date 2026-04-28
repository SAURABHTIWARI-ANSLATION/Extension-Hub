// NightOwl popup.js v3.0
'use strict';

// ── STATE ──
let state = {
  isDark:          false,
  brightness:      100,
  contrast:        100,
  saturation:      100,
  eyeFilter:       0,
  autoNight:       false,
  readingMode:     false,
  breakReminder:   false,
  bgShade:         'none',
  shadeIntensity:  0,
  bgColorEnabled:  false,
  bgColor:         '#FFFDE7',
  textScale:       100,
  fontFamily:      'default',
  nightFrom:       '20:00',
  nightTo:         '07:00',
  disabledSites:   []
};

let breakInterval    = null;
let breakNextAt      = null;
let autoNightInterval = null;

// ── DOM REFS ──
const $ = id => document.getElementById(id);

const tabDark           = $('tabDark');
const tabEye            = $('tabEye');
const tabStyle          = $('tabStyle');
const tabMore           = $('tabMore');
const panelDark         = $('panelDark');
const panelEye          = $('panelEye');
const panelStyle        = $('panelStyle');
const panelMore         = $('panelMore');

const lightCard         = $('lightCard');
const darkCard          = $('darkCard');
const brightnessSlider  = $('brightnessSlider');
const brightnessVal     = $('brightnessVal');
const contrastSlider    = $('contrastSlider');
const contrastVal       = $('contrastVal');

const eyeSlider         = $('eyeSlider');
const eyeFilterVal      = $('eyeFilterVal');
const satSlider         = $('satSlider');
const satVal            = $('satVal');
const autoNightToggle   = $('autoNightToggle');
const autoNightCard     = $('autoNightCard');
const nightBadge        = $('nightBadge');
const nightFrom         = $('nightFrom');
const nightTo           = $('nightTo');
const readingToggle     = $('readingToggle');
const readingCard       = $('readingCard');
const breakToggle       = $('breakToggle');
const breakCard         = $('breakCard');
const breakTimerDisplay = $('breakTimerDisplay');
const breakCountdown    = $('breakCountdown');
const resetEyeBtn       = $('resetEyeBtn');
const statusText        = $('statusText');

// Style panel
const bgColorCard       = $('bgColorCard');
const bgColorPicker     = $('bgColorPicker');
const bgColorToggle     = $('bgColorToggle');
const bgColorHexLabel   = $('bgColorHexLabel');
const quickColors       = $('quickColors');
const shadeGrid         = $('shadeGrid');
const shadeSlider       = $('shadeSlider');
const shadeVal          = $('shadeVal');
const textScaleSlider   = $('textScaleSlider');
const textScaleVal      = $('textScaleVal');
const fontGrid          = $('fontGrid');

// More panel
const disableSiteBtn    = $('disableSiteBtn');
const enableSiteBtn     = $('enableSiteBtn');
const siteDisabledBadge = $('siteDisabledBadge');
const siteDisabledText  = $('siteDisabledText');
const resetAllBtn       = $('resetAllBtn');

// Presets
const presetNight = $('presetNight');
const presetCafe  = $('presetCafe');
const presetReset = $('presetReset');

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  const keys = [
    'isDark','brightness','contrast','saturation','eyeFilter','autoNight',
    'readingMode','breakReminder','bgShade','shadeIntensity',
    'bgColorEnabled','bgColor','textScale','fontFamily',
    'nightFrom','nightTo','breakNextAt','disabledSites'
  ];

  chrome.storage.local.get(keys, (result) => {
    state.isDark         = result.isDark         ?? false;
    state.brightness     = result.brightness     ?? 100;
    state.contrast       = result.contrast       ?? 100;
    state.saturation     = result.saturation     ?? 100;
    state.eyeFilter      = result.eyeFilter      ?? 0;
    state.autoNight      = result.autoNight      ?? false;
    state.readingMode    = result.readingMode    ?? false;
    state.breakReminder  = result.breakReminder  ?? false;
    state.bgShade        = result.bgShade        ?? 'none';
    state.shadeIntensity = result.shadeIntensity ?? 0;
    state.bgColorEnabled = result.bgColorEnabled ?? false;
    state.bgColor        = result.bgColor        ?? '#FFFDE7';
    state.textScale      = result.textScale      ?? 100;
    state.fontFamily     = result.fontFamily     ?? 'default';
    state.nightFrom      = result.nightFrom      ?? '20:00';
    state.nightTo        = result.nightTo        ?? '07:00';
    state.disabledSites  = result.disabledSites  ?? [];
    breakNextAt          = result.breakNextAt    ?? null;

    renderUI();
    // Resume break countdown display without resetting the background alarm
    if (state.breakReminder) resumeBreakDisplay();
    // Start auto night UI polling if enabled
    if (state.autoNight) startAutoNightPolling();
    updateSiteStatus();
  });

  // ── TAB EVENTS ──
  tabDark.addEventListener('click',  () => switchTab('dark'));
  tabEye.addEventListener('click',   () => switchTab('eye'));
  tabStyle.addEventListener('click', () => switchTab('style'));
  tabMore.addEventListener('click',  () => switchTab('more'));

  // ── DARK MODE CARDS ──
  lightCard.addEventListener('click',   () => setMode(false));
  darkCard.addEventListener('click',    () => setMode(true));
  lightCard.addEventListener('keydown', (e) => { if (e.key==='Enter'||e.key===' ') setMode(false); });
  darkCard.addEventListener('keydown',  (e) => { if (e.key==='Enter'||e.key===' ') setMode(true); });

  // ── BRIGHTNESS ──
  brightnessSlider.addEventListener('input', () => {
    state.brightness = parseInt(brightnessSlider.value, 10);
    brightnessVal.textContent = state.brightness + '%';
    updateBrightnessSliderFill();
    saveAndApply();
  });

  // ── CONTRAST ──
  contrastSlider.addEventListener('input', () => {
    state.contrast = parseInt(contrastSlider.value, 10);
    contrastVal.textContent = state.contrast + '%';
    saveAndApply();
  });

  // ── EYE FILTER ──
  eyeSlider.addEventListener('input', () => {
    state.eyeFilter = parseInt(eyeSlider.value, 10);
    updateEyeLabel();
    if (state.autoNight) {
      state.autoNight = false;
      autoNightToggle.checked = false;
      autoNightCard.classList.remove('on');
      nightBadge.classList.remove('visible');
      stopAutoNightPolling();
      sendToActiveTab({ type: 'stopAutoNight' });
    }
    saveAndApply();
  });

  // ── SATURATION ──
  satSlider.addEventListener('input', () => {
    state.saturation = parseInt(satSlider.value, 10);
    satVal.textContent = state.saturation + '%';
    saveAndApply();
  });

  // ── AUTO NIGHT ──
  autoNightToggle.addEventListener('change', () => {
    state.autoNight = autoNightToggle.checked;
    autoNightCard.classList.toggle('on', state.autoNight);
    nightBadge.classList.toggle('visible', state.autoNight);
    if (state.autoNight) {
      applyAutoNightNow();
      sendToActiveTab({ type: 'startAutoNight' });
      startAutoNightPolling();
      setStatus('Auto Night active');
    } else {
      stopAutoNightPolling();
      state.eyeFilter = 0;
      eyeSlider.value = 0;
      updateEyeLabel();
      sendToActiveTab({ type: 'stopAutoNight' });
      setStatus('Ready');
    }
    saveAndApply();
  });

  nightFrom.addEventListener('change', () => {
    state.nightFrom = nightFrom.value;
    if (state.autoNight) applyAutoNightNow();
    saveAndApply();
  });

  nightTo.addEventListener('change', () => {
    state.nightTo = nightTo.value;
    if (state.autoNight) applyAutoNightNow();
    saveAndApply();
  });

  // ── READING MODE ──
  readingToggle.addEventListener('change', () => {
    state.readingMode = readingToggle.checked;
    readingCard.classList.toggle('reading-on', state.readingMode);
    setStatus(state.readingMode ? 'Reading mode on' : 'Ready');
    saveAndApply();
  });

  // ── BREAK REMINDER ──
  breakToggle.addEventListener('change', () => {
    state.breakReminder = breakToggle.checked;
    breakCard.classList.toggle('break-on', state.breakReminder);
    if (state.breakReminder) {
      startBreakTimer();          // new start — resets alarm + countdown
      setStatus('Break reminder on');
    } else {
      stopBreakTimer();
      setStatus('Ready');
    }
    saveAndApply();
  });

  // ── RESET EYE ──
  resetEyeBtn.addEventListener('click', () => {
    state.eyeFilter = 0; state.autoNight = false; state.saturation = 100;
    eyeSlider.value = 0; autoNightToggle.checked = false;
    satSlider.value = 100; satVal.textContent = '100%';
    autoNightCard.classList.remove('on');
    nightBadge.classList.remove('visible');
    stopAutoNightPolling();
    updateEyeLabel();
    sendToActiveTab({ type: 'stopAutoNight' });
    saveAndApply();
    setStatus('Eye filter reset');
    setTimeout(() => setStatus('Ready'), 1500);
  });

  // ── BG COLOR TOGGLE ──
  bgColorToggle.addEventListener('change', () => {
    state.bgColorEnabled = bgColorToggle.checked;
    bgColorCard.classList.toggle('bg-on', state.bgColorEnabled);
    setStatus(state.bgColorEnabled ? 'Background color active' : 'Ready');
    saveAndApply();
  });

  // ── BG COLOR PICKER ──
  bgColorPicker.addEventListener('input', () => {
    state.bgColor = bgColorPicker.value;
    bgColorHexLabel.textContent = state.bgColor.toUpperCase();
    updateQuickColorActive();
    if (state.bgColorEnabled) saveAndApply();
  });
  bgColorPicker.addEventListener('change', () => {
    state.bgColor = bgColorPicker.value;
    bgColorHexLabel.textContent = state.bgColor.toUpperCase();
    updateQuickColorActive();
    saveAndApply();
  });

  // ── QUICK COLOR SWATCHES ──
  quickColors.querySelectorAll('.qc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.color;
      state.bgColor = color;
      bgColorPicker.value = color;
      bgColorHexLabel.textContent = color.toUpperCase();
      if (!state.bgColorEnabled) {
        state.bgColorEnabled = true;
        bgColorToggle.checked = true;
        bgColorCard.classList.add('bg-on');
      }
      updateQuickColorActive();
      saveAndApply();
      setStatus('Color applied');
      setTimeout(() => setStatus('Ready'), 1200);
    });
  });

  // ── SHADE BUTTONS ──
  shadeGrid.querySelectorAll('.shade-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      shadeGrid.querySelectorAll('.shade-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.bgShade = btn.dataset.shade;
      saveAndApply();
    });
  });

  // ── SHADE INTENSITY ──
  shadeSlider.addEventListener('input', () => {
    state.shadeIntensity = parseInt(shadeSlider.value, 10);
    shadeVal.textContent = state.shadeIntensity + '%';
    saveAndApply();
  });

  // ── TEXT SCALE ──
  textScaleSlider.addEventListener('input', () => {
    state.textScale = parseInt(textScaleSlider.value, 10);
    textScaleVal.textContent = state.textScale + '%';
    saveAndApply();
  });

  // ── FONT FAMILY ──
  fontGrid.querySelectorAll('.font-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      fontGrid.querySelectorAll('.font-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.fontFamily = chip.dataset.font;
      setStatus('Font changed');
      setTimeout(() => setStatus('Ready'), 1200);
      saveAndApply();
    });
  });

  // ── PRESETS ──
  presetNight.addEventListener('click', () => {
    state.isDark = true; state.brightness = 65; state.eyeFilter = 40; state.contrast = 95;
    brightnessSlider.value = 65; brightnessVal.textContent = '65%';
    contrastSlider.value   = 95; contrastVal.textContent   = '95%';
    eyeSlider.value        = 40; updateEyeLabel(); updateModeCards();
    updateBrightnessSliderFill(); saveAndApply();
    setStatus('Night preset applied');
  });

  presetCafe.addEventListener('click', () => {
    state.isDark         = false;
    state.brightness     = 95;
    state.eyeFilter      = 25;
    state.bgColorEnabled = true;
    state.bgColor        = '#FFFDE7';
    state.bgShade        = 'warm';
    state.shadeIntensity = 30;
    brightnessSlider.value  = 95;  brightnessVal.textContent  = '95%';
    eyeSlider.value         = 25;  updateEyeLabel();
    bgColorToggle.checked   = true;
    bgColorPicker.value     = '#FFFDE7';
    bgColorHexLabel.textContent = '#FFFDE7';
    bgColorCard.classList.add('bg-on');
    shadeSlider.value   = 30; shadeVal.textContent = '30%';
    shadeGrid.querySelectorAll('.shade-btn').forEach(b => b.classList.remove('active'));
    shadeGrid.querySelector('[data-shade="warm"]').classList.add('active');
    updateModeCards(); updateBrightnessSliderFill();
    saveAndApply();
    setStatus('Cafe preset applied');
  });

  presetReset.addEventListener('click', () => {
    state.isDark = false; state.brightness = 100; state.contrast = 100;
    state.saturation = 100; state.eyeFilter = 0; state.readingMode = false;
    state.autoNight = false;
    state.bgColorEnabled = false; state.textScale = 100; state.fontFamily = 'default';
    state.bgShade = 'none'; state.shadeIntensity = 0;

    brightnessSlider.value = 100; brightnessVal.textContent = '100%';
    contrastSlider.value   = 100; contrastVal.textContent   = '100%';
    satSlider.value        = 100; satVal.textContent        = '100%';
    eyeSlider.value        = 0;   updateEyeLabel();
    textScaleSlider.value  = 100; textScaleVal.textContent  = '100%';
    shadeSlider.value      = 0;   shadeVal.textContent      = '0%';
    bgColorToggle.checked  = false;
    bgColorCard.classList.remove('bg-on');

    shadeGrid.querySelectorAll('.shade-btn').forEach(b => b.classList.remove('active'));
    shadeGrid.querySelector('[data-shade="none"]').classList.add('active');
    fontGrid.querySelectorAll('.font-chip').forEach(c => c.classList.remove('active'));
    fontGrid.querySelector('[data-font="default"]').classList.add('active');

    readingToggle.checked  = false;
    autoNightToggle.checked = false;
    readingCard.classList.remove('reading-on');
    autoNightCard.classList.remove('on');
    nightBadge.classList.remove('visible');
    stopAutoNightPolling();
    updateModeCards(); updateBrightnessSliderFill();
    saveAndApply();
    setStatus('All reset');
    setTimeout(() => setStatus('Ready'), 1200);
  });

  // ── SITE CONTROL ──
  disableSiteBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0] || !tabs[0].url) return;
      const domain = new URL(tabs[0].url).hostname;
      if (!state.disabledSites.includes(domain)) {
        state.disabledSites.push(domain);
        chrome.storage.local.set({ disabledSites: state.disabledSites });
        sendToActiveTab({ type: 'disableSite' });
        updateSiteStatus(domain);
        setStatus('Disabled on ' + domain);
      }
    });
  });

  enableSiteBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0] || !tabs[0].url) return;
      const domain = new URL(tabs[0].url).hostname;
      state.disabledSites = state.disabledSites.filter(d => d !== domain);
      chrome.storage.local.set({ disabledSites: state.disabledSites });
      updateSiteStatus(domain);
      setStatus('Re-enabled on ' + domain);
    });
  });

  // ── RESET ALL ──
  resetAllBtn.addEventListener('click', () => {
    chrome.storage.local.clear(() => {
      setStatus('Settings cleared');
      setTimeout(() => window.close(), 800);
    });
  });
});

// ── TAB SWITCH ──
function switchTab(tab) {
  const tabs   = { dark: tabDark, eye: tabEye, style: tabStyle, more: tabMore };
  const panels = { dark: panelDark, eye: panelEye, style: panelStyle, more: panelMore };
  Object.keys(tabs).forEach(k => {
    tabs[k].classList.toggle('active',   k === tab);
    panels[k].classList.toggle('active', k === tab);
  });
}

// ── MODE ──
function setMode(isDark) {
  state.isDark = isDark;
  updateModeCards();
  setStatus(isDark ? 'Dark mode enabled' : 'Light mode enabled');
  saveAndApply();
}
function updateModeCards() {
  lightCard.classList.toggle('active', !state.isDark);
  darkCard.classList.toggle('active',   state.isDark);
}

// ── EYE LABEL ──
function updateEyeLabel() {
  const v = state.eyeFilter;
  if (v === 0)    eyeFilterVal.textContent = 'Neutral';
  else if (v > 0) eyeFilterVal.textContent = 'Warm +' + v;
  else            eyeFilterVal.textContent = 'Cool ' + v;
}

// ── AUTO NIGHT ──
function applyAutoNightNow() {
  const now     = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const [fh, fm] = (state.nightFrom || '20:00').split(':').map(Number);
  const [th, tm] = (state.nightTo   || '07:00').split(':').map(Number);
  const fromMins = fh * 60 + (fm || 0);
  const toMins   = th * 60 + (tm || 0);
  const isNight  = fromMins > toMins
    ? (nowMins >= fromMins || nowMins < toMins)
    : (nowMins >= fromMins && nowMins < toMins);
  state.eyeFilter = isNight ? 40 : 0;
  eyeSlider.value = state.eyeFilter;
  updateEyeLabel();
}

function startAutoNightPolling() {
  stopAutoNightPolling();
  autoNightInterval = setInterval(() => {
    if (!state.autoNight) { stopAutoNightPolling(); return; }
    applyAutoNightNow();
    saveAndApply();
  }, 60000);
}

function stopAutoNightPolling() {
  if (autoNightInterval) { clearInterval(autoNightInterval); autoNightInterval = null; }
}

// ── BRIGHTNESS FILL ──
function updateBrightnessSliderFill() {
  const pct = ((state.brightness - 20) / 80) * 100;
  brightnessSlider.style.background =
    `linear-gradient(to right, #000 0%, #000 ${pct}%, #D0D8F0 ${pct}%, #D0D8F0 100%)`;
}

// ── QUICK COLOR ACTIVE STATE ──
function updateQuickColorActive() {
  const color = state.bgColor.toUpperCase();
  quickColors.querySelectorAll('.qc-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color.toUpperCase() === color);
  });
}

// ── BREAK TIMER ──
// Called when user TOGGLES the break reminder ON — resets the alarm and countdown.
function startBreakTimer() {
  stopBreakDisplay();
  breakNextAt = Date.now() + 20 * 60 * 1000;
  chrome.storage.local.set({ breakNextAt });
  chrome.runtime.sendMessage({ type: 'setBreakReminder', enabled: true });
  breakTimerDisplay.classList.add('visible');
  updateBreakDisplay();
  breakInterval = setInterval(updateBreakDisplay, 1000);
}

// Called on popup open when break is already enabled — resumes display without resetting alarm.
function resumeBreakDisplay() {
  stopDisplay();
  if (!breakNextAt || breakNextAt <= Date.now()) {
    // Alarm already fired or no timestamp — just show 20:00 and wait for next alarm tick
    breakNextAt = Date.now() + 20 * 60 * 1000;
  }
  breakTimerDisplay.classList.add('visible');
  updateBreakDisplay();
  breakInterval = setInterval(updateBreakDisplay, 1000);
}

function stopBreakTimer() {
  stopDisplay();
  breakNextAt = null;
  chrome.runtime.sendMessage({ type: 'setBreakReminder', enabled: false });
  chrome.storage.local.set({ breakNextAt: null });
}

function stopDisplay() {
  if (breakInterval) { clearInterval(breakInterval); breakInterval = null; }
  breakTimerDisplay.classList.remove('visible');
}

function updateBreakDisplay() {
  const ms    = Math.max(0, (breakNextAt || Date.now()) - Date.now());
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60), s = total % 60;
  breakCountdown.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ── SITE STATUS ──
function updateSiteStatus(domain) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0] || !tabs[0].url) return;
    const d = domain || new URL(tabs[0].url).hostname;
    const isDisabled = state.disabledSites.includes(d);
    siteDisabledBadge.classList.toggle('visible', isDisabled);
    siteDisabledText.textContent = 'Disabled on ' + d;
    disableSiteBtn.classList.toggle('is-hidden', isDisabled);
    enableSiteBtn.classList.toggle('is-hidden', !isDisabled);
  });
}

// ── RENDER ──
function renderUI() {
  brightnessSlider.value    = state.brightness;
  brightnessVal.textContent = state.brightness + '%';
  updateBrightnessSliderFill();

  contrastSlider.value    = state.contrast;
  contrastVal.textContent = state.contrast + '%';

  satSlider.value    = state.saturation;
  satVal.textContent = state.saturation + '%';

  eyeSlider.value = state.eyeFilter;
  updateEyeLabel();

  autoNightToggle.checked = state.autoNight;
  autoNightCard.classList.toggle('on', state.autoNight);
  nightBadge.classList.toggle('visible', state.autoNight);
  nightFrom.value = state.nightFrom || '20:00';
  nightTo.value   = state.nightTo   || '07:00';

  readingToggle.checked = state.readingMode;
  readingCard.classList.toggle('reading-on', state.readingMode);

  breakToggle.checked = state.breakReminder;
  breakCard.classList.toggle('break-on', state.breakReminder);
  if (state.breakReminder) breakTimerDisplay.classList.add('visible');

  // Background color
  bgColorPicker.value         = state.bgColor;
  bgColorHexLabel.textContent = state.bgColor.toUpperCase();
  bgColorToggle.checked       = state.bgColorEnabled;
  bgColorCard.classList.toggle('bg-on', state.bgColorEnabled);
  updateQuickColorActive();

  // Shade
  document.querySelectorAll('.shade-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.shade === state.bgShade);
  });
  shadeSlider.value    = state.shadeIntensity;
  shadeVal.textContent = state.shadeIntensity + '%';

  // Text scale
  textScaleSlider.value    = state.textScale;
  textScaleVal.textContent = state.textScale + '%';

  // Font family
  document.querySelectorAll('.font-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.font === state.fontFamily);
  });

  updateModeCards();

  if (state.isDark)           setStatus('Dark mode enabled');
  else if (state.autoNight)   setStatus('Auto Night active');
  else if (state.bgColorEnabled) setStatus('Background color active');
  else                        setStatus('Ready');
}

function setStatus(msg) { statusText.textContent = msg; }

// ── SAVE & APPLY ──
function saveAndApply() {
  const toSave = { ...state, breakNextAt };
  chrome.storage.local.set(toSave, () => {
    sendToActiveTab({ type: 'applyTheme', config: { ...state } });
  });
}

// Listen for breakNextAt updates from background (alarm fired)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.breakNextAt) {
    breakNextAt = changes.breakNextAt.newValue ?? null;
    if (state.breakReminder) updateBreakDisplay();
  }
});

// ── SEND TO ACTIVE TAB ──
function sendToActiveTab(msg) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    const tab = tabs[0];
    if (!tab.url
      || tab.url.startsWith('chrome://')
      || tab.url.startsWith('chrome-extension://')
      || tab.url.startsWith('edge://')
      || tab.url.startsWith('about:')
      || tab.url.startsWith('data:')) return;

    chrome.tabs.sendMessage(tab.id, msg, () => {
      if (chrome.runtime.lastError) {
        chrome.scripting.executeScript(
          { target: { tabId: tab.id }, files: ['content.js'] },
          () => {
            if (chrome.runtime.lastError) return;
            setTimeout(() => chrome.tabs.sendMessage(tab.id, msg), 200);
          }
        );
      }
    });
  });
}
