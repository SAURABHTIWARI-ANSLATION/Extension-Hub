
const timezones = [
 {name:"🇮🇳 India – Kolkata",zone:"Asia/Kolkata"},
 {name:"🇺🇸 USA – New York",zone:"America/New_York"},
 {name:"🇺🇸 USA – Los Angeles",zone:"America/Los_Angeles"},
 {name:"🇬🇧 UK – London",zone:"Europe/London"},
 {name:"🇫🇷 France – Paris",zone:"Europe/Paris"},
 {name:"🇩🇪 Germany – Berlin",zone:"Europe/Berlin"},
 {name:"🇮🇹 Italy – Rome",zone:"Europe/Rome"},
 {name:"🇷🇺 Russia – Moscow",zone:"Europe/Moscow"},
 {name:"🇦🇪 UAE – Dubai",zone:"Asia/Dubai"},
 {name:"🇸🇦 Saudi Arabia – Riyadh",zone:"Asia/Riyadh"},
 {name:"🇨🇳 China – Beijing",zone:"Asia/Shanghai"},
 {name:"🇯🇵 Japan – Tokyo",zone:"Asia/Tokyo"},
 {name:"🇰🇷 South Korea – Seoul",zone:"Asia/Seoul"},
 {name:"🇸🇬 Singapore",zone:"Asia/Singapore"},
 {name:"🇦🇺 Australia – Sydney",zone:"Australia/Sydney"},
 {name:"🇳🇿 New Zealand – Auckland",zone:"Pacific/Auckland"},
 {name:"🇧🇷 Brazil – São Paulo",zone:"America/Sao_Paulo"},
 {name:"🇨🇦 Canada – Toronto",zone:"America/Toronto"},
 {name:"🇲🇽 Mexico – Mexico City",zone:"America/Mexico_City"},
 {name:"🇿🇦 South Africa – Johannesburg",zone:"Africa/Johannesburg"},
 {name:"🇪🇬 Egypt – Cairo",zone:"Africa/Cairo"}
];

let clocks=[],is24h=false,dark=false;

const list=document.getElementById("clockList");
const select=document.getElementById("countrySelect");

timezones.forEach(t=>{
 const o=document.createElement("option");
 o.value=t.zone;
 o.textContent=t.name;
 select.appendChild(o);
});

function save(){chrome.storage.local.set({clocks,is24h,dark});}
function load(){
 chrome.storage.local.get(["clocks","is24h","dark"],d=>{
  clocks=d.clocks||[];
  is24h=d.is24h||false;
  dark=d.dark||false;
  document.body.classList.toggle("dark",dark);
  render();
 });
}

function render(){
 list.innerHTML="";
 const now=new Date();
 clocks.forEach((c,i)=>{
  const parts=new Intl.DateTimeFormat("en-US",{
   timeZone:c.zone,hour:"numeric",minute:"numeric",second:"numeric",hour12:!is24h
  }).formatToParts(now);

  const h=+parts.find(p=>p.type==="hour").value%12;
  const m=+parts.find(p=>p.type==="minute").value;
  const s=+parts.find(p=>p.type==="second").value;

  const digital=new Intl.DateTimeFormat("en-US",{
   timeZone:c.zone,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!is24h
  }).format(now);

  const div=document.createElement("div");
  div.className="clock";
  div.innerHTML=`
   <div class="analog">
     <div class="hand hour" style="transform:translateX(-50%) rotate(${h*30+m/2}deg)"></div>
     <div class="hand min" style="transform:translateX(-50%) rotate(${m*6}deg)"></div>
     <div class="hand sec" style="transform:translateX(-50%) rotate(${s*6}deg)"></div>
   </div>
   <div class="digital">${c.name}<br>${digital}</div>
   <span class="remove" data-i="${i}">✖</span>
  `;
  list.appendChild(div);
 });
}

document.getElementById("addBtn").onclick=()=>{
 const zone=select.value;
 const name=select.options[select.selectedIndex].text;
 if(!clocks.find(c=>c.zone===zone)){
  clocks.push({name,zone});
  save(); render();
 }
};

list.onclick=e=>{
 if(e.target.classList.contains("remove")){
  clocks.splice(e.target.dataset.i,1);
  save(); render();
 }
};

document.getElementById("themeToggle").onclick=()=>{
 dark=!dark;
 document.body.classList.toggle("dark",dark);
 save();
};

document.getElementById("formatToggle").onclick=()=>{
 is24h=!is24h;
 save();
};

setInterval(render,1000);
load();
