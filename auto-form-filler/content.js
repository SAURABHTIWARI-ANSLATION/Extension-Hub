console.log("[Smart Auto Form Filler] content.js loaded");
chrome.runtime.onMessage.addListener((msg) => {
  console.log("[Smart Auto Form Filler] Message received", msg);
  if (msg.action !== "fill") return;
  document.querySelectorAll("input,textarea").forEach((i) => {
    if (i.type === "password" || i.offsetParent === null) return;
    const k = (i.name + i.id + i.placeholder).toLowerCase();
    if (/name/.test(k) && msg.profile.name) i.value = msg.profile.name;
    if (/email/.test(k) && msg.profile.email) i.value = msg.profile.email;
    if (/phone|tel|mobile/.test(k) && msg.profile.phone)
      i.value = msg.profile.phone;
    if (/address|street|city|zip|postal/.test(k) && msg.profile.address)
      i.value = msg.profile.address;
    if (
      /company|organization|organisation|business|employer/.test(k) &&
      msg.profile.company
    )
      i.value = msg.profile.company;
    if (/website|url/.test(k) && msg.profile.website)
      i.value = msg.profile.website;
    if (/note|comment|remark|memo/.test(k) && msg.profile.note)
      i.value = msg.profile.note;
    i.style.outline = "2px solid #818CF8";
  });
});
