const elements = {
  qrImage: document.querySelector("#qr-image"),
  qrInput: document.querySelector("#qr-text"),
  generateBtn: document.querySelector("#generate-btn"),
  downloadBtn: document.querySelector("#download-btn"),
  copyBtn: document.querySelector("#copy-btn"),
  clearBtn: document.querySelector("#clear-btn"),
  loadingOverlay: document.querySelector("#loading-overlay"),
};

// --- QR Generation Logic ---

const getQRUrl = (text) => {
  if (!text.trim()) return "";
  // Using higher resolution and margin for better quality
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=300x300&margin=15`;
};

const updateQR = () => {
  const text = elements.qrInput.value;
  if (!text.trim()) return;

  // Show loading spinner
  elements.loadingOverlay.classList.remove("hidden");

  // Create a new image to preload it before swapping
  const newImg = new Image();
  newImg.onload = () => {
    elements.qrImage.src = newImg.src;
    elements.loadingOverlay.classList.add("hidden");
  };
  newImg.onerror = () => {
    elements.loadingOverlay.classList.add("hidden");
    // Could handle error state here if needed
  };
  newImg.src = getQRUrl(text);
};

// --- Event Listeners ---

// Generate Button
elements.generateBtn.addEventListener("click", updateQR);

// Enter Key Support
elements.qrInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") updateQR();
});

// Clear Input
elements.clearBtn.addEventListener("click", () => {
  elements.qrInput.value = "";
  elements.qrInput.focus();
});

// Download Functionality
elements.downloadBtn.addEventListener("click", () => {
  const text = elements.qrInput.value;
  if (!text.trim()) {
      // If empty, maybe shake input or just return. 
      // For now, let's try to generate if there is value, or focus input
      elements.qrInput.focus();
      return;
  }
  
  // Ensure we have the latest QR
  const url = getQRUrl(text);
  
  fetch(url)
    .then((resp) => resp.blob())
    .then((blob) => {
      const anchor = document.createElement("a");
      anchor.style.display = "none";
      const objectURL = window.URL.createObjectURL(blob);
      anchor.href = objectURL;
      anchor.download = "qrcode.png";
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(objectURL);
      document.body.removeChild(anchor);
    })
    .catch((err) => console.error("Download failed:", err));
});

// Copy Functionality
elements.copyBtn.addEventListener("click", async () => {
  const text = elements.qrInput.value;
  if (!text.trim()) {
      elements.qrInput.focus();
      return;
  }

  try {
     const url = getQRUrl(text);
     const response = await fetch(url);
     const blob = await response.blob();
     
     // Clipboard API requires the page to be focused, which is usually true for ext popup
     await navigator.clipboard.write([
         new ClipboardItem({
             [blob.type]: blob
         })
     ]);
     
     // Visual feedback
     const originalText = elements.copyBtn.querySelector("span").innerText;
     elements.copyBtn.querySelector("span").innerText = "Copied!";
     setTimeout(() => {
         elements.copyBtn.querySelector("span").innerText = originalText;
     }, 2000);
     
  } catch (err) {
      console.error("Copy failed:", err);
      // Fallback or error indication
  }
});

