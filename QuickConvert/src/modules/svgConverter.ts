export function renderSvgConverter(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="svg-input" accept=".svg" class="file-input" />
            <div id="svg-preview-container" class="hidden mt-lg">
                <div id="svg-display" class="svg-preview-box preview-image mb-md"></div>
                <div class="tool-settings-card">
                    <select id="svg-format" class="file-input input-styled mb-md">
                        <option value="png">Format: PNG</option>
                        <option value="jpeg">Format: JPEG</option>
                        <option value="webp">Format: WebP</option>
                    </select>
                    <button id="convert-svg-btn" class="primary-btn w-full">Convert & Download</button>
                </div>
            </div>
            <div id="loader" class="hidden">Converting SVG...</div>
        </div>
    `;

    const input = document.getElementById('svg-input') as HTMLInputElement;
    const previewContainer = document.getElementById('svg-preview-container')!;
    const svgDisplay = document.getElementById('svg-display')!;
    const formatSelect = document.getElementById('svg-format') as HTMLSelectElement;
    const convertBtn = document.getElementById('convert-svg-btn')!;
    const loader = document.getElementById('loader')!;

    let currentFileContent: string | null = null;
    let fileName = '';

    input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        fileName = file.name.replace(/\.svg$/i, '');
        const reader = new FileReader();
        reader.onload = (event) => {
            currentFileContent = event.target?.result as string;
            svgDisplay.innerHTML = currentFileContent;
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
