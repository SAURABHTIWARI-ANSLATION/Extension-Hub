function normalize(val) {
  return val
    .toString()
    .trim()
    .replace(/[\s\-().]/g, "")
    .toLowerCase();
}

function detectType(val) {
  const phoneRegex = /^\+?\d[\d\s\-().]{7,}$/;
  const emailRegex = /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/;

  if (phoneRegex.test(val)) return "phone";
  if (emailRegex.test(val)) return "email";
  return null;
}

async function save(value, source = location.hostname) {
  const val = value.trim();
  const type = detectType(val);
  if (!type) return;

  const item = {
    value: val,
    type,
    time: Date.now(),
    source,
  };

  try {
    const { queue = [] } = await chrome.storage.local.get("queue");

    const exists = queue.some(
      (q) => normalize(q.value) === normalize(val)
    );
    if (exists) return;

    queue.push(item);
    await chrome.storage.local.set({ queue });
  } catch (err) {
    console.error("Failed to save contact:", err);
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || msg.action !== "save_contact") return;

  const text = (msg.selectionText || window.getSelection()?.toString() || "")
    .trim();

  if (text) save(text);
});
