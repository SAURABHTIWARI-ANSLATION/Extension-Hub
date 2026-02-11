import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export function renderPdfOcr(container: HTMLElement) {
    // Create tool wrapper
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-io';

    // File input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'pdf-ocr-input';
    fileInput.accept = 'application/pdf';
    fileInput.className = 'file-input';

    // UI Container
    const ui = document.createElement('div');
    ui.id = 'pdf-ocr-ui';
    ui.className = 'hidden mt-lg';

    const info = document.createElement('p');
    info.id = 'ocr-info';
    info.className = 'fw-600 mb-md';

    const settingsCard = document.createElement('div');
    settingsCard.className = 'tool-settings-card';

    const langSelect = document.createElement('select');
    langSelect.id = 'ocr-lang';
    langSelect.className = 'file-input input-styled mb-md';

    ['eng|English', 'hin|Hindi', 'eng+hin|English + Hindi'].forEach(opt => {
        const [value, text] = opt.split('|');
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        langSelect.appendChild(option);
    });

    const ocrBtn = document.createElement('button');
    ocrBtn.id = 'ocr-btn';
    ocrBtn.className = 'primary-btn w-full';
    ocrBtn.textContent = 'Extract Text (OCR) & Download';

    settingsCard.appendChild(langSelect);
    settingsCard.appendChild(ocrBtn);

    ui.appendChild(info);
    ui.appendChild(settingsCard);

    // Status
    const status = document.createElement('div');
    status.id = 'ocr-status';
    status.className = 'preview-status';

    // Loader
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'hidden';
    loader.textContent = 'Initializing OCR Engine...';

    toolDiv.appendChild(fileInput);
    toolDiv.appendChild(ui);
    toolDiv.appendChild(status);
    toolDiv.appendChild(loader);

    container.appendChild(toolDiv);

    // Elements are already created above

    let currentFile: File | null = null;

    fileInput.onchange = (e: any) => {
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
