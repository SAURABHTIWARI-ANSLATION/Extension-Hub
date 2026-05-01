/**
 * @file content.js
 * @description Content script for Chrome Web Store pages.
 * Injects "Download CRX/ZIP" buttons on extension detail pages.
 * Runs only on chromewebstore.google.com and chrome.google.com/webstore
 */

(function () {
    'use strict';

    const EXT_ID_RE = /[a-z]{32}/;
    const BUTTON_ID = 'extensionvault-btn-container';

    /**
     * Extracts extension ID from current page URL.
     */
    function getExtensionId() {
        const url = window.location.href;
        const match = url.match(/\/detail\/(?:[^/]+\/)?([a-z]{32})/);
        return match ? match[1] : null;
    }

    /**
     * Creates the download button container.
     */
    function createButtonContainer(extensionId) {
        const container = document.createElement('div');
        container.id = BUTTON_ID;
        container.className = 'ev-btn-container';

        container.innerHTML = `
      <div class="ev-label">⬇ ExtensionVault</div>
      <div class="ev-actions">
        <button class="ev-btn ev-btn-zip" data-id="${extensionId}" data-format="zip" title="Download as ZIP">
          <span class="ev-btn-icon">📦</span> ZIP
        </button>
        <button class="ev-btn ev-btn-crx" data-id="${extensionId}" data-format="crx" title="Download as CRX">
          <span class="ev-btn-icon">🔧</span> CRX
        </button>
      </div>
      <div class="ev-status" id="ev-status-${extensionId}"></div>
    `;

        // Button click handlers
        container.querySelectorAll('.ev-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.dataset.id;
                const format = btn.dataset.format;
                const statusEl = document.getElementById(`ev-status-${id}`);

                // Get extension name from page
                const nameEl = document.querySelector('h1') || document.querySelector('[itemprop="name"]');
                const name = nameEl ? nameEl.textContent.trim().slice(0, 50) : 'extension';

                setStatus(statusEl, 'Downloading...', 'loading');
                btn.disabled = true;

                try {
                    const response = await chrome.runtime.sendMessage({
                        type: 'DOWNLOAD_EXTENSION',
                        payload: { extensionId: id, format, extensionName: name },
                    });

                    if (response.success) {
                        setStatus(statusEl, `✓ Saved as ${response.filename}`, 'success');
                    } else {
                        setStatus(statusEl, `✗ ${response.error}`, 'error');
                    }
                } catch (err) {
                    setStatus(statusEl, `✗ ${err.message}`, 'error');
                } finally {
                    btn.disabled = false;
                    setTimeout(() => setStatus(statusEl, '', ''), 5000);
                }
            });
        });

        return container;
    }

    function setStatus(el, text, type) {
        if (!el) return;
        el.textContent = text;
        el.className = `ev-status ev-status--${type}`;
    }

    /**
     * Injects the button into the Web Store page.
     */
    function injectButton() {
        // Only inject on detail pages
        if (!window.location.href.includes('/detail/')) return;
        if (document.getElementById(BUTTON_ID)) return;

        const extensionId = getExtensionId();
        if (!extensionId) return;

        // Try to find the best insertion point (near the install button)
        const insertTargets = [
            // New CWS layout
            '[data-item-id] .h-Ja-d-Ac-B',
            '.h-Ja-d-Ac-B',
            '.dd-Va',
            '.C-b-p-D-xh-hh',
            // Fallback: after H1
            'h1',
        ];

        let inserted = false;
        for (const selector of insertTargets) {
            const target = document.querySelector(selector);
            if (target) {
                const container = createButtonContainer(extensionId);
                target.parentNode.insertBefore(container, target.nextSibling);
                inserted = true;
                break;
            }
        }

        // Final fallback: append to body with floating style
        if (!inserted) {
            const container = createButtonContainer(extensionId);
            container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;';
            document.body.appendChild(container);
        }
    }

    // Initial injection
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        injectButton();
    } else {
        document.addEventListener('DOMContentLoaded', injectButton);
    }

    // Re-inject on SPA navigation (CWS uses client-side routing)
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            setTimeout(injectButton, 800); // Wait for page render
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();