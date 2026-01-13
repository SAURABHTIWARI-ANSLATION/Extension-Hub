const params = new URLSearchParams(window.location.search);
const raw = params.get("quiz");

if (!raw) {
  document.getElementById("q").textContent = "⚠️ Invalid quiz link.";
  throw new Error("No quiz data");
}

let quiz;
try {
  quiz = JSON.parse(atob(decodeURIComponent(raw)));
} catch (e) {
  document.getElementById("q").textContent = "⚠️ Corrupted quiz data.";
  console.error(e);
  throw e;
}

let index = 0;
let score = 0;
let answered = false;

const qEl = document.getElementById("q");
const optsEl = document.getElementById("opts");
const feedback = document.getElementById("feedback");
const nextBtn = document.getElementById("next");
const progressEl = document.getElementById("progress");
const scoreEl = document.getElementById("score");

function render() {
  const q = quiz[index];
  answered = false;

  qEl.textContent = q.q;
  optsEl.innerHTML = "";
  feedback.textContent = "";
  nextBtn.disabled = true;

  if (progressEl) progressEl.textContent = `${index + 1} / ${quiz.length}`;
  if (scoreEl) scoreEl.textContent = `Score: ${score}`;

  q.o.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;

    btn.onclick = () => {
      if (answered) return;
      answered = true;
      nextBtn.disabled = false;

      if (i === q.a) {
        score++;
        btn.classList.add("correct");
        feedback.textContent = "✅ Correct!";
      } else {
        btn.classList.add("wrong");
        feedback.textContent = "❌ Wrong!";
        optsEl.children[q.a]?.classList.add("correct");
      }

      if (scoreEl) scoreEl.textContent = `Score: ${score}`;
    };

    optsEl.appendChild(btn);
  });
}

nextBtn.onclick = () => {
  index++;
  if (index < quiz.length) {
    render();
  } else {
    qEl.textContent = "🎉 Quiz Completed!";
    optsEl.innerHTML = "";
    feedback.textContent = `Final Score: ${score} / ${quiz.length}`;
    nextBtn.style.display = "none";
  }
};

render();
