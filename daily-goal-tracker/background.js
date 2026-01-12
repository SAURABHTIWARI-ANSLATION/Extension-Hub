const MAX_HISTORY_DAYS = 30;

function getTodayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("dailyCheck", { periodInMinutes: 60 }); // hourly check
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== "dailyCheck") return;

  chrome.storage.local.get(
    { goals: [], streak: 0, history: [], lastReset: null },
    (data) => {
      const today = getTodayKey();

      if (data.lastReset === today) return; // already reset today

      const completed = data.goals.filter(g => g.done).length;
      const success = completed === data.goals.length && data.goals.length > 0;

      const newStreak = success ? data.streak + 1 : 0;

      const newHistory = [
        ...data.history,
        { date: data.lastReset || today, goals: data.goals }
      ].slice(-MAX_HISTORY_DAYS);

      chrome.storage.local.set({
        history: newHistory,
        goals: data.goals.map(g => ({ ...g, done: false })),
        streak: newStreak,
        lastReset: today
      });
    }
  );
});
