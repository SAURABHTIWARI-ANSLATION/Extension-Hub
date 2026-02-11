import pptxgen from 'pptxgenjs';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export async function renderPdfToPpt(container: HTMLElement) {
    // Create tool wrapper
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-io';

    // File input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'pdf-ppt-input';
    fileInput.accept = 'application/pdf';
    fileInput.className = 'file-input';

    // UI Container
    const ui = document.createElement('div');
    ui.id = 'pdf-ppt-ui';
    ui.className = 'hidden';

    const info = document.createElement('p');
    info.id = 'ppt-info';

    const controls = document.createElement('div');
    controls.className = 'tool-controls';

    const convertBtn = document.createElement('button');
    convertBtn.id = 'convert-ppt-btn';
    convertBtn.className = 'primary-btn';
    convertBtn.textContent = 'Convert to PPT & Download';

    controls.appendChild(convertBtn);

    ui.appendChild(info);
    ui.appendChild(controls);

    // Loader
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'hidden';
    loader.textContent = 'Converting... (Pages will be converted to high-quality slide images)';

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
            const pptx = new pptxgen();

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d')!;
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport: viewport, canvas }).promise;

                const slide = pptx.addSlide();
                const imageData = canvas.toDataURL('image/png');

                slide.addImage({
                    data: imageData,
                    x: 0,
                    y: 0,
                    w: '100%',
                    h: '100%'
                });
            }

            await pptx.writeFile({ fileName: `${fileName}.pptx` });
        } catch (error) {
            console.error(error);
            alert('Conversion failed');
        } finally {
            loader.classList.add('hidden');
            convertBtn.removeAttribute('disabled');
        }
    };
}
