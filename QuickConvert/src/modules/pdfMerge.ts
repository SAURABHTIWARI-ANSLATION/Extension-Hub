import { PDFDocument } from 'pdf-lib';

export function renderPdfMerge(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="pdf-merge-input" accept="application/pdf" multiple class="file-input" />
            <div id="pdf-list-container" class="hidden mt-lg">
                <p class="fw-600">Selected Files (Files will be merged in this order):</p>
                <ul id="pdf-file-list" class="merge-list"></ul>
                <div class="tool-controls">
                    <button id="merge-btn" class="primary-btn">Merge & Download PDF</button>
                    <button id="clear-merge-btn" class="danger-btn">Clear All</button>
                </div>
            </div>
            <div id="loader" class="hidden">Merging PDFs...</div>
        </div>
    `;

    const input = document.getElementById('pdf-merge-input') as HTMLInputElement;
    const listContainer = document.getElementById('pdf-list-container')!;
    const fileList = document.getElementById('pdf-file-list')!;
    const mergeBtn = document.getElementById('merge-btn')!;
    const clearBtn = document.getElementById('clear-merge-btn')!;
    const loader = document.getElementById('loader')!;

    let selectedFiles: File[] = [];

    input.onchange = (e: any) => {
        const files = Array.from(e.target.files as FileList);
        selectedFiles = [...selectedFiles, ...files];
        updateFileList();
    };

    function updateFileList() {
        fileList.innerHTML = '';
        if (selectedFiles.length > 0) {
            listContainer.classList.remove('hidden');
            selectedFiles.forEach((file, index) => {
                const li = document.createElement('li');
                li.className = 'merge-item';
                li.innerHTML = `
                    <span>${index + 1}. ${file.name}</span>
                    <button data-index="${index}" class="icon-btn">✕</button>
                `;
                li.querySelector('button')?.addEventListener('click', (e) => {
                    const idx = parseInt((e.currentTarget as HTMLButtonElement).dataset.index!);
                    selectedFiles.splice(idx, 1);
                    updateFileList();
                });
                fileList.appendChild(li);
            });
        } else {
            listContainer.classList.add('hidden');
        }
    }

    clearBtn.onclick = () => {
        selectedFiles = [];
        input.value = '';
        updateFileList();
    };

    mergeBtn.onclick = async () => {
        if (selectedFiles.length < 2) {
            alert('Please select at least 2 PDF files to merge.');
            return;
        }

        loader.classList.remove('hidden');
        mergeBtn.setAttribute('disabled', 'true');

        try {
            const mergedPdf = await PDFDocument.create();

            for (const file of selectedFiles) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const pdfBytes = await mergedPdf.save();
            const blob = new Blob([pdfBytes.buffer as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'merged-document.pdf';
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Merge failed:', error);
            alert('Failed to merge PDFs. One or more files may be corrupted or protected.');
        } finally {
            loader.classList.add('hidden');
            mergeBtn.removeAttribute('disabled');
        }
    };
}
