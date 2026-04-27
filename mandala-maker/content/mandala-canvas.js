'use strict';
/* =========================================================
   Mandala Artist v2 — canvas page
   Keeps existing Fabric.js drawing logic, adds:
   • Layers  • Undo/Redo (Ctrl+Z/Shift+Z)
   • SVG / JSON export  • Save / Load artworks
   • Opacity control  • Color palette  • Recent colors
   • Auto-save  • Zoom & Pan  • Dark mode
   • Guide-line toggle  • Debounced inputs
========================================================= */

const AUTOSAVE_INTERVAL = 8000; // ms

// ─── Small utilities ────────────────────────────────────
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function throttle(fn, ms) {
  let last = 0;
  return (...args) => { const now = Date.now(); if (now - last >= ms) { last = now; fn(...args); } };
}

function $ (id) { return document.getElementById(id); }

// ─── Layer Manager ──────────────────────────────────────
class LayerManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.layers = [{ id: 'layer_0', name: 'Layer 1', visible: true, objects: [] }];
    this.activeLayerId = 'layer_0';
    this._nextId = 1;
  }

  get active() { return this.layers.find(l => l.id === this.activeLayerId) || this.layers[0]; }

  addLayer() {
    const id = 'layer_' + this._nextId++;
    const name = 'Layer ' + this._nextId;
    this.layers.push({ id, name, visible: true, objects: [] });
    this.activeLayerId = id;
    return id;
  }

  setActive(id) { if (this.layers.find(l => l.id === id)) this.activeLayerId = id; }

  toggleVisibility(id) {
    const layer = this.layers.find(l => l.id === id);
    if (!layer) return;
    layer.visible = !layer.visible;
    layer.objects.forEach(obj => { obj.visible = layer.visible; });
    this.canvas.requestRenderAll();
  }

  deleteLayer(id) {
    const layer = this.layers.find(l => l.id === id);
    if (!layer || this.layers.length <= 1) return;
    layer.objects.forEach(obj => this.canvas.remove(obj));
    this.layers = this.layers.filter(l => l.id !== id);
    if (this.activeLayerId === id) this.activeLayerId = this.layers[this.layers.length - 1].id;
    this.canvas.requestRenderAll();
  }

  addObject(obj) {
    const layer = this.active;
    if (layer) layer.objects.push(obj);
  }

  // Remove object from all layer object arrays (canvas removal is separate)
  removeObject(obj) {
    this.layers.forEach(l => { l.objects = l.objects.filter(o => o !== obj); });
  }
}

// ─── Main Application ────────────────────────────────────
class MandalaArtist {
  constructor() {
    this.canvas = null;
    this.isDrawing = false;
    this.symmetry = 6;
    this.centerX = 0.5;
    this.centerY = 0.5;
    this.brushSize = 10;
    this.brushColor = '#2563EB';
    this.brushOpacity = 1;
    this.brushType = 'round';
    this.shadowEnabled = false;
    this.shadowBlur = 10;
    this.shadowColor = '#000000';
    this.mirrorEnabled = true;
    this.showGuides = true;
    this.randomColors = false;
    this.pendingCenterSelection = false;
    this.zoomLevel = 1;
    this.darkMode = false;

    // Undo/redo
    this.history = [];
    this.historyIndex = -1;
    this.MAX_HISTORY = 40;

    // Color memory
    this.recentColors = [];
    this.palette = [];

    // Pattern selection
    this.selectedPattern = '';

    // Auto-save timer
    this._autosaveTimer = null;
    this._autosaveDirty = false;

    // Layers
    this.layerManager = null;

    this.init();
  }

  /* ── Init ───────────────────────────────────────────── */
  async init() {
    this.setupCanvas();
    this.layerManager = new LayerManager(this.canvas);
    this.setupEventListeners();
    this.setupKeyboard();
    await this.loadSettings();
    this.drawSymmetryLines();
    this.renderLayerList();
    await this.loadArtworkList();
    this.generatePalette();
    this.startAutosave();
  }

  /* ── Canvas setup ───────────────────────────────────── */
  setupCanvas() {
    this.canvas = new fabric.Canvas('mandalaCanvas', {
      isDrawingMode: true,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      enableRetinaScaling: true,
      renderOnAddRemove: false
    });

    this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
    this.canvas.freeDrawingBrush.width = this.brushSize;
    this.canvas.freeDrawingBrush.color = this.brushColor;

    this.updateCanvasSize();
    const resizeObserver = new ResizeObserver(debounce(() => this.updateCanvasSize(), 120));
    const wrapper = document.querySelector('.canvas-wrapper');
    if (wrapper) resizeObserver.observe(wrapper);
  }

  updateCanvasSize() {
    const wrapper = document.querySelector('.canvas-wrapper');
    if (!wrapper) return;
    const w = Math.max(400, wrapper.clientWidth - 32);
    const h = Math.max(300, wrapper.clientHeight - 32);

    const container = $('canvasContainer');
    if (container) {
      container.style.width = `${w}px`;
      container.style.height = `${h}px`;
      container.style.margin = '0 auto';
    }

    this.canvas.setWidth(w);
    this.canvas.setHeight(h);
    // Keep viewport centered to avoid top/left clipping after resize.
    const currentZoom = this.canvas.getZoom ? this.canvas.getZoom() : this.zoomLevel;
    this.zoomLevel = Math.max(0.1, Math.min(8, currentZoom || 1));
    const tx = (w - w * this.zoomLevel) / 2;
    const ty = (h - h * this.zoomLevel) / 2;
    this.canvas.setViewportTransform([this.zoomLevel, 0, 0, this.zoomLevel, tx, ty]);
    $('zoomLevel').textContent = Math.round(this.zoomLevel * 100) + '%';

    this.canvas.calcOffset();
    this.canvas.requestRenderAll();
    this.drawSymmetryLines();
    this.updateCenterIndicator();
  }

  /* ── Event listeners ────────────────────────────────── */
  setupEventListeners() {
    // Brush
    $('brushSizeRange').addEventListener('input', debounce((e) => {
      this.brushSize = parseInt(e.target.value);
      this.canvas.freeDrawingBrush.width = this.brushSize;
      $('brushSizeValue').textContent = this.brushSize;
      this.saveSettings();
    }, 60));

    $('brushOpacity').addEventListener('input', debounce((e) => {
      this.brushOpacity = parseInt(e.target.value) / 100;
      $('brushOpacityValue').textContent = e.target.value + '%';
      this.applyBrushSettings();
      this.saveSettings();
    }, 60));

    $('brushColorPicker').addEventListener('input', (e) => {
      this.setBrushColor(e.target.value);
    });

    $('brushType').addEventListener('change', (e) => {
      this.brushType = e.target.value;
      this.setBrushType(e.target.value);
      this.saveSettings();
    });

    $('backgroundColor').addEventListener('input', (e) => {
      this.canvas.backgroundColor = e.target.value;
      this.canvas.requestRenderAll();
      this.saveSettings();
    });

    // Background presets
    document.querySelectorAll('#bgPresets .preset-dot').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = btn.dataset.color;
        this.canvas.backgroundColor = c;
        $('backgroundColor').value = c;
        this.canvas.requestRenderAll();
        this.saveSettings();
      });
    });

    // Symmetry
    $('symmetryRange').addEventListener('input', debounce((e) => {
      this.symmetry = parseInt(e.target.value);
      $('symmetryValue').textContent = this.symmetry;
      this.drawSymmetryLines();
      this.saveSettings();
    }, 80));

    $('enableMirroring').addEventListener('change', (e) => {
      this.mirrorEnabled = e.target.checked;
      this.saveSettings();
    });

    $('showGuides').addEventListener('change', (e) => {
      this.showGuides = e.target.checked;
      this.drawSymmetryLines();
      this.saveSettings();
    });

    $('centerX').addEventListener('input', debounce((e) => {
      this.centerX = parseInt(e.target.value) / 100;
      $('centerXValue').textContent = e.target.value;
      this.updateCenterIndicator();
      this.drawSymmetryLines();
      this.saveSettings();
    }, 80));

    $('centerY').addEventListener('input', debounce((e) => {
      this.centerY = parseInt(e.target.value) / 100;
      $('centerYValue').textContent = e.target.value;
      this.updateCenterIndicator();
      this.drawSymmetryLines();
      this.saveSettings();
    }, 80));

    $('centerAtTouch').addEventListener('click', () => this.enableCenterAtTouch());

    // Shadow
    $('enableShadows').addEventListener('change', (e) => {
      this.shadowEnabled = e.target.checked;
      this.setHidden('shadowControls', !e.target.checked);
      this.applyBrushSettings();
      this.saveSettings();
    });
    this.setHidden('shadowControls', !this.shadowEnabled);

    $('shadowColor').addEventListener('input', (e) => {
      this.shadowColor = e.target.value;
      this.applyBrushSettings();
      this.saveSettings();
    });

    $('shadowBlur').addEventListener('input', debounce((e) => {
      this.shadowBlur = parseInt(e.target.value);
      $('shadowBlurValue').textContent = this.shadowBlur;
      this.applyBrushSettings();
      this.saveSettings();
    }, 60));

    $('randomShadow').addEventListener('click', () => this.setRandomShadow());

    // Colors
    $('randomColor').addEventListener('click', () => this.setRandomBrushColor());
    $('randomColors').addEventListener('change', (e) => {
      this.randomColors = e.target.checked;
      this.saveSettings();
    });
    $('genPalette').addEventListener('click', () => this.generatePalette());

    // Patterns
    document.querySelectorAll('#patternsGrid .pattern-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.selectedPattern = e.currentTarget.dataset.pattern;
      });
    });
    $('applyPattern').addEventListener('click', () => {
      if (this.selectedPattern) this.applyPredefinedPattern(this.selectedPattern);
    });

    // Actions
    $('clearBtn').addEventListener('click', () => this.clearCanvas());
    $('undoBtn').addEventListener('click', () => this.undo());
    $('redoBtn').addEventListener('click', () => this.redo());
    $('saveArtworkBtn').addEventListener('click', () => this.showSaveModal());

    // Export
    $('exportPNG').addEventListener('click', () => this.exportPNG());
    $('exportSVG').addEventListener('click', () => this.exportSVG());
    $('exportJSON').addEventListener('click', () => this.exportJSON());

    // Zoom
    $('zoomIn').addEventListener('click', () => this.zoom(1.25));
    $('zoomOut').addEventListener('click', () => this.zoom(0.8));
    $('resetZoom').addEventListener('click', () => this.resetZoom());

    // Theme
    $('themeToggle').addEventListener('click', () => this.toggleDarkMode());

    // Sidebar toggle
    $('toggleSidebar').addEventListener('click', () => {
      $('sidebar').classList.toggle('collapsed');
    });

    // Save modal
    $('cancelSave').addEventListener('click', () => this.setHidden('saveModal', true));
    $('confirmSave').addEventListener('click', () => this.confirmSaveArtwork());

    // Layers
    $('addLayer').addEventListener('click', () => {
      this.layerManager.addLayer();
      this.renderLayerList();
    });

    // Canvas events
    this.canvas.on('mouse:down', (e) => {
      if (!this.pendingCenterSelection) return;
      const p = this.canvas.getPointer(e.e);
      this.centerX = p.x / this.canvas.width;
      this.centerY = p.y / this.canvas.height;
      $('centerX').value = Math.round(this.centerX * 100);
      $('centerY').value = Math.round(this.centerY * 100);
      $('centerXValue').textContent = $('centerX').value;
      $('centerYValue').textContent = $('centerY').value;
      this.pendingCenterSelection = false;
      document.body.classList.remove('pick-center-mode');
      $('canvasHint').textContent = 'Draw on one segment — symmetry mirrors the rest automatically.';
      this.updateCenterIndicator();
      this.drawSymmetryLines();
      this.saveSettings();
    });

    this.canvas.on('path:created', (e) => {
      this.handleDrawing(e.path);
      this.saveHistory();
      this._autosaveDirty = true;
    });
  }

  /* ── Keyboard shortcuts ─────────────────────────────── */
  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) { e.preventDefault(); this.redo(); }
        else { e.preventDefault(); this.undo(); }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); this.showSaveModal();
      }
    });
  }

  /* ── Drawing / symmetry ─────────────────────────────── */
  handleDrawing(path) {
    this.addRecentColor(this.brushColor);
    this.applyPathStyle(path);
    this.layerManager.addObject(path);

    if (!this.mirrorEnabled) { this.canvas.requestRenderAll(); return; }

    const cw = this.centerX * this.canvas.width;
    const ch = this.centerY * this.canvas.height;
    const angleStep = 360 / this.symmetry;
    const origCenter = path.getCenterPoint();

    for (let i = 1; i < this.symmetry; i++) {
      const rotRad = fabric.util.degreesToRadians(angleStep * i);
      const rotatedCenter = fabric.util.rotatePoint(
        new fabric.Point(origCenter.x, origCenter.y),
        new fabric.Point(cw, ch), rotRad
      );

      const strokeColor = this.randomColors ? this.getRandomColor() : path.stroke;

      const mirrored = new fabric.Path(path.path, {
        fill: '',
        stroke: strokeColor,
        strokeWidth: path.strokeWidth,
        strokeLineCap: path.strokeLineCap,
        strokeLineJoin: path.strokeLineJoin,
        selectable: false,
        evented: false,
        opacity: path.opacity
      });

      mirrored.rotate((path.angle || 0) + angleStep * i);
      mirrored.setPositionByOrigin(rotatedCenter, 'center', 'center');
      this.applyPathStyle(mirrored);
      this.canvas.add(mirrored);
      this.layerManager.addObject(mirrored);
    }

    this.canvas.requestRenderAll();
  }

  /* ── Symmetry guide lines ───────────────────────────── */
  drawSymmetryLines() {
    this.canvas.getObjects().forEach(obj => { if (obj.isGuide) this.canvas.remove(obj); });

    if (!this.showGuides) { this.canvas.requestRenderAll(); return; }

    const cw = this.centerX * this.canvas.width;
    const ch = this.centerY * this.canvas.height;
    const radius = Math.min(this.canvas.width, this.canvas.height) * 0.45;
    const angleStep = (2 * Math.PI) / this.symmetry;

    for (let i = 0; i < this.symmetry; i++) {
      const angle = angleStep * i;
      const line = new fabric.Line([cw, ch, cw + radius * Math.cos(angle), ch + radius * Math.sin(angle)], {
        stroke: 'rgba(37,99,235,0.2)', strokeWidth: 1,
        selectable: false, evented: false, isGuide: true, excludeFromExport: true,
        strokeDashArray: [4, 4]
      });
      this.canvas.add(line);
      this.canvas.sendToBack(line);
    }

    // Center dot
    const dot = new fabric.Circle({
      left: cw - 4, top: ch - 4, radius: 4,
      fill: 'rgba(37,99,235,0.4)', stroke: '#2563EB', strokeWidth: 1.5,
      selectable: false, evented: false, isGuide: true, excludeFromExport: true
    });
    this.canvas.add(dot);
    this.canvas.sendToBack(dot);
    this.canvas.requestRenderAll();
  }

  updateCenterIndicator() {
    const ind = $('centerIndicator');
    if (ind) {
      ind.style.left = `${this.centerX * 100}%`;
      ind.style.top = `${this.centerY * 100}%`;
    }
  }

  enableCenterAtTouch() {
    this.pendingCenterSelection = true;
    document.body.classList.add('pick-center-mode');
    $('canvasHint').textContent = 'Click on the canvas to place the symmetry center.';
  }

  /* ── Brush ──────────────────────────────────────────── */
  setBrushType(type) {
    switch (type) {
      case 'spray':
        this.canvas.freeDrawingBrush = new fabric.SprayBrush(this.canvas);
        break;
      default:
        this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
        break;
    }
    this.applyBrushSettings();
  }

  applyBrushSettings() {
    if (!this.canvas || !this.canvas.freeDrawingBrush) return;
    const colorWithOpacity = this.hexToRgba(this.brushColor, this.brushOpacity);
    this.canvas.freeDrawingBrush.width = this.brushSize;
    this.canvas.freeDrawingBrush.color = colorWithOpacity;
    if (this.shadowEnabled) {
      this.canvas.freeDrawingBrush.shadow = new fabric.Shadow({
        color: this.shadowColor, blur: this.shadowBlur, offsetX: 0, offsetY: 0
      });
    } else {
      this.canvas.freeDrawingBrush.shadow = null;
    }
  }

  applyPathStyle(path) {
    if (!path) return;
    path.set({ selectable: false, evented: false });
    if (this.shadowEnabled) {
      path.set({ shadow: new fabric.Shadow({ color: this.shadowColor, blur: this.shadowBlur, offsetX: 0, offsetY: 0 }) });
    }
  }

  setBrushColor(color) {
    this.brushColor = color;
    this.applyBrushSettings();
    this.saveSettings();
  }

  setRandomBrushColor() {
    const colors = MathHelpers.generatePalette();
    const c = colors[Math.floor(Math.random() * colors.length)];
    this.brushColor = this.hslToHex(c);
    $('brushColorPicker').value = this.brushColor;
    this.applyBrushSettings();
  }

  setRandomShadow() {
    const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#6C63FF'];
    this.shadowColor = colors[Math.floor(Math.random() * colors.length)];
    this.shadowBlur = Math.floor(Math.random() * 30) + 5;
    $('shadowColor').value = this.shadowColor;
    $('shadowBlur').value = this.shadowBlur;
    $('shadowBlurValue').textContent = this.shadowBlur;
    this.applyBrushSettings();
  }

  getRandomColor() {
    const palette = this.palette.length ? this.palette : ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4'];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  /* ── Color utilities ────────────────────────────────── */
  hexToRgba(hex, alpha) {
    if (!hex || hex.length < 7) return hex;
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  hslToHex(hsl) {
    const el = document.createElement('div');
    el.style.color = hsl;
    document.body.appendChild(el);
    const c = getComputedStyle(el).color;
    document.body.removeChild(el);
    const m = c.match(/\d+/g);
    if (!m) return '#000000';
    return '#' + [m[0],m[1],m[2]].map(v => parseInt(v).toString(16).padStart(2,'0')).join('');
  }

  generatePalette() {
    this.palette = MathHelpers.generatePalette().map(h => {
      const el = document.createElement('div');
      el.style.color = h;
      document.body.appendChild(el);
      const c = getComputedStyle(el).color;
      document.body.removeChild(el);
      const m = c.match(/\d+/g);
      return '#' + [m[0],m[1],m[2]].map(v => parseInt(v).toString(16).padStart(2,'0')).join('');
    });
    this.renderPalette();
  }

  renderPalette() {
    const el = $('colorPalette');
    if (!el) return;
    el.innerHTML = '';
    this.palette.forEach(color => {
      const chip = document.createElement('button');
      chip.className = 'palette-chip';
      chip.style.background = color;
      chip.title = color;
      chip.addEventListener('click', () => { this.setBrushColor(color); $('brushColorPicker').value = color; });
      el.appendChild(chip);
    });
  }

  addRecentColor(color) {
    this.recentColors = [color, ...this.recentColors.filter(c => c !== color)].slice(0, 8);
    this.renderRecentColors();
  }

  renderRecentColors() {
    const el = $('recentColors');
    if (!el) return;
    el.innerHTML = '';
    this.recentColors.forEach(color => {
      const chip = document.createElement('button');
      chip.className = 'palette-chip';
      chip.style.background = color;
      chip.title = color;
      chip.addEventListener('click', () => { this.setBrushColor(color); $('brushColorPicker').value = color; });
      el.appendChild(chip);
    });
  }

  /* ── Undo / Redo ────────────────────────────────────── */
  saveHistory() {
    const json = this.canvas.toJSON(['isGuide', 'excludeFromExport', 'opacity']);
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(json);
    if (this.history.length > this.MAX_HISTORY) this.history.shift();
    else this.historyIndex++;
    this.updateUndoRedoState();
  }

  undo() {
    if (this.historyIndex <= 0) return;
    this.historyIndex--;
    this._restoreHistory();
  }

  redo() {
    if (this.historyIndex >= this.history.length - 1) return;
    this.historyIndex++;
    this._restoreHistory();
  }

  _restoreHistory() {
    const state = this.history[this.historyIndex];
    if (!state) return;
    this.canvas.loadFromJSON(state, () => {
      this.canvas.backgroundColor = $('backgroundColor').value;
      this.canvas.requestRenderAll();
      this.drawSymmetryLines();
    });
    this.updateUndoRedoState();
  }

  updateUndoRedoState() {
    $('undoBtn').style.opacity = this.historyIndex <= 0 ? '.4' : '1';
    $('redoBtn').style.opacity = this.historyIndex >= this.history.length - 1 ? '.4' : '1';
  }

  /* ── Clear ──────────────────────────────────────────── */
  clearCanvas() {
    if (!confirm('Clear the canvas? This cannot be undone beyond your history.')) return;
    this.canvas.clear();
    this.canvas.backgroundColor = $('backgroundColor').value;
    this.layerManager.layers.forEach(l => { l.objects = []; });
    this.drawSymmetryLines();
    this.saveHistory();
    this._autosaveDirty = true;
  }

  /* ── Zoom ───────────────────────────────────────────── */
  zoom(factor) {
    this.zoomLevel = Math.max(0.1, Math.min(8, this.zoomLevel * factor));
    this.canvas.zoomToPoint({ x: this.canvas.width / 2, y: this.canvas.height / 2 }, this.zoomLevel);
    $('zoomLevel').textContent = Math.round(this.zoomLevel * 100) + '%';
  }

  resetZoom() {
    this.zoomLevel = 1;
    this.canvas.setViewportTransform([1,0,0,1,0,0]);
    $('zoomLevel').textContent = '100%';
  }

  /* ── Patterns ───────────────────────────────────────── */
  applyPredefinedPattern(name) {
    const cw = this.centerX * this.canvas.width;
    const ch = this.centerY * this.canvas.height;
    const radius = Math.min(this.canvas.width, this.canvas.height) * 0.3;
    switch (name) {
      case 'radial':    this.drawRadialPattern(cw, ch, radius); break;
      case 'circular':  this.drawCircularPattern(cw, ch, radius); break;
      case 'flower':    this.drawFlowerPattern(cw, ch, radius); break;
      case 'spiral':    this.drawSpiralPattern(cw, ch, radius); break;
      case 'geometric': this.drawGeometricPattern(cw, ch, radius); break;
      case 'mandala':   this.drawMandalaPattern(cw, ch, radius); break;
    }
    this.canvas.requestRenderAll();
    this.saveHistory();
    this._autosaveDirty = true;
  }

  _makeShadow() {
    if (!this.shadowEnabled) return null;
    return new fabric.Shadow({ color: this.shadowColor, blur: this.shadowBlur, offsetX: 0, offsetY: 0 });
  }

  drawRadialPattern(cx, cy, radius) {
    const pts = 12;
    for (let i = 0; i < pts; i++) {
      const a = (2 * Math.PI / pts) * i;
      const line = new fabric.Line([cx, cy, cx + radius * Math.cos(a), cy + radius * Math.sin(a)], {
        stroke: this.brushColor, strokeWidth: Math.max(1, this.brushSize / 2),
        selectable: false, shadow: this._makeShadow()
      });
      this.canvas.add(line);
    }
  }

  drawCircularPattern(cx, cy, radius) {
    for (let i = 1; i <= 5; i++) {
      const r = (radius / 5) * i;
      const circle = new fabric.Circle({
        left: cx - r, top: cy - r, radius: r,
        stroke: this.brushColor, strokeWidth: Math.max(1, this.brushSize / 3),
        fill: 'transparent', selectable: false, shadow: this._makeShadow()
      });
      this.canvas.add(circle);
    }
  }

  drawFlowerPattern(cx, cy, radius) {
    const petals = 8;
    for (let i = 0; i < petals; i++) {
      const a = (2 * Math.PI / petals) * i;
      const petal = new fabric.Ellipse({
        left: cx + radius * 0.5 * Math.cos(a) - 20,
        top: cy + radius * 0.5 * Math.sin(a) - 40,
        rx: 20, ry: 40,
        angle: (a * 180) / Math.PI,
        stroke: this.brushColor, strokeWidth: Math.max(1, this.brushSize / 3),
        fill: 'transparent', selectable: false, shadow: this._makeShadow()
      });
      this.canvas.add(petal);
    }
  }

  drawSpiralPattern(cx, cy, radius) {
    const points = [];
    for (let i = 0; i <= 150; i++) {
      const t = i / 150;
      const angle = t * Math.PI * 2 * 3;
      const r = radius * t;
      points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    }
    const polyline = new fabric.Polyline(points, {
      stroke: this.brushColor, strokeWidth: Math.max(1, this.brushSize / 2),
      fill: 'transparent', selectable: false, shadow: this._makeShadow()
    });
    this.canvas.add(polyline);
  }

  drawGeometricPattern(cx, cy, radius) {
    const shapes = 6;
    for (let i = 0; i < shapes; i++) {
      const a = (2 * Math.PI / shapes) * i;
      const x = cx + radius * Math.cos(a);
      const y = cy + radius * Math.sin(a);
      const hex = new fabric.Polygon([
        {x, y: y-30}, {x:x+26, y:y-15}, {x:x+26, y:y+15},
        {x, y:y+30}, {x:x-26, y:y+15}, {x:x-26, y:y-15}
      ], {
        stroke: this.brushColor, strokeWidth: Math.max(1, this.brushSize / 3),
        fill: 'transparent', selectable: false,
        angle: (a * 180) / Math.PI, shadow: this._makeShadow()
      });
      this.canvas.add(hex);
    }
  }

  drawMandalaPattern(cx, cy, radius) {
    this.drawCircularPattern(cx, cy, radius);
    this.drawRadialPattern(cx, cy, radius * 0.8);
    this.drawFlowerPattern(cx, cy, radius * 0.6);
  }

  /* ── Layers UI ──────────────────────────────────────── */
  renderLayerList() {
    const list = $('layerList');
    if (!list) return;
    list.innerHTML = '';
    [...this.layerManager.layers].reverse().forEach(layer => {
      const item = document.createElement('div');
      item.className = 'layer-item' + (layer.id === this.layerManager.activeLayerId ? ' active' : '');
      item.dataset.id = layer.id;

      const name = document.createElement('span');
      name.className = 'layer-name';
      name.textContent = layer.name;

      const vis = document.createElement('button');
      vis.className = 'layer-vis';
      vis.title = layer.visible ? 'Hide layer' : 'Show layer';
      vis.innerHTML = layer.visible
        ? '<svg viewBox="0 0 14 14" fill="none"><path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" stroke-width="1.2"/><circle cx="7" cy="7" r="1.8" fill="currentColor"/></svg>'
        : '<svg viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M5.5 5.8A3 3 0 009 9.5M1 7s2.5-4 6-4c1 0 2 .2 2.8.6M13 7s-.8 1.5-2.5 2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';

      const del = document.createElement('button');
      del.className = 'layer-del';
      del.title = 'Delete layer';
      del.innerHTML = '<svg viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V3h4v1M6 6v4M8 6v4M3 4l1 7h6l1-7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      item.addEventListener('click', () => {
        this.layerManager.setActive(layer.id);
        this.renderLayerList();
      });
      vis.addEventListener('click', (e) => {
        e.stopPropagation();
        this.layerManager.toggleVisibility(layer.id);
        this.renderLayerList();
      });
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.layerManager.layers.length <= 1) return;
        this.layerManager.deleteLayer(layer.id);
        this.renderLayerList();
        this.saveHistory();
      });

      item.append(name, vis, del);
      list.appendChild(item);
    });
  }

  /* ── Save / Load artworks ───────────────────────────── */
  showSaveModal() {
    $('artworkName').value = '';
    this.setHidden('saveModal', false);
    $('artworkName').focus();
  }

  async confirmSaveArtwork() {
    const name = $('artworkName').value.trim() || 'Untitled Mandala';
    this.setHidden('saveModal', true);
    const canvasJSON = JSON.stringify(this.canvas.toJSON(['isGuide', 'excludeFromExport', 'opacity']));

    // Generate thumbnail (filter out guides)
    const thumbnail = this.canvas.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.25 });
    await StorageService.saveArtwork(name, canvasJSON, thumbnail);
    this.loadArtworkList();
    this.flashAutosave('Saved!');
  }

  async loadArtworkList() {
    const artworks = await StorageService.loadArtworks();
    const list = $('artworkList');
    if (!list) return;
    list.innerHTML = '';
    if (!artworks.length) {
      list.innerHTML = '<p class="empty-msg">No saved artworks yet.</p>';
      return;
    }
    artworks.forEach(art => {
      const item = document.createElement('div');
      item.className = 'artwork-item';

      const thumb = document.createElement('img');
      thumb.className = 'artwork-thumb';
      thumb.src = art.thumbnail || '';
      thumb.alt = art.name;

      const info = document.createElement('div');
      info.className = 'artwork-info';
      const nameEl = document.createElement('div');
      nameEl.className = 'artwork-name';
      nameEl.textContent = art.name;
      const dateEl = document.createElement('div');
      dateEl.className = 'artwork-date';
      dateEl.textContent = new Date(art.createdAt).toLocaleDateString();
      info.append(nameEl, dateEl);

      const del = document.createElement('button');
      del.className = 'artwork-del';
      del.title = 'Delete';
      del.innerHTML = '<svg viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V3h4v1M3 4l1 7h6l1-7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      item.addEventListener('click', () => this.loadArtwork(art));
      del.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Delete this artwork?')) return;
        await StorageService.deleteArtwork(art.id);
        this.loadArtworkList();
      });

      item.append(thumb, info, del);
      list.appendChild(item);
    });
  }

  loadArtwork(art) {
    if (!confirm('Load this artwork? Current canvas will be replaced.')) return;
    this.canvas.loadFromJSON(JSON.parse(art.canvasJSON), () => {
      this.canvas.requestRenderAll();
      this.drawSymmetryLines();
      this.saveHistory();
    });
  }

  /* ── Export ─────────────────────────────────────────── */
  exportPNG() {
    const guides = this.canvas.getObjects().filter(o => o.isGuide);
    guides.forEach(g => { g.visible = false; });
    this.canvas.requestRenderAll();

    const url = this.canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });

    guides.forEach(g => { g.visible = true; });
    this.canvas.requestRenderAll();

    this._download(url, 'mandala-art.png');
  }

  exportSVG() {
    // Temporarily hide guides
    const guides = this.canvas.getObjects().filter(o => o.isGuide);
    guides.forEach(g => { g.visible = false; });
    const svg = this.canvas.toSVG();
    guides.forEach(g => { g.visible = true; });
    this.canvas.requestRenderAll();

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    this._download(url, 'mandala-art.svg');
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  exportJSON() {
    const json = JSON.stringify(this.canvas.toJSON(['isGuide', 'excludeFromExport', 'opacity']), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    this._download(url, 'mandala-art.json');
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  _download(url, filename) {
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
  }

  /* ── Auto-save ──────────────────────────────────────── */
  startAutosave() {
    this._autosaveTimer = setInterval(() => {
      if (!this._autosaveDirty) return;
      const json = JSON.stringify(this.canvas.toJSON(['isGuide', 'excludeFromExport']));
      StorageService.saveAutosave(json);
      this._autosaveDirty = false;
      this.flashAutosave();
    }, AUTOSAVE_INTERVAL);
  }

  flashAutosave(msg = 'Auto-saved') {
    const ind = $('autosaveIndicator');
    if (!ind) return;
    const label = ind.querySelector('span');
    if (label) label.textContent = msg;
    ind.classList.add('show');
    clearTimeout(this._autosaveFlash);
    this._autosaveFlash = setTimeout(() => ind.classList.remove('show'), 2500);
  }

  /* ── Settings ───────────────────────────────────────── */
  async loadSettings() {
    const s = await StorageService.loadSettings();
    this.symmetry = s.symmetry;
    this.brushSize = s.brushSize;
    this.brushColor = s.brushColor;
    this.brushOpacity = s.brushOpacity;
    this.brushType = s.brushType;
    this.shadowEnabled = s.shadowEnabled;
    this.shadowBlur = s.shadowBlur;
    this.shadowColor = s.shadowColor;
    this.centerX = s.centerX;
    this.centerY = s.centerY;
    this.mirrorEnabled = s.mirrorEnabled;
    this.randomColors = s.randomColors;
    this.showGuides = s.showGuides;
    this.darkMode = s.darkMode;

    // Apply to UI
    $('symmetryRange').value = this.symmetry;
    $('symmetryValue').textContent = this.symmetry;
    $('brushSizeRange').value = this.brushSize;
    $('brushSizeValue').textContent = this.brushSize;
    $('brushColorPicker').value = this.brushColor;
    $('brushOpacity').value = Math.round(this.brushOpacity * 100);
    $('brushOpacityValue').textContent = Math.round(this.brushOpacity * 100) + '%';
    $('brushType').value = this.brushType;
    $('enableShadows').checked = this.shadowEnabled;
    this.setHidden('shadowControls', !this.shadowEnabled);
    $('shadowColor').value = this.shadowColor;
    $('shadowBlur').value = this.shadowBlur;
    $('shadowBlurValue').textContent = this.shadowBlur;
    $('centerX').value = Math.round(this.centerX * 100);
    $('centerXValue').textContent = Math.round(this.centerX * 100);
    $('centerY').value = Math.round(this.centerY * 100);
    $('centerYValue').textContent = Math.round(this.centerY * 100);
    $('enableMirroring').checked = this.mirrorEnabled;
    $('randomColors').checked = this.randomColors;
    $('showGuides').checked = this.showGuides;
    if (window.MMDropdowns && typeof window.MMDropdowns.sync === 'function') {
      window.MMDropdowns.sync('brushType');
    }

    if (this.darkMode) document.documentElement.classList.add('dark');

    this.setBrushType(this.brushType);
    this.applyBrushSettings();
    this.updateCenterIndicator();
    this.saveHistory();

    // Try loading auto-saved state
    const autosave = await StorageService.loadAutosave();
    if (autosave && autosave.json) {
      try {
        this.canvas.loadFromJSON(JSON.parse(autosave.json), () => {
          this.canvas.requestRenderAll();
          this.drawSymmetryLines();
        });
      } catch (e) { /* ignore corrupt autosave */ }
    }
  }

  saveSettings() {
    StorageService.saveSettings({
      symmetry: this.symmetry,
      brushSize: this.brushSize,
      brushColor: this.brushColor,
      brushOpacity: this.brushOpacity,
      brushType: this.brushType,
      backgroundColor: this.canvas ? this.canvas.backgroundColor : '#ffffff',
      shadowEnabled: this.shadowEnabled,
      shadowColor: this.shadowColor,
      shadowBlur: this.shadowBlur,
      centerX: this.centerX,
      centerY: this.centerY,
      mirrorEnabled: this.mirrorEnabled,
      randomColors: this.randomColors,
      showGuides: this.showGuides,
      darkMode: this.darkMode
    });
  }

  /* ── Dark mode ──────────────────────────────────────── */
  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    document.documentElement.classList.toggle('dark', this.darkMode);
    this.saveSettings();
  }

  setHidden(id, hidden) {
    const el = $(id);
    if (!el) return;
    el.classList.toggle('is-hidden', hidden);
  }
}

/* ── Bootstrap ─────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const app = new MandalaArtist();

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'applyPattern') app.applyPredefinedPattern(request.pattern);
  });
});
