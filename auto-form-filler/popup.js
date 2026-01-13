const g = (id) => document.getElementById(id);
let profiles = { work: {}, personal: {} };
chrome.storage.sync.get("profiles", (d) => {
  if (d.profiles) {
    profiles = d.profiles;
  }
  load();
});
function load() {
  const p = g("profile").value;
  g("name").value = profiles[p]?.name || "";
  g("email").value = profiles[p]?.email || "";
  g("phone").value = profiles[p]?.phone || "";
  g("address").value = profiles[p]?.address || "";
  g("company").value = profiles[p]?.company || "";
  g("website").value = profiles[p]?.website || "";
  g("note").value = profiles[p]?.note || "";
}
g("profile").onchange = load;
g("save").onclick = () => {
  const p = g("profile").value;
  profiles[p] = {
    name: g("name").value,
    email: g("email").value,
    phone: g("phone").value,
    address: g("address").value,
    company: g("company").value,
    website: g("website").value,
    note: g("note").value,
  };
  chrome.storage.sync.set({ profiles });
};
g("fill").onclick = async () => {
  if (!confirm("Preview done visually. Fill now?")) return;
  const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
  const p = g("profile").value;
  chrome.tabs.sendMessage(t.id, { action: "fill", profile: profiles[p] });
};
