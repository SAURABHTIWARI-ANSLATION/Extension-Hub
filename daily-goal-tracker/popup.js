/**
 * Daily Goal Tracker - Controller
 */
const GoalApp = {
  // DOM Elements
  elements: {
    input: document.getElementById("newGoal"),
    list: document.getElementById("goalList"),
    streak: document.getElementById("streak"),
    history: document.getElementById("historyContainer"),
    date: document.getElementById("date"),
    addBtn: document.getElementById("addBtn"),
    clearBtn: document.getElementById("clearDone"),
  },

  init() {
    this.displayDate();
    this.render();
    this.setupEventListeners();
  },

  displayDate() {
    const options = { weekday: "long", month: "long", day: "numeric" };
    this.elements.date.textContent = new Date().toLocaleDateString(
      undefined,
      options
    );
  },

  // Centralized State Fetching
  async getState() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        { goals: [], streak: 0, history: [], lastClearDate: null },
        resolve
      );
    });
  },

  async render() {
    const data = await this.getState();
    const { goals, streak, history } = data;

    // 1. Render Current Goals
    this.elements.list.innerHTML = goals.length
      ? goals.map((g, i) => this.createGoalHTML(g, i)).join("")
      : `<p style="text-align:center; color:#64748b; font-size:13px; margin-top:20px;">No goals set for today. Add one above!</p>`;

    // 2. Render Streak
    this.elements.streak.textContent = `🔥 ${streak}`;

    // 3. Render History
    this.renderHistory(history);
  },

  createGoalHTML(goal, index) {
    return `
      <li class="goal-item ${goal.status === "complete" ? "done" : ""}">
        <span class="text">${this.escapeHTML(goal.text)}</span>
        <select class="status-dropdown" data-index="${index}">
          <option value="working" ${
            goal.status === "working" ? "selected" : ""
          }>Working</option>
          <option value="complete" ${
            goal.status === "complete" ? "selected" : ""
          }>Complete</option>
        </select>
        <button class="remove-btn" data-index="${index}">🗑️</button>
      </li>
    `;
  },

  renderHistory(history) {
    if (!history || history.length === 0) {
      this.elements.history.innerHTML = "";
      return;
    }
    // Group history by date
    const grouped = history.reduce((acc, curr) => {
      acc[curr.date] = acc[curr.date] || [];
      acc[curr.date].push(curr.text);
      return acc;
    }, {});
    const latestDates = Object.keys(grouped).sort().reverse().slice(0, 3);
    let html = `<div class="history-title">Recently Accomplished</div>`;
    latestDates.forEach((date) => {
      html += `<div class="history-item">
        <span>${
          date === new Date().toISOString().slice(0, 10) ? "Today" : date
        }</span>
        <ul style='margin:4px 0 8px 0;padding-left:16px;font-size:12px;color:#94a3b8;'>${grouped[
          date
        ]
          .map((t) => `<li>${this.escapeHTML(t)}</li>`)
          .join("")}</ul>
      </div>`;
    });
    this.elements.history.innerHTML = html;
  },

  // Actions
  async addGoal() {
    const text = this.elements.input.value.trim();
    if (!text) return;

    const data = await this.getState();
    const goals = [
      ...data.goals,
      { text, status: "working", createdAt: Date.now() },
    ];

    chrome.storage.sync.set({ goals }, () => {
      this.elements.input.value = "";
      this.render();
    });
  },

  async updateStatus(index, status) {
    const data = await this.getState();
    data.goals[index].status = status;
    chrome.storage.sync.set({ goals: data.goals }, () => this.render());
  },

  async removeGoal(index) {
    const data = await this.getState();
    const goals = data.goals.filter((_, i) => i !== index);
    chrome.storage.sync.set({ goals }, () => this.render());
  },

  async clearCompleted() {
    const data = await this.getState();
    const today = new Date().toISOString().slice(0, 10);

    const completed = data.goals.filter((g) => g.status === "complete");
    const remaining = data.goals.filter((g) => g.status !== "complete");

    if (completed.length === 0) return;

    // History and Streak Logic
    let { history, streak, lastClearDate } = data;

    // Increment streak only once per day
    if (lastClearDate !== today) {
      streak += 1;
      lastClearDate = today;
    }

    const newHistoryEntries = completed.map((g) => ({
      text: g.text,
      date: today,
    }));
    history = [...newHistoryEntries, ...history].slice(0, 50);

    chrome.storage.sync.set(
      {
        goals: remaining,
        history,
        streak,
        lastClearDate,
      },
      () => this.render()
    );
  },

  // Helper: Prevent XSS
  escapeHTML(str) {
    const p = document.createElement("p");
    p.textContent = str;
    return p.innerHTML;
  },

  setupEventListeners() {
    // Add button
    this.elements.addBtn.onclick = () => this.addGoal();

    // Enter key
    this.elements.input.onkeydown = (e) => {
      if (e.key === "Enter") this.addGoal();
    };

    // Clear completed
    this.elements.clearBtn.onclick = () => this.clearCompleted();

    // List clicks (Delegation)
    this.elements.list.onclick = (e) => {
      const index = e.target.dataset.index;
      if (index === undefined) return;
      if (e.target.classList.contains("status-dropdown")) {
        this.updateStatus(parseInt(index), e.target.value);
      } else if (e.target.classList.contains("remove-btn")) {
        this.removeGoal(parseInt(index));
      }
    };
  },
};

// Initialize app
document.addEventListener("DOMContentLoaded", () => GoalApp.init());
