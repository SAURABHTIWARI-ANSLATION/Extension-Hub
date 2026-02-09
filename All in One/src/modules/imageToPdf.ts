import { jsPDF } from 'jspdf';

export async function renderImageToPdf(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="pdf-input" accept="image/*" multiple class="file-input" />
            <div id="pdf-preview" class="hidden">
                <p id="file-count"></p>
                <div class="tool-controls">
                    <button id="generate-pdf-btn" class="primary-btn">Generate PDF & Download</button>
                </div>
            </div>
            <div id="loader" class="hidden">Generating PDF...</div>
        </div>
    `;

    const input = document.getElementById('pdf-input') as HTMLInputElement;
    const preview = document.getElementById('pdf-preview')!;
    const fileCount = document.getElementById('file-count')!;
    const generateBtn = document.getElementById('generate-pdf-btn')!;
    const loader = document.getElementById('loader')!;

    let files: File[] = [];

    input.onchange = (e: any) => {
        files = Array.from(e.target.files);
        if (files.length === 0) return;

        fileCount.innerText = `${files.length} image(s) selected`;
        preview.classList.remove('hidden');
    };

    generateBtn.onclick = async () => {
        if (files.length === 0) return;
        loader.classList.remove('hidden');
        generateBtn.setAttribute('disabled', 'true');

        const doc = new jsPDF();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const dataUrl = await fileToDataUrl(file);

            if (i > 0) doc.addPage();

            const imgProps = doc.getImageProperties(dataUrl);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            doc.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        }

        doc.save('converted-images.pdf');
        loader.classList.add('hidden');
        generateBtn.removeAttribute('disabled');
    };
}

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
    });
}
