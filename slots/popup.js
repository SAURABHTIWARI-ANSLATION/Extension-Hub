const day = document.getElementById("day");
const start = document.getElementById("start");
const end = document.getElementById("end");
const addBtn = document.getElementById("add");
const list = document.getElementById("slots");
const copyBtn = document.getElementById("copy");

function renderSlots(slots) {
  list.innerHTML = "";
  slots.forEach((slot, index) => {
    const li = document.createElement("li");
    li.textContent = `${slot.day}: ${slot.start} - ${slot.end}`;
    list.appendChild(li);
  });
}

function loadSlots() {
  chrome.storage.local.get(["slots"], (res) => {
    renderSlots(res.slots || []);
  });
}

addBtn.addEventListener("click", () => {
  if (!start.value || !end.value) return;

  chrome.storage.local.get(["slots"], (res) => {
    const slots = res.slots || [];
    slots.push({
      day: day.value,
      start: start.value,
      end: end.value
    });

    chrome.storage.local.set({ slots }, loadSlots);
  });
});

copyBtn.addEventListener("click", () => {
  chrome.storage.local.get(["slots"], (res) => {
    const slots = res.slots || [];

    const text =
      "Hello,\n\nHere is my availability:\n" +
      slots.map(s => `${s.day}: ${s.start} - ${s.end}`).join("\n");

    navigator.clipboard.writeText(text);
  });
});

loadSlots();
