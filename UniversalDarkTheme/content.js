(function () {
    if (window.hasRun) return;
    window.hasRun = true;

    let currentState = { isDark: false, brightness: 100 };
    let observer = null;

    const GOOGLE_EXCLUDED = [
        "docs.google.com",
        "sheets.google.com",
        "slides.google.com"
    ];

    // Detect if we are on Google Sheets/Docs/Slides
    const isGoogleApp = GOOGLE_EXCLUDED.some(domain => window.location.hostname.includes(domain));

    function initializeTheme() {
        chrome.storage.local.get(['isDark', 'brightness'], (result) => {
            const config = {
                isDark: result.isDark ?? false,
                brightness: result.brightness ?? 100
            };
            applyTheme(config);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeTheme);
    } else {
        initializeTheme();
    }

    // Listen for popup changes
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.isDark !== undefined || request.brightness !== undefined) {
            applyTheme(request);
            showToast(request.isDark ? "Dark Mode Enabled" : "Light Mode Disabled");
        }
        if (sendResponse) sendResponse({ success: true });
        return true;
    });

    // THE FIXED THEME LOGIC
    function applyTheme(config) {
        currentState = config;
        const html = document.documentElement;
        const bright = config.brightness / 100;

        // Clear previous filters/styles
        html.style.filter = "";
        removeNode("udm-fix");
        removeNode("udm-dark");

        if (observer) observer.disconnect();

        // ❗ Google Sheets/Docs/Slides → DO NOT INVERT UI
        if (isGoogleApp) {
            html.style.filter = `brightness(${bright})`;
            return;
        }

        // Normal Sites → Dark Mode using invert + hue-rotate
        if (config.isDark) {
            html.style.filter = `invert(1) hue-rotate(180deg) brightness(${bright})`;

            injectFixStyles();

            observer = new MutationObserver(() => {
                ensureFixStyles();
            });

            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            html.style.filter = `brightness(${bright})`;
        }
    }

    function injectFixStyles() {
        const style = document.createElement("style");
        style.id = "udm-fix";
        style.textContent = `
            img:not([src*=".svg"]),
            video,
            canvas,
            embed,
            object,
            picture img,
            [role="img"]:not(svg) {
                filter: invert(1) hue-rotate(180deg) !important;
            }
            svg {
                filter: none !important;
            }
            #udm-toast {
                filter: invert(1) hue-rotate(180deg) !important;
            }
        `;
        document.head.appendChild(style);
    }

    function ensureFixStyles() {
        if (!document.getElementById("udm-fix")) {
            injectFixStyles();
        }
    }

    function removeNode(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function showToast(text) {
        let toast = document.getElementById("udm-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "udm-toast";
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #333;
                color: #fff;
                padding: 12px 24px;
                border-radius: 25px;
                z-index: 2147483647;
                font-family: sans-serif;
                transition: opacity 0.4s;
                pointer-events: none;
            `;
            document.body.appendChild(toast);
        }

        toast.textContent = text;
        toast.style.opacity = "1";

        clearTimeout(window.toastTimer);
        window.toastTimer = setTimeout(() => {
            toast.style.opacity = "0";
        }, 2000);
    }

})();
