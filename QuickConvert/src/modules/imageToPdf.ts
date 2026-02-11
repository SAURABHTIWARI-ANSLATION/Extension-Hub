import { jsPDF } from 'jspdf';

export async function renderImageToPdf(container: HTMLElement) {
    // Create tool wrapper
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-io';

    // File input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'pdf-input';
    fileInput.accept = 'image/*,.heic,.HEIC,.heif,.HEIF';
    fileInput.multiple = true;
    fileInput.className = 'file-input';

    // Preview Container
    const preview = document.createElement('div');
    preview.id = 'pdf-preview';
    preview.className = 'hidden';

    const fileCount = document.createElement('p');
    fileCount.id = 'file-count';
    fileCount.className = 'fw-600 mb-md';

    const controls = document.createElement('div');
    controls.className = 'tool-controls';

    const generateBtn = document.createElement('button');
    generateBtn.id = 'generate-pdf-btn';
    generateBtn.className = 'primary-btn';
    generateBtn.textContent = 'Generate PDF & Download';

    controls.appendChild(generateBtn);

    preview.appendChild(fileCount);
    preview.appendChild(controls);

    // Loader
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'hidden';
    loader.textContent = 'Generating PDF... (Processing HEIC if needed)';

    // Status
    const status = document.createElement('div');
    status.id = 'pdf-status';
    status.className = 'preview-status';

    toolDiv.appendChild(fileInput);
    toolDiv.appendChild(preview);
    toolDiv.appendChild(loader);
    toolDiv.appendChild(status);

    container.appendChild(toolDiv);

    // Elements are already created above

    let files: File[] = [];

    fileInput.onchange = (e: any) => {
        files = Array.from(e.target.files);
        if (files.length === 0) return;

        fileCount.innerText = `${files.length} image(s) selected`;
        preview.classList.remove('hidden');
        status.innerText = '';
    };

    generateBtn.onclick = async () => {
        if (files.length === 0) return;
        loader.classList.remove('hidden');
        generateBtn.setAttribute('disabled', 'true');
        status.innerText = 'Initializing PDF generation...';

        try {
            const doc = new jsPDF();

            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                status.innerText = `Processing file ${i + 1} of ${files.length}...`;

                const dataUrl = await fileToDataUrl(file);

                if (i > 0) doc.addPage();

                const imgProps = doc.getImageProperties(dataUrl);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                doc.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }

            doc.save('converted-images.pdf');
            status.innerText = 'PDF Downloaded Successfully!';
        } catch (error: any) {
            console.error('PDF generation failed:', error);
            alert(`Failed to generate PDF: ${error.message || 'Error processing images'}`);
            status.innerText = 'Failed to generate PDF.';
        } finally {
            loader.classList.add('hidden');
            generateBtn.removeAttribute('disabled');
        }
    };
}

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
