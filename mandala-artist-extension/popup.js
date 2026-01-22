document.addEventListener('DOMContentLoaded', function() {
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
  chrome.storage.sync.get([
    'symmetry', 
    'brushSize', 
    'brushColor'
  ], function(data) {
    if (data.symmetry) symmetrySelect.value = data.symmetry;
    if (data.brushSize) {
      brushSizeSlider.value = data.brushSize;
      brushSizeValue.textContent = data.brushSize;
    }
    if (data.brushColor) brushColorPicker.value = data.brushColor;
  });
  
  // Event Listeners
  brushSizeSlider.addEventListener('input', function() {
    brushSizeValue.textContent = this.value;
    saveSetting('brushSize', this.value);
  });
  
  symmetrySelect.addEventListener('change', function() {
    saveSetting('symmetry', this.value);
  });
  
  brushColorPicker.addEventListener('change', function() {
    saveSetting('brushColor', this.value);
  });
  
  startDrawingBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        files: ['content/mandala-canvas.js']
      });
    });
  });
  
  openCanvasBtn.addEventListener('click', function() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('content/mandala-canvas.html')
    });
  });
  
  patternItems.forEach(item => {
    item.addEventListener('click', function() {
      const pattern = this.dataset.pattern;
      applyPattern(pattern);
    });
  });
  
  openOptionsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
  
  clearCanvasBtn.addEventListener('click', function() {
    chrome.storage.local.set({canvasData: null}, function() {
      alert('Canvas cleared!');
    });
  });
  
  // Helper Functions
  function saveSetting(key, value) {
    chrome.storage.sync.set({[key]: value});
  }
  
  function applyPattern(pattern) {
    const settings = {
      pattern: pattern,
      symmetry: symmetrySelect.value,
      brushColor: brushColorPicker.value,
      brushSize: brushSizeSlider.value
    };
    
    chrome.storage.sync.set({currentPattern: settings});
    
    // Send message to content script if active
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'applyPattern',
        pattern: settings
      });
    });
  }
});