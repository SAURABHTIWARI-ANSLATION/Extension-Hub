import * as pdfjsLib from 'pdfjs-dist';
// Set worker source using Vite's URL constructor for reliable bundling
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export async function renderPdfToImage(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="pdf-to-img-input" accept="application/pdf" class="file-input" />
            <div id="pdf-to-img-ui" class="hidden">
                <div id="pdf-info"></div>
                <div class="tool-controls">
                    <button id="extract-imgs-btn" class="primary-btn">Extract All Pages as Images</button>
                </div>
            </div>
            <div id="loader" class="hidden">Extracting...</div>
        </div>
    `;

    const input = document.getElementById('pdf-to-img-input') as HTMLInputElement;
    const ui = document.getElementById('pdf-to-img-ui')!;
    const pdfInfo = document.getElementById('pdf-info')!;
    const extractBtn = document.getElementById('extract-imgs-btn')!;
    const loader = document.getElementById('loader')!;

    let pdfData: ArrayBuffer | null = null;
    let fileName = '';

    input.onchange = async (e: any) => {
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
