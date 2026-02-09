import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export function renderPdfOcr(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="pdf-ocr-input" accept="application/pdf" class="file-input" />
            <div id="pdf-ocr-ui" class="hidden mt-lg">
                <p id="ocr-info" class="fw-600 mb-md"></p>
                <div class="tool-settings-card">
                    <select id="ocr-lang" class="file-input input-styled mb-md">
                        <option value="eng">English</option>
                        <option value="hin">Hindi</option>
                        <option value="eng+hin">English + Hindi</option>
                    </select>
                    <button id="ocr-btn" class="primary-btn w-full">Extract Text (OCR) & Download</button>
                </div>
            </div>
            <div id="ocr-status" class="preview-status"></div>
            <div id="loader" class="hidden">Initializing OCR Engine...</div>
        </div>
    `;

    const input = document.getElementById('pdf-ocr-input') as HTMLInputElement;
    const ui = document.getElementById('pdf-ocr-ui')!;
    const info = document.getElementById('ocr-info')!;
    const ocrBtn = document.getElementById('ocr-btn')!;
    const loader = document.getElementById('loader')!;
    const status = document.getElementById('ocr-status')!;
    const langSelect = document.getElementById('ocr-lang') as HTMLSelectElement;

    let currentFile: File | null = null;

    input.onchange = (e: any) => {
        currentFile = e.target.files[0];
        if (!currentFile) return;
        info.innerText = `Selected: ${currentFile.name}`;
        ui.classList.remove('hidden');
    };

    ocrBtn.onclick = async () => {
        if (!currentFile) return;
        loader.classList.remove('hidden');
        ocrBtn.setAttribute('disabled', 'true');
        status.innerText = 'Converting PDF pages to images...';

        try {
            const arrayBuffer = await currentFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            console.log('PDF to Text: Initializing worker with local assets...');
            const worker = await createWorker(langSelect.value, 1, {
                // IMPORTANT for Manifest V3: Use local paths to avoid remote CDN blocks (CSP)
                // @ts-ignore
                workerPath: chrome.runtime.getURL('tesseract/worker.min.js'),
                // @ts-ignore
                corePath: chrome.runtime.getURL('tesseract/tesseract-core.js'),
                // @ts-ignore
                langPath: chrome.runtime.getURL('tesseract'),
                workerBlobURL: false,
                // Disable cache to prevent worker from trying to fetch from remote URL stored in IndexedDB
                cacheMethod: 'none',
                // IMPORTANT: Disable gzip because we provided uncompressed .traineddata files
                gzip: false,
                logger: m => {
                    console.log('Tesseract log:', m);
                    if (m.status === 'recognizing text') {
                        status.innerText = `Recognizing text: ${Math.round(m.progress * 100)}%`;
                    }
                }
            });

            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                status.innerText = `Processing Page ${i} of ${pdf.numPages}...`;
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d')!;
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport: viewport, canvas }).promise;

                const { data: { text } } = await worker.recognize(canvas);
                fullText += `--- Page ${i} ---\n\n${text}\n\n`;
            }

            await worker.terminate();

            const blob = new Blob([fullText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentFile.name.replace('.pdf', '')}_ocr.txt`;
            a.click();
            URL.revokeObjectURL(url);
            status.innerText = 'OCR Completed Successfully!';

        } catch (error) {
            console.error('OCR failed:', error);
            alert('OCR failed. Make sure the PDF is not corrupted.');
            status.innerText = 'OCR Failed.';
        } finally {
            loader.classList.add('hidden');
            ocrBtn.removeAttribute('disabled');
        }
    };
}
