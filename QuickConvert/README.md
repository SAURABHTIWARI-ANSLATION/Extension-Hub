# QuickConvert - The Ultimate Offline Image & PDF Toolkit

✨ **QuickConvert** is a powerful, high-performance Chrome Extension designed for fast, secure, and 100% offline file processing. Whether you need to convert images, edit PDFs, or perform OCR, QuickConvert does it all locally in your browser—meaning your data never leaves your computer.

## 🚀 Key Features

### 🖼️ Image Tools
- **Universal Converter**: Effortlessly convert between JPG, PNG, WebP, and SVG.
- **Image Cropper**: Precision cropping with aspect ratio locking and rotation.
- **Image Resizer**: Adjust dimensions to exact pixel values with aspect ratio control.
- **Image Reducer**: Compress images to save space without significant quality loss.
- **SVG to Image**: Render vector graphics into high-quality PNG or JPEG formats.
- **Image to PDF**: Combine or convert multiple images into a single, professional PDF document.

### 📄 PDF Tools
- **PDF to Image**: Extract every page of a PDF as a high-resolution image.
- **PDF to DOCX**: Convert PDF documents into editable Word files.
- **PDF to PPT**: Transform PDF presentations into PowerPoint slides.
- **PDF to Text (OCR)**: Extract text from scanned PDFs using built-in, local Optical Character Recognition.
- **Merge PDF**: Combine multiple PDF files into one seamless document.
- **Split PDF**: Extract specific page ranges or individual pages from a large PDF.
- **PDF Compressor**: Reduce the file size of your PDFs for easier sharing.
- **PDF Security**: Add password protection (encryption) or unlock protected PDFs with ease.
- **PPT to PDF**: Convert PowerPoint presentations directly to PDF.

## 🛡️ Security & Privacy (Manifest V3)

QuickConvert is built with a **Security-First** philosophy, adhering to the strictest Google Chrome Manifest V3 policies:

- **100% Offline Processing**: No remote APIs or servers are used. All processing (including OCR) happens locally.
- **Privacy Guaranteed**: Your sensitive documents never leave your machine. No tracking, no data collection.
- **Strict CSP Compliance**: No inline scripts or remote code execution.
- **Local Assets**: All heavy dependencies (Tesseract.js OCR, PDF.js, etc.) are bundled directly within the extension to ensure stability and security.

## 🛠️ Technical Stack

- **Framework**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Core Libraries**:
    - [Tesseract.js](https://tesseract.projectnaptha.com/) for Local OCR
    - [pdf-lib](https://pdf-lib.js.org/) & [pdfjs-dist](https://mozilla.github.io/pdf.js/) for PDF manipulation
    - [Cropper.js](https://fengyuanchen.github.io/cropperjs/) for image editing
    - [jspdf](https://rawgit.com/MrRio/jsPDF/master/docs/index.html) for PDF generation
    - [pptxgenjs](https://gitbrent.github.io/PptxGenJS/) for PowerPoint creation

## 📦 Installation & Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [npm](https://www.npmjs.com/)

### Development Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development mode:
   ```bash
   npm run dev
   ```

### Building for Production
1. Build the project:
   ```bash
   npm run build
   ```
2. The production-ready files will be in the `dist/` directory.
3. Open Chrome and navigate to `chrome://extensions/`.
4. Enable **Developer mode**.
5. Click **Load unpacked** and select the `dist/` folder.

---

Built with ❤️ for privacy and productivity.
