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
import { renderPptToPdf } from './modules/pptToPdf';
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
    category: 'image' | 'pdf';
}

const tools: Tool[] = [
    { id: 'universal-conv', title: 'Universal Converter', description: 'Convert between any image format (SVG, PNG, JPG)', icon: '🔄', category: 'image' },
    { id: 'cropper', title: 'Image Cropper', description: 'Crop and rotate images', icon: '✂️', category: 'image' },
    { id: 'img-resizer', title: 'Image Resizer', description: 'Custom Dimensions (px)', icon: '📐', category: 'image' },
    { id: 'img-pdf', title: 'Image to PDF', description: 'Convert images to a PDF file', icon: '📄', category: 'image' },
    { id: 'img-reducer', title: 'Image Reducer', description: 'Reduce image file size', icon: '📉', category: 'image' },
    { id: 'svg-conv', title: 'SVG to Image', description: 'Convert SVG to Images', icon: '🎨', category: 'image' },
    { id: 'pdf-img', title: 'PDF to Image', description: 'Extract pages as images', icon: '🖼️', category: 'pdf' },
    { id: 'pdf-docx', title: 'PDF to DOCX', description: 'Convert PDF to Word document', icon: '📝', category: 'pdf' },
    { id: 'pdf-ppt', title: 'PDF to PPT', description: 'Convert PDF to PowerPoint', icon: '📊', category: 'pdf' },
    { id: 'pdf-compress', title: 'PDF Compressor', description: 'Reduce PDF file size', icon: '📦', category: 'pdf' },
    { id: 'pdf-merge', title: 'Merge PDF', description: 'Combine multiple PDFs', icon: '🔗', category: 'pdf' },
    { id: 'pdf-split', title: 'Split PDF', description: 'Extract pages from PDF', icon: '✂️', category: 'pdf' },
    { id: 'pdf-ocr', title: 'PDF to Text', description: 'Extract text via OCR', icon: '🔍', category: 'pdf' },
    { id: 'pdf-security', title: 'PDF Security', description: 'Protect/Unlock PDF', icon: '🔒', category: 'pdf' },
    { id: 'ppt-pdf', title: 'PPT to PDF', description: 'Convert PowerPoint to PDF', icon: '📄', category: 'pdf' }
];

let currentCategory: 'image' | 'pdf' = 'image';

function renderToolGrid() {
    const container = document.getElementById('tool-container')!;
    container.innerHTML = '';

    tools.filter(t => t.category === currentCategory).forEach(tool => {
        const card = document.createElement('div');
        card.className = 'tool-card';
        card.innerHTML = `
            <i>${tool.icon}</i>
            <h3>${tool.title}</h3>
            <p>${tool.description}</p>
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
    } else if (toolId === 'ppt-pdf') {
        renderPptToPdf(toolUI);
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
        const category = target.dataset.tool as 'image' | 'pdf';

        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        target.classList.add('active');

        currentCategory = category;
        document.getElementById('tool-title')!.innerText = category === 'image' ? 'Image Tools' : 'PDF Tools';
        document.getElementById('tool-desc')!.innerText = category === 'image' ? 'Convert, crop, and resize images locally.' : 'Manage and convert PDF documents offline.';

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
