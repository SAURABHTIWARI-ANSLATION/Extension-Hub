import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

export async function renderImageReducer(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="reducer-input" accept="image/*,.heic,.HEIC" class="file-input" />
            <div id="reducer-ui" class="hidden">
                <div class="settings" style="background: var(--bg-tertiary); padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--card-border); margin-top: 1rem;">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-secondary);">Quality: <span id="quality-val" style="font-weight: 600; color: var(--primary-color);">0.7</span></label>
                        <input type="range" id="quality-range" min="0.1" max="1" step="0.1" value="0.7" style="width: 100%"/>
                    </div>
                    
                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-secondary);">Max Width: <span id="width-val" style="font-weight: 600; color: var(--primary-color);">1920</span>px</label>
                        <input type="range" id="width-range" min="100" max="4000" step="100" value="1920" style="width: 100%"/>
                    </div>
                </div>
                <div class="tool-controls" style="margin-top: 1.5rem;">
                    <button id="reduce-btn" class="primary-btn" style="width: 100%;">Compress & Download</button>
                </div>
            </div>
            <div id="loader" class="hidden">Compressing... (Processing HEIC if needed)</div>
            <div id="reducer-status" style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-muted); text-align: center;"></div>
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
            const ext = currentFile.name.split('.').pop()?.toLowerCase();

            if (ext === 'heic') {
                status.innerText = 'Converting HEIC for compression...';
                const blob = await heic2any({ blob: currentFile, toType: 'image/jpeg', quality: 0.9 });
                const resultBlob = Array.isArray(blob) ? blob[0] : blob;
                fileToCompress = new File([resultBlob], currentFile.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg' });
            }

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
