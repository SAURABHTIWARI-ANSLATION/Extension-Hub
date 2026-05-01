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
      t = setTimeout(() => fn(...args), ms);
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

      this.root = null;
      this.panel = null;
      this.list = null;
      this.searchInput = null;
      this.hovercard = null;
      this.toolbar = null;
      this.toolbarRange = null;
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

      const hlBtn = this.toolbarButton('Highlight', () => this.highlightFromToolbar(false));
      const noteBtn = this.toolbarButton('Note', () => this.highlightFromToolbar(true));
      const linkSelBtn = this.toolbarButton('Link', () => this.highlightFromToolbar(true, true));

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

    icon(name) {
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 16 16');
      svg.setAttribute('width', '16');
      svg.setAttribute('height', '16');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '1.6');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('aria-hidden', 'true');

      const p = (d) => {
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', d);
        svg.appendChild(path);
      };
      const line = (x1, y1, x2, y2) => {
        const l = document.createElementNS(ns, 'line');
        l.setAttribute('x1', String(x1)); l.setAttribute('y1', String(y1));
        l.setAttribute('x2', String(x2)); l.setAttribute('y2', String(y2));
        svg.appendChild(l);
      };
      const rect = (x, y, w, h, rx) => {
        const r = document.createElementNS(ns, 'rect');
        r.setAttribute('x', x); r.setAttribute('y', y);
        r.setAttribute('width', w); r.setAttribute('height', h);
        if (rx) r.setAttribute('rx', rx);
        svg.appendChild(r);
      };

      if (name === 'panel') { rect(2, 2, 12, 12, 2); line(2, 6, 14, 6); }
      else if (name === 'note') { rect(4, 2, 8, 12, 1.5); line(6, 5.5, 10, 5.5); line(6, 8, 9, 8); }
      else if (name === 'close') { p('M4 4l8 8 M12 4L4 12'); }
      else if (name === 'link') { p('M6.5 8a1.5 1.5 0 0 1 1.5-1.5H11a1.5 1.5 0 0 1 0 3H8A1.5 1.5 0 0 1 6.5 8z'); p('M9.5 8a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1 0-3h3A1.5 1.5 0 0 1 9.5 8z'); }
      else { line(8, 3, 8, 13); line(3, 8, 13, 8); }
      return svg;
    }

    async loadSettings() {
      const resp = await chrome.runtime.sendMessage({ action: 'stickey_getSettings' });
      if (resp?.settings) this.settings = resp.settings;
    }

    async loadPageAnnotations() {
      const resp = await chrome.runtime.sendMessage({
        action: 'stickey_getAnnotationsForPage',
        pageUrl: this.pageUrl,
        pageTitle: document.title
      });
      const annotations = resp?.annotations || {};
      Object.entries(annotations).forEach(([id, ann]) => this.annotations.set(id, ann));
      if (resp?.pageKey) this.pageKey = resp.pageKey;
    }

    installListeners() {
      chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        this.onMessage(msg).then((res) => sendResponse(res)).catch(() => sendResponse({ success: false }));
        return true;
      });

      document.addEventListener('mousedown', (e) => {
        const note = e.target?.closest?.('.stickey-note');
        const header = e.target?.closest?.('.stickey-note-header');
        if (!note || !header) return;
        const id = note.dataset.id;
        const ann = this.annotations.get(id);
        if (!ann?.note) return;
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
      obs.observe(document.body, { subtree: true, childList: true, characterData: true });
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
      title.textContent = ann.type === 'note' ? (ann.note?.title || 'Untitled') : (ann.highlight?.exactText || 'Highlight').slice(0, 48);

      row.appendChild(badge);
      row.appendChild(title);

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
      this.selectedId = id;
      const nodes = this.list.querySelectorAll('.stickey-item');
      nodes.forEach((n) => {
        n.dataset.selected = n.dataset.id === id ? 'true' : 'false';
      });
      this.renderDetail();
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
      for (const ann of this.annotations.values()) {
        if (ann.type !== 'highlight') continue;
        if (this.renderedHighlights.has(ann.id)) continue;
        this.renderHighlight(ann);
      }
    }

    wrapBySearchingText(ann) {
      const text = String(ann.highlight?.exactText || '').trim();
      if (!text || text.length < 3) return [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walker.nextNode())) {
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
          this.setPanelOpen(true);
          this.selectAnnotation(ann.id);
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
          anchorId: null
        }
      };
      this.annotations.set(id, note);
      this.upsert(note);
      this.renderNote(note);
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
          anchorId: highlightAnn.id
        }
      };
      this.annotations.set(id, note);
      this.renderNote(note);
      return note;
    }

    renderNote(ann) {
      if (!ann?.note) return;
      if (this.renderedNotes.has(ann.id)) return;

      const el = document.createElement('div');
      el.className = 'stickey-note stickey-ui';
      el.dataset.id = ann.id;
      el.setAttribute('data-stickey-root', 'true');
      el.style.width = `${ann.note.size?.w || 320}px`;

      const header = document.createElement('div');
      header.className = 'stickey-note-header';
      const handle = document.createElement('div');
      handle.className = 'stickey-note-handle';
      const title = document.createElement('input');
      title.className = 'stickey-note-title';
      title.type = 'text';
      title.placeholder = 'Untitled';
      title.value = ann.note.title || '';
      title.addEventListener('input', () => {
        ann.note.title = title.value;
        this.updateTagsFromAnnotation(ann);
        this._saveDebounced(ann);
        this.renderList();
      });

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'stickey-icon-btn';
      closeBtn.title = 'Delete note';
      closeBtn.appendChild(this.icon('close'));
      closeBtn.addEventListener('click', () => this.deleteAnnotation(ann.id));

      header.appendChild(handle);
      header.appendChild(title);
      header.appendChild(closeBtn);

      const body = document.createElement('div');
      body.className = 'stickey-note-body';
      const textarea = document.createElement('textarea');
      textarea.className = 'stickey-note-text';
      textarea.placeholder = 'Write… use #tags';
      textarea.value = ann.note.content || '';
      textarea.addEventListener('input', () => {
        ann.note.content = textarea.value;
        this.updateTagsFromAnnotation(ann);
        this._saveDebounced(ann);
        this.renderList();
      });
      body.appendChild(textarea);

      el.appendChild(header);
      el.appendChild(body);
      this.positionNoteElement(el, ann.note);
      document.body.appendChild(el);

      this.renderedNotes.set(ann.id, el);
    }

    positionNoteElement(el, note) {
      el.style.left = `${note.position.x}px`;
      el.style.top = `${note.position.y}px`;
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
      await chrome.runtime.sendMessage({ action: 'stickey_setLink', idA, idB, linked });
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
      await chrome.runtime.sendMessage({ action: 'stickey_deleteAnnotation', id });
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
      await chrome.runtime.sendMessage({ action: 'stickey_upsertAnnotation', annotation });
    }
  }

  const engine = new StickeyEngine();
  engine.init().catch((err) => console.error('[Stickey] init error', err));
})();
