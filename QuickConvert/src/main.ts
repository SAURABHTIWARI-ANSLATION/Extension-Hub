import './style.css'
import 'cropperjs/dist/cropper.css'
import { renderCropper } from './modules/cropper';
import { renderFormatConverter } from './modules/converter';
import { renderImageToPdf } from './modules/imageToPdf';
import { renderImageReducer } from './modules/imageReducer';
import { renderPdfToImage } from './modules/pdfToImage';
import { renderPdfCompressor } from './modules/pdfCompressor';
import { renderPdfToDocx } from './modules/pdfToDocx';
import { renderPdfToPpt } from './modules/pdfToPpt';
import { renderSvgConverter } from './modules/svgConverter';
import { renderPdfMerge } from './modules/pdfMerge';
import { renderPdfSplit } from './modules/pdfSplit';
import { renderPdfOcr } from './modules/pdfOcr';
import { renderPdfSecurity } from './modules/pdfSecurity';
import { renderImageResizer } from './modules/imageResizer';

interface Tool {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: 'image' | 'pdf' | 'text';
    gradient: string;
}

const tools: Tool[] = [
    // PDF Tools
    { id: 'pdf-merge', title: 'Merge PDF', description: 'Combine multiple PDFs into one document.', icon: '🔗', category: 'pdf', gradient: 'gradient-blue-purple' },
    { id: 'pdf-split', title: 'Split PDF', description: 'Separate PDF pages into files.', icon: '✂️', category: 'pdf', gradient: 'gradient-green-teal' },
    { id: 'pdf-compress', title: 'PDF Compressor', description: 'Reduce PDF file size', icon: '📦', category: 'pdf', gradient: 'gradient-yellow-orange' },
    { id: 'pdf-security', title: 'PDF Security', description: 'Encrypt or decrypt your files.', icon: '🔒', category: 'pdf', gradient: 'gradient-red-pink' },
    { id: 'pdf-img', title: 'PDF to Image', description: 'Extract pages as images', icon: '🖼️', category: 'pdf', gradient: 'gradient-purple-pink' },
    { id: 'pdf-docx', title: 'PDF to DOCX', description: 'Convert PDF to Word document', icon: '📝', category: 'pdf', gradient: 'gradient-cyan-blue' },
    { id: 'pdf-ppt', title: 'PDF to PPT', description: 'Convert PDF to PowerPoint', icon: '📊', category: 'pdf', gradient: 'gradient-blue-purple' },

    // Image Tools
    { id: 'universal-conv', title: 'Universal Converter', description: 'Convert between any image format (SVG, PNG, JPG)', icon: '🔄', category: 'image', gradient: 'gradient-blue-purple' },
    { id: 'cropper', title: 'Image Cropper', description: 'Crop and rotate images', icon: '✂️', category: 'image', gradient: 'gradient-green-teal' },
    { id: 'img-resizer', title: 'Image Resizer', description: 'Custom Dimensions (px)', icon: '📐', category: 'image', gradient: 'gradient-yellow-orange' },
    { id: 'img-reducer', title: 'Image Reducer', description: 'Reduce image file size', icon: '📉', category: 'image', gradient: 'gradient-red-pink' },
    { id: 'img-pdf', title: 'Image to PDF', description: 'Convert images to a PDF file', icon: '📄', category: 'image', gradient: 'gradient-purple-pink' },
    { id: 'svg-conv', title: 'SVG to Image', description: 'Convert SVG to Images', icon: '🎨', category: 'image', gradient: 'gradient-cyan-blue' },

    // Text Tools
    { id: 'pdf-ocr', title: 'PDF to Text (OCR)', description: 'Extract text from scanned PDFs.', icon: '🔍', category: 'text', gradient: 'gradient-yellow-orange' }
];

let currentCategory: 'image' | 'pdf' | 'text' | 'settings' = 'pdf';

function renderToolGrid() {
    const container = document.getElementById('tool-container')!;
    container.innerHTML = '';

    // Handle Settings view
    if (currentCategory === 'settings') {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; padding: var(--space-2xl); text-align: center;">
                <h3 style="font-size: 1.5rem; margin-bottom: var(--space-md); color: var(--text-primary);">Settings</h3>
                <p style="color: var(--text-secondary); margin-bottom: var(--space-lg);">QuickConvert Extension v1.0</p>
                <p style="color: var(--text-muted); font-size: 0.9rem;">All conversions happen locally in your browser.<br>No data is sent to external servers.</p>
            </div>
        `;
        return;
    }

    tools.filter(t => t.category === currentCategory).forEach(tool => {
        const card = document.createElement('div');
        card.className = `tool-card ${tool.gradient}`;
        card.innerHTML = `
            <div class="tool-card-content">
                <div class="icon-wrapper">${tool.icon}</div>
                <h3>${tool.title}</h3>
                <p>${tool.description}</p>
            </div>
        `;
        card.onclick = () => loadTool(tool.id);
        container.appendChild(card);
    });
}

function loadTool(toolId: string) {
    console.log(`Loading tool: ${toolId}`);
    document.getElementById('tool-container')!.classList.add('hidden');
    document.querySelector('header')!.classList.add('hidden');
    document.getElementById('active-tool')!.classList.remove('hidden');

    // Module loading logic
    const toolUI = document.getElementById('tool-ui')!;
    toolUI.innerHTML = ''; // Clear previous

    if (toolId === 'cropper') {
        renderCropper(toolUI);
    } else if (toolId === 'universal-conv' || toolId === 'jpeg-png' || toolId === 'png-jpeg' || toolId === 'webp-conv') {
        renderFormatConverter(toolUI);
    } else if (toolId === 'img-pdf') {
        renderImageToPdf(toolUI);
    } else if (toolId === 'img-reducer') {
        renderImageReducer(toolUI);
    } else if (toolId === 'pdf-img') {
        renderPdfToImage(toolUI);
    } else if (toolId === 'pdf-compress') {
        renderPdfCompressor(toolUI);
    } else if (toolId === 'pdf-docx') {
        renderPdfToDocx(toolUI);
    } else if (toolId === 'pdf-ppt') {
        renderPdfToPpt(toolUI);
    } else if (toolId === 'svg-conv') {
        renderSvgConverter(toolUI);
    } else if (toolId === 'pdf-merge') {
        renderPdfMerge(toolUI);
    } else if (toolId === 'pdf-split') {
        renderPdfSplit(toolUI);
    } else if (toolId === 'pdf-ocr') {
        renderPdfOcr(toolUI);
    } else if (toolId === 'pdf-security') {
        renderPdfSecurity(toolUI);
    } else if (toolId === 'img-resizer') {
        renderImageResizer(toolUI);
    } else {
        toolUI.innerHTML = `<h3>${tools.find(t => t.id === toolId)?.title}</h3><p>Work in progress...</p>`;
    }
}

// Sidebar Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLButtonElement;
        const category = target.dataset.category as 'image' | 'pdf' | 'text' | 'settings';

        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        target.classList.add('active');

        currentCategory = category;

        // Update header based on category
        const titles: Record<string, string> = {
            'pdf': 'PDF Tools',
            'image': 'Image Tools',
            'text': 'Text Tools',
            'settings': 'Settings'
        };

        const descriptions: Record<string, string> = {
            'pdf': 'Manage and convert PDF documents offline.',
            'image': 'Convert, crop, and resize images locally.',
            'text': 'Extract and convert text from documents.',
            'settings': 'Extension preferences and information.'
        };

        document.getElementById('tool-title')!.innerText = titles[category] || 'Tools';
        document.getElementById('tool-desc')!.innerText = descriptions[category] || 'Offline tools for your files.';

        // Reset view
        document.getElementById('tool-container')!.classList.remove('hidden');
        document.querySelector('header')!.classList.remove('hidden');
        document.getElementById('active-tool')!.classList.add('hidden');

        renderToolGrid();
    });
});

// Back Button
document.getElementById('back-btn')!.onclick = () => {
    document.getElementById('tool-container')!.classList.remove('hidden');
    document.querySelector('header')!.classList.remove('hidden');
    document.getElementById('active-tool')!.classList.add('hidden');
};

// Initial Render
renderToolGrid();
