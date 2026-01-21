// Advanced color picker for Mandala Artist
class ColorPicker {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.selectedColor = '#ff6b6b';
    this.palettes = {
      warm: ['#FF6B6B', '#FF8E53', '#FFD166', '#EF476F', '#FF9A76'],
      cool: ['#4ECDC4', '#45B7D1', '#96CEB4', '#118AB2', '#06D6A0'],
      pastel: ['#FFEAA7', '#DDA0DD', '#98D8D8', '#FFB6C1', '#C5E1A5'],
      vibrant: ['#FF0055', '#00D4AA', '#FF9500', '#5856D6', '#FF2D55'],
      mandala: ['#E63946', '#F1FAEE', '#A8DADC', '#457B9D', '#1D3557']
    };
    this.init();
  }

  init() {
    this.createPicker();
    this.bindEvents();
  }

  createPicker() {
    this.container.innerHTML = `
      <div class="color-picker">
        <div class="color-display">
          <div class="current-color" id="currentColor"></div>
          <input type="text" id="colorHex" value="#ff6b6b" maxlength="7">
        </div>
        
        <div class="color-palettes">
          <h4>Quick Palettes</h4>
          ${Object.entries(this.palettes).map(([name, colors]) => `
            <div class="palette-group">
              <label>${name.charAt(0).toUpperCase() + name.slice(1)}</label>
              <div class="palette-colors">
                ${colors.map(color => `
                  <div class="palette-color" style="background: ${color}" data-color="${color}"></div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="color-sliders">
          <h4>Custom Color</h4>
          <div class="slider-group">
            <label>R: <span id="redValue">255</span></label>
            <input type="range" id="redSlider" min="0" max="255" value="255">
          </div>
          <div class="slider-group">
            <label>G: <span id="greenValue">107</span></label>
            <input type="range" id="greenSlider" min="0" max="255" value="107">
          </div>
          <div class="slider-group">
            <label>B: <span id="blueValue">107</span></label>
            <input type="range" id="blueSlider" min="0" max="255" value="107">
          </div>
          <div class="slider-group">
            <label>A: <span id="alphaValue">1.0</span></label>
            <input type="range" id="alphaSlider" min="0" max="100" value="100">
          </div>
        </div>
        
        <div class="color-actions">
          <button id="randomColor">🎲 Random Color</button>
          <button id="saveColor">💾 Save to Favorites</button>
        </div>
        
        <div class="saved-colors">
          <h4>Saved Colors</h4>
          <div class="saved-colors-grid" id="savedColors"></div>
        </div>
      </div>
    `;

    this.updateCurrentColor();
  }

  bindEvents() {
    // Hex input
    document.getElementById('colorHex').addEventListener('change', (e) => {
      this.setColorFromHex(e.target.value);
    });

    // Palette colors
    document.querySelectorAll('.palette-color').forEach(color => {
      color.addEventListener('click', (e) => {
        this.selectedColor = e.target.dataset.color;
        this.updateCurrentColor();
        this.updateSlidersFromColor();
        this.triggerColorChange();
      });
    });

    // Sliders
    ['red', 'green', 'blue', 'alpha'].forEach(channel => {
      document.getElementById(`${channel}Slider`).addEventListener('input', (e) => {
        this.updateColorFromSliders();
      });
    });

    // Random color
    document.getElementById('randomColor').addEventListener('click', () => {
      this.generateRandomColor();
    });

    // Save color
    document.getElementById('saveColor').addEventListener('click', () => {
      this.saveCurrentColor();
    });

    // Load saved colors
    this.loadSavedColors();
  }

  setColorFromHex(hex) {
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      this.selectedColor = hex;
      this.updateCurrentColor();
      this.updateSlidersFromColor();
      this.triggerColorChange();
    }
  }

  updateCurrentColor() {
    const display = document.getElementById('currentColor');
    const hexInput = document.getElementById('colorHex');
    
    if (display) display.style.backgroundColor = this.selectedColor;
    if (hexInput) hexInput.value = this.selectedColor;
  }

  updateSlidersFromColor() {
    const color = this.hexToRgb(this.selectedColor);
    if (color) {
      document.getElementById('redSlider').value = color.r;
      document.getElementById('greenSlider').value = color.g;
      document.getElementById('blueSlider').value = color.b;
      
      document.getElementById('redValue').textContent = color.r;
      document.getElementById('greenValue').textContent = color.g;
      document.getElementById('blueValue').textContent = color.b;
    }
  }

  updateColorFromSliders() {
    const r = parseInt(document.getElementById('redSlider').value);
    const g = parseInt(document.getElementById('greenSlider').value);
    const b = parseInt(document.getElementById('blueSlider').value);
    const a = parseInt(document.getElementById('alphaSlider').value) / 100;
    
    document.getElementById('redValue').textContent = r;
    document.getElementById('greenValue').textContent = g;
    document.getElementById('blueValue').textContent = b;
    document.getElementById('alphaValue').textContent = a.toFixed(2);
    
    this.selectedColor = this.rgbToHex(r, g, b);
    this.updateCurrentColor();
    this.triggerColorChange();
  }

  generateRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    
    this.selectedColor = this.rgbToHex(r, g, b);
    this.updateCurrentColor();
    this.updateSlidersFromColor();
    this.triggerColorChange();
  }

  saveCurrentColor() {
    let savedColors = JSON.parse(localStorage.getItem('mandalaSavedColors') || '[]');
    
    if (!savedColors.includes(this.selectedColor)) {
      savedColors.push(this.selectedColor);
      if (savedColors.length > 12) savedColors.shift(); // Keep only 12 colors
      
      localStorage.setItem('mandalaSavedColors', JSON.stringify(savedColors));
      this.loadSavedColors();
    }
  }

  loadSavedColors() {
    const savedColors = JSON.parse(localStorage.getItem('mandalaSavedColors') || '[]');
    const container = document.getElementById('savedColors');
    
    if (container) {
      container.innerHTML = savedColors.map(color => `
        <div class="saved-color" style="background: ${color}" data-color="${color}"></div>
      `).join('');
      
      // Add click events to saved colors
      container.querySelectorAll('.saved-color').forEach(color => {
        color.addEventListener('click', (e) => {
          this.selectedColor = e.target.dataset.color;
          this.updateCurrentColor();
          this.updateSlidersFromColor();
          this.triggerColorChange();
        });
      });
    }
  }

  triggerColorChange() {
    const event = new CustomEvent('colorChanged', {
      detail: { color: this.selectedColor }
    });
    this.container.dispatchEvent(event);
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  getColor() {
    return this.selectedColor;
  }

  setColor(color) {
    this.selectedColor = color;
    this.updateCurrentColor();
    this.updateSlidersFromColor();
  }
}


const colorPickerCSS = `
.color-picker {
  background: white;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.color-display {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.current-color {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  border: 2px solid #ddd;
  cursor: pointer;
}

#colorHex {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: monospace;
}

.color-palettes {
  margin-bottom: 20px;
}

.palette-group {
  margin-bottom: 10px;
}

.palette-group label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.palette-colors {
  display: flex;
  gap: 5px;
}

.palette-color {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.palette-color:hover {
  transform: scale(1.1);
}

.color-sliders {
  margin-bottom: 20px;
}

.slider-group {
  margin-bottom: 10px;
}

.slider-group label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.slider-group input[type="range"] {
  width: 100%;
}

.color-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.color-actions button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: #667eea;
  color: white;
  font-size: 12px;
}

.saved-colors-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 5px;
}

.saved-color {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #ddd;
}
`;