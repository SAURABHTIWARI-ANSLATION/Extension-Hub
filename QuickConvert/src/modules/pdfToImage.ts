import * as pdfjsLib from 'pdfjs-dist';
// Set worker source using Vite's URL constructor for reliable bundling
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export async function renderPdfToImage(container: HTMLElement) {
    // Create tool wrapper
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-io';

    // File input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'pdf-to-img-input';
    fileInput.accept = 'application/pdf';
    fileInput.className = 'file-input';

    // UI Container
    const ui = document.createElement('div');
    ui.id = 'pdf-to-img-ui';
    ui.className = 'hidden';

    const pdfInfo = document.createElement('div');
    pdfInfo.id = 'pdf-info';

    const controls = document.createElement('div');
    controls.className = 'tool-controls';

    const extractBtn = document.createElement('button');
    extractBtn.id = 'extract-imgs-btn';
    extractBtn.className = 'primary-btn';
    extractBtn.textContent = 'Extract All Pages as Images';

    controls.appendChild(extractBtn);

    ui.appendChild(pdfInfo);
    ui.appendChild(controls);

    // Loader
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'hidden';
    loader.textContent = 'Extracting...';

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
        pdfInfo.innerText = `Selected: ${file.name}`;
        ui.classList.remove('hidden');
    };

    extractBtn.onclick = async () => {
        if (!pdfData) return;
        loader.classList.remove('hidden');
        extractBtn.setAttribute('disabled', 'true');

        try {
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d')!;
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport: viewport, canvas }).promise;

                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${fileName}-page-${i}.png`;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            }
        } catch (error) {
            console.error(error);
            alert('PDF processing failed');
        } finally {
            loader.classList.add('hidden');
            extractBtn.removeAttribute('disabled');
        }
    };
}
