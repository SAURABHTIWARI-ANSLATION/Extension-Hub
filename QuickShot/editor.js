// QuickShot Editor - Enhanced Version
class QuickShotEditor {
    constructor() {
        this.canvas = document.getElementById('editor-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.wrapper = document.querySelector('.canvas-wrapper');

        // State variables
        this.currentTool = 'select';
        this.currentColor = '#3b82f6';
        this.brushSize = 3;
        this.opacity = 1.0;
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.lastX = 0;
        this.lastY = 0;
        this.undoStack = [];
        this.redoStack = [];
        this.zoomLevel = 1.0;
        this.showGrid = false;
        this.showRuler = false;
        this.imageData = null;
        this.snapshot = null;
        this.selectedArea = null;

        // Panning state
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.scrollLeftStart = 0;
        this.scrollTopStart = 0;

        // Text state
        this.textMode = false;
        this.textX = 0;
        this.textY = 0;

        // Initialize
        this.init();
    }

    async init() {
        console.log('🚀 QuickShot Editor Initializing...');

        // Hide loading overlay
        setTimeout(() => {
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
            document.querySelector('.editor-container').classList.remove('hidden');
            document.querySelector('.editor-container').classList.add('flex-visible');
        }, 500);

        // Load image from storage
        await this.loadImage();

        // Setup event listeners
        this.setupEventListeners();

        // Setup UI controls
        this.setupUI();

        // Initial render
        this.render();

        // Auto-save initial state
        this.saveState();

        console.log('✅ QuickShot Editor Ready');
    }

    async loadImage() {
        try {
            const result = await chrome.storage.local.get([
                'qs_current_image',
                'qs_crop_coords',
                'qs_capture_mode',
                'qs_full_captures',
                'qs_full_dims'
            ]);

            if (result.qs_capture_mode === 'full' && result.qs_full_captures) {
                await this.stitchImages(result.qs_full_captures, result.qs_full_dims);
            } else if (result.qs_current_image) {
                await this.drawImageFromData(result.qs_current_image, result.qs_crop_coords);
            } else {
                // Create a blank canvas if no image
                this.createBlankCanvas();
            }
        } catch (error) {
            console.error('❌ Error loading image:', error);
            this.createBlankCanvas();
        }
    }

    async stitchImages(captures, dims) {
        console.log('🖼️ Stitching full page images...');

        this.canvas.width = dims.width * dims.devicePixelRatio;
        this.canvas.height = dims.height * dims.devicePixelRatio;

        const promises = captures.map(cap => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const yPos = cap.y * dims.devicePixelRatio;
                    this.ctx.drawImage(img, 0, yPos);
                    resolve();
                };
                img.src = cap.dataUrl;
            });
        });

        await Promise.all(promises);
        this.updateStatus();
        this.saveState();
    }

    async drawImageFromData(dataUrl, cropCoords) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                let sx = 0, sy = 0;

                if (cropCoords) {
                    const dpr = cropCoords.devicePixelRatio || 1;
                    width = cropCoords.width * dpr;
                    height = cropCoords.height * dpr;
                    sx = cropCoords.x * dpr;
                    sy = cropCoords.y * dpr;
                }

                // Set canvas dimensions
                this.canvas.width = width;
                this.canvas.height = height;

                // Draw the image
                this.ctx.drawImage(img, sx, sy, width, height, 0, 0, width, height);

                // Update status
                this.updateStatus();
                resolve();
            };
            img.src = dataUrl;
        });
    }

    createBlankCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateStatus();
    }

    setupEventListeners() {
        // Mouse events on canvas
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseout', this.handleMouseOut.bind(this));
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    setupUI() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                if (tool) {
                    this.setTool(tool);
                }
            });
        });

        // Color selection
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            const color = swatch.getAttribute('data-color');
            if (color) {
                swatch.style.backgroundColor = color;
            }
        });

        // Custom color picker
        document.getElementById('custom-color')?.addEventListener('change', (e) => {
            this.setColor(e.target.value);
        });

        // Brush size slider
        const brushSizeSlider = document.getElementById('brush-size');
        if (brushSizeSlider) {
            brushSizeSlider.addEventListener('input', (e) => {
                this.setBrushSize(parseInt(e.target.value));
            });
        }

        // Opacity slider
        const opacitySlider = document.getElementById('opacity-slider');
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                this.setOpacity(parseInt(e.target.value) / 100);
            });
        }

        // Action buttons
        document.getElementById('btn-undo')?.addEventListener('click', () => this.undo());
        document.getElementById('btn-redo')?.addEventListener('click', () => this.redo());
        document.getElementById('btn-clear')?.addEventListener('click', () => this.clearCanvas());
        document.getElementById('btn-copy')?.addEventListener('click', () => this.copyToClipboard());
        document.getElementById('btn-download')?.addEventListener('click', () => this.downloadImage());
        document.getElementById('btn-share')?.addEventListener('click', () => this.showShareModal());

        // Zoom controls
        document.getElementById('btn-zoom-in')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('btn-zoom-out')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('btn-zoom-reset')?.addEventListener('click', () => this.zoomReset());
        document.getElementById('btn-fit-to-screen')?.addEventListener('click', () => this.fitToScreen());

        // Grid toggle
        document.getElementById('btn-grid-toggle')?.addEventListener('click', () => this.toggleGrid());
        document.getElementById('btn-ruler-toggle')?.addEventListener('click', () => this.toggleRuler());

        // Modal controls
        this.setupModalControls();

        // Update brush preview
        this.updateBrushPreview();
    }

    setupModalControls() {
        // Text modal
        const textModal = document.getElementById('text-modal');
        const textApply = document.getElementById('text-apply');
        const textCancel = document.getElementById('text-cancel');
        const textClose = textModal?.querySelector('.modal-close');

        if (textApply) {
            textApply.addEventListener('click', () => {
                const text = document.getElementById('text-input').value;
                if (text) {
                    this.addText(text);
                    this.hideModal(textModal);
                }
            });
        }

        if (textCancel) {
            textCancel.addEventListener('click', () => {
                this.hideModal(textModal);
            });
        }

        if (textClose) {
            textClose.addEventListener('click', () => {
                this.hideModal(textModal);
            });
        }

        // Share modal
        const shareModal = document.getElementById('share-modal');
        const shareClose = shareModal?.querySelector('.modal-close');

        if (shareClose) {
            shareClose.addEventListener('click', () => {
                this.hideModal(shareModal);
            });
        }

        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal);
                }
            });
        });
    }

    handleMouseDown(e) {
        // Get accurate canvas position accounting for all offsets
        const canvasRect = this.canvas.getBoundingClientRect();
        const wrapper = this.canvas.parentElement;

        // Calculate scaling ratio between display size and internal canvas size
        const scaleX = this.canvas.width / canvasRect.width;
        const scaleY = this.canvas.height / canvasRect.height;

        // Calculate mouse position with proper scaling
        const mouseX = (e.clientX - canvasRect.left + wrapper.scrollLeft);
        const mouseY = (e.clientY - canvasRect.top + wrapper.scrollTop);

        // Apply scaling to get canvas coordinates
        this.startX = mouseX * scaleX;
        this.startY = mouseY * scaleY;

        console.log('MouseDown - Client:', e.clientX, e.clientY, 'Canvas:', this.startX, this.startY, 'Rect:', canvasRect.left, canvasRect.top);

        this.lastX = this.startX;
        this.lastY = this.startY;

        // Panning with middle click or right click
        if (e.button === 1 || e.button === 2) {
            this.isPanning = true;
            this.panStartX = e.clientX;
            this.panStartY = e.clientY;
            this.scrollLeftStart = wrapper.scrollLeft;
            this.scrollTopStart = wrapper.scrollTop;
            this.canvas.classList.add('cursor-grabbing');
            this.canvas.classList.remove('cursor-grab', 'cursor-crosshair', 'cursor-text');
            return;
        }

        this.isDrawing = true;

        if (this.currentTool === 'select') {
            // Check if we clicked on the background to start a new selection
            this.clearSelection();
        }

        // Save snapshot for preview
        this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        if (this.currentTool === 'pen') {
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, this.startY);
        } else if (this.currentTool === 'text') {
            this.showTextModal(this.startX, this.startY);
        }
    }

    handleMouseMove(e) {
        // Get accurate canvas position accounting for all offsets
        const canvasRect = this.canvas.getBoundingClientRect();
        const wrapper = this.canvas.parentElement;

        // Calculate scaling ratio between display size and internal canvas size
        const scaleX = this.canvas.width / canvasRect.width;
        const scaleY = this.canvas.height / canvasRect.height;

        // Calculate mouse position with proper scaling
        const mouseX = (e.clientX - canvasRect.left + wrapper.scrollLeft);
        const mouseY = (e.clientY - canvasRect.top + wrapper.scrollTop);

        // Apply scaling to get canvas coordinates
        const currentX = mouseX * scaleX;
        const currentY = mouseY * scaleY;

        console.log('MouseMove - Client:', e.clientX, e.clientY, 'Canvas:', currentX, currentY);

        // Update cursor position display
        this.updateCursorPosition(currentX, currentY);

        if (this.isPanning) {
            const dx = e.clientX - this.panStartX;
            const dy = e.clientY - this.panStartY;
            wrapper.scrollLeft = this.scrollLeftStart - dx;
            wrapper.scrollTop = this.scrollTopStart - dy;
            return;
        }

        if (!this.isDrawing) return;

        switch (this.currentTool) {
            case 'pen':
                this.drawFreehand(currentX, currentY);
                break;
            case 'arrow':
                this.previewArrow(currentX, currentY);
                break;
            case 'rect':
                this.previewRectangle(currentX, currentY);
                break;
            case 'circle':
                this.previewCircle(currentX, currentY);
                break;
            case 'line':
                this.previewLine(currentX, currentY);
                break;
            case 'select':
                this.previewSelection(currentX, currentY);
                break;
            case 'blur':
                this.previewBlur(currentX, currentY);
                break;
            case 'highlight':
                this.previewHighlight(currentX, currentY);
                break;
        }

        this.lastX = currentX;
        this.lastY = currentY;
    }

    handleMouseUp() {
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.classList.add('cursor-grab');
            this.canvas.classList.remove('cursor-grabbing', 'cursor-crosshair', 'cursor-text');
            return;
        }

        if (!this.isDrawing) return;

        this.isDrawing = false;

        switch (this.currentTool) {
            case 'pen':
                this.saveState();
                break;
            case 'arrow':
                this.drawArrow(this.startX, this.startY, this.lastX, this.lastY);
                this.saveState();
                break;
            case 'rect':
                this.drawRectangle(this.startX, this.startY, this.lastX - this.startX, this.lastY - this.startY);
                this.saveState();
                break;
            case 'circle':
                this.drawCircle(this.startX, this.startY, this.lastX - this.startX, this.lastY - this.startY);
                this.saveState();
                break;
            case 'line':
                this.drawLine(this.startX, this.startY, this.lastX, this.lastY);
                this.saveState();
                break;
            case 'select':
                this.finalizeSelection();
                break;
            case 'blur':
                this.drawBlur(this.startX, this.startY, this.lastX - this.startX, this.lastY - this.startY);
                this.saveState();
                break;
            case 'highlight':
                this.drawHighlight(this.startX, this.startY, this.lastX - this.startX, this.lastY - this.startY);
                this.saveState();
                break;
        }

        this.snapshot = null;
    }

    handleMouseOut() {
        if (this.isDrawing) {
            this.handleMouseUp();
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup');
        this.canvas.dispatchEvent(mouseEvent);
    }

    handleKeyDown(e) {
        // Undo: Ctrl+Z or Cmd+Z
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.undo();
        }

        // Redo: Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            this.redo();
        }

        // Delete selected area
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.selectedArea) {
                this.deleteSelection();
            }
        }

        // Escape to cancel selection
        if (e.key === 'Escape') {
            this.clearSelection();
        }

        // Save: Ctrl+S or Cmd+S
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.downloadImage();
        }

        // Copy: Ctrl+C or Cmd+C
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            this.copyToClipboard();
        }
    }

    handleResize() {
        // Adjust canvas display if needed
        this.updateStatus();
    }

    // Drawing Methods
    drawFreehand(x, y) {
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }

    previewArrow(x, y) {
        this.restoreSnapshot();
        this.drawArrow(this.startX, this.startY, x, y, true);
    }

    drawArrow(x1, y1, x2, y2, preview = false) {
        const headLength = 20;
        const angle = Math.atan2(y2 - y1, x2 - x1);

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineWidth = this.brushSize;
        this.ctx.strokeStyle = this.getColorWithOpacity();
        this.ctx.stroke();

        // Arrowhead
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6),
            y2 - headLength * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6),
            y2 - headLength * Math.sin(angle + Math.PI / 6));
        this.ctx.closePath();
        this.ctx.fillStyle = this.getColorWithOpacity();
        this.ctx.fill();
    }

    previewRectangle(x, y) {
        this.restoreSnapshot();
        this.drawRectangle(this.startX, this.startY, x - this.startX, y - this.startY, true);
    }

    drawRectangle(x, y, width, height, preview = false) {
        this.ctx.beginPath();
        this.ctx.rect(x, y, width, height);
        this.ctx.lineWidth = this.brushSize;
        this.ctx.strokeStyle = this.getColorWithOpacity();
        this.ctx.stroke();

        if (!preview && this.brushSize > 5) {
            this.ctx.fillStyle = this.getColorWithOpacity(0.1);
            this.ctx.fill();
        }
    }

    previewCircle(x, y) {
        this.restoreSnapshot();
        const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));
        this.drawCircle(this.startX, this.startY, radius, true);
    }

    drawCircle(x, y, radius, preview = false) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.lineWidth = this.brushSize;
        this.ctx.strokeStyle = this.getColorWithOpacity();
        this.ctx.stroke();

        if (!preview && this.brushSize > 5) {
            this.ctx.fillStyle = this.getColorWithOpacity(0.1);
            this.ctx.fill();
        }
    }

    previewLine(x, y) {
        this.restoreSnapshot();
        this.drawLine(this.startX, this.startY, x, y, true);
    }

    drawLine(x1, y1, x2, y2, preview = false) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineWidth = this.brushSize;
        this.ctx.strokeStyle = this.getColorWithOpacity();
        this.ctx.stroke();
    }

    previewSelection(x, y) {
        const selectionRect = document.getElementById('selection-rectangle');
        if (selectionRect) {
            console.log('PreviewSelection called with:', x, y, 'Start:', this.startX, this.startY);

            const width = Math.abs(x - this.startX) * this.zoomLevel;
            const height = Math.abs(y - this.startY) * this.zoomLevel;

            // Calculate position relative to canvas wrapper
            const wrapper = this.canvas.parentElement;
            const wrapperRect = wrapper.getBoundingClientRect();

            // Convert canvas coordinates to wrapper coordinates
            const left = (Math.min(x, this.startX) * this.zoomLevel) - wrapper.scrollLeft;
            const top = (Math.min(y, this.startY) * this.zoomLevel) - wrapper.scrollTop;

            console.log('Selection rect - Width:', width, 'Height:', height, 'Left:', left, 'Top:', top);

            selectionRect.classList.remove('hidden');
            selectionRect.classList.add('block-visible');
            selectionRect.style.width = width + 'px';
            selectionRect.style.height = height + 'px';
            selectionRect.style.left = left + 'px';
            selectionRect.style.top = top + 'px';
        }
    }

    finalizeSelection() {
        const selectionRect = document.getElementById('selection-rectangle');
        if (selectionRect && !selectionRect.classList.contains('hidden')) {
            const width = parseFloat(selectionRect.style.width) / this.zoomLevel;
            const height = parseFloat(selectionRect.style.height) / this.zoomLevel;

            // Calculate canvas-relative coordinates
            const wrapper = this.canvas.parentElement;
            const left = (parseFloat(selectionRect.style.left) + wrapper.scrollLeft) / this.zoomLevel;
            const top = (parseFloat(selectionRect.style.top) + wrapper.scrollTop) / this.zoomLevel;

            if (width > 5 && height > 5) {
                this.selectedArea = {
                    x: left,
                    y: top,
                    width: width,
                    height: height
                };
                console.log('Selection made:', this.selectedArea);
            } else {
                this.clearSelection();
            }
        }
    }

    clearSelection() {
        this.selectedArea = null;
        const selectionRect = document.getElementById('selection-rectangle');
        if (selectionRect) {
            selectionRect.classList.add('hidden');
            selectionRect.classList.remove('block-visible');
        }
    }

    deleteSelection() {
        if (!this.selectedArea) return;

        this.saveState();
        this.ctx.clearRect(
            this.selectedArea.x,
            this.selectedArea.y,
            this.selectedArea.width,
            this.selectedArea.height
        );
        this.clearSelection();
        this.saveState();
    }

    addText(text, x = this.textX, y = this.textY) {
        const fontFamily = document.getElementById('font-family')?.value || 'Inter, sans-serif';
        const fontSize = parseInt(document.getElementById('font-size')?.value || '24');

        this.ctx.font = `bold ${fontSize}px ${fontFamily}`;
        this.ctx.fillStyle = this.getColorWithOpacity();
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(text, x, y);

        this.saveState();
    }

    previewBlur(x, y) {
        this.restoreSnapshot();
        const w = x - this.startX;
        const h = y - this.startY;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(this.startX, this.startY, w, h);
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.stroke();
        this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
        this.ctx.fill();
        this.ctx.restore();
    }

    drawBlur(x, y, w, h) {
        // Handle negative w/h
        if (w < 0) { x += w; w = Math.abs(w); }
        if (h < 0) { y += h; h = Math.abs(h); }

        if (w < 1 || h < 1) return;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.drawImage(this.canvas, x, y, w, h, 0, 0, w, h);

        this.ctx.save();
        this.ctx.filter = 'blur(8px)';
        this.ctx.drawImage(tempCanvas, x, y);
        this.ctx.restore();

        // Draw border to clean up edges
        this.ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        this.ctx.strokeRect(x, y, w, h);
    }

    previewHighlight(x, y) {
        this.restoreSnapshot();
        const w = x - this.startX;
        const h = y - this.startY;

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        this.ctx.fillRect(this.startX, this.startY, w, h);
        this.ctx.restore();
    }

    drawHighlight(x, y, w, h) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
        this.ctx.fillRect(x, y, w, h);
        this.ctx.restore();
    }

    // Tool Management
    setTool(tool) {
        this.currentTool = tool;

        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tool === tool) {
                btn.classList.add('active');
            }
        });

        // Update cursor
        // Remove all cursor classes first
        this.canvas.classList.remove('cursor-grab', 'cursor-grabbing', 'cursor-crosshair', 'cursor-text');

        switch (tool) {
            case 'select':
                this.canvas.classList.add('cursor-grab');
                break;
            case 'pen':
                this.canvas.classList.add('cursor-crosshair');
                break;
            case 'text':
                this.canvas.classList.add('cursor-text');
                break;
            default:
                this.canvas.classList.add('cursor-crosshair');
        }

        // Update status
        this.updateStatus();
    }

    setColor(color) {
        this.currentColor = color;

        // Update UI
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.classList.remove('active');
            if (swatch.dataset.color === color) {
                swatch.classList.add('active');
            }
        });

        // Update custom color picker
        const customColor = document.getElementById('custom-color');
        if (customColor) {
            customColor.value = color;
        }

        this.updateBrushPreview();
    }

    setBrushSize(size) {
        this.brushSize = size;

        // Update UI
        const brushSizeValue = document.getElementById('brush-size-value');
        if (brushSizeValue) {
            brushSizeValue.textContent = `${size}px`;
        }

        this.updateBrushPreview();
    }

    setOpacity(opacity) {
        this.opacity = opacity;

        // Update UI
        const opacityValue = document.getElementById('opacity-value');
        if (opacityValue) {
            opacityValue.textContent = `${Math.round(opacity * 100)}%`;
        }
    }

    getColorWithOpacity(alpha = this.opacity) {
        const color = this.currentColor;
        if (color.startsWith('#') && color.length === 7) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return color;
    }

    // State Management
    saveState() {
        this.undoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        this.redoStack = []; // Clear redo stack when new action is performed

        // Limit undo stack size
        if (this.undoStack.length > 50) {
            this.undoStack.shift();
        }

        // Update save status
        this.updateSaveStatus();
    }

    undo() {
        if (this.undoStack.length > 1) {
            this.redoStack.push(this.undoStack.pop());
            const previousState = this.undoStack[this.undoStack.length - 1];
            this.ctx.putImageData(previousState, 0, 0);
            this.updateSaveStatus();
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.undoStack.push(nextState);
            this.ctx.putImageData(nextState, 0, 0);
            this.updateSaveStatus();
        }
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.saveState();
        }
    }

    // Zoom Functions
    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel * 1.2, 5);
        this.updateZoomDisplay();
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.1);
        this.updateZoomDisplay();
    }

    zoomReset() {
        this.zoomLevel = 1.0;
        this.updateZoomDisplay();
    }

    fitToScreen() {
        const container = this.canvas.parentElement;
        const scaleX = container.clientWidth / this.canvas.width;
        const scaleY = container.clientHeight / this.canvas.height;
        this.zoomLevel = Math.min(scaleX, scaleY, 1);
        this.updateZoomDisplay();
    }

    updateZoomDisplay() {
        const zoomDisplay = document.getElementById('zoom-level');
        if (zoomDisplay) {
            zoomDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        }

        // Don't use CSS transform - it breaks coordinate calculations
        // Instead, we'll scale the actual canvas content when drawing
    }

    // UI Helpers
    updateBrushPreview() {
        const brushPreview = document.getElementById('brush-preview-circle');
        if (brushPreview) {
            brushPreview.style.width = `${this.brushSize * 2}px`;
            brushPreview.style.height = `${this.brushSize * 2}px`;
            brushPreview.style.backgroundColor = this.currentColor;
        }
    }

    updateCursorPosition(x, y) {
        const cursorPosition = document.getElementById('cursor-position');
        if (cursorPosition) {
            cursorPosition.textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`;
        }
    }

    updateStatus() {
        // Update canvas size display
        const canvasSize = document.getElementById('canvas-size');
        if (canvasSize) {
            canvasSize.textContent = `${this.canvas.width} × ${this.canvas.height}`;
        }

        // Update tool status
        const toolStatus = document.getElementById('tool-status');
        if (toolStatus) {
            const toolNames = {
                'select': 'Select Tool',
                'pen': 'Pen Tool',
                'arrow': 'Arrow Tool',
                'rect': 'Rectangle Tool',
                'circle': 'Circle Tool',
                'line': 'Line Tool',
                'text': 'Text Tool',
                'blur': 'Blur Tool',
                'highlight': 'Highlight Tool'
            };
            toolStatus.textContent = toolNames[this.currentTool] || this.currentTool;
        }
    }

    updateSaveStatus() {
        const saveStatus = document.getElementById('save-status');
        if (saveStatus) {
            saveStatus.textContent = 'Auto-saved';
            saveStatus.classList.add('save-status-success');

            // Clear after 2 seconds
            setTimeout(() => {
                saveStatus.textContent = '';
            }, 2000);
        }
    }

    restoreSnapshot() {
        if (this.snapshot) {
            this.ctx.putImageData(this.snapshot, 0, 0);
        }
    }

    // Modal Functions
    showTextModal(x, y) {
        this.textX = x;
        this.textY = y;
        const modal = document.getElementById('text-modal');
        if (modal) {
            this.showModal(modal);
            const textInput = document.getElementById('text-input');
            if (textInput) {
                textInput.value = '';
                textInput.focus();
            }
        } else {
            // Fallback to prompt
            const text = prompt('Enter text:', '');
            if (text) {
                this.addText(text, x, y);
            }
        }
    }

    showShareModal() {
        const modal = document.getElementById('share-modal');
        if (modal) {
            this.showModal(modal);
        }
    }

    showModal(modal) {
        modal.classList.add('show');
        modal.classList.add('flex-visible');
        modal.classList.remove('hidden');
    }

    hideModal(modal) {
        modal.classList.remove('show');
        modal.classList.add('hidden');
        modal.classList.remove('flex-visible');
    }

    // Grid & Ruler
    toggleGrid() {
        this.showGrid = !this.showGrid;
        const gridOverlay = document.getElementById('grid-overlay');
        if (gridOverlay) {
            if (this.showGrid) {
                gridOverlay.classList.add('block-visible');
                gridOverlay.classList.remove('hidden');
            } else {
                gridOverlay.classList.add('hidden');
                gridOverlay.classList.remove('block-visible');
            }
        }
    }

    toggleRuler() {
        this.showRuler = !this.showRuler;
        // Implement ruler functionality here
        console.log('Ruler toggled:', this.showRuler);
    }

    // Export Functions
    async copyToClipboard() {
        try {
            this.canvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    this.showNotification('✅ Copied to clipboard!', 'success');
                } catch (err) {
                    console.error('Clipboard error:', err);
                    this.showNotification('❌ Failed to copy', 'error');
                }
            });
        } catch (error) {
            console.error('Copy error:', error);
            this.showNotification('❌ Failed to copy', 'error');
        }
    }

    downloadImage() {
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `quickshot-${timestamp}.png`;
        link.href = this.canvas.toDataURL('image/png', 1.0);
        link.click();
        this.showNotification('💾 Image downloaded!', 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `editor-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('hide'); // Add a class to trigger hide animation
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    render() {
        // Main render loop if needed
        requestAnimationFrame(() => this.render());
    }
}

// Initialize editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add notification animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .notification {
            font-family: 'Inter', sans-serif;
            font-weight: 500;
        }
    `;
    document.head.appendChild(style);

    // Create and initialize editor
    window.editor = new QuickShotEditor();
});

// Export for debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuickShotEditor;
}