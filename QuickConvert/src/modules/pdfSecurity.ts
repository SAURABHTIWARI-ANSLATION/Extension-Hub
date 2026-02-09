import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export function renderPdfSecurity(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="pdf-security-input" accept="application/pdf" class="file-input" />
            <div id="pdf-security-ui" class="hidden">
                <p id="security-info"></p>
                <div class="tool-controls">
                    <div style="margin-bottom: 1rem;">
                        <input type="password" id="pdf-password" placeholder="Set New Password" class="file-input" style="width: 200px;" />
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <button id="encrypt-btn" class="primary-btn">Add Password & Download</button>
                    </div>
                    <p style="font-size: 0.8rem; color: #666; margin-top: 1rem;">Note: This will secure the PDF visual content with a password. Selectable text may be converted to images for maximum compatibility.</p>
                </div>
            </div>
            <div id="loader" class="hidden">Processing Security...</div>
            <div id="progress" style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-muted);"></div>
        </div>
    `;

    const input = document.getElementById('pdf-security-input') as HTMLInputElement;
    const ui = document.getElementById('pdf-security-ui')!;
    const info = document.getElementById('security-info')!;
    const passInput = document.getElementById('pdf-password') as HTMLInputElement;
    const encryptBtn = document.getElementById('encrypt-btn')!;
    const loader = document.getElementById('loader')!;
    const progress = document.getElementById('progress')!;

    let currentFile: File | null = null;

    input.onchange = (e: any) => {
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
