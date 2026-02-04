const fileInput = document.getElementById("fileInput");
const output = document.getElementById("output");
const convertBtn = document.getElementById("convertBtn");
const downloadBtn = document.getElementById("downloadBtn");
const copyBtn = document.getElementById("copyBtn");
const dropZone = document.getElementById("dropZone");
const themeToggle = document.getElementById("themeToggle");
const modeSelect = document.getElementById("mode");
const progressWrap = document.getElementById("progressWrap");
const progressBar = document.getElementById("progressBar");

let convertedData = "";
let worker;

if (localStorage.theme === "dark") {
  document.body.classList.add("dark");
  themeToggle.checked = true;
}
themeToggle.onchange = () => {
  document.body.classList.toggle("dark");
  localStorage.theme = document.body.classList.contains("dark") ? "dark" : "light";
};

dropZone.onclick = () => fileInput.click();
dropZone.ondragover = e => e.preventDefault();
dropZone.ondrop = e => {
  e.preventDefault();
  fileInput.files = e.dataTransfer.files;
};

convertBtn.onclick = () => {
  if (!fileInput.files.length) {
    output.textContent = "Select a file first.";
    return;
  }

  progressWrap.classList.remove("hidden");
  progressBar.style.width = "0%";
  output.textContent = "Processing...";
  downloadBtn.disabled = true;
  copyBtn.disabled = true;

  if (worker) worker.terminate();
  worker = new Worker("worker.js");

  const reader = new FileReader();
  reader.onload = () => {
    worker.postMessage({
      mode: modeSelect.value,
      text: reader.result
    });
  };
  reader.readAsText(fileInput.files[0]);

  worker.onmessage = e => {
    const { type, data } = e.data;
    if (type === "progress") {
      progressBar.style.width = data + "%";
    }
    if (type === "done") {
      convertedData = data;
      output.textContent = data;
      downloadBtn.disabled = false;
      copyBtn.disabled = false;
      progressWrap.classList.add("hidden");
    }
    if (type === "error") {
      output.textContent = data;
      progressWrap.classList.add("hidden");
    }
  };
};

downloadBtn.onclick = () => {
  const ext = modeSelect.value === "csv2json" ? "json" : "csv";
  const blob = new Blob([convertedData], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `converted.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
};

copyBtn.onclick = async () => {
  await navigator.clipboard.writeText(convertedData);
  copyBtn.textContent = "Copied";
  setTimeout(() => copyBtn.textContent = "Copy", 1200);
};
