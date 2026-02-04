// ============================================
// DOM ELEMENTS
// ============================================
const inputField = document.getElementById('input-value');
const outputField = document.getElementById('output-value');
const inputUnit = document.getElementById('input-unit');
const outputUnit = document.getElementById('output-unit');
const convertBtn = document.getElementById('convert-btn');
const resetBtn = document.getElementById('reset-btn');
const swapBtn = document.getElementById('swap-btn');
const unitToggle = document.getElementById('unit-toggle');
const labelF = document.getElementById('label-f');
const labelC = document.getElementById('label-c');
const inputLabel = document.getElementById('input-label');
const conversionInfo = document.getElementById('conversion-info');
const temperatureScale = document.getElementById('temperature-scale');
const refItems = document.querySelectorAll('.ref-item');
const inputHint = document.getElementById('input-hint');

// ============================================
// STATE MANAGEMENT
// ============================================
let isFtoC = true;
let lastInput = '';
let isAutoConverting = true;

// ============================================
// TEMPERATURE CONVERSION FUNCTIONS
// ============================================

/**
 * Convert Fahrenheit to Celsius
 */
function fahrenheitToCelsius(f) {
  return (f - 32) * 5 / 9;
}

/**
 * Convert Celsius to Fahrenheit
 */
function celsiusToFahrenheit(c) {
  return (c * 9 / 5) + 32;
}

/**
 * Format temperature with proper decimal places
 */
function formatTemperature(temp) {
  const rounded = Math.round(temp * 100) / 100;
  // Remove trailing zeros
  return parseFloat(rounded.toFixed(2));
}

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

/**
 * Update all UI elements based on conversion direction
 */
function updateUI() {
  isFtoC = !unitToggle.checked;

  // Update toggle labels
  if (isFtoC) {
    labelF.classList.add('active');
    labelC.classList.remove('active');
    inputUnit.textContent = '°F';
    outputUnit.textContent = '°C';
    inputLabel.textContent = 'Fahrenheit to Celsius';
    inputHint.textContent = 'Enter °F to convert to °C';
  } else {
    labelC.classList.add('active');
    labelF.classList.remove('active');
    inputUnit.textContent = '°C';
    outputUnit.textContent = '°F';
    inputLabel.textContent = 'Celsius to Fahrenheit';
    inputHint.textContent = 'Enter °C to convert to °F';
  }

  // Re-convert if there's a value
  if (inputField.value.trim() !== '') {
    convert();
  }
}

/**
 * Convert temperature and update display
 */
function convert() {
  const value = parseFloat(inputField.value);
  
  // Clear if empty or invalid
  if (isNaN(value)) {
    outputField.textContent = '--';
    conversionInfo.textContent = '';
    temperatureScale.textContent = '';
    return;
  }
  
  let result;
  let originalUnit, convertedUnit;
  
  if (isFtoC) {
    result = fahrenheitToCelsius(value);
    originalUnit = '°F';
    convertedUnit = '°C';
  } else {
    result = celsiusToFahrenheit(value);
    originalUnit = '°C';
    convertedUnit = '°F';
  }
  
  // Update display
  outputField.textContent = formatTemperature(result);
  
  // Update conversion info
  updateConversionInfo(value, result, originalUnit, convertedUnit);
  
  // Add animation
  animateResult();
  
  // Save last valid input
  lastInput = inputField.value;
}

/**
 * Update conversion info with temperature context
 */
function updateConversionInfo(input, output, fromUnit, toUnit) {
  let info = '';
  let scale = '';
  
  if (isFtoC) {
    // Fahrenheit to Celsius
    if (output < -20) {
      info = 'Extremely Cold ❄️';
      scale = 'Arctic conditions';
    } else if (output >= -20 && output < 0) {
      info = 'Freezing Cold 🥶';
      scale = 'Below freezing point';
    } else if (output >= 0 && output < 10) {
      info = 'Cold ☁️';
      scale = 'Winter weather';
    } else if (output >= 10 && output < 20) {
      info = 'Cool 🌥️';
      scale = 'Spring/Fall day';
    } else if (output >= 20 && output < 25) {
      info = 'Comfortable 😊';
      scale = 'Room temperature';
    } else if (output >= 25 && output < 30) {
      info = 'Warm 🌤️';
      scale = 'Summer day';
    } else if (output >= 30 && output < 40) {
      info = 'Hot 🌞';
      scale = 'Heat wave';
    } else {
      info = 'Extremely Hot 🔥';
      scale = 'Dangerously hot';
    }
  } else {
    // Celsius to Fahrenheit
    if (output < 0) {
      info = 'Extremely Cold ❄️';
      scale = 'Arctic conditions';
    } else if (output >= 0 && output < 32) {
      info = 'Freezing Cold 🥶';
      scale = 'Below freezing point';
    } else if (output >= 32 && output < 50) {
      info = 'Cold ☁️';
      scale = 'Winter weather';
    } else if (output >= 50 && output < 68) {
      info = 'Cool 🌥️';
      scale = 'Spring/Fall day';
    } else if (output >= 68 && output < 77) {
      info = 'Comfortable 😊';
      scale = 'Room temperature';
    } else if (output >= 77 && output < 86) {
      info = 'Warm 🌤️';
      scale = 'Summer day';
    } else if (output >= 86 && output < 104) {
      info = 'Hot 🌞';
      scale = 'Heat wave';
    } else {
      info = 'Extremely Hot 🔥';
      scale = 'Dangerously hot';
    }
  }
  
  conversionInfo.textContent = info;
  temperatureScale.textContent = scale;
}

/**
 * Animate result display
 */
function animateResult() {
  const resultArea = document.querySelector('.result-area');
  resultArea.classList.remove('pulse');
  void resultArea.offsetWidth; // Trigger reflow
  resultArea.classList.add('pulse');
}

/**
 * Swap conversion direction
 */
function swapUnits() {
  // Toggle the switch
  unitToggle.checked = !unitToggle.checked;
  
  // Swap input/output values if both are valid
  if (inputField.value.trim() !== '' && outputField.textContent !== '--') {
    const temp = inputField.value;
    inputField.value = outputField.textContent;
    outputField.textContent = formatTemperature(parseFloat(temp));
  }
  
  // Update UI
  updateUI();
  
  // Animate swap button
  swapBtn.classList.add('rotate');
  setTimeout(() => swapBtn.classList.remove('rotate'), 500);
  
  // Show notification
  showNotification(`Switched to ${isFtoC ? 'Fahrenheit → Celsius' : 'Celsius → Fahrenheit'}`);
}

/**
 * Reset all fields
 */
function resetAll() {
  inputField.value = '';
  outputField.textContent = '--';
  conversionInfo.textContent = '';
  temperatureScale.textContent = '';
  inputField.focus();
  
  // Animate reset button
  resetBtn.classList.add('rotate');
  setTimeout(() => resetBtn.classList.remove('rotate'), 500);
  
  showNotification('Cleared all fields');
}

/**
 * Set quick reference temperature
 */
function setQuickReference(value, isFahrenheit) {
  if (isFahrenheit) {
    inputField.value = value;
  } else {
    // Convert Celsius to Fahrenheit if needed
    if (isFtoC) {
      inputField.value = celsiusToFahrenheit(value);
    } else {
      inputField.value = value;
    }
  }
  
  convert();
  
  // Show which reference was used
  showNotification('Quick temperature set');
}

/**
 * Show temporary notification
 */
function showNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: var(--header-bg);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    max-width: 200px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 2 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// ============================================
// EVENT LISTENERS
// ============================================

// Real-time conversion as you type
inputField.addEventListener('input', () => {
  if (inputField.value.trim() === '') {
    outputField.textContent = '--';
    conversionInfo.textContent = '';
    temperatureScale.textContent = '';
    return;
  }
  
  // Validate input
  const value = parseFloat(inputField.value);
  if (!isNaN(value)) {
    if (isAutoConverting) {
      convert();
    }
  }
});

// Enter key to convert
inputField.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    convert();
    
    // Button animation
    convertBtn.classList.add('clicked');
    setTimeout(() => convertBtn.classList.remove('clicked'), 200);
  }
});

// Convert button
convertBtn.addEventListener('click', () => {
  convert();
  
  // Button animation
  convertBtn.classList.add('clicked');
  setTimeout(() => convertBtn.classList.remove('clicked'), 200);
  
  showNotification('Temperature converted');
});

// Reset button
resetBtn.addEventListener('click', resetAll);

// Swap button
swapBtn.addEventListener('click', swapUnits);

// Unit toggle
unitToggle.addEventListener('change', updateUI);

// Quick reference items
refItems.forEach(item => {
  item.addEventListener('click', () => {
    const fValue = parseFloat(item.getAttribute('data-f'));
    const cValue = parseFloat(item.getAttribute('data-c'));
    
    setQuickReference(isFtoC ? fValue : cValue, isFtoC);
    
    // Visual feedback
    item.classList.add('clicked');
    setTimeout(() => item.classList.remove('clicked'), 300);
  });
});

// Input field focus
inputField.addEventListener('focus', () => {
  inputField.select();
});

// ============================================
// INITIALIZATION
// ============================================

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .notification {
    font-family: var(--font-family);
  }
  
  .ref-item.clicked {
    animation: quickClick 0.3s ease;
  }
  
  @keyframes quickClick {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(0.98); }
  }
`;
document.head.appendChild(style);

// Initial focus
inputField.focus();

// Initial UI update
updateUI();

// Auto-detect if there's a value in the input field on load
if (inputField.value.trim() !== '') {
  convert();
}

// Accessibility: Announce when extension loads
setTimeout(() => {
  showNotification('Temperature Converter ready');
}, 500);