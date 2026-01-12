/* -------------------------------------------------
   QuickFill Pro – Content Script (FINAL FIX)
-------------------------------------------------- */

(async function () {
  const { profiles = [], selectedProfileIndex = 0 } =
    await chrome.storage.local.get(["profiles", "selectedProfileIndex"]);

  const profile = profiles[selectedProfileIndex];
  if (!profile || !Array.isArray(profile.fields)) return;

  let filledCount = 0;

  profile.fields.forEach(field => {
    if (!field.value || !field.keywords) return;

    const keys = field.keywords
      .split(",")
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    if (!keys.length) return;

    filledCount += fillByKeys(keys, field.value);
  });

  if (filledCount > 0) {
    showFillNotification(filledCount);
  }
})();

/* ---------------- FILL LOGIC ---------------- */

function fillByKeys(keys, value) {
  let filled = 0;

  keys.forEach(key => {
    const selector = `
      input[name*="${key}" i],
      input[id*="${key}" i],
      input[placeholder*="${key}" i],
      textarea[name*="${key}" i],
      textarea[id*="${key}" i],
      textarea[placeholder*="${key}" i],
      select[name*="${key}" i],
      select[id*="${key}" i]
    `;

    document.querySelectorAll(selector).forEach(el => {
      if (!shouldFill(el)) return;

      // 🔹 SELECT (dropdown)
      if (el.tagName === "SELECT") {
        [...el.options].forEach(opt => {
          if (opt.text.toLowerCase().includes(value.toLowerCase())) {
            el.value = opt.value;
            el.dispatchEvent(new Event("change", { bubbles: true }));
            filled++;
          }
        });
      }

      // 🔹 INPUT / TEXTAREA
      else {
        if (!el.value) {
          el.value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          filled++;
        }
      }
    });
  });

  return filled;
}

/* ---------------- SAFETY ---------------- */

function shouldFill(el) {
  const type = (el.type || "").toLowerCase();
  const name = (el.name || "").toLowerCase();
  const id = (el.id || "").toLowerCase();

  if (type === "password") return false;

  const blocked = [
    "password", "pwd", "cvv", "cvc",
    "otp", "pin", "ssn", "routing",
    "card", "security"
  ];

  if (blocked.some(k => name.includes(k) || id.includes(k))) return false;
  if (el.disabled || el.readOnly) return false;
  if (el.offsetParent === null) return false;

  return true;
}

/* ---------------- FEEDBACK ---------------- */

function showFillNotification(count) {
  const note = document.createElement("div");
  note.textContent = `✓ Filled ${count} field(s)`;

  note.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg,#a78bfa,#8b5cf6);
    color: white;
    padding: 12px 18px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    z-index: 999999;
  `;

  document.body.appendChild(note);
  setTimeout(() => note.remove(), 2200);
}
