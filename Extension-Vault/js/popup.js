/**
 * @file popup.js
 * @description ExtensionVault popup controller.
 * Handles UI interactions, tab detection, download orchestration, settings, and history display.
 */

import { extractId, isChromeWebStorePage } from '../lib/idExtractor.js';
import { orchestrateDownload } from '../lib/downloader.js';
import { logger } from '../lib/logger.js';

// ─────────────────────────────────────────────
// DOM References
// ─────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

const els = {
    // Input
    extensionIdInput:   $('extensionIdInput'),
    pasteBtn:           $('pasteBtn'),
    idValidation:       $('idValidation'),
    detectedBadge:      $('detectedBadge'),

    // Format
    fmtZip:             $('fmtZip'),
    fmtCrx:             $('fmtCrx'),

    // Download
    downloadBtn:        $('downloadBtn'),
    downloadBtnText:    $('downloadBtnText'),
    downloadBtnIcon:    $('downloadBtnIcon'),

    // Status
    statusSection:      $('statusSection'),
    statusCard:         $('statusCard'),
    statusSpinner:      $('statusSpinner'),
    statusText:         $('statusText'),
    statusSub:          $('statusSub'),
    statusIcon:         $('statusIcon'),
    progressBar:        $('progressBar'),
    progressFill:       $('progressFill'),
    resultDetails:      $('resultDetails'),
    resultFilename:     $('resultFilename'),
    resultSize:         $('resultSize'),
    resultHash:         $('resultHash'),
    resultCrxVersion:   $('resultCrxVersion'),

    // Metadata
    metadataEmpty:      $('metadataEmpty'),
    metadataContent:    $('metadataContent'),
    metaName:           $('metaName'),
    metaVersion:        $('metaVersion'),
    metaManifestVer:    $('metaManifestVer'),
    metaDesc:           $('metaDesc'),
    metaPermissions:    $('metaPermissions'),
    metaHostPerms:      $('metaHostPerms'),
    metaJson:           $('metaJson'),
    metaIconWrapper:    $('metaIconWrapper'),
    copyManifestBtn:    $('copyManifestBtn'),

    // Batch
    batchInput:         $('batchInput'),
    batchFormat:        $('batchFormat'),
    batchDownloadBtn:   $('batchDownloadBtn'),
    batchStatus:        $('batchStatus'),

    // Settings
    settingsToggle:     $('settingsToggle'),
    settingsPanel:      $('settingsPanel'),
    settingsClose:      $('settingsClose'),
    settingDefaultFormat: $('settingDefaultFormat'),
    settingCrxPattern:  $('settingCrxPattern'),
    settingZipPattern:  $('settingZipPattern'),
    settingDebugMode:   $('settingDebugMode'),
    settingShowHash:    $('settingShowHash'),
    saveSettingsBtn:    $('saveSettingsBtn'),
    debugPanel:         $('debugPanel'),
    debugLog:           $('debugLog'),
    copyLogsBtn:        $('copyLogsBtn'),
    clearLogsBtn:       $('clearLogsBtn'),

    // History
    historyToggle:      $('historyToggle'),
    historyPanel:       $('historyPanel'),
    historyClose:       $('historyClose'),
    historyList:        $('historyList'),
    historyCount:       $('historyCount'),
    historyEmpty:       $('historyEmpty'),
    clearHistoryBtn:    $('clearHistoryBtn'),
};

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

let currentExtensionId = null;
let currentExtensionName = 'extension';
let isDownloading = false;
let settings = {
    debugMode: false,
    defaultFormat: 'zip',
    crxPattern: '{id}.crx',
    zipPattern: '{name}-{id}.zip',
    showHashInStatus: true,
};
let lastManifest = null;

// ─────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const panel = document.getElementById('tab-' + tab.dataset.tab);
        if (panel) panel.classList.add('active');
    });
});

// ─────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────

async function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], (result) => {
            if (result.settings) {
                settings = { ...settings, ...result.settings };
            }
            resolve(settings);
        });
    });
}

function applySettingsToUI() {
    els.settingDefaultFormat.value = settings.defaultFormat;
    els.settingCrxPattern.value = settings.crxPattern;
    els.settingZipPattern.value = settings.zipPattern;
    els.settingDebugMode.checked = settings.debugMode;
    els.settingShowHash.checked = settings.showHashInStatus;

    // Apply default format to radio buttons
    if (settings.defaultFormat === 'crx') {
        els.fmtCrx.querySelector('input').checked = true;
        els.fmtCrx.classList.add('active');
        els.fmtZip.classList.remove('active');
    } else {
        els.fmtZip.querySelector('input').checked = true;
        els.fmtZip.classList.add('active');
        els.fmtCrx.classList.remove('active');
    }

    // Debug panel
    if (settings.debugMode) {
        els.debugPanel.classList.remove('hidden');
    } else {
        els.debugPanel.classList.add('hidden');
    }
}

els.saveSettingsBtn.addEventListener('click', () => {
    settings.defaultFormat = els.settingDefaultFormat.value;
    settings.crxPattern = els.settingCrxPattern.value || '{id}.crx';
    settings.zipPattern = els.settingZipPattern.value || '{name}-{id}.zip';
    settings.debugMode = els.settingDebugMode.checked;
    settings.showHashInStatus = els.settingShowHash.checked;

    chrome.storage.local.set({ settings });
    chrome.runtime.sendMessage({ type: 'SET_DEBUG_MODE', payload: { enabled: settings.debugMode } });

    if (settings.debugMode) {
        els.debugPanel.classList.remove('hidden');
    } else {
        els.debugPanel.classList.add('hidden');
    }

    applySettingsToUI();
    showSettingsSaved();
});

function showSettingsSaved() {
    const btn = els.saveSettingsBtn;
    const orig = btn.textContent;
    btn.textContent = '✓ Saved!';
    btn.style.background = 'var(--color-success, #22c55e)';
    setTimeout(() => {
        btn.textContent = orig;
        btn.style.background = '';
    }, 1500);
}

els.settingsToggle.addEventListener('click', () => {
    els.settingsPanel.classList.toggle('hidden');
    if (!els.settingsPanel.classList.contains('hidden')) {
        els.historyPanel.classList.add('hidden');
    }
});
els.settingsClose.addEventListener('click', () => els.settingsPanel.classList.add('hidden'));

// ─────────────────────────────────────────────
// History
// ─────────────────────────────────────────────

els.historyToggle.addEventListener('click', () => {
    els.historyPanel.classList.toggle('hidden');
    if (!els.historyPanel.classList.contains('hidden')) {
        els.settingsPanel.classList.add('hidden');
        loadAndRenderHistory();
    }
});
els.historyClose.addEventListener('click', () => els.historyPanel.classList.add('hidden'));

els.clearHistoryBtn.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' });
    loadAndRenderHistory();
});

async function loadAndRenderHistory() {
    const response = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' });
    const history = Array.isArray(response) ? response : [];

    els.historyCount.textContent = `${history.length} download${history.length !== 1 ? 's' : ''}`;

    if (history.length === 0) {
        els.historyEmpty.classList.remove('hidden');
        // Clear old entries
        Array.from(els.historyList.children).forEach(c => {
            if (c !== els.historyEmpty) c.remove();
        });
        return;
    }

    els.historyEmpty.classList.add('hidden');

    // Remove old entries
    Array.from(els.historyList.children).forEach(c => {
        if (c !== els.historyEmpty) c.remove();
    });

    history.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'history-item' + (entry.success ? '' : ' history-item--fail');

        const date = new Date(entry.timestamp).toLocaleString();
        const size = entry.fileSize ? formatBytes(entry.fileSize) : '–';

        item.innerHTML = `
            <div class="history-item-top">
                <span class="history-item-name">${escapeHtml(entry.extensionName || entry.extensionId)}</span>
                <span class="history-item-format badge badge-auto">${entry.format.toUpperCase()}</span>
            </div>
            <div class="history-item-meta">
                <span class="history-item-id">${entry.extensionId}</span>
                <span class="history-item-size">${size}</span>
            </div>
            <div class="history-item-date">${date}</div>
            ${entry.success ? '' : `<div class="history-item-error">✗ ${escapeHtml(entry.error || 'Failed')}</div>`}
        `;

        item.addEventListener('click', () => {
            els.extensionIdInput.value = entry.extensionId;
            handleInputChange();
            els.historyPanel.classList.add('hidden');
            document.querySelector('[data-tab="download"]')?.click();
        });

        els.historyList.appendChild(item);
    });
}

// ─────────────────────────────────────────────
// Debug Log
// ─────────────────────────────────────────────

els.copyLogsBtn.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_LOGS' });
    await navigator.clipboard.writeText(response.logs || '').catch(() => {});
    els.copyLogsBtn.textContent = 'Copied!';
    setTimeout(() => { els.copyLogsBtn.textContent = 'Copy'; }, 1500);
});

els.clearLogsBtn.addEventListener('click', () => {
    els.debugLog.innerHTML = '';
});

// ─────────────────────────────────────────────
// Format Selector
// ─────────────────────────────────────────────

[els.fmtZip, els.fmtCrx].forEach(label => {
    label.addEventListener('click', () => {
        [els.fmtZip, els.fmtCrx].forEach(l => l.classList.remove('active'));
        label.classList.add('active');
    });
});

function getSelectedFormat() {
    return els.fmtCrx.querySelector('input').checked ? 'crx' : 'zip';
}

// ─────────────────────────────────────────────
// ID Input & Validation
// ─────────────────────────────────────────────

els.extensionIdInput.addEventListener('input', handleInputChange);
els.extensionIdInput.addEventListener('paste', () => setTimeout(handleInputChange, 10));

function handleInputChange() {
    const raw = els.extensionIdInput.value.trim();

    if (!raw) {
        clearValidation();
        setDownloadEnabled(false);
        currentExtensionId = null;
        return;
    }

    const result = extractId(raw);

    if (result.id) {
        currentExtensionId = result.id;
        showValidation('✓ Valid extension ID', 'success');
        setDownloadEnabled(true);
    } else {
        currentExtensionId = null;
        showValidation(result.error || 'Invalid extension ID or URL', 'error');
        setDownloadEnabled(false);
    }
}

function showValidation(msg, type) {
    els.idValidation.textContent = msg;
    els.idValidation.className = `validation-msg validation-msg--${type}`;
    els.idValidation.classList.remove('hidden');
}

function clearValidation() {
    els.idValidation.textContent = '';
    els.idValidation.classList.add('hidden');
}

// ─────────────────────────────────────────────
// Paste Button
// ─────────────────────────────────────────────

els.pasteBtn.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        els.extensionIdInput.value = text.trim();
        handleInputChange();
    } catch (err) {
        logger.warn('popup: Clipboard read failed', { error: err.message });
    }
});

// ─────────────────────────────────────────────
// Auto-detect from active tab
// ─────────────────────────────────────────────

async function detectFromActiveTab() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url) return;

        if (!isChromeWebStorePage(tab.url)) return;

        const result = extractId(tab.url);
        if (result.id) {
            els.extensionIdInput.value = result.id;
            handleInputChange();
            els.detectedBadge.classList.remove('hidden');

            // Try to get name from tab title
            if (tab.title) {
                const name = tab.title.replace(/\s*-\s*Chrome Web Store.*$/i, '').trim();
                if (name) currentExtensionName = name;
            }

            logger.info('popup: Auto-detected extension ID from tab', { id: result.id });
        }
    } catch (err) {
        logger.warn('popup: Tab detection failed', { error: err.message });
    }
}

// ─────────────────────────────────────────────
// Download
// ─────────────────────────────────────────────

els.downloadBtn.addEventListener('click', startDownload);

async function startDownload() {
    if (isDownloading || !currentExtensionId) return;

    const format = getSelectedFormat();

    isDownloading = true;
    setDownloadEnabled(false);
    setDownloadBtnLoading(true);

    showStatusSection();
    setStatus('loading', 'Connecting to Chrome Web Store...', '');
    setProgress(0.05);

    try {
        const result = await orchestrateDownload({
            extensionId: currentExtensionId,
            format,
            extensionName: currentExtensionName,
            crxPattern: settings.crxPattern,
            zipPattern: settings.zipPattern,
            onStatus: (msg) => setStatus('loading', msg, ''),
            onProgress: setProgress,
        });

        if (result.success) {
            setProgress(1);
            setStatus('success', '✓ Download complete!', result.filename || '');
            showResultDetails(result);

            // Show metadata if ZIP
            if (format === 'zip' && result.manifest) {
                renderMetadata(result.manifest);
            }
        } else {
            setStatus('error', '✗ Download failed', result.error || 'Unknown error');
            hideProgress();
        }
    } catch (err) {
        logger.error('popup: Download error', { error: err.message });
        setStatus('error', '✗ Download failed', err.message);
        hideProgress();
    } finally {
        isDownloading = false;
        setDownloadEnabled(true);
        setDownloadBtnLoading(false);
    }
}

// ─────────────────────────────────────────────
// Batch Download
// ─────────────────────────────────────────────

els.batchDownloadBtn.addEventListener('click', startBatchDownload);

async function startBatchDownload() {
    const raw = els.batchInput.value.trim();
    if (!raw) return;

    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const format = els.batchFormat.value;

    const ids = [];
    const errors = [];

    lines.forEach(line => {
        const result = extractId(line);
        if (result.id) {
            ids.push(result.id);
        } else {
            errors.push(`Invalid: ${line}`);
        }
    });

    if (ids.length === 0) {
        els.batchStatus.innerHTML = errors.map(e => `<div class="batch-error">${escapeHtml(e)}</div>`).join('');
        return;
    }

    els.batchDownloadBtn.disabled = true;
    els.batchStatus.innerHTML = `<div class="batch-info">Starting ${ids.length} download(s)...</div>`;

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        els.batchStatus.innerHTML = `<div class="batch-info">Downloading ${i + 1}/${ids.length}: ${id}...</div>`;

        try {
            const result = await orchestrateDownload({
                extensionId: id,
                format,
                extensionName: id,
                crxPattern: settings.crxPattern,
                zipPattern: settings.zipPattern,
            });

            if (result.success) {
                succeeded++;
            } else {
                failed++;
                errors.push(`${id}: ${result.error}`);
            }
        } catch (err) {
            failed++;
            errors.push(`${id}: ${err.message}`);
        }

        // Small delay between downloads to avoid throttling
        if (i < ids.length - 1) await sleep(500);
    }

    const summary = [`✓ ${succeeded} succeeded`, failed > 0 ? `✗ ${failed} failed` : ''].filter(Boolean).join(' · ');
    const errorHtml = errors.slice(0, 5).map(e => `<div class="batch-error">${escapeHtml(e)}</div>`).join('');
    els.batchStatus.innerHTML = `<div class="batch-summary">${summary}</div>${errorHtml}`;

    els.batchDownloadBtn.disabled = false;
}

// ─────────────────────────────────────────────
// Metadata Rendering
// ─────────────────────────────────────────────

function renderMetadata(manifest) {
    if (!manifest) return;
    lastManifest = manifest;

    els.metadataEmpty.classList.add('hidden');
    els.metadataContent.classList.remove('hidden');

    els.metaName.textContent = manifest.name || '–';
    els.metaVersion.textContent = manifest.version ? `v${manifest.version}` : '–';
    els.metaManifestVer.textContent = manifest.manifest_version ? `Manifest V${manifest.manifest_version}` : '–';
    els.metaDesc.textContent = manifest.description || '';

    // Permissions
    renderChips(els.metaPermissions, manifest.permissions || []);
    renderChips(els.metaHostPerms, manifest.host_permissions || []);

    // JSON
    els.metaJson.textContent = JSON.stringify(manifest, null, 2);

    // Icon
    if (manifest.icons) {
        const sizes = Object.keys(manifest.icons).map(Number).sort((a, b) => b - a);
        const iconSize = sizes[0];
        if (iconSize) {
            // We can't load the icon from inside the ZIP easily here; show placeholder
            els.metaIconWrapper.innerHTML = `<div class="meta-icon-placeholder">${(manifest.name || 'E')[0].toUpperCase()}</div>`;
        }
    }
}

function renderChips(container, items) {
    container.innerHTML = '';
    if (!items.length) {
        container.innerHTML = '<span class="meta-chip meta-chip--empty">None</span>';
        return;
    }
    items.forEach(item => {
        const chip = document.createElement('span');
        chip.className = 'meta-chip';
        chip.textContent = item;
        container.appendChild(chip);
    });
}

els.copyManifestBtn.addEventListener('click', async () => {
    if (!lastManifest) return;
    await navigator.clipboard.writeText(JSON.stringify(lastManifest, null, 2)).catch(() => {});
    els.copyManifestBtn.textContent = 'Copied!';
    setTimeout(() => { els.copyManifestBtn.textContent = 'Copy'; }, 1500);
});

// ─────────────────────────────────────────────
// Status UI Helpers
// ─────────────────────────────────────────────

function showStatusSection() {
    els.statusSection.removeAttribute('hidden');
    els.resultDetails.classList.add('hidden');
    els.progressBar.classList.remove('hidden');
}

function setStatus(type, text, sub) {
    const icons = { loading: '⏳', success: '✅', error: '❌', info: 'ℹ️' };
    els.statusText.textContent = text;
    els.statusSub.textContent = sub || '';
    els.statusIcon.textContent = icons[type] || '';
    els.statusCard.className = `status-card status-card--${type}`;

    if (type === 'loading') {
        els.statusSpinner.classList.remove('hidden');
    } else {
        els.statusSpinner.classList.add('hidden');
    }
}

function setProgress(ratio) {
    const pct = Math.round(Math.min(Math.max(ratio, 0), 1) * 100);
    els.progressFill.style.width = pct + '%';
}

function hideProgress() {
    els.progressBar.classList.add('hidden');
}

function showResultDetails(result) {
    els.resultDetails.classList.remove('hidden');
    hideProgress();

    els.resultFilename.textContent = result.filename || '–';
    els.resultSize.textContent = result.fileSize ? formatBytes(result.fileSize) : '–';

    if (settings.showHashInStatus && result.sha256) {
        els.resultHash.textContent = result.sha256.slice(0, 16) + '...';
        els.resultHash.title = result.sha256;
    } else {
        const hashRow = els.resultHash.closest('.detail-row');
        if (hashRow) hashRow.style.display = 'none';
    }

    if (result.crxVersion) {
        els.resultCrxVersion.textContent = `CRX${result.crxVersion}`;
    } else {
        const verRow = els.resultCrxVersion.closest?.('.detail-row');
        if (verRow) verRow.style.display = 'none';
    }
}

// Copy hash on click
els.resultHash.addEventListener('click', async () => {
    const fullHash = els.resultHash.title;
    if (!fullHash) return;
    await navigator.clipboard.writeText(fullHash).catch(() => {});
    els.resultHash.textContent = 'Copied!';
    setTimeout(() => {
        els.resultHash.textContent = fullHash.slice(0, 16) + '...';
    }, 1500);
});

// ─────────────────────────────────────────────
// Download Button State
// ─────────────────────────────────────────────

function setDownloadEnabled(enabled) {
    els.downloadBtn.disabled = !enabled;
}

function setDownloadBtnLoading(loading) {
    if (loading) {
        els.downloadBtnText.textContent = 'Downloading…';
        els.downloadBtnIcon.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;"></div>';
    } else {
        els.downloadBtnText.textContent = 'Download Extension';
        els.downloadBtnIcon.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>`;
    }
}

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────

async function init() {
    await loadSettings();
    applySettingsToUI();
    await detectFromActiveTab();

    // Notify service worker of debug mode
    chrome.runtime.sendMessage({ type: 'SET_DEBUG_MODE', payload: { enabled: settings.debugMode } });

    logger.info('popup: Initialized');
}

init();
