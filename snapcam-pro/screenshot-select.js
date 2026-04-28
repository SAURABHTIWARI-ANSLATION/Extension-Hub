// screenshot-select.js — injected into active tab for region selection
// CSP-safe: no eval, no inline handlers, DOM-built overlay

(function () {
  'use strict';

  // Only inject once
  if (document.__snapcamSelectActive) return;
  document.__snapcamSelectActive = true;

  var overlay = document.createElement('div');
  overlay.id = '__snapcam_overlay';

  var styles = {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '2147483647',
    cursor: 'crosshair',
    background: 'rgba(0,0,0,0.35)'
  };
  Object.assign(overlay.style, styles);

  var selection = document.createElement('div');
  selection.id = '__snapcam_selection';
  Object.assign(selection.style, {
    position: 'fixed',
    border: '2px solid #2563eb',
    background: 'rgba(37,99,235,0.08)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.3)',
    display: 'none',
    zIndex: '2147483647'
  });

  // Instruction label
  var label = document.createElement('div');
  label.id = '__snapcam_label';
  label.textContent = 'Drag to select region — Esc to cancel';
  Object.assign(label.style, {
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(15,15,25,0.9)',
    color: '#fff',
    padding: '8px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'system-ui, sans-serif',
    fontWeight: '600',
    letterSpacing: '0.2px',
    pointerEvents: 'none',
    zIndex: '2147483648',
    border: '1px solid rgba(255,255,255,0.12)'
  });

  // Size indicator
  var sizeLabel = document.createElement('div');
  sizeLabel.id = '__snapcam_size';
  Object.assign(sizeLabel.style, {
    position: 'fixed',
    background: 'rgba(15,15,25,0.85)',
    color: '#a5b4fc',
    padding: '3px 8px',
    borderRadius: '5px',
    fontSize: '11px',
    fontFamily: 'monospace',
    display: 'none',
    pointerEvents: 'none',
    zIndex: '2147483648'
  });

  document.body.appendChild(overlay);
  document.body.appendChild(selection);
  document.body.appendChild(label);
  document.body.appendChild(sizeLabel);

  var startX = 0, startY = 0, isDragging = false;

  function cleanup() {
    document.__snapcamSelectActive = false;
    overlay.remove();
    selection.remove();
    label.remove();
    sizeLabel.remove();
  }

  overlay.addEventListener('mousedown', function (e) {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    Object.assign(selection.style, {
      left: startX + 'px',
      top: startY + 'px',
      width: '0',
      height: '0',
      display: 'block'
    });
    sizeLabel.style.display = 'block';
  });

  overlay.addEventListener('mousemove', function (e) {
    if (!isDragging) return;
    var x = Math.min(e.clientX, startX);
    var y = Math.min(e.clientY, startY);
    var w = Math.abs(e.clientX - startX);
    var h = Math.abs(e.clientY - startY);
    Object.assign(selection.style, {
      left: x + 'px',
      top: y + 'px',
      width: w + 'px',
      height: h + 'px'
    });
    sizeLabel.textContent = w + ' × ' + h;
    sizeLabel.style.left = (e.clientX + 10) + 'px';
    sizeLabel.style.top = (e.clientY + 10) + 'px';
  });

  overlay.addEventListener('mouseup', function (e) {
    if (!isDragging) return;
    isDragging = false;

    var x = Math.min(e.clientX, startX);
    var y = Math.min(e.clientY, startY);
    var w = Math.abs(e.clientX - startX);
    var h = Math.abs(e.clientY - startY);

    cleanup();

    if (w < 10 || h < 10) {
      chrome.runtime.sendMessage({ action: 'screenshotSelectCancelled' });
      return;
    }

    var dpr = window.devicePixelRatio || 1;
    chrome.runtime.sendMessage({
      action: 'screenshotSelectRegion',
      region: {
        x: Math.round(x * dpr),
        y: Math.round(y * dpr),
        width: Math.round(w * dpr),
        height: Math.round(h * dpr),
        // logical coords for display
        lx: x, ly: y, lw: w, lh: h,
        dpr: dpr
      }
    });
  });

  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', onKey);
      cleanup();
      chrome.runtime.sendMessage({ action: 'screenshotSelectCancelled' });
    }
  });
}());
