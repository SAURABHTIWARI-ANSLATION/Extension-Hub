document.addEventListener('DOMContentLoaded', function() {
  console.log('🎨 Mandala Artist Popup Loaded');
  
  // DOM Elements
  const startDrawingBtn = document.getElementById('startDrawing');
  const openCanvasBtn = document.getElementById('openCanvas');
  const symmetrySelect = document.getElementById('symmetry');
  const brushSizeSlider = document.getElementById('brushSize');
  const brushSizeValue = document.getElementById('brushSizeValue');
  const brushColorPicker = document.getElementById('brushColor');
  const patternItems = document.querySelectorAll('.pattern-item');
  const openOptionsBtn = document.getElementById('openOptions');
  const clearCanvasBtn = document.getElementById('clearCanvas');
  
  // Load saved settings
  chrome.storage.sync.get(['symmetry', 'brushSize', 'brushColor'], function(data) {
    console.log('Loaded settings:', data);
    
    if (data.symmetry) symmetrySelect.value = data.symmetry;
    if (data.brushSize) {
      brushSizeSlider.value = data.brushSize;
      brushSizeValue.textContent = data.brushSize;
    }
    if (data.brushColor) brushColorPicker.value = data.brushColor;
  });
  
  // Update brush size display
  brushSizeSlider.addEventListener('input', function() {
    brushSizeValue.textContent = this.value;
    saveSetting('brushSize', this.value);
  });
  
  // Save symmetry setting
  symmetrySelect.addEventListener('change', function() {
    saveSetting('symmetry', this.value);
  });
  
  // Save brush color
  brushColorPicker.addEventListener('change', function() {
    saveSetting('brushColor', this.value);
  });
  
  // ✅ START DRAWING BUTTON - CURRENT PAGE PE SIMPLE OVERLAY
  startDrawingBtn.addEventListener('click', async function() {
    console.log('🎨 Starting drawing on current page');
    
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ 
        active: true, 
        currentWindow: true 
      });
      
      if (!tab || !tab.id) {
        alert('Please open a webpage first!');
        return;
      }
      
      // Check if it's a restricted page
      if (tab.url.startsWith('chrome://') || 
          tab.url.startsWith('chrome-extension://') ||
          tab.url.startsWith('about:')) {
        alert('Cannot draw on Chrome system pages. Opening in new tab instead.');
        openMandalaTab();
        return;
      }
      
      // Save current settings
      const settings = {
        symmetry: symmetrySelect.value,
        brushSize: brushSizeSlider.value,
        brushColor: brushColorPicker.value
      };
      
      await chrome.storage.sync.set(settings);
      
      // Inject a SIMPLE drawing canvas (not the full fabric.js app)
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: createSimpleMandalaOverlay,
        args: [settings]
      });
      
      console.log('✅ Simple mandala overlay injected');
      
      // Close popup
      setTimeout(() => window.close(), 300);
      
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Error: ' + error.message + '\nOpening in new tab instead.');
      openMandalaTab();
    }
  });
  
  // ✅ OPEN CANVAS BUTTON - NEW TAB WITH FULL MANDALA APP
  openCanvasBtn.addEventListener('click', function() {
    console.log('🖼️ Opening full mandala canvas in new tab');
    openMandalaTab();
  });
  
  // PATTERN ITEMS
  patternItems.forEach(item => {
    item.addEventListener('click', function() {
      const pattern = this.dataset.pattern;
      console.log('Pattern selected:', pattern);
      
      // Save pattern
      saveSetting('pattern', pattern);
      
      // Visual feedback
      this.style.background = 'rgba(255, 107, 107, 0.3)';
      setTimeout(() => this.style.background = '', 300);
      
      // Send pattern to active tab
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'applyPattern',
            pattern: pattern
          }).catch(() => {
            // Ignore error if no content script
          });
        }
      });
    });
  });
  
  // OPEN OPTIONS
  openOptionsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage().catch(() => {
      chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    });
  });
  
  // CLEAR CANVAS
  clearCanvasBtn.addEventListener('click', function() {
    chrome.storage.local.set({canvasData: null}, function() {
      alert('Canvas cleared!');
      console.log('🗑️ Canvas data cleared');
    });
  });
  
  // HELPER FUNCTIONS
  function saveSetting(key, value) {
    chrome.storage.sync.set({[key]: value}, function() {
      console.log(`💾 Saved: ${key} = ${value}`);
    });
  }
  
  function openMandalaTab() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('content/mandala-canvas.html'),
      active: true
    });
  }
  
  // Function to create SIMPLE mandala overlay on current page
  function createSimpleMandalaOverlay(settings) {
    console.log('Creating simple mandala overlay with:', settings);
    
    // Remove existing overlay
    const existing = document.getElementById('simpleMandalaOverlay');
    if (existing) existing.remove();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'simpleMandalaOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      z-index: 999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      color: white;
      text-align: center;
      margin-bottom: 20px;
      padding: 0 20px;
    `;
    header.innerHTML = `
      <h2 style="margin: 0; color: #ff6b6b;">🎨 Simple Mandala Drawer</h2>
      <p style="margin: 10px 0 0 0; opacity: 0.8;">
        Click and drag to draw. ${settings.symmetry}-fold symmetry enabled.
      </p>
    `;
    
    // Create canvas container
    const container = document.createElement('div');
    container.style.cssText = `
      position: relative;
      background: white;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    `;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'simpleMandalaCanvas';
    canvas.width = 700;
    canvas.height = 500;
    canvas.style.cssText = `
      display: block;
      cursor: crosshair;
      background: white;
    `;
    
    // Create controls
    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex;
      gap: 10px;
      padding: 15px;
      background: rgba(255, 255, 255, 0.95);
      border-top: 1px solid #eee;
    `;
    controls.innerHTML = `
      <button id="simpleClear" style="padding: 8px 15px; background: #ff6b6b; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
        🗑️ Clear
      </button>
      <button id="simpleSave" style="padding: 8px 15px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
        💾 Save
      </button>
      <button id="simpleClose" style="padding: 8px 15px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
        ✕ Close
      </button>
    `;
    
    // Assemble
    container.appendChild(canvas);
    container.appendChild(controls);
    overlay.appendChild(header);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    // Setup drawing
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let lastX = 0;
    let lastY = 0;
    const symmetry = parseInt(settings.symmetry) || 6;
    const brushColor = settings.brushColor || '#ff6b6b';
    const brushSize = parseInt(settings.brushSize) || 10;
    
    // Draw initial guide
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, 200, 0, Math.PI * 2);
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Drawing functions
    canvas.addEventListener('mousedown', (e) => {
      drawing = true;
      const rect = canvas.getBoundingClientRect();
      [lastX, lastY] = [e.clientX - rect.left, e.clientY - rect.top];
    });
    
    canvas.addEventListener('mousemove', (e) => {
      if (!drawing) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Draw main line
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      // Draw symmetrical points
      drawSymmetricalPoints(x, y, lastX, lastY);
      
      [lastX, lastY] = [x, y];
    });
    
    canvas.addEventListener('mouseup', () => drawing = false);
    canvas.addEventListener('mouseout', () => drawing = false);
    
    // Symmetry function
    function drawSymmetricalPoints(x, y, lastX, lastY) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      for (let i = 1; i < symmetry; i++) {
        const angle = (2 * Math.PI * i) / symmetry;
        
        // Rotate current point
        const newX = centerX + (x - centerX) * Math.cos(angle) - (y - centerY) * Math.sin(angle);
        const newY = centerY + (x - centerX) * Math.sin(angle) + (y - centerY) * Math.cos(angle);
        
        // Rotate last point
        const newLastX = centerX + (lastX - centerX) * Math.cos(angle) - (lastY - centerY) * Math.sin(angle);
        const newLastY = centerY + (lastX - centerX) * Math.sin(angle) + (lastY - centerY) * Math.cos(angle);
        
        ctx.beginPath();
        ctx.moveTo(newLastX, newLastY);
        ctx.lineTo(newX, newY);
        ctx.stroke();
      }
    }
    
    // Control buttons
    document.getElementById('simpleClear').addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Redraw guide
      ctx.beginPath();
      ctx.arc(canvas.width/2, canvas.height/2, 200, 0, Math.PI * 2);
      ctx.strokeStyle = '#eee';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    
    document.getElementById('simpleSave').addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = 'mandala-drawing.png';
      link.href = canvas.toDataURL();
      link.click();
    });
    
    document.getElementById('simpleClose').addEventListener('click', () => {
      overlay.remove();
    });
    
    console.log('✅ Simple mandala overlay ready');
    return true;
  }
});