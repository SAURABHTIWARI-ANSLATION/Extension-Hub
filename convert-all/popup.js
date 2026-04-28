// =====================================================
// CONVERTALL v2.0 — Full Scientific Calculator + Converter
// =====================================================

const categories = {
  Length: {
    m:1,km:1000,cm:0.01,mm:0.001,μm:0.000001,nm:1e-9,
    mi:1609.34,ft:0.3048,in:0.0254,yd:0.9144,nautical_mile:1852,
    light_year:9.461e15,parsec:3.086e16
  },
  Weight: {
    kg:1,g:0.001,mg:0.000001,μg:1e-9,t:1000,
    lb:0.453592,oz:0.0283495,stone:6.35029,carat:0.0002,grain:0.0000648
  },
  Volume: {
    l:1,ml:0.001,m3:1000,cm3:0.001,
    gal:3.78541,qt:0.946353,pt:0.473176,cup:0.236588,
    fl_oz:0.0295735,tbsp:0.0147868,tsp:0.00492892
  },
  Area: {
    m2:1,km2:1000000,cm2:0.0001,mm2:0.000001,
    ha:10000,acre:4046.86,ft2:0.092903,in2:0.00064516,mi2:2589988.11
  },
  Speed: {
    mps:1,kmh:0.277778,mph:0.44704,knot:0.514444,
    fps:0.3048,mach:340.29,c:299792458
  },
  Temperature: { C:'celsius',F:'fahrenheit',K:'kelvin' },
  Time: {
    s:1,ms:0.001,μs:0.000001,min:60,h:3600,
    d:86400,week:604800,month:2592000,year:31536000,
    decade:315360000,century:3153600000
  },
  Energy: {
    J:1,kJ:1000,cal:4.184,kcal:4184,Wh:3600,
    kWh:3600000,eV:1.602e-19,BTU:1055.06
  },
  Power: { W:1,kW:1000,MW:1000000,hp:745.7,BTU_h:0.293071 },
  Pressure: {
    Pa:1,kPa:1000,MPa:1000000,bar:100000,
    psi:6894.76,atm:101325,torr:133.322
  },
  Data: {
    B:1,KB:1024,MB:1048576,GB:1073741824,
    TB:1099511627776,b:0.125,Kb:128,Mb:131072
  },
  Angle: { deg:1,rad:57.2958,grad:0.9,arcmin:0.0166667,arcsec:0.000277778 },
  Frequency: { Hz:1,kHz:1000,MHz:1000000,GHz:1000000000,rpm:0.0166667 },
  Density: { kg_m3:1,g_cm3:1000,lb_ft3:16.0185,lb_gal:119.826 },
  Force: { N:1,kN:1000,lbf:4.44822,dyn:0.00001,kgf:9.80665 },
  Electricity: {
    V:1,kV:1000,mV:0.001,A:1,mA:0.001,
    Ω:1,kΩ:1000,MΩ:1000000,F:1,μF:0.000001
  },
  FuelEconomy: { kmL:1,L100km:100,mpg:0.425144,mpg_imp:0.354006 },
  Number: { dec:10,bin:2,hex:16,oct:8 }
};

// DOM
const els = {
  category:          document.getElementById('category'),
  fromUnit:          document.getElementById('fromUnit'),
  toUnit:            document.getElementById('toUnit'),
  input:             document.getElementById('inputValue'),
  output:            document.getElementById('outputValue'),
  copyBtn:           document.getElementById('copyBtn'),
  swapBtn:           document.getElementById('swapBtn'),
  settingsBtn:       document.getElementById('settingsBtn'),
  settingsModal:     document.getElementById('settingsModal'),
  closeSettings:     document.getElementById('closeSettings'),
  precisionSlider:   document.getElementById('precisionSlider'),
  precisionValue:    document.getElementById('precisionValue'),
  thousandsSep:      document.getElementById('thousandsSeparator'),
  autoCopy:          document.getElementById('autoCopy'),
  recentGrid:        document.getElementById('recentGrid'),
  modeConverter:     document.getElementById('modeConverter'),
  modeCalculator:    document.getElementById('modeCalculator'),
  converterSection:  document.getElementById('converterSection'),
  calculatorSection: document.getElementById('calculatorSection'),
  calcExpression:    document.getElementById('calcExpression'),
  calcResult:        document.getElementById('calcResult'),
  calcHistory:       document.getElementById('calcHistory'),
  themeToggle:       document.getElementById('themeToggle'),
  angleToggle:       document.getElementById('angleToggle')
};

let settings = { precision:4, useThousandsSeparator:true, autoCopy:false, darkMode:false };
let recentConversions = [];

// =====================================================
// SCIENTIFIC CALCULATOR — Full Implementation
// =====================================================

const CALC = {
  // display state
  expr:   '',        // expression string shown top
  result: '',        // live result shown bottom
  history: '',       // last completed expression

  // internal state
  angleMode: 'DEG',  // DEG | RAD | GRAD
  memory:    0,
  memActive: false,
  invMode:   false,

  // entry state
  currentVal: '0',
  prevVal:    '',
  operator:   null,
  waitNext:   false,
  parenDepth: 0,
  fullExpr:   '',     // full expression string for eval-free display

  /* ── Angle conversion ─────────────────────────────── */
  toRad(x) {
    if (this.angleMode === 'RAD')  return x;
    if (this.angleMode === 'GRAD') return x * Math.PI / 200;
    return x * Math.PI / 180;
  },
  fromRad(x) {
    if (this.angleMode === 'RAD')  return x;
    if (this.angleMode === 'GRAD') return x * 200 / Math.PI;
    return x * 180 / Math.PI;
  },

  /* ── Factorial ────────────────────────────────────── */
  factorial(n) {
    if (n < 0 || !Number.isInteger(n) || n > 170) return NaN;
    if (n <= 1) return 1;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  },

  /* ── Format result for display ────────────────────── */
  fmt(n) {
    if (typeof n !== 'number') return String(n);
    if (!isFinite(n)) return n > 0 ? '∞' : n < 0 ? '-∞' : 'Error';
    if (isNaN(n)) return 'Error';
    // Use exponential notation for very large/small numbers
    if (Math.abs(n) >= 1e15 || (Math.abs(n) < 1e-10 && n !== 0)) {
      return n.toExponential(8).replace(/\.?0+e/, 'e');
    }
    // Round to avoid floating point artifacts
    const rounded = parseFloat(n.toPrecision(14));
    return String(rounded);
  },

  /* ── Input a number/digit ─────────────────────────── */
  inputDigit(d) {
    if (this.waitNext) {
      this.currentVal = d === '.' ? '0.' : d;
      this.waitNext = false;
    } else {
      if (d === '.' && this.currentVal.includes('.')) return;
      if (this.currentVal === '0' && d !== '.') {
        this.currentVal = d;
      } else {
        this.currentVal += d;
      }
    }
    this.updateDisplay();
  },

  /* ── Unary ops ────────────────────────────────────── */
  applyUnary(action) {
    const x = parseFloat(this.currentVal);
    if (isNaN(x) && !['pi','e'].includes(action)) return;

    let result;
    let label = '';

    // INV mode flips trig to inverse
    const inv = this.invMode;

    switch(action) {
      /* Trig */
      case 'sin':  result = inv ? this.fromRad(Math.asin(x))  : Math.sin(this.toRad(x));  label = inv ? 'sin⁻¹' : 'sin'; break;
      case 'cos':  result = inv ? this.fromRad(Math.acos(x))  : Math.cos(this.toRad(x));  label = inv ? 'cos⁻¹' : 'cos'; break;
      case 'tan':  result = inv ? this.fromRad(Math.atan(x))  : Math.tan(this.toRad(x));  label = inv ? 'tan⁻¹' : 'tan'; break;
      /* Hyperbolic */
      case 'sinh': result = inv ? Math.asinh(x) : Math.sinh(x); label = inv ? 'sinh⁻¹' : 'sinh'; break;
      case 'cosh': result = inv ? Math.acosh(x) : Math.cosh(x); label = inv ? 'cosh⁻¹' : 'cosh'; break;
      case 'tanh': result = inv ? Math.atanh(x) : Math.tanh(x); label = inv ? 'tanh⁻¹' : 'tanh'; break;
      /* Inverse trig direct buttons */
      case 'asin': result = this.fromRad(Math.asin(x)); label = 'sin⁻¹'; break;
      case 'acos': result = this.fromRad(Math.acos(x)); label = 'cos⁻¹'; break;
      case 'atan': result = this.fromRad(Math.atan(x)); label = 'tan⁻¹'; break;
      /* Log / exp */
      case 'log':   result = inv ? Math.pow(10, x) : Math.log10(x);  label = inv ? '10ˣ' : 'log'; break;
      case 'ln':    result = inv ? Math.exp(x)      : Math.log(x);   label = inv ? 'eˣ'  : 'ln';  break;
      case 'log2':  result = Math.log2(x); label = 'log₂'; break;
      case 'exp':   result = Math.exp(x);  label = 'eˣ';  break;
      case 'exp10': result = Math.pow(10, x); label = '10ˣ'; break;
      /* Power */
      case 'square': result = x * x;              label = 'x²'; break;
      case 'cube':   result = x * x * x;          label = 'x³'; break;
      case 'sqrt':   result = inv ? x * x : Math.sqrt(x);  label = inv ? 'x²' : '√'; break;
      case 'cbrt':   result = Math.cbrt(x);        label = '∛';  break;
      /* Other */
      case 'recip':  result = 1 / x;              label = '1/x'; break;
      case 'abs':    result = Math.abs(x);         label = '|x|'; break;
      case 'fact':   result = this.factorial(Math.round(x)); label = 'n!'; break;
      case 'percent': result = x / 100;            label = '%'; break;
      case 'sign':   result = -x;                  label = '±'; break;
      /* Constants */
      case 'pi':  result = Math.PI;  this.currentVal = this.fmt(Math.PI); this.updateDisplay(); if(inv) this.invMode=false; return;
      case 'e':   result = Math.E;   this.currentVal = this.fmt(Math.E);  this.updateDisplay(); if(inv) this.invMode=false; return;
      default: return;
    }

    this.history = `${label}(${this.currentVal}) =`;
    this.currentVal = this.fmt(result);
    this.waitNext = true;

    if (inv) {
      this.invMode = false;
      document.querySelector('[data-action="inv"]').classList.remove('inv-active');
    }

    this.updateDisplay();
  },

  /* ── Binary operator ──────────────────────────────── */
  applyOperator(op) {
    if (this.operator && !this.waitNext) {
      this.calculate();
    }
    this.prevVal   = this.currentVal;
    this.operator  = op;
    this.waitNext  = true;

    const sym = { add:'+', subtract:'−', multiply:'×', divide:'÷', power:'ˣʸ', nthroot:'ˣ√' };
    this.fullExpr = `${this.currentVal} ${sym[op] || op}`;
    this.updateDisplay();
  },

  /* ── Calculate binary result ──────────────────────── */
  calculate() {
    if (!this.operator || this.prevVal === '') return;
    const a = parseFloat(this.prevVal);
    const b = parseFloat(this.currentVal);
    if (isNaN(a) || isNaN(b)) { this.currentVal = 'Error'; this.updateDisplay(); return; }

    let result;
    switch(this.operator) {
      case 'add':      result = a + b; break;
      case 'subtract': result = a - b; break;
      case 'multiply': result = a * b; break;
      case 'divide':   result = b === 0 ? NaN : a / b; break;
      case 'power':    result = Math.pow(a, b); break;
      case 'nthroot':  result = Math.pow(a, 1 / b); break;
      default: return;
    }

    const sym = { add:'+', subtract:'−', multiply:'×', divide:'÷', power:'^', nthroot:'√' };
    this.history = `${this.prevVal} ${sym[this.operator] || ''} ${this.currentVal} =`;

    this.currentVal = this.fmt(result);
    this.operator   = null;
    this.prevVal    = '';
    this.fullExpr   = '';
    this.waitNext   = true;
    this.updateDisplay();
  },

  /* ── Memory ───────────────────────────────────────── */
  memOp(op) {
    const x = parseFloat(this.currentVal) || 0;
    switch(op) {
      case 'mc': this.memory = 0;     this.memActive = false; break;
      case 'mr': this.currentVal = this.fmt(this.memory); this.waitNext = true; break;
      case 'ms': this.memory = x;     this.memActive = true;  break;
      case 'm+': this.memory += x;    this.memActive = true;  break;
      case 'm-': this.memory -= x;    this.memActive = true;  break;
    }
    // Visual feedback on MR button
    document.querySelectorAll('.mem-btn').forEach(b => {
      b.classList.toggle('mem-active', b.dataset.mem === 'mr' && this.memActive);
    });
    this.updateDisplay();
  },

  /* ── Parenthesis (balanced) ───────────────────────── */
  insertParen() {
    // Simple toggling: open if no unmatched open, else close
    if (this.parenDepth === 0 || this.waitNext) {
      this.fullExpr += (this.fullExpr && !this.fullExpr.endsWith(' ') ? ' ' : '') + '(';
      this.parenDepth++;
    } else {
      this.fullExpr += ' )';
      this.parenDepth--;
    }
    this.updateDisplay();
  },

  /* ── Clear ────────────────────────────────────────── */
  clear() {
    this.currentVal = '0';
    this.prevVal    = '';
    this.operator   = null;
    this.waitNext   = false;
    this.parenDepth = 0;
    this.fullExpr   = '';
    this.invMode    = false;
    document.querySelector('[data-action="inv"]').classList.remove('inv-active');
    this.updateDisplay();
  },

  /* ── Backspace ────────────────────────────────────── */
  backspace() {
    if (this.waitNext) return;
    this.currentVal = this.currentVal.length > 1 ? this.currentVal.slice(0,-1) : '0';
    this.updateDisplay();
  },

  /* ── INV toggle ───────────────────────────────────── */
  toggleInv() {
    this.invMode = !this.invMode;
    const btn = document.querySelector('[data-action="inv"]');
    if (btn) btn.classList.toggle('inv-active', this.invMode);

    // Swap button labels
    const swaps = [
      ['sin','sin⁻¹'],['cos','cos⁻¹'],['tan','tan⁻¹'],
      ['log','10ˣ'],['ln','eˣ'],['sqrt','x²']
    ];
    swaps.forEach(([norm, inv]) => {
      const b = document.querySelector(`[data-action="${norm}"]`);
      if (b) b.textContent = this.invMode ? inv : norm;
    });
  },

  /* ── Update display ───────────────────────────────── */
  updateDisplay() {
    if (els.calcHistory) {
      els.calcHistory.textContent = this.history || '';
    }
    if (els.calcExpression) {
      els.calcExpression.textContent = this.fullExpr
        ? `${this.fullExpr} ${this.waitNext ? '' : this.currentVal}`
        : this.currentVal;
    }
    if (els.calcResult) {
      els.calcResult.textContent = (this.operator && !this.waitNext)
        ? '' : '';
    }
  },

  /* ── Set angle mode ───────────────────────────────── */
  setAngleMode(mode) {
    this.angleMode = mode;
    document.querySelectorAll('.angle-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
  }
};

/* ── Button handler ───────────────────────────────────── */
function handleCalcBtn(action, value) {
  if (value !== undefined) {
    CALC.inputDigit(value);
    return;
  }

  switch(action) {
    case 'clear':     CALC.clear();          break;
    case 'backspace': CALC.backspace();       break;
    case 'sign':      CALC.applyUnary('sign'); break;
    case 'percent':   CALC.applyUnary('percent'); break;
    case 'paren':     CALC.insertParen();     break;
    case 'add':case'subtract':case'multiply':case'divide':
    case 'power':case'nthroot':
      CALC.applyOperator(action); break;
    case 'equals':    CALC.calculate();       break;
    case 'inv':       CALC.toggleInv();       break;
    /* all unary functions */
    default:          CALC.applyUnary(action); break;
  }
}

function setupCalculator() {
  CALC.clear();

  document.querySelectorAll('.calc-btn').forEach(btn => {
    btn.removeEventListener('click', btn._calcHandler);
    btn._calcHandler = function() {
      handleCalcBtn(this.dataset.action, this.dataset.value);
    };
    btn.addEventListener('click', btn._calcHandler);
  });

  // Angle mode
  if (els.angleToggle) {
    els.angleToggle.querySelectorAll('.angle-btn').forEach(b => {
      b.addEventListener('click', () => CALC.setAngleMode(b.dataset.mode));
    });
  }

  // Memory
  document.querySelectorAll('.mem-btn').forEach(b => {
    b.addEventListener('click', () => CALC.memOp(b.dataset.mem));
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (!els.calculatorSection || els.calculatorSection.classList.contains('hidden')) return;
    const k = e.key;
    if (k >= '0' && k <= '9') { CALC.inputDigit(k); return; }
    if (k === '.') { CALC.inputDigit('.'); return; }
    if (k === '+') { e.preventDefault(); CALC.applyOperator('add'); return; }
    if (k === '-') { e.preventDefault(); CALC.applyOperator('subtract'); return; }
    if (k === '*') { e.preventDefault(); CALC.applyOperator('multiply'); return; }
    if (k === '/') { e.preventDefault(); CALC.applyOperator('divide'); return; }
    if (k === '^') { e.preventDefault(); CALC.applyOperator('power'); return; }
    if (k === 'Enter' || k === '=') { e.preventDefault(); CALC.calculate(); return; }
    if (k === 'Escape') { CALC.clear(); return; }
    if (k === 'Backspace') { e.preventDefault(); CALC.backspace(); return; }
    if (k === '%') { CALC.applyUnary('percent'); return; }
  });
}

// =====================================================
// THEME
// =====================================================
function toggleTheme() {
  settings.darkMode = !settings.darkMode;
  applyTheme(); saveSettings();
}
function applyTheme() {
  document.body.classList.toggle('dark-mode', settings.darkMode);
  if (els.themeToggle) {
    els.themeToggle.textContent = settings.darkMode ? '☀️' : '🌙';
    els.themeToggle.title = settings.darkMode ? 'Light Mode' : 'Dark Mode';
  }
}

// =====================================================
// CONVERTER
// =====================================================
async function init() {
  await loadSettings();
  await loadRecent();
  populateCategories();
  setupEventListeners();
  loadUnits();
  setupCalculator();
  applyTheme();
  toggleMode('converter');
  // Re-init dropdowns after dynamic option population
  setTimeout(() => {
    if (window.CADropdowns) {
      CADropdowns.sync('category');
      CADropdowns.sync('fromUnit');
      CADropdowns.sync('toUnit');
    }
  }, 200);
}

async function loadSettings() {
  try {
    const stored = await chrome.storage.sync.get({
      precision:4,useThousandsSeparator:true,autoCopy:false,darkMode:false
    });
    settings = stored;
    if (els.precisionSlider)  els.precisionSlider.value  = settings.precision;
    if (els.precisionValue)   els.precisionValue.textContent = settings.precision;
    if (els.thousandsSep)     els.thousandsSep.checked   = settings.useThousandsSeparator;
    if (els.autoCopy)         els.autoCopy.checked        = settings.autoCopy;
  } catch(e) { console.error(e); }
}

async function saveSettings() {
  try {
    if (els.precisionSlider) settings.precision = parseInt(els.precisionSlider.value);
    if (els.thousandsSep)    settings.useThousandsSeparator = els.thousandsSep.checked;
    if (els.autoCopy)        settings.autoCopy = els.autoCopy.checked;
    await chrome.storage.sync.set(settings);
    convert();
  } catch(e) { console.error(e); }
}

async function loadRecent() {
  try {
    const stored = await chrome.storage.local.get({ recent: [] });
    recentConversions = stored.recent.slice(0, 6);
    updateRecentUI();
  } catch(e) {}
}

async function saveRecent(c) {
  try {
    recentConversions.unshift(c);
    recentConversions = recentConversions.slice(0,6);
    await chrome.storage.local.set({ recent: recentConversions });
    updateRecentUI();
  } catch(e) {}
}

function updateRecentUI() {
  if (!els.recentGrid) return;
  els.recentGrid.innerHTML = '';
  if (!recentConversions.length) {
    const d = document.createElement('div');
    d.className = 'recent-item';
    d.className = 'recent-item recent-empty';
    d.textContent = 'No recent conversions';
    els.recentGrid.appendChild(d);
    return;
  }
  recentConversions.forEach(conv => {
    const item = document.createElement('div');
    item.className = 'recent-item';
    const fd = document.createElement('div'); fd.className='from'; fd.textContent=`${conv.value} ${conv.fromUnit}`;
    const td = document.createElement('div'); td.className='to';   td.textContent=`= ${conv.result} ${conv.toUnit}`;
    item.appendChild(fd); item.appendChild(td);
    item.addEventListener('click', () => {
      els.category.value = conv.category;
      loadUnits();
      setTimeout(() => {
        els.fromUnit.value = conv.from;
        els.toUnit.value   = conv.to;
        els.input.value    = conv.value;
        if (window.CADropdowns) {
          CADropdowns.sync('fromUnit');
          CADropdowns.sync('toUnit');
        }
        convert();
      }, 100);
    });
    els.recentGrid.appendChild(item);
  });
}

function populateCategories() {
  if (!els.category) return;
  els.category.innerHTML = Object.keys(categories)
    .map(c => `<option value="${c}">${c}</option>`).join('');
}

function loadUnits() {
  if (!els.category||!els.fromUnit||!els.toUnit) return;
  const cat   = els.category.value;
  const units = Object.keys(categories[cat]);
  const opts  = units.map(u=>`<option value="${u}">${formatUnitName(u)}</option>`).join('');
  els.fromUnit.innerHTML = opts;
  els.toUnit.innerHTML   = opts;
  if (units.length > 1) els.toUnit.value = units[1];
  if (window.CADropdowns) {
    CADropdowns.sync('fromUnit');
    CADropdowns.sync('toUnit');
  }
  convert();
}

function formatUnitName(u) {
  const n = {
    m:'Meter',km:'Kilometer',cm:'Centimeter',mm:'Millimeter',μm:'Micrometer',nm:'Nanometer',
    mi:'Mile',ft:'Foot',in:'Inch',yd:'Yard',nautical_mile:'Nautical Mile',
    light_year:'Light Year',parsec:'Parsec',
    kg:'Kilogram',g:'Gram',mg:'Milligram',μg:'Microgram',t:'Metric Ton',
    lb:'Pound',oz:'Ounce',stone:'Stone',carat:'Carat',grain:'Grain',
    l:'Liter',ml:'Milliliter',m3:'Cubic Meter',cm3:'Cubic cm',
    gal:'Gallon',qt:'Quart',pt:'Pint',cup:'Cup',fl_oz:'Fluid Ounce',tbsp:'Tablespoon',tsp:'Teaspoon',
    m2:'Sq Meter',km2:'Sq km',ha:'Hectare',acre:'Acre',ft2:'Sq Foot',in2:'Sq Inch',mi2:'Sq Mile',
    mps:'m/s',kmh:'km/h',mph:'mph',knot:'Knot',fps:'ft/s',mach:'Mach',c:'Light Speed',
    C:'Celsius',F:'Fahrenheit',K:'Kelvin',
    s:'Second',ms:'Millisecond',μs:'Microsecond',min:'Minute',h:'Hour',
    d:'Day',week:'Week',month:'Month',year:'Year',decade:'Decade',century:'Century',
    J:'Joule',kJ:'Kilojoule',cal:'Calorie',kcal:'Kilocalorie',Wh:'Wh',kWh:'kWh',eV:'eV',BTU:'BTU',
    W:'Watt',kW:'Kilowatt',MW:'Megawatt',hp:'Horsepower',BTU_h:'BTU/h',
    Pa:'Pascal',kPa:'kPa',MPa:'MPa',bar:'Bar',psi:'psi',atm:'Atmosphere',torr:'Torr',
    B:'Byte',KB:'Kilobyte',MB:'Megabyte',GB:'Gigabyte',TB:'Terabyte',b:'Bit',Kb:'Kilobit',Mb:'Megabit',
    deg:'Degree',rad:'Radian',grad:'Gradian',arcmin:'Arcminute',arcsec:'Arcsecond',
    Hz:'Hertz',kHz:'kHz',MHz:'MHz',GHz:'GHz',rpm:'RPM',
    kg_m3:'kg/m³',g_cm3:'g/cm³',lb_ft3:'lb/ft³',lb_gal:'lb/gal',
    N:'Newton',kN:'kN',lbf:'lbf',dyn:'Dyne',kgf:'kgf',
    V:'Volt',kV:'kV',mV:'mV',A:'Ampere',mA:'mA',Ω:'Ohm',kΩ:'kΩ',MΩ:'MΩ',F:'Farad',μF:'μF',
    kmL:'km/L',L100km:'L/100km',mpg:'MPG(US)',mpg_imp:'MPG(UK)',
    dec:'Decimal',bin:'Binary',hex:'Hexadecimal',oct:'Octal'
  };
  return n[u]||u;
}

function formatNumber(num) {
  if (num===undefined||num===null||isNaN(num)) return '0';
  if (!settings.useThousandsSeparator) return num.toString();
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,',');
  return parts.join('.');
}

function convertTemperature(v,from,to) {
  let c = from==='C'?v : from==='F'?(v-32)*5/9 : v-273.15;
  return to==='C'?c : to==='F'?c*9/5+32 : c+273.15;
}

function convertNumber(v,from,to) {
  try {
    const bases={dec:10,bin:2,hex:16,oct:8};
    const dec = parseInt(v, bases[from]);
    if (isNaN(dec)) return 'Invalid';
    return dec.toString(bases[to]).toUpperCase();
  } catch { return 'Error'; }
}

function convert() {
  if (!els.input||!els.output||!els.category||!els.fromUnit||!els.toUnit) return;
  const val   = els.input.value.trim();
  const cat   = els.category.value;
  const from  = els.fromUnit.value;
  const to    = els.toUnit.value;
  if (!val) { els.output.value=''; return; }

  let result;
  try {
    if (cat==='Temperature') {
      result = convertTemperature(parseFloat(val),from,to);
      if (isNaN(result)) { els.output.value='Invalid'; return; }
    } else if (cat==='Number') {
      els.output.value = convertNumber(val,from,to); return;
    } else {
      const n = parseFloat(val);
      if (isNaN(n)) { els.output.value='Invalid'; return; }
      const base = n * categories[cat][from];
      result = base / categories[cat][to];
      const f = Math.pow(10, settings.precision);
      result  = Math.round(result*f)/f;
    }
    const fmt = formatNumber(result);
    els.output.value = fmt;
    if (val && !isNaN(result)) {
      saveRecent({from,to,fromUnit:formatUnitName(from),toUnit:formatUnitName(to),value:val,result:fmt,category:cat});
    }
    if (settings.autoCopy && fmt) copyToClipboard(fmt,false);
  } catch(e) { els.output.value='Error'; }
}

function swapUnits() {
  const t = els.fromUnit.value;
  els.fromUnit.value = els.toUnit.value;
  els.toUnit.value   = t;
  if (window.CADropdowns) { CADropdowns.sync('fromUnit'); CADropdowns.sync('toUnit'); }
  convert();
}

async function copyToClipboard(text=els.output.value, showFeedback=true) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    if (showFeedback && els.copyBtn) {
      const orig = els.copyBtn.innerHTML;
      els.copyBtn.innerHTML = '<span>✓</span> Copied!';
      setTimeout(() => els.copyBtn.innerHTML=orig, 2000);
    }
  } catch(e) {}
}

function toggleMode(mode) {
  const toCalc = mode==='calculator';
  els.modeConverter.classList.toggle('active', !toCalc);
  els.modeCalculator.classList.toggle('active', toCalc);
  els.converterSection.classList.toggle('hidden', toCalc);
  els.calculatorSection.classList.toggle('hidden', !toCalc);
  if (toCalc) setupCalculator();
}

function toggleSettings() {
  if (els.settingsModal) els.settingsModal.classList.toggle('hidden');
}

function setupEventListeners() {
  if (els.category)    els.category.addEventListener('change', () => { loadUnits(); if(window.CADropdowns){CADropdowns.sync('category');} });
  if (els.fromUnit)    els.fromUnit.addEventListener('change', convert);
  if (els.toUnit)      els.toUnit.addEventListener('change', convert);
  if (els.input)       els.input.addEventListener('input', convert);
  if (els.copyBtn)     els.copyBtn.addEventListener('click', ()=>copyToClipboard());
  if (els.swapBtn)     els.swapBtn.addEventListener('click', swapUnits);
  if (els.settingsBtn) els.settingsBtn.addEventListener('click', toggleSettings);
  if (els.closeSettings) els.closeSettings.addEventListener('click', toggleSettings);
  if (els.themeToggle) els.themeToggle.addEventListener('click', toggleTheme);
  if (els.modeConverter)  els.modeConverter.addEventListener('click', ()=>toggleMode('converter'));
  if (els.modeCalculator) els.modeCalculator.addEventListener('click', ()=>toggleMode('calculator'));
  if (els.precisionSlider) els.precisionSlider.addEventListener('input', e => {
    if (els.precisionValue) els.precisionValue.textContent = e.target.value;
    saveSettings();
  });
  if (els.thousandsSep) els.thousandsSep.addEventListener('change', saveSettings);
  if (els.autoCopy)     els.autoCopy.addEventListener('change', saveSettings);
  if (els.settingsModal) els.settingsModal.addEventListener('click', e => {
    if (e.target===els.settingsModal) toggleSettings();
  });
}

document.addEventListener('DOMContentLoaded', init);
