import { PDFDocument } from 'pdf-lib';

export async function renderPdfCompressor(container: HTMLElement) {
    // Create tool wrapper
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-io';

    // File input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'pdf-compress-input';
    fileInput.accept = 'application/pdf';
    fileInput.className = 'file-input';

    // UI Container
    const ui = document.createElement('div');
    ui.id = 'pdf-compress-ui';
    ui.className = 'hidden';

    const info = document.createElement('p');
    info.id = 'compress-info';

    const controls = document.createElement('div');
    controls.className = 'tool-controls';

    const compressBtn = document.createElement('button');
    compressBtn.id = 'compress-pdf-btn';
    compressBtn.className = 'primary-btn';
    compressBtn.textContent = 'Compress & Download';

    controls.appendChild(compressBtn);

    ui.appendChild(info);
    ui.appendChild(controls);

    // Loader
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'hidden';
    loader.textContent = 'Compressing... (This might take a while for large files)';

    toolDiv.appendChild(fileInput);
    toolDiv.appendChild(ui);
    toolDiv.appendChild(loader);

    container.appendChild(toolDiv);

    // Elements are already created above

    let currentFile: File | null = null;

    fileInput.onchange = (e: any) => {
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
