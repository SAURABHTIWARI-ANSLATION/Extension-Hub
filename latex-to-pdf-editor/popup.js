document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const latexEditor = document.getElementById('latex-editor');
    const lineNumbers = document.getElementById('line-numbers');
    const previewArea = document.getElementById('preview-area');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const exportBtn = document.getElementById('export-btn');
    const clearBtn = document.getElementById('clear-btn');
    const statusMessage = document.getElementById('status-message');
    const saveStatus = document.getElementById('save-status');
    const templateSelect = document.getElementById('template-select');

    let isGenerated = false;

    // --- Templates ---
    const templates = {
        blank: '',
        article: `\\documentclass{article}
\\usepackage{amsmath}

\\title{My First Document}
\\author{Author Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
This is a standard LaTeX article template.

\\section{Math Example}
squared distance: $d^2 = x^2 + y^2$

\\end{document}`,
        homework: `\\documentclass{article}
\\usepackage{fancyhdr}
\\usepackage{amsmath}

\\pagestyle{fancy}
\\lhead{Name: }
\\rhead{Assignment 1}

\\begin{document}

\\section*{Problem 1}
Solve for $x$:
\\[ x^2 - 5x + 6 = 0 \\]

\\end{document}`,
        resume: `\\documentclass{article}
\\usepackage{titlesec}
\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]

\\begin{document}

\\section*{John Doe}
Software Engineer | email@example.com

\\section*{Experience}
\\textbf{Company A} - Developer \\\\
Worked on cool things.

\\end{document}`
    };

    // --- State & Helpers ---
    const updateStatus = (text, type = '') => {
        statusMessage.textContent = text;
        statusMessage.className = 'status-message ' + (type ? `status-${type}` : '');
    };

    const setPreviewContent = (htmlContent) => {
        previewArea.innerHTML = htmlContent;
    };

    const updateLineNumbers = () => {
        const lines = latexEditor.value.split('\n').length;
        lineNumbers.innerHTML = Array(lines).fill(0).map((_, i) => i + 1).join('<br>');
    };

    const helperEscapeHtml = (text) => {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // --- Initialization: Load from Storage ---
    const savedContent = localStorage.getItem('latex_autosave');
    if (savedContent) {
        latexEditor.value = savedContent;
        updateLineNumbers();
        updateStatus('Restored specific auto-saved session.');
        // Trigger initial render for restored content
        setTimeout(() => renderLogic(savedContent), 100);
    }

    // --- Core Render Logic (Reused by Live Preview & Button) ---
    const renderLogic = (latexCode) => {
        if (!latexCode.trim()) return;

        try {
            const renderedHtml = parseLatexToHtml(latexCode);

            const previewTemplate = `
                <div class="paper-preview">
                    ${renderedHtml}
                </div>
            `;

            setPreviewContent(previewTemplate);
            downloadBtn.disabled = false;
            isGenerated = true;

            // Calculate Word Count (approx)
            const textOnly = renderedHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            const count = textOnly ? textOnly.split(' ').length : 0;
            document.getElementById('word-count').textContent = `${count} words`;

        } catch (e) {
            console.error(e);
        }
    };

    // --- Debounce Helper ---
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Live Preview Handler
    const handleLivePreview = debounce((text) => {
        renderLogic(text);
    }, 500); // 500ms delay

    // --- Event Listeners ---

    // Editor: Line Numbers & Auto-Save & Live Preview
    latexEditor.addEventListener('input', () => {
        const text = latexEditor.value;

        // 1. Line Numbers
        updateLineNumbers();

        // 2. Auto-save
        localStorage.setItem('latex_autosave', text);
        saveStatus.style.display = 'inline';
        saveStatus.textContent = 'Saving...';

        clearTimeout(window.saveTimer);
        window.saveTimer = setTimeout(() => {
            saveStatus.textContent = 'Saved';
            setTimeout(() => { saveStatus.style.display = 'none'; }, 2000);
        }, 500);

        // 3. Live Preview
        handleLivePreview(text);

        // 4. Instant Word Count Update (Raw estimate before render)
        const count = text.trim() ? text.trim().split(/\s+/).length : 0;
        document.getElementById('word-count').textContent = `${count} words`;
    });

    latexEditor.addEventListener('scroll', () => {
        lineNumbers.scrollTop = latexEditor.scrollTop;
    });

    // Template Selection
    templateSelect.addEventListener('change', (e) => {
        const key = e.target.value;
        if (templates[key] !== undefined) {
            if (latexEditor.value.trim() && !confirm('This will overwrite your current code. Continue?')) {
                e.target.value = ""; // Reset selection
                return;
            }
            latexEditor.value = templates[key];
            updateLineNumbers();
            localStorage.setItem('latex_autosave', latexEditor.value);
            e.target.value = "";
            latexEditor.focus();

            // Trigger immediate render
            renderLogic(latexEditor.value);
        }
    });

    // Clear Action
    clearBtn.addEventListener('click', () => {
        if (!confirm('Are you sure you want to clear everything?')) return;
        latexEditor.value = '';
        localStorage.removeItem('latex_autosave');
        updateLineNumbers();
        setPreviewContent('<div class="placeholder-text">Preview will appear here...</div>');
        updateStatus('');
        downloadBtn.disabled = true;
        isGenerated = false;
        latexEditor.focus();
        document.getElementById('word-count').textContent = '0 words';
    });

    // --- Advanced LaTeX Parsing Logic ---
    const parseLatexToHtml = (fullLatex) => {

        // 1. EXTRACT PREAMBLE DATA (title, author, date)
        let title = '';
        let author = '';
        let date = '';
        
        // Extract title
        const titleMatch = fullLatex.match(/\\title\{([^}]+)\}/);
        if (titleMatch) {
            title = titleMatch[1];
        }
        
        // Extract author
        const authorMatch = fullLatex.match(/\\author\{([^}]+)\}/);
        if (authorMatch) {
            author = authorMatch[1];
        }
        
        // Extract date
        const dateMatch = fullLatex.match(/\\date\{([^}]+)\}/);
        if (dateMatch) {
            date = dateMatch[1];
            // Handle \today command
            if (date === '\\today') {
                const today = new Date();
                const months = ['January', 'February', 'March', 'April', 'May', 'June',
                               'July', 'August', 'September', 'October', 'November', 'December'];
                date = `${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;
            }
        }

        // 2. EXTRACT BODY (Critical: Ignore Preamble definitions)
        let body = fullLatex;
        const beginDocIndex = body.indexOf('\\begin{document}');
        if (beginDocIndex !== -1) {
            body = body.substring(beginDocIndex + 16); // 16 is length of \begin{document}
        }
        const endDocIndex = body.lastIndexOf('\\end{document}');
        if (endDocIndex !== -1) {
            body = body.substring(0, endDocIndex);
        }

        // 3. REMOVE title, author, date commands from body (they're already extracted)
        body = body.replace(/\\title\{[^}]*\}/g, '');
        body = body.replace(/\\author\{[^}]*\}/g, '');
        body = body.replace(/\\date\{[^}]*\}/g, '');

        // 4. HANDLE \maketitle - Replace with formatted title block
        if (body.includes('\\maketitle')) {
            let titleBlock = '';
            if (title || author || date) {
                titleBlock = '<div class="title-block" style="text-align: center; margin-bottom: 2em;">';
                if (title) {
                    titleBlock += `<h1 style="font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em;">${title}</h1>`;
                }
                if (author) {
                    titleBlock += `<div style="font-size: 1em; margin-bottom: 0.3em;">${author}</div>`;
                }
                if (date) {
                    titleBlock += `<div style="font-size: 0.9em; margin-bottom: 1em;">${date}</div>`;
                }
                titleBlock += '</div>';
            }
            body = body.replace(/\\maketitle/g, titleBlock);
        }

        // 5. PRE-PROCESS CLEANUP
        body = body.replace(/%.*$/gm, ''); // Remove comments

        // Fix: Correctly handle LaTeX pipe (\|) and math pipe ($|$)
        // The previous regex /\\|/g matched "\" OR "" (empty), causing global pipe insertion.
        body = body.replace(/\\\\/g, '&#124;');
        body = body.replace(/\$\|\$/g, '&#124;');
        
        body = body.replace(/\\centering/g, ''); // Handled by container usually
        body = body.replace(/\\hfill/g, ''); // Filler
        body = body.replace(/\\vspace\{.*?\}/g, ''); // Spacing
        body = body.replace(/\\,/g, ' '); // Small space
        
        // 6. HELPER: Replace Commands with Balanced Braces
        // handling nested {} like \cmd{\textbf{A}}{\href{B}}
        const replaceMacro = (text, cmdName, argCount, formatter) => {
            let result = "";
            let ptr = 0;

            while (true) {
                const cmdIdx = text.indexOf(cmdName, ptr);
                if (cmdIdx === -1) {
                    result += text.slice(ptr);
                    break;
                }

                // Check if it's a real command start (e.g. avoid matching \subheading inside \resumesubheading)
                // Actually regex is safer for strict word boundary, but simple check:
                // Preceding char should be space, newline, or '}' or '{' -- complex to verify in loop.
                // For now, assume unique command names provided in our list.

                result += text.slice(ptr, cmdIdx);
                let current = cmdIdx + cmdName.length;

                // Parse Arguments
                let args = [];
                let valid = true;

                for (let i = 0; i < argCount; i++) {
                    // Skip whitespace before arg
                    while (current < text.length && /\s/.test(text[current])) current++;

                    if (current >= text.length || text[current] !== '{') {
                        valid = false; break;
                    }

                    let braceCount = 1;
                    let innerStart = current + 1;
                    let innerEnd = innerStart;

                    while (innerEnd < text.length && braceCount > 0) {
                        if (text[innerEnd] === '{') braceCount++;
                        else if (text[innerEnd] === '}') braceCount--;
                        innerEnd++;
                    }

                    if (braceCount === 0) {
                        // Found valid arg
                        args.push(text.slice(innerStart, innerEnd - 1));
                        current = innerEnd;
                    } else {
                        valid = false; break;
                    }
                }

                if (valid) {
                    // Recursively process arguments then format
                    const parsedArgs = args.map(arg => parseLatexToHtml(arg)); // Recursion!
                    result += formatter(...parsedArgs);
                    ptr = current;
                } else {
                    // Failed to parse args, just treat command as text
                    result += text.slice(cmdIdx, cmdIdx + cmdName.length);
                    ptr = cmdIdx + cmdName.length;
                }
            }
            return result;
        };

        // 7. APPLY MACROS (Order matters: most specific first)

        // Resume Subheading: \resumeSubheading{Title}{Loc}{Role}{Date}
        body = replaceMacro(body, '\\resumeSubheading', 4, (title, loc, role, date) => {
            return `<div class="resume-subheading">
                <div class="rs-row"><strong>${title}</strong><span>${loc}</span></div>
                <div class="rs-row"><em>${role}</em><em>${date}</em></div>
            </div>`;
        });

        // Resume Project: \resumeProjectHeading{Title}{Date}
        body = replaceMacro(body, '\\resumeProjectHeading', 2, (title, date) => {
            return `<div class="resume-project">
                <div class="rs-row"><span>${title}</span><span>${date}</span></div>
             </div>`;
        });

        // Resume Item: \resumeItem{Text}
        body = replaceMacro(body, '\\resumeItem', 1, (text) => `<li>${text}</li>`);

        // Standard LaTeX styles (Nested aware)
        body = replaceMacro(body, '\\textbf', 1, (text) => `<strong>${text}</strong>`);
        body = replaceMacro(body, '\\textit', 1, (text) => `<em>${text}</em>`);
        body = replaceMacro(body, '\\underline', 1, (text) => `<u>${text}</u>`);
        body = replaceMacro(body, '\\emph', 1, (text) => `<em>${text}</em>`); // Emph
        body = replaceMacro(body, '\\href', 2, (url, text) => `<a href="${url}" target="_blank">${text}</a>`);
        body = replaceMacro(body, '\\section', 1, (text) => `<h2>${text}</h2>`);

        // 8. ENVIRONMENTS & LISTS (Regex is okay here as structure markers)
        body = body.replace(/\\begin\{itemize\}(\[.*?\])?/g, '<ul>');
        body = body.replace(/\\end\{itemize\}/g, '</ul>');
        body = body.replace(/\\resumeSubHeadingListStart/g, '<ul class="resume-list">');
        body = body.replace(/\\resumeSubHeadingListEnd/g, '</ul>');
        body = body.replace(/\\resumeItemListStart/g, '<ul>');
        body = body.replace(/\\resumeItemListEnd/g, '</ul>');

        // Fix: \item might be followed by '{' or space. Use negative lookahead to avoid matching \itemize
        body = body.replace(/\\item(?![a-zA-Z])/g, '<li>');

        // Center Environment
        body = body.replace(/\\begin\{center\}/g, '<div style="text-align: center;">');
        body = body.replace(/\\end\{center\}/g, '</div>');

        // 9. SC Shape & Sizes (Simple Regex fallback)
        body = body.replace(/\\scshape/g, ''); // CSS Small-caps class logic is hard via regex, just stripping for clean text or wrapping?
        // Let's assume the user uses \textbf{\scshape Name}, our recursion handles textbf, scshape remains inside. 
        // We can wrap the whole body in specific logic, but stripping \scshape usually looks cleaner than broken tags.
        // Or replace with span:
        body = body.replace(/\\Huge/g, '<span style="font-size: 24px">');
        body = body.replace(/\\large/g, '<span style="font-size: 14px">');
        body = body.replace(/\\small/g, '<span style="font-size: 11px">');

        // 10. Cleanup remaining artifacts
        body = body.replace(/\\\\/g, '<br>');
        body = body.replace(/\\/g, ''); // Remove stray backslashes
        body = body.replace(/[{}]/g, ''); // Remove stray braces (after macros consumed them)

        return body;
    };


    // Generate PDF / Preview Action
    generateBtn.addEventListener('click', () => {
        const latexCode = latexEditor.value.trim();

        if (!latexCode) {
            updateStatus('Please enter some LaTeX code.', 'error');
            return;
        }

        updateStatus('Rendering...', '');
        generateBtn.disabled = true;

        setTimeout(() => {
            if (latexCode.includes('\\error')) {
                updateStatus('Compilation Error: Undefined control sequence.', 'error');
                generateBtn.disabled = false;
                return;
            }

            // Real Rendering Logic
            try {
                const renderedHtml = parseLatexToHtml(latexCode);

                const previewTemplate = `
                    <div class="paper-preview">
                        ${renderedHtml}
                    </div>
                `;

                setPreviewContent(previewTemplate);
                updateStatus('Preview Generated Successfully!', 'success');
                downloadBtn.disabled = false;
                isGenerated = true;
            } catch (e) {
                console.error(e);
                updateStatus('Rendering Error.', 'error');
            } finally {
                generateBtn.disabled = false;
            }
        }, 500);
    });

    // Export .tex Action
    exportBtn.addEventListener('click', () => {
        const latexCode = latexEditor.value;
        if (!latexCode) {
            updateStatus('Nothing to export!', 'error');
            return;
        }
        const blob = new Blob([latexCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.tex';
        a.click();
        URL.revokeObjectURL(url);
        updateStatus('Exported source file.', 'success');
    });

    const copyBtn = document.getElementById('copy-btn');

    // Copy to Clipboard (Word Compatible)
    copyBtn.addEventListener('click', async () => {
        if (!isGenerated) {
            updateStatus('Nothing to copy. Content not generated.', 'error');
            return;
        }

        const content = document.getElementById('preview-area').innerHTML;

        // We need to write both text/html (for Word) and text/plain (callback)
        // Creating a Blob for HTML
        const blobHtml = new Blob([content], { type: 'text/html' });
        const blobText = new Blob([document.getElementById('preview-area').innerText], { type: 'text/plain' });

        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': blobHtml,
                    'text/plain': blobText
                })
            ]);
            updateStatus('Copied! Paste into Word/Docs.', 'success');
        } catch (err) {
            console.error('Copy failed:', err);
            updateStatus('Copy failed. Helper: Select & Cmd+C manually.', 'error');
        }
    });

    // Real PDF Download Action (Via Print Tab)
    downloadBtn.addEventListener('click', () => {
        if (!isGenerated) return;

        updateStatus('Opening Print View...', '');

        const content = document.getElementById('preview-area').querySelector('.paper-preview').innerHTML;

        // Save to LocalStorage so the new tab can read it
        localStorage.setItem('latex_print_content', content);

        // Open the dedicated print page
        chrome.tabs.create({ url: 'print.html' });

        updateStatus('Select "Save as PDF" in the new tab.', 'success');
    });

    // Initial Line Numbers
    updateLineNumbers();
});
