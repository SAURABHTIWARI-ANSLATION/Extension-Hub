let interval;

const timerEl = document.getElementById("timer");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");

function render(time) {
  const m = String(Math.floor(time / 60)).padStart(2, "0");
  const s = String(time % 60).padStart(2, "0");
  timerEl.textContent = `${m}:${s}`;
}

function tick() {
  chrome.storage.local.get("pomodoro", ({ pomodoro }) => {
    if (!pomodoro.running) return;

    pomodoro.time--;

    if (pomodoro.time <= 0) {
      chrome.alarms.create({ delayInMinutes: 0 });
      pomodoro.running = false;
      pomodoro.time = pomodoro.mode === "work" ? 5 * 60 : 25 * 60;
      pomodoro.mode = pomodoro.mode === "work" ? "break" : "work";
    }

    chrome.storage.local.set({ pomodoro });
    render(pomodoro.time);
  });
}

startBtn.onclick = () => {
  chrome.storage.local.get("pomodoro", ({ pomodoro }) => {
    pomodoro.running = true;
    chrome.storage.local.set({ pomodoro });
    interval = setInterval(tick, 1000);
  });
};

pauseBtn.onclick = () => {
  chrome.storage.local.get("pomodoro", ({ pomodoro }) => {
    pomodoro.running = false;
    chrome.storage.local.set({ pomodoro });
  });
};

resetBtn.onclick = () => {
  chrome.storage.local.set({
    pomodoro: { time: 25 * 60, mode: "work", running: false }
  });
  render(25 * 60);
};

chrome.storage.local.get("pomodoro", ({ pomodoro }) => {
  render(pomodoro.time);
});
