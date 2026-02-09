import imageCompression from 'browser-image-compression';

export async function renderImageReducer(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="reducer-input" accept="image/*" class="file-input" />
            <div id="reducer-ui" class="hidden">
                <div class="settings">
                    <label>Quality: <span id="quality-val">0.7</span></label>
                    <input type="range" id="quality-range" min="0.1" max="1" step="0.1" value="0.7" style="width: 100%"/>
                    
                    <label>Max Width: <span id="width-val">1920</span>px</label>
                    <input type="range" id="width-range" min="100" max="4000" step="100" value="1920" style="width: 100%"/>
                </div>
                <div class="tool-controls">
                    <button id="reduce-btn" class="primary-btn">Compress & Download</button>
                </div>
            </div>
            <div id="loader" class="hidden">Compressing...</div>
        </div>
    `;

    const input = document.getElementById('reducer-input') as HTMLInputElement;
    const ui = document.getElementById('reducer-ui')!;
    const reduceBtn = document.getElementById('reduce-btn')!;
    const loader = document.getElementById('loader')!;

    // Range displays
    const qRange = document.getElementById('quality-range') as HTMLInputElement;
    const qVal = document.getElementById('quality-val')!;
    const wRange = document.getElementById('width-range') as HTMLInputElement;
    const wVal = document.getElementById('width-val')!;

    qRange.oninput = () => qVal.innerText = qRange.value;
    wRange.oninput = () => wVal.innerText = wRange.value;

    let currentFile: File | null = null;

    input.onchange = (e: any) => {
        currentFile = e.target.files[0];
        if (currentFile) ui.classList.remove('hidden');
    };

    reduceBtn.onclick = async () => {
        if (!currentFile) return;
        loader.classList.remove('hidden');
        reduceBtn.setAttribute('disabled', 'true');

        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: parseInt(wRange.value),
            useWebWorker: true,
            initialQuality: parseFloat(qRange.value)
        };

        try {
            const compressedFile = await imageCompression(currentFile, options);
            const url = URL.createObjectURL(compressedFile);
            const a = document.createElement('a');
            a.href = url;
            a.download = `compressed-${currentFile.name}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert('Compression failed');
        } finally {
            loader.classList.add('hidden');
            reduceBtn.removeAttribute('disabled');
        }
    };
}
