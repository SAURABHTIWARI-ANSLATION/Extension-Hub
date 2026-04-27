// Birthday reminder service
chrome.alarms.create("birthdayCheck", { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "birthdayCheck") {
    checkBirthdays();
  }
});

function checkBirthdays() {
  chrome.storage.local.get(["profiles"], (result) => {
    const profiles = result.profiles || [];
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    profiles.forEach((profile) => {
      const birthDate = new Date(profile.birthDate);

      if (
        birthDate.getMonth() === todayMonth &&
        birthDate.getDate() === todayDate
      ) {
        const age = today.getFullYear() - birthDate.getFullYear();

        chrome.notifications.create({
          type: "basic",
          iconUrl: "logo.png",
          title: "🎂 Birthday Reminder!",
          message: `Today is ${profile.name}'s birthday! They are turning ${age} years old.`,
          priority: 2,
        });

        // Check for milestone birthdays
        const milestones = [
          1, 5, 10, 13, 18, 21, 30, 40, 50, 60, 65, 70, 75, 80, 90, 100,
        ];
        if (milestones.includes(age)) {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "logo.png",
            title: "🎉 Milestone Birthday!",
            message: `${profile.name} is reaching a milestone: ${age} years old!`,
            priority: 2,
          });
        }
      }
    });
  });
}

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.local.set({
      profiles: [],
      darkMode: false,
      firstInstall: true,
    });
  }
});
