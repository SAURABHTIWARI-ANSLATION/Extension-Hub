function insertText(text) {
  const active = document.activeElement;
  if (active && active.isContentEditable) {
    active.innerText += "\n\n" + text;
  }
}

chrome.storage.local.get(["slots"], (res) => {
  const slots = res.slots || [];
  if (!slots.length) return;

  const availabilityText =
    "My availability:\n" +
    slots.map(s => `${s.day}: ${s.start} - ${s.end}`).join("\n");

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "m") {
      insertText(availabilityText);
    }
  });
});
