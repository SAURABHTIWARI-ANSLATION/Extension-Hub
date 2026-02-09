export function renderFormatConverter(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="converter-input" accept="image/*,.svg" class="file-input" />
            <div id="converter-ui" class="hidden mt-lg">
                <div class="preview-container">
                    <img id="preview-image" class="preview-image" />
                    <div id="svg-preview" class="preview-image display-block svg-preview-box"></div>
                    <p id="converter-info" class="mt-md fs-sm text-muted-color"></p>
                </div>
                
                <div class="tool-settings-card mt-lg">
                    <div class="mb-md">
                        <label class="label-styled">Select Target Format</label>
                        <select id="target-format" class="file-input input-styled">
                            <option value="image/png">PNG (.png)</option>
                            <option value="image/jpeg">JPEG (.jpg)</option>
                            <option value="image/webp">WebP (.webp)</option>
                        </select>
                    </div>
                    
                    <button id="convert-btn" class="primary-btn w-full">Convert & Download</button>
                </div>
            </div>
            <div id="loader" class="hidden">Processing...</div>
            <div id="converter-status" class="preview-status"></div>
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
    let isSvg = false;

    input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        currentFile = file;
        const ext = file.name.split('.').pop()?.toLowerCase();
        isSvg = ext === 'svg';

        info.innerText = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        status.innerText = '';
        ui.classList.remove('hidden');
        loader.classList.remove('hidden');

        try {
            if (isSvg) {
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

            const downloadUrl = URL.createObjectURL(finalBlob);
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
