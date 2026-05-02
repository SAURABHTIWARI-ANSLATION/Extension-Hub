/**
 * @file popup.js
 * @description ExtensionVault Popup Controller.
 * Handles all UI interactions: tab switching, form state, download orchestration,
 * settings, history, metadata display, and batch downloads.
 */

import { extractId, isChromeWebStorePage, detectCWSPageType } from '../lib/idExtractor.js';
import { formatFileSize } from '../lib/cwsResolver.js';
import { validatePattern, getDefaultPatterns } from '../lib/fileNamer.js';

// ─────────────────────────────────────────────
// DOM References
// ─────────────────────────────────────────────

const $ = id => document.getElementById(id);

const UI = {
  // Input
  idInput:          $('extensionIdInput'),
  pasteBtn:         $('pasteBtn'),
  detectedBadge:    $('detectedBadge'),
  idValidation:     $('idValidation'),

  // Format
  fmtZip:           $('fmtZip'),
  fmtCrx:           $('fmtCrx'),
  formatRadios:     document.querySelectorAll('input[name="format"]'),

  // Download
  downloadBtn:      $('downloadBtn'),
  downloadBtnText:  $('downloadBtnText'),
  downloadBtnIcon:  $('downloadBtnIcon'),

  // Status
  statusSection:    $('statusSection'),
  statusCard:       $('statusCard'),
  statusSpinner:    $('statusSpinner'),
  statusText:       $('statusText'),
  statusSub:        $('statusSub'),
  statusIcon:       $('statusIcon'),
  progressBar:      $('progressBar'),
  progressFill:     $('progressFill'),
  resultDetails:    $('resultDetails'),
  resultFilename:   $('resultFilename'),
  resultSize:       $('resultSize'),
  resultHash:       $('resultHash'),
  resultCrxVersion: $('resultCrxVersion'),

  // Tabs
  tabs:             document.querySelectorAll('.tab'),
  tabPanels:        document.querySelectorAll('.tab-panel'),

  // Metadata
  metadataEmpty:    $('metadataEmpty'),
  metadataContent:  $('metadataContent'),
  metaName:         $('metaName'),
  metaVersion:      $('metaVersion'),
  metaManifestVer:  $('metaManifestVer'),
  metaIconWrapper:  $('metaIconWrapper'),
  metaDesc:         $('metaDesc'),
  metaPermissions:  $('metaPermissions'),
  metaHostPerms:    $('metaHostPerms'),
  metaJson:         $('metaJson'),
  copyManifestBtn:  $('copyManifestBtn'),

  // Batch
  batchInput:       $('batchInput'),
  batchFormat:      $('batchFormat'),
  batchDownloadBtn: $('batchDownloadBtn'),
  batchStatus:      $('batchStatus'),

  // Settings
  settingsToggle:   $('settingsToggle'),
  settingsPanel:    $('settingsPanel'),
  settingsClose:    $('settingsClose'),
  saveSettingsBtn:  $('saveSettingsBtn'),
  settingDebugMode: $('settingDebugMode'),
  settingShowHash:  $('settingShowHash'),
  settingDefaultFormat: $('settingDefaultFormat'),
  settingCrxPattern:$('settingCrxPattern'),
  settingZipPattern:$('settingZipPattern'),
  debugPanel:       $('debugPanel'),
  debugLog:         $('debugLog'),
  copyLogsBtn:      $('copyLogsBtn'),
  clearLogsBtn:     $('clearLogsBtn'),

  // History
  historyToggle:    $('historyToggle'),
  historyPanel:     $('historyPanel'),
  historyClose:     $('historyClose'),
  historyList:      $('historyList'),
  historyEmpty:     $('historyEmpty'),
  historyCount:     $('historyCount'),
  clearHistoryBtn:  $('clearHistoryBtn'),
};

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

let state = {
  phase: 'idle',     // idle | resolving | downloading | converting | saving | done | error
  extensionId: '',
  currentFormat: 'zip',
  settings: {
    debugMode: false,
    defaultFormat: 'zip',
    crxPattern: '{id}.crx',
    zipPattern: '{name}-{id}.zip',
    showHashInStatus: true,
  },
  lastManifest: null,
  lastResult: null,
};

// ─────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────

async function loadSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        state.settings = { ...state.settings, ...result.settings };
      }
      resolve(state.settings);
    });
  });
}

function applySettingsToUI() {
  const s = state.settings;
  UI.settingDebugMode.checked = s.debugMode;
  UI.settingShowHash.checked = s.showHashInStatus;
  UI.settingDefaultFormat.value = s.defaultFormat;
  UI.settingCrxPattern.value = s.crxPattern;
  UI.settingZipPattern.value = s.zipPattern;

  // Apply default format
  selectFormat(s.defaultFormat);

  // Show/hide debug panel
  UI.debugPanel.classList.toggle('hidden', !s.debugMode);
}

async function saveSettings() {
  const newSettings = {
    debugMode: UI.settingDebugMode.checked,
    showHashInStatus: UI.settingShowHash.checked,
    defaultFormat: UI.settingDefaultFormat.value,
    crxPattern: UI.settingCrxPattern.value || getDefaultPatterns().crx,
    zipPattern: UI.settingZipPattern.value || getDefaultPatterns().zip,
  };

  chrome.storage.local.set({ settings: newSettings });
  state.settings = newSettings;

  // Notify SW of debug mode change
  chrome.runtime.sendMessage({ type: 'SET_DEBUG_MODE', payload: { enabled: newSettings.debugMode } });

  UI.debugPanel.classList.toggle('hidden', !newSettings.debugMode);

  UI.saveSettingsBtn.textContent = '✓ Saved!';
  setTimeout(() => { UI.saveSettingsBtn.textContent = 'Save Settings'; }, 1500);
}

// ─────────────────────────────────────────────
// Tab Management
// ─────────────────────────────────────────────

function switchTab(tabName) {
  UI.tabs.forEach(t => {
    const isActive = t.dataset.tab === tabName;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive);
  });
  UI.tabPanels.forEach(p => {
    p.classList.toggle('active', p.id === `tab-${tabName}`);
  });

  if (tabName === 'metadata' && state.lastManifest) {
    renderMetadata(state.lastManifest);
  }
}

// ─────────────────────────────────────────────
// Format Selection
// ─────────────────────────────────────────────

function selectFormat(format) {
  state.currentFormat = format;
  UI.fmtZip.classList.toggle('active', format === 'zip');
  UI.fmtCrx.classList.toggle('active', format === 'crx');
  UI.formatRadios.forEach(r => { r.checked = r.value === format; });
}

// ─────────────────────────────────────────────
// ID Validation & Detection
// ─────────────────────────────────────────────

function validateAndSetId(input, isAutoDetected = false) {
  const result = extractId(input);

  if (result.id) {
    state.extensionId = result.id;
    UI.idInput.value = result.id;
    UI.idInput.classList.remove('invalid');
    UI.idInput.classList.add('valid');
    UI.detectedBadge.classList.toggle('hidden', !isAutoDetected);
    showValidation(`✓ Valid ID: ${result.id.slice(0, 8)}…${result.id.slice(-4)}`, 'valid');
    UI.downloadBtn.disabled = false;
  } else {
    state.extensionId = '';
    UI.idInput.classList.remove('valid');
    UI.idInput.classList.add('invalid');
    UI.detectedBadge.classList.add('hidden');
    showValidation(result.error || 'Invalid extension ID', 'invalid');
    UI.downloadBtn.disabled = true;
  }
}

function showValidation(msg, type) {
  UI.idValidation.textContent = msg;
  UI.idValidation.className = `validation-msg ${type}`;
  UI.idValidation.classList.remove('hidden');
}

async function autoDetectFromActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;

    if (isChromeWebStorePage(tab.url)) {
      const { id } = extractId(tab.url);
      if (id) {
        validateAndSetId(id, true);
      }
    }
  } catch (_) {
    // activeTab permission might not be needed — silent fail
  }
}

// ─────────────────────────────────────────────
// Status Display
// ─────────────────────────────────────────────

function setStatus(phase, text, sub = '', icon = '') {
  state.phase = phase;
  UI.statusSection.hidden = false;
  UI.statusText.textContent = text;
  UI.statusSub.textContent = sub;
  UI.statusIcon.textContent = icon;

  const isLoading = ['resolving', 'downloading', 'converting', 'saving'].includes(phase);
  UI.statusSpinner.classList.toggle('hidden', !isLoading);
  UI.progressBar.classList.toggle('hidden', phase !== 'downloading');

  UI.statusCard.className = 'status-card';
  if (isLoading) UI.statusCard.classList.add('state-loading');
  else if (phase === 'done') UI.statusCard.classList.add('state-success');
  else if (phase === 'error') UI.statusCard.classList.add('state-error');
}

function setProgress(fraction) {
  UI.progressFill.style.width = `${Math.round(fraction * 100)}%`;
}

function showResult(result) {
  state.lastResult = result;
  UI.resultDetails.classList.remove('hidden');
  UI.resultFilename.textContent = result.filename || '—';
  UI.resultSize.textContent = formatFileSize(result.fileSize);
  UI.resultCrxVersion.textContent = result.crxVersion ? `CRX${result.crxVersion}` : '—';

  if (result.sha256 && state.settings.showHashInStatus) {
    UI.resultHash.textContent = result.sha256.slice(0, 16) + '…' + result.sha256.slice(-8);
    UI.resultHash.title = `Full SHA-256: ${result.sha256}\n(Click to copy)`;
    UI.resultHash.onclick = () => {
      navigator.clipboard.writeText(result.sha256);
      UI.resultHash.textContent = '✓ Copied!';
      setTimeout(() => {
        UI.resultHash.textContent = result.sha256.slice(0, 16) + '…' + result.sha256.slice(-8);
      }, 1500);
    };
  } else {
    UI.resultHash.textContent = '—';
  }
}

// ─────────────────────────────────────────────
// Download Flow
// ─────────────────────────────────────────────

async function startDownload() {
  if (!state.extensionId || state.phase === 'downloading') return;

  const format = state.currentFormat;
  UI.downloadBtn.disabled = true;
  UI.resultDetails.classList.add('hidden');

  setStatus('downloading', 'Connecting to Google…', 'Fetching CRX package');
  setProgress(0.05);

  try {
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Download timed out after 60 seconds')), 60000);

      chrome.runtime.sendMessage(
        {
          type: 'DOWNLOAD_EXTENSION',
          payload: {
            extensionId: state.extensionId,
            format,
            extensionName: 'extension',
            crxPattern: state.settings.crxPattern,
            zipPattern: state.settings.zipPattern,
          },
        },
        (resp) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(resp);
          }
        }
      );
    });

    if (response.success) {
      setStatus('done', `Downloaded successfully!`, `Saved as ${response.filename}`, '✓');
      setProgress(1);
      showResult(response);
      // Refresh history count
      renderHistoryCount();
    } else {
      setStatus('error', 'Download failed', response.error, '✗');
    }

  } catch (err) {
    setStatus('error', 'Download failed', err.message, '✗');
  } finally {
    UI.downloadBtn.disabled = false;
  }
}

// ─────────────────────────────────────────────
// Metadata Rendering
// ─────────────────────────────────────────────

function renderMetadata(manifest) {
  if (!manifest) {
    UI.metadataEmpty.classList.remove('hidden');
    UI.metadataContent.classList.add('hidden');
    return;
  }

  UI.metadataEmpty.classList.add('hidden');
  UI.metadataContent.classList.remove('hidden');

  UI.metaName.textContent = manifest.name || '—';
  UI.metaVersion.textContent = manifest.version ? `v${manifest.version}` : '—';
  UI.metaManifestVer.textContent = manifest.manifest_version ? `Manifest V${manifest.manifest_version}` : '—';

  // Icon
  UI.metaIconWrapper.innerHTML = '';
  const icons = manifest.icons || {};
  const iconKey = Object.keys(icons).sort((a, b) => Number(b) - Number(a))[0];
  if (iconKey && icons[iconKey]) {
    const img = document.createElement('img');
    img.src = icons[iconKey];
    img.alt = 'Extension icon';
    UI.metaIconWrapper.appendChild(img);
  }

  UI.metaDesc.textContent = manifest.description || '';

  // Permissions chips
  renderChips(UI.metaPermissions, manifest.permissions || [], 'chip-perm');
  renderChips(UI.metaHostPerms, manifest.host_permissions || [], 'chip-host');

  // JSON preview
  UI.metaJson.textContent = JSON.stringify(manifest, null, 2);
}

function renderChips(container, items, chipClass) {
  container.innerHTML = '';
  if (!items.length) {
    const span = document.createElement('span');
    span.className = 'chip chip-empty';
    span.textContent = 'None';
    container.appendChild(span);
    return;
  }
  items.forEach(item => {
    const chip = document.createElement('span');
    chip.className = `chip ${chipClass}`;
    chip.textContent = item;
    container.appendChild(chip);
  });
}

// ─────────────────────────────────────────────
// History
// ─────────────────────────────────────────────

async function renderHistory() {
  const response = await new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'GET_HISTORY' }, resolve);
  });

  const history = Array.isArray(response) ? response : [];
  renderHistoryList(history);
}

function renderHistoryList(history) {
  UI.historyList.innerHTML = '';

  if (!history.length) {
    UI.historyEmpty.classList.remove('hidden');
    UI.historyCount.textContent = '0 downloads';
    return;
  }

  UI.historyEmpty.classList.add('hidden');
  UI.historyCount.textContent = `${history.length} download${history.length !== 1 ? 's' : ''}`;

  history.forEach(entry => {
    const item = document.createElement('div');
    item.className = 'history-item';

    const date = new Date(entry.timestamp);
    const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    item.innerHTML = `
      <div class="history-item-top">
        <span class="history-item-name">${escapeHtml(entry.extensionName || 'Unknown')}</span>
        <div class="history-item-badges">
          <span class="badge-fmt badge-${entry.format}">${entry.format.toUpperCase()}</span>
          <span class="badge-fmt ${entry.success ? 'badge-ok' : 'badge-err'}">${entry.success ? 'OK' : 'ERR'}</span>
        </div>
      </div>
      <div class="history-item-id">${entry.extensionId}</div>
      <div class="history-item-meta">
        <span class="history-item-date">${dateStr}</span>
        <span class="history-item-size">${formatFileSize(entry.fileSize)}</span>
        <button class="history-item-del" data-id="${entry.id}" title="Delete entry">✕</button>
      </div>
    `;

    // Re-download on click
    item.querySelector('.history-item-name').addEventListener('click', () => {
      UI.idInput.value = entry.extensionId;
      validateAndSetId(entry.extensionId, false);
      selectFormat(entry.format);
      UI.historyPanel.classList.add('hidden');
      switchTab('download');
    });

    // Delete
    item.querySelector('.history-item-del').addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = e.target.dataset.id;
      await new Promise(resolve => {
        chrome.runtime.sendMessage({ type: 'REMOVE_HISTORY_ENTRY', payload: { id } }, resolve);
      });
      item.remove();
      renderHistoryCount();
    });

    UI.historyList.appendChild(item);
  });
}

async function renderHistoryCount() {
  const response = await new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'GET_HISTORY' }, resolve);
  });
  const history = Array.isArray(response) ? response : [];
  UI.historyCount.textContent = `${history.length} download${history.length !== 1 ? 's' : ''}`;
}

// ─────────────────────────────────────────────
// Batch Download
// ─────────────────────────────────────────────

async function startBatchDownload() {
  const lines = UI.batchInput.value
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  if (!lines.length) return;

  const format = UI.batchFormat.value;
  UI.batchDownloadBtn.disabled = true;
  UI.batchStatus.innerHTML = '';

  const items = lines.map(line => {
    const { id, error } = extractId(line);
    return { line, id, error };
  });

  // Render pending items
  const statusItems = {};
  items.forEach(({ id, line, error }) => {
    const div = document.createElement('div');
    div.className = 'batch-item batch-item--pending';
    const displayId = id || line.slice(0, 32);
    div.innerHTML = `
      <span class="batch-item-id">${escapeHtml(displayId)}</span>
      <span class="batch-item-status">${error ? '✗ Invalid' : '⏳ Pending'}</span>
    `;
    UI.batchStatus.appendChild(div);
    if (id) statusItems[id] = div;
  });

  // Process valid IDs sequentially
  for (const { id, error } of items) {
    if (!id) continue;

    const div = statusItems[id];
    if (div) div.querySelector('.batch-item-status').textContent = '⟳ Downloading…';

    const response = await new Promise(resolve => {
      chrome.runtime.sendMessage(
        { type: 'DOWNLOAD_EXTENSION', payload: { extensionId: id, format } },
        resolve
      );
    });

    if (div) {
      if (response.success) {
        div.className = 'batch-item batch-item--success';
        div.querySelector('.batch-item-status').textContent = `✓ ${response.filename}`;
      } else {
        div.className = 'batch-item batch-item--error';
        div.querySelector('.batch-item-status').textContent = `✗ ${response.error}`;
      }
    }

    // Small delay between downloads to be respectful
    await new Promise(r => setTimeout(r, 500));
  }

  UI.batchDownloadBtn.disabled = false;
  renderHistoryCount();
}

// ─────────────────────────────────────────────
// Debug Logs
// ─────────────────────────────────────────────

async function refreshDebugLogs() {
  const response = await new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'GET_LOGS' }, resolve);
  });
  if (response?.logs) {
    UI.debugLog.textContent = response.logs || '(no logs)';
    UI.debugLog.scrollTop = UI.debugLog.scrollHeight;
  }
}

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─────────────────────────────────────────────
// Event Wiring
// ─────────────────────────────────────────────

function wireEvents() {
  // Tabs
  UI.tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Format selection
  UI.fmtZip.addEventListener('click', () => selectFormat('zip'));
  UI.fmtCrx.addEventListener('click', () => selectFormat('crx'));

  // ID Input
  UI.idInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (!val) {
      UI.idInput.classList.remove('valid', 'invalid');
      UI.idValidation.classList.add('hidden');
      UI.detectedBadge.classList.add('hidden');
      UI.downloadBtn.disabled = true;
      state.extensionId = '';
      return;
    }
    validateAndSetId(val, false);
  });

  UI.idInput.addEventListener('paste', (e) => {
    setTimeout(() => validateAndSetId(UI.idInput.value.trim(), false), 50);
  });

  // Paste button
  UI.pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        UI.idInput.value = text.trim();
        validateAndSetId(text.trim(), false);
      }
    } catch (_) {
      UI.idInput.focus();
    }
  });

  // Download
  UI.downloadBtn.addEventListener('click', startDownload);

  // Hash copy
  UI.resultHash.addEventListener('click', () => {
    if (state.lastResult?.sha256) {
      navigator.clipboard.writeText(state.lastResult.sha256);
    }
  });

  // Manifest copy
  UI.copyManifestBtn.addEventListener('click', () => {
    if (state.lastManifest) {
      navigator.clipboard.writeText(JSON.stringify(state.lastManifest, null, 2));
      UI.copyManifestBtn.textContent = '✓ Copied!';
      setTimeout(() => { UI.copyManifestBtn.textContent = 'Copy'; }, 1500);
    }
  });

  // Settings panel
  UI.settingsToggle.addEventListener('click', () => {
    UI.settingsPanel.classList.remove('hidden');
    UI.historyPanel.classList.add('hidden');
  });
  UI.settingsClose.addEventListener('click', () => UI.settingsPanel.classList.add('hidden'));
  UI.saveSettingsBtn.addEventListener('click', saveSettings);

  // Debug
  UI.settingDebugMode.addEventListener('change', () => {
    UI.debugPanel.classList.toggle('hidden', !UI.settingDebugMode.checked);
    if (UI.settingDebugMode.checked) refreshDebugLogs();
  });
  UI.copyLogsBtn.addEventListener('click', async () => {
    const response = await new Promise(r => chrome.runtime.sendMessage({ type: 'GET_LOGS' }, r));
    if (response?.logs) {
      navigator.clipboard.writeText(response.logs);
      UI.copyLogsBtn.textContent = '✓ Copied';
      setTimeout(() => { UI.copyLogsBtn.textContent = 'Copy'; }, 1500);
    }
  });
  UI.clearLogsBtn.addEventListener('click', () => { UI.debugLog.textContent = ''; });

  // History panel
  UI.historyToggle.addEventListener('click', () => {
    UI.historyPanel.classList.remove('hidden');
    UI.settingsPanel.classList.add('hidden');
    renderHistory();
  });
  UI.historyClose.addEventListener('click', () => UI.historyPanel.classList.add('hidden'));
  UI.clearHistoryBtn.addEventListener('click', async () => {
    if (confirm('Clear all download history?')) {
      await new Promise(r => chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' }, r));
      renderHistory();
    }
  });

  // Batch
  UI.batchDownloadBtn.addEventListener('click', startBatchDownload);
}

// ─────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────

async function init() {
  // Load settings
  await loadSettings();
  applySettingsToUI();

  // Auto-detect extension ID from active tab
  await autoDetectFromActiveTab();

  // Wire all events
  wireEvents();

  // History count in background
  renderHistoryCount();
}

init().catch(console.error);