// ui/popup.js — URLBurst (upgraded)
"use strict";

(function () {
  // ── State ──────────────────────────────────────────────────────────────────
  let settings        = {};
  let isRunning       = false;
  let extractedURLs   = [];
  let editingListId   = null;
  let selectedListId  = null;
  let statsDebounce   = null;
  let draftDebounce   = null;
  let lastStatsText   = null; // avoid redundant stat recalc

  // ── DOM Refs ───────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const $q  = (sel) => document.querySelector(sel);
  const $qa = (sel) => document.querySelectorAll(sel);

  const urlInput        = $("urlInput");
  const urlCountBadge   = $("urlCountBadge");
  const statsBar        = $("statsBar");
  const statValidCount  = $("statValidCount");
  const statInvalidCount = $("statInvalidCount");
  const statDupeCount   = $("statDupeCount");
  const progressPanel   = $("progressPanel");
  const progressBar     = $("progressBar");
  const progressLabel   = $("progressLabel");
  const progressText    = $("progressText");
  const extractPreview  = $("extractPreview");
  const extractList     = $("extractList");
  const extractCount    = $("extractCount");
  const historyList     = $("historyList");

  const savedListSelect = $("savedListSelect");
  const savedListsTable = $("savedListsTable");
  const listEditor      = $("listEditor");
  const editorTitle     = $("editorTitle");
  const listNameInput   = $("listNameInput");
  const listUrlsInput   = $("listUrlsInput");
  const listUrlCount    = $("listUrlCount");

  const btnLoadList   = $("btnLoadList");
  const btnNewList    = $("btnNewList");
  const btnEditList   = $("btnEditList");
  const btnDeleteList = $("btnDeleteList");
  const btnDupeList   = $("btnDupeList");

  const previewPanel    = $("previewPanel");
  const previewList     = $("previewList");
  const previewCount    = $("previewCount");
  const dupePanel       = $("dupePanel");
  const dupeList        = $("dupeList");

  // ── Init ───────────────────────────────────────────────────────────────────
  async function init() {
    settings = await StorageService.loadSettings();
    applySettingsToUI();

    // Restore saved or draft URL list
    const saved  = settings.rememberList ? await StorageService.loadURLList() : "";
    const draft  = await StorageService.loadDraft();
    const restore = saved || draft;
    if (restore) {
      urlInput.value = restore;
      scheduleStats();
    }

    await renderSavedLists();
    await renderHistory();
    // Init custom dropdowns after selects are fully populated
    if (window.UBDropdowns) window.UBDropdowns.init();
    bindEvents();
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  function bindEvents() {
    // Tab nav
    $qa(".tab-btn").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));

    // Textarea
    urlInput.addEventListener("input", handleInputChange);

    // Top actions
    $("btnOpenLinks").addEventListener("click", handleOpenAll);
    $("btnGetTabs").addEventListener("click", handleFromTabs);
    $("btnClearLinks").addEventListener("click", handleClear);

    // Quick actions
    $("btnPaste").addEventListener("click", handlePaste);
    $("btnCopy").addEventListener("click", handleCopy);
    $("btnClear").addEventListener("click", handleClear);
    $("btnImport").addEventListener("click", () => $("fileImport").click());
    $("btnExportTxt").addEventListener("click", () => handleExport("txt"));
    $("btnExportJson").addEventListener("click", () => handleExport("json"));
    $("btnExtract").addEventListener("click", handleExtract);
    $("btnFromTabs").addEventListener("click", handleFromTabs);
    $("btnCleanup").addEventListener("click", handleCleanup);
    $("fileImport").addEventListener("change", handleFileImport);

    // Preview panel
    $("btnPreview").addEventListener("click", handlePreview);
    $("btnPreviewConfirm").addEventListener("click", () => {
      previewPanel.classList.add("hidden");
      handleOpenAll();
    });
    $("btnPreviewCancel").addEventListener("click", () => previewPanel.classList.add("hidden"));

    // Dupe panel
    $("btnShowDupes").addEventListener("click", handleShowDupes);
    $("btnDupeRemove").addEventListener("click", handleRemoveDupes);
    $("btnDupeClose").addEventListener("click", () => dupePanel.classList.add("hidden"));
    $("btnDupeClose2").addEventListener("click", () => dupePanel.classList.add("hidden"));

    // Extract preview
    $("btnExtractConfirm").addEventListener("click", confirmExtract);
    $("btnExtractCancel").addEventListener("click", cancelExtract);

    // Sequential / stop
    $("btnOneByOne").addEventListener("click", handleOneByOne);
    $("btnStop").addEventListener("click", handleStop);

    // Saved lists
    savedListSelect.addEventListener("change", handleListSelectChange);
    btnLoadList.addEventListener("click", handleLoadList);
    btnNewList.addEventListener("click", handleNewList);
    btnEditList.addEventListener("click", handleEditList);
    btnDeleteList.addEventListener("click", handleDeleteList);
    btnDupeList.addEventListener("click", handleDuplicateList);
    $("btnSaveList").addEventListener("click", handleSaveList);
    $("btnCancelEdit").addEventListener("click", cancelEdit);
    $("btnExportLists").addEventListener("click", handleExportLists);
    $("btnSortAZ").addEventListener("click", () => handleSortLists("name"));
    $("btnSortDate").addEventListener("click", () => handleSortLists("date"));
    $("listSearch").addEventListener("input", handleListSearch);
    listUrlsInput.addEventListener("input", updateListUrlCount);

    // History
    $("btnClearHistory").addEventListener("click", async () => {
      await StorageService.clearHistory();
      await renderHistory();
      showToast("History cleared");
    });
    $("historyToggleBtn").addEventListener("click", () => switchTab("history"));

    // Settings
    $qa('[name="openMode"]').forEach((r) => r.addEventListener("change", saveCurrentSettings));
    $qa('[name="groupBy"]').forEach((r) => r.addEventListener("change", saveCurrentSettings));
    ["limitEnabled","limitCount","delayInput","oneByOneWait","inactiveLoad",
     "randomOrder","reverseOrder","preserveInput","ignoreDuplicates","handleNonURLs","rememberList"
    ].forEach((id) => { const el = $(id); if (el) el.addEventListener("change", saveCurrentSettings); });

    // Keyboard shortcuts
    document.addEventListener("keydown", handleKeydown);
  }

  // ── Keyboard Shortcuts ─────────────────────────────────────────────────────
  function handleKeydown(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "Enter") { e.preventDefault(); handleOpenAll(); }
      else if (e.key === "V" && e.shiftKey) { e.preventDefault(); handlePaste(); }
    }
  }

  // ── Tab Navigation ─────────────────────────────────────────────────────────
  function switchTab(tab) {
    $qa(".tab-btn").forEach((b) => {
      const active = b.dataset.tab === tab;
      b.classList.toggle("active", active);
      b.setAttribute("aria-selected", active);
    });
    $qa(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === "tab-" + tab));
  }

  // ── Input / Stats (debounced) ──────────────────────────────────────────────
  function handleInputChange() {
    scheduleStats();
    scheduleDraft();
    if (settings.rememberList) StorageService.saveURLList(urlInput.value);
  }

  function scheduleStats() {
    clearTimeout(statsDebounce);
    statsDebounce = setTimeout(updateStats, 200);
  }

  function scheduleDraft() {
    clearTimeout(draftDebounce);
    draftDebounce = setTimeout(() => StorageService.saveDraft(urlInput.value), 2000);
  }

  function updateStats() {
    const text = urlInput.value;
    if (text === lastStatsText) return;
    lastStatsText = text;

    const trimmed = text.trim();
    if (!trimmed) {
      statsBar.classList.add("hidden");
      urlCountBadge.textContent = "0 URLs";
      $("btnShowDupes").classList.add("hidden");
      return;
    }

    // Use requestIdleCallback for heavy work if list is large
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim());
    const doCalc = () => {
      const a = Validator.analyzeLines(lines);
      statValidCount.textContent  = a.valid.length;
      statInvalidCount.textContent = a.invalid.length;
      statDupeCount.textContent   = a.duplicates.length;
      statsBar.classList.remove("hidden");
      const total = a.valid.length + a.duplicates.length;
      urlCountBadge.textContent = total + " URL" + (total !== 1 ? "s" : "");
      $("btnShowDupes").classList.toggle("hidden", a.duplicates.length === 0);
    };

    if (lines.length > 500 && typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(doCalc, { timeout: 300 });
    } else {
      doCalc();
    }
  }

  // ── Quick Actions ──────────────────────────────────────────────────────────
  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const cur = urlInput.value;
        urlInput.value = cur ? cur + "\n" + text : text;
        handleInputChange();
        showToast("Pasted from clipboard");
      }
    } catch { showToast("Cannot access clipboard"); }
  }

  function handleCopy() {
    const text = urlInput.value.trim();
    if (!text) { showToast("Nothing to copy"); return; }
    navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard"));
  }

  function handleClear() {
    if (!urlInput.value.trim()) return;
    urlInput.value = "";
    lastStatsText = null;
    updateStats();
    StorageService.saveURLList("");
    StorageService.clearDraft();
    showToast("Cleared");
  }

  function handleExport(format) {
    const text = urlInput.value.trim();
    if (!text) { showToast("Nothing to export"); return; }
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const ts = Formatter.formatTimestamp();

    if (format === "json") {
      const payload = JSON.stringify({ exportedAt: ts, count: lines.length, urls: lines }, null, 2);
      downloadBlob(payload, "urls-" + Date.now() + ".json", "application/json");
    } else {
      downloadBlob(text, "urls-" + Date.now() + ".txt", "text/plain");
    }
    showToast("Exported as " + format.toUpperCase());
  }

  function handleExtract() {
    const text = urlInput.value.trim();
    if (!text) { showToast("No text to extract from"); return; }
    extractedURLs = Validator.extractURLsFromText(text);
    if (!extractedURLs.length) { showToast("No URLs found in text"); return; }
    extractList.textContent = "";
    extractedURLs.forEach((u) => {
      const div = document.createElement("div");
      div.className = "extract-url-item";
      div.textContent = u;
      extractList.appendChild(div);
    });
    extractCount.textContent = extractedURLs.length + " found";
    extractPreview.classList.remove("hidden");
  }

  function confirmExtract() {
    urlInput.value = extractedURLs.join("\n");
    handleInputChange();
    extractPreview.classList.add("hidden");
    showToast(extractedURLs.length + " URLs extracted");
  }

  function cancelExtract() { extractPreview.classList.add("hidden"); extractedURLs = []; }

  async function handleFromTabs() {
    try {
      const urls = await OpenService.getCurrentTabURLs();
      if (!urls.length) { showToast("No tabs found"); return; }
      const cur = urlInput.value.trim();
      urlInput.value = cur ? cur + "\n" + urls.join("\n") : urls.join("\n");
      handleInputChange();
      showToast(urls.length + " tab URLs loaded");
    } catch { showToast("Could not access tabs"); }
  }

  function handleCleanup() {
    const text = urlInput.value.trim();
    if (!text) { showToast("Nothing to clean"); return; }
    const before = text.split(/\r?\n/).filter((l) => l.trim()).length;
    const cleaned = URLParserService.cleanup(text);
    const after = cleaned ? cleaned.split(/\r?\n/).filter((l) => l.trim()).length : 0;
    urlInput.value = cleaned;
    lastStatsText = null;
    handleInputChange();
    showToast("Removed " + (before - after) + " invalid/duplicate lines");
  }

  function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast("File too large (max 10 MB)");
      e.target.value = "";
      return;
    }

    const name = file.name.toLowerCase();
    const ext  = name.split(".").pop();

    // ── XLSX / ODS → SheetJS ────────────────────────────────────────────────
    if (ext === "xlsx" || ext === "ods") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const wb   = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
          const urls = [];
          wb.SheetNames.forEach((sheetName) => {
            const sheet = wb.Sheets[sheetName];
            const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
            rows.forEach((row) => {
              row.forEach((cell) => {
                const val = String(cell || "").trim();
                if (val.match(/^https?:\/\//i)) urls.push(val);
              });
            });
          });
          if (!urls.length) { showToast("No URLs found in file"); return; }
          appendToInput(urls.join("\n"), name);
        } catch (err) {
          showToast("Could not parse file");
        }
      };
      reader.readAsArrayBuffer(file);

    // ── CSV / TSV ───────────────────────────────────────────────────────────
    } else if (ext === "csv" || ext === "tsv") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const sep  = ext === "tsv" ? "\t" : ",";
        const lines = ev.target.result.split(/\r?\n/);
        const urls  = [];
        lines.forEach((line) => {
          line.split(sep).forEach((cell) => {
            const val = cell.replace(/^["']|["']$/g, "").trim();
            if (val.match(/^https?:\/\//i)) urls.push(val);
          });
        });
        if (!urls.length) {
          // fallback: treat each non-empty line as a URL candidate
          lines.forEach((l) => { const t = l.trim(); if (t) urls.push(t); });
        }
        appendToInput(urls.join("\n"), name);
      };
      reader.readAsText(file);

    // ── HTML / HTM → extract href / text URLs ──────────────────────────────
    } else if (ext === "html" || ext === "htm") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const parser = new DOMParser();
        const doc    = parser.parseFromString(ev.target.result, "text/html");
        const urls   = [];
        // <a href="...">
        doc.querySelectorAll("a[href]").forEach((a) => {
          const href = a.getAttribute("href").trim();
          if (href.match(/^https?:\/\//i)) urls.push(href);
        });
        // also scan text nodes with regex in case hrefs are relative
        if (!urls.length) {
          const text = doc.body ? doc.body.innerText || doc.body.textContent : ev.target.result;
          const matches = text.match(/https?:\/\/[^\s"'<>]+/gi) || [];
          urls.push(...matches);
        }
        if (!urls.length) { showToast("No URLs found in HTML file"); return; }
        appendToInput([...new Set(urls)].join("\n"), name);
      };
      reader.readAsText(file);

    // ── PDF → extract text URLs via regex ──────────────────────────────────
    } else if (ext === "pdf") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        // Read raw PDF bytes as latin1 string and regex-scan for URLs
        const bytes   = new Uint8Array(ev.target.result);
        let raw = "";
        for (let i = 0; i < bytes.length; i++) raw += String.fromCharCode(bytes[i]);
        // PDF stores URLs in URI actions and plain text streams
        const matches = raw.match(/https?:\/\/[^\s"')\\<>\]]+/gi) || [];
        const urls    = [...new Set(matches.map(u => u.replace(/[.,;:]+$/, "")))];
        if (!urls.length) { showToast("No URLs found in PDF"); return; }
        appendToInput(urls.join("\n"), name);
      };
      reader.readAsArrayBuffer(file);

    // ── JSON ────────────────────────────────────────────────────────────────
    } else if (ext === "json") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        let text = ev.target.result;
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed))                        text = parsed.join("\n");
          else if (parsed.urls && Array.isArray(parsed.urls)) text = parsed.urls.join("\n");
        } catch { /* treat as plain text */ }
        appendToInput(text, name);
      };
      reader.readAsText(file);

    // ── TXT / fallback ──────────────────────────────────────────────────────
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => appendToInput(ev.target.result, name);
      reader.readAsText(file);
    }

    e.target.value = "";
  }

  function appendToInput(text, filename) {
    const cur = urlInput.value.trim();
    urlInput.value = cur ? cur + "\n" + text.trim() : text.trim();
    handleInputChange();
    const count = text.trim().split(/\n/).filter(Boolean).length;
    showToast("Imported " + count + " line" + (count !== 1 ? "s" : "") + " from " + filename);
  }

  // ── URL Preview Panel ──────────────────────────────────────────────────────
  function handlePreview() {
    settings = readSettingsFromUI();
    const urls = URLParserService.parseInput(urlInput.value, settings);
    if (!urls.length) { showToast("No valid URLs to preview"); return; }

    previewList.textContent = "";
    previewCount.textContent = urls.length + " URL" + (urls.length !== 1 ? "s" : "");

    urls.slice(0, 50).forEach((url) => { // show max 50 in preview
      const row = document.createElement("div");
      row.className = "preview-row";
      row.title = "Click to open this URL";
      row.style.cursor = "pointer";

      const favicon = document.createElement("img");
      favicon.className = "preview-favicon";
      favicon.src = Formatter.getFaviconURL(url);
      favicon.width = 14; favicon.height = 14;
      favicon.onerror = () => { favicon.style.display = "none"; };
      favicon.alt = "";

      const domain = document.createElement("span");
      domain.className = "preview-domain";
      domain.textContent = Formatter.getDomain(url);

      const link = document.createElement("span");
      link.className = "preview-url";
      link.textContent = url;
      link.title = url;

      // Single click opens the URL in a new tab — no double-click needed
      row.addEventListener("click", () => {
        chrome.tabs.create({ url, active: true }).catch((err) => {
          console.warn("[URLBurst] Could not open URL:", url, err);
        });
      });

      row.appendChild(favicon);
      row.appendChild(domain);
      row.appendChild(link);
      previewList.appendChild(row);
    });

    if (urls.length > 50) {
      const more = document.createElement("div");
      more.className = "preview-more";
      more.textContent = "… and " + (urls.length - 50) + " more";
      previewList.appendChild(more);
    }

    previewPanel.classList.remove("hidden");
  }

  // ── Duplicate Detector ─────────────────────────────────────────────────────
  function handleShowDupes() {
    const lines = urlInput.value.split(/\r?\n/);
    const dupeIndices = Validator.findDuplicateIndices(lines);
    if (!dupeIndices.size) { showToast("No duplicates found"); return; }

    dupeList.textContent = "";
    const dupeURLs = [...dupeIndices].map((i) => lines[i].trim()).filter(Boolean);
    const unique = [...new Set(dupeURLs)];

    unique.forEach((url) => {
      const item = document.createElement("div");
      item.className = "dupe-item";
      item.textContent = url;
      dupeList.appendChild(item);
    });

    dupePanel.classList.remove("hidden");
  }

  function handleRemoveDupes() {
    handleCleanup();
    dupePanel.classList.add("hidden");
  }

  // ── Saved Lists System ─────────────────────────────────────────────────────
  async function renderSavedLists(filter) {
    let lists = await StorageService.loadSavedLists();
    if (filter) {
      const q = filter.toLowerCase();
      lists = lists.filter((l) => l.name.toLowerCase().includes(q));
    }

    // Update dropdown
    savedListSelect.textContent = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "-- Select a list --";
    savedListSelect.appendChild(placeholder);

    lists.forEach((l) => {
      const opt = document.createElement("option");
      opt.value = l.id;
      opt.textContent = l.name + " (" + l.count + ")";
      if (l.id === selectedListId) opt.selected = true;
      savedListSelect.appendChild(opt);
    });

    updateListButtonStates();

    // Keep custom dropdown in sync with the rebuilt <select>
    if (window.UBDropdowns) window.UBDropdowns.sync("savedListSelect");

    // Render table
    savedListsTable.textContent = "";
    if (!lists.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state small";
      empty.appendChild(buildSVGIcon("list"));
      const p = document.createElement("p"); p.textContent = filter ? "No matching lists" : "No saved lists yet";
      const span = document.createElement("span"); span.textContent = filter ? "Try a different search" : 'Click "New List" to create your first list';
      empty.appendChild(p); empty.appendChild(span);
      savedListsTable.appendChild(empty);
      return;
    }

    lists.forEach((l) => {
      const row = document.createElement("div");
      row.className = "list-row" + (l.id === selectedListId ? " selected" : "");
      row.dataset.id = l.id;

      const meta = document.createElement("div");
      meta.className = "list-row-meta";

      const name = document.createElement("div");
      name.className = "list-row-name";
      name.textContent = l.name;

      const info = document.createElement("div");
      info.className = "list-row-info";
      info.textContent = l.timestamp;

      const badge = document.createElement("span");
      badge.className = "list-row-badge";
      badge.textContent = l.count + " URLs";

      meta.appendChild(name);
      meta.appendChild(info);
      row.appendChild(meta);
      row.appendChild(badge);

      row.addEventListener("click", () => {
        selectedListId = l.id;
        savedListSelect.value = l.id;
        updateListButtonStates();
        $qa(".list-row").forEach((r) => r.classList.toggle("selected", r.dataset.id === l.id));
      });

      savedListsTable.appendChild(row);
    });
  }

  function handleListSelectChange() {
    selectedListId = savedListSelect.value || null;
    $qa(".list-row").forEach((r) => r.classList.toggle("selected", r.dataset.id === selectedListId));
    updateListButtonStates();
  }

  function updateListButtonStates() {
    const has = !!selectedListId;
    btnLoadList.disabled   = !has;
    btnEditList.disabled   = !has;
    btnDeleteList.disabled = !has;
    if (btnDupeList) btnDupeList.disabled = !has;
  }

  async function handleLoadList() {
    if (!selectedListId) return;
    const list = await StorageService.getListById(selectedListId);
    if (!list) return;
    urlInput.value = list.urlsText || list.urls.join("\n");
    lastStatsText = null;
    handleInputChange();
    switchTab("main");
    showToast("\"" + list.name + "\" loaded");
  }

  function handleNewList() {
    editingListId = null;
    editorTitle.textContent = "New List";
    listNameInput.value = "";
    listUrlsInput.value = "";
    listUrlCount.textContent = "0 URLs";
    listEditor.classList.remove("hidden");
    listNameInput.focus();
  }

  async function handleEditList() {
    if (!selectedListId) return;
    const list = await StorageService.getListById(selectedListId);
    if (!list) return;
    editingListId = list.id;
    editorTitle.textContent = "Edit List";
    listNameInput.value = list.name;
    listUrlsInput.value = list.urlsText || list.urls.join("\n");
    updateListUrlCount();
    listEditor.classList.remove("hidden");
    listNameInput.focus();
  }

  async function handleDeleteList() {
    if (!selectedListId) return;
    const list = await StorageService.getListById(selectedListId);
    if (!list) return;
    await StorageService.deleteList(selectedListId);
    selectedListId = null;
    listEditor.classList.add("hidden");
    await renderSavedLists();
    showToast("\"" + list.name + "\" deleted");
  }

  async function handleDuplicateList() {
    if (!selectedListId) return;
    const entry = await StorageService.duplicateList(selectedListId);
    if (!entry) return;
    await renderSavedLists();
    showToast("\"" + entry.name + "\" created");
  }

  async function handleSaveList() {
    const name = listNameInput.value.trim();
    if (!name) { showToast("Please enter a list name"); listNameInput.focus(); return; }
    const urls = listUrlsInput.value.trim();
    if (!urls) { showToast("Please add some URLs"); listUrlsInput.focus(); return; }
    const id = editingListId || null;
    const entry = await StorageService.saveList(id, name, urls);
    selectedListId = entry.id;
    listEditor.classList.add("hidden");
    await renderSavedLists();
    showToast("\"" + entry.name + "\" saved");
  }

  function cancelEdit() {
    listEditor.classList.add("hidden");
    editingListId = null;
  }

  function updateListUrlCount() {
    const count = listUrlsInput.value.split(/\r?\n/).filter((l) => l.trim()).length;
    listUrlCount.textContent = count + " URL" + (count !== 1 ? "s" : "");
  }

  async function handleExportLists() {
    const lists = await StorageService.loadSavedLists();
    if (!lists.length) { showToast("No saved lists to export"); return; }
    const payload = JSON.stringify({
      exportedAt: Formatter.formatTimestamp(),
      count: lists.length,
      lists: lists.map((l) => ({ name: l.name, urls: l.urls, count: l.count, timestamp: l.timestamp }))
    }, null, 2);
    downloadBlob(payload, "urlburst-lists-" + Date.now() + ".json", "application/json");
    showToast("Exported " + lists.length + " lists as JSON");
  }

  async function handleSortLists(sortBy) {
    await StorageService.reorderLists(sortBy);
    await renderSavedLists($("listSearch").value || undefined);
    showToast("Sorted by " + (sortBy === "name" ? "A–Z" : "date"));
  }

  let listSearchDebounce;
  function handleListSearch() {
    clearTimeout(listSearchDebounce);
    listSearchDebounce = setTimeout(() => renderSavedLists($("listSearch").value || undefined), 150);
  }

  // ── Settings ───────────────────────────────────────────────────────────────
  function applySettingsToUI() {
    const modeEl = $q('[name="openMode"][value="' + settings.openMode + '"]');
    if (modeEl) modeEl.checked = true;

    const groupEl = $q('[name="groupBy"][value="' + (settings.groupBy || "domain") + '"]');
    if (groupEl) groupEl.checked = true;

    $("limitEnabled").checked  = settings.limitEnabled;
    $("limitCount").value      = settings.limitCount;
    $("delayInput").value      = settings.delay;
    $("oneByOneWait").value    = settings.oneByOneWait;
    $("inactiveLoad").checked  = settings.inactiveLoad;
    $("randomOrder").checked   = settings.randomOrder;
    $("reverseOrder").checked  = settings.reverseOrder;
    $("preserveInput").checked = settings.preserveInput;
    $("ignoreDuplicates").checked = settings.ignoreDuplicates;
    $("handleNonURLs").checked = settings.handleNonURLs;
    $("rememberList").checked  = settings.rememberList;
  }

  function readSettingsFromUI() {
    const modeEl  = $q('[name="openMode"]:checked');
    const groupEl = $q('[name="groupBy"]:checked');
    return {
      openMode:         modeEl  ? modeEl.value  : "tab",
      groupBy:          groupEl ? groupEl.value : "domain",
      limitEnabled:     $("limitEnabled").checked,
      limitCount:       parseInt($("limitCount").value) || 10,
      delay:            parseFloat($("delayInput").value) || 0.5,
      oneByOneWait:     parseInt($("oneByOneWait").value) || 5,
      inactiveLoad:     $("inactiveLoad").checked,
      randomOrder:      $("randomOrder").checked,
      reverseOrder:     $("reverseOrder").checked,
      preserveInput:    $("preserveInput").checked,
      ignoreDuplicates: $("ignoreDuplicates").checked,
      handleNonURLs:    $("handleNonURLs").checked,
      rememberList:     $("rememberList").checked
    };
  }

  async function saveCurrentSettings() {
    settings = readSettingsFromUI();
    await StorageService.saveSettings(settings);
  }

  // ── Opening ────────────────────────────────────────────────────────────────
  function prepareURLs() {
    settings = readSettingsFromUI();
    return URLParserService.parseInput(urlInput.value, settings);
  }

  async function handleOpenAll() {
    if (isRunning) return;
    settings = readSettingsFromUI();
    const urls = prepareURLs();
    if (!urls.length) { showToast("No valid URLs to open"); return; }

    // Warn if large batch
    if (urls.length > 50) {
      const confirmed = confirm(
        "You are about to open " + urls.length + " tabs.\n" +
        (urls.length > OpenService.MAX_SAFE_TABS
          ? "⚠️ Limited to " + OpenService.MAX_SAFE_TABS + " tabs max.\n"
          : "") +
        "Continue?"
      );
      if (!confirmed) return;
    }

    // Force delay = 0 so all tabs open simultaneously
    await startOpening(urls, { ...settings, delay: 0 });
  }

  // ── One-by-One: driven by background.js alarms ──────────────────────────
  let oboActive = false;

  async function handleOneByOne() {
    if (isRunning || oboActive) return;
    settings = readSettingsFromUI();
    const urls = prepareURLs();
    if (!urls.length) { showToast("No valid URLs to open"); return; }

    const waitSecs = Math.max(1, settings.oneByOneWait || 5);
    oboActive = true;
    setOboUIRunning(true);
    showProgress(0, urls.length);
    progressLabel.textContent = "One by One…";

    chrome.runtime.sendMessage({ action: "OBO_START", urls, waitSeconds: waitSecs });
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "OBO_PROGRESS") {
      showProgress(msg.index + 1, msg.total);
      progressLabel.textContent = "One by One — URL " + (msg.index + 1) + " of " + msg.total;
    } else if (msg.action === "OBO_DONE") {
      oboActive = false;
      setOboUIRunning(false);
      hideProgress();
      showToast("Done! All " + msg.total + " URLs shown.");
    } else if (msg.action === "OBO_STOPPED") {
      oboActive = false;
      setOboUIRunning(false);
      hideProgress();
      showToast("One-by-One stopped.");
    }
  });

  chrome.runtime.sendMessage({ action: "OBO_STATUS" }, (res) => {
    if (chrome.runtime.lastError) return;
    const obo = res && res.obo;
    if (obo && obo.running) {
      oboActive = true;
      setOboUIRunning(true);
      showProgress(obo.index + 1, obo.urls.length);
      progressLabel.textContent = "One by One — URL " + (obo.index + 1) + " of " + obo.urls.length;
    }
  });

  function setOboUIRunning(on) {
    $("btnOneByOne").disabled = on;
    $("btnOpenLinks").disabled = on || isRunning;
    $("btnStop").disabled = !on && !isRunning;
  }

  async function startOpening(urls, s) {
    isRunning = true;
    setUIRunning(true);
    showProgress(0, urls.length);

    await OpenService.openTabs(
      urls, s,
      (cur, total) => showProgress(cur, total),
      async (total) => {
        isRunning = false;
        setUIRunning(false);
        hideProgress();

        const wasCancelled = total === -1;
        showToast(wasCancelled ? "Stopped" : "Opened " + total + " URLs");

        if (!wasCancelled) {
          await StorageService.addHistory({
            count:     total,
            urls:      urls.slice(0, 20),  // save up to 20 for re-run
            mode:      s.openMode,
            timestamp: Formatter.formatTimestamp()
          });
          await renderHistory();

          if (!s.preserveInput) {
            urlInput.value = "";
            lastStatsText = null;
            updateStats();
            StorageService.saveURLList("");
            StorageService.clearDraft();
          }
        }
      }
    );
  }

  function setUIRunning(running) {
    $("btnOpenLinks").disabled = running;
    $("btnOneByOne").disabled  = running;
    $("btnStop").disabled      = !running;
  }

  function handleStop() {
    OpenService.cancel();
    isRunning = false;
    setUIRunning(false);
    hideProgress();
    showToast("Stopped");
  }

  function showProgress(current, total) {
    progressPanel.classList.remove("hidden");
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    progressBar.style.width = pct + "%";
    progressLabel.textContent = "Opening tabs...";
    progressText.textContent = current + " / " + total + " (" + pct + "%)";
  }

  function hideProgress() {
    progressPanel.classList.add("hidden");
    progressBar.style.width = "0%";
  }

  // ── History ────────────────────────────────────────────────────────────────
  async function renderHistory() {
    const history = await StorageService.loadHistory();
    historyList.textContent = "";
    if (!history.length) {
      historyList.appendChild(buildEmptyState("history"));
      return;
    }
    history.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "history-item";

      const meta = document.createElement("div");
      meta.className = "history-meta";

      const countEl = document.createElement("div");
      countEl.className = "history-count";
      countEl.textContent = entry.count + " URL" + (entry.count !== 1 ? "s" : "") + " opened";

      const detailEl = document.createElement("div");
      detailEl.className = "history-detail";
      detailEl.textContent = (entry.mode ? entry.mode + " · " : "") + entry.timestamp;

      meta.appendChild(countEl);
      meta.appendChild(detailEl);

      const actions = document.createElement("div");
      actions.className = "history-actions";

      const loadBtn = document.createElement("button");
      loadBtn.className = "history-load-btn";
      loadBtn.textContent = "Re-run";
      loadBtn.addEventListener("click", () => {
        if (entry.urls && entry.urls.length) {
          urlInput.value = entry.urls.join("\n");
          lastStatsText = null;
          handleInputChange();
          switchTab("main");
          showToast("Session loaded – " + entry.urls.length + " URLs");
        }
      });

      actions.appendChild(loadBtn);
      item.appendChild(meta);
      item.appendChild(actions);
      historyList.appendChild(item);
    });
  }

  // ── Utility Builders ───────────────────────────────────────────────────────
  function buildEmptyState(type) {
    const div = document.createElement("div");
    div.className = "empty-state";
    div.appendChild(buildSVGIcon(type));
    const p = document.createElement("p");
    const span = document.createElement("span");
    if (type === "history") {
      p.textContent = "No history yet";
      span.textContent = "Sessions appear after opening URLs";
    } else {
      p.textContent = "No saved lists yet";
      span.textContent = 'Click "New List" to create your first list';
    }
    div.appendChild(p); div.appendChild(span);
    return div;
  }

  function buildSVGIcon(type) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", "28"); svg.setAttribute("height", "28");
    svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.5");
    svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");

    if (type === "history") {
      const c = document.createElementNS(ns, "circle");
      c.setAttribute("cx", "12"); c.setAttribute("cy", "12"); c.setAttribute("r", "10");
      const poly = document.createElementNS(ns, "polyline");
      poly.setAttribute("points", "12 6 12 12 16 14");
      svg.appendChild(c); svg.appendChild(poly);
    } else {
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z");
      const poly = document.createElementNS(ns, "polyline");
      poly.setAttribute("points", "14 2 14 8 20 8");
      const line = document.createElementNS(ns, "line");
      line.setAttribute("x1","16"); line.setAttribute("y1","13"); line.setAttribute("x2","8"); line.setAttribute("y2","13");
      svg.appendChild(path); svg.appendChild(poly); svg.appendChild(line);
    }
    return svg;
  }

  function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = Formatter.sanitizeFilename(filename);
    a.click();
    URL.revokeObjectURL(url);
  }

  let toastTimeout;
  function showToast(msg) {
    const toast = $("toast");
    toast.textContent = msg;
    toast.classList.remove("hidden");
    requestAnimationFrame(() => toast.classList.add("show"));
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.classList.add("hidden"), 200);
    }, 2400);
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", init);
})();
