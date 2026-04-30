/* global Stickey */

(() => {
  if (!location.protocol.startsWith('http')) return;
  if (window.__stickeyLoaded) return;
  window.__stickeyLoaded = true;

  const utils = Stickey.utils;

  function debounce(fn, ms) {
    let t = 0;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => {
        try {
          Promise.resolve(fn(...args)).catch(() => {});
        } catch {
          // ignore
        }
      }, ms);
    };
  }

  class StickeyEngine {
    constructor() {
      this.pageUrl = location.href;
      this.pageKey = utils.getPageKeyFromUrl(this.pageUrl);
      this.settings = { highlightColor: 'yellow', toolbarOnSelection: true, showHoverCard: true };

      this.annotations = new Map(); // id -> annotation
      this.renderedHighlights = new Map(); // id -> span[]
      this.renderedNotes = new Map(); // id -> element
      this.selectedId = null;
      this.filterType = 'all';
      this.searchQuery = '';
      this.linkModeForId = null;

      this.drag = { id: null, startX: 0, startY: 0, originX: 0, originY: 0 };
      this.noteZCounter = 1;
      this.lastRestoreAt = 0;
      this.contextInvalidated = false;
      this._warnedInvalidated = false;
      this.observer = null;

      this.root = null;
      this.panel = null;
      this.list = null;
      this.searchInput = null;
      this.hovercard = null;
      this.toolbar = null;
      this.toolbarRange = null;
      this.toolbarColorRow = null;
      this._saveDebounced = debounce((annotation) => this.upsert(annotation), 450);
      this._restoreDebounced = debounce(() => this.restoreMissingHighlights(), 700);
    }

    async init() {
      this.buildUI();
      await this.loadSettings();
      await this.loadPageAnnotations();
      this.renderAll();
      this.installListeners();
      this.installObserver();
    }

    _isContextInvalidatedError(err) {
      const msg = String(err?.message || err || '');
      return msg.includes('Extension context invalidated');
    }

    async safeSendMessage(payload) {
      if (this.contextInvalidated) return null;
      if (!chrome?.runtime?.id) return null;
      try {
        return await chrome.runtime.sendMessage(payload);
      } catch (err) {
        const msg = String(err?.message || err || '');
        if (this._isContextInvalidatedError(err) || msg.includes('Receiving end does not exist.')) {
          this.contextInvalidated = true;
          if (!this._warnedInvalidated) {
            this._warnedInvalidated = true;
            console.warn('[Stickey] Extension reloaded/unavailable; disable persistence until page refresh.');
          }
          return null;
        }
        return null;
      }
    }

    buildUI() {
      const root = document.createElement('div');
      root.id = 'stickey-root';
      root.className = 'stickey-ui';
      root.setAttribute('data-stickey-root', 'true');

      const fab = document.createElement('button');
      fab.className = 'stickey-fab';
      fab.type = 'button';
      fab.title = 'Open Stickey panel';
      fab.addEventListener('click', () => this.togglePanel());
      fab.appendChild(this.icon('panel'));

      const panel = document.createElement('div');
      panel.className = 'stickey-panel';
      panel.dataset.open = 'false';

      const header = document.createElement('div');
      header.className = 'stickey-panel-header';
      const title = document.createElement('div');
      title.className = 'stickey-panel-title';
      title.textContent = 'Stickey';

      const addNoteBtn = document.createElement('button');
      addNoteBtn.className = 'stickey-icon-btn';
      addNoteBtn.type = 'button';
      addNoteBtn.title = 'New note';
      addNoteBtn.appendChild(this.icon('note'));
      addNoteBtn.addEventListener('click', () => this.createFloatingNote());

      const closeBtn = document.createElement('button');
      closeBtn.className = 'stickey-icon-btn';
      closeBtn.type = 'button';
      closeBtn.title = 'Close panel';
      closeBtn.appendChild(this.icon('close'));
      closeBtn.addEventListener('click', () => this.setPanelOpen(false));

      header.appendChild(title);
      header.appendChild(addNoteBtn);
      header.appendChild(closeBtn);

      const searchRow = document.createElement('div');
      searchRow.className = 'stickey-panel-search';
      const search = document.createElement('input');
      search.className = 'stickey-input';
      search.type = 'text';
      search.placeholder = 'Search this page…';
      search.autocomplete = 'off';
      search.addEventListener('input', () => {
        this.searchQuery = search.value;
        this.renderList();
      });
      searchRow.appendChild(search);

      const filters = document.createElement('div');
      filters.className = 'stickey-filters';
      const chipAll = this.chip('All', 'all', true);
      const chipNotes = this.chip('Notes', 'note', false);
      const chipHighlights = this.chip('Highlights', 'highlight', false);
      filters.appendChild(chipAll);
      filters.appendChild(chipNotes);
      filters.appendChild(chipHighlights);

      const detail = document.createElement('div');
      detail.className = 'stickey-detail';
      detail.dataset.open = 'false';
      const detailTitle = document.createElement('div');
      detailTitle.className = 'stickey-detail-title';
      detailTitle.textContent = '';
      const detailSub = document.createElement('div');
      detailSub.className = 'stickey-detail-sub';
      detailSub.textContent = '';
      const comment = document.createElement('textarea');
      comment.className = 'stickey-textarea';
      comment.placeholder = 'Add comment…';
      comment.addEventListener('input', () => {
        const id = this.selectedId;
        const ann = id ? this.annotations.get(id) : null;
        if (!ann || ann.type !== 'highlight') return;
        ann.highlight.comment = comment.value;
        this.updateTagsFromAnnotation(ann);
        this._saveDebounced(ann);
        this.renderList();
      });
      const attachBtn = document.createElement('button');
      attachBtn.type = 'button';
      attachBtn.className = 'stickey-btn';
      attachBtn.textContent = 'Attach note';
      attachBtn.addEventListener('click', async () => {
        const id = this.selectedId;
        const ann = id ? this.annotations.get(id) : null;
        if (!ann || ann.type !== 'highlight') return;
        const note = this.createNoteFromHighlight(ann);
        await this.upsert(note);
        await this.setLink(ann.id, note.id, true);
        this.selectAnnotation(note.id);
        this.focusAnnotation(note.id);
        this.renderList();
      });

      detail.appendChild(detailTitle);
      detail.appendChild(detailSub);
      detail.appendChild(comment);
      detail.appendChild(attachBtn);

      const list = document.createElement('div');
      list.className = 'stickey-list';

      const footer = document.createElement('div');
      footer.className = 'stickey-panel-footer';
      const linkBtn = document.createElement('button');
      linkBtn.type = 'button';
      linkBtn.className = 'stickey-btn';
      linkBtn.textContent = 'Link';
      linkBtn.addEventListener('click', () => this.startLinkMode());
      const convertBtn = document.createElement('button');
      convertBtn.type = 'button';
      convertBtn.className = 'stickey-btn';
      convertBtn.textContent = 'Convert';
      convertBtn.addEventListener('click', () => this.convertSelectedHighlightToNote());
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'stickey-btn stickey-btn-primary';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => this.deleteSelected());

      footer.appendChild(linkBtn);
      footer.appendChild(convertBtn);
      footer.appendChild(delBtn);

      panel.appendChild(header);
      panel.appendChild(searchRow);
      panel.appendChild(filters);
      panel.appendChild(detail);
      panel.appendChild(list);
      panel.appendChild(footer);

      const toolbar = document.createElement('div');
      toolbar.className = 'stickey-toolbar';
      toolbar.dataset.open = 'false';
      toolbar.setAttribute('aria-hidden', 'true');

      const colorRow = this.colorRow(this.settings.highlightColor || 'yellow', (color) => {
        this.setHighlightColor(color);
      });
      const hlBtn = this.toolbarButton('Highlight', () => this.highlightFromToolbar(false));
      const noteBtn = this.toolbarButton('Note', () => this.highlightFromToolbar(true));
      const linkSelBtn = this.toolbarButton('Link', () => this.highlightFromToolbar(true, true));

      toolbar.appendChild(colorRow);
      toolbar.appendChild(hlBtn);
      toolbar.appendChild(noteBtn);
      toolbar.appendChild(linkSelBtn);

      const hovercard = document.createElement('div');
      hovercard.className = 'stickey-hovercard';
      const hcTitle = document.createElement('div');
      hcTitle.className = 'stickey-hovercard-title';
      hcTitle.textContent = 'Highlight';
      const hcText = document.createElement('div');
      hcText.className = 'stickey-hovercard-text';
      hovercard.appendChild(hcTitle);
      hovercard.appendChild(hcText);

      root.appendChild(fab);
      root.appendChild(panel);
      root.appendChild(toolbar);
      root.appendChild(hovercard);
      document.documentElement.appendChild(root);

      this.root = root;
      this.panel = panel;
      this.list = list;
      this.searchInput = search;
      this.detail = detail;
      this.detailTitle = detailTitle;
      this.detailSub = detailSub;
      this.detailComment = comment;
      this.detailAttachBtn = attachBtn;
      this.hovercard = hovercard;
      this.hovercardTitle = hcTitle;
      this.hovercardText = hcText;
      this.toolbar = toolbar;
      this.toolbarColorRow = colorRow;
    }

    colorRow(activeColor, onPick) {
      const row = document.createElement('div');
      row.className = 'stickey-color-row';
      const colors = ['yellow', 'pink', 'blue', 'green', 'orange', 'purple'];
      for (const c of colors) {
        const sw = document.createElement('button');
        sw.type = 'button';
        sw.className = 'stickey-color-swatch';
        sw.dataset.color = c;
        sw.dataset.active = c === activeColor ? 'true' : 'false';
        sw.title = c;
        sw.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          Array.from(row.querySelectorAll('.stickey-color-swatch')).forEach((x) => {
            x.dataset.active = x.dataset.color === c ? 'true' : 'false';
          });
          onPick(c);
        });
        row.appendChild(sw);
      }
      return row;
    }

    setHighlightColor(color) {
      this.settings.highlightColor = color;
      this.updateToolbarColorRow();
      this.safeSendMessage({ action: 'stickey_updateSettings', settings: { highlightColor: color } }).catch(() => {});
    }

    chip(label, value, active) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'stickey-chip';
      btn.textContent = label;
      btn.dataset.value = value;
      btn.dataset.active = active ? 'true' : 'false';
      btn.addEventListener('click', () => {
        this.filterType = value;
        const chips = this.panel.querySelectorAll('.stickey-chip');
        chips.forEach((c) => (c.dataset.active = c.dataset.value === value ? 'true' : 'false'));
        this.renderList();
      });
      return btn;
    }

    toolbarButton(label, onClick) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'stickey-toolbar-btn';
      btn.textContent = label;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      });
      return btn;
    }

    iconButton(title, iconName, onClick) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'stickey-icon-btn';
      btn.title = title;
      btn.appendChild(this.icon(iconName));
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      });
      return btn;
    }

    icon(name) {
      return Stickey.dom.svgIcon(name);
    }

    async loadSettings() {
      const resp = await this.safeSendMessage({ action: 'stickey_getSettings' });
      if (resp?.settings) this.settings = resp.settings;
      this.updateToolbarColorRow();
    }

    updateToolbarColorRow() {
      const row = this.toolbarColorRow;
      if (!row) return;
      const active = this.settings.highlightColor || 'yellow';
      Array.from(row.querySelectorAll('.stickey-color-swatch')).forEach((x) => {
        x.dataset.active = x.dataset.color === active ? 'true' : 'false';
      });
    }

    async loadPageAnnotations() {
      const resp = await this.safeSendMessage({
        action: 'stickey_getAnnotationsForPage',
        pageUrl: this.pageUrl,
        pageTitle: document.title
      });
      const annotations = resp?.annotations || {};
      Object.entries(annotations).forEach(([id, ann]) => {
        this.ensureAnnotationDefaults(ann);
        this.annotations.set(id, ann);
      });
      if (resp?.pageKey) this.pageKey = resp.pageKey;

      // Rebuild z counter from persisted notes (best-effort)
      let maxZ = 0;
      for (const ann of this.annotations.values()) {
        if (ann.type !== 'note') continue;
        const z = Number(ann.note?.z || 0);
        if (Number.isFinite(z)) maxZ = Math.max(maxZ, z);
      }
      this.noteZCounter = Math.max(1, maxZ + 1);
    }

    installListeners() {
      chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        this.onMessage(msg).then((res) => sendResponse(res)).catch(() => sendResponse({ success: false }));
        return true;
      });

      document.addEventListener('mousedown', (e) => {
        const dragHandle = e.target?.closest?.('.stickey-note-drag');
        const note = dragHandle?.closest?.('.stickey-note');
        if (!note || !dragHandle) return;
        const id = note.dataset.id;
        const ann = this.annotations.get(id);
        if (!ann?.note) return;

        // Bring to front on interaction (non-pinned only)
        if (!ann.note.pinned) {
          ann.note.z = this.noteZCounter++;
          this.applyNoteZIndex(note, ann.note);
          this._saveDebounced(ann);
        }

        this.drag.id = id;
        this.drag.startX = e.clientX;
        this.drag.startY = e.clientY;
        this.drag.originX = ann.note.position.x;
        this.drag.originY = ann.note.position.y;
        e.preventDefault();
      }, true);

      document.addEventListener('mousemove', (e) => {
        if (!this.drag.id) return;
        const ann = this.annotations.get(this.drag.id);
        const el = this.renderedNotes.get(this.drag.id);
        if (!ann?.note || !el) return;
        const dx = e.clientX - this.drag.startX;
        const dy = e.clientY - this.drag.startY;
        ann.note.position.x = this.drag.originX + dx;
        ann.note.position.y = this.drag.originY + dy;
        this.positionNoteElement(el, ann.note);
      }, true);

      document.addEventListener('mouseup', () => {
        if (!this.drag.id) return;
        const ann = this.annotations.get(this.drag.id);
        if (ann) this._saveDebounced(ann);
        this.drag.id = null;
      }, true);

      document.addEventListener('mouseup', () => this.maybeShowToolbar(), true);
      document.addEventListener('keyup', (e) => {
        if (e.key === 'Escape') this.hideToolbar();
        if (e.key === 'Escape') this.setPanelOpen(false);
        if (e.key === 'Escape') this.stopLinkMode();
        this.maybeShowToolbar();
      }, true);
      window.addEventListener('scroll', () => this.hideToolbar(), { passive: true });
      window.addEventListener('resize', () => this.hideToolbar(), { passive: true });
    }

    installObserver() {
      const obs = new MutationObserver(() => {
        this._restoreDebounced();
      });
      obs.observe(document.body, { subtree: true, childList: true });
      this.observer = obs;
    }

    async onMessage(msg) {
      switch (msg?.action) {
        case 'stickey_togglePanel':
          this.togglePanel();
          return { success: true };
        case 'stickey_createNote':
          this.createFloatingNote();
          return { success: true };
        case 'stickey_highlightSelection':
          await this.createHighlightFromSelection({ alsoNote: false, startLinkMode: false });
          return { success: true };
        case 'stickey_focusAnnotation':
          this.focusAnnotation(msg.id);
          return { success: true };
        case 'stickey_removeAnnotationLocal':
          await this.deleteAnnotationLocal(String(msg.id || ''));
          this.renderList();
          return { success: true };
        default:
          return { success: false };
      }
    }

    togglePanel() {
      const open = this.panel.dataset.open === 'true';
      this.setPanelOpen(!open);
    }

    setPanelOpen(open) {
      this.panel.dataset.open = open ? 'true' : 'false';
      if (open) this.renderList();
    }

    renderAll() {
      for (const ann of this.annotations.values()) {
        if (ann.type === 'highlight') this.renderHighlight(ann);
        if (ann.type === 'note') this.renderNote(ann);
      }
      this.renderList();
    }

    renderList() {
      this.list.textContent = '';
      const items = Array.from(this.annotations.values()).filter((ann) => ann.pageKey ? ann.pageKey === this.pageKey : true);
      const q = String(this.searchQuery || '').trim().toLowerCase();

      const filtered = items.filter((ann) => {
        if (this.filterType !== 'all' && ann.type !== this.filterType) return false;
        if (!q) return true;
        const text = this.searchTextFor(ann);
        return text.includes(q);
      });

      filtered
        .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
        .forEach((ann) => this.list.appendChild(this.buildListItem(ann)));
    }

    searchTextFor(ann) {
      const parts = [];
      if (ann.type === 'note') {
        parts.push(ann.note?.title || '');
        parts.push(ann.note?.content || '');
      } else {
        parts.push(ann.highlight?.exactText || '');
        parts.push(ann.highlight?.comment || '');
      }
      parts.push((ann.tags || []).map((t) => `#${t}`).join(' '));
      return parts.join(' ').toLowerCase();
    }

    buildListItem(ann) {
      const item = document.createElement('div');
      item.className = 'stickey-item';
      item.dataset.id = ann.id;
      item.dataset.selected = this.selectedId === ann.id ? 'true' : 'false';

      const row = document.createElement('div');
      row.className = 'stickey-item-title';

      const badge = document.createElement('span');
      badge.className = 'stickey-badge';
      badge.textContent = ann.type === 'note' ? 'Note' : 'Highlight';

      const title = document.createElement('span');
      title.className = 'stickey-item-label';
      title.textContent = ann.type === 'note' ? (ann.note?.title || 'Untitled') : (ann.highlight?.exactText || 'Highlight').slice(0, 48);

      const actions = document.createElement('div');
      actions.className = 'stickey-item-actions';

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'stickey-item-action';
      delBtn.title = `Delete ${ann.type}`;
      delBtn.appendChild(this.icon('trash'));
      delBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.deleteAnnotation(ann.id);
      });

      row.appendChild(badge);
      row.appendChild(title);
      row.appendChild(actions);
      actions.appendChild(delBtn);

      const snippet = document.createElement('div');
      snippet.className = 'stickey-item-snippet';
      snippet.textContent =
        ann.type === 'note'
          ? (ann.note?.content || '').slice(0, 140)
          : (ann.highlight?.comment || ann.highlight?.exactText || '').slice(0, 140);

      item.appendChild(row);
      item.appendChild(snippet);

      item.addEventListener('click', () => {
        if (this.linkModeForId && this.linkModeForId !== ann.id) {
          this.toggleLink(this.linkModeForId, ann.id);
          return;
        }
        this.selectAnnotation(ann.id);
        this.focusAnnotation(ann.id);
      });
      return item;
    }

    selectAnnotation(id) {
      const prevId = this.selectedId;
      this.selectedId = id;
      const nodes = this.list.querySelectorAll('.stickey-item');
      nodes.forEach((n) => {
        n.dataset.selected = n.dataset.id === id ? 'true' : 'false';
      });
      this._setDomSelected(prevId, false);
      this._setDomSelected(id, true);
      this.renderDetail();
    }

    _setDomSelected(id, selected) {
      if (!id) return;
      const spans = this.renderedHighlights.get(id);
      if (spans && spans.length) spans.forEach((s) => (s.dataset.selected = selected ? 'true' : 'false'));
      const noteEl = this.renderedNotes.get(id);
      if (noteEl) noteEl.dataset.selected = selected ? 'true' : 'false';
    }

    renderDetail() {
      const id = this.selectedId;
      const ann = id ? this.annotations.get(id) : null;
      if (!ann) {
        this.detail.dataset.open = 'false';
        return;
      }
      this.detail.dataset.open = 'true';
      const linkCount = Array.isArray(ann.linkedIds) ? ann.linkedIds.length : 0;
      if (ann.type === 'highlight') {
        this.detailTitle.textContent = 'Highlight';
        this.detailSub.textContent = `Links: ${linkCount} · Tags: ${(ann.tags || []).slice(0, 6).map((t) => `#${t}`).join(' ') || 'none'}`;
        this.detailComment.disabled = false;
        this.detailComment.value = ann.highlight?.comment || '';
        this.detailAttachBtn.disabled = false;
        this.detailAttachBtn.style.display = 'inline-block';
      } else {
        this.detailTitle.textContent = 'Note';
        this.detailSub.textContent = `Links: ${linkCount} · Tags: ${(ann.tags || []).slice(0, 6).map((t) => `#${t}`).join(' ') || 'none'}`;
        this.detailComment.value = '';
        this.detailComment.disabled = true;
        this.detailAttachBtn.disabled = true;
        this.detailAttachBtn.style.display = 'none';
      }
    }

    focusAnnotation(id) {
      const ann = this.annotations.get(id);
      if (!ann) return;
      if (ann.type === 'note') {
        const el = this.renderedNotes.get(id);
        if (el) {
          el.classList.remove('stickey-flash');
          el.getBoundingClientRect();
          el.classList.add('stickey-flash');
          el.scrollIntoView?.({ block: 'center', inline: 'nearest' });
        }
        return;
      }
      const spans = this.renderedHighlights.get(id);
      const first = spans?.[0];
      if (first) {
        first.classList.remove('stickey-flash');
        first.getBoundingClientRect();
        first.classList.add('stickey-flash');
        first.scrollIntoView?.({ block: 'center', inline: 'nearest' });
      }
    }

    maybeShowToolbar() {
      if (!this.settings.toolbarOnSelection) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return this.hideToolbar();
      if (utils.isEditableTarget(sel.anchorNode)) return this.hideToolbar();
      const range = sel.rangeCount ? sel.getRangeAt(0) : null;
      if (!range || range.collapsed) return this.hideToolbar();

      const text = sel.toString().trim();
      if (!text) return this.hideToolbar();

      const rect = range.getBoundingClientRect();
      if (!rect || rect.width < 1 || rect.height < 1) return this.hideToolbar();

      const left = rect.left + window.scrollX;
      const top = rect.top + window.scrollY - 44;
      this.toolbar.style.left = `${Math.max(8, left)}px`;
      this.toolbar.style.top = `${Math.max(8, top)}px`;
      this.toolbar.dataset.open = 'true';
      this.toolbar.setAttribute('aria-hidden', 'false');
      this.toolbarRange = range.cloneRange();
    }

    hideToolbar() {
      this.toolbar.dataset.open = 'false';
      this.toolbar.setAttribute('aria-hidden', 'true');
      this.toolbarRange = null;
    }

    async highlightFromToolbar(alsoNote, startLinkMode = false) {
      await this.createHighlightFromSelection({ alsoNote, startLinkMode });
      const sel = window.getSelection();
      sel?.removeAllRanges?.();
      this.hideToolbar();
    }

    async createHighlightFromSelection({ alsoNote, startLinkMode }) {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;
      const range = selection.rangeCount ? selection.getRangeAt(0) : null;
      if (!range || range.collapsed) return;
      if (utils.isEditableTarget(range.startContainer) || utils.isEditableTarget(range.endContainer)) return;

      const exactText = selection.toString().trim();
      if (!exactText) return;

      const highlightId = utils.createId('hl');
      const selectors = this.serializeRange(range);

      const highlight = {
        id: highlightId,
        type: 'highlight',
        pageUrl: this.pageUrl,
        pageTitle: document.title,
        createdAt: utils.nowIso(),
        updatedAt: utils.nowIso(),
        tags: utils.extractTags(exactText),
        linkedIds: [],
        highlight: {
          color: this.settings.highlightColor || 'yellow',
          exactText,
          comment: '',
          selectors
        }
      };

      this.annotations.set(highlightId, highlight);
      await this.upsert(highlight);
      this.renderHighlight(highlight);
      this.setPanelOpen(true);
      this.selectAnnotation(highlightId);

      if (alsoNote) {
        const note = this.createNoteFromHighlight(highlight);
        await this.upsert(note);
        await this.setLink(highlightId, note.id, true);
        if (startLinkMode) this.startLinkMode(highlightId);
      }
    }

    serializeRange(range) {
      const startNode = range.startContainer;
      const endNode = range.endContainer;
      return {
        startXPath: utils.xpathForNode(startNode),
        startOffset: range.startOffset,
        endXPath: utils.xpathForNode(endNode),
        endOffset: range.endOffset
      };
    }

    buildRangeFromSelectors(selectors) {
      const startNode = utils.nodeFromXPath(selectors?.startXPath);
      const endNode = utils.nodeFromXPath(selectors?.endXPath);
      if (!startNode || !endNode) return null;
      const range = document.createRange();
      try {
        range.setStart(startNode, selectors.startOffset || 0);
        range.setEnd(endNode, selectors.endOffset || 0);
      } catch {
        return null;
      }
      if (range.collapsed) return null;
      return range;
    }

    renderHighlight(ann) {
      if (!ann?.highlight) return;
      if (this.renderedHighlights.has(ann.id)) return;

      const range = this.buildRangeFromSelectors(ann.highlight.selectors);
      const wrapped = range ? this.wrapRange(range, ann) : this.wrapBySearchingText(ann);
      if (!wrapped || wrapped.length === 0) return;
      this.renderedHighlights.set(ann.id, wrapped);
    }

    restoreMissingHighlights() {
      const now = Date.now();
      if (now - this.lastRestoreAt < 2500) return;

      let missing = 0;
      for (const ann of this.annotations.values()) {
        if (ann.type !== 'highlight') continue;
        if (!this.renderedHighlights.has(ann.id)) missing += 1;
      }
      if (missing === 0) return;
      this.lastRestoreAt = now;

      let restored = 0;
      for (const ann of this.annotations.values()) {
        if (ann.type !== 'highlight') continue;
        if (this.renderedHighlights.has(ann.id)) continue;
        this.renderHighlight(ann);
        restored += 1;
        if (restored >= 40) break; // avoid heavy work on large pages
      }
    }

    wrapBySearchingText(ann) {
      const text = String(ann.highlight?.exactText || '').trim();
      if (!text || text.length < 3) return [];
      const bodyTextLen = document.body?.textContent?.length || 0;
      if (bodyTextLen > 2_000_000) return [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      let node;
      let visited = 0;
      while ((node = walker.nextNode())) {
        visited += 1;
        if (visited > 15000) return [];
        if (this.isInsideStickeyUI(node)) continue;
        const idx = node.textContent.indexOf(text);
        if (idx !== -1) {
          const range = document.createRange();
          range.setStart(node, idx);
          range.setEnd(node, idx + text.length);
          const wrapped = this.wrapRange(range, ann);
          if (wrapped.length > 0) {
            // Backfill selectors for better future restoration
            ann.highlight.selectors = this.serializeRange(range);
            this._saveDebounced(ann);
            return wrapped;
          }
        }
      }
      return [];
    }

    isInsideStickeyUI(node) {
      const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
      return Boolean(el?.closest?.('#stickey-root,[data-stickey-root="true"]'));
    }

    wrapRange(range, ann) {
      const spans = [];
      const color = ann.highlight?.color || 'yellow';

      const common = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;
      if (!common) return [];

      const walker = document.createTreeWalker(common, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (!node || !node.textContent) return NodeFilter.FILTER_REJECT;
          if (this.isInsideStickeyUI(node)) return NodeFilter.FILTER_REJECT;
          if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.closest('script,style,noscript')) return NodeFilter.FILTER_REJECT;
          if (parent.closest('textarea,input,select,option')) return NodeFilter.FILTER_REJECT;
          if (parent.isContentEditable) return NodeFilter.FILTER_REJECT;
          if (parent.closest('.stickey-highlight')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      const toProcess = [];
      let tn;
      while ((tn = walker.nextNode())) toProcess.push(tn);

      for (const textNode of toProcess) {
        let startOffset = 0;
        let endOffset = textNode.textContent.length;

        if (range.startContainer === textNode) startOffset = range.startOffset;
        if (range.endContainer === textNode) endOffset = range.endOffset;

        if (endOffset <= startOffset) continue;

        let target = textNode;
        if (startOffset > 0) target = target.splitText(startOffset);
        if (endOffset - startOffset < target.textContent.length) target.splitText(endOffset - startOffset);

        const span = document.createElement('span');
        span.className = 'stickey-highlight';
        span.dataset.id = ann.id;
        span.dataset.color = color;
        span.textContent = target.textContent;

        span.addEventListener('mouseenter', () => this.showHoverForHighlight(ann, span));
        span.addEventListener('mouseleave', () => this.hideHover());
        span.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.selectAnnotation(ann.id);
          this.openHighlightEditor(ann, span);
        }, true);

        const parent = target.parentNode;
        parent.replaceChild(span, target);
        spans.push(span);
      }
      return spans;
    }

    showHoverForHighlight(ann, span) {
      if (!this.settings.showHoverCard) return;
      const rect = span.getBoundingClientRect();
      const left = rect.left + window.scrollX;
      const top = rect.bottom + window.scrollY + 8;

      this.hovercardTitle.textContent = 'Highlight';
      const comment = String(ann.highlight?.comment || '').trim();
      this.hovercardText.textContent = comment || String(ann.highlight?.exactText || '').slice(0, 160);
      this.hovercard.style.left = `${Math.max(8, left)}px`;
      this.hovercard.style.top = `${Math.max(8, top)}px`;
      this.hovercard.style.display = 'block';
    }

    hideHover() {
      this.hovercard.style.display = 'none';
    }

    ensureAnnotationDefaults(ann) {
      if (!ann || typeof ann !== 'object') return;
      if (ann.type === 'note' && ann.note) {
        ann.note.color = ann.note.color || 'yellow';
        ann.note.pinned = Boolean(ann.note.pinned);
        if (!Number.isFinite(Number(ann.note.z))) ann.note.z = 0;
      }
      if (ann.type === 'highlight' && ann.highlight) {
        ann.highlight.color = ann.highlight.color || 'yellow';
      }
    }

    createFloatingNote() {
      const id = utils.createId('note');
      const note = {
        id,
        type: 'note',
        pageUrl: this.pageUrl,
        pageTitle: document.title,
        createdAt: utils.nowIso(),
        updatedAt: utils.nowIso(),
        tags: [],
        linkedIds: [],
        note: {
          title: '',
          content: '',
          position: { x: window.scrollX + 120, y: window.scrollY + 120 },
          size: { w: 320, h: 240 },
          minimized: false,
          anchorId: null,
          color: 'yellow',
          pinned: false,
          z: this.noteZCounter++
        }
      };
      this.annotations.set(id, note);
      this.upsert(note);
      this.renderNote(note);
      this.setNoteEditing(note, this.renderedNotes.get(id), true);
      this.setPanelOpen(true);
      this.selectAnnotation(id);
      this.focusAnnotation(id);
      return note;
    }

    createNoteFromHighlight(highlightAnn) {
      const rect = this.renderedHighlights.get(highlightAnn.id)?.[0]?.getBoundingClientRect();
      const id = utils.createId('note');
      const note = {
        id,
        type: 'note',
        pageUrl: this.pageUrl,
        pageTitle: document.title,
        createdAt: utils.nowIso(),
        updatedAt: utils.nowIso(),
        tags: [],
        linkedIds: [highlightAnn.id],
        note: {
          title: '',
          content: highlightAnn.highlight?.exactText || '',
          position: {
            x: window.scrollX + (rect ? rect.left : 120) + 16,
            y: window.scrollY + (rect ? rect.top : 120) + 16
          },
          size: { w: 340, h: 260 },
          minimized: false,
          anchorId: highlightAnn.id,
          color: 'yellow',
          pinned: false,
          z: this.noteZCounter++
        }
      };
      this.annotations.set(id, note);
      this.renderNote(note);
      this.setNoteEditing(note, this.renderedNotes.get(id), true);
      return note;
    }

    renderNote(ann) {
      if (!ann?.note) return;
      if (this.renderedNotes.has(ann.id)) return;

      const el = document.createElement('div');
      el.className = 'stickey-note stickey-ui';
      el.dataset.id = ann.id;
      el.dataset.color = ann.note.color || 'yellow';
      el.dataset.pinned = ann.note.pinned ? 'true' : 'false';
      el.dataset.editing = 'true';
      el.setAttribute('data-stickey-root', 'true');
      el.style.setProperty('--stickey-note-w', `${ann.note.size?.w || 320}px`);
      this.applyNoteZIndex(el, ann.note);

      const header = document.createElement('div');
      header.className = 'stickey-note-header';
      const drag = document.createElement('div');
      drag.className = 'stickey-note-drag';
      drag.title = 'Drag note';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'stickey-note-title-wrap';
      const titleDisplay = document.createElement('div');
      titleDisplay.className = 'stickey-note-title-display';
      titleDisplay.textContent = (ann.note.title || '').trim() || 'Untitled';
      const titleInput = document.createElement('input');
      titleInput.className = 'stickey-note-title-input';
      titleInput.type = 'text';
      titleInput.placeholder = 'Untitled';
      titleInput.value = ann.note.title || '';
      titleInput.addEventListener('input', () => {
        ann.note.title = titleInput.value;
        titleDisplay.textContent = (ann.note.title || '').trim() || 'Untitled';
        this.updateTagsFromAnnotation(ann);
        this._saveDebounced(ann);
        this.renderList();
      });
      titleWrap.appendChild(titleDisplay);
      titleWrap.appendChild(titleInput);

      const actions = document.createElement('div');
      actions.className = 'stickey-note-actions';

      const paletteBtn = this.iconButton('Color', 'palette', () => this.openNoteColorPicker(ann, el, paletteBtn));
      const pinBtn = this.iconButton('Pin', 'pin', () => {
        ann.note.pinned = !ann.note.pinned;
        el.dataset.pinned = ann.note.pinned ? 'true' : 'false';
        this.applyNoteZIndex(el, ann.note);
        this._saveDebounced(ann);
      });
      const editBtn = this.iconButton('Edit', 'edit', async () => {
        const editing = el.dataset.editing === 'true';
        this.setNoteEditing(ann, el, !editing);
        if (editing) await this.upsert(ann);
      });
      const saveBtn = this.iconButton('Save', 'save', async () => {
        await this.upsert(ann);
        this.setNoteEditing(ann, el, false);
        el.classList.remove('stickey-flash');
        el.getBoundingClientRect();
        el.classList.add('stickey-flash');
      });
      const delBtn = this.iconButton('Delete', 'trash', () => this.deleteAnnotation(ann.id));

      actions.appendChild(paletteBtn);
      actions.appendChild(pinBtn);
      actions.appendChild(editBtn);
      actions.appendChild(saveBtn);
      actions.appendChild(delBtn);

      header.appendChild(drag);
      header.appendChild(titleWrap);
      header.appendChild(actions);

      const body = document.createElement('div');
      body.className = 'stickey-note-body';
      const content = document.createElement('div');
      content.className = 'stickey-note-content';
      content.textContent = ann.note.content || '';
      content.addEventListener('dblclick', () => this.setNoteEditing(ann, el, true));

      const textarea = document.createElement('textarea');
      textarea.className = 'stickey-note-text';
      textarea.placeholder = 'Write… use #tags';
      textarea.value = ann.note.content || '';
      textarea.addEventListener('input', () => {
        ann.note.content = textarea.value;
        content.textContent = ann.note.content || '';
        this.updateTagsFromAnnotation(ann);
        this._saveDebounced(ann);
        this.renderList();
      });

      body.appendChild(content);
      body.appendChild(textarea);

      el.appendChild(header);
      el.appendChild(body);
      this.positionNoteElement(el, ann.note);
      document.body.appendChild(el);

      this.renderedNotes.set(ann.id, el);
      this.setNoteEditing(ann, el, false);
    }

    positionNoteElement(el, note) {
      el.style.setProperty('--stickey-note-x', `${note.position.x}px`);
      el.style.setProperty('--stickey-note-y', `${note.position.y}px`);
    }

    applyNoteZIndex(el, note) {
      const pinned = Boolean(note?.pinned);
      const z = Number(note?.z || 0);
      el.style.zIndex = pinned ? '2147483645' : String(2147483000 + Math.max(0, Math.min(60000, z)));
    }

    setNoteEditing(ann, el, editing) {
      if (!ann?.note || !el) return;
      el.dataset.editing = editing ? 'true' : 'false';
      if (editing) {
        const input = el.querySelector('.stickey-note-title-input');
        const textarea = el.querySelector('.stickey-note-text');
        if (input && document.activeElement !== input) input.focus();
        if (textarea) textarea.value = ann.note.content || '';
      } else {
        const titleDisplay = el.querySelector('.stickey-note-title-display');
        const content = el.querySelector('.stickey-note-content');
        if (titleDisplay) titleDisplay.textContent = (ann.note.title || '').trim() || 'Untitled';
        if (content) content.textContent = ann.note.content || '';
      }
    }

    openNoteColorPicker(ann, noteEl, buttonEl) {
      if (!ann?.note || !noteEl || !buttonEl) return;
      this.ensurePopover();
      const pop = this.popover;
      pop.dataset.type = 'noteColor';
      pop.textContent = '';

      const title = document.createElement('div');
      title.className = 'stickey-popover-title';
      title.textContent = 'Note color';

      const row = document.createElement('div');
      row.className = 'stickey-color-row';
      const colors = ['yellow', 'pink', 'blue', 'green', 'orange', 'purple'];
      for (const c of colors) {
        const sw = document.createElement('button');
        sw.type = 'button';
        sw.className = 'stickey-color-swatch';
        sw.dataset.color = c;
        sw.dataset.active = (ann.note.color === c) ? 'true' : 'false';
        sw.title = c;
        sw.addEventListener('click', () => {
          ann.note.color = c;
          noteEl.dataset.color = c;
          Array.from(row.querySelectorAll('.stickey-color-swatch')).forEach((x) => {
            x.dataset.active = x.dataset.color === c ? 'true' : 'false';
          });
          this._saveDebounced(ann);
          pop.style.display = 'none';
        });
        row.appendChild(sw);
      }

      pop.appendChild(title);
      pop.appendChild(row);

      const rect = buttonEl.getBoundingClientRect();
      pop.style.left = `${Math.max(8, rect.left + window.scrollX - 10)}px`;
      pop.style.top = `${Math.max(8, rect.bottom + window.scrollY + 8)}px`;
      pop.style.display = 'block';
    }

    openHighlightEditor(ann, anchorEl) {
      if (!ann?.highlight || !anchorEl) return;
      this.hideHover();
      this.ensurePopover();
      const pop = this.popover;
      pop.dataset.type = 'highlight';
      pop.textContent = '';

      const title = document.createElement('div');
      title.className = 'stickey-popover-title';
      title.textContent = 'Highlight';

      const row = this.colorRow(ann.highlight.color || 'yellow', (color) => {
        ann.highlight.color = color;
        const spans = this.renderedHighlights.get(ann.id) || [];
        spans.forEach((s) => (s.dataset.color = color));
        this._saveDebounced(ann);
      });

      const comment = document.createElement('textarea');
      comment.className = 'stickey-popover-textarea';
      comment.placeholder = 'Add a note…';
      comment.value = ann.highlight.comment || '';
      comment.addEventListener('input', () => {
        ann.highlight.comment = comment.value;
        this.updateTagsFromAnnotation(ann);
        this._saveDebounced(ann);
        this.renderList();
      });

      const actions = document.createElement('div');
      actions.className = 'stickey-popover-actions';

      const openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.className = 'stickey-btn';
      openBtn.textContent = 'Details';
      openBtn.addEventListener('click', () => {
        pop.style.display = 'none';
        this.setPanelOpen(true);
        this.selectAnnotation(ann.id);
      });

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'stickey-btn stickey-btn-primary';
      saveBtn.textContent = 'Save';
      saveBtn.addEventListener('click', async () => {
        await this.upsert(ann);
        pop.style.display = 'none';
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'stickey-btn';
      delBtn.textContent = 'Remove';
      delBtn.addEventListener('click', async () => {
        pop.style.display = 'none';
        await this.deleteAnnotation(ann.id);
      });

      actions.appendChild(openBtn);
      actions.appendChild(delBtn);
      actions.appendChild(saveBtn);

      pop.appendChild(title);
      pop.appendChild(row);
      pop.appendChild(comment);
      pop.appendChild(actions);

      const rect = anchorEl.getBoundingClientRect();
      pop.style.left = `${Math.max(8, rect.left + window.scrollX)}px`;
      pop.style.top = `${Math.max(8, rect.bottom + window.scrollY + 8)}px`;
      pop.style.display = 'block';
    }

    ensurePopover() {
      if (this.popover) return;
      const pop = document.createElement('div');
      pop.className = 'stickey-popover stickey-ui';
      pop.setAttribute('data-stickey-root', 'true');
      pop.style.display = 'none';
      document.body.appendChild(pop);
      document.addEventListener('mousedown', (e) => {
        if (pop.style.display !== 'block') return;
        if (e.target?.closest?.('.stickey-popover')) return;
        if (e.target?.closest?.('.stickey-icon-btn')) return;
        pop.style.display = 'none';
      }, true);
      this.popover = pop;
    }

    updateTagsFromAnnotation(ann) {
      if (ann.type === 'note') {
        ann.tags = utils.extractTags(`${ann.note?.title || ''} ${ann.note?.content || ''}`);
      } else if (ann.type === 'highlight') {
        ann.tags = utils.extractTags(`${ann.highlight?.exactText || ''} ${ann.highlight?.comment || ''}`);
      }
    }

    startLinkMode(forId) {
      const id = forId || this.selectedId;
      if (!id) return;
      this.linkModeForId = id;
      this.setPanelOpen(true);
      this.selectAnnotation(id);
    }

    stopLinkMode() {
      this.linkModeForId = null;
    }

    async toggleLink(a, b) {
      const annA = this.annotations.get(a);
      const linked = Boolean(annA?.linkedIds?.includes?.(b));
      await this.setLink(a, b, !linked);
      this.linkModeForId = null;
      this.renderList();
    }

    async setLink(idA, idB, linked) {
      await this.safeSendMessage({ action: 'stickey_setLink', idA, idB, linked });
      const a = this.annotations.get(idA);
      const b = this.annotations.get(idB);
      if (a) {
        a.linkedIds = Array.isArray(a.linkedIds) ? a.linkedIds : [];
        if (linked && !a.linkedIds.includes(idB)) a.linkedIds.push(idB);
        if (!linked) a.linkedIds = a.linkedIds.filter((x) => x !== idB);
      }
      if (b) {
        b.linkedIds = Array.isArray(b.linkedIds) ? b.linkedIds : [];
        if (linked && !b.linkedIds.includes(idA)) b.linkedIds.push(idA);
        if (!linked) b.linkedIds = b.linkedIds.filter((x) => x !== idA);
      }
    }

    async convertSelectedHighlightToNote() {
      const id = this.selectedId;
      const ann = id ? this.annotations.get(id) : null;
      if (!ann || ann.type !== 'highlight') return;
      const note = this.createNoteFromHighlight(ann);
      await this.upsert(note);
      await this.setLink(ann.id, note.id, true);
      await this.deleteAnnotation(ann.id);
      this.selectAnnotation(note.id);
      this.focusAnnotation(note.id);
      this.renderList();
    }

    async deleteSelected() {
      if (!this.selectedId) return;
      await this.deleteAnnotation(this.selectedId);
    }

    async deleteAnnotation(id) {
      await this.deleteAnnotationLocal(id);
      await this.safeSendMessage({ action: 'stickey_deleteAnnotation', id });
      this.renderList();
    }

    async deleteAnnotationLocal(id) {
      const ann = this.annotations.get(id);
      if (!ann) return;
      this.annotations.delete(id);
      for (const other of this.annotations.values()) {
        if (!Array.isArray(other.linkedIds)) continue;
        other.linkedIds = other.linkedIds.filter((x) => x !== id);
      }

      const spans = this.renderedHighlights.get(id);
      if (spans && spans.length) {
        spans.forEach((span) => {
          const parent = span.parentNode;
          if (!parent) return;
          parent.replaceChild(document.createTextNode(span.textContent), span);
          parent.normalize?.();
        });
        this.renderedHighlights.delete(id);
      }

      const noteEl = this.renderedNotes.get(id);
      if (noteEl) noteEl.remove();
      this.renderedNotes.delete(id);

      this.selectedId = null;
      this.stopLinkMode();
    }

    async upsert(annotation) {
      this.updateTagsFromAnnotation(annotation);
      await this.safeSendMessage({ action: 'stickey_upsertAnnotation', annotation });
    }
  }

  const engine = new StickeyEngine();
  engine.init().catch((err) => console.error('[Stickey] init error', err));
})();
