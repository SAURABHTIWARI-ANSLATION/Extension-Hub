const positive = { good:1, great:1, happy:1, love:1, nice:1, excellent:2, awesome:2 };
const negative = { bad:1, sad:1, hate:1, poor:1, terrible:2, awful:2 };
const intensifiers = ["very","really","extremely","so"];

const analyzeBtn = document.getElementById("analyze");
const historyDiv = document.getElementById("history");

loadHistory();

analyzeBtn.onclick = () => {
  const input = document.getElementById("text").value;
  if (!input.trim()) return;

  const words = input.toLowerCase().split(/\W+/);
  let score = 0;

  words.forEach((w,i) => {
    if (positive[w]) score += positive[w];
    if (negative[w]) score -= negative[w];
    if (intensifiers.includes(words[i-1])) {
      if (positive[w]) score++;
      if (negative[w]) score--;
    }
  });

  let result = "Neutral 😐";
  if (score > 1) result = "Positive 😊";
  if (score < -1) result = "Negative 😞";

  document.getElementById("result").innerText = `Result: ${result} (score: ${score})`;

  const entry = {
    text: input.slice(0, 60),
    score,
    result,
    time: new Date().toLocaleTimeString()
  };

  saveHistory(entry);
};

function saveHistory(entry) {
  chrome.storage.local.get({ history: [] }, data => {
    const history = [entry, ...data.history].slice(0, 20);
    chrome.storage.local.set({ history }, loadHistory);
  });
}

function loadHistory() {
  chrome.storage.local.get({ history: [] }, data => {
    historyDiv.innerHTML = data.history.slice(0,5).map(h =>
      `<div class="hist">${h.time} — ${h.result} (${h.score})</div>`
    ).join("");
  });
}

document.getElementById("export").onclick = () => {
  chrome.storage.local.get({ history: [] }, data => {
    const rows = [["Time","Result","Score","Text"]];

    data.history.forEach(h => {
      rows.push([h.time, h.result, h.score, `"${h.text.replace(/"/g,'""')}"`]);
    });

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "sentiment-history.csv";
    a.click();

    URL.revokeObjectURL(url);
  });
};
