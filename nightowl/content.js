// NightOwl content.js v3.0
(function () {
    if (window.hasRun) return;
    window.hasRun = true;

    let currentState = {
        isDark:          false,
        brightness:      100,
        contrast:        100,
        saturation:      100,
        eyeFilter:       0,
        autoNight:       false,
        readingMode:     false,
        bgShade:         'none',
        shadeIntensity:  0,
        bgColorEnabled:  false,
        bgColor:         '#FFFDE7',
        textScale:       100,
        fontFamily:      'default'
    };

    let observer          = null;
    let autoNightInterval = null;
    const domain          = window.location.hostname;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        chrome.storage.local.get(['disabledSites'], (data) => {
            const disabled = data.disabledSites || [];
            if (disabled.includes(domain)) return;
            initializeTheme();
        });
    }

    function initializeTheme() {
        chrome.storage.local.get(
            ['isDark','brightness','contrast','saturation','eyeFilter','autoNight',
             'readingMode','bgShade','shadeIntensity',
             'bgColorEnabled','bgColor','textScale','fontFamily',
             'nightFrom','nightTo'],
            (result) => {
                const config = {
                    isDark:         result.isDark          ?? false,
                    brightness:     result.brightness      ?? 100,
                    contrast:       result.contrast        ?? 100,
                    saturation:     result.saturation      ?? 100,
                    eyeFilter:      result.eyeFilter       ?? 0,
                    autoNight:      result.autoNight       ?? false,
                    readingMode:    result.readingMode     ?? false,
                    bgShade:        result.bgShade         ?? 'none',
                    shadeIntensity: result.shadeIntensity  ?? 0,
                    bgColorEnabled: result.bgColorEnabled  ?? false,
                    bgColor:        result.bgColor         ?? '#FFFDE7',
                    textScale:      result.textScale       ?? 100,
                    fontFamily:     result.fontFamily      ?? 'default',
                    nightFrom:      result.nightFrom       ?? '20:00',
                    nightTo:        result.nightTo         ?? '07:00'
                };
                applyAll(config);
                if (config.autoNight) startAutoNight(config.nightFrom, config.nightTo);
            }
        );
    }

    chrome.runtime.onMessage.addListener((request) => {
        if (request.type === 'applyTheme') {
            applyAll(request.config);
            // Sync auto night schedule if enabled
            if (request.config.autoNight) {
                startAutoNight(request.config.nightFrom, request.config.nightTo);
            }
        }
        if (request.type === 'toggleDarkShortcut') {
            currentState.isDark = !currentState.isDark;
            applyAll(currentState);
        }
        if (request.type === 'startAutoNight') {
            chrome.storage.local.get(['nightFrom','nightTo'], (data) => {
                startAutoNight(data.nightFrom || '20:00', data.nightTo || '07:00');
            });
        }
        if (request.type === 'stopAutoNight') stopAutoNight();
        if (request.type === 'disableSite')   removeAll();
    });

    function applyAll(config) {
        currentState = { ...currentState, ...config };
        applyDarkMode(currentState);
        applyEyeFilter(currentState.eyeFilter);
        applyReadingMode(currentState.readingMode);
        applyBgShade(currentState);
        applyBgColor(currentState);
        applyTextSize(currentState.textScale);
        applyFontFamily(currentState.fontFamily);
    }

    function removeAll() {
        document.documentElement.style.filter = '';
        removeNode('udm-fix');
        removeNode('nightowl-reading-style');
        removeNode('nightowl-bg-shade');
        removeNode('nightowl-bg-color');
        removeNode('nightowl-text-size');
        removeNode('nightowl-font-family');
        const overlay = document.getElementById('nightowl-eye-overlay');
        if (overlay) overlay.remove();
        if (observer) { observer.disconnect(); observer = null; }
        stopAutoNight();
    }

    // ── DARK MODE ──
    function applyDarkMode(config) {
        const html     = document.documentElement;
        const bright   = (config.brightness ?? 100) / 100;
        const contrast = (config.contrast   ?? 100) / 100;
        const sat      = (config.saturation ?? 100) / 100;

        html.style.filter = '';
        removeNode('udm-fix');
        if (observer) { observer.disconnect(); observer = null; }

        if (config.isDark) {
            html.style.filter = `invert(1) hue-rotate(180deg) brightness(${bright}) contrast(${contrast}) saturate(${sat})`;
            injectFixStyles();
            observer = new MutationObserver(() => {
                if (!document.getElementById('udm-fix')) injectFixStyles();
            });
            if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true });
            }
        } else {
            html.style.filter = `brightness(${bright}) contrast(${contrast}) saturate(${sat})`;
        }
    }

    // ── EYE FILTER ──
    function applyEyeFilter(value) {
        if (!document.body) return;
        let overlay = document.getElementById('nightowl-eye-overlay');
        if (value === 0) { if (overlay) overlay.remove(); return; }
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'nightowl-eye-overlay';
            overlay.style.cssText = `
                position:fixed;top:0;left:0;
                width:100vw;height:100vh;
                pointer-events:none;z-index:2147483645;
                mix-blend-mode:multiply;
                transition:background-color .5s ease;
            `;
            document.body.appendChild(overlay);
        }
        let r, g, b, alpha;
        if (value > 0) { r = 255; g = 160; b = 0;   alpha = value / 150; }
        else           { r = 0;   g = 100; b = 255;  alpha = Math.abs(value) / 300; }
        overlay.style.backgroundColor = `rgba(${r},${g},${b},${alpha})`;
    }

    // ── BACKGROUND COLOR ──
    function applyBgColor(config) {
        removeNode('nightowl-bg-color');
        if (!config.bgColorEnabled || !config.bgColor) return;
        if (!document.head) return;
        const style = document.createElement('style');
        style.id = 'nightowl-bg-color';
        style.textContent = `
            html, body {
                background-color: ${config.bgColor} !important;
                background-image: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    // ── BACKGROUND SHADE ──
    const SHADE_COLORS = {
        none:   null,
        warm:   [255, 160, 60],
        cool:   [60,  140, 255],
        rose:   [255, 80,  120],
        forest: [40,  160, 80],
        violet: [130, 80,  255]
    };

    function applyBgShade(config) {
        removeNode('nightowl-bg-shade');
        const shade     = config.bgShade     || 'none';
        const intensity = (config.shadeIntensity || 0) / 100;
        if (shade === 'none' || intensity === 0 || !document.body) return;

        const rgb = SHADE_COLORS[shade];
        if (!rgb) return;

        const el = document.createElement('div');
        el.id = 'nightowl-bg-shade';
        el.style.cssText = `
            position:fixed;top:0;left:0;
            width:100vw;height:100vh;
            background:rgba(${rgb[0]},${rgb[1]},${rgb[2]},${intensity * 0.35});
            pointer-events:none;z-index:2147483644;
            mix-blend-mode:multiply;
            transition:background-color .4s ease;
        `;
        document.body.appendChild(el);
    }

    // ── TEXT SIZE ──
    function applyTextSize(textScale) {
        removeNode('nightowl-text-size');
        if (!textScale || textScale === 100 || !document.head) return;
        const style = document.createElement('style');
        style.id = 'nightowl-text-size';
        style.textContent = `html { font-size: ${textScale}% !important; }`;
        document.head.appendChild(style);
    }

    // ── FONT FAMILY ──
    const FONT_FAMILIES = {
        sans:  '"Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
        serif: 'Georgia, "Times New Roman", "Palatino Linotype", serif',
        mono:  '"Courier New", "Lucida Console", monospace'
    };

    function applyFontFamily(fontFamily) {
        removeNode('nightowl-font-family');
        if (!fontFamily || fontFamily === 'default' || !document.head) return;
        const font = FONT_FAMILIES[fontFamily];
        if (!font) return;
        const style = document.createElement('style');
        style.id = 'nightowl-font-family';
        style.textContent = `
            body, p, div, span, li, td, th, a, label, input, textarea, select, button, h1, h2, h3, h4, h5, h6 {
                font-family: ${font} !important;
            }
        `;
        document.head.appendChild(style);
    }

    // ── READING MODE ──
    function applyReadingMode(enabled) {
        removeNode('nightowl-reading-style');
        if (!enabled || !document.head) return;
        const style = document.createElement('style');
        style.id = 'nightowl-reading-style';
        style.textContent = `
            body, p, li, td, th, blockquote, article, section, main {
                font-family: Georgia, 'Times New Roman', serif !important;
                line-height: 1.85 !important;
                letter-spacing: 0.012em !important;
            }
            p, li, td, blockquote { font-size: clamp(16px,1.1rem,20px) !important; max-width: 70ch; }
            body { max-width: 860px !important; margin: 0 auto !important; }
            h1,h2,h3,h4,h5,h6 {
                font-family: Georgia, serif !important;
                letter-spacing: -0.03em !important; line-height: 1.25 !important;
            }
            body { color: #1a1a1a !important; }
            html[style*="invert"] body { color: #e8e8e8 !important; }
        `;
        document.head.appendChild(style);
    }

    // ── AUTO NIGHT ──
    // Checks time using stored nightFrom/nightTo, handles same-day and overnight ranges.
    function isInNightRange(nightFrom, nightTo) {
        const now     = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const [fh, fm] = (nightFrom || '20:00').split(':').map(Number);
        const [th, tm] = (nightTo   || '07:00').split(':').map(Number);
        const fromMins = fh * 60 + (fm || 0);
        const toMins   = th * 60 + (tm || 0);
        if (fromMins > toMins) {
            // Overnight range (e.g. 20:00 → 07:00)
            return nowMins >= fromMins || nowMins < toMins;
        } else {
            // Same-day range (e.g. 08:00 → 20:00)
            return nowMins >= fromMins && nowMins < toMins;
        }
    }

    function startAutoNight(nightFrom, nightTo) {
        stopAutoNight();
        function check() {
            // Always read latest schedule from storage
            chrome.storage.local.get(['nightFrom','nightTo'], (data) => {
                const from = data.nightFrom || nightFrom || '20:00';
                const to   = data.nightTo   || nightTo   || '07:00';
                applyEyeFilter(isInNightRange(from, to) ? 40 : 0);
            });
        }
        check();
        autoNightInterval = setInterval(check, 60000);
    }

    function stopAutoNight() {
        if (autoNightInterval) { clearInterval(autoNightInterval); autoNightInterval = null; }
        applyEyeFilter(0);
    }

    function injectFixStyles() {
        const style = document.createElement('style');
        style.id = 'udm-fix';
        style.textContent = `
            img:not([src*=".svg"]),video,canvas,embed,object,picture img,
            [role="img"]:not(svg) { filter:invert(1) hue-rotate(180deg) !important; }
            svg { filter:none !important; }
        `;
        document.head.appendChild(style);
    }

    function removeNode(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
})();
