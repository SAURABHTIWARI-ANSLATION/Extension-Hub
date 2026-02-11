import { jsPDF } from 'jspdf';

export async function renderImageToPdf(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="pdf-input" accept="image/*,.heic,.HEIC,.heif,.HEIF" multiple class="file-input" />
            <div id="pdf-preview" class="hidden">
                <p id="file-count" class="fw-600 mb-md"></p>
                <div class="tool-controls">
                    <button id="generate-pdf-btn" class="primary-btn">Generate PDF & Download</button>
                </div>
            </div>
            <div id="loader" class="hidden">Generating PDF... (Processing HEIC if needed)</div>
            <div id="pdf-status" class="preview-status"></div>
        </div>
    `;

    const input = document.getElementById('pdf-input') as HTMLInputElement;
    const preview = document.getElementById('pdf-preview')!;
    const fileCount = document.getElementById('file-count')!;
    const generateBtn = document.getElementById('generate-pdf-btn')!;
    const loader = document.getElementById('loader')!;
    const status = document.getElementById('pdf-status')!;

    let files: File[] = [];

    input.onchange = (e: any) => {
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
