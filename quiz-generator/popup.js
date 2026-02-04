let quiz = [];

const qInput = document.getElementById("question");
const opts = ["opt1","opt2","opt3","opt4"].map(id => document.getElementById(id));
const ans = document.getElementById("answer");
const list = document.getElementById("list");
const empty = document.getElementById("empty");
const shareLink = document.getElementById("shareLink");
const importLink = document.getElementById("importLink");

chrome.storage.local.get(["quiz"], r => {
  quiz = r.quiz || [];
  render();
});

function save() {
  chrome.storage.local.set({ quiz });
}

function render() {
  list.innerHTML = "";
  empty.style.display = quiz.length ? "none" : "block";

  quiz.forEach((q, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${q.q}`;

    const del = document.createElement("button");
    del.textContent = "🗑";
    del.style.marginLeft = "8px";
    del.onclick = () => {
      quiz.splice(i, 1);
      render();
    };

    li.appendChild(del);
    list.appendChild(li);
  });

  save();
}

document.getElementById("add").onclick = () => {
  const q = qInput.value.trim();
  const o = opts.map(i => i.value.trim());
  const a = ans.value;

  if (!q || o.some(v => !v) || a === "") {
    alert("Fill all fields");
    return;
  }

  quiz.push({ q, o, a: Number(a) });
  qInput.value = "";
  opts.forEach(i => i.value = "");
  ans.value = "";
  render();
};

document.getElementById("share").onclick = () => {
  if (!quiz.length) return alert("No questions");
  const data = encodeURIComponent(btoa(JSON.stringify(quiz)));
  shareLink.value = chrome.runtime.getURL(`viewer.html?quiz=${data}`);
  shareLink.select();
  document.execCommand("copy");
};

document.getElementById("import").onclick = () => {
  try {
    let val = importLink.value.trim();
    if (val.startsWith("http")) {
      val = new URL(val).searchParams.get("quiz");
    }
    quiz = JSON.parse(atob(decodeURIComponent(val)));
    render();
  } catch {
    alert("Invalid quiz link");
  }
};
