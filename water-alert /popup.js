// Reference elements explicitly
const els = {
  interval: document.getElementById("interval"),
  goal: document.getElementById("goal"),
  hourly: document.getElementById("hourly"),
  quietStart: document.getElementById("quietStart"),
  quietEnd: document.getElementById("quietEnd"),
  progress: document.getElementById("progress"),
  progressFill: document.getElementById("progress-fill"), // New: for the visual bar
  streak: document.getElementById("streak"),
  weekly: document.getElementById("weekly"),
  tip: document.getElementById("tip"),
  saveBtn: document.getElementById("save"),
  drinkBtn: document.getElementById("drink")
};

const tips = [
  "💧 Drink water before you feel thirsty.",
  "🍼 Keep a reusable bottle on your desk at all times.",
  "🌅 Start your day with a large glass of water.",
  "🚶 Drink a glass after every break or walk."
];

// Initialize UI
document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.sync.get([
    "interval", "goal", "hourly", "quietStart", "quietEnd"
  ]);

  els.interval.value = data.interval || 10;
  els.goal.value = data.goal || 3000;
  els.hourly.checked = data.hourly || false;
  els.quietStart.value = data.quietStart || "";
  els.quietEnd.value = data.quietEnd || "";
  
  render();
});

// Save Settings
els.saveBtn.onclick = async () => {
  let interval = Number(els.interval.value);
  if (els.hourly.checked) interval = 60;
  if (!interval || interval < 1) interval = 10;

  await chrome.storage.sync.set({
    interval,
    goal: Number(els.goal.value) || 3000,
    hourly: els.hourly.checked,
    quietStart: els.quietStart.value,
    quietEnd: els.quietEnd.value,
  });

  // UX Improvement: Visual feedback instead of alert
  els.saveBtn.textContent = "Saved! ✓";
  els.saveBtn.style.background = "#10b981";
  setTimeout(() => {
    els.saveBtn.textContent = "Save Settings";
    els.saveBtn.style.background = "";
  }, 1500);
  
  render();
};

// Add Water
els.drinkBtn.onclick = async () => {
  const data = await chrome.storage.sync.get(["consumed"]);
  const newTotal = (data.consumed || 0) + 250;
  await chrome.storage.sync.set({ consumed: newTotal });
  render();
};

// Render Data
async function render() {
  const data = await chrome.storage.sync.get(["goal", "consumed", "streak", "weekly"]);
  const consumed = data.consumed || 0;
  const goal = data.goal || 3000;
  
  // Update Text
  els.progress.textContent = `${consumed} / ${goal} ml`;
  els.streak.textContent = `🔥 Streak: ${data.streak || 0} days`;
  els.weekly.textContent = `📊 Weekly: ${data.weekly || 0} ml`;
  els.tip.textContent = tips[Math.floor(Math.random() * tips.length)];

  // Update Visual Progress Bar
  if (els.progressFill) {
    const percentage = Math.min((consumed / goal) * 100, 100);
    els.progressFill.style.width = `${percentage}%`;
  }
}