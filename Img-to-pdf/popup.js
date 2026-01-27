const imageInput = document.getElementById("imageInput");
const convertBtn = document.getElementById("convertBtn");
const statusMsg = document.getElementById("statusMsg");
const fileCount = document.getElementById("fileCount");

imageInput.onchange = () => {
  const count = imageInput.files.length;
  fileCount.textContent = count > 0 ? `${count} file(s) selected` : "No files selected";
  statusMsg.textContent = "";
};

convertBtn.onclick = async () => {
  if (!imageInput.files.length) {
    statusMsg.textContent = "Please select images first.";
    statusMsg.style.color = "red";
    return;
  }

  try {
    convertBtn.disabled = true;
    statusMsg.style.color = "#1976d2";
    
    const imageDataList = [];
    const files = [...imageInput.files];

    // 1. Process all images first
    for (let i = 0; i < files.length; i++) {
      convertBtn.textContent = `Processing ${i + 1}/${files.length}...`;
      const imgData = await imageToJpegData(files[i]);
      imageDataList.push(imgData);
    }

    // 2. Generate PDF using our custom function
    convertBtn.textContent = "Generating PDF...";
    const pdfBlob = generatePDFWithoutLibrary(imageDataList);

    // 3. Download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfBlob);
    link.download = "images-to-pdf.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    statusMsg.textContent = "Success! PDF Downloaded.";
    imageInput.value = "";
    fileCount.textContent = "No files selected";

  } catch (error) {
    console.error(error);
    statusMsg.textContent = "Error: " + error.message;
    statusMsg.style.color = "red";
  } finally {
    convertBtn.disabled = false;
    convertBtn.textContent = "Convert to PDF";
  }
};

/**
 * Helper: Converts any image file to a clean JPEG data object
 * using HTML Canvas. This standardizes all inputs.
 */
function imageToJpegData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        // Fill white background (handles transparent PNGs)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Get JPEG data (without the "data:image/jpeg;base64," prefix)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const cleanData = dataUrl.split(',')[1];
        resolve({
          width: img.width,
          height: img.height,
          data: cleanData
        });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * CORE LOGIC: Manually constructs a valid PDF file structure
 */
function generatePDFWithoutLibrary(images) {
  let objects = [];
  let kids = []; // Stores references to page objects
  let xref = [];
  let currentObjId = 1;
  let currentOffset = 0;
  let buffer = [];

  function addObj(content) {
    const id = currentObjId++;
    const objStr = `${id} 0 obj\n${content}\nendobj\n`;
    xref.push(currentOffset);
    currentOffset += objStr.length;
    buffer.push(objStr);
    return id;
  }

  // PDF Header
  const header = "%PDF-1.4\n";
  currentOffset += header.length;
  buffer.push(header);

  // --- Create Images & Pages ---
  
  images.forEach(img => {
    // 1. Create Image Object (XObject)
    const imgObjId = addObj(
      `<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.data.length} >>\nstream\n` +
      atob(img.data) + 
      `\nendstream`
    );

    // Calculate dimensions to fit A4 (595.28 x 841.89 points)
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 20;
    
    // Scale logic
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - (margin * 2);
    const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
    const displayW = img.width * scale;
    const displayH = img.height * scale;
    const x = (pageWidth - displayW) / 2;
    const y = (pageHeight - displayH) / 2;

    // 2. Content Stream (Places the image)
    // q = save state, cm = transformation matrix, Do = draw object, Q = restore state
    const contentStream = `q ${displayW} 0 0 ${displayH} ${x} ${y} cm /I1 Do Q`;
    const contentObjId = addObj(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`);

    // 3. Page Object
    const pageId = addObj(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentObjId} 0 R /Resources << /XObject << /I1 ${imgObjId} 0 R >> >> >>`
    );
    
    kids.push(`${pageId} 0 R`);
  });

  // --- Root Objects ---

  // Pages Catalog (ID 2 is reserved for Parent in our loop)
  // We use a placeholder logic: We need to insert the Parent object NOW, 
  // but we needed its children first. In raw PDF, order strictly doesn't matter for IDs, 
  // but we must track offsets correctly.
  
  // Actually, let's just append the Parent object now that we have the Kids list.
  // Note: In strict PDF generation, we usually pre-allocate IDs. 
  // Here, we just add it at the end and reference it by the ID we reserved (which is currentObjId).
  
  const pagesObjId = addObj(`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`);
  
  // Root Catalog
  const catalogObjId = addObj(`<< /Type /Catalog /Pages ${pagesObjId} 0 R >>`);

  // Fix: The Page Objects referred to "2 0 R" as parent, but our `pagesObjId` might be different.
  // To keep it simple, we will replace "2 0 R" in the buffer with the actual ID.
  // (A simple string replacement on the buffer is risky with binary data).
  // BETTER APPROACH: Let's reconstruct with correct IDs in a second pass or just use a fixed ID structure.
  
  // SIMPLIFIED FIX FOR THIS SCRIPT:
  // We will force the Pages object to be ID 2.
  // This means we must insert it early, but we didn't know the kids yet.
  // The workaround: Objects can appear in any order in the file!
  // We will define ID 2 *now* with the known kids, but place it physically at the end.
  // Wait, no. We used `currentObjId`.
  
  // Let's Rewind slightly for the cleanest solution:
  // We will manually construct the buffer array in order.
  
  // Re-run with fixed IDs logic:
  // 1. Catalog = ID 1
  // 2. Pages = ID 2
  // 3+ ... content
  
  // Let's clear and restart the buffer construction for safety.
  xref = [];
  buffer = [];
  currentOffset = 0;
  
  // Header
  buffer.push(header);
  currentOffset += header.length;

  // Placeholder for offsets (we will calculate them as we go)
  // We need to know IDs beforehand or update references.
  
  // Let's just generate the body and track offsets.
  // We reserved ID 1 for Catalog, ID 2 for Pages.
  // Images start at ID 3.
  
  let bodyBuffer = [];
  let kidsRefs = [];
  let nextId = 3;

  images.forEach(img => {
    // Image Object
    const imgId = nextId++;
    const imgStream = atob(img.data);
    const imgContent = `<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgStream.length} >>\nstream\n${imgStream}\nendstream`;
    
    // Page Content Stream
    const contentId = nextId++;
    // A4 dims
    const pW = 595.28, pH = 841.89, m=20;
    const maxW = pW-2*m, maxH = pH-2*m;
    const scale = Math.min(maxW/img.width, maxH/img.height);
    const dW = (img.width*scale).toFixed(2);
    const dH = (img.height*scale).toFixed(2);
    const dx = ((pW-dW)/2).toFixed(2);
    const dy = ((pH-dH)/2).toFixed(2);
    
    const streamData = `q ${dW} 0 0 ${dH} ${dx} ${dy} cm /I1 Do Q`;
    const pageContent = `<< /Length ${streamData.length} >>\nstream\n${streamData}\nendstream`;

    // Page Object
    const pageId = nextId++;
    const pageObj = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pW} ${pH}] /Contents ${contentId} 0 R /Resources << /XObject << /I1 ${imgId} 0 R >> >> >>`;

    kidsRefs.push(`${pageId} 0 R`);

    // Store in temp array (content, id)
    bodyBuffer.push({ id: imgId, content: imgContent });
    bodyBuffer.push({ id: contentId, content: pageContent });
    bodyBuffer.push({ id: pageId, content: pageObj });
  });

  // Now create Root and Pages objects
  const catalogContent = `<< /Type /Catalog /Pages 2 0 R >>`;
  const pagesContent = `<< /Type /Pages /Kids [${kidsRefs.join(' ')}] /Count ${kidsRefs.length} >>`;

  // Final Assembly in order: 1 (Catalog), 2 (Pages), 3... (Rest)
  const allObjects = [
    { id: 1, content: catalogContent },
    { id: 2, content: pagesContent },
    ...bodyBuffer
  ];

  // Write content and build XREF
  let xrefTable = [`0000000000 65535 f \n`]; // Entry 0
  
  allObjects.forEach(obj => {
    const offsetStr = String(currentOffset).padStart(10, '0');
    xrefTable.push(`${offsetStr} 00000 n \n`);
    
    const objStr = `${obj.id} 0 obj\n${obj.content}\nendobj\n`;
    buffer.push(objStr);
    currentOffset += objStr.length;
  });

  // Footer (XREF + Trailer)
  const xrefOffset = currentOffset;
  buffer.push(`xref\n0 ${allObjects.length + 1}\n`);
  buffer.push(xrefTable.join(''));
  buffer.push(`trailer\n<< /Size ${allObjects.length + 1} /Root 1 0 R >>\n`);
  buffer.push(`startxref\n${xrefOffset}\n%%EOF`);

  // Convert buffer to Uint8Array (binary safe)
  // We mixed strings and binary data (atob result) in the buffer strings.
  // To save correctly, we need to map string characters to bytes.
  
  const rawData = buffer.join("");
  const len = rawData.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = rawData.charCodeAt(i) & 0xff;
  }

  return new Blob([bytes], { type: "application/pdf" });
}