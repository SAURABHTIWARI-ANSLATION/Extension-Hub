// Content script for highlight-to-convert feature
let tooltip = null;

// Create tooltip element
function createTooltip() {
  const tip = document.createElement('div');
  tip.id = 'convertall-tooltip';

  tip.style.cssText = `
    position: absolute;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
    font-family: system-ui, sans-serif;
    font-size: 14px;
    z-index: 10000;
    display: none;
    max-width: 300px;
    color: #111111;
    cursor: pointer;
  `;

  document.body.appendChild(tip);

  // ✅ Safe click handler (attach here only)
  tip.addEventListener('click', () => {
    const selectedText = window.getSelection().toString().trim();
    const parsed = parseHighlightedText(selectedText);

    if (parsed) {
      chrome.runtime.sendMessage({
        action: 'openConverter',
        data: parsed
      });
    }
  });

  return tip;
}

// Parse highlighted text for numbers and units
function parseHighlightedText(text) {
  const patterns = [
    { regex: /(\d+\.?\d*)\s*(km|m|cm|mm|mi|ft|in)/i, category: 'Length' },
    { regex: /(\d+\.?\d*)\s*(kg|g|lb|oz)/i, category: 'Weight' },
    { regex: /(\d+\.?\d*)\s*(l|ml|gal|cup)/i, category: 'Volume' },
    { regex: /(\d+\.?\d*)\s*°?([CFK])/i, category: 'Temperature' },
    { regex: /(\d+\.?\d*)\s*([€$£¥])/i, category: 'Currency' }
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match) {
      return {
        value: match[1],
        unit: match[2].toLowerCase(),
        category: pattern.category
      };
    }
  }
  return null;
}

// Show tooltip (✅ NO innerHTML)
function showTooltip(x, y, data) {
  if (!tooltip) tooltip = createTooltip();

  // साफ content banate hain safely
  tooltip.textContent = ''; // clear previous

  const title = document.createElement('div');
  title.style.fontWeight = '600';
  title.style.marginBottom = '8px';
  title.textContent = `Convert ${data.value} ${data.unit}`;

  const subtitle = document.createElement('div');
  subtitle.style.color = '#2563EB';
  subtitle.style.fontWeight = '500';
  subtitle.textContent = 'Click to convert in ConvertAll';

  tooltip.appendChild(title);
  tooltip.appendChild(subtitle);

  tooltip.style.display = 'block';
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

// Hide tooltip
function hideTooltip() {
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}

// Listen for text selection
document.addEventListener('mouseup', (e) => {
  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (text) {
    const parsed = parseHighlightedText(text);
    if (parsed) {
      showTooltip(e.pageX, e.pageY, parsed);
    } else {
      hideTooltip();
    }
  } else {
    hideTooltip();
  }
});

// Hide tooltip when clicking elsewhere
document.addEventListener('mousedown', (e) => {
  if (tooltip && !tooltip.contains(e.target)) {
    hideTooltip();
  }
});