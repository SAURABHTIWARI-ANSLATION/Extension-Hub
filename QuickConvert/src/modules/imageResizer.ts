export function renderImageResizer(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="resizer-input" accept="image/*" class="file-input" />
            <div id="resizer-ui" class="hidden" style="margin-top: 1.5rem;">
                <div class="preview-container" style="text-align: center; margin-bottom: 1.5rem;">
                    <img id="resizer-preview-img" style="max-width: 100%; max-height: 300px; border-radius: var(--radius-md); box-shadow: var(--shadow-md);" />
                    <p id="resizer-info" style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted);"></p>
                </div>
                
                <div class="tool-controls" style="background: var(--bg-tertiary); padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--card-border);">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div class="input-group">
                            <label style="display: block; font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-secondary);">Width (px)</label>
                            <input type="number" id="resizer-width" class="file-input" style="padding: 0.75rem; border-style: solid;" />
                        </div>
                        <div class="input-group">
                            <label style="display: block; font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-secondary);">Height (px)</label>
                            <input type="number" id="resizer-height" class="file-input" style="padding: 0.75rem; border-style: solid;" />
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                        <input type="checkbox" id="resizer-aspect" checked style="width: 18px; height: 18px; cursor: pointer;" />
                        <label for="resizer-aspect" style="font-size: 0.9rem; cursor: pointer; color: var(--text-secondary);">Lock Aspect Ratio</label>
                    </div>
                    
                    <button id="resize-btn" class="primary-btn" style="width: 100%;">Resize & Download</button>
                </div>
            </div>
            <div id="loader" class="hidden">Resizing image...</div>
        </div>
    `;

    const input = document.getElementById('resizer-input') as HTMLInputElement;
    const ui = document.getElementById('resizer-ui')!;
    const previewImg = document.getElementById('resizer-preview-img') as HTMLImageElement;
    const info = document.getElementById('resizer-info')!;
    const widthInput = document.getElementById('resizer-width') as HTMLInputElement;
    const heightInput = document.getElementById('resizer-height') as HTMLInputElement;
    const aspectCheck = document.getElementById('resizer-aspect') as HTMLInputElement;
    const resizeBtn = document.getElementById('resize-btn')!;
    const loader = document.getElementById('loader')!;

    let originalWidth = 0;
    let originalHeight = 0;
    let currentFile: File | null = null;

    input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        currentFile = file;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                originalWidth = img.width;
                originalHeight = img.height;
                widthInput.value = originalWidth.toString();
                heightInput.value = originalHeight.toString();
                previewImg.src = img.src;
                info.innerText = `Original Size: ${originalWidth} x ${originalHeight} px`;
                ui.classList.remove('hidden');
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    widthInput.oninput = () => {
        if (aspectCheck.checked && originalWidth > 0) {
            const ratio = originalHeight / originalWidth;
            heightInput.value = Math.round(parseInt(widthInput.value) * ratio).toString();
        }
    };

    heightInput.oninput = () => {
        if (aspectCheck.checked && originalHeight > 0) {
            const ratio = originalWidth / originalHeight;
            widthInput.value = Math.round(parseInt(heightInput.value) * ratio).toString();
        }
    };

    resizeBtn.onclick = () => {
        if (!currentFile) return;

        const targetWidth = parseInt(widthInput.value);
        const targetHeight = parseInt(heightInput.value);

        if (isNaN(targetWidth) || isNaN(targetHeight) || targetWidth <= 0 || targetHeight <= 0) {
            alert('Please enter valid dimensions');
            return;
        }

        loader.classList.remove('hidden');
        resizeBtn.setAttribute('disabled', 'true');

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            const mimeType = currentFile!.type || 'image/png';
            const extension = mimeType.split('/')[1] || 'png';

            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `resized-${targetWidth}x${targetHeight}-${currentFile!.name}`;
                    a.click();
                    URL.revokeObjectURL(url);
                }
                loader.classList.add('hidden');
                resizeBtn.removeAttribute('disabled');
            }, mimeType, 0.9);
        };
        img.src = previewImg.src;
    };
}
