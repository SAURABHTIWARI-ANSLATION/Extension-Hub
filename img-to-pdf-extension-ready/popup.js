const { jsPDF } = window.jspdf;

const imageInput = document.getElementById("imageInput");
const convertBtn = document.getElementById("convertBtn");

convertBtn.onclick = async () => {
  if (!imageInput.files.length) {
    alert("Please select at least one image");
    return;
  }

  const pdf = new jsPDF();
  const files = [...imageInput.files];

  for (let i = 0; i < files.length; i++) {
    const { dataUrl, format, width, height } = await read(files[i]);

    if (i > 0) pdf.addPage();

    // Calculate dimensions to fit A4 page with margins
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 10; // 10mm margin
    const maxWidth = pageWidth - 2 * margin;
    const maxHeight = pageHeight - 2 * margin;

    let imgWidth = width * 0.264583; // Convert pixels to mm (assuming 96 DPI)
    let imgHeight = height * 0.264583;

    const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
    imgWidth *= scale;
    imgHeight *= scale;

    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    pdf.addImage(
      dataUrl,
      format,     // JPEG or PNG
      x,
      y,
      imgWidth,
      imgHeight
    );
  }

  pdf.save("images-to-pdf.pdf");
};

function read(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const img = new Image();
      img.onload = () => {
        const format = file.type === "image/png" ? "PNG" : "JPEG";
        resolve({ dataUrl, format, width: img.width, height: img.height });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
