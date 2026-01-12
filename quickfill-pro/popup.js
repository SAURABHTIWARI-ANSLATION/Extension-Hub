/* -------------------------------------------------
   QuickFill Pro – Popup Script (FINAL FIX)
-------------------------------------------------- */

document.addEventListener("DOMContentLoaded", async () => {
  await loadProfiles();
  await loadStats();
  setupEvents();
});

/* ---------------- EVENTS ---------------- */

function setupEvents() {
  document.getElementById("fillBtn").addEventListener("click", fillForm);
  document.getElementById("openOptions").addEventListener("click", openOptions);

  document
    .getElementById("manageProfiles")
    .addEventListener("click", openOptions);

  document
    .getElementById("profileSelect")
    .addEventListener("change", async (e) => {
      const index = e.target.value;
      if (index !== "") {
        await chrome.storage.local.set({
          selectedProfileIndex: Number(index),
        });
      }
    });
}

/* ---------------- PROFILES ---------------- */

async function loadProfiles() {
  const { profiles = [], selectedProfileIndex } =
    await chrome.storage.local.get(["profiles", "selectedProfileIndex"]);

  const select = document.getElementById("profileSelect");
  select.innerHTML = `<option value="">-- Choose Profile --</option>`;

  profiles.forEach((profile, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${profile.name}${profile.isDefault ? " ⭐" : ""}`;
    select.appendChild(option);
  });

  // Auto-select default or last selected
  let indexToSelect = profiles.findIndex(p => p.isDefault);
  if (Number.isInteger(selectedProfileIndex)) {
    indexToSelect = selectedProfileIndex;
  }

  if (indexToSelect !== -1) {
    select.value = indexToSelect;
    await chrome.storage.local.set({
      selectedProfileIndex: indexToSelect
    });
  }
}

/* ---------------- STATS ---------------- */

async function loadStats() {
  const { profiles = [], fillCount = 0 } =
    await chrome.storage.local.get(["profiles", "fillCount"]);

  document.getElementById("profileCount").textContent = profiles.length;
  document.getElementById("filledCount").textContent = fillCount;
}

/* ---------------- AUTOFILL ---------------- */

async function fillForm() {
  const select = document.getElementById("profileSelect");
  const index = select.value;

  if (index === "") {
    showStatus("Please select a profile first!", "error");
    return;
  }

  await chrome.storage.local.set({
    selectedProfileIndex: Number(index),
  });

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab?.id) {
    showStatus("No active tab found.", "error");
    return;
  }

  // Inject content.js (dynamic autofill engine)
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      files: ["content.js"],
    },
    async () => {
      if (chrome.runtime.lastError) {
        showStatus("Page refresh required. Try again.", "error");
        return;
      }

      // NOTE: content.js decides whether anything was filled
      // Popup only confirms trigger
      await incrementFillCount();
      showStatus("Autofill triggered. Check the form.", "success");
    }
  );
}

/* ---------------- COUNTER ---------------- */

async function incrementFillCount() {
  const { fillCount = 0 } = await chrome.storage.local.get("fillCount");
  const newCount = fillCount + 1;

  await chrome.storage.local.set({ fillCount: newCount });
  document.getElementById("filledCount").textContent = newCount;
}

/* ---------------- STATUS ---------------- */

function showStatus(message, type) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = `status-message ${type}`;
  status.style.display = "block";

  setTimeout(() => {
    status.style.display = "none";
  }, 2500);
}

/* ---------------- OPTIONS ---------------- */

function openOptions() {
  chrome.runtime.openOptionsPage();
}
