const createAlarm = async (interval) => {
  await chrome.alarms.clear("water");
  chrome.alarms.create("water", { periodInMinutes: Number(interval) || 10 });
};

async function dailyResetCheck() {
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
}

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.sync.get(["interval"]);
  await createAlarm(data.interval || 10);

  await chrome.storage.sync.set({
    lastDate: new Date().toDateString(),
    consumed: 0,
    streak: 0,
    goal: 3000
  });
});

chrome.runtime.onStartup.addListener(dailyResetCheck);

chrome.storage.onChanged.addListener((changes) => {
  if (changes.interval) {
    createAlarm(changes.interval.newValue);
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "water") return;

  await dailyResetCheck();

  const data = await chrome.storage.sync.get([
    "quietStart", "quietEnd", "goal", "consumed"
  ]);

  // Quiet hours check
  if (data.quietStart && data.quietEnd) {
    const now = new Date();
    const [sh, sm] = data.quietStart.split(":").map(Number);
    const [eh, em] = data.quietEnd.split(":").map(Number);

    const start = new Date(); start.setHours(sh, sm, 0);
    const end = new Date(); end.setHours(eh, em, 0);

    if (now >= start && now <= end) return;
  }

  const windows = await chrome.windows.getAll({ populate: true, windowTypes: ["popup"] });
  const isAlertOpen = windows.some(win =>
    win.tabs?.some(tab => tab.url && tab.url.includes("alert.html"))
  );

  if (!isAlertOpen) {
    chrome.windows.create({
      url: "alert.html",
      type: "popup",
      width: 340,
      height: 400,
      focused: true
    });
  }
});
