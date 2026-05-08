document.addEventListener("DOMContentLoaded", () => {

  /* ════════════════════════════════════════
     CONSTANTS
  ════════════════════════════════════════ */
  const API_BASE             = "https://api.mail.tm";
  const STORAGE_KEY          = "tmv_state_v3";
  const HISTORY_KEY          = "tmv_history_v3";
  const AUTO_REFRESH_INTERVAL = 15000;
  const MAX_HISTORY          = 5;

  /* ════════════════════════════════════════
     DOM REFS
  ════════════════════════════════════════ */
  const $  = (id) => document.getElementById(id);

  const statusBadge      = $("statusBadge");
  const emailAddress     = $("emailAddress");
  const domainLabel      = $("domainLabel");
  const messageCount     = $("messageCount");
  const lastUpdated      = $("lastUpdated");
  const messageList      = $("messageList");
  const previewMeta      = $("previewMeta");
  const previewSubject   = $("previewSubject");
  const previewBody      = $("previewBody");
  const otpPanel         = $("otpPanel");
  const otpChips         = $("otpChips");
  const copyAllOtpBtn    = $("copyAllOtpBtn");
  const attachmentPanel  = $("attachmentPanel");
  const attachmentList   = $("attachmentList");
  const unreadBadge      = $("unreadBadge");
  const generateBtn      = $("generateBtn");
  const refreshBtn       = $("refreshBtn");
  const resetBtn         = $("resetBtn");
  const newInboxBtn      = $("newInboxBtn");
  const copyAddressBtn   = $("copyAddressBtn");
  const copyLabel        = $("copyLabel");
  const searchInput      = $("searchInput");
  const autoRefreshBtn   = $("autoRefreshBtn");
  const historyToggleBtn = $("historyToggleBtn");
  const historyPanel     = $("historyPanel");
  const historyList      = $("historyList");
  const clearHistoryBtn  = $("clearHistoryBtn");
  const domainSelect     = $("domainSelect");
  const filterInboxBtn   = $("filterInboxBtn");
  const filterArchivedBtn = $("filterArchivedBtn");
  const filterStarredBtn = $("filterStarredBtn");

  /* ════════════════════════════════════════
     STATE
  ════════════════════════════════════════ */
  const state = {
    address: "",
    password: "",
    token: "",
    domain: "",
    messages: [],
    seenIds: [],
    selectedMessageId: "",
    deletedIds: [],
    archivedIds: [],
    starredIds: [],
    currentFilter: "inbox"
  };

  let autoRefreshTimer    = null;
  let autoRefreshEnabled  = false;
  let refreshDebounceTimer = null;
  let isRefreshing        = false;
  let searchQuery         = "";
  let statusResetTimer    = null;
  let availableDomains    = [];

  /* ════════════════════════════════════════
     INIT
  ════════════════════════════════════════ */
  chrome.storage.local.get([STORAGE_KEY], async (result) => {
    Object.assign(state, result[STORAGE_KEY] || {});
    renderInboxCard();
    renderMessages(state.messages);
    await loadDomains();
    if (state.token) await refreshMessages(false);
  });

  /* ════════════════════════════════════════
     EVENT LISTENERS
  ════════════════════════════════════════ */
  generateBtn.addEventListener("click",      () => createInbox(false));
  newInboxBtn.addEventListener("click",      () => createInbox(true));
  refreshBtn.addEventListener("click",       () => {
    clearTimeout(refreshDebounceTimer);
    refreshDebounceTimer = setTimeout(() => refreshMessages(true), 250);
  });
  resetBtn.addEventListener("click",         burnInbox);
  copyAddressBtn.addEventListener("click",   copyAddress);
  copyAllOtpBtn.addEventListener("click",    copyAllOtps);
  autoRefreshBtn.addEventListener("click",   toggleAutoRefresh);
  historyToggleBtn.addEventListener("click", toggleHistoryPanel);
  clearHistoryBtn.addEventListener("click",  clearHistory);
  filterInboxBtn.addEventListener("click",   () => setFilter("inbox"));
  filterArchivedBtn.addEventListener("click", () => setFilter("archived"));
  filterStarredBtn.addEventListener("click",  () => setFilter("starred"));
  searchInput.addEventListener("input",      () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderMessages(state.messages);
  });

  /* ════════════════════════════════════════
     DOMAIN LOADER
  ════════════════════════════════════════ */
  async function loadDomains() {
    try {
      const data = await apiFetch("/domains");
      availableDomains = (data["hydra:member"] || []).map((d) => d.domain);
      domainSelect.replaceChildren();
      availableDomains.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = "@" + d;
        if (state.domain === d) opt.selected = true;
        domainSelect.appendChild(opt);
      });
      if (window.CADropdowns?.sync) window.CADropdowns.sync("domainSelect");
    } catch (_) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Auto";
      domainSelect.appendChild(opt);
      if (window.CADropdowns?.sync) window.CADropdowns.sync("domainSelect");
    }
  }

  /* ════════════════════════════════════════
     CREATE INBOX
  ════════════════════════════════════════ */
  async function createInbox(forceNew = false) {
    setStatus("Generating…", "loading");
    setBtnLoading(generateBtn, true);
    clearPreview();
    searchInput.value = "";
    searchQuery = "";

    try {
      const pickedDomain = domainSelect.value || availableDomains[0] || "";
      const domain = pickedDomain || (await getPreferredDomain());
      const account = await createAccountWithRetry(domain);

      if (state.address) {
        saveToHistory(state.address, state.password, state.token, state.domain);
      }

      Object.assign(state, {
        address: account.address,
        password: account.password,
        token: account.token,
        domain,
        messages: [],
        seenIds: [],
        deletedIds: [],
        archivedIds: [],
        starredIds: [],
        currentFilter: "inbox",
        selectedMessageId: ""
      });

      persistState();
      renderInboxCard();
      renderMessages([]);
      await refreshMessages(false);
      setStatus("Inbox ready", "success");
    } catch (err) {
      setStatus(err.message || "Could not create inbox", "error");
    } finally {
      setBtnLoading(generateBtn, false);
    }
  }

  /* ════════════════════════════════════════
     REFRESH MESSAGES
  ════════════════════════════════════════ */
  async function refreshMessages(showStatus = true) {
    if (!state.token) {
      if (showStatus) setStatus("No inbox — generate one first", "error");
      return;
    }
    if (isRefreshing) return;
    isRefreshing = true;

    if (showStatus) {
      setStatus("Refreshing…", "loading");
      setBtnLoading(refreshBtn, true);
    }

    try {
      const data    = await apiFetch("/messages", { headers: authHeaders() });
      const fetched = data["hydra:member"] || [];
      const seenSet = new Set(state.seenIds);

      fetched.forEach((m) => { m._unread = !seenSet.has(m.id); });

      state.messages = fetched;
      persistState();
      renderInboxCard();
      renderMessages(state.messages);

      if (state.messages.length && !state.selectedMessageId) {
        await openMessage(state.messages[0].id);
      } else if (state.selectedMessageId) {
        const sel = state.messages.find((m) => m.id === state.selectedMessageId);
        if (sel) await openMessage(sel.id);
        else clearPreview();
      }

      lastUpdated.textContent = "Synced " + timestampLabel(new Date());
      if (showStatus) setStatus("Synced", "success");
    } catch (err) {
      if (showStatus) setStatus(err.message || "Refresh failed", "error");
    } finally {
      isRefreshing = false;
      setBtnLoading(refreshBtn, false);
    }
  }

  /* ════════════════════════════════════════
     OPEN MESSAGE
  ════════════════════════════════════════ */
  async function openMessage(messageId) {
    if (!messageId || !state.token) return;
    try {
      const message = await apiFetch("/messages/" + messageId, { headers: authHeaders() });

      if (!state.seenIds.includes(messageId)) {
        state.seenIds = [...state.seenIds, messageId];
      }
      state.selectedMessageId = messageId;

      const m = state.messages.find((x) => x.id === messageId);
      if (m) m._unread = false;

      persistState();
      renderMessages(state.messages);
      renderPreview(message);
    } catch (err) {
      setStatus(err.message || "Could not open message", "error");
    }
  }

  /* ════════════════════════════════════════
     RENDER: INBOX CARD
  ════════════════════════════════════════ */
  function renderInboxCard() {
    if (state.address) {
      emailAddress.textContent = state.address;
      emailAddress.classList.remove("placeholder");
    } else {
      emailAddress.textContent = "No inbox created yet";
      emailAddress.classList.add("placeholder");
    }

    domainLabel.textContent = state.domain ? "@" + state.domain : "No domain";
    
    // Count messages based on current filter
    let visibleMessages = state.messages.filter(m => !state.deletedIds.includes(m.id));
    if (state.currentFilter === "archived") {
      visibleMessages = visibleMessages.filter(m => state.archivedIds.includes(m.id));
    } else if (state.currentFilter === "starred") {
      visibleMessages = visibleMessages.filter(m => state.starredIds.includes(m.id));
    } else {
      visibleMessages = visibleMessages.filter(m => !state.archivedIds.includes(m.id));
    }
    
    const total = visibleMessages.length;
    messageCount.textContent = total + " message" + (total !== 1 ? "s" : "");

    // Show unread badge only in inbox
    const inboxMessages = state.messages.filter(m => !state.deletedIds.includes(m.id) && !state.archivedIds.includes(m.id));
    const unread = inboxMessages.filter((m) => m._unread).length;
    if (unread > 0 && state.currentFilter === "inbox") {
      unreadBadge.textContent = unread;
      unreadBadge.classList.remove("hidden");
    } else {
      unreadBadge.classList.add("hidden");
    }
  }

  /* ════════════════════════════════════════
     RENDER: MESSAGE LIST
  ════════════════════════════════════════ */
  function renderMessages(messages) {
    // Filter by deletion status
    let visibleMessages = messages.filter(m => !state.deletedIds.includes(m.id));
    
    // Filter by current filter type
    if (state.currentFilter === "archived") {
      visibleMessages = visibleMessages.filter(m => state.archivedIds.includes(m.id));
    } else if (state.currentFilter === "starred") {
      visibleMessages = visibleMessages.filter(m => state.starredIds.includes(m.id));
    } else { // inbox
      visibleMessages = visibleMessages.filter(m => !state.archivedIds.includes(m.id));
    }
    
    // Apply search filter
    const filtered = searchQuery
      ? visibleMessages.filter((m) => {
          const sub  = (m.subject || "").toLowerCase();
          const from = (m.from?.address || "").toLowerCase();
          return sub.includes(searchQuery) || from.includes(searchQuery);
        })
      : visibleMessages;

    messageList.replaceChildren();

    if (!filtered.length) {
      const el = document.createElement("div");
      el.className = "empty-state";
      if (state.currentFilter === "archived") {
        el.textContent = searchQuery ? "No archived messages match your search." : "No archived messages.";
      } else if (state.currentFilter === "starred") {
        el.textContent = searchQuery ? "No starred messages match your search." : "No starred messages.";
      } else {
        el.textContent = searchQuery
          ? "No messages match your search."
          : state.token
            ? "Inbox is active — waiting for emails."
            : "Create an inbox to start receiving emails.";
      }
      messageList.appendChild(el);
      return;
    }

    filtered.forEach((msg) => {
      const item = document.createElement("div");
      item.className = "message-item-wrapper";

      const msgBtn = document.createElement("button");
      msgBtn.type = "button";
      msgBtn.className = "message-item";
      if (msg.id === state.selectedMessageId) msgBtn.classList.add("is-active");
      if (msg._unread) msgBtn.classList.add("is-unread");

      const from = document.createElement("div");
      from.className = "message-from";
      from.textContent = msg.from?.address || "Unknown sender";

      const subject = document.createElement("div");
      subject.className = "message-subject";
      subject.textContent = msg.subject || "(No subject)";

      const time = document.createElement("div");
      time.className = "message-time";
      time.textContent = timestampLabel(msg.createdAt || new Date());

      msgBtn.appendChild(from);
      msgBtn.appendChild(subject);
      msgBtn.appendChild(time);
      msgBtn.addEventListener("click", () => openMessage(msg.id));

      // Action buttons
      const actions = document.createElement("div");
      actions.className = "message-actions";

      // Star button
      const starBtn = document.createElement("button");
      starBtn.type = "button";
      starBtn.className = "action-btn star-btn";
      starBtn.title = state.starredIds.includes(msg.id) ? "Unstar" : "Star";
      starBtn.innerHTML = state.starredIds.includes(msg.id)
        ? '<svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor"><path d="M7 1l1.87 4.2h4.63l-3.75 2.88 1.43 4.32L7 9.9l-3.18 2.5 1.43-4.32L.5 5.2h4.63L7 1z"/></svg>'
        : '<svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.87 4.2h4.63l-3.75 2.88 1.43 4.32L7 9.9l-3.18 2.5 1.43-4.32L.5 5.2h4.63L7 1z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>';
      starBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleStar(msg.id);
      });
      actions.appendChild(starBtn);

      // Archive button
      const archiveBtn = document.createElement("button");
      archiveBtn.type = "button";
      archiveBtn.className = "action-btn archive-btn";
      archiveBtn.title = state.archivedIds.includes(msg.id) ? "Unarchive" : "Archive";
      archiveBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1.5 3h11v1H1.5z" fill="currentColor"/><rect x="2" y="4" width="10" height="8" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M5 7l1.5 1.5 2.5-2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      archiveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleArchive(msg.id);
      });
      actions.appendChild(archiveBtn);

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "action-btn delete-btn";
      deleteBtn.title = "Delete";
      deleteBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5.5 4V3a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M6.5 7v3M7.5 7v3" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><rect x="3" y="4" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.1"/></svg>';
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteMessage(msg.id);
      });
      actions.appendChild(deleteBtn);

      item.appendChild(msgBtn);
      item.appendChild(actions);
      messageList.appendChild(item);
    });
  }

  /* ════════════════════════════════════════
     RENDER: PREVIEW
  ════════════════════════════════════════ */
  function renderPreview(message) {
    const sender = message.from?.address || "Unknown sender";
    const when   = timestampLabel(message.createdAt || new Date());
    previewMeta.textContent    = sender + " · " + when;
    previewSubject.textContent = message.subject || "(No subject)";

    const body = extractReadableBody(message);
    previewBody.textContent = body || "No readable content found.";

    renderOtpChips((message.subject || "") + "\n" + body);
    renderAttachments(message);
  }

  function clearPreview() {
    previewMeta.textContent    = "No message selected";
    previewSubject.textContent = "No message selected";
    previewBody.textContent    = "Open an email from the inbox feed to read it here.";
    otpPanel.classList.add("hidden");
    otpChips.replaceChildren();
    attachmentPanel.classList.add("hidden");
    attachmentList.replaceChildren();
  }

  /* ════════════════════════════════════════
     OTP
  ════════════════════════════════════════ */
  function renderOtpChips(text) {
    otpChips.replaceChildren();
    const matches = [...new Set((text.match(/\b\d{4,8}\b/g) || []))].slice(0, 6);

    if (!matches.length) {
      otpPanel.classList.add("hidden");
      return;
    }

    matches.forEach((code) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "otp-chip";
      chip.textContent = code;
      chip.addEventListener("click", async () => {
        await navigator.clipboard.writeText(code);
        chip.classList.add("copied");
        chip.textContent = "✓ " + code;
        setTimeout(() => {
          chip.classList.remove("copied");
          chip.textContent = code;
        }, 1600);
      });
      otpChips.appendChild(chip);
    });

    otpPanel.classList.remove("hidden");
  }

  async function copyAllOtps() {
    const codes = [...otpChips.querySelectorAll(".otp-chip")]
      .map((c) => c.textContent.replace(/^✓\s*/, "").trim())
      .filter(Boolean);
    if (!codes.length) return;
    await navigator.clipboard.writeText(codes.join(", "));
    setStatus("All OTPs copied", "success");
  }

  /* ════════════════════════════════════════
     ATTACHMENTS
  ════════════════════════════════════════ */
  function renderAttachments(message) {
    attachmentList.replaceChildren();
    const atts = message.attachments || [];

    if (!atts.length) {
      attachmentPanel.classList.add("hidden");
      return;
    }

    atts.forEach((att) => {
      const item = document.createElement("div");
      item.className = "attach-item";

      const name = document.createElement("span");
      name.className = "attach-name";
      name.textContent = att.filename || "Unnamed file";

      const size = document.createElement("span");
      size.className = "attach-size";
      size.textContent = att.size ? formatBytes(att.size) : "";

      item.appendChild(name);
      item.appendChild(size);
      attachmentList.appendChild(item);
    });

    attachmentPanel.classList.remove("hidden");
  }

  /* ════════════════════════════════════════
     COPY ADDRESS
  ════════════════════════════════════════ */
  async function copyAddress() {
    if (!state.address) { setStatus("No address to copy", "error"); return; }
    try {
      await navigator.clipboard.writeText(state.address);
      copyLabel.textContent = "Copied!";
      copyAddressBtn.classList.add("copied");
      setTimeout(() => {
        copyLabel.textContent = "Copy";
        copyAddressBtn.classList.remove("copied");
      }, 2000);
    } catch (_) {
      setStatus("Copy failed", "error");
    }
  }

  /* ════════════════════════════════════════
     BURN INBOX
  ════════════════════════════════════════ */
  function burnInbox() {
    if (state.address) saveToHistory(state.address, state.password, state.token, state.domain);
    Object.assign(state, {
      address: "", password: "", token: "", domain: "",
      messages: [], seenIds: [], selectedMessageId: "",
      deletedIds: [], archivedIds: [], starredIds: [],
      currentFilter: "inbox"
    });
    persistState();
    renderInboxCard();
    renderMessages([]);
    clearPreview();
    lastUpdated.textContent = "Not synced";
    searchInput.value = "";
    searchQuery = "";
    setStatus("Inbox burned", "success");
    stopAutoRefresh();
    autoRefreshEnabled = false;
    autoRefreshBtn.setAttribute("aria-checked", "false");
  }

  /* ════════════════════════════════════════
     MESSAGE ACTIONS: FILTER, DELETE, ARCHIVE, STAR
  ════════════════════════════════════════ */
  function setFilter(filterName) {
    state.currentFilter = filterName;
    persistState();
    
    // Update active button
    document.querySelectorAll(".filter-tab").forEach(btn => btn.classList.remove("is-active"));
    document.querySelector(`[data-filter="${filterName}"]`).classList.add("is-active");
    
    renderMessages(state.messages);
  }

  function deleteMessage(messageId) {
    if (!state.deletedIds.includes(messageId)) {
      state.deletedIds.push(messageId);
      persistState();
      renderMessages(state.messages);
      renderInboxCard();
      
      // If the deleted message was selected, clear preview
      if (state.selectedMessageId === messageId) {
        clearPreview();
        state.selectedMessageId = "";
      }
      
      setStatus("Message deleted", "success");
    }
  }

  function toggleArchive(messageId) {
    const idx = state.archivedIds.indexOf(messageId);
    if (idx > -1) {
      state.archivedIds.splice(idx, 1);
      setStatus("Message moved to inbox", "success");
    } else {
      state.archivedIds.push(messageId);
      setStatus("Message archived", "success");
    }
    persistState();
    renderMessages(state.messages);
    renderInboxCard();
  }

  function toggleStar(messageId) {
    const idx = state.starredIds.indexOf(messageId);
    if (idx > -1) {
      state.starredIds.splice(idx, 1);
      setStatus("Star removed", "success");
    } else {
      state.starredIds.push(messageId);
      setStatus("Message starred", "success");
    }
    persistState();
    renderMessages(state.messages);
  }

  /* ════════════════════════════════════════
     AUTO REFRESH
  ════════════════════════════════════════ */
  function toggleAutoRefresh() {
    autoRefreshEnabled = !autoRefreshEnabled;
    autoRefreshBtn.setAttribute("aria-checked", autoRefreshEnabled ? "true" : "false");
    if (autoRefreshEnabled) {
      setStatus("Auto-refresh ON", "success");
      scheduleAutoRefresh();
    } else {
      setStatus("Auto-refresh OFF", "idle");
      stopAutoRefresh();
    }
  }

  function scheduleAutoRefresh() {
    stopAutoRefresh();
    if (!autoRefreshEnabled || !state.token) return;
    autoRefreshTimer = setTimeout(async () => {
      await refreshMessages(false);
      scheduleAutoRefresh();
    }, AUTO_REFRESH_INTERVAL);
  }

  function stopAutoRefresh() {
    clearTimeout(autoRefreshTimer);
    autoRefreshTimer = null;
  }

  /* ════════════════════════════════════════
     HISTORY
  ════════════════════════════════════════ */
  function toggleHistoryPanel() {
    const hidden = historyPanel.classList.toggle("hidden");
    historyToggleBtn.classList.toggle("is-active", !hidden);
    if (!hidden) renderHistory();
  }

  function saveToHistory(address, password, token, domain) {
    chrome.storage.local.get([HISTORY_KEY], (r) => {
      const hist = (r[HISTORY_KEY] || []).filter((h) => h.address !== address);
      hist.unshift({ address, password, token, domain, savedAt: new Date().toISOString() });
      chrome.storage.local.set({ [HISTORY_KEY]: hist.slice(0, MAX_HISTORY) });
    });
  }

  function renderHistory() {
    chrome.storage.local.get([HISTORY_KEY], (r) => {
      const hist = r[HISTORY_KEY] || [];
      historyList.replaceChildren();

      if (!hist.length) {
        const el = document.createElement("div");
        el.className = "empty-state";
        el.textContent = "No previous inboxes saved.";
        historyList.appendChild(el);
        return;
      }

      hist.forEach((h) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "history-item";

        const addr = document.createElement("span");
        addr.className = "history-addr";
        addr.textContent = h.address;

        const time = document.createElement("span");
        time.className = "history-time";
        time.textContent = timestampLabel(h.savedAt);

        item.appendChild(addr);
        item.appendChild(time);
        item.addEventListener("click", () => restoreHistory(h));
        historyList.appendChild(item);
      });
    });
  }

  function restoreHistory(h) {
    Object.assign(state, {
      address: h.address, password: h.password, token: h.token, domain: h.domain,
      messages: [], seenIds: [], selectedMessageId: "",
      deletedIds: [], archivedIds: [], starredIds: [],
      currentFilter: "inbox"
    });
    persistState();
    renderInboxCard();
    clearPreview();
    historyPanel.classList.add("hidden");
    historyToggleBtn.classList.remove("is-active");
    refreshMessages(true);
  }

  function clearHistory() {
    chrome.storage.local.remove([HISTORY_KEY], () => renderHistory());
  }

  /* ════════════════════════════════════════
     API
  ════════════════════════════════════════ */
  async function getPreferredDomain() {
    const data = await apiFetch("/domains");
    const list = data["hydra:member"] || [];
    if (!list.length) throw new Error("No domain available");
    return list[0].domain;
  }

  async function createAccountWithRetry(domain) {
    let lastErr = null;
    for (let i = 0; i < 4; i++) {
      const address  = randomLocal() + "@" + domain;
      const password = randomPassword();
      try {
        await apiFetch("/accounts", { method: "POST", body: JSON.stringify({ address, password }) });
        const td = await apiFetch("/token",    { method: "POST", body: JSON.stringify({ address, password }) });
        return { address, password, token: td.token };
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error("Could not create inbox");
  }

  function authHeaders() {
    return { Authorization: "Bearer " + state.token };
  }

  async function apiFetch(path, options = {}) {
    const res = await fetch(API_BASE + path, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    let data = {};
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) {
      throw new Error(data["hydra:description"] || data.message || "HTTP " + res.status);
    }
    return data;
  }

  /* ════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════ */
  function extractReadableBody(message) {
    const htmlSrc = Array.isArray(message.html) ? message.html[0] : (message.html || "");
    const src = message.text || stripHtml(htmlSrc) || message.intro || "";
    return src.replace(/\n{3,}/g, "\n\n").trim();
  }

  function stripHtml(html) {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }

  function persistState() {
    chrome.storage.local.set({
      [STORAGE_KEY]: {
        address: state.address, password: state.password, token: state.token,
        domain: state.domain, messages: state.messages, seenIds: state.seenIds,
        selectedMessageId: state.selectedMessageId, deletedIds: state.deletedIds,
        archivedIds: state.archivedIds, starredIds: state.starredIds,
        currentFilter: state.currentFilter
      }
    });
  }

  function setStatus(text, type = "idle") {
    statusBadge.textContent = text;
    statusBadge.className = "status-badge";
    if (type === "loading") statusBadge.classList.add("is-loading");
    else if (type === "success") statusBadge.classList.add("is-success");
    else if (type === "error")   statusBadge.classList.add("is-error");

    clearTimeout(statusResetTimer);
    if (type === "success" || type === "error") {
      statusResetTimer = setTimeout(() => {
        statusBadge.textContent = "Ready";
        statusBadge.className = "status-badge";
      }, 3000);
    }
  }

  function setBtnLoading(btn, loading) {
    btn.disabled = loading;
    btn.classList.toggle("is-loading", loading);
  }

  function timestampLabel(value) {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "Unknown time";
    return d.toLocaleDateString([], { day: "2-digit", month: "short" }) + " " +
           d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  function randomLocal() {
    return "tmp" + Math.random().toString(36).slice(2, 10);
  }

  function randomPassword() {
    return Math.random().toString(36).slice(2, 12) + "Bx7!";
  }
});
