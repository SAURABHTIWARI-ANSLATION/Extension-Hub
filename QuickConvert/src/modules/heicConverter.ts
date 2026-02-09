import heic2any from 'heic2any';

export function renderHeicConverter(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="heic-input" accept=".heic,.HEIC,.heif,.HEIF" class="file-input" />
            <div id="heic-preview" class="hidden">
                <div class="preview-container">
                    <p id="heic-info" style="font-weight: 600; font-size: 1.1rem; color: var(--text-primary);"></p>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">HEIC images will be converted in your browser.</p>
                </div>
                
                <div class="tool-controls" style="background: var(--bg-tertiary); padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--card-border);">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-secondary);">Select Output Format</label>
                        <select id="heic-target-format" class="file-input" style="padding: 0.75rem; border-style: solid; width: 100%;">
                            <option value="image/jpeg">JPEG (.jpg)</option>
                            <option value="image/png">PNG (.png)</option>
                            <option value="image/webp">WebP (.webp)</option>
                        </select>
                    </div>
                    
                    <button id="convert-heic-btn" class="primary-btn" style="width: 100%;">Convert & Download</button>
                </div>
            </div>
            <div id="loader" class="hidden">Converting HEIC (this may take a moment)...</div>
            <div id="heic-status" style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-muted); text-align: center;"></div>
        </div>
    `;

    const input = document.getElementById('heic-input') as HTMLInputElement;
    const preview = document.getElementById('heic-preview')!;
    const info = document.getElementById('heic-info')!;
    const convertBtn = document.getElementById('convert-heic-btn')!;
    const loader = document.getElementById('loader')!;
    const status = document.getElementById('heic-status')!;
    const formatSelect = document.getElementById('heic-target-format') as HTMLSelectElement;

    let currentFile: File | null = null;

    input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext !== 'heic' && ext !== 'heif') {
            alert('Please select a valid HEIC or HEIF file');
            return;
        }

        currentFile = file;
        info.innerText = `Selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
        preview.classList.remove('hidden');
        status.innerText = '';
    };

    convertBtn.onclick = async () => {
        if (!currentFile) return;

        loader.classList.remove('hidden');
        convertBtn.setAttribute('disabled', 'true');
        status.innerText = 'Initializing HEIC conversion...';

        try {
            const targetMime = formatSelect.value;
            const targetExt = targetMime.split('/')[1] === 'jpeg' ? 'jpg' : targetMime.split('/')[1];

            console.log(`Converting ${currentFile.name} to ${targetMime}`);

            // Note: heic2any can take some time and might use a lot of memory
            const blob = await heic2any({
                blob: currentFile,
                toType: targetMime,
                quality: 0.85
            });

            const resultBlob = Array.isArray(blob) ? blob[0] : blob;

            if (!(resultBlob instanceof Blob)) {
                throw new Error('Conversion failed: No valid output generated.');
            }

            const url = URL.createObjectURL(resultBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFile.name.replace(/\.[^/.]+$/, "") + '.' + targetExt;
            a.click();

            status.innerText = 'Conversion successful! Download started.';
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error: any) {
            console.error('HEIC conversion failed:', error);
            status.innerText = 'Conversion failed.';
            alert(`HEIC conversion failed: ${error.message || 'The file might be too large or corrupted.'}`);
        } finally {
            loader.classList.add('hidden');
            convertBtn.removeAttribute('disabled');
        }
    };
}
