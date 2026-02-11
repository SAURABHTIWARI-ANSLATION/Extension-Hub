export function renderImageResizer(container: HTMLElement) {
    // Create tool wrapper
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-io';

    // File input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'resizer-input';
    fileInput.accept = 'image/*';
    fileInput.className = 'file-input';

    // Loader
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'hidden';
    loader.textContent = 'Processing image...';

    // UI Container
    const ui = document.createElement('div');
    ui.id = 'resizer-ui';
    ui.className = 'hidden mt-lg';

    // Preview Section
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';

    const previewImg = document.createElement('img');
    previewImg.id = 'resizer-preview-img';
    previewImg.className = 'preview-image';

    const info = document.createElement('p');
    info.id = 'resizer-info';
    info.className = 'mt-md fs-sm text-muted-color';

    previewContainer.appendChild(previewImg);
    previewContainer.appendChild(info);

    // Settings Card
    const settingsCard = document.createElement('div');
    settingsCard.className = 'tool-settings-card mt-lg';

    const gridDiv = document.createElement('div');
    gridDiv.className = 'grid-2col mb-md';

    // Width Input
    const widthGroup = document.createElement('div');
    widthGroup.className = 'input-group';
    const widthLabel = document.createElement('label');
    widthLabel.className = 'label-styled';
    widthLabel.textContent = 'Width (px)';
    const widthInput = document.createElement('input');
    widthInput.type = 'number';
    widthInput.id = 'resizer-width';
    widthInput.className = 'file-input input-styled';
    widthGroup.appendChild(widthLabel);
    widthGroup.appendChild(widthInput);

    // Height Input
    const heightGroup = document.createElement('div');
    heightGroup.className = 'input-group';
    const heightLabel = document.createElement('label');
    heightLabel.className = 'label-styled';
    heightLabel.textContent = 'Height (px)';
    const heightInput = document.createElement('input');
    heightInput.type = 'number';
    heightInput.id = 'resizer-height';
    heightInput.className = 'file-input input-styled';
    heightGroup.appendChild(heightLabel);
    heightGroup.appendChild(heightInput);

    gridDiv.appendChild(widthGroup);
    gridDiv.appendChild(heightGroup);

    // Aspect Ratio Checkbox
    const aspectDiv = document.createElement('div');
    aspectDiv.className = 'flex-center mb-md';

    const aspectCheck = document.createElement('input');
    aspectCheck.type = 'checkbox';
    aspectCheck.id = 'resizer-aspect';
    aspectCheck.checked = true;
    aspectCheck.className = 'checkbox-styled';

    const aspectLabel = document.createElement('label');
    aspectLabel.htmlFor = 'resizer-aspect';
    aspectLabel.className = 'fs-sm text-secondary-color cursor-pointer';
    aspectLabel.textContent = 'Lock Aspect Ratio';

    aspectDiv.appendChild(aspectCheck);
    aspectDiv.appendChild(aspectLabel);

    // Resize Button
    const resizeBtn = document.createElement('button');
    resizeBtn.id = 'resize-btn';
    resizeBtn.className = 'primary-btn w-full';
    resizeBtn.textContent = 'Resize & Download';

    settingsCard.appendChild(gridDiv);
    settingsCard.appendChild(aspectDiv);
    settingsCard.appendChild(resizeBtn);

    ui.appendChild(previewContainer);
    ui.appendChild(settingsCard);

    // Status
    const status = document.createElement('div');
    status.id = 'resizer-status';
    status.className = 'preview-status';

    toolDiv.appendChild(fileInput);
    toolDiv.appendChild(loader);
    toolDiv.appendChild(ui);
    toolDiv.appendChild(status);

    container.appendChild(toolDiv);

    // Elements are already created above, reuse them

    let originalWidth = 0;
    let originalHeight = 0;
    let currentFile: File | null = null;

    fileInput.onchange = async (e: any) => {
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
