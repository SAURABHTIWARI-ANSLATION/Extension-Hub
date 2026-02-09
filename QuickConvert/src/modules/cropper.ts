import Cropper from 'cropperjs';
import heic2any from 'heic2any';

export function renderCropper(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="cropper-input" accept="image/*,.heic,.HEIC" class="file-input" />
            <div id="loader" class="hidden">Processing image...</div>
            <div id="cropper-wrapper" class="hidden">
                <div style="max-height: 400px; overflow: hidden; border-radius: var(--radius-md); margin-bottom: 1rem;">
                    <img id="cropper-image" style="display: block; max-width: 100%;" />
                </div>
                <div class="tool-controls">
                    <button id="crop-btn" class="primary-btn">Crop & Download</button>
                    <button id="rotate-btn" class="secondary-btn">Rotate 90°</button>
                </div>
            </div>
        </div>
    `;

    const input = document.getElementById('cropper-input') as HTMLInputElement;
    const wrapper = document.getElementById('cropper-wrapper')!;
    const image = document.getElementById('cropper-image') as HTMLImageElement;
    const cropBtn = document.getElementById('crop-btn')!;
    const rotateBtn = document.getElementById('rotate-btn')!;
    const loader = document.getElementById('loader')!;

    let cropper: any = null;
    let currentFileName = 'cropped-image.png';

    input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        loader.classList.remove('hidden');
        wrapper.classList.add('hidden');
        currentFileName = `cropped-${file.name.replace(/\.[^/.]+$/, ".png")}`;

        try {
            let processedImage: string;
            const ext = file.name.split('.').pop()?.toLowerCase();

            if (ext === 'heic') {
                const blob = await heic2any({ blob: file, toType: 'image/png' });
                const resultBlob = Array.isArray(blob) ? blob[0] : blob;
                processedImage = URL.createObjectURL(resultBlob);
            } else {
                processedImage = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (event) => resolve(event.target?.result as string);
                    reader.readAsDataURL(file);
                });
            }

            image.src = processedImage;
            image.onload = () => {
                wrapper.classList.remove('hidden');
                loader.classList.add('hidden');
                if (cropper) cropper.destroy();
                // @ts-ignore
                cropper = new Cropper(image, {
                    viewMode: 1,
                    movable: true,
                    zoomable: true,
                    scalable: true,
                });
            };
        } catch (err) {
            console.error(err);
            alert('Error loading image');
            loader.classList.add('hidden');
        }
    };

    cropBtn.onclick = () => {
        if (!cropper) return;
        const canvas = cropper.getCroppedCanvas();
        canvas.toBlob((blob: Blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFileName;
            a.click();
            URL.revokeObjectURL(url);
        });
    };

    rotateBtn.onclick = () => {
        if (cropper) cropper.rotate(90);
    };
}
