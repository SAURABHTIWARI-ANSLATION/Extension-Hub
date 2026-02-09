import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

export function renderPdfSplit(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="pdf-split-input" accept="application/pdf" class="file-input" />
            <div id="pdf-split-ui" class="hidden mt-lg">
                <p id="split-info" class="fw-600 mb-md"></p>
                <div class="tool-settings-card">
                    <div class="mb-md">
                        <label><input type="radio" name="split-mode" value="all" checked> Extract All Pages (as ZIP)</label><br>
                        <label><input type="radio" name="split-mode" value="range"> Extract Specific Range</label>
                    </div>
                    <div id="range-input-container" class="hidden mb-md">
                        <input type="text" id="split-range" placeholder="e.g. 1-3, 5, 8-10" class="file-input input-styled" />
                    </div>
                    <button id="split-btn" class="primary-btn w-full">Split & Download</button>
                </div>
            </div>
            <div id="loader" class="hidden">Splitting PDF...</div>
        </div>
    `;

    const input = document.getElementById('pdf-split-input') as HTMLInputElement;
    const ui = document.getElementById('pdf-split-ui')!;
    const info = document.getElementById('split-info')!;
    const splitBtn = document.getElementById('split-btn')!;
    const loader = document.getElementById('loader')!;
    const rangeContainer = document.getElementById('range-input-container')!;
    const rangeInput = document.getElementById('split-range') as HTMLInputElement;

    let currentFile: File | null = null;

    input.onchange = (e: any) => {
        currentFile = e.target.files[0];
        if (!currentFile) return;
        info.innerText = `Selected: ${currentFile.name}`;
        ui.classList.remove('hidden');
    };

    document.querySelectorAll('input[name="split-mode"]').forEach(radio => {
        radio.addEventListener('change', (e: any) => {
            if (e.target.value === 'range') {
                rangeContainer.classList.remove('hidden');
            } else {
                rangeContainer.classList.add('hidden');
            }
        });
    });

    splitBtn.onclick = async () => {
        if (!currentFile) return;
        loader.classList.remove('hidden');
        splitBtn.setAttribute('disabled', 'true');

        try {
            const arrayBuffer = await currentFile.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const totalPages = pdf.getPageCount();
            const mode = (document.querySelector('input[name="split-mode"]:checked') as HTMLInputElement).value;

            let pagesToExtract: number[] = [];

            if (mode === 'all') {
                pagesToExtract = Array.from({ length: totalPages }, (_, i) => i);
            } else {
                const rangeStr = rangeInput.value;
                if (!rangeStr) {
                    alert('Please enter a page range');
                    return;
                }
                // Simple range parser
                const parts = rangeStr.split(',');
                parts.forEach(part => {
                    if (part.includes('-')) {
                        const [start, end] = part.split('-').map(s => parseInt(s.trim()));
                        for (let i = start; i <= end; i++) {
                            if (i > 0 && i <= totalPages) pagesToExtract.push(i - 1);
                        }
                    } else {
                        const page = parseInt(part.trim());
                        if (page > 0 && page <= totalPages) pagesToExtract.push(page - 1);
                    }
                });
                pagesToExtract = [...new Set(pagesToExtract)].sort((a, b) => a - b);
            }

            if (pagesToExtract.length === 0) {
                alert('No valid pages selected');
                return;
            }

            if (mode === 'all' || pagesToExtract.length > 1) {
                const zip = new JSZip();
                for (let i = 0; i < pagesToExtract.length; i++) {
                    const pageIdx = pagesToExtract[i];
                    const newPdf = await PDFDocument.create();
                    const [copiedPage] = await newPdf.copyPages(pdf, [pageIdx]);
                    newPdf.addPage(copiedPage);
                    const pdfBytes = await newPdf.save();
                    zip.file(`page-${pageIdx + 1}.pdf`, pdfBytes);
                }
                const content = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${currentFile.name.replace('.pdf', '')}_split.zip`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                // Just one page
                const newPdf = await PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(pdf, [pagesToExtract[0]]);
                newPdf.addPage(copiedPage);
                const pdfBytes = await newPdf.save();
                const blob = new Blob([pdfBytes.buffer as any], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${currentFile.name.replace('.pdf', '')}_page_${pagesToExtract[0] + 1}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            }

        } catch (error) {
            console.error('Split failed:', error);
            alert('Failed to split PDF');
        } finally {
            loader.classList.add('hidden');
            splitBtn.removeAttribute('disabled');
        }
    };
}
