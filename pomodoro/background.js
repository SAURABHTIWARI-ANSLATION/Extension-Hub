const WORK = 25 * 60;
const BREAK = 5 * 60;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    pomodoro: { time: WORK, mode: "work", running: false }
  });
});

chrome.alarms.onAlarm.addListener(() => {
  chrome.notifications.create({
    type: "basic",
    title: "Pomodoro Finished!",
    message: "Time to take a break or start next session."
  });
});
