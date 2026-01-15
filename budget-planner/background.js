chrome.alarms.create("budgetCheck", { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(() => {
  chrome.storage.local.get(["wallet", "limit"], res => {
    let spent = 0;
    (res.wallet || []).forEach(w => {
      if (w.type === "expense") spent += w.amount;
    });

    if (res.limit && spent > res.limit) {
      chrome.notifications.create({
        type: "basic",
        title: "Budget Alert!",
        message: "You have exceeded your monthly budget limit."
      });
    }
  });
});
