import Cropper from 'cropperjs';

export function renderCropper(container: HTMLElement) {
    // Create tool wrapper
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-io';

    // File input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'cropper-input';
    fileInput.accept = 'image/*';
    fileInput.className = 'file-input';

    // Loader
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'hidden';
    loader.textContent = 'Processing image...';

    // Wrapper for cropper
    const wrapper = document.createElement('div');
    wrapper.id = 'cropper-wrapper';
    wrapper.className = 'hidden mt-lg';

    // Preview container
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';

    // Image element
    const image = document.createElement('img');
    image.id = 'cropper-image';
    image.className = 'preview-image';

    previewContainer.appendChild(image);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'tool-controls';

    const cropBtn = document.createElement('button');
    cropBtn.id = 'crop-btn';
    cropBtn.className = 'primary-btn';
    cropBtn.textContent = 'Crop & Download';

    const rotateBtn = document.createElement('button');
    rotateBtn.id = 'rotate-btn';
    rotateBtn.className = 'secondary-btn';
    rotateBtn.textContent = 'Rotate 90°';

    controls.appendChild(cropBtn);
    controls.appendChild(rotateBtn);

    wrapper.appendChild(previewContainer);
    wrapper.appendChild(controls);

    toolDiv.appendChild(fileInput);
    toolDiv.appendChild(loader);
    toolDiv.appendChild(wrapper);

    container.appendChild(toolDiv);

    // Elements are already created above, reuse them
    let cropper: any = null;
    let currentFileName = 'cropped-image.png';

    fileInput.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        loader.classList.remove('hidden');
        wrapper.classList.add('hidden');
        currentFileName = `cropped-${file.name.replace(/\.[^/.]+$/, ".png")}`;

        try {
            const processedImage = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target?.result as string);
                reader.readAsDataURL(file);
            });

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
        canvas.toBlob((blob: Blob | null) => {
            if (!blob) return;
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
