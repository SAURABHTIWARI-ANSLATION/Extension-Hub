/**
 * specificityService.js
 * CSS specificity engine. Original parser preserved, edge cases patched.
 */

const LEGACY_PSEUDO_ELEMENTS = new Set([
  ':before', ':after', ':first-line', ':first-letter',
  ':selection', ':placeholder', ':marker', ':backdrop',
  ':spelling-error', ':grammar-error'
]);

// Pseudo-classes that take selector lists and contribute c weight
const SELECTOR_LIST_PSEUDO = new Set([':is', ':not', ':has', ':where']);

/**
 * Parse a CSS selector string into typed parts.
 */
function parseSelector(selector) {
  const parts = [];
  let buffer = '';
  let inAttribute    = false;
  let inPseudo       = false;
  let pseudoParenDepth = 0;
  let inString       = false;
  let stringChar     = '';

  for (let i = 0; i < selector.length; i++) {
    const char     = selector[i];
    const nextChar = selector[i + 1];

    // ── String handling ──────────────────────────────────────
    if ((char === '"' || char === "'") && !inString) {
      inString = true; stringChar = char; buffer += char; continue;
    }
    if (inString && char === stringChar) {
      inString = false; buffer += char; continue;
    }
    if (inString) { buffer += char; continue; }

    // ── ID ───────────────────────────────────────────────────
    if (char === '#' && !inAttribute && !inPseudo) {
      if (buffer) { parts.push({ type: 'element', value: buffer }); buffer = ''; }
      let id = ''; let j = i + 1;
      while (j < selector.length && /[a-zA-Z0-9_-]/.test(selector[j])) { id += selector[j]; j++; }
      if (id) parts.push({ type: 'id', value: `#${id}` });
      i = j - 1; continue;
    }

    // ── Class ────────────────────────────────────────────────
    if (char === '.' && !inAttribute && !inPseudo) {
      if (buffer) { parts.push({ type: 'element', value: buffer }); buffer = ''; }
      let cls = ''; let j = i + 1;
      while (j < selector.length && /[a-zA-Z0-9_-]/.test(selector[j])) { cls += selector[j]; j++; }
      if (cls) parts.push({ type: 'class', value: `.${cls}` });
      i = j - 1; continue;
    }

    // ── Attribute ────────────────────────────────────────────
    if (char === '[') {
      inAttribute = true;
      if (buffer) { parts.push({ type: 'element', value: buffer }); buffer = ''; }
      buffer = char; continue;
    }
    if (char === ']' && inAttribute) {
      inAttribute = false; buffer += char;
      parts.push({ type: 'attribute', value: buffer }); buffer = ''; continue;
    }

    // ── Pseudo ───────────────────────────────────────────────
    if (char === ':' && !inAttribute) {
      inPseudo = true;
      if (buffer) { parts.push({ type: 'element', value: buffer }); buffer = ''; }
      buffer = char; continue;
    }

    if (inPseudo) {
      if (char === '(') { pseudoParenDepth++; buffer += char; continue; }
      if (char === ')' && pseudoParenDepth > 0) { pseudoParenDepth--; buffer += char; continue; }
      // Double-colon
      if (char === ':' && buffer === ':') { buffer += ':'; continue; }

      if (pseudoParenDepth === 0 && /[ ,>+~\[.#]/.test(char)) {
        inPseudo = false;
        const pval = buffer.trim();
        const isPE = pval.startsWith('::') || LEGACY_PSEUDO_ELEMENTS.has(pval.toLowerCase().split('(')[0]);
        parts.push({ type: isPE ? 'pseudo-element' : 'pseudo-class', value: pval });
        buffer = ''; i--; continue;
      }
      buffer += char; continue;
    }

    // ── Element ──────────────────────────────────────────────
    if (/[a-zA-Z]/.test(char)) {
      buffer += char; let j = i + 1;
      while (j < selector.length && /[a-zA-Z0-9-]/.test(selector[j])) { buffer += selector[j]; j++; }
      i = j - 1; continue;
    }

    // ── Universal ────────────────────────────────────────────
    if (char === '*') { parts.push({ type: 'universal', value: '*' }); continue; }

    // ── Combinator flush ─────────────────────────────────────
    if (buffer && /[ ,>+~]/.test(char)) {
      parts.push({ type: 'element', value: buffer }); buffer = ''; continue;
    }
    if (!/[ ,>+~]/.test(char)) buffer += char;
  }

  // Flush remaining buffer
  if (buffer) {
    if (buffer.startsWith(':')) {
      const isPE = buffer.startsWith('::') || LEGACY_PSEUDO_ELEMENTS.has(buffer.toLowerCase().split('(')[0]);
      parts.push({ type: isPE ? 'pseudo-element' : 'pseudo-class', value: buffer });
    } else if (buffer === '*') {
      parts.push({ type: 'universal', value: buffer });
    } else if (!inAttribute) {
      parts.push({ type: 'element', value: buffer });
    }
  }

  return parts;
}

/**
 * Numeric score for comparison: base-1000 per tier.
 */
function calculateScore([a, b, c, d]) {
  return (a * 1_000_000) + (b * 10_000) + (c * 100) + d;
}

/**
 * Basic structural validation.
 */
function validateSelector(selector) {
  if (!selector || !selector.trim()) return { valid: false, reason: 'Empty selector' };
  if (/[{}|\\^$@]/.test(selector))   return { valid: false, reason: 'Invalid characters detected' };
  const ob = (selector.match(/\[/g) || []).length;
  const cb = (selector.match(/\]/g) || []).length;
  if (ob !== cb) return { valid: false, reason: 'Unbalanced square brackets' };
  const op = (selector.match(/\(/g) || []).length;
  const cp = (selector.match(/\)/g) || []).length;
  if (op !== cp) return { valid: false, reason: 'Unbalanced parentheses' };
  return { valid: true };
}

/**
 * Main calculation function.
 */
export function calculate(selector) {
  if (!selector || !selector.trim()) throw new Error('Empty selector');

  const v = validateSelector(selector);
  if (!v.valid) throw new Error(v.reason);

  let a = 0, b = 0, c = 0, d = 0;
  const ids = [], classes = [], attributes = [], pseudoClasses = [], elements = [], pseudoElements = [];

  // Inline style shorthand
  if (selector.includes('style=')) a = 1;

  const parts = parseSelector(selector);

  parts.forEach(part => {
    switch (part.type) {
      case 'id':           b++; ids.push(part.value);           break;
      case 'class':        c++; classes.push(part.value);        break;
      case 'attribute':    c++; attributes.push(part.value);     break;
      case 'pseudo-class': c++; pseudoClasses.push(part.value);  break;
      case 'element':      d++; elements.push(part.value);       break;
      case 'pseudo-element': d++; pseudoElements.push(part.value); break;
      case 'universal':    break; // zero contribution
    }
  });

  const specificity = [a, b, c, d];
  const score       = calculateScore(specificity);

  // Smart contextual hints
  const hints = [];
  if (b >= 2)                          hints.push({ type: 'warning', label: 'High Specificity',  detail: 'Multiple IDs — very hard to override' });
  else if (b === 1)                    hints.push({ type: 'info',    label: 'ID Selector',        detail: 'IDs carry high specificity weight' });
  if (c >= 4)                          hints.push({ type: 'warning', label: 'Over-Specific',      detail: `${c} classes/pseudo — difficult to maintain` });
  if (a === 0 && b === 0 && c === 0 && d === 0)
                                       hints.push({ type: 'neutral', label: 'Zero Specificity',   detail: 'Universal selector (*) has no weight' });
  if (d >= 4 && b === 0 && c === 0)    hints.push({ type: 'neutral', label: 'Element-only',       detail: 'Pure element chain — easy to override' });

  return {
    selector,
    specificity,
    score,
    breakdown: { ids, classes, attributes, pseudoClasses, elements, pseudoElements },
    hints
  };
}

/**
 * Compare two specificity results.
 */
export function compare(spec1, spec2) {
  const [a1, b1, c1, d1] = spec1.specificity;
  const [a2, b2, c2, d2] = spec2.specificity;

  if (a1 !== a2) return mkWinner(a1 > a2 ? 1 : 2, 'inline style weight',               a1 > a2 ? a1 : a2, a1 > a2 ? a2 : a1);
  if (b1 !== b2) return mkWinner(b1 > b2 ? 1 : 2, 'ID count',                          b1 > b2 ? b1 : b2, b1 > b2 ? b2 : b1);
  if (c1 !== c2) return mkWinner(c1 > c2 ? 1 : 2, 'class / attribute / pseudo count',  c1 > c2 ? c1 : c2, c1 > c2 ? c2 : c1);
  if (d1 !== d2) return mkWinner(d1 > d2 ? 1 : 2, 'element count',                     d1 > d2 ? d1 : d2, d1 > d2 ? d2 : d1);

  return {
    winner: 0,
    label:  'Equal specificity',
    detail: 'Source order decides',
    why:    'Both selectors have identical specificity tuples. In a real stylesheet, whichever rule appears last in the CSS file wins. Consider refactoring to make the intended rule more specific.'
  };
}

function mkWinner(n, reason, higher, lower) {
  const loser = n === 1 ? 2 : 1;
  return {
    winner: n,
    label:  `Selector ${n} wins`,
    detail: `Higher ${reason} (${higher} vs ${lower})`,
    why: `Selector ${n} wins because its ${reason} is higher (${higher} vs ${lower}). `
       + `CSS specificity is compared position-by-position, left to right: `
       + `inline styles → IDs → classes/attributes/pseudo-classes → elements. `
       + `At the first position where they differ, Selector ${n} has more weight — `
       + `so it overrides Selector ${loser} regardless of source order in the stylesheet.`
  };
}

export { validateSelector };