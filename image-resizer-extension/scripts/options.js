// Saves options to chrome.storage
function saveOptions() {
    const defaultFormat = document.getElementById('defaultFormat').value;
    const defaultQuality = document.getElementById('defaultQuality').value;

    chrome.storage.sync.set({
        defaultFormat: defaultFormat,
        defaultQuality: defaultQuality
    }, () => {
        // Update status to let user know options were saved.
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(() => {
            status.textContent = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
    chrome.storage.sync.get({
        defaultFormat: 'jpeg',
        defaultQuality: 90
    }, (items) => {
        document.getElementById('defaultFormat').value = items.defaultFormat;
        document.getElementById('defaultQuality').value = items.defaultQuality;
        document.getElementById('qualityVal').textContent = items.defaultQuality + '%';
    });
}

document.getElementById('defaultQuality').addEventListener('input', (e) => {
    document.getElementById('qualityVal').textContent = e.target.value + '%';
});

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveBtn').addEventListener('click', (e) => {
    e.preventDefault();
    saveOptions();
});
