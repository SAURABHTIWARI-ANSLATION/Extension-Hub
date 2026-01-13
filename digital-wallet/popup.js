const balanceEl = document.getElementById("balance");
const historyEl = document.getElementById("history");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const emptyState = document.getElementById("emptyState");

let wallet = [];

// Load stored data
chrome.storage.local.get(["wallet"], (res) => {
  wallet = res.wallet || [];
  render();
});

// Save to storage
function save() {
  chrome.storage.local.set({ wallet });
}

// Render UI
function render() {
  let balance = 0;
  historyEl.innerHTML = "";

  wallet.forEach((item, index) => {
    balance += item.type === "income" ? item.amount : -item.amount;

    const li = document.createElement("li");

    const titleSpan = document.createElement("span");
    titleSpan.textContent = item.title;

    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.alignItems = "center";
    right.style.gap = "6px";

    const amountSpan = document.createElement("span");
    amountSpan.textContent = `${item.type === "income" ? "+" : "-"}₹${item.amount}`;

    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑";
    delBtn.className = "delete-btn";
    delBtn.title = "Delete";
    delBtn.onclick = () => {
      wallet.splice(index, 1);
      render();
    };

    right.appendChild(amountSpan);
    right.appendChild(delBtn);

    li.appendChild(titleSpan);
    li.appendChild(right);

    historyEl.appendChild(li);
  });

  balanceEl.textContent = balance;
  emptyState.style.display = wallet.length === 0 ? "block" : "none";

  save();
}

// Button handlers
document.getElementById("addIncome").onclick = () => add("income");
document.getElementById("addExpense").onclick = () => add("expense");

// Add transaction
function add(type) {
  const title = titleInput.value.trim();
  const amount = parseFloat(amountInput.value);

  if (!title || isNaN(amount) || amount <= 0) {
    alert("Please enter a valid description and amount");
    return;
  }

  wallet.push({
    title,
    amount,
    type,
    time: Date.now()
  });

  titleInput.value = "";
  amountInput.value = "";
  render();
}
