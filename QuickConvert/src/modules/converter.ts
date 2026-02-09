export function renderFormatConverter(container: HTMLElement, targetFormat: 'jpeg' | 'png' | 'webp') {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="converter-input" accept="image/*" class="file-input" />
            <div id="converter-preview" class="hidden">
                <img id="preview-image" style="max-width: 100%; max-height: 300px; border-radius: 0.5rem;" />
                <div class="tool-controls">
                    <button id="convert-btn" class="primary-btn">Convert to ${targetFormat.toUpperCase()} & Download</button>
                </div>
            </div>
            <div id="loader" class="hidden">Processing...</div>
        </div>
    `;

    const input = document.getElementById('converter-input') as HTMLInputElement;
    const preview = document.getElementById('converter-preview')!;
    const previewImg = document.getElementById('preview-image') as HTMLImageElement;
    const convertBtn = document.getElementById('convert-btn')!;
    const loader = document.getElementById('loader')!;

    let currentFile: File | null = null;

    input.onchange = (e: any) => {
        currentFile = e.target.files[0];
        if (!currentFile) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            previewImg.src = event.target?.result as string;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(currentFile);
    };

    convertBtn.onclick = () => {
        if (!currentFile) return;
        loader.classList.remove('hidden');
        convertBtn.setAttribute('disabled', 'true');

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d')!;

            if (targetFormat === 'jpeg') {
                // White background for JPEG (transparency fix)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0);

            const mimeType = `image/${targetFormat}`;
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `converted-image.${targetFormat === 'jpeg' ? 'jpg' : targetFormat}`;
                    a.click();
                    URL.revokeObjectURL(url);
                }
                loader.classList.add('hidden');
                convertBtn.removeAttribute('disabled');
            }, mimeType, 0.9);
        };
        img.src = previewImg.src;
    };
}
