const questionInput = document.getElementById("question");
const optionsDiv = document.getElementById("options");
const addOptionBtn = document.getElementById("addOption");
const createPollBtn = document.getElementById("createPoll");
const generateLinkBtn = document.getElementById("generateLink");
const shareLinkInput = document.getElementById("shareLink");
const pollArea = document.getElementById("pollArea");

let poll = null;

// -------------------- Init --------------------

window.addEventListener("load", init);

function init() {
  loadFromLink() || loadFromStorage();
}

// -------------------- Load --------------------

function loadFromLink() {
  if (!location.hash) return false;
  try {
    poll = JSON.parse(atob(location.hash.substring(1)));
    renderVoteView();
    return true;
  } catch {
    return false;
  }
}

function loadFromStorage() {
  chrome.storage.local.get("poll", ({ poll: saved }) => {
    if (saved) {
      poll = saved;
      renderVoteView();
    }
  });
}

// -------------------- UI Actions --------------------

addOptionBtn.addEventListener("click", () => {
  const input = document.createElement("input");
  input.placeholder = "Option";
  optionsDiv.appendChild(input);
});

createPollBtn.addEventListener("click", createPoll);
generateLinkBtn.addEventListener("click", generateLink);

// -------------------- Poll Logic --------------------

function createPoll() {
  const question = questionInput.value.trim();
  const inputs = [...optionsDiv.querySelectorAll("input")];
  const options = inputs.map(i => i.value.trim()).filter(Boolean);

  if (!question || options.length < 2) {
    alert("Enter a question and at least 2 options.");
    return;
  }

  poll = {
    question,
    options,
    votes: Array(options.length).fill(0)
  };

  chrome.storage.local.set({ poll });
  renderVoteView();
}

function vote(index) {
  poll.votes[index]++;
  chrome.storage.local.set({ poll });
  renderResultsView();
}

function resetPoll() {
  poll = null;
  chrome.storage.local.remove("poll");
  pollArea.innerHTML = "";
  shareLinkInput.value = "";
}

// -------------------- Rendering --------------------

function renderVoteView() {
  pollArea.innerHTML = `<h4>${poll.question}</h4>`;

  poll.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => vote(i);
    pollArea.appendChild(btn);
  });

  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset Poll";
  resetBtn.onclick = resetPoll;
  pollArea.appendChild(resetBtn);
}

function renderResultsView() {
  const total = poll.votes.reduce((a, b) => a + b, 0);

  pollArea.innerHTML = `<h4>${poll.question}</h4>`;

  poll.options.forEach((opt, i) => {
    const percent = total ? Math.round((poll.votes[i] / total) * 100) : 0;
    pollArea.innerHTML += `
      <div>${opt}: ${poll.votes[i]} votes (${percent}%)</div>
    `;
  });

  const backBtn = document.createElement("button");
  backBtn.textContent = "Back to voting";
  backBtn.onclick = renderVoteView;
  pollArea.appendChild(backBtn);
}

// -------------------- Share --------------------

function generateLink() {
  if (!poll) {
    alert("Create a poll first.");
    return;
  }

  const encoded = btoa(JSON.stringify(poll));
  const link = `${location.origin}${location.pathname}#${encoded}`;
  shareLinkInput.value = link;
  shareLinkInput.select();

  navigator.clipboard?.writeText(link).then(() => {
    shareLinkInput.placeholder = "Link copied!";
  });
}
