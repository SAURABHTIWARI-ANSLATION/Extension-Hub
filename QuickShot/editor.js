const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');
const wrapper = document.querySelector('.canvas-wrapper');

let currentImage = null;
let currentTool = 'select'; // select, pen, arrow, rect, text
let currentColor = '#ef4444';
let isDrawing = false;
let startX, startY;
let snapshot = null; // for undo mechanism (simple stack)
let undoStack = [];

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    const result = await chrome.storage.local.get(['qs_current_image', 'qs_crop_coords', 'qs_capture_mode', 'qs_full_captures', 'qs_full_dims']);

    if (result.qs_capture_mode === 'full') {
        stitchImages(result.qs_full_captures, result.qs_full_dims);
    } else if (result.qs_current_image) {
        loadImage(result.qs_current_image, result.qs_crop_coords);
    }

    setupToolbar();
});

function stitchImages(captures, dims) {
    canvas.width = dims.width * dims.devicePixelRatio;
    canvas.height = dims.height * dims.devicePixelRatio;

    // We need to load images sequentially or Promise.all
    let imagesLoaded = 0;

    captures.forEach(cap => {
        const img = new Image();
        img.onload = () => {
            // Draw this slice
            // y is in CSS pixels, canvas is in physical pixels
            const yPos = cap.y * dims.devicePixelRatio;
            ctx.drawImage(img, 0, yPos);

            imagesLoaded++;
            if (imagesLoaded === captures.length) {
                // Done stitching
                currentImage = canvas.toDataURL(); // Save "original" state
                saveState();
            }
        };
        img.src = cap.dataUrl;
    });
}

function loadImage(dataUrl, cropCoords) {
    const img = new Image();
    img.onload = () => {
        let width = img.width;
        let height = img.height;
        let sx = 0, sy = 0;

        if (cropCoords) {
            width = cropCoords.width;
            height = cropCoords.height;
            sx = cropCoords.x;
            sy = cropCoords.y;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw initial image (cropped or full)
        ctx.drawImage(img, sx, sy, width, height, 0, 0, width, height);

        currentImage = img; // Keep reference if needed
        saveState(); // Save initial state for Undo
    };
    img.src = dataUrl;
}

function saveState() {
    if (undoStack.length > 10) undoStack.shift(); // Limit stack size
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

function undo() {
    if (undoStack.length > 1) { // Keep at least original
        undoStack.pop(); // Remove current state
        const previousState = undoStack[undoStack.length - 1];
        ctx.putImageData(previousState, 0, 0);
    }
}

// Drawing Logic
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    startX = e.offsetX;
    startY = e.offsetY;
    ctx.beginPath();

    // Save current canvas state before drawing new shape (for previewing shapes)
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (currentTool === 'pen') {
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = currentColor;
        ctx.moveTo(startX, startY);
    } else if (currentTool === 'text') {
        isDrawing = false; // Text is click-to-type
        addText(startX, startY);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const currentX = e.offsetX;
    const currentY = e.offsetY;

    if (currentTool === 'pen') {
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
    } else if (currentTool === 'rect') {
        restoreSnapshot();
        drawRect(startX, startY, currentX - startX, currentY - startY);
    } else if (currentTool === 'arrow') {
        restoreSnapshot();
        drawArrow(startX, startY, currentX, currentY);
    }
});

canvas.addEventListener('mouseup', () => {
    if (isDrawing) {
        isDrawing = false;
        saveState();
    }
});

function restoreSnapshot() {
    if (snapshot) ctx.putImageData(snapshot, 0, 0);
}

function drawRect(x, y, w, h) {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.lineWidth = 3;
    ctx.strokeStyle = currentColor;
    ctx.stroke();
}

function drawArrow(x1, y1, x2, y2) {
    const headLength = 15;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = currentColor;
    ctx.stroke();

    // Draw Arrowhead
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(x2, y2);
    ctx.fillStyle = currentColor;
    ctx.fill();
}

function addText(x, y) {
    const text = prompt('Enter text:', '');
    if (text) {
        saveState(); // Save before adding
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.fillStyle = currentColor;
        ctx.fillText(text, x, y);
        saveState(); // Save after adding
    }
}

// Toolbar Logic
function setupToolbar() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            if (tool) {
                currentTool = tool;
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
            if (btn.id === 'btn-undo') undo();
        });
    });

    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            currentColor = swatch.dataset.color;
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
        });
    });

    // Keyboard Shortcuts (Undo)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            undo();
        }
    });

    // Update Undo tooltip based on platform
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    document.getElementById('btn-undo').title = `Undo (${isMac ? 'Cmd' : 'Ctrl'}+Z)`;

    document.getElementById('btn-download').addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `QuickShot-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    document.getElementById('btn-copy').addEventListener('click', () => {
        canvas.toBlob(blob => {
            navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
                .then(() => alert('Copied to clipboard!'))
                .catch(err => console.error(err));
        });
    });
}
