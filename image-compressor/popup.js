const fileInput = document.getElementById("fileInput");
const qualityInput = document.getElementById("quality");
const qualityVal = document.getElementById("qualityVal");
const compressBtn = document.getElementById("compressBtn");
const info = document.getElementById("info");
const fileNameEl = document.getElementById("fileName");

let file = null;

// -------------------- UI Bindings --------------------

qualityInput.addEventListener("input", () => {
  qualityVal.textContent = `${qualityInput.value}%`;
});

fileInput.addEventListener("change", e => {
  handleFile(e.target.files[0]);
});

// Drag & drop support
const dropzone = document.querySelector(".dropzone");
if (dropzone) {
  dropzone.addEventListener("dragover", e => {
    e.preventDefault();
    dropzone.classList.add("hover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("hover");
  });

  dropzone.addEventListener("drop", e => {
    e.preventDefault();
    dropzone.classList.remove("hover");
    handleFile(e.dataTransfer.files[0]);
  });
}

compressBtn.addEventListener("click", startCompression);

// -------------------- Logic --------------------

function handleFile(selectedFile) {
  if (!selectedFile || !selectedFile.type.startsWith("image/")) {
    info.textContent = "⚠️ Please select a valid image file.";
    return;
  }

  file = selectedFile;
  compressBtn.disabled = false;
  info.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  if (fileNameEl) fileNameEl.textContent = file.name;
}

function startCompression() {
  if (!file) return;

  info.textContent = "Compressing...";

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => compressImage(img);
    img.onerror = () => info.textContent = "Failed to load image.";
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function compressImage(img) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const quality = qualityInput.value / 100;

  canvas.toBlob(blob => {
    if (!blob) {
      info.textContent = "Compression failed.";
      return;
    }

    downloadBlob(blob);
    info.textContent = `Original: ${(file.size / 1024).toFixed(1)} KB → Compressed: ${(blob.size / 1024).toFixed(1)} KB`;
  }, "image/jpeg", quality);
}

// -------------------- Helpers --------------------

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `compressed-${file.name.replace(/\.[^/.]+$/, ".jpg")}`;
  a.click();
  URL.revokeObjectURL(url);
}
