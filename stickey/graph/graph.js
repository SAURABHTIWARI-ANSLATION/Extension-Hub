/* global Stickey */

document.addEventListener('DOMContentLoaded', async () => {
  const utils = Stickey.utils;

  const canvas = document.getElementById('canvas');
  const nodeCount = document.getElementById('nodeCount');
  const edgeCount = document.getElementById('edgeCount');
  const filterInput = document.getElementById('filterInput');
  const clearFilterBtn = document.getElementById('clearFilterBtn');
  const resetViewBtn = document.getElementById('resetViewBtn');
  const list = document.getElementById('list');

  const ctx = canvas.getContext('2d');
  const state = {
    nodes: [],
    edges: [],
    byId: new Map(),
    scale: 1,
    panX: 0,
    panY: 0,
    dragging: false,
    dragStart: { x: 0, y: 0, panX: 0, panY: 0 }
  };

  function resizeCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  async function safeRuntimeMessage(payload) {
    if (!chrome?.runtime?.id) return null;
    try {
      return await chrome.runtime.sendMessage(payload);
    } catch {
      return null;
    }
  }

  const resp = await safeRuntimeMessage({ action: 'stickey_getAllAnnotations' });
  const all = resp?.allAnnotations || {};

  const nodes = Object.values(all).map((ann) => ({
    id: ann.id,
    type: ann.type,
    label: ann.type === 'note' ? (ann.note?.title || 'Untitled') : (ann.highlight?.exactText || 'Highlight').slice(0, 48),
    pageUrl: ann.pageUrl,
    pageTitle: ann.pageTitle,
    x: (Math.random() - 0.5) * 800,
    y: (Math.random() - 0.5) * 600,
    vx: 0,
    vy: 0
  }));

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edgePairs = new Set();
  const edges = [];
  Object.values(all).forEach((ann) => {
    (ann.linkedIds || []).forEach((other) => {
      if (!byId.has(ann.id) || !byId.has(other)) return;
      const key = [ann.id, other].sort().join('::');
      if (edgePairs.has(key)) return;
      edgePairs.add(key);
      edges.push({ a: ann.id, b: other });
    });
  });

  state.nodes = nodes;
  state.edges = edges;
  state.byId = byId;
  nodeCount.textContent = String(nodes.length);
  edgeCount.textContent = String(edges.length);

  function syncClear() {
    const has = Boolean(String(filterInput.value || '').trim());
    if (clearFilterBtn) clearFilterBtn.hidden = !has;
  }

  function renderList() {
    const q = String(filterInput.value || '').trim().toLowerCase();
    list.textContent = '';

    const filtered = state.nodes
      .filter((n) => !q || `${n.label} ${n.pageTitle || ''} ${n.pageUrl || ''}`.toLowerCase().includes(q))
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(0, 250);

    filtered.forEach((n) => list.appendChild(buildItem(n)));
  }

  function buildItem(n) {
    const el = document.createElement('div');
    el.className = 'item';

    const top = document.createElement('div');
    top.className = 'item-top';

    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = n.label || n.id.slice(-6);

    const badge = document.createElement('div');
    badge.className = 'badge';
    badge.textContent = n.type === 'note' ? 'Note' : 'Highlight';

    top.appendChild(label);
    top.appendChild(badge);

    const meta = document.createElement('div');
    meta.className = 'meta';
    try {
      meta.textContent = new URL(n.pageUrl).hostname;
    } catch {
      meta.textContent = String(n.pageUrl || '').slice(0, 40);
    }

    el.appendChild(top);
    el.appendChild(meta);

    el.addEventListener('click', async () => {
      await safeRuntimeMessage({ action: 'stickey_navigateTo', id: n.id });
    });

    return el;
  }

  filterInput.addEventListener('input', () => {
    syncClear();
    renderList();
  });
  filterInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      filterInput.value = '';
      syncClear();
      renderList();
      e.preventDefault();
    }
  });
  clearFilterBtn?.addEventListener('click', () => {
    filterInput.value = '';
    syncClear();
    renderList();
    filterInput.focus();
  });
  syncClear();
  renderList();

  function worldToScreen(pt) {
    return {
      x: pt.x * state.scale + state.panX,
      y: pt.y * state.scale + state.panY
    };
  }

  function screenToWorld(pt) {
    return {
      x: (pt.x - state.panX) / state.scale,
      y: (pt.y - state.panY) / state.scale
    };
  }

  function pickNode(screenX, screenY) {
    const p = screenToWorld({ x: screenX, y: screenY });
    let best = null;
    let bestDist = Infinity;
    for (const n of state.nodes) {
      const dx = n.x - p.x;
      const dy = n.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d < 14 / state.scale && d < bestDist) {
        best = n;
        bestDist = d;
      }
    }
    return best;
  }

  canvas.addEventListener('mousedown', (e) => {
    state.dragging = true;
    state.dragStart.x = e.clientX;
    state.dragStart.y = e.clientY;
    state.dragStart.panX = state.panX;
    state.dragStart.panY = state.panY;
  });

  window.addEventListener('mouseup', () => {
    state.dragging = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (!state.dragging) return;
    const dx = e.clientX - state.dragStart.x;
    const dy = e.clientY - state.dragStart.y;
    state.panX = state.dragStart.panX + dx;
    state.panY = state.dragStart.panY + dy;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.08 : 0.92;
    const before = screenToWorld({ x: e.clientX, y: e.clientY });
    state.scale = Math.max(0.25, Math.min(2.5, state.scale * factor));
    const after = worldToScreen(before);
    state.panX += e.clientX - after.x;
    state.panY += e.clientY - after.y;
  }, { passive: false });

  canvas.addEventListener('click', async (e) => {
    const n = pickNode(e.clientX, e.clientY);
    if (!n) return;
    await safeRuntimeMessage({ action: 'stickey_navigateTo', id: n.id });
  });

  function resetView() {
    state.scale = 1;
    state.panX = 0;
    state.panY = 0;
  }
  resetViewBtn?.addEventListener('click', () => resetView());

  function tick() {
    const repulsion = 1400;
    const linkStrength = 0.0028;
    const damp = 0.86;

    for (let i = 0; i < state.nodes.length; i++) {
      const a = state.nodes[i];
      for (let j = i + 1; j < state.nodes.length; j++) {
        const b = state.nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.max(20, Math.hypot(dx, dy));
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
    }

    for (const e of state.edges) {
      const a = state.byId.get(e.a);
      const b = state.byId.get(e.b);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const fx = dx * linkStrength;
      const fy = dy * linkStrength;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    for (const n of state.nodes) {
      n.vx *= damp;
      n.vy *= damp;
      n.x += n.vx;
      n.y += n.vy;
    }
  }

  function draw() {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(state.panX, state.panY);
    ctx.scale(state.scale, state.scale);

    ctx.lineWidth = 1 / state.scale;
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.22)';
    for (const e of state.edges) {
      const a = state.byId.get(e.a);
      const b = state.byId.get(e.b);
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    for (const n of state.nodes) {
      ctx.beginPath();
      ctx.fillStyle = n.type === 'note' ? 'rgba(37, 99, 235, 0.14)' : 'rgba(245, 158, 11, 0.14)';
      ctx.strokeStyle = n.type === 'note' ? 'rgba(37, 99, 235, 0.60)' : 'rgba(245, 158, 11, 0.55)';
      ctx.lineWidth = 1.6 / state.scale;
      ctx.arc(n.x, n.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  function loop() {
    tick();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
});
