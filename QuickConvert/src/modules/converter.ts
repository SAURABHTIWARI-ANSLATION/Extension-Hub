export function renderFormatConverter(container: HTMLElement) {
    // Create main wrapper
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-io';

    // File input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'converter-input';
    fileInput.accept = 'image/*,.svg';
    fileInput.className = 'file-input';

    // UI container
    const ui = document.createElement('div');
    ui.id = 'converter-ui';
    ui.className = 'hidden mt-lg';

    // Preview container
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';

    const previewImg = document.createElement('img');
    previewImg.id = 'preview-image';
    previewImg.className = 'preview-image';

    const svgPreview = document.createElement('div');
    svgPreview.id = 'svg-preview';
    svgPreview.className = 'preview-image display-block svg-preview-box';

    const info = document.createElement('p');
    info.id = 'converter-info';
    info.className = 'mt-md fs-sm text-muted-color';

    previewContainer.appendChild(previewImg);
    previewContainer.appendChild(svgPreview);
    previewContainer.appendChild(info);

    // Settings card
    const settingsCard = document.createElement('div');
    settingsCard.className = 'tool-settings-card mt-lg';

    const labelDiv = document.createElement('div');
    labelDiv.className = 'mb-md';

    const label = document.createElement('label');
    label.className = 'label-styled';
    label.textContent = 'Select Target Format';

    const select = document.createElement('select');
    select.id = 'target-format';
    select.className = 'file-input input-styled';

    ['image/png|PNG (.png)', 'image/jpeg|JPEG (.jpg)', 'image/webp|WebP (.webp)'].forEach(opt => {
        const [value, text] = opt.split('|');
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        select.appendChild(option);
    });

    labelDiv.appendChild(label);
    labelDiv.appendChild(select);

    const convertBtn = document.createElement('button');
    convertBtn.id = 'convert-btn';
    convertBtn.className = 'primary-btn w-full';
    convertBtn.textContent = 'Convert & Download';

    settingsCard.appendChild(labelDiv);
    settingsCard.appendChild(convertBtn);

    ui.appendChild(previewContainer);
    ui.appendChild(settingsCard);

    // Loader
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'hidden';
    loader.textContent = 'Processing...';

    // Status
    const status = document.createElement('div');
    status.id = 'converter-status';
    status.className = 'preview-status';

    toolDiv.appendChild(fileInput);
    toolDiv.appendChild(ui);
    toolDiv.appendChild(loader);
    toolDiv.appendChild(status);

    container.appendChild(toolDiv);

    // Alias for consistency
    const formatSelect = select;

    // Elements already created above, reuse them
    let currentFile: File | null = null;
    let isSvg = false;

    fileInput.onchange = async (e: any) => {
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
                // Safe SVG rendering
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(text, 'image/svg+xml');
                const svgElement = svgDoc.documentElement;
                svgPreview.replaceChildren(svgElement.cloneNode(true));
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
