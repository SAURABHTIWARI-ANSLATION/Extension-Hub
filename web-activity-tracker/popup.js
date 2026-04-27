// popup.js - Enhanced with additional error handling

const STORAGE_KEYS = {
  sessionState: "sessionState",
  siteLimits:   "siteLimits",
  timeData:     "timeData"
};

// Palette for donut segments
const PALETTE = [
  "#4b80f7","#8b5cf6","#ec4899","#14b8a6","#f59e0b",
  "#22c55e","#ef4444","#06b6d4","#a78bfa","#f97316"
];

let activeDomain = "";
let allEntries   = [];
let allLimits    = {};
let todayTotal   = 0;

/* ── DOM refs with null checks ── */
const dateLabel     = document.getElementById("dateLabel");
const totalTimeEl   = document.getElementById("totalTime");
const siteCountEl   = document.getElementById("siteCount");
const statsListEl   = document.getElementById("statsList");
const currentDomEl  = document.getElementById("currentDomain");
const limitStatusEl = document.getElementById("limitStatus");
const currentSpentEl= document.getElementById("currentSpent");
const currentLimitEl= document.getElementById("currentLimit");
const limitInput    = document.getElementById("limitInput");
const saveLimitBtn  = document.getElementById("saveLimitBtn");
const removeLimitBtn= document.getElementById("removeLimitBtn");
const clearBtn      = document.getElementById("clearBtn");
const statusText    = document.getElementById("statusText");
const statusLed     = document.getElementById("statusLed");

/* ── Tabs ── */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    const panel = document.getElementById("panel-" + btn.dataset.tab);
    if (panel) panel.classList.add("active");
  });
});

/* ── Init ── */
document.addEventListener("DOMContentLoaded", () => {
  if (saveLimitBtn) saveLimitBtn.addEventListener("click", saveLimit);
  if (removeLimitBtn) removeLimitBtn.addEventListener("click", removeLimit);
  if (clearBtn) clearBtn.addEventListener("click", resetAllData);
  render();
});

/* ══════════════════════════════════════
   MAIN RENDER
══════════════════════════════════════ */
async function render() {
  try {
    const today = new Date().toISOString().split("T")[0];
    if (dateLabel) dateLabel.textContent = formatDateShort(new Date());

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    activeDomain = normalizeDomain(activeTab?.url);

    const data = await chrome.storage.local.get([
      STORAGE_KEYS.sessionState,
      STORAGE_KEYS.siteLimits,
      STORAGE_KEYS.timeData
    ]);

    const timeData  = structuredClone(data[STORAGE_KEYS.timeData] || {});
    allLimits       = data[STORAGE_KEYS.siteLimits] || {};
    const session   = data[STORAGE_KEYS.sessionState];

    const todayData = timeData[today] || {};
    includeLiveSession(todayData, session);

    allEntries = Object.entries(todayData).sort((a, b) => b[1] - a[1]);
    todayTotal = allEntries.reduce((s, [, v]) => s + v, 0);

    // Today panel
    if (totalTimeEl) totalTimeEl.textContent = formatDuration(todayTotal);
    if (siteCountEl) siteCountEl.textContent = String(allEntries.length);

    drawDonut("donutChart", "donutCenterVal", "donutLegend", allEntries, todayTotal, "Today");
    renderSiteList(allEntries, allLimits, todayTotal);

    // Total time panel
    renderTotals(timeData, todayData);

    // Daily panel
    renderDaily(timeData);

    // Control card
    renderControl(todayData, allLimits);
  } catch (error) {
    console.error("Render error:", error);
    if (statusText) statusText.textContent = "⚠️ Error loading data";
  }
}

/* ══════════════════════════════════════
   LIVE SESSION - Enhanced with additional validation
══════════════════════════════════════ */
function includeLiveSession(todayData, session) {
  // Comprehensive validation
  if (!session || typeof session !== 'object') return;
  if (!session.domain || typeof session.domain !== 'string') return;
  if (!session.startTime || typeof session.startTime !== 'number') return;
  
  // Check if startTime is valid (not in future, not too old)
  const now = Date.now();
  if (session.startTime > now) return; // Future time, invalid
  if (now - session.startTime > 43200000) return; // More than 12 hours, ignore
  
  const elapsed = Math.floor((now - session.startTime) / 1000);
  if (elapsed <= 0 || elapsed > 43200) return;
  
  todayData[session.domain] = (todayData[session.domain] || 0) + elapsed;
}

/* ══════════════════════════════════════
   DONUT CHART
══════════════════════════════════════ */
function drawDonut(canvasId, centerId, legendId, entries, total, centerLabel) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  try {
    const DPR = window.devicePixelRatio || 1;
    const SIZE = 150;
    canvas.width  = SIZE * DPR;
    canvas.height = SIZE * DPR;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.scale(DPR, DPR);

    const cx = SIZE / 2, cy = SIZE / 2;
    const radius    = SIZE * 0.38;
    const thickness = SIZE * 0.17;

    ctx.clearRect(0, 0, SIZE, SIZE);

    if (!entries.length) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "#e2e5ef";
      ctx.lineWidth   = thickness;
      ctx.stroke();
    } else if (entries.length === 1) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = PALETTE[0];
      ctx.lineWidth   = thickness;
      ctx.stroke();
    } else {
      const GAP_DEG = 3;
      const GAP_RAD = (GAP_DEG * Math.PI) / 180;
      const totalGap = GAP_RAD * entries.length;
      const available = Math.PI * 2 - totalGap;

      let angle = -Math.PI / 2;

      entries.forEach(([, seconds], i) => {
        const sweep = (seconds / total) * available;
        const start = angle + GAP_RAD / 2;
        const end   = angle + GAP_RAD / 2 + sweep;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, start, end);
        ctx.strokeStyle = PALETTE[i % PALETTE.length];
        ctx.lineWidth   = thickness;
        ctx.stroke();

        angle += sweep + GAP_RAD;
      });
    }

    const centerEl = document.getElementById(centerId);
    if (centerEl) centerEl.textContent = formatDuration(total);

    const legendEl = document.getElementById(legendId);
    if (legendEl) {
      legendEl.replaceChildren();
      entries.slice(0, 6).forEach(([domain], i) => {
        legendEl.appendChild(createLegendItem(domain, i));
      });
    }
  } catch (error) {
    console.error(`Error drawing donut ${canvasId}:`, error);
  }
}

/* ══════════════════════════════════════
   SITE LIST
══════════════════════════════════════ */
function renderSiteList(entries, limits, total) {
  if (!statsListEl) return;
  
  statsListEl.replaceChildren();

  if (!entries.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = "✨ Open websites to start tracking your digital habits";
    statsListEl.appendChild(emptyState);
    return;
  }

  entries.forEach(([domain, seconds]) => {
    const pct = total > 0 ? Math.round((seconds / total) * 100) : 0;
    const limitMin = Number(limits[domain] || 0);
    const atLimit  = limitMin > 0 && seconds >= limitMin * 60;

    const row = createSiteRow(domain, seconds, pct, limitMin, atLimit);
    statsListEl.appendChild(row);
  });
}

/* ══════════════════════════════════════
   TOTAL TIME PANEL
══════════════════════════════════════ */
function renderTotals(timeData, todayData) {
  const days = Object.keys(timeData).sort();
  const activeDays = days.filter(d => Object.values(timeData[d] || {}).reduce((a,b)=>a+b,0) > 0);
  const allSeconds = activeDays.reduce((s, d) => s + Object.values(timeData[d] || {}).reduce((a,b)=>a+b,0), 0);
  const todaySec   = Object.values(todayData).reduce((a,b)=>a+b,0);
  const avgSec     = activeDays.length ? Math.round(allSeconds / activeDays.length) : 0;

  const ttFirstDay = document.getElementById("tt-firstDay");
  const ttActiveDays = document.getElementById("tt-activeDays");
  const ttTotalDays = document.getElementById("tt-totalDays");
  const ttTodayTotal = document.getElementById("tt-todayTotal");
  const ttAllTime = document.getElementById("tt-allTime");
  const ttAvgTime = document.getElementById("tt-avgTime");
  const ttAggLabel = document.getElementById("tt-aggLabel");
  const ttAggTotal = document.getElementById("tt-aggTotal");

  if (ttFirstDay) ttFirstDay.textContent = days.length ? formatDate(days[0]) : "—";
  if (ttActiveDays) ttActiveDays.textContent = String(activeDays.length);
  if (ttTotalDays) ttTotalDays.textContent = String(days.length);
  if (ttTodayTotal) ttTodayTotal.textContent = formatDuration(todaySec);
  if (ttAllTime) ttAllTime.textContent = formatDuration(allSeconds);
  if (ttAvgTime) ttAvgTime.textContent = formatDuration(avgSec);
  if (ttAggLabel) ttAggLabel.textContent = `Aggregate data since ${days.length ? formatDate(days[0]) : "—"} (${allEntries.length} websites)`;
  if (ttAggTotal) ttAggTotal.textContent = formatDuration(allSeconds);

  const domainTotals = {};
  Object.values(timeData).forEach(dayObj => {
    Object.entries(dayObj).forEach(([d, s]) => {
      domainTotals[d] = (domainTotals[d] || 0) + s;
    });
  });
  const aggEntries = Object.entries(domainTotals).sort((a,b) => b[1]-a[1]);
  drawDonut("donutChart2", "donutCenterVal2", "donutLegend2", aggEntries, allSeconds, "Total");
}

/* ══════════════════════════════════════
   DAILY BAR CHART
══════════════════════════════════════ */
function renderDaily(timeData) {
  const days = Object.keys(timeData).sort().slice(-7);
  const vals = days.map(d => Object.values(timeData[d] || {}).reduce((a,b)=>a+b,0));
  const avg  = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0) / vals.length) : 0;

  const dailyAvg = document.getElementById("daily-avg");
  if (dailyAvg) dailyAvg.textContent = formatDuration(avg);

  const canvas = document.getElementById("barChart");
  if (!canvas) return;
  
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const W = canvas.clientWidth || 360;
    canvas.width = W;
    const H = 140;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);

    if (!vals.length) return;

    const maxVal = Math.max(...vals, 1);
    const padL = 36, padR = 10, padB = 24, padT = 8;
    const chartW = W - padL - padR;
    const chartH = H - padB - padT;
    const barW   = Math.max(8, Math.floor((chartW / vals.length) * 0.55));
    const gap    = chartW / vals.length;

    ctx.strokeStyle = "rgba(0,0,0,0.07)";
    ctx.lineWidth = 1;
    [0, 0.25, 0.5, 0.75, 1].forEach(f => {
      const y = padT + chartH * (1 - f);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + chartW, y);
      ctx.stroke();
      ctx.fillStyle = "#9399b2";
      ctx.font = "500 9px 'Segoe UI', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(formatDuration(Math.round(maxVal * f)), padL - 4, y + 3);
    });

    vals.forEach((v, i) => {
      const barH  = (v / maxVal) * chartH;
      const x     = padL + gap * i + gap / 2 - barW / 2;
      const y     = padT + chartH - barH;
      ctx.fillStyle = "#2563EB";
      ctx.fillRect(x, y, barW, barH);
      ctx.fillStyle = "#9399b2";
      ctx.font = "500 9px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(formatDateShortNum(days[i]), padL + gap * i + gap / 2, H - 6);
    });
  } catch (error) {
    console.error("Error drawing bar chart:", error);
  }
}

/* ══════════════════════════════════════
   CONTROL CARD
══════════════════════════════════════ */
function renderControl(todayData, limits) {
  if (!activeDomain) {
    if (currentDomEl) currentDomEl.textContent = "No active website";
    if (currentSpentEl) currentSpentEl.textContent = "—";
    if (currentLimitEl) currentLimitEl.textContent = "—";
    setPill("", "No trackable page");
    if (limitInput) limitInput.value = "";
    if (removeLimitBtn) removeLimitBtn.disabled = true;
    if (statusText) statusText.textContent = "🌐 Open a website to track";
    setStatusIndicator("idle");
    return;
  }

  const spentSec  = todayData[activeDomain] || 0;
  const limitMin  = Number(limits[activeDomain] || 0);
  
  if (currentDomEl) currentDomEl.textContent = activeDomain;
  if (currentSpentEl) currentSpentEl.textContent = formatDuration(spentSec);
  if (currentLimitEl) currentLimitEl.textContent = limitMin > 0 ? `${limitMin} min` : "Not set";
  if (limitInput) limitInput.value = limitMin > 0 ? String(limitMin) : "";
  if (removeLimitBtn) removeLimitBtn.disabled = limitMin <= 0;

  if (limitMin <= 0) {
    setPill("", "No limit");
    if (statusText) statusText.textContent = "📡 Tracking live";
    setStatusIndicator("live");
    return;
  }

  const limitSec = limitMin * 60;
  if (spentSec >= limitSec) {
    setPill("is-alert", "⚠️ Limit reached");
    if (statusText) statusText.textContent = `🚨 Alert active for ${activeDomain}`;
    setStatusIndicator("alert");
    return;
  }

  const pct = Math.round((spentSec / limitSec) * 100);
  setPill(pct >= 75 ? "is-warning" : "is-safe", `${pct}% used`);
  if (statusText) statusText.textContent = `⏱️ Tracking ${activeDomain}`;
  setStatusIndicator(pct >= 75 ? "warning" : "safe");
}

function setPill(cls, text) {
  if (!limitStatusEl) return;
  limitStatusEl.className = "pill" + (cls ? " " + cls : "");
  const pillDot = document.createElement("span");
  pillDot.className = "pill-dot";
  limitStatusEl.replaceChildren(pillDot, document.createTextNode(text));
}

/* ══════════════════════════════════════
   ACTIONS
══════════════════════════════════════ */
async function saveLimit() {
  if (!activeDomain) {
    if (statusText) statusText.textContent = "Open a website first";
    return;
  }
  
  if (!limitInput) return;
  
  const min = Number(limitInput.value);
  if (!Number.isFinite(min) || min <= 0) {
    if (statusText) statusText.textContent = "Enter a valid number";
    return;
  }
  
  try {
    const data = await chrome.storage.local.get([STORAGE_KEYS.siteLimits]);
    const limits = data[STORAGE_KEYS.siteLimits] || {};
    limits[activeDomain] = Math.round(min);
    await chrome.storage.local.set({ [STORAGE_KEYS.siteLimits]: limits });
    if (statusText) statusText.textContent = `✅ Saved ${limits[activeDomain]} min for ${activeDomain}`;
    render();
  } catch (error) {
    console.error("Error saving limit:", error);
    if (statusText) statusText.textContent = "❌ Failed to save limit";
  }
}

async function removeLimit() {
  if (!activeDomain) return;
  
  try {
    const data = await chrome.storage.local.get([STORAGE_KEYS.siteLimits]);
    const limits = data[STORAGE_KEYS.siteLimits] || {};
    delete limits[activeDomain];
    await chrome.storage.local.set({ [STORAGE_KEYS.siteLimits]: limits });
    if (statusText) statusText.textContent = `🗑️ Removed limit for ${activeDomain}`;
    render();
  } catch (error) {
    console.error("Error removing limit:", error);
    if (statusText) statusText.textContent = "❌ Failed to remove limit";
  }
}

async function resetAllData() {
  if (!window.confirm("⚠️ Delete ALL tracked time and saved limits? This cannot be undone.")) return;
  
  try {
    await chrome.storage.local.set({ alertsSent: {}, sessionState: null, siteLimits: {}, timeData: {} });
    if (statusText) statusText.textContent = "🧹 All data cleared";
    render();
  } catch (error) {
    console.error("Error resetting data:", error);
    if (statusText) statusText.textContent = "❌ Failed to reset data";
  }
}

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
function normalizeDomain(url) {
  try {
    const p = new URL(url || "");
    if (!/^https?:$/.test(p.protocol)) return "";
    return p.hostname.replace(/^www\./, "");
  } catch { 
    return ""; 
  }
}

function createLegendItem(domain, colorIndex) {
  const item = document.createElement("div");
  item.className = "legend-item";

  const dot = document.createElement("span");
  dot.className = `legend-dot palette-${colorIndex % PALETTE.length}`;

  const name = document.createElement("span");
  name.className = "legend-name";
  name.textContent = domain;

  item.append(dot, name);
  return item;
}

function createSiteRow(domain, seconds, pct, limitMin, atLimit) {
  const row = document.createElement("div");
  row.className = "site-row";

  const rowTop = document.createElement("div");
  rowTop.className = "site-row-top";

  const siteInfo = document.createElement("div");
  siteInfo.className = "site-info";

  const siteDomain = document.createElement("div");
  siteDomain.className = "site-domain";
  siteDomain.textContent = domain;
  siteInfo.appendChild(siteDomain);

  const siteRight = document.createElement("div");
  siteRight.className = "site-right";

  const siteTime = document.createElement("div");
  siteTime.className = "site-time";
  siteTime.textContent = formatDuration(seconds);

  const sitePct = document.createElement("div");
  sitePct.className = "site-pct";
  sitePct.textContent = `${pct}%`;

  siteRight.append(siteTime, sitePct);
  rowTop.append(siteInfo, siteRight);

  const progress = document.createElement("progress");
  progress.className = "site-progress";
  progress.max = 100;
  progress.value = pct;

  row.append(rowTop, progress);

  if (limitMin > 0) {
    const limitRow = document.createElement("div");
    limitRow.className = "site-limit-row" + (atLimit ? " reached" : "");
    limitRow.textContent = atLimit
      ? `⚠️ Limit ${limitMin} min reached`
      : `🎯 Limit ${limitMin} min`;
    row.appendChild(limitRow);
  }

  return row;
}

function setStatusIndicator(state) {
  if (!statusLed) return;
  statusLed.className = "status-led status-" + state;
}

function formatDuration(s) {
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0)   return `${h}h ${String(m).padStart(2,"0")}m`;
  if (m > 0)   return `${m}m ${String(sec).padStart(2,"0")}s`;
  return `${sec}s`;
}

function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatDateShort(dt) {
  if (!dt) return "";
  return dt.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
}

function formatDateShortNum(iso) {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}
