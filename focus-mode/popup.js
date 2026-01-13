const input = document.getElementById("site");
const list = document.getElementById("list");
const toggle = document.getElementById("focusToggle");
const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");
const statsEl = document.getElementById("stats");

document.getElementById("add").onclick = () => {
  chrome.storage.sync.get(["blocked"], (res) => {
    const blocked = res.blocked || [];
    if (input.value && !blocked.includes(input.value)) blocked.push(input.value);
    chrome.storage.sync.set({ blocked });
    input.value = "";
    render();
  });
};

toggle.onchange = () => chrome.storage.sync.set({ focusOn: toggle.checked });
startTimeInput.onchange = () => chrome.storage.sync.set({ startTime: startTimeInput.value });
endTimeInput.onchange = () => chrome.storage.sync.set({ endTime: endTimeInput.value });

function removeSite(site) {
  chrome.storage.sync.get(["blocked"], (res) => {
    const updated = (res.blocked || []).filter(s => s !== site);
    chrome.storage.sync.set({ blocked: updated }, render);
  });
}

function render() {
  chrome.storage.sync.get(["blocked","focusOn","startTime","endTime","blockCount"], (res) => {
    list.innerHTML = "";
    (res.blocked || []).forEach(site => {
      const li = document.createElement("li");
      li.textContent = site;
      li.onclick = () => removeSite(site);
      list.appendChild(li);
    });
    toggle.checked = res.focusOn || false;
    startTimeInput.value = res.startTime || "09:00";
    endTimeInput.value = res.endTime || "18:00";
    statsEl.textContent = "Blocked today: " + (res.blockCount || 0);
  });
}

render();
