'use strict';

// ── Alert popup controller ────────────────────────────────────────────────────
// Opened as a chrome.windows popup when a hydration reminder fires.
// Clicking "+250 ml" logs the drink and closes the window.
// Clicking "Snooze 5 min" reschedules and closes.

const DRINK_AMOUNT    = 250;
const RING_CIRCUMFERENCE = 314; // 2π × 50

// ── Rising water drops (purely decorative) ────────────────────────────────────

function _spawnDrops() {
  const container = document.getElementById('dropsContainer');
  if (!container) return;
  const colors = ['#4fc3f7', '#80deea', '#26c6da', '#b3e5fc'];

  for (let i = 0; i < 14; i++) {
    const drop = document.createElement('div');
    drop.className = 'drop';

    const size = 4 + Math.random() * 7;
    drop.style.left              = `${Math.random() * 100}%`;
    drop.style.width             = `${size}px`;
    drop.style.height            = `${size * 1.4}px`;
    drop.style.background        = colors[Math.floor(Math.random() * colors.length)];
    drop.style.opacity           = '0';
    drop.style.animationDuration = `${6 + Math.random() * 8}s`;
    drop.style.animationDelay   = `${Math.random() * 6}s`;

    container.appendChild(drop);
  }
}

// ── Render hydration state ────────────────────────────────────────────────────

function _render(consumed, goal, streak) {
  consumed = consumed || 0;
  goal     = goal     || 3000;
  streak   = streak   || 0;

  const pct    = Math.min(Math.round((consumed / goal) * 100), 100);
  const offset = RING_CIRCUMFERENCE - (pct / 100) * RING_CIRCUMFERENCE;

  document.getElementById('ringFill').setAttribute('stroke-dashoffset', String(offset));
  document.getElementById('ringPct').textContent     = `${pct}%`;
  document.getElementById('statusText').textContent  = `${consumed.toLocaleString()} / ${goal.toLocaleString()} ml`;
  document.getElementById('streakBadge').textContent = `${streak} day streak`;
  document.getElementById('progressFill').style.width = `${pct}%`;
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  _spawnDrops();

  // Load current hydration data
  const result = await chrome.storage.local.get('hydration');
  const hyd = result.hydration || {};
  _render(hyd.consumed, hyd.goal, hyd.streak);

  // ── Drink button ──────────────────────────────────────────────────────────
  document.getElementById('drinkBtn').addEventListener('click', async () => {
    const btn = document.getElementById('drinkBtn');
    btn.disabled = true;
    btn.textContent = 'Logged!';

    // Read latest, increment, write back
    const fresh = await chrome.storage.local.get('hydration');
    const h = fresh.hydration || {};
    h.consumed = (h.consumed || 0) + DRINK_AMOUNT;

    // Append log entry
    if (!Array.isArray(h.logs)) h.logs = [];
    h.logs.push({ time: Date.now(), amount: DRINK_AMOUNT });

    // Trim to today only
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    h.logs = h.logs.filter(l => l.time >= dayStart.getTime());

    await chrome.storage.local.set({ hydration: h });

    // Brief visual feedback then close
    _render(h.consumed, h.goal, h.streak);
    setTimeout(() => window.close(), 700);
  });

  // ── Snooze button ─────────────────────────────────────────────────────────
  document.getElementById('snoozeBtn').addEventListener('click', () => {
    // Ask background to fire hydration alarm again in 5 minutes
    chrome.alarms.create('tab:hydration:snooze', { delayInMinutes: 5 });
    window.close();
  });
}

document.addEventListener('DOMContentLoaded', init);
