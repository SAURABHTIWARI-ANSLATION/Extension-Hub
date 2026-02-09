import pptxgen from 'pptxgenjs';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export async function renderPdfToPpt(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="pdf-ppt-input" accept="application/pdf" class="file-input" />
            <div id="pdf-ppt-ui" class="hidden">
                <p id="ppt-info"></p>
                <div class="tool-controls">
                    <button id="convert-ppt-btn" class="primary-btn">Convert to PPT & Download</button>
                </div>
            </div>
            <div id="loader" class="hidden">Converting... (Pages will be converted to high-quality slide images)</div>
        </div>
    `;

    const input = document.getElementById('pdf-ppt-input') as HTMLInputElement;
    const ui = document.getElementById('pdf-ppt-ui')!;
    const info = document.getElementById('ppt-info')!;
    const convertBtn = document.getElementById('convert-ppt-btn')!;
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
