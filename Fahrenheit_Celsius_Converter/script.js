const inputField = document.getElementById('input-value');
const outputField = document.getElementById('output-value');
const inputUnit = document.getElementById('input-unit');
const outputUnit = document.getElementById('output-unit');
const convertBtn = document.getElementById('convert-btn');
const resetBtn = document.getElementById('reset-btn');
const unitToggle = document.getElementById('unit-toggle');
const labelF = document.getElementById('label-f');
const labelC = document.getElementById('label-c');
const inputLabel = document.getElementById('input-label');
const headerTitle = document.querySelector('h1');

let isFtoC = true;

function convert() {
  const value = parseFloat(inputField.value);

  if (isNaN(value)) {
    outputField.textContent = '--';
    return;
  }

  let result;
  if (isFtoC) {
    // F to C
    result = (value - 32) * 5 / 9;
  } else {
    // C to F
    result = (value * 9 / 5) + 32;
  }

  // Format: max 2 decimal places, remove trailing zeros
  outputField.textContent = parseFloat(result.toFixed(2));
}

function updateUI() {
  isFtoC = !unitToggle.checked;

  if (isFtoC) {
    labelF.classList.add('active');
    labelC.classList.remove('active');
    inputUnit.textContent = '°F';
    outputUnit.textContent = '°C';
    inputLabel.textContent = 'Enter Fahrenheit';
    headerTitle.textContent = 'Fahrenheit → Celsius';
  } else {
    labelC.classList.add('active');
    labelF.classList.remove('active');
    inputUnit.textContent = '°C';
    outputUnit.textContent = '°F';
    inputLabel.textContent = 'Enter Celsius';
    headerTitle.textContent = 'Celsius → Fahrenheit';
  }

  // Re-convert if there is a value
  // convert(); // Removed auto-convert on toggle
}

// Event Listeners
// inputField.addEventListener('input', convert); // Removed instant conversion as per user request

convertBtn.addEventListener('click', () => {
  convert();
  // specific visual feedback if needed, but instant conversion is already there
});

resetBtn.addEventListener('click', () => {
  inputField.value = '';
  outputField.textContent = '--';
  inputField.focus();
});

unitToggle.addEventListener('change', updateUI);

// Initial focus
inputField.focus();
