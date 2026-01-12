/* -------------------------------------------------
   QuickFill Pro – Options (Manage Profiles)
   STEP 2: Dynamic Fields Logic
-------------------------------------------------- */

let profiles = [];
let selectedIndex = null;
let currentFields = [];

/* ---------------- INIT ---------------- */

document.addEventListener("DOMContentLoaded", async () => {
  await loadProfiles();
  setupEvents();
});

/* ---------------- EVENTS ---------------- */

function setupEvents() {
  document.getElementById("addProfileBtn").addEventListener("click", addProfile);
  document.getElementById("profileForm").addEventListener("submit", saveProfile);
  document.getElementById("deleteProfileBtn").addEventListener("click", deleteProfile);
  document.getElementById("addFieldBtn").addEventListener("click", addField);
}

/* ---------------- LOAD ---------------- */

async function loadProfiles() {
  const data = await chrome.storage.local.get(["profiles", "selectedProfileIndex"]);
  profiles = data.profiles || [];
  selectedIndex = Number.isInteger(data.selectedProfileIndex)
    ? data.selectedProfileIndex
    : null;

  renderProfilesList();
  
  // ✅ ALWAYS open default or first profile
  let indexToOpen = selectedIndex;

  if (!Number.isInteger(indexToOpen) || !profiles[indexToOpen]) {
    indexToOpen = profiles.findIndex(p => p.isDefault);
  }

  if (indexToOpen === -1 && profiles.length > 0) {
    indexToOpen = 0;
  }

  if (profiles[indexToOpen]) {
    openProfile(indexToOpen);
  } else {
    showEmptyState();
  }

}

/* ---------------- SIDEBAR ---------------- */

function renderProfilesList() {
  const list = document.getElementById("profilesList");
  list.innerHTML = "";

  profiles.forEach((profile, index) => {
    const item = document.createElement("div");
    item.className = "profile-item";
    item.textContent = profile.name || "Unnamed Profile";

    if (profile.isDefault) item.textContent += " ⭐";
    if (index === selectedIndex) item.classList.add("active");

    item.onclick = () => openProfile(index);
    list.appendChild(item);
  });
}

/* ---------------- OPEN PROFILE ---------------- */

function openProfile(index) {
  selectedIndex = index;
  chrome.storage.local.set({ selectedProfileIndex: index });

  const profile = profiles[index];

  document.getElementById("emptyState").style.display = "none";
  document.getElementById("profileForm").style.display = "block";

  document.getElementById("formTitle").textContent = "Edit Profile";
  document.getElementById("profileName").value = profile.name || "";
  document.getElementById("profileDefault").checked = !!profile.isDefault;

  currentFields = profile.fields || [];
  renderFields();

  renderProfilesList();
}

/* ---------------- DYNAMIC FIELDS ---------------- */

function renderFields() {
  const container = document.getElementById("fieldsContainer");
  container.innerHTML = "";

  currentFields.forEach((field, index) => {
    const row = document.createElement("div");
    row.className = "form-group";

    row.innerHTML = `
      <input placeholder="Label" value="${field.label || ""}" />
      <input placeholder="Value" value="${field.value || ""}" />
      <input placeholder="Keywords (comma separated)" value="${field.keywords || ""}" />
      <button type="button" class="btn-icon">❌</button>
    `;

    const inputs = row.querySelectorAll("input");

    inputs[0].oninput = e => field.label = e.target.value;
    inputs[1].oninput = e => field.value = e.target.value;
    inputs[2].oninput = e => field.keywords = e.target.value;

    row.querySelector("button").onclick = () => {
      currentFields.splice(index, 1);
      renderFields();
    };

    container.appendChild(row);
  });
}

function addField() {
  currentFields.push({
    label: "",
    value: "",
    keywords: ""
  });
  renderFields();
}

/* ---------------- ADD PROFILE ---------------- */

function addProfile() {
  const newProfile = {
    name: "New Profile",
    isDefault: profiles.length === 0,
    fields: []
  };

  profiles.push(newProfile);
  selectedIndex = profiles.length - 1;

  chrome.storage.local.set({
    profiles,
    selectedProfileIndex: selectedIndex
  });

  openProfile(selectedIndex);
}

/* ---------------- SAVE PROFILE ---------------- */

async function saveProfile(e) {
  e.preventDefault();
  if (selectedIndex === null) return;

  const isDefault = document.getElementById("profileDefault").checked;

  if (isDefault) profiles.forEach(p => (p.isDefault = false));

  profiles[selectedIndex] = {
    name: document.getElementById("profileName").value.trim() || "Unnamed Profile",
    isDefault,
    fields: currentFields
  };

  // ensure default
  if (!profiles.some(p => p.isDefault)) {
    profiles[0].isDefault = true;
  }

  await chrome.storage.local.set({
    profiles,
    selectedProfileIndex: selectedIndex
  });

  renderProfilesList();
  alert("Profile saved successfully ✅");
}

/* ---------------- DELETE PROFILE ---------------- */

async function deleteProfile() {
  if (selectedIndex === null) return;
  if (!confirm("Delete this profile?")) return;

  const wasDefault = profiles[selectedIndex]?.isDefault;
  profiles.splice(selectedIndex, 1);

  if (profiles.length === 0) {
    selectedIndex = null;
    await chrome.storage.local.set({ profiles: [], selectedProfileIndex: null });
    showEmptyState();
    return;
  }

  if (wasDefault) profiles[0].isDefault = true;

  selectedIndex = 0;
  await chrome.storage.local.set({
    profiles,
    selectedProfileIndex: selectedIndex
  });

  openProfile(selectedIndex);
}

/* ---------------- EMPTY STATE ---------------- */

function showEmptyState() {
  document.getElementById("profileForm").style.display = "none";
  document.getElementById("emptyState").style.display = "block";
}
