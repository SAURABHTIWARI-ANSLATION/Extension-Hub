import Cropper from 'cropperjs';

export function renderCropper(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="cropper-input" accept="image/*" class="file-input" />
            <div id="cropper-wrapper" class="hidden">
                <img id="cropper-image" />
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

    let cropper: any = null;

    input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            image.src = event.target?.result as string;
            wrapper.classList.remove('hidden');
            if (cropper) cropper.destroy();
            // @ts-ignore
            cropper = new Cropper(image, {
                viewMode: 1,
                movable: true,
                zoomable: true,
                scalable: true,
            });
        };
        reader.readAsDataURL(file);
    };

    cropBtn.onclick = () => {
        if (!cropper) return;
        const canvas = cropper.getCroppedCanvas();
        canvas.toBlob((blob: Blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cropped-image.png';
            a.click();
            URL.revokeObjectURL(url);
        });
    };

    rotateBtn.onclick = () => {
        if (cropper) cropper.rotate(90);
    };
}
