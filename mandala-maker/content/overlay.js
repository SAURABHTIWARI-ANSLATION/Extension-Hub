'use strict';

(async () => {
  const existing = document.getElementById('simpleMandalaOverlay');
  if (existing) {
    existing.remove();
    return;
  }

  const studioUrl = chrome.runtime.getURL('content/mandala-canvas.html');
  const data = await chrome.storage.sync.get(['mandalaSettings']);
  const settings = data.mandalaSettings || {};

  const overlay = document.createElement('div');
  overlay.id = 'simpleMandalaOverlay';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '2147483647',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px', background: 'rgba(0,0,0,0.7)'
  });

  const shell = document.createElement('div');
  Object.assign(shell.style, {
    width: 'min(900px,96vw)', maxHeight: '90vh',
    padding: '16px', borderRadius: '16px',
    background: '#ffffff', display: 'grid', gap: '12px',
    boxShadow: '0 24px 64px rgba(0,0,0,.4)'
  });

  const header = document.createElement('div');
  Object.assign(header.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' });

  const titleEl = document.createElement('div');
  const h2 = document.createElement('h2');
  h2.textContent = 'Mandala Overlay';
  Object.assign(h2.style, { margin: '0', fontFamily: 'system-ui,sans-serif', fontSize: '20px', fontWeight: '700', color: '#111111' });

  const subtitle = document.createElement('p');
  const symLabel = String(settings.symmetry || 6);
  subtitle.textContent = symLabel + '-fold symmetry · draw on the canvas below';
  Object.assign(subtitle.style, { margin: '4px 0 0', color: '#6B7280', fontSize: '13px', fontFamily: 'system-ui,sans-serif' });
  titleEl.append(h2, subtitle);

  const closeBtn = mkBtn('Close', '#111111', '#ffffff', '#E5E7EB');
  closeBtn.addEventListener('click', () => overlay.remove());
  header.append(titleEl, closeBtn);

  const canvasFrame = document.createElement('div');
  Object.assign(canvasFrame.style, { background: '#f9fafb', borderRadius: '12px', padding: '8px', border: '1px solid #E5E7EB' });

  const canvas = document.createElement('canvas');
  canvas.width = 860;
  canvas.height = 520;
  Object.assign(canvas.style, { display: 'block', width: '100%', height: 'min(60vh,520px)', borderRadius: '8px', cursor: 'crosshair', touchAction: 'none' });
  canvasFrame.appendChild(canvas);

  const controls = document.createElement('div');
  Object.assign(controls.style, { display: 'flex', flexWrap: 'wrap', gap: '8px' });

  const clearBtn = mkBtn('Clear', '#f9fafb', '#374151', '#E5E7EB');
  const saveBtn = mkBtn('Save PNG', '#2563EB', '#ffffff', 'transparent');
  const studioBtn = mkBtn('Open Studio ->', '#f9fafb', '#374151', '#E5E7EB');

  controls.append(clearBtn, saveBtn, studioBtn);
  shell.append(header, canvasFrame, controls);
  overlay.appendChild(shell);
  document.body.appendChild(overlay);

  const ctx = canvas.getContext('2d');
  const sym = Math.max(2, parseInt(settings.symmetry, 10) || 6);
  const brushColor = settings.brushColor || '#2563EB';
  const brushSize = Math.max(1, parseInt(settings.brushSize, 10) || 10);
  const center = { x: canvas.width / 2, y: canvas.height / 2 };
  let isDrawing = false;
  let lastPoint = null;

  drawGuide();

  canvas.addEventListener('pointerdown', e => {
    isDrawing = true;
    lastPoint = getPoint(e);
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', e => {
    if (!isDrawing || !lastPoint) return;
    const p = getPoint(e);
    drawSet(lastPoint, p);
    lastPoint = p;
  });

  canvas.addEventListener('pointerup', e => {
    isDrawing = false;
    lastPoint = null;
    canvas.releasePointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointercancel', () => {
    isDrawing = false;
    lastPoint = null;
  });

  clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGuide();
  });

  saveBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = 'mandala-overlay.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  studioBtn.addEventListener('click', async () => {
    try {
      await chrome.runtime.sendMessage({ action: 'openMandalaStudio' });
      return;
    } catch (_) {
      window.location.href = studioUrl;
    }
  });

  function getPoint(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height)
    };
  }

  function drawGuide() {
    ctx.save();
    ctx.strokeStyle = 'rgba(37,99,235,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < sym; i++) {
      const a = (Math.PI * 2 * i) / sym;
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(center.x + Math.cos(a) * canvas.height * 0.45, center.y + Math.sin(a) * canvas.height * 0.45);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSet(from, to) {
    for (let i = 0; i < sym; i++) {
      const a = (Math.PI * 2 * i) / sym;
      const s = rotate(from, center, a);
      const e2 = rotate(to, center, a);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(e2.x, e2.y);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }

  function rotate(p, origin, angle) {
    const dx = p.x - origin.x;
    const dy = p.y - origin.y;
    return {
      x: origin.x + dx * Math.cos(angle) - dy * Math.sin(angle),
      y: origin.y + dx * Math.sin(angle) + dy * Math.cos(angle)
    };
  }

  function mkBtn(label, bg, color, border) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    Object.assign(b.style, {
      padding: '8px 14px', border: '1px solid ' + border, borderRadius: '8px',
      background: bg, color, fontFamily: 'system-ui,sans-serif', fontWeight: '600',
      fontSize: '13px', cursor: 'pointer'
    });
    return b;
  }
})();
