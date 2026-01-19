const list = document.getElementById("domainList");
const form = document.getElementById("formContainer");
let editIndex = -1;

document.getElementById("showFormBtn").addEventListener("click", () => {
  editIndex = -1;
  form.classList.remove("hidden");
});

document.getElementById("cancelBtn").addEventListener("click", () => {
  form.classList.add("hidden");
});

document.getElementById("saveBtn").addEventListener("click", () => {
  const name = domainName.value.trim();
  const date = expiryDate.value;
  if (!name || !date) return alert("Fill all fields");

  chrome.storage.local.get(["domains"], r => {
    const arr = r.domains || [];
    if (editIndex === -1) arr.push({ name, date });
    else arr[editIndex] = { name, date };

    chrome.storage.local.set({ domains: arr }, refresh);
  });
});

function refresh() {
  form.classList.add("hidden");
  chrome.runtime.sendMessage({ updateBadge: true });
  render();
}

function status(days) {
  if (days < 0) return "red";
  if (days <= 7) return "yellow";
  return "green";
}

function render() {
  chrome.storage.local.get(["domains"], r => {
    const arr = r.domains || [];
    list.innerHTML = "";

    arr.forEach((d, i) => {
      const days = Math.ceil((new Date(d.date) - new Date()) / 86400000);

      const div = document.createElement("div");
      div.className = "item " + status(days);

      div.innerHTML = `
        <div class='info'>
          <b>${d.name}</b><br>
          ${d.date} • ${days} days left
        </div>
        <div class='icons'>
          <span class="edit-btn" data-id="${i}">✏️</span>
          <span class="delete-btn" data-id="${i}">🗑️</span>
        </div>
      `;

      list.appendChild(div);
    });
  });
}

/* EVENT DELEGATION — FIX FOR CSP */
list.addEventListener("click", e => {
  if (e.target.classList.contains("edit-btn")) {
    const id = e.target.dataset.id;
    editDomain(id);
  }

  if (e.target.classList.contains("delete-btn")) {
    const id = e.target.dataset.id;
    deleteDomain(id);
  }
});

function editDomain(i) {
  chrome.storage.local.get(["domains"], r => {
    editIndex = i;
    domainName.value = r.domains[i].name;
    expiryDate.value = r.domains[i].date;
    form.classList.remove("hidden");
  });
}

function deleteDomain(i) {
  chrome.storage.local.get(["domains"], r => {
    r.domains.splice(i, 1);
    chrome.storage.local.set({ domains: r.domains }, refresh);
  });
}

render();
