import imageCompression from 'browser-image-compression';

export async function renderImageReducer(container: HTMLElement) {
    // Create tool wrapper
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-io';

    // File input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'reducer-input';
    fileInput.accept = 'image/*,.heic,.HEIC,.heif,.HEIF';
    fileInput.className = 'file-input';

    // UI Container
    const ui = document.createElement('div');
    ui.id = 'reducer-ui';
    ui.className = 'hidden';

    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';

    const previewStatus = document.createElement('p');
    previewStatus.id = 'reducer-preview-status';
    previewStatus.className = 'fs-sm text-muted-color text-center';

    previewContainer.appendChild(previewStatus);

    const settingsCard = document.createElement('div');
    settingsCard.className = 'tool-settings-card mt-lg';

    // Quality Control
    const qualityDiv = document.createElement('div');
    qualityDiv.className = 'mb-md';

    const qualityLabel = document.createElement('label');
    qualityLabel.className = 'label-styled';
    qualityLabel.textContent = 'Quality: ';

    const qualityVal = document.createElement('span');
    qualityVal.id = 'quality-val';
    qualityVal.className = 'fw-600 accent-text';
    qualityVal.textContent = '0.7';

    qualityLabel.appendChild(qualityVal);

    const qualityRange = document.createElement('input');
    qualityRange.type = 'range';
    qualityRange.id = 'quality-range';
    qualityRange.min = '0.1';
    qualityRange.max = '1';
    qualityRange.step = '0.1';
    qualityRange.value = '0.7';
    qualityRange.className = 'w-full';

    qualityDiv.appendChild(qualityLabel);
    qualityDiv.appendChild(qualityRange);

    // Width Control
    const widthDiv = document.createElement('div');

    const widthLabel = document.createElement('label');
    widthLabel.className = 'label-styled';
    widthLabel.textContent = 'Max Width: ';

    const widthVal = document.createElement('span');
    widthVal.id = 'width-val';
    widthVal.className = 'fw-600 accent-text';
    widthVal.textContent = '1920';

    const widthUnit = document.createTextNode('px');

    widthLabel.appendChild(widthVal);
    widthLabel.appendChild(widthUnit);

    const widthRange = document.createElement('input');
    widthRange.type = 'range';
    widthRange.id = 'width-range';
    widthRange.min = '100';
    widthRange.max = '4000';
    widthRange.step = '100';
    widthRange.value = '1920';
    widthRange.className = 'w-full';

    widthDiv.appendChild(widthLabel);
    widthDiv.appendChild(widthRange);

    settingsCard.appendChild(qualityDiv);
    settingsCard.appendChild(widthDiv);

    // Button
    const btnDiv = document.createElement('div');
    btnDiv.className = 'mt-lg';

    const reduceBtn = document.createElement('button');
    reduceBtn.id = 'reduce-btn';
    reduceBtn.className = 'primary-btn w-full';
    reduceBtn.textContent = 'Compress & Download';

    btnDiv.appendChild(reduceBtn);

    ui.appendChild(previewContainer);
    ui.appendChild(settingsCard);
    ui.appendChild(btnDiv);

    // Loader
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'hidden';
    loader.textContent = 'Compressing... (Processing HEIC if needed)';

    // Status
    const status = document.createElement('div');
    status.id = 'reducer-status';
    status.className = 'preview-status';

    toolDiv.appendChild(fileInput);
    toolDiv.appendChild(ui);
    toolDiv.appendChild(loader);
    toolDiv.appendChild(status);

    container.appendChild(toolDiv);

    // Elements are already created above

    qRange.oninput = () => qVal.innerText = qRange.value;
    wRange.oninput = () => wVal.innerText = wRange.value;

    let currentFile: File | null = null;

    fileInput.onchange = (e: any) => {
        currentFile = e.target.files[0];
        if (currentFile) {
            ui.classList.remove('hidden');
            status.innerText = `Selected: ${currentFile.name}`;
        }
    };

    reduceBtn.onclick = async () => {
        if (!currentFile) return;
        loader.classList.remove('hidden');
        reduceBtn.setAttribute('disabled', 'true');
        status.innerText = 'Initializing compression...';

        try {
            let fileToCompress = currentFile;

            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: parseInt(wRange.value),
                useWebWorker: true,
                initialQuality: parseFloat(qRange.value)
            };

            const compressedFile = await imageCompression(fileToCompress, options);
            const url = URL.createObjectURL(compressedFile);
            const a = document.createElement('a');
            a.href = url;
            a.download = `compressed-${fileToCompress.name}`;
            a.click();
            URL.revokeObjectURL(url);
            status.innerText = 'Compression successful!';
        } catch (error: any) {
            console.error(error);
            alert(`Compression failed: ${error.message || 'Error processing image'}`);
            status.innerText = 'Compression failed.';
        } finally {
            loader.classList.add('hidden');
            reduceBtn.removeAttribute('disabled');
        }
    };
}
