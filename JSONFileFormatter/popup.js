document.addEventListener('DOMContentLoaded', () => {
    const jsonInput = document.getElementById('json-input');
    const jsonOutput = document.getElementById('json-output');
    const btnFormat = document.getElementById('btn-format');
    const btnMinify = document.getElementById('btn-minify');
    const btnClear = document.getElementById('btn-clear');
    const btnCopy = document.getElementById('btn-copy');
    const btnUpload = document.getElementById('btn-upload');
    const btnDownload = document.getElementById('btn-download');
    const statusMsg = document.getElementById('status-msg');

    // Auto-focus input
    jsonInput.focus();

    // Helper: Show Status Message
    function showStatus(msg, type = 'normal') {
        statusMsg.textContent = msg;
        statusMsg.className = 'status-msg ' + type;

        // Clear success/error after 3 seconds
        if (type !== 'normal') {
            setTimeout(() => {
                statusMsg.textContent = '';
                statusMsg.className = 'status-msg';
            }, 3000);
        }
    }

    // Helper: Syntax Highlight
    function syntaxHighlight(json) {
        if (typeof json !== 'string') {
            json = JSON.stringify(json, undefined, 2);
        }
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'jv-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'jv-key';
                } else {
                    cls = 'jv-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'jv-boolean';
            } else if (/null/.test(match)) {
                cls = 'jv-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }

    // Format JSON
    function formatJSON() {
        const raw = jsonInput.value.trim();
        if (!raw) {
            showStatus('Please enter some JSON', 'error');
            return;
        }
        try {
            const parsed = JSON.parse(raw);
            const formatted = JSON.stringify(parsed, null, 2);
            jsonOutput.innerHTML = syntaxHighlight(formatted);
            showStatus('JSON formatted successfully', 'success');
            // Update input with formatted text (optional, but good for syncing)
            // jsonInput.value = formatted; 
            // Decided not to overwrite input for now, to keep original reference, 
            // but usually editors replace it. Let's keep input raw and output formatted.
        } catch (e) {
            showStatus('Invalid JSON: ' + e.message, 'error');
            jsonOutput.textContent = ''; // Clear output on error
        }
    }

    // Minify JSON
    function minifyJSON() {
        const raw = jsonInput.value.trim();
        if (!raw) {
            showStatus('Please enter some JSON', 'error');
            return;
        }
        try {
            const parsed = JSON.parse(raw);
            const minified = JSON.stringify(parsed);
            jsonOutput.textContent = minified; // No highlighting for minified
            showStatus('JSON minified', 'success');
        } catch (e) {
            showStatus('Invalid JSON: ' + e.message, 'error');
        }
    }

    // Copy Output
    function copyOutput() {
        const content = jsonOutput.textContent;
        if (!content) {
            showStatus('Nothing to copy', 'error');
            return;
        }
        navigator.clipboard.writeText(content).then(() => {
            showStatus('Copied to clipboard', 'success');
        }).catch(err => {
            showStatus('Failed to copy', 'error');
            console.error(err);
        });
    }

    // File Upload
    function handleFileUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,text/plain';

        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = event => {
                jsonInput.value = event.target.result;
                formatJSON(); // Auto-format on upload
                showStatus('File loaded: ' + file.name, 'success');
            };
            reader.readAsText(file);
        };

        input.click();
    }

    // File Download
    function handleFileDownload() {
        const content = jsonOutput.textContent || jsonInput.value;
        if (!content) {
            showStatus('Nothing to save', 'error');
            return;
        }

        try {
            // Validate before saving if it's visible content
            JSON.parse(content);
        } catch (e) {
            // Allow saving even if invalid? Probably better to warn.
            // Let's just save whatever is there.
        }

        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Convert Text to JSON
    function convertTextToJSON() {
        const raw = jsonInput.value.trim();
        if (!raw) {
            showStatus('Please enter some text', 'error');
            return;
        }

        let resultJSON = null;

        // Strategy 1: Try to fix "Loose JSON" (JS Object)
        // e.g. {key: 'value'} -> {"key": "value"}
        try {
            // Very basic loose parser:
            // 1. Wrap unquoted keys in quotes
            // 2. Convert single quotes to double quotes (for strings)
            // Note: This is a heuristic and can be fragile.
            let fixed = raw
                .replace(/(\w+)\s*:/g, '"$1":') // Quote keys
                .replace(/'/g, '"'); // Quote strings

            // Fix trailing commas (simple case)
            fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

            const parsed = JSON.parse(fixed);
            resultJSON = parsed;
        } catch (e) {
            // Strategy 1 failed.
        }

        // Strategy 2: Treat as Plain Text Lines -> JSON Array
        if (!resultJSON) {
            const lines = raw.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            if (lines.length > 0) {
                resultJSON = lines;
            }
        }

        if (resultJSON) {
            const formatted = JSON.stringify(resultJSON, null, 2);
            jsonOutput.innerHTML = syntaxHighlight(formatted);
            showStatus('Converted Text to JSON', 'success');
        } else {
            showStatus('Could not convert to JSON', 'error');
        }
    }

    // Event Listeners
    const btnText = document.getElementById('btn-text');
    btnText.addEventListener('click', convertTextToJSON);

    btnFormat.addEventListener('click', formatJSON);
    btnMinify.addEventListener('click', minifyJSON);

    btnClear.addEventListener('click', () => {
        jsonInput.value = '';
        jsonOutput.textContent = '';
        jsonInput.focus();
        showStatus('Cleared', 'normal');
    });

    btnCopy.addEventListener('click', copyOutput);
    btnUpload.addEventListener('click', handleFileUpload);
    btnDownload.addEventListener('click', handleFileDownload);

    // Keyboard Shortcuts (Cmd/Ctrl + Enter to format)
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            formatJSON();
        }
    });
});
