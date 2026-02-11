export function renderSvgConverter(container: HTMLElement) {
    // Create main wrapper
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-io';

    // File input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'svg-input';
    fileInput.accept = '.svg';
    fileInput.className = 'file-input';

    // Preview container
    const previewContainer = document.createElement('div');
    previewContainer.id = 'svg-preview-container';
    previewContainer.className = 'hidden mt-lg';

    // SVG display
    const svgDisplay = document.createElement('div');
    svgDisplay.id = 'svg-display';
    svgDisplay.className = 'svg-preview-box preview-image mb-md';

    // Settings card
    const settingsCard = document.createElement('div');
    settingsCard.className = 'tool-settings-card';

    // Format select
    const formatSelect = document.createElement('select');
    formatSelect.id = 'svg-format';
    formatSelect.className = 'file-input input-styled mb-md';

    ['png|Format: PNG', 'jpeg|Format: JPEG', 'webp|Format: WebP'].forEach(opt => {
        const [value, text] = opt.split('|');
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        formatSelect.appendChild(option);
    });

    // Convert button
    const convertBtn = document.createElement('button');
    convertBtn.id = 'convert-svg-btn';
    convertBtn.className = 'primary-btn w-full';
    convertBtn.textContent = 'Convert & Download';

    settingsCard.appendChild(formatSelect);
    settingsCard.appendChild(convertBtn);

    previewContainer.appendChild(svgDisplay);
    previewContainer.appendChild(settingsCard);

    // Loader
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'hidden';
    loader.textContent = 'Converting SVG...';

    toolDiv.appendChild(fileInput);
    toolDiv.appendChild(previewContainer);
    toolDiv.appendChild(loader);

    container.appendChild(toolDiv);

    let currentFileContent: string | null = null;
    let fileName = '';

    fileInput.onchange = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        fileName = file.name.replace(/\.svg$/i, '');
        const reader = new FileReader();
        reader.onload = (event) => {
            currentFileContent = event.target?.result as string;
            // Safe SVG rendering using DOMParser
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(currentFileContent, 'image/svg+xml');
            svgDisplay.replaceChildren(svgDoc.documentElement.cloneNode(true));
            previewContainer.classList.remove('hidden');
        };
        reader.readAsText(file);
    };

    convertBtn.onclick = () => {
        if (!currentFileContent) return;
        loader.classList.remove('hidden');
        convertBtn.setAttribute('disabled', 'true');

        const format = formatSelect.value as 'png' | 'jpeg' | 'webp';
        const svgElement = svgDisplay.querySelector('svg');
        if (!svgElement) {
            alert('Invalid SVG content');
            loader.classList.add('hidden');
            convertBtn.removeAttribute('disabled');
            return;
        }

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Get dimensions from SVG attributes or bounding box
        const width = svgElement.width.baseVal.value || 800;
        const height = svgElement.height.baseVal.value || 600;

        canvas.width = width;
        canvas.height = height;

        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            if (format === 'jpeg') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0, width, height);

            const mimeType = `image/${format}`;
            canvas.toBlob((blob) => {
                if (blob) {
                    const downloadUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = `${fileName}.${format === 'jpeg' ? 'jpg' : format}`;
                    a.click();
                    URL.revokeObjectURL(downloadUrl);
                }
                loader.classList.add('hidden');
                convertBtn.removeAttribute('disabled');
                URL.revokeObjectURL(url);
            }, mimeType, 0.9);
        };

        img.onerror = () => {
            alert('Failed to process SVG');
            loader.classList.add('hidden');
            convertBtn.removeAttribute('disabled');
            URL.revokeObjectURL(url);
        };

        img.src = url;
    };
}
