'use strict';

// ── Popup Controller ──────────────────────────────────────────────────────────
// Manages all four panels: Focus, Water, Dashboard, Settings.
// All DOM writes go through textContent / setAttribute — no innerHTML.

// ── Constants ─────────────────────────────────────────────────────────────────

const RING_CIRCUMFERENCE   = 553;   // 2π × 88
const H_RING_CIRCUMFERENCE = 364;   // 2π × 58

const MODE_LABELS = {
  work:       'Focus Time',
  shortBreak: 'Short Break',
  longBreak:  'Long Break',
  deepWork:   'Deep Work',
};

const TIPS = [
  'Drink water before you feel thirsty — thirst signals mild dehydration.',
  'Keep a water bottle on your desk as a visual cue to sip regularly.',
  'Start your morning with a full glass of water to jumpstart your system.',
  'Your brain is 75% water. Hydration improves focus and mood.',
  'Dark urine means dehydration. Aim for pale yellow throughout the day.',
  'The 20-20-20 rule: look 20 feet away for 20 seconds every 20 minutes.',
  'Short breaks improve overall productivity more than working through them.',
  'Standing up for even 2 minutes every hour reduces fatigue significantly.',
];

const SVG_NS = 'http://www.w3.org/2000/svg';

// ── SVG icon builders (CSP-safe) ──────────────────────────────────────────────

function _svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function _makeSvg(w, h, ...children) {
  const svg = _svgEl('svg', {
    viewBox: `0 0 ${w} ${h}`, fill: 'currentColor',
    width: w, height: h, xmlns: SVG_NS,
  });
  for (const c of children) svg.appendChild(c);
  return svg;
}

function makePlayIcon() {
  return _makeSvg(16, 16, _svgEl('polygon', { points: '3,2 14,8 3,14' }));
}

function makePauseIcon() {
  return _makeSvg(16, 16,
    _svgEl('rect', { x: '2',  y: '2', width: '4', height: '12', rx: '1' }),
    _svgEl('rect', { x: '10', y: '2', width: '4', height: '12', rx: '1' }),
  );
}

// ── State ─────────────────────────────────────────────────────────────────────

let _localTick = null;
let _drinkAmount = 250;
let _activePanel = 'focus';

// ── Message helpers ───────────────────────────────────────────────────────────

function _send(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (res) => resolve(res || {}));
  });
}

// ── Panel routing ─────────────────────────────────────────────────────────────

function _showPanel(name) {
  _activePanel = name;
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.panel === name);
    t.setAttribute('aria-selected', t.dataset.panel === name ? 'true' : 'false');
  });
  document.querySelectorAll('.panel').forEach(p => {
    const visible = p.id === `panel-${name}`;
    p.hidden = !visible;
    if (visible) p.removeAttribute('hidden');
  });

  // Refresh the newly visible panel
  if (name === 'water') _loadHydration();
  if (name === 'dash')  _loadDashboard();
  if (name === 'config') _loadSettings();
}

// ══════════════════════════════════════════════════════════════════════════════
// FOCUS PANEL
// ══════════════════════════════════════════════════════════════════════════════

function _renderPomodoro(pom) {
  if (!pom) return;
  const { timeLeft, totalTime, mode, running, completedToday } = pom;

  // Clock display
  const t = timeLeft ?? totalTime ?? 0;
  const m = String(Math.floor(t / 60)).padStart(2, '0');
  const s = String(t % 60).padStart(2, '0');
  document.getElementById('timeDisplay').textContent = `${m}:${s}`;

  // Mode label
  document.getElementById('modeLabel').textContent = MODE_LABELS[mode] || 'Focus Time';

  // Ring progress
  const pct  = totalTime > 0 ? t / totalTime : 1;
  const offset = RING_CIRCUMFERENCE * (1 - pct);
  document.getElementById('ringProgress').setAttribute('stroke-dashoffset', String(offset));

  // App-level mode class (for CSS accent colors)
  document.getElementById('app').setAttribute('data-mode', mode);

  // Mode tabs
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });

  // Play/pause button
  const icon  = document.getElementById('mainBtnIcon');
  const label = document.getElementById('mainBtnLabel');
  const newIcon = running ? makePauseIcon() : makePlayIcon();
  icon.replaceChildren(newIcon);
  label.textContent = running ? 'Pause' : 'Start';

  // Stats
  document.getElementById('statSessions').textContent = completedToday ?? 0;
  document.getElementById('statFocused').textContent  = `${(completedToday ?? 0) * 25}m`;
  document.getElementById('statStreak').textContent   = pom.session ?? 0;

  // Deep work button state
  const dwBtn = document.getElementById('deepWorkBtn');
  dwBtn.classList.toggle('active', mode === 'deepWork' && running);
}

function _startLocalTick() {
  _stopLocalTick();
  _localTick = setInterval(() => {
    chrome.storage.local.get('pomodoro', ({ pomodoro }) => {
      if (!pomodoro) return;
      if (pomodoro.running && pomodoro.startedAt) {
        const elapsed = Math.floor((Date.now() - pomodoro.startedAt) / 1000);
        pomodoro.timeLeft = Math.max(0, pomodoro.totalTime - elapsed);
      }
      if (_activePanel === 'focus') _renderPomodoro(pomodoro);
    });
  }, 500);
}

function _stopLocalTick() {
  if (_localTick) { clearInterval(_localTick); _localTick = null; }
}

// Alarm sound (played when timer finishes, detected via storage change)
function _playAlarm() {
  try {
    const audio = new Audio(chrome.runtime.getURL('icons/alarm.mp3'));
    audio.volume = 0.7;
    const p = audio.play();
    if (p) p.catch(() => {});
  } catch (_) {}
}

// Watch for session completions from background
chrome.storage.onChanged.addListener((changes) => {
  if (!changes.pomodoro) return;
  const oldVal = changes.pomodoro.oldValue;
  const newVal = changes.pomodoro.newValue;

  // Session just ended
  if (oldVal?.running && !newVal?.running && newVal?.timeLeft === newVal?.totalTime) {
    _playAlarm();
  }

  if (_activePanel === 'focus' && newVal) _renderPomodoro(newVal);
});

function _initFocusPanel() {
  // Mode tabs
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      _stopLocalTick();
      _send({ action: 'pomodoro:switchMode', mode: tab.dataset.mode }).then(() => {
        chrome.storage.local.get('pomodoro', ({ pomodoro }) => _renderPomodoro(pomodoro));
      });
    });
  });

  // Start / Pause
  document.getElementById('mainBtn').addEventListener('click', () => {
    chrome.storage.local.get('pomodoro', ({ pomodoro }) => {
      if (!pomodoro) return;
      if (pomodoro.running) {
        _send({ action: 'pomodoro:pause' }).then(() => {
          _stopLocalTick();
          chrome.storage.local.get('pomodoro', ({ pomodoro: p }) => _renderPomodoro(p));
        });
      } else {
        _send({ action: 'pomodoro:start' }).then(() => {
          _startLocalTick();
        });
      }
    });
  });

  // Reset
  document.getElementById('resetBtn').addEventListener('click', () => {
    _stopLocalTick();
    _send({ action: 'pomodoro:reset' }).then(() => {
      chrome.storage.local.get('pomodoro', ({ pomodoro }) => _renderPomodoro(pomodoro));
    });
  });

  // Skip
  document.getElementById('skipBtn').addEventListener('click', () => {
    chrome.storage.local.get('pomodoro', ({ pomodoro }) => {
      if (!pomodoro) return;
      const next =
        pomodoro.mode === 'work'       ? 'shortBreak' :
        pomodoro.mode === 'shortBreak' ? 'longBreak'  : 'work';
      _stopLocalTick();
      _send({ action: 'pomodoro:switchMode', mode: next }).then(() => {
        chrome.storage.local.get('pomodoro', ({ pomodoro: p }) => _renderPomodoro(p));
      });
    });
  });

  // Deep Work
  document.getElementById('deepWorkBtn').addEventListener('click', () => {
    _stopLocalTick();
    _send({ action: 'pomodoro:deepWork' }).then(() => {
      _startLocalTick();
      chrome.storage.local.get('pomodoro', ({ pomodoro }) => _renderPomodoro(pomodoro));
    });
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// HYDRATION PANEL
// ══════════════════════════════════════════════════════════════════════════════

function _renderHydration(data) {
  const consumed  = data.consumed || 0;
  const goal      = data.goal     || 3000;
  const streak    = data.streak   || 0;
  const pct       = Math.min(Math.round((consumed / goal) * 100), 100);
  const remaining = Math.max(goal - consumed, 0);

  document.getElementById('hPercent').textContent    = `${pct}%`;
  document.getElementById('hConsumed').textContent   = consumed.toLocaleString();
  document.getElementById('hRemaining').textContent  = remaining.toLocaleString();
  document.getElementById('hStreak').textContent     = streak;

  // Ring
  const offset = H_RING_CIRCUMFERENCE - (pct / 100) * H_RING_CIRCUMFERENCE;
  document.getElementById('hRingFill').setAttribute('stroke-dashoffset', String(offset));

  // Progress bar
  document.getElementById('hProgressFill').style.width = `${pct}%`;
}

async function _loadHydration() {
  const result = await new Promise(r => chrome.storage.local.get('hydration', r));
  _renderHydration(result.hydration || {});
}

function _initHydrationPanel() {
  // Drink amount selector
  document.querySelectorAll('.drink-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _drinkAmount = parseInt(btn.dataset.amount, 10) || 250;
      document.querySelectorAll('.drink-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Log water
  document.getElementById('logWaterBtn').addEventListener('click', async () => {
    const btn = document.getElementById('logWaterBtn');
    btn.disabled = true;
    btn.textContent = 'Logged!';

    await _send({ action: 'hydration:log', amount: _drinkAmount });
    await _loadHydration();

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Log Water';
    }, 1200);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD PANEL
// ══════════════════════════════════════════════════════════════════════════════

async function _loadDashboard() {
  const result = await new Promise(r =>
    chrome.storage.local.get(['analytics', 'hydration', 'pomodoro'], r)
  );

  const analytics  = result.analytics  || {};
  const hydration  = result.hydration  || {};
  const pomodoro   = result.pomodoro   || {};

  // Date label
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  document.getElementById('dashDate').textContent = dateStr;

  // Stat cards
  document.getElementById('dashFocus').textContent  = `${analytics.focusMinutesToday || 0}m`;
  document.getElementById('dashWater').textContent  = `${hydration.consumed || 0} ml`;
  document.getElementById('dashBreaks').textContent = analytics.breaksToday || 0;
  document.getElementById('dashStreak').textContent = hydration.streak || 0;

  // Bar chart — weekly focus
  _renderBarChart(analytics.weeklyFocus || []);

  // Tip
  const tipEl = document.getElementById('tipCard');
  tipEl.textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
}

function _renderBarChart(data) {
  const chart   = document.getElementById('barChart');
  const daysRow = document.getElementById('barDays');
  chart.replaceChildren();
  daysRow.replaceChildren();

  // Ensure 7 slots
  const vals = Array.from({ length: 7 }, (_, i) => data[i] || 0);
  const max  = Math.max(...vals, 1);

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const today = new Date().getDay(); // 0=Sun

  vals.forEach((val, idx) => {
    // Bar
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = `${Math.round((val / max) * 48)}px`;
    if (idx === vals.length - 1) bar.classList.add('today');
    chart.appendChild(bar);

    // Day label
    const dayOffset = (today - (6 - idx) + 7) % 7;
    const lbl = document.createElement('span');
    lbl.className = 'day-lbl';
    lbl.textContent = dayNames[dayOffset];
    daysRow.appendChild(lbl);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS PANEL
// ══════════════════════════════════════════════════════════════════════════════

async function _loadSettings() {
  const result = await new Promise(r =>
    chrome.storage.local.get(['pomodoroSettings', 'hydration', 'eyeCare', 'breaks'], r)
  );

  const ps  = result.pomodoroSettings || {};
  const hyd = result.hydration        || {};
  const ec  = result.eyeCare          || {};
  const brk = result.breaks           || {};

  // Pomodoro
  _setInputVal('cfgWork',     Math.round((ps.workTime     || 25 * 60) / 60));
  _setInputVal('cfgShort',    Math.round((ps.shortBreak   || 5  * 60) / 60));
  _setInputVal('cfgLong',     Math.round((ps.longBreak    || 15 * 60) / 60));
  _setInputVal('cfgInterval', ps.longBreakInterval || 4);
  document.getElementById('cfgAutoStart').checked = ps.autoStart || false;

  // Hydration
  _setInputVal('cfgGoal',          hyd.goal             || 3000);
  _setInputVal('cfgWaterInterval', hyd.intervalMinutes  || 30);
  document.getElementById('cfgQuiet').checked      = hyd.quietEnabled || false;
  _setInputVal('cfgQuietStart',    hyd.quietStart || '22:00');
  _setInputVal('cfgQuietEnd',      hyd.quietEnd   || '07:00');
  _toggleQuietFields(hyd.quietEnabled);

  // Wellness
  document.getElementById('cfgEyeCare').checked    = ec.enabled !== false;
  _setInputVal('cfgEyeInterval',   ec.intervalMinutes  || 20);
  document.getElementById('cfgBreaks').checked      = brk.enabled !== false;
  _setInputVal('cfgBreakInterval', brk.intervalMinutes || 60);
}

function _setInputVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function _toggleQuietFields(enabled) {
  const fields = document.getElementById('quietFields');
  if (fields) fields.style.display = enabled ? 'block' : 'none';
}

async function _saveSettings() {
  // Pomodoro
  const pomSettings = {
    workTime:          _getIntVal('cfgWork',     1, 120) * 60,
    shortBreak:        _getIntVal('cfgShort',    1, 60)  * 60,
    longBreak:         _getIntVal('cfgLong',     1, 60)  * 60,
    longBreakInterval: _getIntVal('cfgInterval', 2, 10),
    autoStart:         document.getElementById('cfgAutoStart').checked,
    deepWorkTime:      90 * 60,
  };
  await _send({ action: 'pomodoro:settings', settings: pomSettings });

  // Hydration
  await _send({
    action: 'hydration:settings',
    settings: {
      goal:            _getIntVal('cfgGoal', 500, 8000),
      intervalMinutes: _getIntVal('cfgWaterInterval', 5, 120),
      quietEnabled:    document.getElementById('cfgQuiet').checked,
      quietStart:      document.getElementById('cfgQuietStart').value || '22:00',
      quietEnd:        document.getElementById('cfgQuietEnd').value   || '07:00',
    },
  });

  // Eye care
  const eyeEnabled = document.getElementById('cfgEyeCare').checked;
  await _send({ action: 'eyecare:toggle',   enabled: eyeEnabled });
  await _send({ action: 'eyecare:interval', minutes: _getIntVal('cfgEyeInterval', 10, 60) });

  // Breaks
  const brksEnabled = document.getElementById('cfgBreaks').checked;
  await _send({ action: 'breaks:toggle',   enabled: brksEnabled });
  await _send({ action: 'breaks:interval', minutes: _getIntVal('cfgBreakInterval', 30, 240) });

  // Feedback
  const fb = document.getElementById('saveFeedback');
  fb.textContent = 'Settings saved';
  fb.classList.add('visible');
  setTimeout(() => fb.classList.remove('visible'), 2000);
}

function _getIntVal(id, min, max) {
  const el = document.getElementById(id);
  if (!el) return min;
  return Math.min(Math.max(parseInt(el.value, 10) || min, min), max);
}

function _initSettingsPanel() {
  document.getElementById('cfgQuiet').addEventListener('change', (e) => {
    _toggleQuietFields(e.target.checked);
  });

  document.getElementById('saveSettingsBtn').addEventListener('click', _saveSettings);
}

// ══════════════════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════════════════

async function init() {
  // Wire up nav tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => _showPanel(tab.dataset.panel));
  });

  // Wire settings shortcut button
  document.getElementById('settingsBtn').addEventListener('click', () => _showPanel('config'));

  // Init each panel's interactive controls
  _initFocusPanel();
  _initHydrationPanel();
  _initSettingsPanel();

  // Load initial pomodoro state
  chrome.storage.local.get('pomodoro', ({ pomodoro }) => {
    if (pomodoro) {
      // Recompute timeLeft based on startedAt
      if (pomodoro.running && pomodoro.startedAt) {
        const elapsed = Math.floor((Date.now() - pomodoro.startedAt) / 1000);
        pomodoro.timeLeft = Math.max(0, pomodoro.totalTime - elapsed);
      }
      _renderPomodoro(pomodoro);
      if (pomodoro.running) _startLocalTick();
    } else {
      _renderPomodoro({
        timeLeft: 25 * 60, totalTime: 25 * 60,
        mode: 'work', running: false,
        session: 0, completedToday: 0,
      });
    }
  });

  // Record popup open as "last activity" for smart activity detection
  chrome.storage.local.get('appState', ({ appState }) => {
    const state = appState || {};
    state.lastActivity = Date.now();
    chrome.storage.local.set({ appState: state });
  });
}

document.addEventListener('DOMContentLoaded', init);
