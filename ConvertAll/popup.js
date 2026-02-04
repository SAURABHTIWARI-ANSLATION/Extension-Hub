
const categories = {
  Length: {
    m: 1,
    km: 1000,
    cm: 0.01,
    mm: 0.001,
    mi: 1609.34,
    ft: 0.3048,
    in: 0.0254,
    yd: 0.9144,
  },
  Weight: {
    kg: 1,
    g: 0.001,
    mg: 0.000001,
    lb: 0.453592,
    oz: 0.0283495,
    t: 1000,
  },
  Volume: {
    l: 1,
    ml: 0.001,
    gal: 3.78541,
    cup: 0.236588,
    fl_oz: 0.0295735,
    pint: 0.473176,
  },
  Time: {
    s: 1,
    min: 60,
    h: 3600,
    d: 86400,
    week: 604800,
    year: 31536000,
  },
  Temperature: {
    C: 'celsius',
    F: 'fahrenheit',
    K: 'kelvin',
  },
  Number: {
    dec: 10,
    bin: 2,
    hex: 16,
    oct: 8,
  },
};

// DOM Elements
const elements = {
  category: document.getElementById('category'),
  fromUnit: document.getElementById('fromUnit'),
  toUnit: document.getElementById('toUnit'),
  input: document.getElementById('inputValue'),
  output: document.getElementById('outputValue'),
  copyBtn: document.getElementById('copyBtn'),
  swapBtn: document.getElementById('swapBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettings: document.getElementById('closeSettings'),
  precisionSlider: document.getElementById('precisionSlider'),
  precisionValue: document.getElementById('precisionValue'),
  thousandsSeparator: document.getElementById('thousandsSeparator'),
};

// Settings
let settings = {
  precision: 4,
  useThousandsSeparator: true,
};

/**
 * Initialize the application
 */
function init() {
  loadSettings();
  populateCategories();
  setupEventListeners();
  loadUnits();
}

/**
 * Load settings from Chrome storage
 */
async function loadSettings() {
  const stored = await chrome.storage.sync.get({
    precision: 4,
    useThousandsSeparator: true,
  });
  settings = stored;
  elements.precisionSlider.value = settings.precision;
  elements.precisionValue.value = settings.precision;
  elements.thousandsSeparator.checked = settings.useThousandsSeparator;
}

/**
 * Save settings to Chrome storage
 */
async function saveSettings() {
  settings.precision = parseInt(elements.precisionValue.value);
  settings.useThousandsSeparator = elements.thousandsSeparator.checked;
  await chrome.storage.sync.set(settings);
  convert();
}

/**
 * Populate category dropdown
 */
function populateCategories() {
  elements.category.innerHTML = Object.keys(categories)
    .map((cat) => `<option value="${cat}">${cat}</option>`)
    .join('');
}

/**
 * Load units for selected category
 */
function loadUnits() {
  const catName = elements.category.value;
  const units = Object.keys(categories[catName]);
  const options = units.map((u) => `<option value="${u}">${u}</option>`).join('');

  elements.fromUnit.innerHTML = options;
  elements.toUnit.innerHTML = options;

  // Set different units by default
  if (units.length > 1) {
    elements.toUnit.value = units[1];
  }

  convert();
}

/**
 * Format a number with optional thousands separator
 */
function formatNumber(num) {
  if (!settings.useThousandsSeparator) {
    return num.toString();
  }

  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

/**
 * Handle temperature conversion
 */
function convertTemperature(value, fromUnit, toUnit) {
  if (isNaN(value)) return 'Invalid';

  let celsius;

  // Convert to Celsius first
  if (fromUnit === 'C') celsius = value;
  else if (fromUnit === 'F') celsius = ((value - 32) * 5) / 9;
  else if (fromUnit === 'K') celsius = value - 273.15;

  // Convert from Celsius to target
  if (toUnit === 'C') return celsius;
  if (toUnit === 'F') return (celsius * 9) / 5 + 32;
  if (toUnit === 'K') return celsius + 273.15;
}

/**
 * Handle number base conversion
 */
function convertNumber(value, fromBase, toBase) {
  try {
    const bases = { dec: 10, bin: 2, hex: 16, oct: 8 };
    const fromB = bases[fromBase];
    const toB = bases[toBase];

    const decimal = parseInt(value, fromB);

    if (isNaN(decimal)) {
      return 'Invalid';
    }

    const result = decimal.toString(toB).toUpperCase();
    return result || '0';
  } catch {
    return 'Error';
  }
}

/**
 * Convert units
 */
async function convert() {
  const val = elements.input.value.trim();
  const catName = elements.category.value;
  const fromUnit = elements.fromUnit.value;
  const toUnit = elements.toUnit.value;

  // Clear output if input is empty
  if (val === '') {
    elements.output.value = '';
    return;
  }

  // Temperature conversion
  if (catName === 'Temperature') {
    const result = convertTemperature(parseFloat(val), fromUnit, toUnit);
    if (result === 'Invalid') {
      elements.output.value = 'Invalid Input';
      return;
    }
    elements.output.value = formatNumber(result.toFixed(settings.precision));
    return;
  }

  // Number base conversion
  if (catName === 'Number') {
    elements.output.value = convertNumber(val, fromUnit, toUnit);
    return;
  }

  // Standard unit conversion
  const numVal = parseFloat(val);
  if (isNaN(numVal)) {
    elements.output.value = 'Invalid Input';
    return;
  }

  const baseValue = numVal * categories[catName][fromUnit];
  const result = baseValue / categories[catName][toUnit];

  // Format result with precision
  const formatted = result.toFixed(settings.precision);
  elements.output.value = formatNumber(parseFloat(formatted));
}

/**
 * Swap input and output units
 */
function swapUnits() {
  const temp = elements.fromUnit.value;
  elements.fromUnit.value = elements.toUnit.value;
  elements.toUnit.value = temp;
  convert();
}

/**
 * Copy result to clipboard
 */
async function copyToClipboard() {
  const text = elements.output.value;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    elements.copyBtn.textContent = '✓ Copied!';
    setTimeout(() => {
      elements.copyBtn.textContent = '📋 Copy Result';
    }, 2000);
  } catch {
    console.error('Failed to copy to clipboard');
  }
}

/**
 * Toggle settings modal
 */
function toggleSettings() {
  elements.settingsModal.classList.toggle('hidden');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Category and unit changes
  elements.category.addEventListener('change', loadUnits);
  elements.fromUnit.addEventListener('change', convert);
  elements.toUnit.addEventListener('change', convert);

  // Input changes
  elements.input.addEventListener('input', convert);

  // Button events
  elements.copyBtn.addEventListener('click', copyToClipboard);
  elements.swapBtn.addEventListener('click', swapUnits);
  elements.settingsBtn.addEventListener('click', toggleSettings);
  elements.closeSettings.addEventListener('click', toggleSettings);

  // Settings changes
  elements.precisionSlider.addEventListener('input', (e) => {
    elements.precisionValue.value = e.target.value;
    saveSettings();
  });

  elements.precisionValue.addEventListener('change', (e) => {
    const val = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
    elements.precisionValue.value = val;
    elements.precisionSlider.value = val;
    saveSettings();
  });

  elements.thousandsSeparator.addEventListener('change', saveSettings);

  // Close modal on outside click
  elements.settingsModal.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) {
      toggleSettings();
    }
  });
}

// Initialize on page load
init();