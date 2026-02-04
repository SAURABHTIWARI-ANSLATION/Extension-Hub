let cropper;
let isProcessing = false;
const upload = document.getElementById("upload");
const image = document.getElementById("image");
const ratioSelect = document.getElementById("ratio");
const downloadBtn = document.getElementById("download");

// Debounce function for smooth performance
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Throttle function for smooth real-time interactions
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

upload.addEventListener("change", () => {
  if (isProcessing) return;
  
  const file = upload.files[0];
  if (!file) return;

  isProcessing = true;
  const reader = new FileReader();
  
  reader.onload = () => {
    try {
      image.src = reader.result;

      // Ensure image is loaded before initializing cropper
      image.onload = () => {
        if (cropper) {
          cropper.destroy();
        }

        cropper = new Cropper(image, {
          viewMode: 1,
          autoCrop: true,
          autoCropArea: 0.8,
          dragMode: "crop",
          movable: true,
          zoomable: true,
          cropBoxMovable: true,
          cropBoxResizable: true,
          responsive: true,
          restore: true,
          guides: true,
          center: true,
          highlight: true,
          background: true,
          canvas: true,
          ready: () => {
            isProcessing = false;
          }
        });
      };
    } catch (error) {
      console.error("Error loading image:", error);
      isProcessing = false;
    }
  };
  
  reader.onerror = () => {
    console.error("Error reading file");
    isProcessing = false;
  };
  
  reader.readAsDataURL(file);
});

// Debounced ratio change for smooth aspect ratio updates
const handleRatioChange = debounce(() => {
  if (!cropper) return;

  const value = ratioSelect.value;
  let ratio = NaN;

  if (value === "1") ratio = 1;
  if (value === "16/9") ratio = 16 / 9;
  if (value === "4/3") ratio = 4 / 3;

  requestAnimationFrame(() => {
    cropper.setAspectRatio(ratio);
  });
}, 100);

ratioSelect.addEventListener("change", handleRatioChange);

downloadBtn.addEventListener("click", async () => {
  if (!cropper || isProcessing) {
    alert("Please upload and crop an image first");
    return;
  }

  try {
    isProcessing = true;
    downloadBtn.disabled = true;
    downloadBtn.textContent = "Processing...";

    const canvas = cropper.getCroppedCanvas({
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
      maxWidth: 4096,
      maxHeight: 4096,
      fillColor: "#fff",
      imageName: "cropped-image"
    });

    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("Failed to create blob");
        isProcessing = false;
        downloadBtn.disabled = false;
        downloadBtn.textContent = "Download Cropped Image";
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cropped-image.png";
      
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        isProcessing = false;
        downloadBtn.disabled = false;
        downloadBtn.textContent = "Download Cropped Image";
      }, 100);
    }, "image/png", 0.95);
  } catch (error) {
    console.error("Error during download:", error);
    isProcessing = false;
    downloadBtn.disabled = false;
    downloadBtn.textContent = "Download Cropped Image";
  }
});
