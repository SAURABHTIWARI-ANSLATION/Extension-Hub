document.addEventListener('DOMContentLoaded', () => {
  const calculateBtn = document.getElementById('calculate');
  const clearBtn = document.getElementById('clearHistory');
  const historyList = document.getElementById('historyList');

  // Load data on start
  loadHistory();

  calculateBtn.addEventListener('click', () => {
    const name = document.getElementById('featureName').value || "Unnamed Feature";
    const gain = parseFloat(document.getElementById('gain').value);
    const hours = parseFloat(document.getElementById('hours').value);
    const rate = parseFloat(document.getElementById('rate').value);

    if (isNaN(gain) || isNaN(hours) || isNaN(rate)) {
      alert("Please enter valid numbers");
      return;
    }

    const cost = hours * rate;
    const netProfit = gain - cost;
    const roi = ((netProfit / cost) * 100).toFixed(1);

    // Update Main Result
    document.getElementById('total-cost').innerText = `$${cost.toLocaleString()}`;
    document.getElementById('net-profit').innerText = `$${netProfit.toLocaleString()}`;
    const roiEl = document.getElementById('roi-percent');
    roiEl.innerText = `${roi}%`;
    roiEl.style.color = roi >= 0 ? "#10b981" : "#ef4444";
    document.getElementById('result-container').classList.remove('hidden');

    // Save to History
    saveToHistory({ name, roi, cost, netProfit });
  });

  clearBtn.addEventListener('click', () => {
    chrome.storage.local.set({ roiHistory: [] }, () => {
      historyList.innerHTML = '';
    });
  });

  function saveToHistory(item) {
    chrome.storage.local.get(['roiHistory'], (data) => {
      const history = data.roiHistory || [];
      history.unshift(item); // Add to top
      const limitedHistory = history.slice(0, 5); // Keep last 5
      chrome.storage.local.set({ roiHistory: limitedHistory }, loadHistory);
    });
  }

  function loadHistory() {
    chrome.storage.local.get(['roiHistory'], (data) => {
      const history = data.roiHistory || [];
      historyList.innerHTML = history.map(item => `
        <li>
          <div class="hist-name">${item.name}</div>
          <div class="hist-roi" style="color: ${item.roi >= 0 ? '#10b981' : '#ef4444'}">${item.roi}%</div>
        </li>
      `).join('');
    });
  }
});