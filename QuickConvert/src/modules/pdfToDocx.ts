import { Document, Packer, Paragraph, ImageRun } from 'docx';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export async function renderPdfToDocx(container: HTMLElement) {
    // Create tool wrapper
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-io';

    // File input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'pdf-docx-input';
    fileInput.accept = 'application/pdf';
    fileInput.className = 'file-input';

    // UI Container
    const ui = document.createElement('div');
    ui.id = 'pdf-docx-ui';
    ui.className = 'hidden';

    const info = document.createElement('p');
    info.id = 'docx-info';

    const controls = document.createElement('div');
    controls.className = 'tool-controls';

    const convertBtn = document.createElement('button');
    convertBtn.id = 'convert-docx-btn';
    convertBtn.className = 'primary-btn';
    convertBtn.textContent = 'Convert to DOCX & Download';

    controls.appendChild(convertBtn);

    ui.appendChild(info);
    ui.appendChild(controls);

    // Loader
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'hidden';
    loader.textContent = 'Converting... (Extracting as images to maintain layout)';

    toolDiv.appendChild(fileInput);
    toolDiv.appendChild(ui);
    toolDiv.appendChild(loader);

    container.appendChild(toolDiv);

    // Elements are already created above

    let pdfData: ArrayBuffer | null = null;
    let fileName = '';

    fileInput.onchange = async (e: any) => {
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
