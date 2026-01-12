/**
 * Popup Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    localizeHtml();
    initializeApp();
});

function localizeHtml() {
    // Basic localization for nodes with __MSG_key__ text
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
        const text = node.nodeValue.trim();
        if (text.startsWith('__MSG_') && text.endsWith('__')) {
            const key = text.slice(6, -2);
            node.nodeValue = chrome.i18n.getMessage(key);
        }
    }
}

function initializeApp() {
    const processor = new ImageProcessor();
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const controls = document.getElementById('controls');
    const processBtn = document.getElementById('processBtn');
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const qualityInput = document.getElementById('qualityInput');
    const qualityValue = document.getElementById('qualityValue');
    const linkRatioBtn = document.getElementById('linkRatioBtn');
    const optsBtn = document.getElementById('optsBtn');

    let currentFile = null;
    let originalBitmap = null;
    let aspectRatio = 1;
    let isRatioLocked = true;

    // Load saved settings
    loadSettings();

    // Drag & Drop
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    // Remove File
    document.getElementById('removeBtn').addEventListener('click', () => {
        resetState();
    });

    // Toggle Aspect Ratio
    linkRatioBtn.addEventListener('click', () => {
        isRatioLocked = !isRatioLocked;
        linkRatioBtn.classList.toggle('active', isRatioLocked);
        if (isRatioLocked && widthInput.value) {
            heightInput.value = Math.round(widthInput.value / aspectRatio);
        }
    });

    // Dimensions Input
    widthInput.addEventListener('input', () => {
        if (isRatioLocked && aspectRatio) {
            heightInput.value = Math.round(widthInput.value / aspectRatio);
        }
    });

    heightInput.addEventListener('input', () => {
        if (isRatioLocked && aspectRatio) {
            widthInput.value = Math.round(heightInput.value * aspectRatio);
        }
    });

    // Quality Slider
    qualityInput.addEventListener('input', (e) => {
        qualityValue.textContent = `${e.target.value}%`;
    });

    // Options
    optsBtn.addEventListener('click', () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options/options.html'));
        }
    });

    // Process Button
    processBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        const width = parseInt(widthInput.value) || undefined;
        const height = parseInt(heightInput.value) || undefined;
        const quality = parseInt(qualityInput.value) / 100;
        const format = document.querySelector('input[name="format"]:checked').value;

        processBtn.disabled = true;
        processBtn.textContent = 'Processing...';

        try {
            const blob = await processor.processImage(currentFile, {
                width,
                height,
                quality,
                format
            });

            downloadBlob(blob, format);
        } catch (err) {
            console.error(err);
            alert('Error processing image');
        } finally {
            processBtn.disabled = false;
            processBtn.textContent = chrome.i18n.getMessage('processButton');
        }
    });

    async function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        resetState(); // Clear previous
        currentFile = file;

        // Update UI
        dropZone.classList.add('hidden');
        fileInfo.classList.remove('hidden');
        controls.classList.remove('disabled');
        processBtn.disabled = false;

        document.getElementById('fileName').textContent = Utils.truncateString(file.name);
        document.getElementById('fileSize').textContent = Utils.formatBytes(file.size);

        // Get Dimensions
        try {
            originalBitmap = await createImageBitmap(file);
            aspectRatio = originalBitmap.width / originalBitmap.height;

            widthInput.value = originalBitmap.width;
            heightInput.value = originalBitmap.height;
            originalBitmap.close();
        } catch (e) {
            console.error('Could not read image dimensions', e);
        }
    }

    function resetState() {
        currentFile = null;
        dropZone.classList.remove('hidden');
        fileInfo.classList.add('hidden');
        controls.classList.add('disabled');
        processBtn.disabled = true;
        fileInput.value = '';
        widthInput.value = '';
        heightInput.value = '';
    }

    function downloadBlob(blob, format) {
        if (!chrome.downloads) {
            alert('Error: Downloads permission missing. Please reload the extension in chrome://extensions.');
            return;
        }

        const url = URL.createObjectURL(blob);
        const originalName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.'));
        const ext = format === 'jpeg' ? 'jpg' : format;

        chrome.downloads.download({
            url: url,
            filename: `${originalName}_resized.${ext}`,
            saveAs: true
        }, () => {
            // Optional: Cleanup
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        });
    }

    function loadSettings() {
        chrome.storage.sync.get(['defaultFormat', 'defaultQuality'], (items) => {
            if (items.defaultFormat) {
                const radio = document.querySelector(`input[name="format"][value="${items.defaultFormat}"]`);
                if (radio) radio.checked = true;
            }
            if (items.defaultQuality) {
                qualityInput.value = items.defaultQuality;
                qualityValue.textContent = `${items.defaultQuality}%`;
            }
        });
    }
}
