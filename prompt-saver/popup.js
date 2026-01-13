// State Management: Keep a local copy of data to avoid constant storage reads
let allPrompts = [];

// DOM Elements
const elements = {
  promptInput: document.getElementById("prompt"),
  catInput: document.getElementById("category"),
  list: document.getElementById("list"),
  search: document.getElementById("search"),
  saveBtn: document.getElementById("save")
};

// --- Initialization ---
async function init() {
  const data = await chrome.storage.local.get({ prompts: [] });
  allPrompts = data.prompts;
  render(allPrompts);
}

// --- Logic ---

const savePrompt = async () => {
  const text = elements.promptInput.value.trim();
  const cat = elements.catInput.value.trim() || "General";

  if (!text) return;

  const newPrompt = {
    id: crypto.randomUUID(), // Unique ID for safer deletion
    text,
    cat,
    time: Date.now()
  };

  allPrompts.unshift(newPrompt);
  await chrome.storage.local.set({ prompts: allPrompts });
  
  elements.promptInput.value = "";
  elements.catInput.value = "";
  render(allPrompts);
};

const deletePrompt = async (id) => {
  allPrompts = allPrompts.filter(p => p.id !== id);
  await chrome.storage.local.set({ prompts: allPrompts });
  render(allPrompts);
};

const copyToClipboard = async (text, btn) => {
  try {
    await navigator.clipboard.writeText(text);
    
    // UI Feedback
    const originalText = btn.textContent;
    btn.textContent = "✅";
    btn.classList.add('success');
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('success');
    }, 1000);
  } catch (err) {
    console.error("Failed to copy!", err);
  }
};

// --- Rendering ---

function render(promptsToDisplay) {
  elements.list.innerHTML = promptsToDisplay.map(p => `
    <div class="item" data-id="${p.id}">
      <div class="item-header">
        <span class="cat">${escapeHtml(p.cat)}</span>
        <div class="actions">
          <button class="btn-copy" data-text="${escapeHtml(p.text)}">📋 Copy</button>
          <button class="btn-del">🗑️</button>
        </div>
      </div>
      <div class="prompt-text">${escapeHtml(p.text)}</div>
    </div>
  `).join("");
}

// --- Event Listeners ---

// Event Delegation: One listener for the whole list instead of one per button
elements.list.addEventListener("click", (e) => {
  const item = e.target.closest(".item");
  if (!item) return;
  
  const id = item.dataset.id;
  const promptData = allPrompts.find(p => p.id === id);

  if (e.target.classList.contains("btn-copy")) {
    copyToClipboard(promptData.text, e.target);
  } else if (e.target.classList.contains("btn-del")) {
    if (confirm("Delete this prompt?")) deletePrompt(id);
  }
});

elements.search.oninput = () => {
  const query = elements.search.value.toLowerCase();
  const filtered = allPrompts.filter(p => 
    p.text.toLowerCase().includes(query) || 
    p.cat.toLowerCase().includes(query)
  );
  render(filtered);
};

elements.saveBtn.onclick = savePrompt;

// Utility: Faster and cleaner escaping
function escapeHtml(str) {
  const p = document.createElement("p");
  p.textContent = str;
  return p.innerHTML;
}

init();