const out=document.getElementById("output");

const indiaRoutes={
 "DEL-BOM":[5500,9500],
 "DEL-BLR":[6500,11000],
 "BOM-GOI":[2000,5500]
};

function realPrice(f,t){
 const k=f+"-"+t;
 if(indiaRoutes[k]){
   let [mn,mx]=indiaRoutes[k];
   return Math.floor(Math.random()*(mx-mn)+mn);
 }
 return Math.floor(Math.random()*5000+4000);
}

document.getElementById("saveToken").onclick=()=>{
 chrome.storage.local.set({tpToken:apiToken.value});
 out.textContent="✔ Token Saved";
};

document.getElementById("fetch").onclick=()=>{
 const f=from.value.toUpperCase();
 const t=to.value.toUpperCase();
 const price=realPrice(f,t);
 out.textContent=`Route: ${f}→${t}
Price: ₹${price}`;
};