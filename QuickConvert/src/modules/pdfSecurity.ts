import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export function renderPdfSecurity(container: HTMLElement) {
    // Create tool wrapper
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-io';

    // File input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'pdf-security-input';
    fileInput.accept = 'application/pdf';
    fileInput.className = 'file-input';

    // UI Container
    const ui = document.createElement('div');
    ui.id = 'pdf-security-ui';
    ui.className = 'hidden mt-lg';

    const info = document.createElement('p');
    info.id = 'security-info';
    info.className = 'fw-600 mb-md';

    const settingsCard = document.createElement('div');
    settingsCard.className = 'tool-settings-card';

    const passDiv = document.createElement('div');
    passDiv.className = 'mb-md';

    const passInput = document.createElement('input');
    passInput.type = 'password';
    passInput.id = 'pdf-password';
    passInput.placeholder = 'Set New Password';
    passInput.className = 'file-input input-styled';

    passDiv.appendChild(passInput);

    const btnDiv = document.createElement('div');
    btnDiv.className = 'mb-md';

    const encryptBtn = document.createElement('button');
    encryptBtn.id = 'encrypt-btn';
    encryptBtn.className = 'primary-btn w-full';
    encryptBtn.textContent = 'Add Password & Download';

    btnDiv.appendChild(encryptBtn);

    const note = document.createElement('p');
    note.className = 'fs-xs text-muted-color mt-md';
    note.textContent = 'Note: This will secure the PDF visual content with a password. Selectable text may be converted to images for maximum compatibility.';

    settingsCard.appendChild(passDiv);
    settingsCard.appendChild(btnDiv);
    settingsCard.appendChild(note);

    ui.appendChild(info);
    ui.appendChild(settingsCard);

    // Loader
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'hidden';
    loader.textContent = 'Processing Security...';

    // Progress
    const progress = document.createElement('div');
    progress.id = 'progress';
    progress.className = 'preview-status';

    toolDiv.appendChild(fileInput);
    toolDiv.appendChild(ui);
    toolDiv.appendChild(loader);
    toolDiv.appendChild(progress);

    container.appendChild(toolDiv);

    // Elements are already created above

    let currentFile: File | null = null;

    fileInput.onchange = (e: any) => {
        currentFile = e.target.files[0];
        if (!currentFile) return;
        info.innerText = `Selected: ${currentFile.name}`;
        ui.classList.remove('hidden');
    };

    encryptBtn.onclick = async () => {
        const password = passInput.value;
        if (!password) {
            alert('Please enter a password');
            return;
        }

        if (!currentFile) return;

        loader.classList.remove('hidden');
        encryptBtn.setAttribute('disabled', 'true');
        progress.innerText = 'Starting security processing...';

        try {
            const arrayBuffer = await currentFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            // @ts-ignore - jsPDF types might not include encryption in some versions, but it's supported
            const doc = new jsPDF({
                encryption: {
                    userPassword: password,
                    ownerPassword: password,
                    userPermissions: ['print', 'modify', 'copy', 'annot-forms']
                }
            });

            for (let i = 1; i <= pdf.numPages; i++) {
                progress.innerText = `Securing page ${i} of ${pdf.numPages}...`;
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d')!;
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport: viewport, canvas }).promise;

                const imgData = canvas.toDataURL('image/jpeg', 0.8);

                if (i > 1) doc.addPage();

                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();

                doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
            }

            progress.innerText = 'Finalizing and downloading...';
            doc.save(`${currentFile!.name.replace('.pdf', '')}_protected.pdf`);
            progress.innerText = 'Protected PDF downloaded successfully!';
        } catch (error: any) {
            console.error('Encryption failed:', error);
            alert(`Failed to protect PDF: ${error.message || 'The file might be corrupted or already protected.'}`);
            progress.innerText = 'Failed to protect PDF.';
        } finally {
            loader.classList.add('hidden');
            encryptBtn.removeAttribute('disabled');
        }
    };
}
