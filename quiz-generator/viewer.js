const raw = new URLSearchParams(location.search).get("quiz");

if (!raw) {
  document.getElementById("q").textContent = "Invalid quiz link";
  throw new Error("No data");
}

let quiz;
try {
  quiz = JSON.parse(atob(decodeURIComponent(raw)));
} catch {
  document.getElementById("q").textContent = "Corrupted quiz data";
  throw new Error("Bad data");
}

let index = 0;
let score = 0;
let answered = false;

const qEl = document.getElementById("q");
const optsEl = document.getElementById("opts");
const feedback = document.getElementById("feedback");
const next = document.getElementById("next");
const progress = document.getElementById("progress");
const scoreEl = document.getElementById("score");

function render() {
  const q = quiz[index];
  answered = false;
  qEl.textContent = q.q;
  optsEl.innerHTML = "";
  feedback.textContent = "";
  next.disabled = true;

  progress.textContent = `${index + 1}/${quiz.length}`;
  scoreEl.textContent = `Score: ${score}`;

  q.o.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.style.cssText = "display:block;width:100%;margin-bottom:8px;padding:10px;";

    btn.onclick = () => {
      if (answered) return;
      answered = true;
      next.disabled = false;

      if (i === q.a) {
        score++;
        btn.style.background = "#c6f6d5";
        feedback.textContent = "✅ Correct";
      } else {
        btn.style.background = "#fed7d7";
        feedback.textContent = "❌ Wrong";
      }
      scoreEl.textContent = `Score: ${score}`;
    };

    optsEl.appendChild(btn);
  });
}

next.onclick = () => {
  index++;
  if (index < quiz.length) render();
  else {
    qEl.textContent = "🎉 Quiz Completed!";
    optsEl.innerHTML = "";
    feedback.textContent = `Final Score: ${score}/${quiz.length}`;
    next.style.display = "none";
  }
};

render();
