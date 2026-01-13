const analyzeBtn = document.getElementById("analyzeBtn");
const resultEl = document.getElementById("result");
const statusEl = document.getElementById("status");

analyzeBtn.addEventListener("click", analyzeCurrentPage);

// -------------------- Main --------------------

async function analyzeCurrentPage() {
  try {
    setStatus("Analyzing...");

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active tab");

    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: collectPerformanceData
    });

    displayResult(result);
    setStatus("Done");
  } catch (err) {
    console.error(err);
    setStatus("Failed to analyze page.");
  }
}

// -------------------- In-page Function --------------------

function collectPerformanceData() {
  const resources = performance.getEntriesByType("resource");
  const navigation = performance.getEntriesByType("navigation")[0];

  const transferSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

  return {
    domCount: document.getElementsByTagName("*").length,
    requests: resources.length,
    loadTime: navigation ? Math.round(navigation.loadEventEnd) : null,
    transferKB: Math.round(transferSize / 1024)
  };
}

// -------------------- UI --------------------

function displayResult(d) {
  resultEl.innerHTML = `
    <div><strong>DOM Elements:</strong> ${d.domCount}</div>
    <div><strong>Requests:</strong> ${d.requests}</div>
    <div><strong>Load Time:</strong> ${d.loadTime ?? "N/A"} ms</div>
    <div><strong>Transfer Size:</strong> ${d.transferKB} KB</div>
  `;
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}
