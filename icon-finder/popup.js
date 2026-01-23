const scanBtn = document.getElementById("scanBtn");
const downloadAllBtn = document.getElementById("downloadAll");
const iconsContainer = document.getElementById("icons");
const statusEl = document.getElementById("status");
const iconCountEl = document.getElementById("iconCount");
const filterSvg = document.getElementById("filterSvg");
const filterImg = document.getElementById("filterImg");

let allIcons = [];

/* -------------------- SCAN PAGE -------------------- */
scanBtn.addEventListener("click", async () => {
  setLoading(true, "Scanning...");
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab) {
    setLoading(false, "No active tab found");
    return;
  }

  // Prevent scanning restricted pages
  if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:")) {
      setLoading(false, "Cannot scan system pages.");
      return;
  }

  const timeout = setTimeout(() => setLoading(false, "Scan timed out (try refreshing page)"), 5000);

  chrome.tabs.sendMessage(tab.id, { type: "SCAN_ICONS" }, (res) => {
    clearTimeout(timeout);
    
    // FIX: Connection error handling
    if (chrome.runtime.lastError) {
        console.warn(chrome.runtime.lastError.message);
        setLoading(false, "Connection failed. Please REFRESH the page.");
        return;
    }

    if (!res || !res.icons || res.icons.length === 0) {
      setLoading(false, "No icons found.");
      return;
    }

    allIcons = res.icons;
    renderIcons();
    setLoading(false, "Scan complete");
    downloadAllBtn.disabled = false;
  });
});

/* -------------------- RENDER -------------------- */
function renderIcons() {
  iconsContainer.innerHTML = "";
  
  const filtered = allIcons.filter(icon => {
    return (icon.type === "svg" && filterSvg.checked) || 
           (icon.type === "image" && filterImg.checked);
  });

  iconCountEl.textContent = `${filtered.length} found`;

  filtered.forEach(icon => {
    const card = document.createElement("div");
    card.className = "icon-card";
    
    const wrapper = document.createElement("div");
    wrapper.style.display = 'contents';
    
    const safeContent = icon.content || "";

    if (icon.type === "svg") {
      wrapper.innerHTML = safeContent;
    } else {
      const img = document.createElement("img");
      const isDataUri = typeof safeContent === 'string' && safeContent.startsWith('data:');
      img.src = isDataUri ? safeContent : (icon.url || "");
      img.onerror = () => { card.style.display = "none"; };
      wrapper.appendChild(img);
    }
    
    card.appendChild(wrapper);

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const dlBtn = document.createElement("button");
    dlBtn.className = "action-btn";
    dlBtn.innerHTML = "⬇";
    dlBtn.onclick = (e) => { e.stopPropagation(); downloadSingle(icon); };

    const cpBtn = document.createElement("button");
    cpBtn.className = "action-btn";
    cpBtn.innerHTML = "📋";
    cpBtn.onclick = (e) => { e.stopPropagation(); copyToClipboard(icon); };

    actions.appendChild(cpBtn);
    actions.appendChild(dlBtn);
    card.appendChild(actions);

    iconsContainer.appendChild(card);
  });
}

/* -------------------- ACTIONS -------------------- */
async function copyToClipboard(icon) {
    try {
        const text = (icon.type === "svg") ? icon.content : icon.url;
        await navigator.clipboard.writeText(text);
        statusEl.textContent = "Copied!";
        setTimeout(() => statusEl.textContent = "", 2000);
    } catch (err) {
        statusEl.textContent = "Failed copy";
    }
}

function downloadSingle(icon) {
    let url = icon.url;
    const safeContent = icon.content || "";
    
    if (icon.type === "svg") {
        const blob = new Blob([safeContent], { type: "image/svg+xml" });
        url = URL.createObjectURL(blob);
    } else if (typeof safeContent === 'string' && safeContent.startsWith('data:')) {
        url = safeContent;
    }

    if(url) chrome.downloads.download({ url: url, filename: icon.name });
}

downloadAllBtn.addEventListener("click", async () => {
    if (typeof JSZip === 'undefined') {
        statusEl.textContent = "Error: JSZip library not loaded.";
        return;
    }

    const filtered = allIcons.filter(icon => {
        return (icon.type === "svg" && filterSvg.checked) || 
               (icon.type === "image" && filterImg.checked);
    });

    if(!filtered.length) return;

    statusEl.textContent = "Generating ZIP...";
    const zip = new JSZip();
    let count = 0;

    filtered.forEach((icon) => {
        try {
            const safeContent = icon.content || "";
            if (icon.type === "svg") {
                zip.file(icon.name, safeContent);
                count++;
            } else if (typeof safeContent === 'string' && safeContent.startsWith("data:")) {
                const data = safeContent.split(',')[1];
                if(data) {
                    zip.file(icon.name, data, {base64: true});
                    count++;
                }
            }
        } catch (e) {
            console.warn("Skipped", icon.name);
        }
    });

    if (count === 0) {
        statusEl.textContent = "No valid files to zip.";
        return;
    }

    zip.generateAsync({ type: "blob" }).then((content) => {
        const url = URL.createObjectURL(content);
        chrome.downloads.download({
            url: url,
            filename: "icons_bundle.zip"
        });
        statusEl.textContent = `Downloaded ${count} icons`;
    });
});

function setLoading(isLoading, text) {
    statusEl.textContent = text;
    scanBtn.textContent = isLoading ? "..." : "Scan Page";
    scanBtn.disabled = isLoading;
    iconsContainer.style.opacity = isLoading ? "0.5" : "1";
}

filterSvg.addEventListener("change", renderIcons);
filterImg.addEventListener("change", renderIcons);