import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    pdfjs: ['pdfjs-dist'],
                    jspdf: ['jspdf'],
                    html2canvas: ['html2canvas'],
                    tesseract: ['tesseract.js']
                }
            }
        },
        chunkSizeWarningLimit: 1000 // Increase limit slightly as these libs are naturally large
    },
});
