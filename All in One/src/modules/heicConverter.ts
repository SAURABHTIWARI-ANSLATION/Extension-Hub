import heic2any from 'heic2any';

export function renderHeicConverter(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="heic-input" accept=".heic" class="file-input" />
            <div id="heic-preview" class="hidden">
                <p id="heic-info"></p>
                <div class="tool-controls">
                    <button id="convert-heic-btn" class="primary-btn">Convert to JPEG & Download</button>
                </div>
            </div>
            <div id="loader" class="hidden">Converting HEIC (this may take a moment)...</div>
        </div>
    `;

    const input = document.getElementById('heic-input') as HTMLInputElement;
    const preview = document.getElementById('heic-preview')!;
    const info = document.getElementById('heic-info')!;
    const convertBtn = document.getElementById('convert-heic-btn')!;
    const loader = document.getElementById('loader')!;

    let currentFile: File | null = null;

    input.onchange = (e: any) => {
        currentFile = e.target.files[0];
        if (!currentFile) return;

        info.innerText = `Selected: ${currentFile.name}`;
        preview.classList.remove('hidden');
    };

    convertBtn.onclick = async () => {
        if (!currentFile) return;
        loader.classList.remove('hidden');
        convertBtn.setAttribute('disabled', 'true');

        try {
            const blob = await heic2any({
                blob: currentFile,
                toType: 'image/jpeg',
                quality: 0.8
            });

            const resultBlob = Array.isArray(blob) ? blob[0] : blob;
            const url = URL.createObjectURL(resultBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFile.name.replace(/\.heic$/i, '.jpg');
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('HEIC conversion failed:', error);
            alert('HEIC conversion failed. Please make sure it is a valid HEIC file.');
        } finally {
            loader.classList.add('hidden');
            convertBtn.removeAttribute('disabled');
        }
    };
}
