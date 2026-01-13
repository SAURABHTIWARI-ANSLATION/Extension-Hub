 let quiz = [];

const qInput = document.getElementById("question");
const optInputs = [
  document.getElementById("opt1"),
  document.getElementById("opt2"),
  document.getElementById("opt3"),
  document.getElementById("opt4")
];
const ans = document.getElementById("answer");
const list = document.getElementById("list");
const shareLink = document.getElementById("shareLink");
const importLink = document.getElementById("importLink");
const empty = document.getElementById("empty");

chrome.storage.local.get(["quiz"], (r) => {
  quiz = r.quiz || [];
  render();
});

function save() {
  chrome.storage.local.set({ quiz });
}

function render() {
  list.innerHTML = "";
  empty.style.display = quiz.length === 0 ? "block" : "none";

  quiz.forEach((q, i) => {
    const li = document.createElement("li");

    const title = document.createElement("span");
    title.textContent = `${i + 1}. ${q.q}`;

    const del = document.createElement("button");
    del.textContent = "🗑";
    del.title = "Delete";
    del.onclick = () => {
      quiz.splice(i, 1);
      render();
    };

    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";

    li.appendChild(title);
    li.appendChild(del);
    list.appendChild(li);
  });

  save();
}

// Add question
document.getElementById("add").onclick = () => {
  const q = qInput.value.trim();
  const options = optInputs.map(o => o.value.trim());
  const a = ans.value;

  if (!q || options.some(o => !o) || a === "") {
    alert("Please fill in all fields.");
    return;
  }

  quiz.push({ q, o: options, a: Number(a) });

  qInput.value = "";
  optInputs.forEach(o => o.value = "");
  ans.value = "";

  render();
};

// Share quiz (viewer link)
document.getElementById("share").onclick = () => {
  if (!quiz.length) return alert("No questions to share.");

  const encoded = encodeURIComponent(btoa(JSON.stringify(quiz)));
  const link = chrome.runtime.getURL(`viewer.html?quiz=${encoded}`);

  shareLink.value = link;
  shareLink.select();
  document.execCommand("copy");

  alert("Quiz link copied!");
};

// Import quiz (supports full link or raw code)
document.getElementById("import").onclick = () => {
  try {
    const val = importLink.value.trim();
    let data = val;

    if (val.startsWith("http")) {
      const url = new URL(val);
      data = url.searchParams.get("quiz");
    }

    if (!data) throw new Error("No quiz data");

    quiz = JSON.parse(atob(decodeURIComponent(data)));
    render();

    alert("Quiz imported successfully!");
  } catch {
    alert("Invalid quiz link or code.");
  }
};
