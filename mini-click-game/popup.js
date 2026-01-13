// ----- Game Selector -----
const clickGame = document.getElementById("clickGame");
const reactionGame = document.getElementById("reactionGame");
const memoryGame = document.getElementById("memoryGame");
const ticGame = document.getElementById("ticGame");

const gameDropdownBtn = document.getElementById("gameDropdownBtn");
const gameDropdown = document.getElementById("gameDropdown");
const selectedGameIcon = document.getElementById("selectedGameIcon");
const selectedGameText = document.getElementById("selectedGameText");

const gameOptions = {
  click: { icon: "⚡", text: "Click Speed" },
  reaction: { icon: "⏱", text: "Reaction Test" },
  memory: { icon: "🧠", text: "Memory Match" },
  tic: { icon: "⭕", text: "Tic Tac Toe" },
};

let currentGame = "click";

function showGame(game) {
  clickGame.classList.toggle("hidden", game !== "click");
  reactionGame.classList.toggle("hidden", game !== "reaction");
  memoryGame.classList.toggle("hidden", game !== "memory");
  ticGame.classList.toggle("hidden", game !== "tic");
  selectedGameIcon.textContent = gameOptions[game].icon;
  selectedGameText.textContent = gameOptions[game].text;
  currentGame = game;
}

gameDropdownBtn.onclick = (e) => {
  gameDropdown.style.display =
    gameDropdown.style.display === "block" ? "none" : "block";
};

gameDropdown.querySelectorAll("li").forEach((li) => {
  li.onclick = () => {
    showGame(li.dataset.value);
    gameDropdown.style.display = "none";
  };
});

// Hide dropdown if clicking outside
document.addEventListener("click", (e) => {
  if (!gameDropdownBtn.contains(e.target) && !gameDropdown.contains(e.target)) {
    gameDropdown.style.display = "none";
  }
});

// Initialize
showGame(currentGame);

// ----- Click Speed Game -----
let time = 10;
let score = 0;
let clickInterval;

const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const clickBtn = document.getElementById("clickBtn");

document.getElementById("startClick").onclick = () => {
  time = 10;
  score = 0;
  timerEl.textContent = "⏱ " + time + "s";
  scoreEl.textContent = "🎯 " + score;
  clickBtn.disabled = false;

  clearInterval(clickInterval);
  clickInterval = setInterval(() => {
    time--;
    timerEl.textContent = "⏱ " + time + "s";
    if (time <= 0) {
      clearInterval(clickInterval);
      clickBtn.disabled = true;
      alert("Click Game Over! Score: " + score);
    }
  }, 1000);
};

clickBtn.onclick = () => {
  score++;
  scoreEl.textContent = "🎯 " + score;
};

// ----- Reaction Test -----
const reactionBtn = document.getElementById("reactionBtn");
const reactionText = document.getElementById("reactionText");
let reactionStart = 0;
let reactionTimeout;

document.getElementById("startReaction").onclick = () => {
  reactionText.textContent = "Wait for green...";
  reactionBtn.disabled = true;
  reactionBtn.style.background = "#3b82f6";

  const delay = Math.random() * 3000 + 1000;

  clearTimeout(reactionTimeout);
  reactionTimeout = setTimeout(() => {
    reactionBtn.disabled = false;
    reactionBtn.style.background = "#22c55e";
    reactionText.textContent = "Click now!";
    reactionStart = Date.now();
  }, delay);
};

reactionBtn.onclick = () => {
  const reactionTime = Date.now() - reactionStart;
  reactionText.textContent = `Your reaction: ${reactionTime} ms`;
  reactionBtn.disabled = true;
  reactionBtn.style.background = "#3b82f6";
  clearTimeout(reactionTimeout);
};

// ----- Memory Match Game -----
const memoryGrid = document.getElementById("memoryGrid");
const emojis = ["🍎", "🍌", "🍒", "🍇", "🍉", "🥝", "🍍", "🥥"];
let memoryCards = [];
let firstCard = null;

document.getElementById("startMemory").onclick = () => {
  memoryGrid.innerHTML = "";
  firstCard = null;
  memoryCards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
  let matched = 0;
  memoryCards.forEach((symbol) => {
    const card = document.createElement("div");
    card.className = "memory-card";
    card.textContent = "❓";

    card.onclick = () => {
      if (card.textContent !== "❓") return;
      card.textContent = symbol;

      if (!firstCard) {
        firstCard = card;
      } else {
        if (firstCard.textContent === symbol) {
          matched += 2;
          firstCard = null;
          // Check if all pairs matched
          if (matched === memoryCards.length) {
            setTimeout(() => {
              alert("🎉 Memory Match Winner! You matched all pairs!");
            }, 400);
          }
        } else {
          setTimeout(() => {
            card.textContent = "❓";
            firstCard.textContent = "❓";
            firstCard = null;
          }, 700);
        }
      }
    };
    memoryGrid.appendChild(card);
  });
};

// ----- Tic Tac Toe -----
const ticGrid = document.getElementById("ticGrid");
const ticStatus = document.getElementById("ticStatus");
let ticCells = Array(9).fill(null);
let ticTurn = "X";

function renderTic() {
  ticGrid.innerHTML = "";
  ticCells.forEach((val, idx) => {
    const cell = document.createElement("div");
    cell.className = "tic-cell";
    cell.textContent = val || "";

    cell.onclick = () => {
      if (ticCells[idx] || checkWinner()) return;
      ticCells[idx] = ticTurn;
      ticTurn = ticTurn === "X" ? "O" : "X";
      ticStatus.textContent = `Player ${ticTurn}'s turn`;
      renderTic();

      const winner = checkWinner();
      if (winner) alert(`Player ${winner} wins!`);
    };

    ticGrid.appendChild(cell);
  });
}

function checkWinner() {
  const wins = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of wins) {
    if (
      ticCells[a] &&
      ticCells[a] === ticCells[b] &&
      ticCells[a] === ticCells[c]
    ) {
      return ticCells[a];
    }
  }
  return null;
}

document.getElementById("resetTic").onclick = () => {
  ticCells = Array(9).fill(null);
  ticTurn = "X";
  ticStatus.textContent = "Player X's turn";
  renderTic();
};

renderTic();
