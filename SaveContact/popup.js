const list = document.getElementById("list");
const empty = document.getElementById("empty");
const form = document.getElementById("addContactForm");
const input = document.getElementById("contactInput");
const exportBtn = document.getElementById("export");

const normalize = (v) => v.toLowerCase().replace(/[\s\-().]/g, "");

const isPhone = (v) => /^\+?\d[\d\s\-().]{7,}$/.test(v);
const isEmail = (v) => /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(v);

async function getQueue() {
  const { queue = [] } = await chrome.storage.local.get("queue");
  return queue;
}

async function setQueue(queue) {
  await chrome.storage.local.set({ queue });
}

function createItemElement(item, index, queue) {
  const li = document.createElement("li");

  const info = document.createElement("div");
  info.className = "info";
  info.innerHTML = `
    <strong>${item.value}</strong><br>
    <small>${item.type} · ${new Date(item.time).toLocaleString()} · ${item.source}</small>
  `;

  const btn = document.createElement("button");
  btn.className = "danger";
  btn.textContent = "×";
  btn.title = "Delete";
  btn.onclick = async () => {
    queue.splice(index, 1);
    await setQueue(queue);
    render();
  };

  li.append(info, btn);
  return li;
}

async function render() {
  const queue = await getQueue();
  list.innerHTML = "";

  if (!queue.length) {
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  queue.forEach((item, i) => {
    list.appendChild(createItemElement(item, i, queue));
  });
}

form.onsubmit = async (e) => {
  e.preventDefault();
  const val = input.value.trim();
  if (!val) return;

  let type = null;
  if (isPhone(val)) type = "phone";
  else if (isEmail(val)) type = "email";

  if (!type) {
    feedback("Invalid email or phone");
    return;
  }

  const queue = await getQueue();
  if (queue.some((q) => normalize(q.value) === normalize(val))) {
    feedback("Already saved");
    return;
  }

  queue.push({
    value: val,
    type,
    time: Date.now(),
    source: "manual",
  });

  await setQueue(queue);
  input.value = "";
  render();
};

exportBtn.onclick = async () => {
  const queue = await getQueue();
  const blob = new Blob([JSON.stringify(queue, null, 2)], {
    type: "application/json",
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "contacts.json";
  a.click();
};

function feedback(msg) {
  input.value = "";
  const old = input.placeholder;
  input.placeholder = msg;
  setTimeout(() => (input.placeholder = old), 1500);
}

render();
