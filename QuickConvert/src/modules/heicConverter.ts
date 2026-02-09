import heic2any from 'heic2any';

export function renderHeicConverter(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="heic-input" accept=".heic" class="file-input" />
            <div id="heic-preview" class="hidden">
                <p id="heic-info"></p>
                <div class="tool-controls">
                    <button id="convert-heic-btn" class="primary-btn">Convert to JPEG & Download</button>
                </div>
            </div>
            <div id="loader" class="hidden">Converting HEIC (this may take a moment)...</div>
        </div>
    `;

    const input = document.getElementById('heic-input') as HTMLInputElement;
    const preview = document.getElementById('heic-preview')!;
    const info = document.getElementById('heic-info')!;
    const convertBtn = document.getElementById('convert-heic-btn')!;
    const loader = document.getElementById('loader')!;

    let currentFile: File | null = null;

    input.onchange = (e: any) => {
        currentFile = e.target.files[0];
        if (!currentFile) return;

        info.innerText = `Selected: ${currentFile.name}`;
        preview.classList.remove('hidden');
    };

    convertBtn.onclick = async () => {
        if (!currentFile) return;
        loader.classList.remove('hidden');
        convertBtn.setAttribute('disabled', 'true');

        try {
            console.log('Starting HEIC conversion for:', currentFile.name);
            const blob = await heic2any({
                blob: currentFile,
                toType: 'image/jpeg',
                quality: 0.8
            });

            console.log('Conversion result:', blob);

            const resultBlob = Array.isArray(blob) ? blob[0] : blob;

            if (!(resultBlob instanceof Blob)) {
                throw new Error('Conversion did not return a valid Blob');
            }

            const url = URL.createObjectURL(resultBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFile.name.replace(/\.[^/.]+$/, "") + '.jpg';
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error: any) {
            console.error('HEIC conversion failed:', error);
            alert(`HEIC conversion failed: ${error.message || 'Unknown error'}. Please ensure it's a valid HEIC file.`);
        } finally {
            loader.classList.add('hidden');
            convertBtn.removeAttribute('disabled');
        }
    };
}
