// Set up daily puzzle reset alarm
chrome.runtime.onInstalled.addListener(() => {
  // Clear any existing alarms
  chrome.alarms.clearAll();
  
  // Create alarm for daily puzzle reset (midnight)
  chrome.alarms.create('dailyPuzzleReset', {
    when: getNextMidnight(),
    periodInMinutes: 1440 // 24 hours
  });
  
  // Create alarm for puzzle notifications
  chrome.alarms.create('puzzleReminder', {
    delayInMinutes: 60, // First reminder after 1 hour
    periodInMinutes: 240 // Every 4 hours
  });
  
  // Initialize storage with default values
  chrome.storage.local.get(['userData'], (result) => {
    if (!result.userData) {
      chrome.storage.local.set({
        userData: {
          streak: 0,
          totalPoints: 0,
          dailySolved: false,
          friends: [],
          challengesSent: 0,
          challengesWon: 0
        }
      });
    }
  });
});

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyPuzzleReset') {
    resetDailyPuzzle();
  } else if (alarm.name === 'puzzleReminder') {
    sendPuzzleReminder();
  }
});

// Reset daily puzzle at midnight
async function resetDailyPuzzle() {
  const today = new Date().toDateString();
  
  // Clear daily puzzle data
  await chrome.storage.local.set({
    dailyPuzzle: null,
    lastPuzzleDate: today,
    dailyStats: { solved: 0, totalTime: 0 }
  });
  
  // Reset daily solved flag for all users
  const data = await chrome.storage.local.get(['userData']);
  if (data.userData) {
    data.userData.dailySolved = false;
    await chrome.storage.local.set({ userData: data.userData });
  }
  
  // Send notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'assets/icon128.png',
    title: 'Puzzle Pulse',
    message: 'New daily puzzle available! Click to solve.',
    priority: 2
  });
}

// Send puzzle reminder
function sendPuzzleReminder() {
  chrome.storage.local.get(['userData'], (result) => {
    if (result.userData && !result.userData.dailySolved) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icon128.png',
        title: 'Puzzle Pulse Reminder',
        message: 'Your daily puzzle is waiting! Can you solve it today?',
        priority: 1
      });
    }
  });
}

// Handle browser startup
chrome.runtime.onStartup.addListener(() => {
  // Check if user hasn't solved today's puzzle
  chrome.storage.local.get(['userData', 'lastPuzzleDate'], (result) => {
    const today = new Date().toDateString();
    const lastDate = result.lastPuzzleDate;
    
    if (result.userData && (!lastDate || lastDate !== today)) {
      // New day, reset daily solved
      result.userData.dailySolved = false;
      chrome.storage.local.set({ userData: result.userData });
    }
  });
});

// Calculate next midnight
function getNextMidnight() {
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0, 0, 0, 0
  );
  return midnight.getTime();
}

// Handle notifications click
chrome.notifications.onClicked.addListener(() => {
  chrome.action.openPopup();
});