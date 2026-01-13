async function render() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("date-label").textContent = today;

  const data = await chrome.storage.local.get(["timeData"]);
  const todayData = data.timeData?.[today] || {};
  const list = document.getElementById("stats-list");
  const siteCount = Object.keys(todayData).length;
  const activeCount = document.getElementById("active-count");
  if (activeCount) {
    activeCount.textContent = `${siteCount} site${siteCount !== 1 ? "s" : ""}`;
  }

  // Calculate total screen time for today
  const totalSeconds = Object.values(todayData).reduce((a, b) => a + b, 0);
  const totalTimeElem = document.getElementById("total-time");
  if (totalTimeElem) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    totalTimeElem.textContent = `${h}h ${m.toString().padStart(2, "0")}m`;
  }

  const sorted = Object.entries(todayData).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    list.innerHTML = '<p class="empty">No sites tracked for today.</p>';
    return;
  }

  list.innerHTML = sorted
    .map(([domain, seconds]) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      const timeStr = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;

      return `
      <div class="row">
        <span class="domain">${domain}</span>
        <span class="time">${timeStr}</span>
      </div>
    `;
    })
    .join("");
}

document.getElementById("clear-btn").addEventListener("click", async () => {
  if (confirm("Delete all tracking data?")) {
    await chrome.storage.local.set({ timeData: {} });
    render();
  }
});

render();
