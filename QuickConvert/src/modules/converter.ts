import heic2any from 'heic2any';

export function renderFormatConverter(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="converter-input" accept="image/*,.heic,.HEIC,.svg" class="file-input" />
            <div id="converter-ui" class="hidden" style="margin-top: 1.5rem;">
                <div class="preview-container" style="text-align: center; margin-bottom: 1.5rem;">
                    <img id="preview-image" style="max-width: 100%; max-height: 300px; border-radius: var(--radius-md); box-shadow: var(--shadow-md);" />
                    <div id="svg-preview" style="max-width: 100%; max-height: 300px; overflow: auto; border-radius: var(--radius-md); display: none; background: #f9f9f9; padding: 1rem;"></div>
                    <p id="converter-info" style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted);"></p>
                </div>
                
                <div class="tool-controls" style="background: var(--bg-tertiary); padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--card-border);">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-secondary);">Select Target Format</label>
                        <select id="target-format" class="file-input" style="padding: 0.75rem; border-style: solid; width: 100%;">
                            <option value="image/png">PNG (.png)</option>
                            <option value="image/jpeg">JPEG (.jpg)</option>
                            <option value="image/webp">WebP (.webp)</option>
                        </select>
                    </div>
                    
                    <button id="convert-btn" class="primary-btn" style="width: 100%;">Convert & Download</button>
                </div>
            </div>
            <div id="loader" class="hidden">Processing... (Converting HEIC/SVG if needed)</div>
            <div id="converter-status" style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-muted); text-align: center;"></div>
        </div>
    `;

    const input = document.getElementById('converter-input') as HTMLInputElement;
    const ui = document.getElementById('converter-ui')!;
    const previewImg = document.getElementById('preview-image') as HTMLImageElement;
    const svgPreview = document.getElementById('svg-preview')!;
    const info = document.getElementById('converter-info')!;
    const convertBtn = document.getElementById('convert-btn')!;
    const loader = document.getElementById('loader')!;
    const formatSelect = document.getElementById('target-format') as HTMLSelectElement;
    const status = document.getElementById('converter-status')!;

    let currentFile: File | null = null;
    let isHeic = false;
    let isSvg = false;

    input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        currentFile = file;
        const ext = file.name.split('.').pop()?.toLowerCase();
        isHeic = ext === 'heic';
        isSvg = ext === 'svg';

        info.innerText = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        status.innerText = '';
        ui.classList.remove('hidden');
        loader.classList.remove('hidden');

        try {
            if (isHeic) {
                previewImg.style.display = 'none';
                svgPreview.style.display = 'none';
                status.innerText = 'Preview not available for HEIC (Direct conversion only)';
                loader.classList.add('hidden');
            } else if (isSvg) {
                const text = await file.text();
                svgPreview.innerHTML = text;
                svgPreview.style.display = 'block';
                previewImg.style.display = 'none';
                loader.classList.add('hidden');
            } else {
                const reader = new FileReader();
                reader.onload = (event) => {
                    previewImg.src = event.target?.result as string;
                    previewImg.style.display = 'inline-block';
                    svgPreview.style.display = 'none';
                    loader.classList.add('hidden');
                };
                reader.readAsDataURL(file);
            }
        } catch (err) {
            console.error(err);
            status.innerText = 'Error loading preview';
            loader.classList.add('hidden');
        }
    };

    convertBtn.onclick = async () => {
        if (!currentFile) return;

        loader.classList.remove('hidden');
        convertBtn.setAttribute('disabled', 'true');
        const targetMime = formatSelect.value;
        const targetExt = targetMime.split('/')[1] === 'jpeg' ? 'jpg' : targetMime.split('/')[1];

        try {
            let imageSource: HTMLImageElement | HTMLCanvasElement | Blob = currentFile;

            if (isHeic) {
                status.innerText = 'Converting HEIC to target format...';
                const heicBlob = await heic2any({
                    blob: currentFile,
                    toType: targetMime,
                    quality: 0.85
                });
                imageSource = Array.isArray(heicBlob) ? heicBlob[0] : heicBlob;
            } else {
                // For SVG and others, use Canvas for better control
                const img = new Image();
                const loadPromise = new Promise((resolve, reject) => {
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                });

                if (isSvg) {
                    const text = await currentFile.text();
                    const blob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' });
                    img.src = URL.createObjectURL(blob);
                } else {
                    img.src = previewImg.src;
                }

                await loadPromise;

                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d')!;

                if (targetMime === 'image/jpeg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                ctx.drawImage(img, 0, 0);

                const finalBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, targetMime, 0.9));
                if (!finalBlob) throw new Error('Canvas conversion failed');
                imageSource = finalBlob;
            }

            const downloadUrl = URL.createObjectURL(imageSource as Blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = currentFile.name.replace(/\.[^/.]+$/, "") + '.' + targetExt;
            a.click();

            status.innerText = 'Conversion successful!';
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        } catch (error: any) {
            console.error(error);
            alert(`Conversion failed: ${error.message || 'Error processing image'}`);
            status.innerText = 'Conversion failed.';
        } finally {
            loader.classList.add('hidden');
            convertBtn.removeAttribute('disabled');
        }
    };
}
