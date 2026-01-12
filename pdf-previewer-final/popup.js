
const fileInput = document.getElementById("fileInput");
const pdfViewer = document.getElementById("pdfViewer");
const selectFileBtn = document.getElementById("selectFileBtn");

selectFileBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file || file.type !== "application/pdf") return;

  const fileURL = URL.createObjectURL(file);
  pdfViewer.src = fileURL;
});
