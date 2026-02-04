const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const tabs = document.querySelectorAll('.code-tab');
const runBtn = document.getElementById('runBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');

let active = 'html';
let code = {
  html: localStorage.getItem('html') || '',
  css: localStorage.getItem('css') || '',
  js: localStorage.getItem('js') || ''
};

function loadTab(type) {
  active = type;
  editor.value = code[type];
  tabs.forEach(t => t.classList.toggle('active', t.dataset.type === type));
}

tabs.forEach(t => t.onclick = () => loadTab(t.dataset.type));
loadTab('html');

editor.oninput = () => {
  code[active] = editor.value;
  localStorage.setItem(active, editor.value);
};

runBtn.onclick = () => {
  const src = `
<!DOCTYPE html>
<html>
<head>
<style>${code.css}</style>
</head>
<body>
${code.html}
<script>${code.js}<\/script>
</body>
</html>`;
  preview.srcdoc = src;
};

exportBtn.onclick = () => {
  const blob = new Blob([preview.srcdoc], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'project.html';
  a.click();
};

clearBtn.onclick = () => {
  editor.value = '';
  code[active] = '';
  localStorage.removeItem(active);
};