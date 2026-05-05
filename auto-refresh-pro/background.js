// background.js — Service Worker (Manifest V3)
// Handles: refresh alarms, monitor polling, countdown, tab state

const ALARM_PREFIX = 'refresh_';
const PREFS_KEY = 'prefs_v1';
const RULES_KEY = 'rules_v1';

let cachedPrefs = null;
let cachedRules = null;

async function getPrefs() {
  if (cachedPrefs) return cachedPrefs;
  const res = await chrome.storage.local.get(PREFS_KEY);
  cachedPrefs = res[PREFS_KEY] || { notificationsEnabled: true };
  return cachedPrefs;
}

async function setPrefs(prefs) {
  cachedPrefs = { ...(cachedPrefs || { notificationsEnabled: true }), ...prefs };
  await chrome.storage.local.set({ [PREFS_KEY]: cachedPrefs });
}

async function getRules() {
  if (cachedRules) return cachedRules;
  const res = await chrome.storage.local.get(RULES_KEY);
  cachedRules = res[RULES_KEY] || { autoStart: [], keywordRules: [] };
  return cachedRules;
}

async function setRules(rules) {
  cachedRules = rules || { autoStart: [], keywordRules: [] };
  await chrome.storage.local.set({ [RULES_KEY]: cachedRules });
}

// ── State helpers ────────────────────────────────────────────────────────────

async function getTabState(tabId) {
  const key = `tab_${tabId}`;
  const result = await chrome.storage.local.get(key);
  return result[key] || null;
}

async function setTabState(tabId, state) {
  const key = `tab_${tabId}`;
  await chrome.storage.local.set({ [key]: state });
}

async function removeTabState(tabId) {
  const key = `tab_${tabId}`;
  await chrome.storage.local.remove(key);
}

async function getAllActiveTabs() {
  const all = await chrome.storage.local.get(null);
  const tabs = [];
  for (const [key, value] of Object.entries(all)) {
    if (key.startsWith('tab_') && value && value.active) {
      tabs.push(value);
    }
  }
  return tabs;
}

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function validateConfig(config) {
  const intervalSeconds = clampInt(config.intervalSeconds, 1, 86400, 30);
  const randomMin = clampInt(config.randomMin, 1, 86400, 5);
  const randomMax = clampInt(config.randomMax, 1, 86400, 30);
  const countdownSeconds = clampInt(config.countdownSeconds, 1, 604800, 60);
  const maxRefreshes = clampInt(config.maxRefreshes, 0, 100000, 0);

  const min = Math.min(randomMin, randomMax);
  const max = Math.max(randomMin, randomMax);

  const monitorKeyword = typeof config.monitorKeyword === 'string' ? config.monitorKeyword.trim() : '';
  const monitorEnabled = !!config.monitorEnabled && !!monitorKeyword;
  const monitorCondition = ['appears', 'disappears', 'change'].includes(config.monitorCondition) ? config.monitorCondition : 'appears';
  const monitorSearchIn = ['visual', 'source'].includes(config.monitorSearchIn) ? config.monitorSearchIn : 'visual';

  const mode = ['interval', 'random', 'countdown'].includes(config.mode) ? config.mode : 'interval';

  return {
    mode,
    intervalSeconds,
    randomMin: min,
    randomMax: max,
    countdownSeconds,
    hardRefresh: !!config.hardRefresh,
    stopOnInteraction: !!config.stopOnInteraction,
    maxRefreshes,
    monitorEnabled,
    monitorKeyword,
    monitorCondition,
    monitorSearchIn,
    continueAfterDetection: !!config.continueAfterDetection,
    autoClickOnDetection: !!config.autoClickOnDetection,
    monitorFullPage: config.monitorFullPage !== false,
    url: typeof config.url === 'string' ? config.url : ''
  };
}

function computeInitialDelaySeconds(state) {
  if (state.mode === 'random') {
    const min = clampInt(state.randomMin, 1, 86400, 5);
    const max = clampInt(state.randomMax, 1, 86400, 30);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  if (state.mode === 'countdown') return clampInt(state.countdownSeconds, 1, 604800, 60);
  return clampInt(state.intervalSeconds, 1, 86400, 30);
}

function isHttpUrl(url) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

function urlMatches(url, urlContains) {
  if (!urlContains) return false;
  if (!isHttpUrl(url)) return false;
  return url.includes(urlContains);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureContentScriptReady(tabId, maxWaitMs = 2000) {
  const started = Date.now();
  while (Date.now() - started < maxWaitMs) {
    try {
      const res = await chrome.tabs.sendMessage(tabId, { action: 'ARP_PING' });
      if (res?.ok) return true;
    } catch {
      // content script not ready yet
    }
    await sleep(150);
  }
  return false;
}

async function maybeAutoStart(tabId, url) {
  const rules = await getRules();
  const matches = (rules.autoStart || []).filter((r) => urlMatches(url, r.urlContains));
  if (!matches.length) return;

  // If multiple rules match, prefer the most specific (longest urlContains).
  matches.sort((a, b) => (b.urlContains?.length || 0) - (a.urlContains?.length || 0));
  const rule = matches[0];

  const config = validateConfig({
    mode: rule.mode,
    intervalSeconds: rule.intervalSeconds,
    randomMin: rule.randomMin,
    randomMax: rule.randomMax,
    hardRefresh: rule.hardRefresh,
    stopOnInteraction: rule.stopOnInteraction,
    maxRefreshes: rule.maxRefreshes,
    url
  });

  await handleMessage({ action: 'START_REFRESH', tabId, config }, { tab: { id: tabId, url } });
}

async function maybeStartKeywordWatch(tabId, url) {
  const rules = await getRules();
  const matches = (rules.keywordRules || []).filter((r) => urlMatches(url, r.urlContains));
  if (!matches.length) return;

  // Prefer the most specific urlContains.
  matches.sort((a, b) => (b.urlContains?.length || 0) - (a.urlContains?.length || 0));
  const rule = matches[0];

  try {
    await chrome.tabs.sendMessage(tabId, {
      action: 'ARP_WATCH',
      watch: {
        ruleId: rule.id,
        keyword: rule.keyword,
        searchIn: rule.searchIn || 'visual'
      }
    });
  } catch {
    // Ignore restricted pages.
  }
}

// ── Alarm management ─────────────────────────────────────────────────────────

function alarmName(tabId, type) {
  return `${type}${tabId}`;
}

async function scheduleRefresh(tabId, state) {
  let delaySeconds;

  if (state.mode === 'random') {
    const min = parseInt(state.randomMin) || 5;
    const max = parseInt(state.randomMax) || 30;
    delaySeconds = Math.floor(Math.random() * (max - min + 1)) + min;
  } else if (state.mode === 'countdown') {
    delaySeconds = parseInt(state.countdownSeconds) || 60;
  } else {
    delaySeconds = parseInt(state.intervalSeconds) || 30;
  }

  const delayMinutes = Math.max(1, delaySeconds / 60);
  const name = alarmName(tabId, ALARM_PREFIX);

  await chrome.alarms.create(name, { delayInMinutes: delayMinutes });

  // Store next fire time for countdown display
  state.nextFireAt = Date.now() + delaySeconds * 1000;
  state.currentDelaySeconds = delaySeconds;
  await setTabState(tabId, state);

  try {
    await chrome.tabs.sendMessage(tabId, { action: 'ARP_STATE', state: { nextFireAt: state.nextFireAt } });
  } catch {
    // ignore
  }
}


// ── Refresh logic ─────────────────────────────────────────────────────────────

async function doRefresh(tabId, state, nextDelaySeconds = null) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab) return;

    if (state.hardRefresh) {
      await chrome.tabs.reload(tabId, { bypassCache: true });
    } else {
      await chrome.tabs.reload(tabId);
    }

    state.refreshCount = (state.refreshCount || 0) + 1;
    state.lastRefreshed = Date.now();

    if (state.maxRefreshes && state.refreshCount >= state.maxRefreshes) {
      await stopRefresh(tabId);
      return;
    }

    if (typeof nextDelaySeconds === 'number' && Number.isFinite(nextDelaySeconds) && nextDelaySeconds > 0) {
      state.nextFireAt = Date.now() + nextDelaySeconds * 1000;
      state.currentDelaySeconds = nextDelaySeconds;
    }

    await setTabState(tabId, state);

    if (state.scheduler === 'alarm') {
      await scheduleRefresh(tabId, state);
    }
  } catch {
    await stopRefresh(tabId);
  }
}

async function stopRefresh(tabId) {
  await chrome.alarms.clear(alarmName(tabId, ALARM_PREFIX));
  await removeTabState(tabId);
  try {
    await chrome.action.setBadgeText({ tabId, text: '' });
  } catch {
    // ignore
  }
}

// ── Alarm listener ────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const { name } = alarm;

  if (name.startsWith(ALARM_PREFIX)) {
    const tabId = parseInt(name.replace(ALARM_PREFIX, ''));
    const state = await getTabState(tabId);
    if (state && state.active) {
      await doRefresh(tabId, state);
    }
    return;
  }
});

// ── Message listener ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Reject any messages not originating from this extension (defense-in-depth).
  if (!sender?.id || sender.id !== chrome.runtime.id) return;

  handleMessage(msg, sender).then(sendResponse).catch((err) => sendResponse({ error: err.message }));
  return true; // Keep channel open for async response
});

async function handleMessage(msg, sender) {
  const { action, tabId, config } = msg;

  switch (action) {

    case 'START_REFRESH': {
      const safe = validateConfig(config || {});
      const state = {
        tabId: tabId,
        active: true,
        mode: safe.mode,
        intervalSeconds: safe.intervalSeconds,
        randomMin: safe.randomMin,
        randomMax: safe.randomMax,
        countdownSeconds: safe.countdownSeconds,
        hardRefresh: safe.hardRefresh,
        stopOnInteraction: safe.stopOnInteraction,
        maxRefreshes: safe.maxRefreshes,
        monitorEnabled: safe.monitorEnabled,
        monitorKeyword: safe.monitorKeyword,
        monitorCondition: safe.monitorCondition,
        monitorSearchIn: safe.monitorSearchIn,
        continueAfterDetection: safe.continueAfterDetection,
        autoClickOnDetection: safe.autoClickOnDetection,
        monitorFullPage: safe.monitorFullPage,
        refreshCount: 0,
        startedAt: Date.now(),
        url: safe.url
      };

      await chrome.alarms.clear(alarmName(tabId, ALARM_PREFIX));
      await setTabState(tabId, state);

      const needsSecondPrecision =
        state.monitorEnabled ||
        state.mode === 'countdown' ||
        (state.mode === 'interval' && state.intervalSeconds < 60) ||
        (state.mode === 'random' && (state.randomMin < 60 || state.randomMax < 60));

      if (needsSecondPrecision) {
        // If the page is restricted (not http/https), fail fast with the correct message.
        const tab = await chrome.tabs.get(tabId).catch(() => null);
        const url = tab?.url || sender?.tab?.url || '';
        if (!isHttpUrl(url)) {
          await stopRefresh(tabId);
          return { success: false, error: 'This page is restricted and does not allow the extension to run.' };
        }

        state.scheduler = 'content';
        const delaySeconds = computeInitialDelaySeconds(state);
        state.nextFireAt = Date.now() + delaySeconds * 1000;
        state.currentDelaySeconds = delaySeconds;
        await setTabState(tabId, state);

        // Content scripts are injected at document_idle; if user clicks quickly after navigation,
        // the first sendMessage can fail even on allowed pages. Retry briefly before failing.
        const ready = await ensureContentScriptReady(tabId, 2200);
        if (!ready) {
          await stopRefresh(tabId);
          return { success: false, error: 'Extension is still loading on this page. Try again in a second.' };
        }

        try {
          await chrome.tabs.sendMessage(tabId, { action: 'ARP_START', state });
        } catch {
          await stopRefresh(tabId);
          return { success: false, error: 'Unable to start on this page. Try reloading the tab and starting again.' };
        }
      } else {
        state.scheduler = 'alarm';
        await setTabState(tabId, state);
        await scheduleRefresh(tabId, state);
      }

      return { success: true };
    }

    case 'STOP_REFRESH': {
      await stopRefresh(tabId);
      try { await chrome.tabs.sendMessage(tabId, { action: 'ARP_STOP' }); } catch {}
      return { success: true };
    }

    case 'STOP_ALL': {
      const tabs = await getAllActiveTabs();
      for (const t of tabs) {
        await stopRefresh(t.tabId);
        try { await chrome.tabs.sendMessage(t.tabId, { action: 'ARP_STOP' }); } catch {}
      }
      return { success: true };
    }

    case 'GET_STATE': {
      const state = await getTabState(tabId);
      return { state };
    }

    case 'GET_MY_STATE': {
      const senderTabId = sender?.tab?.id;
      if (!senderTabId) return { state: null };
      const state = await getTabState(senderTabId);
      return { state };
    }

    case 'GET_ALL_ACTIVE': {
      const tabs = await getAllActiveTabs();
      return { tabs };
    }

    case 'RELOAD_TAB': {
      const senderTabId = sender?.tab?.id;
      if (!senderTabId) return { success: false };
      const state = await getTabState(senderTabId);
      if (!state?.active) return { success: false };
      const nextDelaySeconds = typeof msg.nextDelaySeconds === 'number' ? msg.nextDelaySeconds : null;
      await doRefresh(senderTabId, state, nextDelaySeconds);
      return { success: true };
    }

    case 'USER_INTERACTED': {
      const senderTabId = sender?.tab?.id;
      if (!senderTabId) return { success: false };
      const state = await getTabState(senderTabId);
      if (state?.active && state.stopOnInteraction) await stopRefresh(senderTabId);
      return { success: true };
    }

    case 'MONITOR_TRIGGERED': {
      const senderTabId = sender?.tab?.id;
      if (!senderTabId) return { success: false };
      const state = await getTabState(senderTabId);
      if (!state?.active || !state.monitorEnabled) return { success: false };

      const prefs = await getPrefs();
      if (prefs.notificationsEnabled !== false) {
        chrome.notifications.create(`monitor_${senderTabId}_${Date.now()}`, {
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Auto Refresh Pro — Keyword Detected',
          message: `"${state.monitorKeyword}" triggered on this tab.`,
          priority: 2
        });
      }

      if (!state.continueAfterDetection) {
        await stopRefresh(senderTabId);
        try { await chrome.tabs.sendMessage(senderTabId, { action: 'ARP_STOP' }); } catch {}
      }
      return { success: true };
    }

    case 'SET_PREFS': {
      await setPrefs(msg.prefs || {});
      return { success: true };
    }

    case 'BADGE_UPDATE': {
      const senderTabId = sender?.tab?.id;
      if (!senderTabId) return { success: false };
      const text = typeof msg.text === 'string' ? msg.text.slice(0, 4) : '';
      try {
        await chrome.action.setBadgeBackgroundColor({ tabId: senderTabId, color: '#2563EB' });
        await chrome.action.setBadgeText({ tabId: senderTabId, text });
      } catch {
        // ignore (restricted contexts)
      }
      return { success: true };
    }

    case 'BADGE_CLEAR': {
      const senderTabId = sender?.tab?.id;
      if (!senderTabId) return { success: false };
      try {
        await chrome.action.setBadgeText({ tabId: senderTabId, text: '' });
      } catch {
        // ignore
      }
      return { success: true };
    }

    case 'GET_RULES': {
      const rules = await getRules();
      return { rules };
    }

    case 'SET_RULES': {
      await setRules(msg.rules || { autoStart: [], keywordRules: [] });
      return { success: true };
    }

    case 'WATCH_KEYWORD_TRIGGERED': {
      const senderTabId = sender?.tab?.id;
      const url = sender?.tab?.url || '';
      if (!senderTabId) return { success: false };
      const rules = await getRules();
      const rule = (rules.keywordRules || []).find((r) => r.id === msg.ruleId);
      if (!rule || !urlMatches(url, rule.urlContains)) return { success: false };

      const startConfig = validateConfig({
        mode: 'interval',
        intervalSeconds: rule.intervalSeconds,
        hardRefresh: rule.hardRefresh,
        stopOnInteraction: rule.stopOnInteraction,
        url
      });

      return await handleMessage({ action: 'START_REFRESH', tabId: senderTabId, config: startConfig }, sender);
    }

    default:
      return { error: 'Unknown action' };
  }
}

// ── Tab removed cleanup ───────────────────────────────────────────────────────

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await stopRefresh(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  const url = tab?.url || '';
  if (!isHttpUrl(url)) return;
  maybeAutoStart(tabId, url).catch(() => {});
  maybeStartKeywordWatch(tabId, url).catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  cachedRules = null;
  cachedPrefs = null;
});

// ── Hotkeys ───────────────────────────────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command) => {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return;

  if (command === 'toggle-refresh') {
    const state = await getTabState(activeTab.id);
    if (state && state.active) {
      await stopRefresh(activeTab.id);
    } else {
      const newState = {
        tabId: activeTab.id,
        active: true,
        mode: 'interval',
        intervalSeconds: 30,
        hardRefresh: false,
        refreshCount: 0,
        startedAt: Date.now(),
        url: activeTab.url
      };
      await setTabState(activeTab.id, newState);
      await scheduleRefresh(activeTab.id, newState);
    }
  }

  if (command === 'stop-all') {
    const tabs = await getAllActiveTabs();
    for (const t of tabs) {
      await stopRefresh(t.tabId);
    }
  }
});
