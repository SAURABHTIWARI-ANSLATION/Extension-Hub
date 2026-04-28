/* ============================================================
   Website Preview Pro v3.0 — popup.js  (fully fixed)
   ============================================================ */

/* ── DOM refs ─────────────────────────────────────────────── */
const body          = document.body;
const input         = document.getElementById("urlInput");
const preview       = document.getElementById("previewContainer");
const emptyState    = document.getElementById("emptyState");
const skeleton      = document.getElementById("skeleton");
const errorText     = document.getElementById("errorText");
const copyBtn       = document.getElementById("copyBtn");
const downloadBtn   = document.getElementById("downloadBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const qrBtn         = document.getElementById("qrBtn");
const infoBtn       = document.getElementById("infoBtn");
const pinBtn        = document.getElementById("pinBtn");
const openSite      = document.getElementById("openSite");
const historyList   = document.getElementById("historyList");
const actionRow     = document.getElementById("actionRow");
const actionRow2    = document.getElementById("actionRow2");
const statusBadge   = document.getElementById("statusBadge");
const statusDot     = document.getElementById("statusDot");
const statusText    = document.getElementById("statusText");
const histSearch    = document.getElementById("historySearch");
const pinnedList    = document.getElementById("pinnedList");
const noPins        = document.getElementById("noPins");
const infoPanel     = document.getElementById("infoPanel");
const infoContent   = document.getElementById("infoContent");
const fsOverlay     = document.getElementById("fullscreenOverlay");
const fsImg         = document.getElementById("fsImg");
const fsTitle       = document.getElementById("fsTitle");
const qrOverlay     = document.getElementById("qrOverlay");
const qrCanvas      = document.getElementById("qrCanvas");
const qrUrlLabel    = document.getElementById("qrUrl");
const clearAllBtn   = document.getElementById("clearAllBtn");
const customSizeRow = document.getElementById("customSizeRow");
const customW       = document.getElementById("customW");
const customH       = document.getElementById("customH");

/* ── State ────────────────────────────────────────────────── */
let deviceMode      = "desktop";
let lastImgSrc      = "";       // store src string, not img element (avoids CORS taint)
let currentUrl      = "";
let currentRaw      = "";
let allHistory      = [];
let allPinned       = [];
let customWidth     = 1280;
let customHeight    = 800;
let batchDeviceMain = "desktop";
let lastPreviewKey  = "";

/* ── Helpers ──────────────────────────────────────────────── */
function normalize(u) {
  u = u.trim();
  if (!u) return "";
  if (!u.includes(".")) u += ".com";
  if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
  return u;
}

function domainOf(u) {
  try { return new URL(normalize(u)).hostname.replace(/^www\./, ""); }
  catch { return u.replace(/^https?:\/\//, "").split("/")[0]; }
}

function faviconDataUrl(u, size = 16) {
  const domain = domainOf(u);
  const label = (domain || "?").charAt(0).toUpperCase();
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = ((hash << 5) - hash + domain.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="16" fill="hsl(${hue} 70% 45%)"/>` +
    `<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" ` +
    `font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#fff">${label}</text>` +
    `</svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function showError(msg) {
  errorText.textContent = msg;
}

function clearError() {
  errorText.textContent = "";
}

/* ── Status (single definition) ──────────────────────────── */
function setStatus(state) {
  statusBadge.classList.remove("hidden");
  statusDot.className = "sdot sdot-" + state;
  if (state === "loading") statusText.textContent = "Loading…";
  else if (state === "ready") statusText.textContent = "Ready";
  else statusText.textContent = "Failed";
}

/* ── Thum.io URL builder ──────────────────────────────────── */
function getThumUrls(url, mode) {
  const base = "https://image.thum.io/get/noanimate/maxAge/24/";
  let primary;
  let fallback;
  if (mode === "mobile") {
    primary = "iphone12pro/width/390/crop/844/";
    fallback = "width/390/crop/844/viewportWidth/390/";
  } else if (mode === "tablet") {
    primary = "ipad/width/768/crop/1024/";
    fallback = "width/768/crop/1024/viewportWidth/768/";
  } else if (mode === "custom") {
    const outWidth = Math.min(customWidth, 960);
    const outHeight = Math.min(customHeight, 900);
    primary = "width/" + outWidth + "/crop/" + outHeight + "/viewportWidth/" + customWidth + "/";
    fallback = "width/" + Math.min(outWidth, 768) + "/crop/" + Math.min(outHeight, 800) + "/viewportWidth/" + customWidth + "/";
  } else {
    primary = "width/960/crop/640/viewportWidth/1280/";
    fallback = "width/800/crop/560/viewportWidth/1280/";
  }
  return [base + primary + url, base + fallback + url];
}

/* ── Dark Mode ────────────────────────────────────────────── */
function applyDark(isDark) {
  if (isDark) {
    body.classList.add("dark");
    body.classList.remove("light");
  } else {
    body.classList.remove("dark");
    body.classList.add("light");
  }
  document.getElementById("moonIcon").hidden = isDark;
  document.getElementById("sunIcon").hidden = !isDark;
}

document.getElementById("darkToggle").addEventListener("click", () => {
  const isDark = !body.classList.contains("dark");
  applyDark(isDark);
  chrome.storage.local.set({ dark: isDark });
});

/* ── Tabs ─────────────────────────────────────────────────── */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

function switchTab(name) {
  document.querySelectorAll(".tab-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".tab-content").forEach(c =>
    c.classList.toggle("active", c.id === "tab-" + name));
}

/* ── Device Toggle ────────────────────────────────────────── */
document.querySelectorAll("#mainDeviceSwitch button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#mainDeviceSwitch button")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    deviceMode = btn.dataset.size;
    customSizeRow.classList.toggle("hidden", deviceMode !== "custom");
    // Re-preview immediately if we have a URL
    if (currentUrl && deviceMode !== "custom") generate(currentRaw);
  });
});

/* ── Batch device toggle (removed) ───────────────────────── */
// Batch tab removed; batchDeviceMain kept as unused variable for safety

/* ── Custom size ──────────────────────────────────────────── */
document.getElementById("applyCustomSize").addEventListener("click", () => {
  customWidth  = Math.max(320,  Math.min(1920, parseInt(customW.value)  || 1280));
  customHeight = Math.max(200,  Math.min(1080, parseInt(customH.value)  || 800));
  customW.value = customWidth;
  customH.value = customHeight;
  if (currentUrl) generate(currentRaw);
});

/* Enter key on custom inputs */
[customW, customH].forEach(el => {
  el.addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("applyCustomSize").click();
  });
});

/* ── Init / Load saved state ──────────────────────────────── */
chrome.storage.local.get(["dark", "last", "history", "pinned"], d => {
  // Default to dark mode if never set
  applyDark(d.dark !== false);

  if (Array.isArray(d.history) && d.history.length) {
    allHistory = d.history;
    renderHistory(allHistory);
  }
  if (Array.isArray(d.pinned) && d.pinned.length) {
    allPinned = d.pinned;
    renderPinned();
  }
  if (d.last) {
    input.value = d.last;
    generate(d.last);
  }
});

/* ── Preview Button & Enter key ───────────────────────────── */
document.getElementById("previewBtn").addEventListener("click", () => {
  const v = input.value.trim(); if (v) generate(v);
});

input.addEventListener("keydown", e => {
  if (e.key === "Enter") { const v = input.value.trim(); if (v) generate(v); }
});

document.getElementById("clearInput").addEventListener("click", () => {
  input.value = "";
  input.focus();
  clearError();
});

if (clearAllBtn) {
  clearAllBtn.addEventListener("click", () => {
    input.value = "";
    resetPreview();
    input.focus();
  });
}

/* ── Device Frame Builder ────────────────────────────────── */
function buildDeviceFrame(img, mode) {
  // Simple wrapper: just the screenshot + a small badge
  const wrap = document.createElement("div");
  wrap.className = "device-frame-wrap mode-" + mode;
  wrap.addEventListener("click", openFullscreen);

  img.className = "preview-image";
  wrap.appendChild(img);

  // Small badge bottom-right
  const badge = document.createElement("div");
  badge.className = "preview-mode-badge";
  const info = {
    desktop: { icon: "🖥", label: "Desktop" },
    mobile:  { icon: "📱", label: "Mobile" },
    tablet:  { icon: "📐", label: "Tablet" },
    custom:  { icon: "✏", label: customWidth + "×" + customHeight }
  }[mode] || { icon: "🖥", label: "Desktop" };
  badge.textContent = info.icon + "  " + info.label;
  wrap.appendChild(badge);

  return wrap;
}


/* ── MAIN GENERATE ────────────────────────────────────────── */
function generate(raw) {
  const url = normalize(raw);
  if (!url) return;
  const previewKey = [url, deviceMode, customWidth, customHeight].join("|");
  if (previewKey === lastPreviewKey && preview.querySelector(".device-frame-wrap")) return;

  currentUrl = url;
  currentRaw = raw;
  lastPreviewKey = previewKey;

  const imgUrls = getThumUrls(url, deviceMode);
  let activeImgUrl = imgUrls[0];
  lastImgSrc = activeImgUrl;   // save src for cross-origin-safe download/copy

  setStatus("loading");
  skeleton.classList.remove("hidden");
  emptyState.hidden = true;
  actionRow.classList.remove("show");
  if (actionRow2) actionRow2.hidden = true;
  clearError();

  const oldFrame = preview.querySelector(".device-frame-wrap");
  if (oldFrame) preview.removeChild(oldFrame);

  const img = new Image();
  img.crossOrigin = "anonymous";   // request CORS headers from thum.io
  img.src = activeImgUrl;
  img.className = "preview-image";
  img.alt = "Preview of " + url;

  img.addEventListener("load", () => {
    skeleton.classList.add("hidden");

    // Remove any previous frame wrapper
    const oldFrame = preview.querySelector(".device-frame-wrap");
    if (oldFrame) preview.removeChild(oldFrame);

    // Wrap image in device frame based on mode
    const frameWrap = buildDeviceFrame(img, deviceMode);
    preview.appendChild(frameWrap);

    // Set Open Site link safely
    try {
      const safe = new URL(url);
      if (safe.protocol === "http:" || safe.protocol === "https:") {
        openSite.setAttribute("href", safe.href);
      } else {
        openSite.removeAttribute("href");
      }
    } catch {
      openSite.removeAttribute("href");
    }

    actionRow.classList.add("show");
    if (actionRow2) actionRow2.hidden = false;
    setStatus("ready");
    updatePinBtnState();
    chrome.storage.local.set({ last: raw });
    saveHistory(raw);

    // Keep fullscreen img in sync
    fsImg.src = activeImgUrl;
    fsTitle.textContent = domainOf(url);

    // Click preview image to open fullscreen
    img.onclick = () => openFullscreen();
  });

  let fallbackIndex = 0;
  img.addEventListener("error", () => {
    fallbackIndex++;
    if (fallbackIndex < imgUrls.length) {
      activeImgUrl = imgUrls[fallbackIndex];
      lastImgSrc = activeImgUrl;
      img.src = activeImgUrl;
      return;
    }
    skeleton.classList.add("hidden");
    lastPreviewKey = "";
    showError("Preview failed — check the URL and try again.");
    setStatus("error");
    emptyState.hidden = false;
  });
}

/* ── Download using fetch (avoids CORS canvas taint) ─────── */
function downloadScreenshot(url, filename) {
  fetch(url)
    .then(r => r.blob())
    .then(blob => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename || "preview.png";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }, 100);
    })
    .catch(() => showError("Download failed — try again."));
}

/* ── Copy using fetch blob (avoids CORS canvas taint) ─────── */
function copyScreenshot(url, btnEl) {
  if (!url) return;
  const origText = btnEl.textContent;
  btnEl.textContent = "Copying…";
  btnEl.disabled = true;

  fetch(url)
    .then(r => r.blob())
    .then(blob => {
      // Ensure it's PNG (ClipboardItem requires image/png)
      if (blob.type === "image/png") {
        return blob;
      }
      // Convert to PNG via canvas
      return new Promise((resolve, reject) => {
        const blobUrl = URL.createObjectURL(blob);
        const tmpImg = new Image();
        tmpImg.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width  = tmpImg.naturalWidth;
          canvas.height = tmpImg.naturalHeight;
          canvas.getContext("2d").drawImage(tmpImg, 0, 0);
          URL.revokeObjectURL(blobUrl);
          canvas.toBlob(pngBlob => {
            if (pngBlob) resolve(pngBlob); else reject();
          }, "image/png");
        };
        tmpImg.onerror = reject;
        tmpImg.src = blobUrl;
      });
    })
    .then(pngBlob => navigator.clipboard.write([
      new ClipboardItem({ "image/png": pngBlob })
    ]))
    .then(() => {
      btnEl.textContent = "✓ Copied!";
      setTimeout(() => {
        btnEl.textContent = origText;
        btnEl.disabled = false;
      }, 1800);
    })
    .catch(() => {
      showError("Clipboard write blocked. Try downloading instead.");
      btnEl.textContent = origText;
      btnEl.disabled = false;
    });
}

/* ── Copy & Download buttons ──────────────────────────────── */
copyBtn.addEventListener("click", () => {
  if (!lastImgSrc) return;
  copyScreenshot(lastImgSrc, copyBtn);
});

downloadBtn.addEventListener("click", () => {
  if (!lastImgSrc) return;
  downloadScreenshot(lastImgSrc, "preview-" + domainOf(currentUrl) + ".png");
});

/* ── Fullscreen ───────────────────────────────────────────── */
function openFullscreen() {
  if (!lastImgSrc) return;
  fsImg.src = lastImgSrc;
  fsTitle.textContent = domainOf(currentUrl);
  fsOverlay.classList.remove("hidden");
}

fullscreenBtn.addEventListener("click", openFullscreen);

document.getElementById("fsClose").addEventListener("click", () => {
  fsOverlay.classList.add("hidden");
});

document.getElementById("fsDownload").addEventListener("click", () => {
  if (!lastImgSrc) return;
  downloadScreenshot(lastImgSrc, "preview-" + domainOf(currentUrl) + ".png");
});

document.getElementById("fsCopy").addEventListener("click", function() {
  if (!lastImgSrc) return;
  copyScreenshot(lastImgSrc, this);
});

/* ── QR Code ─────────────────────────────────────────────── */
qrBtn.addEventListener("click", () => {
  if (!currentUrl) return;
  qrUrlLabel.textContent = currentUrl;
  generateQR(currentUrl);
  qrOverlay.classList.remove("hidden");
});

document.getElementById("qrClose").addEventListener("click", () => {
  qrOverlay.classList.add("hidden");
});

document.getElementById("qrDownload").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = qrCanvas.toDataURL("image/png");
  a.download = "qr-" + domainOf(currentUrl) + ".png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

function getQrServiceUrl(text, size) {
  return "https://quickchart.io/qr?size=" + size + "&margin=1&text=" + encodeURIComponent(text);
}

function drawQrFallback(ctx, size, message) {
  const isDarkTheme = body.classList.contains("dark");
  const fg = isDarkTheme ? "#e8edf5" : "#0b0f1a";
  const bg = isDarkTheme ? "#1a2035" : "#ffffff";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = fg;
  ctx.font = "13px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, size / 2, size / 2);
}

function generateQR(text) {
  const ctx = qrCanvas.getContext("2d");
  const SIZE = 240;
  drawQrFallback(ctx, SIZE, "Loading QR...");

  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
  };
  img.onerror = () => {
    drawQrFallback(ctx, SIZE, "QR unavailable");
    showError("QR code failed to load. Try again.");
  };
  img.src = getQrServiceUrl(text, SIZE);
}

/* ── Site Info ────────────────────────────────────────────── */
infoBtn.addEventListener("click", () => {
  if (!currentUrl) return;
  // Toggle panel
  if (!infoPanel.classList.contains("hidden")) {
    infoPanel.classList.add("hidden");
    return;
  }
  infoPanel.classList.remove("hidden");
  buildInfoPanel(currentUrl);
});

document.getElementById("infoClose").addEventListener("click", () => {
  infoPanel.classList.add("hidden");
});

function buildInfoPanel(url) {
  while (infoContent.firstChild) infoContent.removeChild(infoContent.firstChild);

  const domain = domainOf(url);
  const isHttps = url.startsWith("https://");
  const size =
    deviceMode === "desktop" ? "1280 × 800" :
    deviceMode === "mobile"  ? "375 × 667"  :
    deviceMode === "tablet"  ? "768 × 1024" :
    customWidth + " × " + customHeight;

  const rows = [
    ["URL",         url],
    ["Domain",      domain],
    ["Security",    isHttps ? "HTTPS ✓" : "HTTP (not secure)"],
    ["Device",      deviceMode.charAt(0).toUpperCase() + deviceMode.slice(1)],
    ["Resolution",  size],
    ["Favicon",     "__favicon__"],
  ];

  rows.forEach(([key, val]) => {
    const row = document.createElement("div");
    row.className = "info-row";

    const k = document.createElement("span");
    k.className = "info-key";
    k.textContent = key;

    const v = document.createElement("span");
    v.className = "info-val";

    if (val === "__favicon__") {
      const fimg = document.createElement("img");
      fimg.className = "info-favicon";
      fimg.src = faviconDataUrl(url, 32);
      fimg.alt = domain;
      fimg.onerror = () => { fimg.hidden = true; };
      v.appendChild(fimg);
    } else {
      const safeVal = String(val).replace(/[\x00-\x1F]/g, "").slice(0, 200);
      v.textContent = safeVal;
      if (key === "Security") {
        v.classList.add(isHttps ? "info-val-secure" : "info-val-insecure");
      }
      if (key === "URL") {
        v.className = "info-val info-url";
        v.title = safeVal;
      }
    }

    row.appendChild(k);
    row.appendChild(v);
    infoContent.appendChild(row);
  });
}

/* ── Pin / Unpin ──────────────────────────────────────────── */
pinBtn.addEventListener("click", () => {
  if (!currentUrl) return;
  const idx = allPinned.indexOf(currentUrl);
  if (idx > -1) {
    allPinned.splice(idx, 1);
  } else {
    allPinned.unshift(currentUrl);
    if (allPinned.length > 20) allPinned.pop();
  }
  chrome.storage.local.set({ pinned: allPinned });
  renderPinned();
  updatePinBtnState();
});

function updatePinBtnState() {
  const isPinned = !!(currentUrl && allPinned.includes(currentUrl));
  pinBtn.textContent = isPinned ? "★ Pinned" : "☆ Pin";
  pinBtn.classList.toggle("pinned-active", isPinned);
}

function renderPinned() {
  while (pinnedList.firstChild) pinnedList.removeChild(pinnedList.firstChild);
  noPins.classList.toggle("hidden", allPinned.length > 0);
  allPinned.forEach(addPinnedItem);
}

function addPinnedItem(u) {
  const li = document.createElement("li");
  li.className = "pinned-item";

  const fav = document.createElement("img");
  fav.className = "hist-favicon-img";
  fav.src = faviconDataUrl(u, 16);
  fav.alt = "";
  fav.onerror = () => { fav.hidden = true; };

  const label = document.createElement("span");
  label.className = "pinned-label";
  label.textContent = u.replace(/[\x00-\x1F]/g, "").slice(0, 120);

  const unpin = document.createElement("button");
  unpin.className = "unpin-btn";
  unpin.textContent = "✕";
  unpin.title = "Unpin";
  unpin.addEventListener("click", e => {
    e.stopPropagation();
    allPinned = allPinned.filter(x => x !== u);
    chrome.storage.local.set({ pinned: allPinned });
    renderPinned();
    updatePinBtnState();
  });

  li.addEventListener("click", () => {
    input.value = u;
    generate(u);
    switchTab("preview");
  });

  li.appendChild(fav);
  li.appendChild(label);
  li.appendChild(unpin);
  pinnedList.appendChild(li);
}

/* ── History ──────────────────────────────────────────────── */
function saveHistory(u) {
  allHistory = allHistory.filter(x => x !== u);
  allHistory.unshift(u);
  if (allHistory.length > 15) allHistory.pop();
  chrome.storage.local.set({ history: allHistory });
  // Only re-render if search is empty (don't disrupt active filter)
  if (!histSearch.value.trim()) {
    renderHistory(allHistory);
  }
}

function renderHistory(list) {
  while (historyList.firstChild) historyList.removeChild(historyList.firstChild);
  list.forEach(addHistoryItem);
  const noHist = document.getElementById("noHistory");
  if (noHist) noHist.classList.toggle("hidden", list.length > 0);
}

function addHistoryItem(u) {
  if (!u || typeof u !== "string") return;

  const li = document.createElement("li");

  const fav = document.createElement("img");
  fav.className = "hist-favicon-img";
  fav.src = faviconDataUrl(u, 16);
  fav.alt = "";
  fav.onerror = () => { fav.hidden = true; };

  const label = document.createElement("span");
  label.textContent = u.replace(/[\x00-\x1F]/g, "").slice(0, 120);

  const del = document.createElement("button");
  del.className = "hist-del-btn";
  del.textContent = "✕";
  del.title = "Remove from history";
  del.addEventListener("click", e => {
    e.stopPropagation();
    allHistory = allHistory.filter(x => x !== u);
    chrome.storage.local.set({ history: allHistory });
    renderHistory(histSearch.value.trim()
      ? allHistory.filter(x => x.toLowerCase().includes(histSearch.value.trim().toLowerCase()))
      : allHistory);
  });

  li.addEventListener("click", () => {
    input.value = u;
    generate(u);
  });

  li.appendChild(fav);
  li.appendChild(label);
  li.appendChild(del);
  historyList.appendChild(li);
}

/* History search */
histSearch.addEventListener("input", () => {
  const q = histSearch.value.trim().toLowerCase();
  renderHistory(q ? allHistory.filter(u => u.toLowerCase().includes(q)) : allHistory);
});

/* Clear all history */
document.getElementById("clearHistory").addEventListener("click", () => {
  allHistory = [];
  chrome.storage.local.set({ history: [], last: "" });
  renderHistory([]);
  resetPreview();
  input.value = "";
  histSearch.value = "";
});

/* Export history as JSON */
document.getElementById("exportHistory").addEventListener("click", () => {
  const data = JSON.stringify({
    exported: new Date().toISOString(),
    count: allHistory.length,
    history: allHistory
  }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "preview-pro-history.json";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }, 100);
});

/* ── Batch Preview (removed tab, keeping code for safety) ── */
const _batchRunBtn = document.getElementById("mainBatchRunBtn");
if (_batchRunBtn) {
  _batchRunBtn.addEventListener("click", () => {
    const raw = document.getElementById("mainBatchInput").value;
    const urls = raw.split("\n").map(l => l.trim()).filter(Boolean);
    if (!urls.length) return;
    runBatch(urls, batchDeviceMain, document.getElementById("mainBatchGrid"));
  });
}

function runBatch(urls, mode, grid) {
  while (grid.firstChild) grid.removeChild(grid.firstChild);

  urls.slice(0, 12).forEach(raw => {
    const url = normalize(raw);
    if (!url) return;

    const card = document.createElement("div");
    card.className = "batch-card";

    const header = document.createElement("div");
    header.className = "batch-card-title";

    const favImg = document.createElement("img");
    favImg.className = "batch-card-fav";
    favImg.src = faviconDataUrl(raw, 16);
    favImg.alt = "";
    favImg.onerror = () => { favImg.hidden = true; };

    const titleTxt = document.createElement("span");
    titleTxt.textContent = domainOf(raw);

    header.appendChild(favImg);
    header.appendChild(titleTxt);

    const imgWrap = document.createElement("div");
    imgWrap.className = "batch-img-wrap";

    const skel = document.createElement("div");
    skel.className = "batch-skel";
    skel.textContent = "Loading…";
    imgWrap.appendChild(skel);

    const img = new Image();
    const thumbUrl = getThumUrls(url, mode)[0];
    img.src = thumbUrl;
    img.className = "batch-thumb";
    img.alt = domainOf(raw);

    img.addEventListener("load", () => {
      if (skel.parentNode === imgWrap) imgWrap.removeChild(skel);
      imgWrap.appendChild(img);
    });
    img.addEventListener("error", () => {
      skel.textContent = "Failed to load";
      skel.classList.add("load-failed");
    });

    // Click card body → open in main preview tab
    imgWrap.addEventListener("click", () => {
      input.value = raw;
      generate(raw);
      switchTab("preview");
    });

    const actions = document.createElement("div");
    actions.className = "batch-card-actions";

    const dlBtn = document.createElement("button");
    dlBtn.className = "batch-action-btn";
    dlBtn.textContent = "⬇ Save";
    dlBtn.title = "Download screenshot";
    dlBtn.addEventListener("click", e => {
      e.stopPropagation();
      downloadScreenshot(thumbUrl, "preview-" + domainOf(raw) + ".png");
    });

    const openBtn = document.createElement("a");
    openBtn.className = "batch-action-btn";
    openBtn.textContent = "↗ Open";
    openBtn.title = "Open site in new tab";
    openBtn.target = "_blank";
    openBtn.rel = "noopener noreferrer";
    try { openBtn.href = new URL(url).href; } catch { openBtn.href = "#"; }
    openBtn.addEventListener("click", e => e.stopPropagation());

    actions.appendChild(dlBtn);
    actions.appendChild(openBtn);

    card.appendChild(header);
    card.appendChild(imgWrap);
    card.appendChild(actions);
    grid.appendChild(card);
  });
}

/* ── Compare ──────────────────────────────────────────────── */
function setupCompare(inputId, btnId, prevId) {
  const btn  = document.getElementById(btnId);
  const inp  = document.getElementById(inputId);
  const prev = document.getElementById(prevId);

  function loadCompare() {
    const raw = inp.value.trim();
    if (!raw) return;
    const url = normalize(raw);
    while (prev.firstChild) prev.removeChild(prev.firstChild);

    const loader = document.createElement("div");
    loader.className = "cmp-loading";
    loader.textContent = "Loading…";
    prev.appendChild(loader);

    const img = new Image();
    img.src = getThumUrls(url, "desktop")[0];
    img.className = "cmp-preview-img";
    img.alt = domainOf(raw);

    img.addEventListener("load", () => {
      if (loader.parentNode === prev) prev.removeChild(loader);
      prev.appendChild(img);
    });
    img.addEventListener("error", () => {
      loader.textContent = "Failed to load preview";
      loader.classList.add("load-failed");
    });
  }

  btn.addEventListener("click", loadCompare);
  inp.addEventListener("keydown", e => { if (e.key === "Enter") loadCompare(); });
}

setupCompare("cmpUrl1", "cmpBtn1", "cmpPrev1");
setupCompare("cmpUrl2", "cmpBtn2", "cmpPrev2");

/* ── Keyboard Shortcuts ───────────────────────────────────── */
document.addEventListener("keydown", e => {
  // Only fire when not typing in an input/textarea
  const tag = document.activeElement.tagName.toLowerCase();
  const typing = tag === "input" || tag === "textarea";

  if (e.key === "Escape") {
    fsOverlay.classList.add("hidden");
    qrOverlay.classList.add("hidden");
    infoPanel.classList.add("hidden");
    return;
  }

  if (e.altKey) {
    switch (e.key.toLowerCase()) {
      case "p":
        e.preventDefault();
        if (input.value.trim()) generate(input.value.trim());
        else input.focus();
        break;
      case "c":
        e.preventDefault();
        if (lastImgSrc) copyScreenshot(lastImgSrc, copyBtn);
        break;
      case "d":
        e.preventDefault();
        if (lastImgSrc) downloadScreenshot(lastImgSrc, "preview-" + domainOf(currentUrl) + ".png");
        break;
      case "f":
        e.preventDefault();
        openFullscreen();
        break;
    }
  }
});

/* ── Reset preview to empty state ────────────────────────── */
function resetPreview() {
  const oldFrame = preview.querySelector(".device-frame-wrap");
  if (oldFrame) preview.removeChild(oldFrame);
  emptyState.hidden = false;
  actionRow.classList.remove("show");
  if (actionRow2) actionRow2.hidden = true;
  statusBadge.classList.add("hidden");
  clearError();
  lastImgSrc = "";
  currentUrl = "";
  currentRaw = "";
  lastPreviewKey = "";
  updatePinBtnState();
}