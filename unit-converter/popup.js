const inputValue = document.getElementById("inputValue");
const category = document.getElementById("category");
const fromUnit = document.getElementById("fromUnit");
const toUnit = document.getElementById("toUnit");
const result = document.getElementById("result");
const convertBtn = document.getElementById("convertBtn");

const UNITS = {
  length: {
    meters: 1,
    kilometers: 1000,
    miles: 1609.34,
  },
  weight: {
    grams: 1,
    kilograms: 1000,
    pounds: 453.592,
  },
  temp: ["celsius", "fahrenheit", "kelvin"],
};

// -------------------- Init --------------------

function loadUnits() {
  const cat = category.value;
  fromUnit.innerHTML = "";
  toUnit.innerHTML = "";

  if (Array.isArray(UNITS[cat])) {
    UNITS[cat].forEach((unit) => addOption(unit));
  } else {
    Object.keys(UNITS[cat]).forEach((unit) => addOption(unit));
  }
}

function addOption(unit) {
  fromUnit.appendChild(new Option(unit, unit));
  toUnit.appendChild(new Option(unit, unit));
}

category.addEventListener("change", loadUnits);
convertBtn.addEventListener("click", convert);

loadUnits();

// -------------------- Conversion --------------------

function convert() {
  const val = parseFloat(inputValue.value);
  if (isNaN(val)) {
    result.textContent = "⚠️ Please enter a valid number.";
    return;
  }

  const cat = category.value;
  const from = fromUnit.value;
  const to = toUnit.value;

  if (from === to) {
    result.textContent = `Result: ${val} ${to}`;
    return;
  }

  let converted;

  switch (cat) {
    case "length":
    case "weight":
      converted = convertByMap(val, from, to, UNITS[cat]);
      break;

    case "temp":
      converted = convertTemperature(val, from, to);
      break;

    default:
      result.textContent = "Unsupported category.";
      return;
  }

  result.textContent = `Result: ${converted.toFixed(4)} ${to}`;
}

// -------------------- Helpers --------------------

function convertByMap(value, from, to, map) {
  return (value * map[from]) / map[to];
}

function convertTemperature(value, from, to) {
  let celsius;

  switch (from) {
    case "celsius":
      celsius = value;
      break;
    case "fahrenheit":
      celsius = ((value - 32) * 5) / 9;
      break;
    case "kelvin":
      celsius = value - 273.15;
      break;
    default:
      return NaN;
  }

  switch (to) {
    case "celsius":
      return celsius;
    case "fahrenheit":
      return (celsius * 9) / 5 + 32;
    case "kelvin":
      return celsius + 273.15;
    default:
      return NaN;
  }
}
