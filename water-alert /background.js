// 1. Unified Alarm Creation
const createAlarm = (interval) => {
  chrome.alarms.create("water", { periodInMinutes: Number(interval) || 10 });
};

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.sync.get(["interval"]);
  createAlarm(data.interval);

  // Initialize data if it doesn't exist
  await chrome.storage.sync.set({
    lastDate: new Date().toDateString(),
    consumed: 0,
    streak: 0,
    goal: 3000
  });
});

// 2. Efficient Storage Listener
chrome.storage.onChanged.addListener((changes) => {
  if (changes.interval) {
    createAlarm(changes.interval.newValue);
  }
});

// 3. Smart Alarm Handler
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "water") return;

  // Perform Date Check (Reset if it's a new day)
  const today = new Date().toDateString();
  const data = await chrome.storage.sync.get(["lastDate", "consumed", "goal", "streak"]);

  if (data.lastDate !== today) {
    const metGoal = data.consumed >= (data.goal || 3000);
    await chrome.storage.sync.set({
      lastDate: today,
      consumed: 0,
      streak: metGoal ? (data.streak || 0) + 1 : 0
    });
  }

  // Prevent popup spam: Check if an alert window is already open
  const windows = await chrome.windows.getAll({ type: 'popup' });
  const isAlertOpen = windows.some(win => win.tabs.some(tab => tab.url.includes("alert.html")));

  if (!isAlertOpen) {
    chrome.windows.create({
      url: "alert.html",
      type: "popup",
      width: 320,
      height: 380, // Increased height for better UI room
      focused: true
    });
  }
});