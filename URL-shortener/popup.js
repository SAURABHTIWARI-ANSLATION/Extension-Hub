// Elements
const generateBtn = document.querySelector("#shortURL");
const apiInput = document.querySelector("#myurl");
const statusMsg = document.querySelector("#status-msg");
const resultCard = document.querySelector("#result-card");
const shortUrlSpan = document.querySelector(".short-url");
const copyBtn = document.querySelector(".copy-btn");
const loader = document.querySelector(".loading-spinner");
const btnText = document.querySelector(".btn-text");
const historySection = document.querySelector("#history-section");
const historyList = document.querySelector("#history-list");

const API_ENDPOINT = "https://t.ly/api/v1/link/shorten";
const MAX_HISTORY = 2;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    apiInput.focus();
});

// Event Listeners
generateBtn.addEventListener('click', handleShorten);
apiInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleShorten();
});

copyBtn.addEventListener('click', () => {
    const textToCopy = shortUrlSpan.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
        showCopySuccess();
    });
});

async function handleShorten() {
    const longUrl = apiInput.value.trim();
    if (!longUrl) {
        showError("Please enter a valid URL");
        return;
    }

    setLoading(true);
    clearStatus();

    try {
        const { API } = await getStorage('API');

        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({
                "long_url": longUrl,
                "domain": "https://t.ly/",
                "api_token": API
            })
        });

        const data = await response.json();

        if (data.short_url) {
            showSuccess(data.short_url);
            saveToHistory(longUrl, data.short_url);
        } else {
            showError(data.message || "Failed to shorten URL");
        }

    } catch (err) {
        showError("Network Error: " + err.message);
    } finally {
        setLoading(false);
    }
}

// UI State Helpers
function setLoading(isLoading) {
    if (isLoading) {
        loader.classList.remove('d-hide');
        btnText.classList.add('d-hide');
        generateBtn.disabled = true;
    } else {
        loader.classList.add('d-hide');
        btnText.classList.remove('d-hide');
        generateBtn.disabled = false;
    }
}

function showSuccess(shortUrl) {
    resultCard.classList.remove('d-hide');
    shortUrlSpan.textContent = shortUrl;
    copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    copyBtn.classList.remove('success');
}

function showCopySuccess() {
    copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>`;
    copyBtn.classList.add('success');

    setTimeout(() => {
        copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        copyBtn.classList.remove('success');
    }, 2000);
}

function showError(msg) {
    statusMsg.textContent = msg;
    statusMsg.classList.remove('d-hide');
    statusMsg.classList.add('error');
    resultCard.classList.add('d-hide');
}

function clearStatus() {
    statusMsg.classList.add('d-hide');
    statusMsg.classList.remove('error');
}

// Storage Helpers
function getStorage(key) {
    return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => resolve(result));
    });
}

function saveToHistory(longUrl, shortUrl) {
    chrome.storage.local.get(['history'], (result) => {
        let history = result.history || [];
        // Add new item to start
        history.unshift({ longUrl, shortUrl, date: Date.now() });
        // Limit to MAX_HISTORY
        history = history.slice(0, MAX_HISTORY);

        chrome.storage.local.set({ history }, () => {
            loadHistory(); // Reload UI
        });
    });
}

function loadHistory() {
    chrome.storage.local.get(['history'], (result) => {
        const history = result.history || [];

        if (history.length > 0) {
            historySection.classList.remove('d-hide');
            historyList.innerHTML = history.map(item => `
                <div class="history-item">
                    <a href="${item.shortUrl}" target="_blank" class="history-link" title="${item.longUrl}">${item.shortUrl}</a>
                    <button class="btn-icon" onclick="navigator.clipboard.writeText('${item.shortUrl}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                </div>
            `).join('');
        }
    });
}