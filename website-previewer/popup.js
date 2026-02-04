const body=document.body;
const input=document.getElementById("urlInput");
const preview=document.getElementById("previewContainer");
const loading=document.getElementById("loading");
const error=document.getElementById("errorText");
const copyBtn=document.getElementById("copyBtn");
const openSite=document.getElementById("openSite");
const historyList=document.getElementById("historyList");

/* -------------------------------------------
   NEW: Responsive Device Mode Toggle
------------------------------------------- */
let deviceMode = "desktop";

document.querySelectorAll(".device-switch button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".device-switch button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
    deviceMode = btn.dataset.size;  
  };
});

/* -------------------------------------------
   Load saved settings
------------------------------------------- */
chrome.storage.local.get(["dark","last","history"],d=>{
 if(d.dark) body.classList.add("dark");
 if(d.last){input.value=d.last;generate(d.last);}
 if(d.history) d.history.forEach(addHistory);
});

/* -------------------------------------------
   Dark Mode Toggle
------------------------------------------- */
document.getElementById("darkToggle").onclick=()=>{
 body.classList.toggle("dark");
 chrome.storage.local.set({dark:body.classList.contains("dark")});
};

/* -------------------------------------------
   Generate Button 
------------------------------------------- */
document.getElementById("previewBtn").onclick=()=>{
 if(input.value) generate(input.value);
};

/* -------------------------------------------
   Clear Button (Full Reset)
------------------------------------------- */
document.getElementById("clearHistory").onclick=()=>{
 chrome.storage.local.set({history:[],last:""});
 historyList.innerHTML="";
 preview.innerHTML="<p>No preview yet</p>";
 input.value="";
};

/* -------------------------------------------
   Normalize URL
------------------------------------------- */
function normalize(u){
 if(!u.includes(".")) u+=".com";
 if(!u.startsWith("http")) u="https://"+u;
 return u;
}

/* -------------------------------------------
   MAIN PREVIEW FUNCTION (Responsive Enabled)
------------------------------------------- */
function generate(raw){
 const url = normalize(raw);

 // NEW: Device-specific screenshot sizes
 const size =
   deviceMode === "mobile"
     ? "width/375/crop/667/"    // 📱 Mobile
     : "width/1280/crop/800/";  // 💻 Desktop

 const imgUrl =
   "https://image.thum.io/get/" + size + url + "?t=" + Date.now();

 loading.style.display="block";
 preview.innerHTML="";
 error.textContent="";

 const img=new Image();
 img.src=imgUrl;
 img.className = "preview-image responsive"; // NEW CLASS

 img.onload=()=>{
  loading.style.display="none";
  preview.appendChild(img);
  openSite.href=url;
  chrome.storage.local.set({last:raw});
  saveHistory(raw);
 };

 img.onerror=()=>{
  loading.style.display="none";
  error.textContent="Preview failed";
 };
}

/* -------------------------------------------
   Save History 
------------------------------------------- */
function saveHistory(u){
 chrome.storage.local.get(["history"],d=>{
  let h=d.history||[];
  if(!h.includes(u)){
    h.unshift(u);
    if(h.length>10)h.pop();
  }
  chrome.storage.local.set({history:h});
  historyList.innerHTML="";
  h.forEach(addHistory);
 });
}

/* -------------------------------------------
   Add History Item 
------------------------------------------- */
function addHistory(u){
 const li=document.createElement("li");
 li.textContent=u;
 li.onclick=()=>generate(u);
 historyList.appendChild(li);
}
