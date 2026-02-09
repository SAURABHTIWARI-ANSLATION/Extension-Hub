import { Document, Packer, Paragraph, ImageRun } from 'docx';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function renderPdfToDocx(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="pdf-docx-input" accept="application/pdf" class="file-input" />
            <div id="pdf-docx-ui" class="hidden">
                <p id="docx-info"></p>
                <div class="tool-controls">
                    <button id="convert-docx-btn" class="primary-btn">Convert to DOCX & Download</button>
                </div>
            </div>
            <div id="loader" class="hidden">Converting... (Extracting as images to maintain layout)</div>
        </div>
    `;

    const input = document.getElementById('pdf-docx-input') as HTMLInputElement;
    const ui = document.getElementById('pdf-docx-ui')!;
    const info = document.getElementById('docx-info')!;
    const convertBtn = document.getElementById('convert-docx-btn')!;
    const loader = document.getElementById('loader')!;

    let pdfData: ArrayBuffer | null = null;
    let fileName = '';

    input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        fileName = file.name.replace('.pdf', '');
        pdfData = await file.arrayBuffer();
        info.innerText = `Selected: ${file.name}`;
        ui.classList.remove('hidden');
    };

    convertBtn.onclick = async () => {
        if (!pdfData) return;
        loader.classList.remove('hidden');
        convertBtn.setAttribute('disabled', 'true');

        try {
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
            const sections = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d')!;
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport: viewport, canvas }).promise;

                const imageData = canvas.toDataURL('image/png').split(',')[1];

                sections.push({
                    children: [
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: Uint8Array.from(atob(imageData), c => c.charCodeAt(0)),
                                    transformation: {
                                        width: 600, // Roughly A4 width
                                        height: (600 * canvas.height) / canvas.width,
                                    },
                                    type: 'png'
                                }),
                            ],
                        }),
                    ],
                });
            }

            const doc = new Document({ sections });
            const blob = await Packer.toBlob(doc);

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.docx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert('Conversion failed');
        } finally {
            loader.classList.add('hidden');
            convertBtn.removeAttribute('disabled');
        }
    };
}
