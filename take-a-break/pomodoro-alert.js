'use strict';

async function _send(msg) {
  return chrome.runtime.sendMessage(msg);
}

async function init() {
  const closeBtn = document.getElementById('closeBtn');
  const startBtn = document.getElementById('startBtn');

  closeBtn.addEventListener('click', () => window.close());

  startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    startBtn.textContent = 'Starting...';
    try {
      await _send({ action: 'pomodoro:start' });
    } finally {
      window.close();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);

