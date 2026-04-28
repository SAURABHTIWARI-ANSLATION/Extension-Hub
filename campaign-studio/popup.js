'use strict';

/* ══════════════════════════════════════════════════
   Campaign Studio — Merged popup.js
   UTM Link Builder + URL Shortener
   ══════════════════════════════════════════════════ */

// ── Helpers ───────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const store = {
  get: (keys) => new Promise(r => chrome.storage.local.get(keys, r)),
  set: (obj)  => new Promise(r => chrome.storage.local.set(obj, r)),
};

// ── Toast message ─────────────────────────────────
const msgEl = $('#message');
let msgTimer;
function showMsg(text, dur = 2000) {
  msgEl.textContent = text;
  msgEl.classList.add('show');
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => msgEl.classList.remove('show'), dur);
}

// ══════════════════════════════════════════════════
// SECTION 1 — TABS
// ══════════════════════════════════════════════════
const tabBtns    = $$('.tab-btn');
const tabPanels  = $$('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    tabPanels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-selected','true');
    $(`#tab-${target}`).classList.add('active');
    if (target === 'history')  renderUTMHistory();
    if (target === 'presets')  renderPresets();
    if (target === 'shortener') loadShtHistory();
  });
});

// ══════════════════════════════════════════════════
// SECTION 2 — THEME TOGGLE
// ══════════════════════════════════════════════════
const html       = document.documentElement;
const themeBtn   = $('#themeToggle');
const themeIcon  = $('.theme-icon');

async function initTheme() {
  const { theme } = await store.get(['theme']);
  applyTheme(theme || 'light');
}
function applyTheme(t) {
  html.setAttribute('data-theme', t);
  themeIcon.textContent = t === 'dark' ? '☀️' : '🌙';
}
themeBtn.addEventListener('click', async () => {
  const cur = html.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  await store.set({ theme: next });
});

// ══════════════════════════════════════════════════
// SECTION 3 — UTM BUILDER
// ══════════════════════════════════════════════════

// — Fields
const urlInput      = $('#url');
const sourceInput   = $('#source');
const mediumInput   = $('#medium');
const campaignInput = $('#campaign');
const termInput     = $('#term');
const contentInput  = $('#content');
const utmIdInput    = $('#utmId');
const resultBox     = $('#result');
const statusPill    = $('#statusPill');
const lengthMeta    = $('#lengthMeta');
const lengthWarn    = $('#lengthWarning');
const clearBtn      = $('#clear');
const copyBtn       = $('#copy');
const qrToggle      = $('#qrToggle');
const qrContainer   = $('#qrContainer');
const qrImg         = $('#qrImg');
const qrDownload    = $('#qrDownload');

let copyFormat = 'url';
let currentURL = '';

// Live generation
const utmInputs = [urlInput, sourceInput, mediumInput, campaignInput, termInput, contentInput, utmIdInput];
utmInputs.forEach(el => el.addEventListener('input', generateURL));

function generateURL() {
  const base     = urlInput.value.trim();
  const source   = sourceInput.value.trim();
  const medium   = mediumInput.value.trim();
  const campaign = campaignInput.value.trim();
  const term     = termInput.value.trim();
  const cont     = contentInput.value.trim();
  const utmId    = utmIdInput.value.trim();

  if (!base || !source || !medium || !campaign) {
    resultBox.value = '';
    currentURL = '';
    setStatusPill('Waiting', '');
    lengthMeta.textContent = '0 characters';
    lengthWarn.classList.add('hidden');
    return;
  }

  let url;
  try { url = new URL(base); } catch { setStatusPill('Invalid URL', 'error'); return; }

  const params = { utm_source: source, utm_medium: medium, utm_campaign: campaign };
  if (term)   params.utm_term    = term;
  if (cont)   params.utm_content = cont;
  if (utmId)  params.utm_id      = utmId;

  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  currentURL = url.toString();

  resultBox.value = formatOutput(currentURL);
  setStatusPill('Ready', 'ready');
  const len = currentURL.length;
  lengthMeta.textContent = `${len} character${len !== 1 ? 's' : ''}`;
  lengthWarn.classList.toggle('hidden', len <= 2000);

  // hide QR if URL changed
  qrContainer.classList.add('hidden');
}

function formatOutput(url) {
  if (copyFormat === 'markdown') return `[Campaign Link](${url})`;
  if (copyFormat === 'html')     return `<a href="${url}">Campaign Link</a>`;
  return url;
}

function setStatusPill(text, state) {
  statusPill.textContent = text;
  statusPill.className = 'status-pill';
  if (state) statusPill.classList.add(`status-pill--${state}`);
}

function buildQrSrc(url) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
}

// — Copy URL
copyBtn.addEventListener('click', () => {
  if (!currentURL) { showMsg('Nothing to copy yet.'); return; }
  navigator.clipboard.writeText(formatOutput(currentURL)).then(() => {
    showMsg('Copied to clipboard ✓');
    saveToUTMHistory();
  });
});

// — Clear
clearBtn.addEventListener('click', () => {
  utmInputs.forEach(el => el.value = '');
  resultBox.value = '';
  currentURL = '';
  setStatusPill('Waiting', '');
  lengthMeta.textContent = '0 characters';
  lengthWarn.classList.add('hidden');
  qrContainer.classList.add('hidden');
  showMsg('Fields cleared.');
});

// — QR code
qrToggle.addEventListener('click', () => {
  if (!currentURL) { showMsg('Generate a URL first.'); return; }
  const showing = !qrContainer.classList.contains('hidden');
  if (showing) { qrContainer.classList.add('hidden'); return; }
  const src = buildQrSrc(currentURL);
  qrImg.src = src;
  qrDownload.href = src;
  qrContainer.classList.remove('hidden');
});

// — Copy format custom select
const trigger      = $('#copyFormatTrigger');
const optionsPanel = $('#copyFormatOptions');
const formatLabel  = $('#copyFormatLabel');

trigger.addEventListener('click', () => {
  const open = !optionsPanel.classList.contains('hidden');
  optionsPanel.classList.toggle('hidden', open);
  trigger.setAttribute('aria-expanded', String(!open));
});
$$('.select-option', optionsPanel).forEach(opt => {
  opt.addEventListener('click', () => {
    copyFormat = opt.dataset.value;
    formatLabel.textContent = opt.textContent;
    $$('.select-option', optionsPanel).forEach(o => {
      o.classList.remove('is-selected');
      o.setAttribute('aria-selected','false');
    });
    opt.classList.add('is-selected');
    opt.setAttribute('aria-selected','true');
    optionsPanel.classList.add('hidden');
    trigger.setAttribute('aria-expanded','false');
    if (currentURL) resultBox.value = formatOutput(currentURL);
  });
});
document.addEventListener('click', e => {
  if (!$('#copyFormatMenu').contains(e.target)) {
    optionsPanel.classList.add('hidden');
    trigger.setAttribute('aria-expanded','false');
  }
});

// — Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'u') { e.preventDefault(); urlInput.focus(); }
  if (e.ctrlKey && e.key === 'c' && document.activeElement !== resultBox) {
    if (currentURL) {
      e.preventDefault();
      navigator.clipboard.writeText(formatOutput(currentURL)).then(() => showMsg('Copied ✓'));
    }
  }
  if (e.key === 'Escape') clearBtn.click();
});

// ── UTM History ───────────────────────────────────
const MAX_UTM_HISTORY = 20;

async function saveToUTMHistory() {
  if (!currentURL) return;
  const { utmHistory = [] } = await store.get(['utmHistory']);
  const item = {
    url: currentURL,
    source:   sourceInput.value.trim(),
    medium:   mediumInput.value.trim(),
    campaign: campaignInput.value.trim(),
    date: Date.now(),
  };
  const deduped = utmHistory.filter(h => h.url !== currentURL);
  deduped.unshift(item);
  await store.set({ utmHistory: deduped.slice(0, MAX_UTM_HISTORY) });
}

async function renderUTMHistory() {
  const { utmHistory = [] } = await store.get(['utmHistory']);
  const list    = $('#historyList');
  const countEl = $('#historyCount');
  countEl.textContent = utmHistory.length ? `${utmHistory.length} link${utmHistory.length !== 1 ? 's' : ''} saved` : '';
  list.replaceChildren();

  if (!utmHistory.length) {
    list.appendChild(createEmptyState('No links yet - start building in the Builder tab!'));
    return;
  }
  const frag = document.createDocumentFragment();
  utmHistory.forEach((item, i) => frag.appendChild(createHistoryItem(item, i)));
  list.appendChild(frag);

  list.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const idx = Number(btn.dataset.idx);
    const { utmHistory: h2 = [] } = await store.get(['utmHistory']);

    if (action === 'copy') {
      navigator.clipboard.writeText(btn.dataset.url).then(() => showMsg('Copied ✓'));
    }
    if (action === 'load') {
      const item = h2[idx];
      const u = new URL(item.url);
      urlInput.value      = u.origin + u.pathname;
      sourceInput.value   = u.searchParams.get('utm_source')   || '';
      mediumInput.value   = u.searchParams.get('utm_medium')   || '';
      campaignInput.value = u.searchParams.get('utm_campaign') || '';
      termInput.value     = u.searchParams.get('utm_term')     || '';
      contentInput.value  = u.searchParams.get('utm_content')  || '';
      utmIdInput.value    = u.searchParams.get('utm_id')       || '';
      generateURL();
      // switch to builder tab
      $$('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      $$('.tab-content').forEach(p => p.classList.remove('active'));
      $('[data-tab="builder"]').classList.add('active');
      $('[data-tab="builder"]').setAttribute('aria-selected','true');
      $('#tab-builder').classList.add('active');
      showMsg('Loaded into builder ✓');
    }
    if (action === 'del') {
      h2.splice(idx, 1);
      await store.set({ utmHistory: h2 });
      renderUTMHistory();
    }
  }, { once: true });
}

// Clear history button
$('#clearHistory').addEventListener('click', async () => {
  await store.set({ utmHistory: [] });
  renderUTMHistory();
  showMsg('History cleared.');
});

// CSV export
$('#exportCsv').addEventListener('click', async () => {
  const { utmHistory = [] } = await store.get(['utmHistory']);
  if (!utmHistory.length) { showMsg('No history to export.'); return; }
  const rows = [
    ['URL','Source','Medium','Campaign','Date'],
    ...utmHistory.map(h => [h.url, h.source, h.medium, h.campaign, new Date(h.date).toISOString()]),
  ];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: 'utm-history.csv',
  });
  a.click();
  showMsg('CSV exported ✓');
});

// ── Presets ───────────────────────────────────────
const BUILTIN = [
  { label:'Google Ads',    source:'google',    medium:'cpc' },
  { label:'Facebook Ads',  source:'facebook',  medium:'paid_social' },
  { label:'Email',         source:'newsletter', medium:'email' },
  { label:'Instagram',     source:'instagram',  medium:'social' },
  { label:'LinkedIn',      source:'linkedin',   medium:'social' },
  { label:'Twitter/X',     source:'twitter',    medium:'social' },
  { label:'YouTube',       source:'youtube',    medium:'video' },
  { label:'TikTok',        source:'tiktok',     medium:'paid_social' },
];

async function renderPresets() {
  // Built-ins
  const builtinEl = $('#builtinPresets');
  builtinEl.replaceChildren();
  const builtinFrag = document.createDocumentFragment();
  BUILTIN.forEach((preset, i) => {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.dataset.idx = String(i);

    const icon = document.createElement('span');
    icon.className = 'preset-icon';
    icon.textContent = preset.icon;
    btn.append(icon, preset.label);

    btn.addEventListener('click', () => {
      sourceInput.value = preset.source;
      mediumInput.value = preset.medium;
      generateURL();
      // Switch to builder
      $$('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      $$('.tab-content').forEach(p => p.classList.remove('active'));
      $('[data-tab="builder"]').classList.add('active');
      $('[data-tab="builder"]').setAttribute('aria-selected','true');
      $('#tab-builder').classList.add('active');
      showMsg(`${preset.label} preset loaded ✓`);
    });
    builtinFrag.appendChild(btn);
  });
  builtinEl.appendChild(builtinFrag);

  // Custom
  const { customPresets = [] } = await store.get(['customPresets']);
  const customEl = $('#customPresetsList');
  customEl.replaceChildren();
  if (!customPresets.length) {
    customEl.appendChild(createEmptyState('No custom presets yet. Fill in the Builder and click + Save Current!'));
    return;
  }
  const customFrag = document.createDocumentFragment();
  customPresets.forEach((preset, i) => {
    const btn = document.createElement('button');
    btn.className = 'custom-preset-btn';
    btn.dataset.idx = String(i);
    btn.append(document.createTextNode(preset.name));

    const del = document.createElement('span');
    del.className = 'custom-preset-delete';
    del.dataset.del = String(i);
    del.title = 'Delete';
    del.textContent = '✕';
    btn.appendChild(del);
    customFrag.appendChild(btn);
  });
  customEl.appendChild(customFrag);
  $$('.custom-preset-btn', customEl).forEach(btn => {
    btn.addEventListener('click', async e => {
      const del = e.target.closest('[data-del]');
      if (del) {
        const { customPresets: cp = [] } = await store.get(['customPresets']);
        cp.splice(Number(del.dataset.del), 1);
        await store.set({ customPresets: cp });
        renderPresets();
        return;
      }
      const idx = Number(btn.dataset.idx);
      const { customPresets: cp2 = [] } = await store.get(['customPresets']);
      const preset = cp2[idx];
      urlInput.value      = preset.url      || '';
      sourceInput.value   = preset.source   || '';
      mediumInput.value   = preset.medium   || '';
      campaignInput.value = preset.campaign || '';
      termInput.value     = preset.term     || '';
      contentInput.value  = preset.content  || '';
      utmIdInput.value    = preset.utmId    || '';
      generateURL();
      $$('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      $$('.tab-content').forEach(p => p.classList.remove('active'));
      $('[data-tab="builder"]').classList.add('active');
      $('[data-tab="builder"]').setAttribute('aria-selected','true');
      $('#tab-builder').classList.add('active');
      showMsg(`"${preset.name}" loaded ✓`);
    });
  });
}

// Save preset
const savePresetBtn     = $('#savePreset');
const savePresetForm    = $('#savePresetForm');
const presetNameInput   = $('#presetNameInput');
const confirmSavePreset = $('#confirmSavePreset');
const cancelSavePreset  = $('#cancelSavePreset');

savePresetBtn.addEventListener('click', () => {
  savePresetForm.classList.remove('hidden');
  presetNameInput.focus();
});
cancelSavePreset.addEventListener('click', () => {
  savePresetForm.classList.add('hidden');
  presetNameInput.value = '';
});
confirmSavePreset.addEventListener('click', async () => {
  const name = presetNameInput.value.trim();
  if (!name) { showMsg('Enter a preset name.'); return; }
  const preset = {
    name,
    url:      urlInput.value.trim(),
    source:   sourceInput.value.trim(),
    medium:   mediumInput.value.trim(),
    campaign: campaignInput.value.trim(),
    term:     termInput.value.trim(),
    content:  contentInput.value.trim(),
    utmId:    utmIdInput.value.trim(),
  };
  const { customPresets = [] } = await store.get(['customPresets']);
  customPresets.push(preset);
  await store.set({ customPresets });
  savePresetForm.classList.add('hidden');
  presetNameInput.value = '';
  renderPresets();
  showMsg(`Preset "${name}" saved ✓`);
});

// ══════════════════════════════════════════════════
// SECTION 4 — URL SHORTENER
// ══════════════════════════════════════════════════

const SHT_API_ENDPOINT = 'https://is.gd/create.php';
const MAX_SHT_HISTORY  = 10;

const shtUrlInput    = $('#sht-url');
const shtShortenBtn  = $('#sht-shorten');
const shtBtnLabel    = $('.btn-label', $('#sht-shorten'));
const shtBtnSpinner  = $('.btn-spinner', $('#sht-shorten'));
const shtMsg         = $('#sht-msg');
const shtResultCard  = $('#sht-result-card');
const shtShortLink   = $('#sht-short-link');
const shtCopyBtn     = $('#sht-copy');
const shtOrigUrl     = $('#sht-orig-url');
const shtQrToggle    = $('#sht-qrToggle');
const shtQrContainer = $('#sht-qrContainer');
const shtQrImg       = $('#sht-qrImg');
const shtQrDownload  = $('#sht-qrDownload');
const shtClearHist   = $('#sht-clearHistory');
const shtHistList    = $('#sht-historyList');
const SHT_DEFAULT_BTN_LABEL = 'Shorten URL';

let shtRequestInFlight = false;
let shtCooldownUntil = 0;
let shtCooldownTimer = null;

// Shorten
shtShortenBtn.addEventListener('click', handleShorten);
shtUrlInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleShorten(); });

async function handleShorten() {
  if (shtRequestInFlight) return;
  if (Date.now() < shtCooldownUntil) {
    shtShowMsg(`Rate limit active. ${formatCooldownMessage(shtCooldownUntil)}.`, 'error');
    return;
  }

  const longUrl = shtUrlInput.value.trim();
  if (!longUrl) { shtShowMsg('Please enter a URL.', 'error'); return; }
  try { new URL(longUrl); } catch { shtShowMsg('Enter a valid URL (include https://).', 'error'); return; }
  shtRequestInFlight = true;
  shtSetLoading(true);
  shtClearMsg();
  shtResultCard.classList.add('hidden');

  try {
    const requestUrl = new URL(SHT_API_ENDPOINT);
    requestUrl.searchParams.set('format', 'json');
    requestUrl.searchParams.set('url', longUrl);

    const resp = await fetch(requestUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    const data = await parseShortenerResponse(resp);
    if (!resp.ok) {
      if (resp.status === 429) {
        startShtCooldown(getRetryAfterMs(resp));
      }
      throw new Error(getShortenerErrorMessage(resp, data));
    }
    if (data.errorcode) {
      if (Number(data.errorcode) === 3) {
        startShtCooldown(60000);
      }
      throw new Error(getShortenerErrorMessage(resp, data));
    }
    const shortUrl = data.shorturl || data.short_url || data.url;
    if (!shortUrl) {
      throw new Error(data.errormessage || data.error || data.message || 'Unable to shorten this URL right now.');
    }

    shtShowResult(shortUrl, longUrl);
    await saveShtHistory(longUrl, shortUrl);
    loadShtHistory();
  } catch (err) {
    shtShowMsg(err.message || 'Failed to shorten URL.', 'error');
  } finally {
    shtRequestInFlight = false;
    shtSetLoading(false);
  }
}

function shtSetLoading(on) {
  const coolingDown = Date.now() < shtCooldownUntil;
  shtShortenBtn.disabled = on || coolingDown;
  shtBtnLabel.classList.toggle('hidden', on && !coolingDown);
  shtBtnSpinner.classList.toggle('hidden', !on);
  if (!on && !coolingDown) {
    shtBtnLabel.textContent = SHT_DEFAULT_BTN_LABEL;
  }
}

function shtShowResult(shortUrl, longUrl) {
  shtShortLink.textContent = shortUrl;
  shtShortLink.href = shortUrl;
  shtOrigUrl.textContent = longUrl;
  shtQrContainer.classList.add('hidden');
  shtResultCard.classList.remove('hidden');
}

function shtShowMsg(text, type) {
  shtMsg.textContent = text;
  shtMsg.className = `sht-msg ${type}`;
}
function shtClearMsg() {
  shtMsg.textContent = '';
  shtMsg.className = 'sht-msg hidden';
}

async function parseShortenerResponse(resp) {
  const text = await resp.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getShortenerErrorMessage(resp, data) {
  const apiMessage = data?.errormessage || data?.error || data?.message || data?.detail;
  if (resp.status === 429) {
    const retryAfterMs = getRetryAfterMs(resp);
    if (retryAfterMs > 0) {
      return `Shortener rate limit reached. ${formatCooldownMessage(Date.now() + retryAfterMs)}.`;
    }
    return apiMessage || 'Shortener rate limit reached. Wait a moment, then try again.';
  }
  return apiMessage || `Request failed (${resp.status})`;
}

function getRetryAfterMs(resp) {
  const retryAfter = resp.headers.get('retry-after');
  if (!retryAfter) return 0;

  const seconds = Number.parseInt(retryAfter, 10);
  if (Number.isFinite(seconds) && seconds > 0) {
    return seconds * 1000;
  }

  const retryAt = Date.parse(retryAfter);
  if (Number.isNaN(retryAt)) return 0;

  return Math.max(0, retryAt - Date.now());
}

function startShtCooldown(retryAfterMs) {
  clearInterval(shtCooldownTimer);
  if (!retryAfterMs || retryAfterMs <= 0) {
    shtCooldownUntil = 0;
    return;
  }

  shtCooldownUntil = Date.now() + retryAfterMs;
  updateShtCooldownLabel();
  shtSetLoading(false);

  shtCooldownTimer = setInterval(() => {
    if (Date.now() >= shtCooldownUntil) {
      clearInterval(shtCooldownTimer);
      shtCooldownTimer = null;
      shtCooldownUntil = 0;
      shtBtnLabel.textContent = SHT_DEFAULT_BTN_LABEL;
      shtSetLoading(false);
      return;
    }
    updateShtCooldownLabel();
  }, 1000);
}

function updateShtCooldownLabel() {
  const remainingMs = Math.max(0, shtCooldownUntil - Date.now());
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  shtBtnLabel.textContent = `Retry in ${remainingSeconds}s`;
  shtBtnLabel.classList.remove('hidden');
  shtBtnSpinner.classList.add('hidden');
  shtShortenBtn.disabled = true;
}

function formatCooldownMessage(retryUntil) {
  const remainingMs = Math.max(0, retryUntil - Date.now());
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  return `Try again in about ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}`;
}

// Copy short URL
shtCopyBtn.addEventListener('click', () => {
  const url = shtShortLink.textContent;
  if (!url) return;
  navigator.clipboard.writeText(url).then(() => {
    shtCopyBtn.textContent = 'Copied ✓';
    setTimeout(() => shtCopyBtn.textContent = 'Copy', 1800);
  });
});

shtQrToggle.addEventListener('click', () => {
  const shortUrl = shtShortLink.textContent.trim();
  if (!shortUrl) { showMsg('Generate a short URL first.'); return; }
  const showing = !shtQrContainer.classList.contains('hidden');
  if (showing) { shtQrContainer.classList.add('hidden'); return; }
  const src = buildQrSrc(shortUrl);
  shtQrImg.src = src;
  shtQrDownload.href = src;
  shtQrContainer.classList.remove('hidden');
});

// History
async function saveShtHistory(longUrl, shortUrl) {
  const { shtHistory = [] } = await store.get(['shtHistory']);
  shtHistory.unshift({ longUrl, shortUrl, date: Date.now() });
  await store.set({ shtHistory: shtHistory.slice(0, MAX_SHT_HISTORY) });
}

async function loadShtHistory() {
  const { shtHistory = [] } = await store.get(['shtHistory']);
  shtHistList.replaceChildren();
  if (!shtHistory.length) {
    shtHistList.appendChild(createEmptyState('No links yet - shorten something above!'));
    return;
  }
  const frag = document.createDocumentFragment();
  shtHistory.forEach(item => frag.appendChild(createShortHistoryItem(item)));
  shtHistList.appendChild(frag);

  $$('.sht-history-copy', shtHistList).forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.url).then(() => {
        btn.textContent = '✓';
        setTimeout(() => btn.textContent = '', 1600);
      });
    });
  });
}

shtClearHist.addEventListener('click', async () => {
  await store.set({ shtHistory: [] });
  loadShtHistory();
  showMsg('Shortener history cleared.');
});

// ══════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════
function createEmptyState(text) {
  const el = document.createElement('p');
  el.className = 'empty-state';
  el.textContent = text;
  return el;
}

function createHistoryItem(item, idx) {
  const wrap = document.createElement('div');
  wrap.className = 'history-item';
  wrap.dataset.idx = String(idx);

  const body = document.createElement('div');
  body.className = 'history-item-body';

  const url = document.createElement('span');
  url.className = 'history-url';
  url.title = item.url;
  url.textContent = item.url;

  const meta = document.createElement('span');
  meta.className = 'history-meta';
  meta.textContent = `${item.source} · ${item.medium} · ${item.campaign} · ${relTime(item.date)}`;

  body.append(url, meta);

  const actions = document.createElement('div');
  actions.className = 'history-actions';
  actions.append(
    createActionButton('copy', item.url, 'Copy', ''),
    createActionButton('load', String(idx), 'Load into builder', '↩', true),
    createActionButton('del', String(idx), 'Delete', '', true)
  );

  wrap.append(body, actions);
  return wrap;
}

function createActionButton(action, value, title, label, useIdx = false) {
  const btn = document.createElement('button');
  btn.className = 'history-action-btn';
  btn.dataset.action = action;
  if (useIdx) {
    btn.dataset.idx = value;
  } else {
    btn.dataset.url = value;
  }
  btn.title = title;
  btn.type = 'button';
  btn.textContent = label;
  return btn;
}

function createShortHistoryItem(item) {
  const wrap = document.createElement('div');
  wrap.className = 'sht-history-item';

  const link = document.createElement('a');
  link.className = 'sht-history-short';
  link.href = item.shortUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.title = item.longUrl;
  link.textContent = item.shortUrl;

  const btn = document.createElement('button');
  btn.className = 'sht-history-copy';
  btn.dataset.url = item.shortUrl;
  btn.title = 'Copy';
  btn.type = 'button';
  btn.textContent = '';

  wrap.append(link, btn);
  return wrap;
}

function relTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Init ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  loadShtHistory();
  urlInput.focus();
});
