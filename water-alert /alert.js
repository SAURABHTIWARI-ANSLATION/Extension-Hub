const DRINK_AMOUNT = 250;

const progressFill = document.getElementById('progress-fill');
const percentText = document.getElementById('percent-text');
const statusText = document.getElementById('status-text');
const streakText = document.getElementById('streak-text');
const drinkBtn = document.getElementById('drink');
const snoozeBtn = document.getElementById('snooze');

async function init() {
  const data = await chrome.storage.sync.get(['consumed', 'goal', 'streak']);
  updateUI(data.consumed || 0, data.goal || 3000, data.streak || 0);
}

function updateUI(consumed, goal, streak) {
  goal = goal || 3000;
  const percent = Math.min(Math.round((consumed / goal) * 100), 100) || 0;

  percentText.textContent = `${percent}%`;
  statusText.textContent = `${consumed} / ${goal} ml`;
  streakText.textContent = `🔥 ${streak} Day Streak`;
  progressFill.style.width = `${percent}%`;
}

drinkBtn.onclick = async () => {
  const data = await chrome.storage.sync.get(['consumed', 'goal', 'streak']);
  const newConsumed = (data.consumed || 0) + DRINK_AMOUNT;

  await chrome.storage.sync.set({ consumed: newConsumed });
  updateUI(newConsumed, data.goal || 3000, data.streak || 0);

  setTimeout(() => window.close(), 500);
};

snoozeBtn.onclick = async () => {
  await chrome.alarms.clear("water");
  chrome.alarms.create("water", { delayInMinutes: 5 });
  window.close();
};

init();
