document.addEventListener('DOMContentLoaded', () => {
    const startInput = document.getElementById('markup-input'); // Changed ID to match new HTML plan
    const resultDiv = document.getElementById('preview-output'); // Changed ID to match new HTML plan
    const btnCopy = document.getElementById('btn-copy');
    const btnClear = document.getElementById('btn-clear');

    // Initial Conversion (if content exists)
    if (startInput.value) {
        updatePreview();
    }

    // Real-time Conversion
    startInput.addEventListener('input', () => {
        updatePreview();
    });

    function updatePreview() {
        const text = startInput.value;
        const html = window.parseMarkdown(text);
        resultDiv.innerHTML = html;
    }

    // Copy to Clipboard
    btnCopy.addEventListener('click', () => {
        const html = resultDiv.innerHTML;
        navigator.clipboard.writeText(html).then(() => {
            const originalText = btnCopy.textContent;
            btnCopy.textContent = 'Copied!';
            setTimeout(() => {
                btnCopy.textContent = originalText;
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    });

    // Clear Input
    btnClear.addEventListener('click', () => {
        startInput.value = '';
        updatePreview();
        startInput.focus();
    });
});
