// content-script.js — SnapCam Pro Screenshot Selection Tool
// CSP-safe: no eval, no inline handlers

(function () {
  'use strict';

  // Prevent double-injection
  if (window.__snapcamSelecting) return;
  window.__snapcamSelecting = true;

  var overlay, selBox, startX, startY, isDragging = false;

  function cleanup() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null; selBox = null;
    window.__snapcamSelecting = false;
    document.removeEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      cleanup();
      chrome.runtime.sendMessage({ action: 'selectionCancelled' });
    }
  }

  // Build overlay
  overlay = document.createElement('div');
  overlay.id = '__snapcam_overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:2147483647',
    'background:rgba(0,0,0,0.35)', 'cursor:crosshair',
    'user-select:none', '-webkit-user-select:none'
  ].join(';');

  // Instruction hint
  var hint = document.createElement('div');
  hint.style.cssText = [
    'position:absolute', 'top:16px', 'left:50%', 'transform:translateX(-50%)',
    'background:rgba(0,0,0,0.75)', 'color:#fff', 'font:700 13px/1 system-ui,sans-serif',
    'padding:9px 18px', 'border-radius:8px', 'letter-spacing:0.02em',
    'pointer-events:none', 'white-space:nowrap'
  ].join(';');
  hint.textContent = 'Drag to select area · Esc to cancel';
  overlay.appendChild(hint);

  // Selection box
  selBox = document.createElement('div');
  selBox.style.cssText = [
    'position:absolute', 'border:2px solid #2563eb',
    'background:rgba(37,99,235,0.08)',
    'box-shadow:0 0 0 1px rgba(37,99,235,0.4)',
    'display:none', 'pointer-events:none'
  ].join(';');
  overlay.appendChild(selBox);

  overlay.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    isDragging = true;
    startX = e.clientX; startY = e.clientY;
    selBox.style.left = startX + 'px';
    selBox.style.top  = startY + 'px';
    selBox.style.width = '0'; selBox.style.height = '0';
    selBox.style.display = 'block';
    e.preventDefault();
  });

  overlay.addEventListener('mousemove', function (e) {
    if (!isDragging) return;
    var x = Math.min(e.clientX, startX);
    var y = Math.min(e.clientY, startY);
    var w = Math.abs(e.clientX - startX);
    var h = Math.abs(e.clientY - startY);
    selBox.style.left   = x + 'px';
    selBox.style.top    = y + 'px';
    selBox.style.width  = w + 'px';
    selBox.style.height = h + 'px';
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
      chrome.runtime.sendMessage({ action: 'selectionCancelled' });
      return;
    }

    var dpr = window.devicePixelRatio || 1;
    chrome.runtime.sendMessage({
      action: 'selectionComplete',
      rect: {
        x: Math.round(x * dpr),
        y: Math.round(y * dpr),
        width:  Math.round(w * dpr),
        height: Math.round(h * dpr),
        // Also pass CSS pixels for the scroll offset calculation
        cssX: x, cssY: y, cssW: w, cssH: h,
        dpr: dpr,
        scrollX: Math.round(window.scrollX * dpr),
        scrollY: Math.round(window.scrollY * dpr)
      }
    });
  });

  document.addEventListener('keydown', onKeyDown);
  document.documentElement.appendChild(overlay);
}());
