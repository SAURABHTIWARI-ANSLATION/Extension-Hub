import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

export function renderPdfSplit(container: HTMLElement) {
    // Create tool wrapper
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-io';

    // File input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'pdf-split-input';
    fileInput.accept = 'application/pdf';
    fileInput.className = 'file-input';

    // UI Container
    const ui = document.createElement('div');
    ui.id = 'pdf-split-ui';
    ui.className = 'hidden mt-lg';

    const info = document.createElement('p');
    info.id = 'split-info';
    info.className = 'fw-600 mb-md';

    const settingsCard = document.createElement('div');
    settingsCard.className = 'tool-settings-card';

    const modeDiv = document.createElement('div');
    modeDiv.className = 'mb-md';

    // Radio All
    const labelAll = document.createElement('label');
    const radioAll = document.createElement('input');
    radioAll.type = 'radio';
    radioAll.name = 'split-mode';
    radioAll.value = 'all';
    radioAll.checked = true;
    labelAll.appendChild(radioAll);
    labelAll.appendChild(document.createTextNode(' Extract All Pages (as ZIP)'));
    modeDiv.appendChild(labelAll);
    modeDiv.appendChild(document.createElement('br'));

    // Radio Range
    const labelRange = document.createElement('label');
    const radioRange = document.createElement('input');
    radioRange.type = 'radio';
    radioRange.name = 'split-mode';
    radioRange.value = 'range';
    labelRange.appendChild(radioRange);
    labelRange.appendChild(document.createTextNode(' Extract Specific Range'));
    modeDiv.appendChild(labelRange);

    const rangeContainer = document.createElement('div');
    rangeContainer.id = 'range-input-container';
    rangeContainer.className = 'hidden mb-md';

    const rangeInput = document.createElement('input');
    rangeInput.type = 'text';
    rangeInput.id = 'split-range';
    rangeInput.placeholder = 'e.g. 1-3, 5, 8-10';
    rangeInput.className = 'file-input input-styled';

    rangeContainer.appendChild(rangeInput);

    const splitBtn = document.createElement('button');
    splitBtn.id = 'split-btn';
    splitBtn.className = 'primary-btn w-full';
    splitBtn.textContent = 'Split & Download';

    settingsCard.appendChild(modeDiv);
    settingsCard.appendChild(rangeContainer);
    settingsCard.appendChild(splitBtn);

    ui.appendChild(info);
    ui.appendChild(settingsCard);

    // Loader
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'hidden';
    loader.textContent = 'Splitting PDF...';

    toolDiv.appendChild(fileInput);
    toolDiv.appendChild(ui);
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

    [radioAll, radioRange].forEach(radio => {
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
            const mode = radioRange.checked ? 'range' : 'all';

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
