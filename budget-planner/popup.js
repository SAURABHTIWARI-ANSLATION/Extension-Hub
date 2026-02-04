const balanceEl = document.getElementById("balance");
const historyEl = document.getElementById("history");
const monthFilter = document.getElementById("monthFilter");

let wallet = [];
let limit = 0;

chrome.storage.local.get(["wallet", "limit"], res => {
  wallet = res.wallet || [];
  limit = res.limit || 0;
  render(wallet);
});

document.getElementById("add").onclick = () => {
  const title = document.getElementById("title").value.trim();
  const amount = +document.getElementById("amount").value;
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;

  if (!title || !amount) return;

  wallet.push({ title, amount, type, category, time: new Date().toISOString() });
  chrome.storage.local.set({ wallet }, () => render(wallet));
};

document.getElementById("saveLimit").onclick = () => {
  limit = +document.getElementById("limit").value;
  chrome.storage.local.set({ limit });
};

document.getElementById("viewReport").onclick = () => {
  const m = monthFilter.value;
  if (!m) return alert("Select a month");
  render(wallet.filter(w => w.time.startsWith(m)));
};

document.getElementById("export").onclick = () => exportCSV(wallet);

/* 🧹 Clear All History */
document.getElementById("clearHistory").onclick = () => {
  if (!confirm("Are you sure you want to delete all transaction history?")) return;
  wallet = [];
  chrome.storage.local.set({ wallet }, () => render(wallet));
};

function render(list) {
  let balance = 0;
  historyEl.innerHTML = "";

  list.forEach(item => {
    balance += item.type === "income" ? item.amount : -item.amount;
    const li = document.createElement("li");
    li.textContent = `${item.title} (${item.category}) ₹${item.amount}`;
    li.className = item.type;
    historyEl.appendChild(li);
  });

  balanceEl.textContent = balance;
  drawChart(list);
}

function exportCSV(data) {
  let csv = "Title,Amount,Type,Category,Date\n";
  data.forEach(d => {
    csv += `${d.title},${d.amount},${d.type},${d.category},${d.time}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });

  chrome.downloads.download({
    url: URL.createObjectURL(blob),
    filename: "budget_report.csv"
  });
}
