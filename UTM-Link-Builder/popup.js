const body = document.body;
const msg = message;

// i18n
document.getElementById('title').textContent = chrome.i18n.getMessage('appName');

// Auto-generate
document.querySelectorAll('input').forEach(i => i.oninput = generate);

function generate() {
  if (!url.value || !source.value || !medium.value || !campaign.value) return;
  try { new URL(url.value); } 
  catch {
    msg.textContent = chrome.i18n.getMessage('invalidUrl');
    return;
  }

  const params = {
    utm_source:source.value,
    utm_medium:medium.value,
    utm_campaign:campaign.value,
    utm_term:term.value,
    utm_content:content.value
  };

  const q = Object.entries(params)
    .filter(([_,v])=>v)
    .map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('&');

  result.value = url.value + (url.value.includes('?')?'&':'?') + q;
}

// Copy
copy.onclick = () => {
  navigator.clipboard.writeText(result.value);
  msg.textContent = chrome.i18n.getMessage('copySuccess');
};

// Clear
clear.onclick = () => {
  document.querySelectorAll('input, textarea').forEach(i=>i.value='');
  msg.textContent = '';
};

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'c') copy.click();
  if (e.ctrlKey && e.key.toLowerCase() === 'u') url.focus();
  if (e.key === 'Escape') clear.click();
});