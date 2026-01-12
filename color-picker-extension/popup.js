document.addEventListener('DOMContentLoaded', () => {
    const btnPick = document.getElementById('btn-pick');
    const previewSection = document.getElementById('preview-section');
    const colorSwatch = document.getElementById('color-swatch');
    const valHex = document.getElementById('val-hex');
    const valRgb = document.getElementById('val-rgb');
    const valHsl = document.getElementById('val-hsl');
    const historyGrid = document.getElementById('history-grid');
    const toast = document.getElementById('toast');

    // Load history on start
    loadHistory();

    // 1. Core Feature: EyeDropper API
    btnPick.addEventListener('click', async () => {
        if (!window.EyeDropper) {
            alert('Your browser does not support the EyeDropper API.');
            return;
        }

        try {
            const eyeDropper = new EyeDropper();
            // The browser minimizes the popup here, allows selection, then reopens
            const result = await eyeDropper.open();
            const hex = result.sRGBHex;

            updateUI(hex);
            saveToHistory(hex);
        } catch (e) {
            // User canceled selection; do nothing
            console.log('Selection canceled');
        }
    });

    // 2. Update UI with Color Values
    function updateUI(hex) {
        previewSection.style.display = 'block';
        colorSwatch.style.backgroundColor = hex;

        const rgb = hexToRgb(hex);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

        const rgbString = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        const hslString = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

        valHex.textContent = hex;
        valRgb.textContent = rgbString;
        valHsl.textContent = hslString;
    }

    // 3. Color Math Conversions
    function hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return { r, g, b };
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    // 4. Clipboard Functionality
    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('.value-row');
            const text = row.querySelector('code').textContent;
            navigator.clipboard.writeText(text).then(() => {
                showToast();
            });
        });
    });

    function showToast() {
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 1500);
    }

    // 5. Storage / History Management
    function saveToHistory(hex) {
        chrome.storage.local.get({ colors: [] }, (result) => {
            let colors = result.colors;
            // Remove duplicate if exists, add to top
            colors = colors.filter(c => c !== hex);
            colors.unshift(hex);
            // Limit to 12 items
            if (colors.length > 12) colors.pop();

            chrome.storage.local.set({ colors: colors }, () => {
                loadHistory();
            });
        });
    }

    function loadHistory() {
        chrome.storage.local.get({ colors: [] }, (result) => {
            historyGrid.innerHTML = '';
            result.colors.forEach(hex => {
                const div = document.createElement('div');
                div.className = 'history-item';
                div.style.backgroundColor = hex;
                div.title = hex;
                div.addEventListener('click', () => {
                    updateUI(hex);
                    navigator.clipboard.writeText(hex).then(showToast);
                });
                historyGrid.appendChild(div);
            });
        });
    }
});