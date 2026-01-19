
chrome.alarms.create("daily", {periodInMinutes:1440});

chrome.runtime.onMessage.addListener(msg => msg.updateBadge && updateBadge());

chrome.alarms.onAlarm.addListener(a => {
  if(a.name==="daily"){ notify(); updateBadge(); }
});

function updateBadge(){
  chrome.storage.local.get(["domains"], r => {
    const c = (r.domains||[]).filter(d => {
      const days = Math.ceil((new Date(d.date)-new Date())/86400000);
      return days<=7;
    }).length;
    chrome.action.setBadgeText({text: c?String(c):""});
    chrome.action.setBadgeBackgroundColor({color:"#db4437"});
  });
}

function notify(){
  chrome.storage.local.get(["domains"], r => {
    (r.domains||[]).forEach(d => {
      const days = Math.ceil((new Date(d.date)-new Date())/86400000);
      if([30,7,1].includes(days)){
        chrome.notifications.create({
          type:"basic",
          iconUrl:"icons/icon128.png",
          title:"Renewal Reminder",
          message:`${d.name} expires in ${days} days`
        });
      }
    });
  });
}

updateBadge();
