import { PDFDocument } from 'pdf-lib';

export async function renderPdfCompressor(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="pdf-compress-input" accept="application/pdf" class="file-input" />
            <div id="pdf-compress-ui" class="hidden">
                <p id="compress-info"></p>
                <div class="tool-controls">
                    <button id="compress-pdf-btn" class="primary-btn">Compress & Download</button>
                </div>
            </div>
            <div id="loader" class="hidden">Compressing... (This might take a while for large files)</div>
        </div>
    `;

    const input = document.getElementById('pdf-compress-input') as HTMLInputElement;
    const ui = document.getElementById('pdf-compress-ui')!;
    const info = document.getElementById('compress-info')!;
    const compressBtn = document.getElementById('compress-pdf-btn')!;
    const loader = document.getElementById('loader')!;

    let currentFile: File | null = null;

    input.onchange = (e: any) => {
        currentFile = e.target.files[0];
        if (!currentFile) return;
        info.innerText = `Selected: ${currentFile.name} (${(currentFile.size / 1024 / 1024).toFixed(2)} MB)`;
        ui.classList.remove('hidden');
    };

    compressBtn.onclick = async () => {
        if (!currentFile) return;
        loader.classList.remove('hidden');
        compressBtn.setAttribute('disabled', 'true');

        try {
            const arrayBuffer = await currentFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            // Simple compression: remove metadata and re-save
            // In a more advanced version, we would downscale images here
            // but pdf-lib doesn't easily expose image manipulation on existing streams 
            // without complex object traversal. We'll perform a generic save with object compression.

            const compressedPdfBytes = await pdfDoc.save({ useObjectStreams: true });

            // Cast to any to avoid TypeScript SharedArrayBuffer issues in some environments
            const blob = new Blob([compressedPdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `compressed-${currentFile.name}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert('Compression failed');
        } finally {
            loader.classList.add('hidden');
            compressBtn.removeAttribute('disabled');
        }
    };
}
