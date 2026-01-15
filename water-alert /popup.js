const els = {
  interval: document.getElementById("interval"),
  goal: document.getElementById("goal"),
  hourly: document.getElementById("hourly"),
  quietStart: document.getElementById("quietStart"),
  quietEnd: document.getElementById("quietEnd"),
  progress: document.getElementById("progress"),
  progressFill: document.getElementById("progress-fill"),
  streak: document.getElementById("streak"),
  tip: document.getElementById("tip"),
  saveBtn: document.getElementById("save"),
  drinkBtn: document.getElementById("drink")
};

const tips = [
  "💧 Drink water before you feel thirsty.",
  "🍼 Keep a reusable bottle on your desk.",
  "🌅 Start your day with a glass of water.",
  "🚶 Drink a glass after every walk."
];

document.addEventListener("DOMContentLoaded", async () => {
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

els.saveBtn.onclick = async () => {
  let interval = Number(els.interval.value);
  if (els.hourly.checked) interval = 60;
  if (!interval || interval < 1) interval = 10;

  await chrome.storage.sync.set({
    interval,
    goal: Number(els.goal.value) || 3000,
    hourly: els.hourly.checked,
    quietStart: els.quietStart.value,
    quietEnd: els.quietEnd.value
  });

  els.saveBtn.textContent = "Saved ✓";
  setTimeout(() => els.saveBtn.textContent = "Save Settings", 1500);

  render();
};

els.drinkBtn.onclick = async () => {
  const data = await chrome.storage.sync.get(["consumed"]);
  await chrome.storage.sync.set({ consumed: (data.consumed || 0) + 250 });
  render();
};

async function render() {
  const data = await chrome.storage.sync.get(["goal", "consumed", "streak"]);

  const consumed = data.consumed || 0;
  const goal = data.goal || 3000;

  els.progress.textContent = `${consumed} / ${goal} ml`;
  els.streak.textContent = `🔥 ${data.streak || 0} days`;
  els.tip.textContent = tips[Math.floor(Math.random() * tips.length)];

  const percent = Math.min((consumed / goal) * 100, 100);
  els.progressFill.style.width = `${percent}%`;
}
