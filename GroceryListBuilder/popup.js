const itemInput = document.getElementById("itemInput");
const qtyInput = document.getElementById("qtyInput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("groceryList");
const emptyState = document.getElementById("emptyState");
const clearBtn = document.getElementById("clearBtn");

let items = [];

document.addEventListener("DOMContentLoaded", load);
addBtn.onclick = addItem;
clearBtn.onclick = clearAll;

function save() {
  chrome.storage.local.set({ items });
}

function load() {
  chrome.storage.local.get("items", res => {
    items = res.items || [];
    render();
  });
}

function addItem() {
  const name = itemInput.value.trim();
  if (!name) return;

  items.push({ name, qty: qtyInput.value || 1, completed: false });
  itemInput.value = "";
  qtyInput.value = "";
  save();
  render();
}

function render() {
  list.innerHTML = "";
  emptyState.style.display = items.length ? "none" : "block";

  items.forEach((item, index) => {
    const li = document.createElement("li");
    if (item.completed) li.classList.add("completed");

    const text = document.createElement("span");
    text.textContent = `${item.name} (${item.qty})`;
    text.onclick = () => {
      item.completed = !item.completed;
      save();
      render();
    };

    const edit = document.createElement("button");
    edit.textContent = "✏️";
    edit.onclick = () => {
      const newName = prompt("Edit item", item.name);
      if (newName) {
        item.name = newName.trim();
        save();
        render();
      }
    };

    const del = document.createElement("button");
    del.textContent = "❌";
    del.onclick = () => {
      items.splice(index, 1);
      save();
      render();
    };

    li.append(text, edit, del);
    list.appendChild(li);
  });
}

function clearAll() {
  items = [];
  save();
  render();
}