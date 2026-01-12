const body=document.body,input=document.getElementById("projectInput"),
gen=document.getElementById("generateBtn"),pre=document.getElementById("previewArea"),
copy=document.getElementById("copyBtn"),down=document.getElementById("downloadBtn"),
theme=document.getElementById("themeToggle"),tpl=document.getElementById("templateSelect"),
footer=document.getElementById("footerText");
let out="";
chrome.storage.sync.get(["theme","template","visited"],d=>{
if(d.theme==="light")body.classList.add("light");
if(d.template)tpl.value=d.template;
if(!d.visited){footer.textContent="👋 Paste a project description to generate README";chrome.storage.sync.set({visited:true})}
});
input.oninput=()=>{const v=input.value.trim().length>=30;gen.disabled=!v;gen.classList.toggle("active",v)};
gen.onclick=()=>{out=makeReadme(input.value,tpl.value);pre.textContent=out;copy.disabled=down.disabled=false;copy.classList.add("active");down.classList.add("active")};
copy.onclick=async()=>{await navigator.clipboard.writeText(out);flash(copy,"Copied ✓")};
down.onclick=()=>{const b=new Blob([out],{type:"text/markdown"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="README.md";a.click();flash(down,"Saved ✓")};
theme.onclick=()=>{body.classList.toggle("light");const t=body.classList.contains("light")?"light":"dark";chrome.storage.sync.set({theme:t});theme.textContent=t==="light"?"☀️":"🌙"};
tpl.onchange=()=>chrome.storage.sync.set({template:tpl.value});
function makeReadme(t,m){const l=t.split("\n")[0]||"Project Title";const d=t.split("\n").slice(0,3).join(" ");const f=t.split("\n").filter(x=>x.match(/^[-*•]/)).map(x=>"- "+x.replace(/^[-*•]/,"").trim()).join("\n");
if(m==="minimal")return "# "+l+"\n\n"+d+"\n\n"+f;
return "# "+l+"\n\n## Description\n"+d+"\n\n## Features\n"+(f||"- Feature one")+"\n\n## License\nMIT"};
function flash(b,t){const o=b.textContent;b.textContent=t;setTimeout(()=>b.textContent=o,1200)}
