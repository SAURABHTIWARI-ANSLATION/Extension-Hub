export function renderImageResizer(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="resizer-input" accept="image/*" class="file-input" />
            <div id="loader" class="hidden">Processing image...</div>
            <div id="resizer-ui" class="hidden mt-lg">
                <div class="preview-container">
                    <img id="resizer-preview-img" class="preview-image" />
                    <p id="resizer-info" class="mt-md fs-sm text-muted-color"></p>
                </div>
                
                <div class="tool-settings-card mt-lg">
                    <div class="grid-2col mb-md">
                        <div class="input-group">
                            <label class="label-styled">Width (px)</label>
                            <input type="number" id="resizer-width" class="file-input input-styled" />
                        </div>
                        <div class="input-group">
                            <label class="label-styled">Height (px)</label>
                            <input type="number" id="resizer-height" class="file-input input-styled" />
                        </div>
                    </div>
                    
                    <div class="flex-center mb-md">
                        <input type="checkbox" id="resizer-aspect" checked class="checkbox-styled" />
                        <label for="resizer-aspect" class="fs-sm text-secondary-color cursor-pointer">Lock Aspect Ratio</label>
                    </div>
                    
                    <button id="resize-btn" class="primary-btn w-full">Resize & Download</button>
                </div>
            </div>
            <div id="resizer-status" class="preview-status"></div>
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
    const status = document.getElementById('resizer-status')!;

    let originalWidth = 0;
    let originalHeight = 0;
    let currentFile: File | null = null;

    input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        currentFile = file;

        loader.classList.remove('hidden');
        ui.classList.add('hidden');
        status.innerText = 'Loading image...';

        try {
            const imageSrc = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target?.result as string);
                reader.readAsDataURL(file);
            });

            const img = new Image();
            img.onload = () => {
                originalWidth = img.width;
                originalHeight = img.height;
                widthInput.value = originalWidth.toString();
                heightInput.value = originalHeight.toString();
                previewImg.src = img.src;
                info.innerText = `Original Size: ${originalWidth} x ${originalHeight} px`;
                ui.classList.remove('hidden');
                loader.classList.add('hidden');
                status.innerText = '';
            };
            img.src = imageSrc;
        } catch (err) {
            console.error(err);
            status.innerText = 'Error loading image.';
            loader.classList.add('hidden');
        }
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
        if (!currentFile || !previewImg.src) return;

        const targetWidth = parseInt(widthInput.value);
        const targetHeight = parseInt(heightInput.value);

        if (isNaN(targetWidth) || isNaN(targetHeight) || targetWidth <= 0 || targetHeight <= 0) {
            alert('Please enter valid dimensions');
            return;
        }

        loader.classList.remove('hidden');
        resizeBtn.setAttribute('disabled', 'true');
        status.innerText = 'Resizing...';

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            const mimeType = currentFile!.type || 'image/png';
            const extension = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : (mimeType.split('/')[1] || 'png');

            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `resized-${targetWidth}x${targetHeight}-${currentFile!.name.replace(/\.[^/.]+$/, "")}.${extension}`;
                    a.click();
                    URL.revokeObjectURL(url);
                    status.innerText = 'Resize successful!';
                }
                loader.classList.add('hidden');
                resizeBtn.removeAttribute('disabled');
            }, mimeType, 0.9);
        };
        img.src = previewImg.src;
    };
}
