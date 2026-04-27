'use strict';
/* Options page — syncs with StorageService.SETTINGS_KEY = 'mandalaSettings' */

const STORAGE_KEY = 'mandalaSettings';

const DEFAULTS = {
  symmetry: 6,
  brushSize: 10,
  brushColor: '#2563EB',
  brushType: 'round',
  brushOpacity: 1,
  backgroundColor: '#ffffff',
  shadowEnabled: false,
  shadowColor: '#000000',
  shadowBlur: 10,
  centerX: 0.5,
  centerY: 0.5,
  mirrorEnabled: true,
  randomColors: false,
  showGuides: true,
  darkMode: false
};

document.addEventListener('DOMContentLoaded', async () => {
  const $ = id => document.getElementById(id);

  const fields = {
    symmetry:        $('symmetry'),
    brushSize:       $('brushSize'),
    brushOpacity:    $('brushOpacity'),
    brushColor:      $('brushColor'),
    brushType:       $('brushType'),
    backgroundColor: $('backgroundColor'),
    enableMirroring: $('enableMirroring'),
    showGuides:      $('showGuides'),
    randomColors:    $('randomColors'),
    darkMode:        $('darkMode'),
    shadowEnabled:   $('shadowEnabled'),
    shadowColor:     $('shadowColor'),
    shadowBlur:      $('shadowBlur'),
    canvasCenterX:   $('canvasCenterX'),
    canvasCenterY:   $('canvasCenterY'),
  };

  // Load from storage
  const stored = await chrome.storage.sync.get(STORAGE_KEY);
  const settings = { ...DEFAULTS, ...(stored[STORAGE_KEY] || {}) };
  applyToUI(settings);

  // Live labels
  fields.symmetry.addEventListener('input',     () => { $('symmetryValue').textContent = fields.symmetry.value; });
  fields.brushSize.addEventListener('input',    () => { $('brushSizeValue').textContent = fields.brushSize.value; });
  fields.brushOpacity.addEventListener('input', () => { $('brushOpacityValue').textContent = fields.brushOpacity.value + '%'; });
  fields.shadowBlur.addEventListener('input',   () => { $('shadowBlurValue').textContent = fields.shadowBlur.value; });
  fields.canvasCenterX.addEventListener('input',() => { $('centerXValue').textContent = fields.canvasCenterX.value + '%'; });
  fields.canvasCenterY.addEventListener('input',() => { $('centerYValue').textContent = fields.canvasCenterY.value + '%'; });

  // Save
  $('saveBtn').addEventListener('click', async () => {
    try {
      const payload = collectFromUI();
      await chrome.storage.sync.set({ [STORAGE_KEY]: payload });
      $('saveState').textContent = '✓ Saved';
      showStatus('Settings saved successfully.', 'success');
      setTimeout(() => { $('saveState').textContent = ''; }, 2000);
    } catch (e) {
      showStatus('Could not save settings.', 'error');
    }
  });

  // Reset
  $('resetBtn').addEventListener('click', async () => {
    if (!confirm('Reset all settings to defaults?')) return;
    await chrome.storage.sync.set({ [STORAGE_KEY]: DEFAULTS });
    applyToUI(DEFAULTS);
    showStatus('Defaults restored.', 'success');
  });

  // Clear artworks
  $('clearArtworksBtn').addEventListener('click', async () => {
    if (!confirm('Delete ALL saved artworks? This cannot be undone.')) return;
    await chrome.storage.local.remove(['mandalaArtworks', 'mandalaAutosave']);
    showStatus('All saved artworks cleared.', 'success');
  });

  function applyToUI(s) {
    fields.symmetry.value        = String(s.symmetry);
    fields.brushSize.value       = String(s.brushSize);
    fields.brushOpacity.value    = String(Math.round((s.brushOpacity || 1) * 100));
    fields.brushColor.value      = s.brushColor;
    fields.brushType.value       = s.brushType;
    fields.backgroundColor.value = s.backgroundColor;
    fields.enableMirroring.checked = Boolean(s.mirrorEnabled);
    fields.showGuides.checked    = Boolean(s.showGuides);
    fields.randomColors.checked  = Boolean(s.randomColors);
    fields.darkMode.checked      = Boolean(s.darkMode);
    fields.shadowEnabled.checked = Boolean(s.shadowEnabled);
    fields.shadowColor.value     = s.shadowColor;
    fields.shadowBlur.value      = String(s.shadowBlur);
    fields.canvasCenterX.value   = String(Math.round(s.centerX * 100));
    fields.canvasCenterY.value   = String(Math.round(s.centerY * 100));

    $('symmetryValue').textContent     = s.symmetry;
    $('brushSizeValue').textContent    = s.brushSize;
    $('brushOpacityValue').textContent = Math.round((s.brushOpacity || 1) * 100) + '%';
    $('shadowBlurValue').textContent   = s.shadowBlur;
    $('centerXValue').textContent      = Math.round(s.centerX * 100) + '%';
    $('centerYValue').textContent      = Math.round(s.centerY * 100) + '%';

    if (window.MMDropdowns && typeof window.MMDropdowns.sync === 'function') {
      window.MMDropdowns.sync('brushType');
    }
  }

  function collectFromUI() {
    return {
      symmetry:        parseInt(fields.symmetry.value),
      brushSize:       parseInt(fields.brushSize.value),
      brushOpacity:    parseInt(fields.brushOpacity.value) / 100,
      brushColor:      fields.brushColor.value,
      brushType:       fields.brushType.value,
      backgroundColor: fields.backgroundColor.value,
      mirrorEnabled:   fields.enableMirroring.checked,
      showGuides:      fields.showGuides.checked,
      randomColors:    fields.randomColors.checked,
      darkMode:        fields.darkMode.checked,
      shadowEnabled:   fields.shadowEnabled.checked,
      shadowColor:     fields.shadowColor.value,
      shadowBlur:      parseInt(fields.shadowBlur.value),
      centerX:         parseInt(fields.canvasCenterX.value) / 100,
      centerY:         parseInt(fields.canvasCenterY.value) / 100
    };
  }

  function showStatus(msg, type) {
    const el = $('statusMessage');
    el.textContent = msg;
    el.className = 'status-msg show ' + type;
    setTimeout(() => { el.className = 'status-msg'; }, 2800);
  }
});
