// Note: Download jspdf.umd.min.js and put it in a /lib folder
const { jsPDF } = window.jspdf || {};

const textInput = document.getElementById("textInput");
const fileNameInput = document.getElementById("fileName");
const charCount = document.getElementById("charCount");
const wordCount = document.getElementById("wordCount");
const pdfBtn = document.getElementById("pdfBtn");
const txtBtn = document.getElementById("txtBtn");

// UI Updates
textInput.addEventListener("input", () => {
  const text = textInput.value;
  const len = text.length;
  
  // Update counters
  charCount.textContent = len;
  wordCount.textContent = `${text.trim() ? text.trim().split(/\s+/).length : 0} words`;
  
  // Toggle buttons
  const isEmpty = len === 0;
  pdfBtn.disabled = txtBtn.disabled = isEmpty;
});

// Improved PDF Generation using jsPDF
pdfBtn.addEventListener("click", () => {
  const text = textInput.value.trim();
  const fileName = (fileNameInput.value.trim() || "document") + ".pdf";

  if (!jsPDF) {
    // Fallback if library isn't loaded
    alert("PDF library loading. Please try again in a second.");
    return;
  }

  const doc = new jsPDF();
  
  // Split text to fit page width (Standard A4)
  const margin = 15;
  const width = 180; 
  const lines = doc.splitTextToSize(text, width);
  
  doc.text(lines, margin, margin + 5);
  doc.save(fileName);
});

// Standard .txt Download
txtBtn.addEventListener("click", () => {
  const text = textInput.value;
  const rawName = fileNameInput.value.trim() || "notes";
  const fileName = rawName.endsWith('.txt') ? rawName : `${rawName}.txt`;

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
});