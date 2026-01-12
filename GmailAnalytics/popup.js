document.addEventListener('DOMContentLoaded', () => {
    const unreadCountEl = document.getElementById('unread-count');
    const threadCountEl = document.getElementById('thread-count');
    const emailListEl = document.getElementById('email-list');
    const contentEl = document.getElementById('content');
    const notLoggedInEl = document.getElementById('not-logged-in');
    const loadingEl = document.getElementById('loading');
    const inboxBtn = document.getElementById('inbox-btn');
    const loginBtn = document.getElementById('login-btn');
    // refreshBtn removed in new UI

    const GMAIL_URL = "https://mail.google.com/mail/";

    async function render() {
        const data = await chrome.storage.local.get(['unreadCount', 'entries', 'loggedIn']);

        loadingEl.classList.add('hidden');

        if (data.loggedIn === false) {
            contentEl.classList.add('hidden');
            notLoggedInEl.classList.remove('hidden');
            return;
        }

        notLoggedInEl.classList.add('hidden');
        contentEl.classList.remove('hidden');

        unreadCountEl.textContent = data.unreadCount || '0';
        if (threadCountEl) {
            const count = data.entries ? data.entries.length : 0;
            threadCountEl.textContent = count;
        }

        emailListEl.innerHTML = '';
        if (data.entries && data.entries.length > 0) {
            data.entries.forEach(entry => {
                const el = document.createElement('div');
                el.className = 'email-row';
                el.innerHTML = `
                <div class="row-header">
                    <span class="sender">${escapeHtml(entry.authorName)}</span>
                    <span class="time">${formatTime(entry.issued)}</span>
                </div>
                <div class="subject">${escapeHtml(entry.title)}</div>
                <div class="snippet">${escapeHtml(entry.summary)}</div>
            `;
                el.addEventListener('click', () => {
                    chrome.tabs.create({ url: entry.link });
                });
                emailListEl.appendChild(el);
            });
        } else {
            emailListEl.innerHTML = '<div style="text-align:center; color:var(--text-muted); font-size:12px; padding:20px;">No recent unread data available</div>';
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) {
            return diffMins <= 0 ? 'Just now' : `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
    }

    if (inboxBtn) {
        inboxBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: GMAIL_URL });
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: GMAIL_URL });
        });
    }

    // Listen for storage changes to update UI automatically
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            render();
        }
    });

    // Initial render
    render();

    // Trigger a fresh fetch on open (updates UI via storage listener when done)
    chrome.runtime.sendMessage({ type: 'REFRESH' });

    // Auto-refresh while popup is open
    setInterval(() => {
        chrome.runtime.sendMessage({ type: 'REFRESH' });
    }, 10000); // 10 seconds refresh rate
});
