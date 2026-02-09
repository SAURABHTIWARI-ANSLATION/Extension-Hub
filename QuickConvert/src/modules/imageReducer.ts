import imageCompression from 'browser-image-compression';

export async function renderImageReducer(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="reducer-input" accept="image/*,.heic,.HEIC,.heif,.HEIF" class="file-input" />
            <div id="reducer-ui" class="hidden">
                <div class="preview-container">
                    <p id="reducer-preview-status" class="fs-sm text-muted-color text-center"></p>
                </div>
                
                <div class="tool-settings-card mt-lg">
                    <div class="mb-md">
                        <label class="label-styled">Quality: <span id="quality-val" class="fw-600 accent-text">0.7</span></label>
                        <input type="range" id="quality-range" min="0.1" max="1" step="0.1" value="0.7" class="w-full"/>
                    </div>
                    
                    <div>
                        <label class="label-styled">Max Width: <span id="width-val" class="fw-600 accent-text">1920</span>px</label>
                        <input type="range" id="width-range" min="100" max="4000" step="100" value="1920" class="w-full"/>
                    </div>
                </div>
                <div class="mt-lg">
                    <button id="reduce-btn" class="primary-btn w-full">Compress & Download</button>
                </div>
            </div>
            <div id="loader" class="hidden">Compressing... (Processing HEIC if needed)</div>
            <div id="reducer-status" class="preview-status"></div>
        </div>
    `;

    const input = document.getElementById('reducer-input') as HTMLInputElement;
    const ui = document.getElementById('reducer-ui')!;
    const reduceBtn = document.getElementById('reduce-btn')!;
    const loader = document.getElementById('loader')!;
    const status = document.getElementById('reducer-status')!;

    const qRange = document.getElementById('quality-range') as HTMLInputElement;
    const qVal = document.getElementById('quality-val')!;
    const wRange = document.getElementById('width-range') as HTMLInputElement;
    const wVal = document.getElementById('width-val')!;

    qRange.oninput = () => qVal.innerText = qRange.value;
    wRange.oninput = () => wVal.innerText = wRange.value;

    let currentFile: File | null = null;

    input.onchange = (e: any) => {
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
