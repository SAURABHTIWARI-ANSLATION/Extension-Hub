'use strict';

const TIPS = [
  "Drink water before you feel thirsty — thirst means you're already mildly dehydrated.",
  "Keep a water bottle on your desk as a visual reminder to sip regularly.",
  "Start your morning with a full glass of water to kickstart your metabolism.",
  "Add a slice of lemon or mint to your water to make it more enjoyable.",
  "Drink a glass of water before every meal — it aids digestion too!",
  "Your brain is 75% water. Staying hydrated improves focus and mood.",
  "Dark urine? Time to drink up! Aim for pale yellow.",
  "Drinking water can reduce headaches and improve energy levels naturally.",
];


let currentConsumed = 0;
let currentGoal = 3000;

function createDrops() {
  const container = document.getElementById('drops-container');
  if (!container) return;

  const colors = ['#4fc3f7', '#80deea', '#26c6da', '#b3e5fc'];

  for (let i = 0; i < 12; i++) {
    const drop = document.createElement('div');
    drop.className = 'drop';

    const size = 4 + Math.random() * 7;

    drop.style.left = `${Math.random() * 100}%`;
    drop.style.width = `${size}px`;
    drop.style.height = `${size * 1.4}px`;
    drop.style.background = colors[Math.floor(Math.random() * colors.length)];
    drop.style.opacity = `${0.1 + Math.random() * 0.25}`;
    drop.style.animationDuration = `${5 + Math.random() * 8}s`;
    drop.style.animationDelay = `${Math.random() * 6}s`;

    container.appendChild(drop);
  }
}

function updateUI(consumed, goal, streak) {
  consumed = consumed || 0;
  goal = goal || 3000;
  streak = streak || 0;

  currentConsumed = consumed;
  currentGoal = goal;

  const percent = Math.min(Math.round((consumed / goal) * 100), 100);
  const remaining = Math.max(goal - consumed, 0);

  const consumedEl = document.getElementById('consumed-val');
  const remainingEl = document.getElementById('remaining-val');
  const percentEl = document.getElementById('percent-val');
  const fillEl = document.getElementById('progress-fill');
  const streakEl = document.getElementById('streak-count');
  const goalCompleteEl = document.getElementById('goal-complete');

  if (consumedEl) {
    consumedEl.textContent = consumed.toLocaleString();
    consumedEl.className = 'stat-value num-animate';
    void consumedEl.offsetWidth;
    consumedEl.className = 'stat-value';
  }
  if (remainingEl) remainingEl.textContent = remaining.toLocaleString();
  if (percentEl) percentEl.textContent = `${percent}%`;
  if (streakEl) streakEl.textContent = streak;

  if (fillEl) {
    fillEl.style.width = `${percent}%`;
    if (percent > 0) fillEl.classList.add('active');
    else fillEl.classList.remove('active');
  }

  if (goalCompleteEl) {
    if (percent >= 100) goalCompleteEl.classList.add('show');
    else goalCompleteEl.classList.remove('show');
  }
}

function addRipple(button) {
  const ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  button.style.position = 'relative';
  button.style.overflow = 'hidden';
  button.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);
}

async function loadData() {
  const data = await chrome.storage.sync.get([
    'consumed', 'goal', 'streak', 'interval', 'hourly',
    'quietStart', 'quietEnd', 'quietEnabled'
  ]);

  updateUI(data.consumed || 0, data.goal || 3000, data.streak || 0);

  const intervalEl = document.getElementById('interval');
  const goalEl = document.getElementById('goal');
  const hourlyEl = document.getElementById('hourly');
  const quietStartEl = document.getElementById('quiet-start');
  const quietEndEl = document.getElementById('quiet-end');
  const quietEnabledEl = document.getElementById('quiet-enabled');

  if (intervalEl) intervalEl.value = data.hourly ? 60 : (data.interval || 30);
  if (goalEl) goalEl.value = data.goal || 3000;
  if (hourlyEl) hourlyEl.checked = data.hourly || false;
  if (quietStartEl) quietStartEl.value = data.quietStart || '';
  if (quietEndEl) quietEndEl.value = data.quietEnd || '';
  if (quietEnabledEl) quietEnabledEl.checked = data.quietEnabled || false;

  const tipEl = document.getElementById('tip-text');
  if (tipEl) tipEl.textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
}

document.addEventListener('DOMContentLoaded', () => {
  createDrops();
  loadData();

  const drinkBtn = document.getElementById('drink-btn');
  const saveBtn = document.getElementById('save-btn');
  const hourlyEl = document.getElementById('hourly');
  const intervalEl = document.getElementById('interval');

  if (drinkBtn) {
    drinkBtn.addEventListener('click', async () => {
      addRipple(drinkBtn);
      const data = await chrome.storage.sync.get(['consumed', 'goal', 'streak']);
      const newConsumed = (data.consumed || 0) + 250;
      await chrome.storage.sync.set({ consumed: newConsumed });
      updateUI(newConsumed, data.goal || 3000, data.streak || 0);
    });
  }

  if (hourlyEl && intervalEl) {
    hourlyEl.addEventListener('change', () => {
      if (hourlyEl.checked) {
        intervalEl.value = 60;
        intervalEl.disabled = true;
      } else {
        intervalEl.disabled = false;
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const hourlyChecked = document.getElementById('hourly')?.checked || false;
      let interval = hourlyChecked ? 60 : (parseInt(document.getElementById('interval')?.value, 10) || 30);
      if (interval < 1) interval = 1;

      const goal = parseInt(document.getElementById('goal')?.value, 10) || 3000;
      const quietStart = document.getElementById('quiet-start')?.value || '';
      const quietEnd = document.getElementById('quiet-end')?.value || '';
      const quietEnabled = document.getElementById('quiet-enabled')?.checked || false;

      await chrome.storage.sync.set({
        interval,
        goal,
        hourly: hourlyChecked,
        quietStart,
        quietEnd,
        quietEnabled,
      });

      saveBtn.textContent = '✓ Saved!';
      saveBtn.classList.add('saved');
      setTimeout(() => {
        saveBtn.textContent = 'Save Settings';
        saveBtn.classList.remove('saved');
      }, 2000);

      // Re-render with new goal
      const data = await chrome.storage.sync.get(['consumed', 'streak']);
      updateUI(data.consumed || 0, goal, data.streak || 0);
    });
  }
});
