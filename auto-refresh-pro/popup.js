// popup.js — Auto Refresh Pro
// CSP-compliant: no innerHTML, no eval, no inline JS
// Uses createElement + textContent + appendChild throughout

// ── Utilities ────────────────────────────────────────────────────────────────

function $(id) { return document.getElementById(id); }
function $$(sel) { return document.querySelectorAll(sel); }

function sendMsg(msg) {
  return chrome.runtime.sendMessage(msg);
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function truncateUrl(url, max = 38) {
  try {
    const u = new URL(url);
    const display = u.hostname + u.pathname;
    return display.length > max ? display.slice(0, max) + '…' : display;
  } catch {
    return url.length > max ? url.slice(0, max) + '…' : url;
  }
}

function formatCountdown(ms) {
  if (ms <= 0) return '0:00';
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

// ── State ─────────────────────────────────────────────────────────────────────

let currentTabId = null;
let currentTabUrl = '';
let currentState = null;
let countdownInterval = null;
let activeTabsInterval = null;
let notificationsEnabled = true;
let errorTimeout = null;
let lastOpenTabs = [];
const openTabSelection = new Map(); // tabId -> boolean

const PREFS_KEY = 'prefs_v1';

async function getPrefs() {
  const res = await chrome.storage.local.get(PREFS_KEY);
  return res[PREFS_KEY] || { notificationsEnabled: true };
}

async function setPrefs(prefs) {
  await chrome.storage.local.set({ [PREFS_KEY]: prefs });
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  const prefs = await getPrefs();
  notificationsEnabled = prefs.notificationsEnabled !== false;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  currentTabId = tab.id;
  currentTabUrl = tab.url || '';

  // Set URL in header
  $('current-url').textContent = truncateUrl(currentTabUrl);

  // Load current tab state
  const res = await sendMsg({ action: 'GET_STATE', tabId: currentTabId });
  currentState = res?.state || null;

  syncNotificationButton();
  updateMainButton();
  updateStatusBar();
  setupTabBar();
  setupTimeInterval();
  setupCountdown();
  setupMonitor();
  setupActiveTabs();
  setupGlobalActions();

  // Poll active tabs every 2 seconds
  refreshActiveTabs();
  activeTabsInterval = setInterval(refreshActiveTabs, 2000);
  refreshOpenTabsList();
}

function syncNotificationButton() {
  const btn = $('notif-btn');
  btn.classList.toggle('active', notificationsEnabled);
  btn.setAttribute('aria-pressed', String(notificationsEnabled));
  btn.title = notificationsEnabled ? 'Notifications: On' : 'Notifications: Off';
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

function setupTabBar() {
  $$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
      $$('.panel').forEach(p => { p.classList.remove('active'); p.hidden = true; });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const panelId = 'panel-' + tab.dataset.tab;
      const panel = $(panelId);
      if (panel) { panel.classList.add('active'); panel.hidden = false; }
    });
  });
}

// ── Main start/stop button ────────────────────────────────────────────────────

function updateMainButton() {
  const btn = $('main-start-btn');
  const label = $('main-btn-label');
  const isActive = currentState?.active;

  label.textContent = isActive ? 'Stop' : 'Start';
  btn.classList.toggle('running', !!isActive);
}

function showError(message) {
  const bar = $('status-bar');
  const dot = $('status-dot');
  const text = $('status-text');
  const timer = $('status-timer');
  clearTimeout(errorTimeout);

  bar.hidden = false;
  bar.classList.add('error');
  dot.className = 'status-dot error';
  text.textContent = message || 'Something went wrong.';
  timer.textContent = '';

  errorTimeout = setTimeout(() => {
    if (!currentState?.active) bar.hidden = true;
  }, 3500);
}

$('main-start-btn').addEventListener('click', async () => {
  if (currentState?.active) {
    await sendMsg({ action: 'STOP_REFRESH', tabId: currentTabId });
    currentState = null;
  } else {
    const config = buildConfig();
    const startRes = await sendMsg({ action: 'START_REFRESH', tabId: currentTabId, config });
    if (startRes?.success === false) showError(startRes.error);
    const res = await sendMsg({ action: 'GET_STATE', tabId: currentTabId });
    currentState = res?.state || null;
  }
  updateMainButton();
  updateStatusBar();
});

// ── Build config from UI ──────────────────────────────────────────────────────

function buildConfig() {
  const isRandom = $('rand-toggle').checked;
  const hr = parseInt($('custom-hr').value) || 0;
  const min = parseInt($('custom-min').value) || 0;
  const sec = parseInt($('custom-sec').value) || 0;
  const totalSec = hr * 3600 + min * 60 + sec || 30;

  const selectedChip = document.querySelector('.chip.selected');
  const chipSec = selectedChip ? parseInt(selectedChip.dataset.seconds) : null;

  const monitorKeyword = $('monitor-keyword').value.trim();
  const monitorCondition = document.querySelector('#condition-pills .pill.active')?.dataset.value || 'appears';
  const monitorSearchIn = document.querySelector('#searchin-pills .pill.active')?.dataset.value || 'visual';

  const limitEnabled = $('limit-toggle').checked;

  return {
    mode: isRandom ? 'random' : 'interval',
    intervalSeconds: chipSec || totalSec,
    randomMin: parseInt($('rand-min')?.value) || 5,
    randomMax: parseInt($('rand-max')?.value) || 30,
    hardRefresh: $('hard-refresh-toggle').checked,
    stopOnInteraction: $('stop-interact-toggle').checked,
    maxRefreshes: limitEnabled ? (parseInt($('refresh-limit').value) || 0) : 0,
    monitorEnabled: !!monitorKeyword,
    monitorKeyword,
    monitorCondition,
    monitorSearchIn,
    continueAfterDetection: $('chk-continue').classList.contains('checked'),
    autoClickOnDetection: $('chk-autoclick').classList.contains('checked'),
    monitorFullPage: $('chk-fullpage').classList.contains('checked'),
    url: currentTabUrl
  };
}

// ── Time Interval Panel ───────────────────────────────────────────────────────

function setupTimeInterval() {
  // Chip selection
  $$('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $$('.chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
    });
  });

  // Custom inputs clear chip selection
  ['custom-hr','custom-min','custom-sec'].forEach(id => {
    $(id).addEventListener('input', debounce(() => {
      $$('.chip').forEach(c => c.classList.remove('selected'));
    }, 200));
  });

  // Random interval toggle
  $('rand-toggle').addEventListener('change', function () {
    const box = $('random-expand');
    box.hidden = !this.checked;
  });

  // Limit toggle
  $('limit-toggle').addEventListener('change', function () {
    $('limit-expand').hidden = !this.checked;
  });

  // Start button
  $('start-btn').addEventListener('click', async () => {
    const config = buildConfig();
    const startRes = await sendMsg({ action: 'START_REFRESH', tabId: currentTabId, config });
    if (startRes?.success === false) showError(startRes.error);
    const res = await sendMsg({ action: 'GET_STATE', tabId: currentTabId });
    currentState = res?.state || null;
    updateMainButton();
    updateStatusBar();
  });

  // Stop button
  $('stop-btn').addEventListener('click', async () => {
    await sendMsg({ action: 'STOP_REFRESH', tabId: currentTabId });
    currentState = null;
    updateMainButton();
    updateStatusBar();
  });
}

// ── Countdown Panel ───────────────────────────────────────────────────────────

function setupCountdown() {
  const modeCards = $$('.mode-card');

  modeCards.forEach(card => {
    card.addEventListener('click', () => {
      modeCards.forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-checked','false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-checked','true');
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });

  $('cd-start-btn').addEventListener('click', async () => {
    const isDuration = $('mode-duration').classList.contains('selected');
    let countdownSeconds;

    if (isDuration) {
      const h = parseInt($('cd-hr').value) || 0;
      const m = parseInt($('cd-min').value) || 0;
      const s = parseInt($('cd-sec').value) || 0;
      countdownSeconds = h * 3600 + m * 60 + s;
    } else {
      const dateStr = $('cd-date').value;
      const timeStr = $('cd-time').value;
      if (!dateStr || !timeStr) return;
      const target = new Date(`${dateStr}T${timeStr}`);
      countdownSeconds = Math.floor((target.getTime() - Date.now()) / 1000);
    }

    if (countdownSeconds <= 0) return;

    const config = {
      mode: 'countdown',
      countdownSeconds,
      hardRefresh: $('hard-refresh-toggle').checked,
      url: currentTabUrl
    };

    const startRes = await sendMsg({ action: 'START_REFRESH', tabId: currentTabId, config });
    if (startRes?.success === false) showError(startRes.error);
    const res = await sendMsg({ action: 'GET_STATE', tabId: currentTabId });
    currentState = res?.state || null;

    updateMainButton();
    updateStatusBar();
    startCountdownDisplay(countdownSeconds);
  });

  $('cd-stop-btn').addEventListener('click', async () => {
    await sendMsg({ action: 'STOP_REFRESH', tabId: currentTabId });
    currentState = null;
    clearInterval(countdownInterval);
    $('countdown-display').hidden = true;
    updateMainButton();
    updateStatusBar();
  });
}

function startCountdownDisplay(totalSeconds) {
  const display = $('countdown-display');
  const num = $('countdown-num');
  display.hidden = false;

  let remaining = totalSeconds;
  num.textContent = formatCountdown(remaining * 1000);

  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    remaining--;
    num.textContent = formatCountdown(remaining * 1000);
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      display.hidden = true;
    }
  }, 1000);
}

// ── Monitor Panel ─────────────────────────────────────────────────────────────

function setupMonitor() {
  // Pill groups
  setupPillGroup('condition-pills');
  setupPillGroup('searchin-pills');

  // Checkboxes
  $$('.checkbox').forEach(cb => {
    cb.addEventListener('click', () => {
      const checked = cb.classList.toggle('checked');
      cb.setAttribute('aria-checked', String(checked));
    });
  });

  $('monitor-start-btn').addEventListener('click', async () => {
    const keyword = $('monitor-keyword').value.trim();
    if (!keyword) {
      $('monitor-keyword').focus();
      return;
    }

    const condition = document.querySelector('#condition-pills .pill.active')?.dataset.value || 'appears';
    const searchIn = document.querySelector('#searchin-pills .pill.active')?.dataset.value || 'visual';

    const config = buildConfig();
    config.monitorEnabled = true;
    config.monitorKeyword = keyword;
    config.monitorCondition = condition;
    config.monitorSearchIn = searchIn;

    const startRes = await sendMsg({ action: 'START_REFRESH', tabId: currentTabId, config });
    if (startRes?.success === false) showError(startRes.error);
    const res = await sendMsg({ action: 'GET_STATE', tabId: currentTabId });
    currentState = res?.state || null;
    updateMainButton();
    updateStatusBar();
  });

  $('monitor-stop-btn').addEventListener('click', async () => {
    await sendMsg({ action: 'STOP_REFRESH', tabId: currentTabId });
    currentState = null;
    updateMainButton();
    updateStatusBar();
  });
}

function setupPillGroup(groupId) {
  const pills = $$(`#${groupId} .pill`);
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => { p.classList.remove('active'); p.setAttribute('aria-checked','false'); });
      pill.classList.add('active');
      pill.setAttribute('aria-checked','true');
    });
  });
}

// ── Active Tabs Panel ─────────────────────────────────────────────────────────

function setupActiveTabs() {
  $('stop-all-btn').addEventListener('click', async () => {
    await sendMsg({ action: 'STOP_ALL' });
    currentState = null;
    updateMainButton();
    updateStatusBar();
    refreshActiveTabs();
    refreshOpenTabsList();
  });

  $('select-all-tabs-btn').addEventListener('click', () => {
    for (const t of lastOpenTabs) openTabSelection.set(t.id, true);
    renderOpenTabsList(lastOpenTabs);
  });

  $('clear-all-tabs-btn').addEventListener('click', () => {
    for (const t of lastOpenTabs) openTabSelection.set(t.id, false);
    renderOpenTabsList(lastOpenTabs);
  });

  $('start-selected-tabs-btn').addEventListener('click', async () => {
    const selected = lastOpenTabs.filter((t) => openTabSelection.get(t.id));
    if (!selected.length) {
      showError('Select at least one tab.');
      return;
    }

    const baseConfig = buildConfig();
    let started = 0;
    let failed = 0;

    for (const tab of selected) {
      const config = { ...baseConfig, url: tab.url || '' };
      const res = await sendMsg({ action: 'START_REFRESH', tabId: tab.id, config });
      if (res?.success === false) failed++;
      else started++;
    }

    if (failed) showError(`Started on ${started} tab(s), failed on ${failed}.`);
    refreshActiveTabs();
  });
}

async function refreshActiveTabs() {
  const res = await sendMsg({ action: 'GET_ALL_ACTIVE' });
  const tabs = res?.tabs || [];

  const alertTabs = tabs.filter(t => t.monitorEnabled && t.active);
  const refreshTabs = tabs.filter(t => !t.monitorEnabled && t.active);

  renderTabList('alert-tabs-list', 'alert-empty', alertTabs, true);
  renderTabList('active-tabs-list', 'active-empty', refreshTabs, false);
}

async function refreshOpenTabsList() {
  const res = await chrome.tabs.query({ currentWindow: true });
  const refreshable = (res || []).filter((t) => {
    const u = t.url || '';
    return typeof t.id === 'number' && (u.startsWith('http://') || u.startsWith('https://'));
  });

  lastOpenTabs = refreshable;

  // Initialize selection once (default select all).
  if (!openTabSelection.size) {
    for (const t of refreshable) openTabSelection.set(t.id, true);
  } else {
    // Keep selection map in sync (remove closed tabs, add new tabs selected by default).
    const ids = new Set(refreshable.map((t) => t.id));
    for (const id of Array.from(openTabSelection.keys())) {
      if (!ids.has(id)) openTabSelection.delete(id);
    }
    for (const t of refreshable) {
      if (!openTabSelection.has(t.id)) openTabSelection.set(t.id, true);
    }
  }

  renderOpenTabsList(refreshable);
}

function renderOpenTabsList(tabs) {
  const container = $('open-tabs-list');
  const emptyEl = $('open-tabs-empty');

  container.querySelectorAll('.open-tab-item').forEach((el) => el.remove());

  if (!tabs.length) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  tabs.forEach((tab) => {
    const item = document.createElement('div');
    item.className = 'open-tab-item';
    item.tabIndex = 0;

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = openTabSelection.get(tab.id) !== false;
    check.addEventListener('change', () => openTabSelection.set(tab.id, check.checked));

    const main = document.createElement('div');
    main.className = 'open-tab-main';

    const title = document.createElement('div');
    title.className = 'open-tab-title';
    title.textContent = tab.title || 'Untitled';

    const url = document.createElement('div');
    url.className = 'open-tab-url';
    url.textContent = truncateUrl(tab.url || '');
    url.title = tab.url || '';

    main.appendChild(title);
    main.appendChild(url);

    item.appendChild(check);
    item.appendChild(main);

    item.addEventListener('click', (e) => {
      if (e.target === check) return;
      check.checked = !check.checked;
      openTabSelection.set(tab.id, check.checked);
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        check.checked = !check.checked;
        openTabSelection.set(tab.id, check.checked);
      }
    });

    container.appendChild(item);
  });
}

function renderTabList(listId, emptyId, tabs, isAlert) {
  const container = $(listId);
  // Remove old tab items (keep empty state)
  container.querySelectorAll('.tab-item').forEach(el => el.remove());

  const emptyEl = $(emptyId);

  if (!tabs.length) {
    if (emptyEl) emptyEl.hidden = false;
    return;
  }
  if (emptyEl) emptyEl.hidden = true;

  tabs.forEach(tabState => {
    const item = document.createElement('div');
    item.className = 'tab-item';
    item.tabIndex = 0;

    const dot = document.createElement('span');
    dot.className = 'status-dot ' + (tabState.active ? (isAlert ? 'yellow' : 'green') : 'red');

    const url = document.createElement('span');
    url.className = 'tab-url';
    url.textContent = truncateUrl(tabState.url || 'Unknown tab');
    url.title = tabState.url || '';

    const meta = document.createElement('div');
    meta.className = 'tab-meta';

    // Countdown timer
    const timer = document.createElement('span');
    timer.className = 'tab-timer';
    if (tabState.nextFireAt) {
      const remaining = Math.max(0, tabState.nextFireAt - Date.now());
      timer.textContent = formatCountdown(remaining);
    } else {
      timer.textContent = '—';
    }

    // Badge
    const badge = document.createElement('span');
    badge.className = 'badge ' + (isAlert ? 'yellow' : 'green');
    badge.textContent = isAlert ? 'Monitoring' : 'Running';

    // Stop button
    const stopBtn = document.createElement('button');
    stopBtn.className = 'tab-stop-btn';
    stopBtn.title = 'Stop this tab';
    stopBtn.setAttribute('aria-label', 'Stop refresh for this tab');

    const stopIcon = document.createElementNS('http://www.w3.org/2000/svg','svg');
    stopIcon.setAttribute('width','10');
    stopIcon.setAttribute('height','10');
    stopIcon.setAttribute('viewBox','0 0 24 24');
    stopIcon.setAttribute('fill','currentColor');
    const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
    rect.setAttribute('x','4'); rect.setAttribute('y','4');
    rect.setAttribute('width','16'); rect.setAttribute('height','16');
    rect.setAttribute('rx','2');
    stopIcon.appendChild(rect);
    stopBtn.appendChild(stopIcon);

    stopBtn.addEventListener('click', async () => {
      await sendMsg({ action: 'STOP_REFRESH', tabId: tabState.tabId });
      if (tabState.tabId === currentTabId) {
        currentState = null;
        updateMainButton();
        updateStatusBar();
      }
      item.remove();
    });

    meta.appendChild(timer);
    meta.appendChild(badge);
    meta.appendChild(stopBtn);

    item.appendChild(dot);
    item.appendChild(url);
    item.appendChild(meta);

    container.appendChild(item);

    async function focusTab() {
      try {
        await chrome.tabs.update(tabState.tabId, { active: true });
        const t = await chrome.tabs.get(tabState.tabId);
        if (t?.windowId) await chrome.windows.update(t.windowId, { focused: true });
      } catch {}
    }

    url.addEventListener('click', focusTab);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focusTab(); }
    });
  });
}

// ── Status Bar ────────────────────────────────────────────────────────────────

function updateStatusBar() {
  const bar = $('status-bar');
  const dot = $('status-dot');
  const text = $('status-text');
  const timer = $('status-timer');

  if (!currentState?.active) {
    bar.hidden = true;
    bar.classList.remove('error');
    clearInterval(countdownInterval);
    return;
  }

  bar.hidden = false;
  bar.classList.remove('error');

  if (currentState.monitorEnabled) {
    dot.className = 'status-dot monitor';
    text.textContent = `Monitoring — "${currentState.monitorKeyword}"`;
    timer.textContent = '';
  } else {
    dot.className = 'status-dot active';
    const sec = currentState.currentDelaySeconds || currentState.intervalSeconds || 30;
    if (currentState.mode === 'random') {
      text.textContent = `Running — random ${currentState.randomMin || 5}s–${currentState.randomMax || 30}s`;
    } else if (currentState.mode === 'countdown') {
      text.textContent = 'Running — countdown';
    } else {
      const label = sec >= 60 ? `${Math.floor(sec/60)}m` : `${sec}s`;
      text.textContent = `Running — every ${label}`;
    }
    startStatusTimer();
  }
}

function startStatusTimer() {
  clearInterval(countdownInterval);
  const timer = $('status-timer');

  function tick() {
    if (!currentState?.nextFireAt) { timer.textContent = ''; return; }
    const remaining = Math.max(0, currentState.nextFireAt - Date.now());
    timer.textContent = formatCountdown(remaining);
  }

  tick();
  countdownInterval = setInterval(tick, 500);
}

// ── Global actions ─────────────────────────────────────────────────────────────

function setupGlobalActions() {
  $('notif-btn').addEventListener('click', async () => {
    notificationsEnabled = !notificationsEnabled;
    await setPrefs({ notificationsEnabled });
    await sendMsg({ action: 'SET_PREFS', prefs: { notificationsEnabled } });
    syncNotificationButton();
  });
}

// ── Boot ───────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);

window.addEventListener('unload', () => {
  clearInterval(countdownInterval);
  clearInterval(activeTabsInterval);
});
