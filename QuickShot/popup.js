document.addEventListener('DOMContentLoaded', () => {
    const btnVisible = document.getElementById('btn-visible');

    const btnSelection = document.getElementById('btn-selection');

    btnVisible.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'capture_visible' });
        window.close();
    });



    btnSelection.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'capture_selection' });
        window.close();
    });

    // Detect OS for shortcut display
    chrome.runtime.getPlatformInfo((info) => {
        const isMac = info.os === 'mac';
        const modifier = isMac ? 'Cmd' : 'Alt';

        document.querySelector('#btn-visible .shortcut').textContent = `${modifier} + Shift + 1`;

        document.querySelector('#btn-selection .shortcut').textContent = `${modifier} + Shift + 3`;
    });
});
