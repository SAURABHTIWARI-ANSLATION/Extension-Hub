// content.js — injected into all pages
// Handles: stop-on-interaction signal, visual timer overlay

(function () {
  if (window.__autoRefreshProLoaded) return;
  window.__autoRefreshProLoaded = true;

  let overlayEl = null;
  let interactionSent = false;
  let runningState = null;
  let refreshTimeoutId = null;
  let overlayTickId = null;
  let monitorTickId = null;
  let monitorPrevFound = null;
  let nextFireAt = null;
  let watchConfig = null;
  let watchTickId = null;
  let lastBadgeText = '';
  let lastBadgeAt = 0;

  // ── Interaction detection ────────────────────────────────────────────────

  function onUserInteraction() {
    if (interactionSent) return;
    interactionSent = true;
    chrome.runtime.sendMessage({ action: 'USER_INTERACTED' }).catch(() => {});
    setTimeout(() => { interactionSent = false; }, 2000);
  }

  document.addEventListener('keydown', onUserInteraction, { passive: true });
  document.addEventListener('mousedown', onUserInteraction, { passive: true });
  document.addEventListener('scroll', onUserInteraction, { passive: true });

  // ── Visual Timer Overlay ─────────────────────────────────────────────────

  function createOverlay() {
    if (overlayEl) return;
    overlayEl = document.createElement('div');
    overlayEl.id = '__arp_overlay';
    Object.assign(overlayEl.style, {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: '2147483647',
      background: '#111111',
      color: '#ffffff',
      fontFamily: 'system-ui,-apple-system,sans-serif',
      fontSize: '12px',
      fontWeight: '600',
      padding: '6px 12px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      pointerEvents: 'none',
      letterSpacing: '0.02em'
    });

    const dot = document.createElement('span');
    Object.assign(dot.style, {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: '#22C55E',
      display: 'inline-block'
    });
    dot.id = '__arp_dot';

    const label = document.createElement('span');
    label.textContent = 'Refreshing in —';
    label.id = '__arp_label';

    overlayEl.appendChild(dot);
    overlayEl.appendChild(label);
    document.documentElement.appendChild(overlayEl);
  }

  function removeOverlay() {
    if (overlayEl) {
      overlayEl.remove();
      overlayEl = null;
    }
  }

  function updateOverlay(secondsLeft) {
    if (!overlayEl) createOverlay();
    const label = document.getElementById('__arp_label');
    if (label) {
      const m = Math.floor(secondsLeft / 60);
      const s = secondsLeft % 60;
      label.textContent = `Refresh in ${m > 0 ? m + 'm ' : ''}${s}s`;
    }
  }

  // ── Scheduler (sub-minute + monitor) ─────────────────────────────────────

  function clearTimers() {
    if (refreshTimeoutId) clearTimeout(refreshTimeoutId);
    if (overlayTickId) clearInterval(overlayTickId);
    if (monitorTickId) clearInterval(monitorTickId);
    if (watchTickId) clearInterval(watchTickId);
    refreshTimeoutId = null;
    overlayTickId = null;
    monitorTickId = null;
    watchTickId = null;
  }

  function computeNextDelaySeconds(state) {
    if (state.mode === 'random') {
      const min = Number.isFinite(state.randomMin) ? state.randomMin : 5;
      const max = Number.isFinite(state.randomMax) ? state.randomMax : 30;
      const lo = Math.min(min, max);
      const hi = Math.max(min, max);
      return Math.floor(Math.random() * (hi - lo + 1)) + lo;
    }
    if (state.mode === 'countdown') return Math.max(1, state.countdownSeconds || 60);
    return Math.max(1, state.intervalSeconds || 30);
  }

  function startOverlayTicker() {
    if (!nextFireAt) return;
    const first = Math.max(0, Math.ceil((nextFireAt - Date.now()) / 1000));
    updateOverlay(first);
    updateBadge(first);
    overlayTickId = setInterval(() => {
      if (!nextFireAt) return;
      const secLeft = Math.max(0, Math.ceil((nextFireAt - Date.now()) / 1000));
      updateOverlay(secLeft);
      updateBadge(secLeft);
    }, 500);
  }

  function badgeTextFromSeconds(secLeft) {
    if (!Number.isFinite(secLeft) || secLeft <= 0) return '';
    if (secLeft >= 60) return `${Math.ceil(secLeft / 60)}m`;
    return `${secLeft}s`;
  }

  function updateBadge(secLeft) {
    const now = Date.now();
    // Throttle to ~1/sec to keep messaging light.
    if (now - lastBadgeAt < 900) return;
    lastBadgeAt = now;

    const text = badgeTextFromSeconds(secLeft);
    if (text === lastBadgeText) return;
    lastBadgeText = text;
    chrome.runtime.sendMessage({ action: 'BADGE_UPDATE', text }).catch(() => {});
  }

  function getSearchText(searchIn) {
    if (searchIn === 'source') {
      try {
        return new XMLSerializer().serializeToString(document);
      } catch {
        return document.documentElement?.outerHTML || '';
      }
    }
    const fullText = document.body?.innerText || '';
    if (runningState?.monitorFullPage !== false) return fullText;

    // Approximation: scan only text from elements currently in viewport.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let out = '';
    for (let node = walker.currentNode; node; node = walker.nextNode()) {
      const el = node;
      if (!(el instanceof Element)) continue;
      const rect = el.getBoundingClientRect?.();
      if (!rect) continue;
      const inView = rect.bottom >= 0 && rect.right >= 0 && rect.top <= window.innerHeight && rect.left <= window.innerWidth;
      if (!inView) continue;
      const t = el.innerText;
      if (t) out += t + '\n';
      if (out.length > 200000) break; // hard cap for performance
    }
    return out || fullText;
  }

  function monitorCheckOnce() {
    if (!runningState?.monitorEnabled || !runningState.monitorKeyword) return;
    const text = getSearchText(runningState.monitorSearchIn || 'visual');
    const found = text.toLowerCase().includes(runningState.monitorKeyword.toLowerCase());

    const prev = monitorPrevFound;
    monitorPrevFound = found;

    let triggered = false;
    if (runningState.monitorCondition === 'appears' && found && prev !== true) triggered = true;
    if (runningState.monitorCondition === 'disappears' && !found && prev === true) triggered = true;
    if (runningState.monitorCondition === 'change' && prev !== null && found !== prev) triggered = true;

    if (!triggered) return;

    if (runningState.autoClickOnDetection) {
      const keywordLower = runningState.monitorKeyword.toLowerCase();
      const links = Array.from(document.querySelectorAll('a[href]'));
      const candidate = links.find((a) => (a.innerText || '').toLowerCase().includes(keywordLower));
      candidate?.click?.();
    }

    chrome.runtime.sendMessage({ action: 'MONITOR_TRIGGERED' }).catch(() => {});
  }

  function startMonitorTicker() {
    if (!runningState?.monitorEnabled) return;
    monitorPrevFound = null;
    monitorTickId = setInterval(monitorCheckOnce, 2000);
    // Run once quickly after load to avoid waiting full period
    setTimeout(monitorCheckOnce, 250);
  }

  function startScheduler(state) {
    clearTimers();
    runningState = state;

    const delaySeconds = (typeof state.currentDelaySeconds === 'number' && Number.isFinite(state.currentDelaySeconds) && state.currentDelaySeconds > 0)
      ? state.currentDelaySeconds
      : computeNextDelaySeconds(state);
    nextFireAt = Date.now() + delaySeconds * 1000;
    startOverlayTicker();
    startMonitorTicker();

    refreshTimeoutId = setTimeout(async () => {
      // For recurring modes, compute next delay before triggering reload so popup can show next fire time.
      const isOneShot = runningState?.mode === 'countdown';
      const nextDelaySeconds = isOneShot ? null : computeNextDelaySeconds(runningState);

      await chrome.runtime.sendMessage({ action: 'RELOAD_TAB', nextDelaySeconds }).catch(() => {});

      if (isOneShot) stopScheduler();
    }, delaySeconds * 1000);
  }

  function stopScheduler() {
    runningState = null;
    nextFireAt = null;
    watchConfig = null;
    clearTimers();
    removeOverlay();
    lastBadgeText = '';
    chrome.runtime.sendMessage({ action: 'BADGE_CLEAR' }).catch(() => {});
  }

  function startOverlayOnly(fireAt) {
    clearTimers();
    nextFireAt = fireAt;
    startOverlayTicker();
  }

  function startWatch(watch) {
    watchConfig = watch || null;
    if (!watchConfig?.keyword) return;
    if (watchTickId) clearInterval(watchTickId);
    watchTickId = setInterval(() => {
      const text = getSearchText(watchConfig.searchIn || 'visual');
      const found = text.toLowerCase().includes(watchConfig.keyword.toLowerCase());
      if (!found) return;
      clearInterval(watchTickId);
      watchTickId = null;
      chrome.runtime.sendMessage({ action: 'WATCH_KEYWORD_TRIGGERED', ruleId: watchConfig.ruleId }).catch(() => {});
    }, 1500);
  }

  // ── Message listener ──────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'ARP_PING') return Promise.resolve({ ok: true });
    if (msg.action === 'ARP_START' && msg.state) startScheduler(msg.state);
    if (msg.action === 'ARP_STOP') stopScheduler();
    if (msg.action === 'ARP_STATE' && msg.state?.nextFireAt) startOverlayOnly(msg.state.nextFireAt);
    if (msg.action === 'ARP_WATCH' && msg.watch) startWatch(msg.watch);
  });

  // ── Auto-resume after reload/navigation ────────────────────────────────────

  chrome.runtime.sendMessage({ action: 'GET_MY_STATE' }).then((res) => {
    const state = res?.state;
    if (state?.active && state.scheduler === 'content') startScheduler(state);
    if (state?.active && state.scheduler === 'alarm' && state.nextFireAt) startOverlayOnly(state.nextFireAt);
  }).catch(() => {});

})();
