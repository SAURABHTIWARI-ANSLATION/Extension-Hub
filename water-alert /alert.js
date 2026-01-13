// Configuration
const DRINK_AMOUNT = 250;

// Elements
const progressFill = document.getElementById('progress-fill');
const percentText = document.getElementById('percent-text');
const statusText = document.getElementById('status-text');
const streakText = document.getElementById('streak-text');
const drinkBtn = document.getElementById('drink');
const snoozeBtn = document.getElementById('snooze');

// Initialize UI on load
async function init() {
  const data = await chrome.storage.sync.get(['consumed', 'goal', 'streak']);
  updateUI(data.consumed || 0, data.goal || 3000, data.streak || 0);
}

// Function to update the visual elements
function updateUI(consumed, goal, streak) {
  const percent = Math.min(Math.round((consumed / goal) * 100), 100);
  
  // Update texts
  percentText.textContent = `${percent}%`;
  statusText.textContent = `${consumed} / ${goal} ml`;
  streakText.textContent = `🔥 ${streak} Day Streak`;
  
  // Update progress bar width
  progressFill.style.width = `${percent}%`;
}

// Handle "I Drank" click
drinkBtn.onclick = async () => {
  // 1. Get current data
  const data = await chrome.storage.sync.get(['consumed', 'goal', 'streak']);
  const newConsumed = (data.consumed || 0) + DRINK_AMOUNT;
  const goal = data.goal || 3000;

  // 2. Update UI immediately for smooth feedback
  updateUI(newConsumed, goal, data.streak || 0);

  // 3. Save to storage
  await chrome.storage.sync.set({ consumed: newConsumed });

  // 4. Optional: Close window after a short delay so they see the bar move
  setTimeout(() => {
    window.close();
  }, 600); 
};

// Handle Snooze click
snoozeBtn.onclick = () => {
  // Reset alarm for 5 minutes from now
  chrome.alarms.create("water", { delayInMinutes: 5 });
  window.close();
};

init();