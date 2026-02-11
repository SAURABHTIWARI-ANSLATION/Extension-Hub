import { PDFDocument } from 'pdf-lib';

export function renderPdfMerge(container: HTMLElement) {
    // Create tool wrapper
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-io';

    // File input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'pdf-merge-input';
    fileInput.accept = 'application/pdf';
    fileInput.multiple = true;
    fileInput.className = 'file-input';

    // List container
    const listContainer = document.createElement('div');
    listContainer.id = 'pdf-list-container';
    listContainer.className = 'hidden mt-lg';

    const listTitle = document.createElement('p');
    listTitle.className = 'fw-600';
    listTitle.textContent = 'Selected Files (Files will be merged in this order):';

    const fileList = document.createElement('ul');
    fileList.id = 'pdf-file-list';
    fileList.className = 'merge-list';

    const controls = document.createElement('div');
    controls.className = 'tool-controls';

    const mergeBtn = document.createElement('button');
    mergeBtn.id = 'merge-btn';
    mergeBtn.className = 'primary-btn';
    mergeBtn.textContent = 'Merge & Download PDF';

    const clearBtn = document.createElement('button');
    clearBtn.id = 'clear-merge-btn';
    clearBtn.className = 'danger-btn';
    clearBtn.textContent = 'Clear All';

    controls.appendChild(mergeBtn);
    controls.appendChild(clearBtn);

    listContainer.appendChild(listTitle);
    listContainer.appendChild(fileList);
    listContainer.appendChild(controls);

    // Loader
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'hidden';
    loader.textContent = 'Merging PDFs...';

    toolDiv.appendChild(fileInput);
    toolDiv.appendChild(listContainer);
    toolDiv.appendChild(loader);

    container.appendChild(toolDiv);

    // Elements already created above
    let selectedFiles: File[] = [];

    fileInput.onchange = (e: any) => {
        const files = Array.from(e.target.files as FileList);
        selectedFiles = [...selectedFiles, ...files];
        updateFileList();
    };

    function updateFileList() {
        fileList.replaceChildren(); // Safe clear
        if (selectedFiles.length > 0) {
            listContainer.classList.remove('hidden');
            selectedFiles.forEach((file, index) => {
                const li = document.createElement('li');
                li.className = 'merge-item';

                const span = document.createElement('span');
                span.textContent = `${index + 1}. ${file.name}`;

                const removeBtn = document.createElement('button');
                removeBtn.className = 'icon-btn';
                removeBtn.textContent = '✕';
                removeBtn.dataset.index = index.toString();

                li.appendChild(span);
                li.appendChild(removeBtn);

                removeBtn.addEventListener('click', (e) => {
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
        fileInput.value = '';
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
