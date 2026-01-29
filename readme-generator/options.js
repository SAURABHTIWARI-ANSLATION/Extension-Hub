const t=document.getElementById("theme"),p=document.getElementById("tpl"),r=document.getElementById("reset");
chrome.storage.sync.get(["theme","template"],d=>{if(d.theme)t.value=d.theme;if(d.template)p.value=d.template});
t.onchange=()=>chrome.storage.sync.set({theme:t.value});
p.onchange=()=>chrome.storage.sync.set({template:p.value});
r.onclick=()=>chrome.storage.sync.remove("visited",()=>alert("Onboarding reset"));