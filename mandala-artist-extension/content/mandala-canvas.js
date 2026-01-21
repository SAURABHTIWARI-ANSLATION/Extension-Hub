class MandalaArtist {
  constructor() {
    this.canvas = null;
    this.isDrawing = false;
    this.symmetry = 6;
    this.centerX = 0.5;
    this.centerY = 0.5;
    this.brushSize = 10;
    this.brushColor = '#ff6b6b';
    this.shadowEnabled = true;
    this.shadowBlur = 10;
    this.shadowColor = 'rgba(0,0,0,0.3)';
    this.mirrorEnabled = true;
    this.zoomLevel = 1;
    this.history = [];
    this.historyIndex = -1;
    
    this.init();
  }
  
  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.loadSettings();
    this.drawSymmetryLines();
  }
  
  setupCanvas() {
    this.canvas = new fabric.Canvas('mandalaCanvas', {
      isDrawingMode: true,
      backgroundColor: '#ffffff'
    });
    
    this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
    this.canvas.freeDrawingBrush.width = this.brushSize;
    this.canvas.freeDrawingBrush.color = this.brushColor;
    
    // Adjust canvas size
    this.updateCanvasSize();
    window.addEventListener('resize', () => this.updateCanvasSize());
  }
  
  updateCanvasSize() {
    const container = document.querySelector('.canvas-container');
    this.canvas.setWidth(container.clientWidth);
    this.canvas.setHeight(container.clientHeight);
    this.canvas.renderAll();
    this.drawSymmetryLines();
  }
  
  setupEventListeners() {
    // Brush controls
    document.getElementById('brushSizeRange').addEventListener('input', (e) => {
      this.brushSize = parseInt(e.target.value);
      this.canvas.freeDrawingBrush.width = this.brushSize;
      document.getElementById('brushSizeValue').textContent = this.brushSize;
      this.saveSettings();
    });
    
    document.getElementById('brushColorPicker').addEventListener('change', (e) => {
      this.brushColor = e.target.value;
      this.canvas.freeDrawingBrush.color = this.brushColor;
      this.saveSettings();
    });
    
    document.getElementById('brushType').addEventListener('change', (e) => {
      this.setBrushType(e.target.value);
      this.saveSettings();
    });
    
    // Symmetry controls
    document.getElementById('symmetryRange').addEventListener('input', (e) => {
      this.symmetry = parseInt(e.target.value);
      document.getElementById('symmetryValue').textContent = this.symmetry;
      this.drawSymmetryLines();
      this.saveSettings();
    });
    
    // Center controls
    document.getElementById('centerX').addEventListener('input', (e) => {
      this.centerX = parseInt(e.target.value) / 100;
      this.updateCenterIndicator();
      this.drawSymmetryLines();
      this.saveSettings();
    });
    
    document.getElementById('centerY').addEventListener('input', (e) => {
      this.centerY = parseInt(e.target.value) / 100;
      this.updateCenterIndicator();
      this.drawSymmetryLines();
      this.saveSettings();
    });
    
    document.getElementById('centerAtTouch').addEventListener('click', () => {
      this.enableCenterAtTouch();
    });
    
    // Shadow controls
    document.getElementById('enableShadows').addEventListener('change', (e) => {
      this.shadowEnabled = e.target.checked;
      this.updateShadowSettings();
      this.saveSettings();
    });
    
    document.getElementById('shadowColor').addEventListener('change', (e) => {
      this.shadowColor = e.target.value;
      this.updateShadowSettings();
      this.saveSettings();
    });
    
    document.getElementById('shadowBlur').addEventListener('input', (e) => {
      this.shadowBlur = parseInt(e.target.value);
      document.getElementById('shadowBlurValue').textContent = this.shadowBlur;
      this.updateShadowSettings();
      this.saveSettings();
    });
    
    document.getElementById('randomShadow').addEventListener('click', () => {
      this.setRandomShadow();
    });
    
    // Pattern controls
    document.querySelectorAll('.pattern-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.selectedPattern = e.target.dataset.pattern;
      });
    });
    
    document.getElementById('applyPattern').addEventListener('click', () => {
      if (this.selectedPattern) {
        this.applyPredefinedPattern(this.selectedPattern);
      }
    });
    
    // Random color
    document.getElementById('randomColor').addEventListener('click', () => {
      this.setRandomBrushColor();
    });
    
    document.getElementById('randomColors').addEventListener('change', (e) => {
      this.randomColors = e.target.checked;
      this.saveSettings();
    });
    
    // Actions
    document.getElementById('clearBtn').addEventListener('click', () => {
      this.clearCanvas();
    });
    
    document.getElementById('undoBtn').addEventListener('click', () => {
      this.undo();
    });
    
    document.getElementById('redoBtn').addEventListener('click', () => {
      this.redo();
    });
    
    document.getElementById('saveCanvas').addEventListener('click', () => {
      this.saveCanvas();
    });
    
    document.getElementById('exportCanvas').addEventListener('click', () => {
      this.exportCanvas();
    });
    
    // Zoom controls
    document.getElementById('zoomIn').addEventListener('click', () => {
      this.zoom(1.2);
    });
    
    document.getElementById('zoomOut').addEventListener('click', () => {
      this.zoom(0.8);
    });
    
    // Toggle sidebar for mobile
    document.getElementById('toggleSidebar').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
    
    // Mirror drawing
    document.getElementById('enableMirroring').addEventListener('change', (e) => {
      this.mirrorEnabled = e.target.checked;
      this.saveSettings();
    });
    
    // Listen for drawing events
    this.canvas.on('path:created', (e) => {
      this.handleDrawing(e.path);
      this.saveHistory();
    });
  }
  
  handleDrawing(path) {
    if (!this.mirrorEnabled) return;
    
    const centerX = this.centerX * this.canvas.width;
    const centerY = this.centerY * this.canvas.height;
    const angleStep = (2 * Math.PI) / this.symmetry;
    
    // Get original path data
    const originalPath = new fabric.Path(path.path, {
      stroke: path.stroke,
      strokeWidth: path.strokeWidth,
      fill: '',
      strokeLineCap: path.strokeLineCap,
      strokeLineJoin: path.strokeLineJoin
    });
    
    // Create symmetrical paths
    for (let i = 1; i < this.symmetry; i++) {
      const angle = angleStep * i;
      const rotatedPath = this.rotatePath(originalPath, centerX, centerY, angle);
      this.canvas.add(rotatedPath);
    }
  }
  
  rotatePath(path, centerX, centerY, angle) {
    const rotatedPath = new fabric.Path(path.path, {
      stroke: this.randomColors ? this.getRandomColor() : path.stroke,
      strokeWidth: path.strokeWidth,
      fill: '',
      strokeLineCap: path.strokeLineCap,
      strokeLineJoin: path.strokeLineJoin
    });
    
    // Apply shadow if enabled
    if (this.shadowEnabled) {
      rotatedPath.set({
        shadow: new fabric.Shadow({
          color: this.shadowColor,
          blur: this.shadowBlur,
          offsetX: 0,
          offsetY: 0
        })
      });
    }
    
    // Rotate around center
    rotatedPath.rotate((angle * 180) / Math.PI);
    
    // Calculate position
    const originalBbox = path.getBoundingRect();
    const rotatedBbox = rotatedPath.getBoundingRect();
    
    rotatedPath.set({
      left: centerX - rotatedBbox.width / 2,
      top: centerY - rotatedBbox.height / 2
    });
    
    return rotatedPath;
  }
  
  drawSymmetryLines() {
    // Clear existing lines
    this.canvas.getObjects().forEach(obj => {
      if (obj.type === 'line') {
        this.canvas.remove(obj);
      }
    });
    
    const centerX = this.centerX * this.canvas.width;
    const centerY = this.centerY * this.canvas.height;
    const radius = Math.min(this.canvas.width, this.canvas.height) * 0.4;
    const angleStep = (2 * Math.PI) / this.symmetry;
    
    // Draw symmetry lines
    for (let i = 0; i < this.symmetry; i++) {
      const angle = angleStep * i;
      const endX = centerX + radius * Math.cos(angle);
      const endY = centerY + radius * Math.sin(angle);
      
      const line = new fabric.Line([centerX, centerY, endX, endY], {
        stroke: 'rgba(102, 126, 234, 0.3)',
        strokeWidth: 1,
        selectable: false,
        evented: false
      });
      
      this.canvas.add(line);
      this.canvas.sendToBack(line);
    }
    
    // Draw center circle
    const circle = new fabric.Circle({
      left: centerX - 5,
      top: centerY - 5,
      radius: 5,
      fill: 'rgba(255, 71, 87, 0.5)',
      stroke: '#ff4757',
      strokeWidth: 2,
      selectable: false,
      evented: false
    });
    
    this.canvas.add(circle);
    this.canvas.sendToBack(circle);
  }
  
  updateCenterIndicator() {
    const indicator = document.getElementById('centerIndicator');
    if (indicator) {
      const container = document.querySelector('.canvas-container');
      indicator.style.left = `${this.centerX * 100}%`;
      indicator.style.top = `${this.centerY * 100}%`;
    }
  }
  
  enableCenterAtTouch() {
    this.canvas.on('mouse:down', (e) => {
      const pointer = this.canvas.getPointer(e.e);
      this.centerX = pointer.x / this.canvas.width;
      this.centerY = pointer.y / this.canvas.height;
      
      document.getElementById('centerX').value = this.centerX * 100;
      document.getElementById('centerY').value = this.centerY * 100;
      
      this.updateCenterIndicator();
      this.drawSymmetryLines();
      this.saveSettings();
      
      // Remove listener after one use
      this.canvas.off('mouse:down');
    });
    
    alert('Click anywhere on the canvas to set the center point');
  }
  
  setBrushType(type) {
    switch(type) {
      case 'round':
        this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
        break;
      case 'square':
        const squareBrush = new fabric.PencilBrush(this.canvas);
        squareBrush.decimate = 0;
        this.canvas.freeDrawingBrush = squareBrush;
        break;
      case 'pattern1':
      case 'pattern2':
      case 'pattern3':
        // Custom pattern brushes would go here
        break;
    }
    
    this.canvas.freeDrawingBrush.width = this.brushSize;
    this.canvas.freeDrawingBrush.color = this.brushColor;
  }
  
  updateShadowSettings() {
    if (this.shadowEnabled) {
      this.canvas.getObjects().forEach(obj => {
        if (obj.type === 'path') {
          obj.set({
            shadow: new fabric.Shadow({
              color: this.shadowColor,
              blur: this.shadowBlur,
              offsetX: 0,
              offsetY: 0
            })
          });
        }
      });
    } else {
      this.canvas.getObjects().forEach(obj => {
        if (obj.type === 'path') {
          obj.set({ shadow: null });
        }
      });
    }
    this.canvas.renderAll();
  }
  
  setRandomShadow() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    this.shadowColor = colors[Math.floor(Math.random() * colors.length)] + '80';
    this.shadowBlur = Math.floor(Math.random() * 30) + 5;
    
    document.getElementById('shadowColor').value = this.shadowColor.replace('80', '');
    document.getElementById('shadowBlur').value = this.shadowBlur;
    document.getElementById('shadowBlurValue').textContent = this.shadowBlur;
    
    this.updateShadowSettings();
    this.saveSettings();
  }
  
  setRandomBrushColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    this.brushColor = colors[Math.floor(Math.random() * colors.length)];
    
    document.getElementById('brushColorPicker').value = this.brushColor;
    this.canvas.freeDrawingBrush.color = this.brushColor;
    this.saveSettings();
  }
  
  getRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  applyPredefinedPattern(patternName) {
    const centerX = this.centerX * this.canvas.width;
    const centerY = this.centerY * this.canvas.height;
    const radius = Math.min(this.canvas.width, this.canvas.height) * 0.3;
    
    switch(patternName) {
      case 'radial':
        this.drawRadialPattern(centerX, centerY, radius);
        break;
      case 'circular':
        this.drawCircularPattern(centerX, centerY, radius);
        break;
      case 'flower':
        this.drawFlowerPattern(centerX, centerY, radius);
        break;
      case 'spiral':
        this.drawSpiralPattern(centerX, centerY, radius);
        break;
      case 'geometric':
        this.drawGeometricPattern(centerX, centerY, radius);
        break;
      case 'mandala':
        this.drawMandalaPattern(centerX, centerY, radius);
        break;
    }
    
    this.saveHistory();
  }
  
  drawRadialPattern(cx, cy, radius) {
    const points = 12;
    const angleStep = (2 * Math.PI) / points;
    
    for (let i = 0; i < points; i++) {
      const angle = angleStep * i;
      const endX = cx + radius * Math.cos(angle);
      const endY = cy + radius * Math.sin(angle);
      
      const line = new fabric.Line([cx, cy, endX, endY], {
        stroke: this.brushColor,
        strokeWidth: this.brushSize / 2,
        selectable: false
      });
      
      if (this.shadowEnabled) {
        line.set({
          shadow: new fabric.Shadow({
            color: this.shadowColor,
            blur: this.shadowBlur,
            offsetX: 0,
            offsetY: 0
          })
        });
      }
      
      this.canvas.add(line);
    }
  }
  
  drawCircularPattern(cx, cy, radius) {
    const circles = 5;
    const step = radius / circles;
    
    for (let i = 1; i <= circles; i++) {
      const circleRadius = step * i;
      const circle = new fabric.Circle({
        left: cx - circleRadius,
        top: cy - circleRadius,
        radius: circleRadius,
        stroke: this.brushColor,
        strokeWidth: this.brushSize / 3,
        fill: 'transparent',
        selectable: false
      });
      
      if (this.shadowEnabled) {
        circle.set({
          shadow: new fabric.Shadow({
            color: this.shadowColor,
            blur: this.shadowBlur,
            offsetX: 0,
            offsetY: 0
          })
        });
      }
      
      this.canvas.add(circle);
    }
  }
  
  clearCanvas() {
    if (confirm('Are you sure you want to clear the canvas?')) {
      this.canvas.clear();
      this.drawSymmetryLines();
      this.saveHistory();
    }
  }
  
  saveHistory() {
    const json = this.canvas.toJSON();
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(json);
    this.historyIndex++;
  }
  
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.canvas.loadFromJSON(this.history[this.historyIndex], () => {
        this.canvas.renderAll();
        this.drawSymmetryLines();
      });
    }
  }
  
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.canvas.loadFromJSON(this.history[this.historyIndex], () => {
        this.canvas.renderAll();
        this.drawSymmetryLines();
      });
    }
  }
  
  zoom(factor) {
    this.zoomLevel *= factor;
    document.getElementById('zoomLevel').textContent = Math.round(this.zoomLevel * 100) + '%';
    
    const zoomPoint = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2
    };
    
    this.canvas.zoomToPoint(zoomPoint, this.zoomLevel);
  }
  
  saveCanvas() {
    const dataURL = this.canvas.toDataURL({
      format: 'png',
      quality: 1
    });
    
    const link = document.createElement('a');
    link.download = 'mandala-art.png';
    link.href = dataURL;
    link.click();
  }
  
  exportCanvas() {
    const dataURL = this.canvas.toDataURL({
      format: 'png',
      quality: 1
    });
    
    // Store in chrome storage
    chrome.storage.local.set({mandalaExport: dataURL}, () => {
      alert('Canvas exported successfully!');
    });
  }
  
  loadSettings() {
    chrome.storage.sync.get([
      'symmetry', 'brushSize', 'brushColor', 'backgroundColor',
      'showShadows', 'shadowColor', 'shadowBlur',
      'canvasCenterX', 'canvasCenterY', 'enableMirroring',
      'brushType', 'randomColors'
    ], (data) => {
      if (data.symmetry) {
        this.symmetry = parseInt(data.symmetry);
        document.getElementById('symmetryRange').value = this.symmetry;
        document.getElementById('symmetryValue').textContent = this.symmetry;
      }
      
      if (data.brushSize) {
        this.brushSize = parseInt(data.brushSize);
        document.getElementById('brushSizeRange').value = this.brushSize;
        document.getElementById('brushSizeValue').textContent = this.brushSize;
        this.canvas.freeDrawingBrush.width = this.brushSize;
      }
      
      if (data.brushColor) {
        this.brushColor = data.brushColor;
        document.getElementById('brushColorPicker').value = this.brushColor;
        this.canvas.freeDrawingBrush.color = this.brushColor;
      }
      
      if (data.backgroundColor) {
        this.canvas.backgroundColor = data.backgroundColor;
        document.getElementById('backgroundColor').value = data.backgroundColor;
        this.canvas.renderAll();
      }
      
      if (data.showShadows !== undefined) {
        this.shadowEnabled = data.showShadows;
        document.getElementById('enableShadows').checked = this.shadowEnabled;
      }
      
      if (data.shadowColor) {
        this.shadowColor = data.shadowColor;
        document.getElementById('shadowColor').value = data.shadowColor;
      }
      
      if (data.shadowBlur) {
        this.shadowBlur = data.shadowBlur;
        document.getElementById('shadowBlur').value = this.shadowBlur;
        document.getElementById('shadowBlurValue').textContent = this.shadowBlur;
      }
      
      if (data.canvasCenterX) {
        this.centerX = parseFloat(data.canvasCenterX);
        document.getElementById('centerX').value = this.centerX * 100;
      }
      
      if (data.canvasCenterY) {
        this.centerY = parseFloat(data.canvasCenterY);
        document.getElementById('centerY').value = this.centerY * 100;
      }
      
      if (data.enableMirroring !== undefined) {
        this.mirrorEnabled = data.enableMirroring;
        document.getElementById('enableMirroring').checked = this.mirrorEnabled;
      }
      
      if (data.brushType) {
        document.getElementById('brushType').value = data.brushType;
        this.setBrushType(data.brushType);
      }
      
      if (data.randomColors !== undefined) {
        this.randomColors = data.randomColors;
        document.getElementById('randomColors').checked = this.randomColors;
      }
      
      this.updateCenterIndicator();
      this.drawSymmetryLines();
      this.updateShadowSettings();
    });
  }
  
  saveSettings() {
    const settings = {
      symmetry: this.symmetry,
      brushSize: this.brushSize,
      brushColor: this.brushColor,
      backgroundColor: this.canvas.backgroundColor,
      showShadows: this.shadowEnabled,
      shadowColor: this.shadowColor,
      shadowBlur: this.shadowBlur,
      canvasCenterX: this.centerX,
      canvasCenterY: this.centerY,
      enableMirroring: this.mirrorEnabled,
      brushType: document.getElementById('brushType').value,
      randomColors: this.randomColors
    };
    
    chrome.storage.sync.set(settings);
  }
  
  // Additional pattern drawing methods
  drawFlowerPattern(cx, cy, radius) {
    const petals = 8;
    const angleStep = (2 * Math.PI) / petals;
    
    for (let i = 0; i < petals; i++) {
      const angle = angleStep * i;
      
      // Draw petal as an ellipse
      const petal = new fabric.Ellipse({
        left: cx + radius * 0.5 * Math.cos(angle) - 20,
        top: cy + radius * 0.5 * Math.sin(angle) - 40,
        rx: 20,
        ry: 40,
        angle: (angle * 180) / Math.PI,
        stroke: this.brushColor,
        strokeWidth: this.brushSize / 3,
        fill: 'transparent',
        selectable: false
      });
      
      if (this.shadowEnabled) {
        petal.set({
          shadow: new fabric.Shadow({
            color: this.shadowColor,
            blur: this.shadowBlur / 2,
            offsetX: 0,
            offsetY: 0
          })
        });
      }
      
      this.canvas.add(petal);
    }
  }
  
  drawSpiralPattern(cx, cy, radius) {
    const points = [];
    const turns = 3;
    const steps = 100;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * Math.PI * 2 * turns;
      const r = radius * t;
      
      points.push({
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle)
      });
    }
    
    const path = new fabric.Polyline(points, {
      stroke: this.brushColor,
      strokeWidth: this.brushSize / 2,
      fill: 'transparent',
      selectable: false
    });
    
    if (this.shadowEnabled) {
      path.set({
        shadow: new fabric.Shadow({
          color: this.shadowColor,
          blur: this.shadowBlur,
          offsetX: 0,
          offsetY: 0
        })
      });
    }
    
    this.canvas.add(path);
  }
  
  drawGeometricPattern(cx, cy, radius) {
    const shapes = 6;
    const angleStep = (2 * Math.PI) / shapes;
    
    for (let i = 0; i < shapes; i++) {
      const angle = angleStep * i;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      
      // Draw hexagon
      const hexagon = new fabric.Polygon([
        {x: x, y: y - 30},
        {x: x + 26, y: y - 15},
        {x: x + 26, y: y + 15},
        {x: x, y: y + 30},
        {x: x - 26, y: y + 15},
        {x: x - 26, y: y - 15}
      ], {
        stroke: this.brushColor,
        strokeWidth: this.brushSize / 3,
        fill: 'transparent',
        selectable: false,
        angle: (angle * 180) / Math.PI
      });
      
      if (this.shadowEnabled) {
        hexagon.set({
          shadow: new fabric.Shadow({
            color: this.shadowColor,
            blur: this.shadowBlur,
            offsetX: 0,
            offsetY: 0
          })
        });
      }
      
      this.canvas.add(hexagon);
    }
  }
  
  drawMandalaPattern(cx, cy, radius) {
    // Complex mandala pattern combining multiple elements
    this.drawCircularPattern(cx, cy, radius);
    this.drawRadialPattern(cx, cy, radius * 0.8);
    this.drawFlowerPattern(cx, cy, radius * 0.6);
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  const mandalaArtist = new MandalaArtist();
  
  // Handle messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'applyPattern') {
      mandalaArtist.applyPredefinedPattern(request.pattern.pattern);
    }
  });
});