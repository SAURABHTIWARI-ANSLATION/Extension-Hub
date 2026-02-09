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

                // Extract all text content from slide - try multiple patterns
                let allText: string[] = [];

                // Pattern 1: Standard text runs
                const textPattern1 = /<a:t[^>]*>([^<]+)<\/a:t>/g;
                let match;
                while ((match = textPattern1.exec(slideXml)) !== null) {
                    allText.push(match[1]);
                }

                // Pattern 2: Text without attributes
                const textPattern2 = /<t[^>]*>([^<]+)<\/t>/g;
                while ((match = textPattern2.exec(slideXml)) !== null) {
                    allText.push(match[1]);
                }

                // Add slide title
                pdf.setFontSize(16);
                pdf.setFont('helvetica', 'bold');
                pdf.text(`Slide ${i}`, 20, 20);

                let yPosition = 35;

                if (allText.length > 0) {
                    // Remove duplicates and filter empty
                    const uniqueText = [...new Set(allText)].filter(t => t.trim());

                    uniqueText.forEach((text, index) => {
                        pdf.setFontSize(12);
                        pdf.setFont('helvetica', 'normal');

                        // Wrap text if too long
                        const lines = pdf.splitTextToSize(text.trim(), 250);
                        lines.forEach((line: string) => {
                            if (yPosition > 180) { // If near bottom, add new page
                                pdf.addPage();
                                yPosition = 20;
                            }
                            pdf.text(line, 20, yPosition);
                            yPosition += 7;
                        });

                        yPosition += 3; // Extra space between text blocks
                    });
                } else {
                    pdf.setFontSize(10);
                    pdf.setFont('helvetica', 'italic');
                    pdf.text('(No text content found on this slide)', 20, yPosition);
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
