import JSZip from 'jszip';
import jsPDF from 'jspdf';

export async function renderPptToPdf(container: HTMLElement) {
    container.innerHTML = `
        <div class="tool-io">
            <input type="file" id="ppt-pdf-input" accept=".pptx" class="file-input" />
            <div id="ppt-pdf-ui" class="hidden">
                <p id="ppt-pdf-info"></p>
                <div class="tool-controls">
                    <button id="convert-ppt-pdf-btn" class="primary-btn">Convert to PDF & Download</button>
                </div>
            </div>
            <div id="loader" class="hidden">Processing...</div>
            <p class="warning-note">Note: Text and basic layouts are preserved. Complex animations and transitions are not included.</p>
        </div>
    `;

    const input = document.getElementById('ppt-pdf-input') as HTMLInputElement;
    const ui = document.getElementById('ppt-pdf-ui')!;
    const info = document.getElementById('ppt-pdf-info')!;
    const convertBtn = document.getElementById('convert-ppt-pdf-btn')!;
    const loader = document.getElementById('loader')!;

    let currentFile: File | null = null;

    input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        currentFile = file;
        info.innerText = `Selected: ${file.name}`;
        ui.classList.remove('hidden');
    };

    convertBtn.onclick = async () => {
        if (!currentFile) {
            alert('Please select a PPTX file first.');
            return;
        }

        loader.classList.remove('hidden');
        ui.classList.add('hidden');

        try {
            const arrayBuffer = await currentFile.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);

            // Parse presentation.xml to get slide count
            const presentationXml = await zip.file('ppt/presentation.xml')?.async('text');
            if (!presentationXml) {
                throw new Error('Invalid PPTX file structure');
            }

            // Count slides
            const slideMatches = presentationXml.match(/<p:sldId /g);
            const slideCount = slideMatches ? slideMatches.length : 0;

            if (slideCount === 0) {
                throw new Error('No slides found in presentation');
            }

            // Create PDF
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Process each slide
            for (let i = 1; i <= slideCount; i++) {
                if (i > 1) {
                    pdf.addPage();
                }

                const slideFile = zip.file(`ppt/slides/slide${i}.xml`);
                if (!slideFile) continue;

                const slideXml = await slideFile.async('text');

                // Extract text content from slide
                const textMatches = slideXml.match(/<a:t>([^<]+)<\/a:t>/g);
                let yPosition = 20;

                if (textMatches && textMatches.length > 0) {
                    textMatches.forEach((match) => {
                        const text = match.replace(/<\/?a:t>/g, '');
                        if (text.trim()) {
                            pdf.setFontSize(14);
                            pdf.text(text, 20, yPosition, { maxWidth: 250 });
                            yPosition += 10;
                        }
                    });
                } else {
                    pdf.setFontSize(12);
                    pdf.text(`Slide ${i}`, 20, yPosition);
                }
            }

            // Download PDF
            const fileName = currentFile.name.replace(/\.pptx$/i, '.pdf');
            pdf.save(fileName);

            loader.classList.add('hidden');
            ui.classList.remove('hidden');
            alert(`Successfully converted ${slideCount} slides to PDF!`);
        } catch (error) {
            console.error('PPT to PDF error:', error);
            loader.classList.add('hidden');
            ui.classList.remove('hidden');
            alert('Failed to convert PPTX to PDF. Please ensure the file is a valid PowerPoint presentation.');
        }
    };
}
