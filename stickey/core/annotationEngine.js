/* global Stickey */

(() => {
  if (!location.protocol.startsWith('http')) return;
  if (window.__stickeyLoaded) return;
  window.__stickeyLoaded = true;

  const utils = Stickey.utils;
  const { debounce } = Stickey.timing;
  const storage = Stickey.services.storage;

  class AnnotationEngine {
    constructor() {
      this.pageUrl = location.href;
      this.pageKey = utils.getPageKeyFromUrl(this.pageUrl);
      this.settings = { highlightColor: 'yellow', toolbarOnSelection: true, showHoverCard: true };

      this.annotations = new Map(); // id -> annotation
      this.selectedId = null;
      this.linkModeForId = null;

      this.panel = null;
      this.toolbar = null;
      this.hovercard = null;
      this.highlights = null;
      this.notes = null;

      this._saveDebounced = debounce((annotation) => this._upsertNow(annotation), 300);
      this._restoreDebounced = debounce(() => this.highlights.restoreMissing(this.annotations), 650);
    }

    async init() {
      this.hovercard = new Stickey.ui.HovercardUI();
      this.panel = new Stickey.ui.PanelUI({
        onToggle: () => this.togglePanel(),
        onNewNote: () => this.createFloatingNote(),
        onSelect: (id) => this.handlePanelSelect(id),
        onDeleteSelected: () => this.deleteSelected(),
        onConvertSelected: () => this.convertSelectedHighlightToNote(),
        onStartLinkMode: () => this.startLinkMode(),
        onAttachNote: () => this.attachNoteToSelectedHighlight(),
        onUpdateHighlightComment: (text) => this.updateSelectedHighlightComment(text)
      });
      this.panel.onSearchChanged = () => this.renderPanel();
      this.panel.onFilterChanged = () => this.renderPanel();
      this.panel.mount();
      this.hovercard.mount(this.panel.root);

      this.toolbar = new Stickey.ui.SelectionToolbarUI({
        onHighlight: () => this.createHighlightFromSelection({ alsoNote: false, startLinkMode: false }),
        onNote: () => this.createHighlightFromSelection({ alsoNote: true, startLinkMode: false }),
        onLink: () => this.createHighlightFromSelection({ alsoNote: true, startLinkMode: true })
      });
      this.toolbar.mount(this.panel.root);

      this.highlights = new Stickey.modules.HighlightsModule({
        isInStickeyUI: (node) => this.isInStickeyUI(node),
        hovercard: this.settings.showHoverCard ? this.hovercard : null,
        onSelectHighlight: (id) => this.selectAnnotation(id, { openPanel: true })
      });
      this.notes = new Stickey.modules.NotesModule({
        onDelete: (id) => this.deleteAnnotation(id),
        onChange: (ann) => this.onAnnotationChanged(ann)
      });

      this.notes.installDragListeners((id) => this.annotations.get(id));

      await this.loadSettings();
      await this.loadPageAnnotations();
      this.renderAll();
      this.installListeners();
      this.installObserver();
    }

    isInStickeyUI(node) {
      const el = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
      return Boolean(el?.closest?.('#stickey-root,[data-stickey-root="true"]'));
    }

    async loadSettings() {
      const settings = await storage.getSettings();
      if (settings) this.settings = { ...this.settings, ...settings };
    }

    async loadPageAnnotations() {
      const resp = await storage.getAnnotationsForPage(this.pageUrl);
      const annotations = resp?.annotations || {};
      Object.entries(annotations).forEach(([id, ann]) => this.annotations.set(id, ann));
      if (resp?.pageKey) this.pageKey = resp.pageKey;
    }

    installListeners() {
      chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        this.onMessage(msg)
          .then((res) => sendResponse(res))
          .catch(() => sendResponse({ success: false }));
        return true;
      });

      document.addEventListener('mouseup', () => this.maybeShowToolbar(), true);
      document.addEventListener(
        'keyup',
        (e) => {
          if (e.key === 'Escape') {
            this.toolbar.hide();
            this.panel.setOpen(false);
            this.stopLinkMode();
          }
          this.maybeShowToolbar();
        },
        true
      );
      window.addEventListener('scroll', () => this.toolbar.hide(), { passive: true });
      window.addEventListener('resize', () => this.toolbar.hide(), { passive: true });
    }

    installObserver() {
      const obs = new MutationObserver(() => this._restoreDebounced());
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
      const open = this.panel.isOpen();
      this.panel.setOpen(!open);
      if (!open) this.renderPanel();
    }

    renderAll() {
      for (const ann of this.annotations.values()) {
        if (ann.type === 'highlight') this.highlights.renderHighlight(ann);
        if (ann.type === 'note') this.notes.renderNote(ann);
      }
      this.renderPanel();
    }

    renderPanel() {
      if (!this.panel.isOpen()) return;
      this.panel.setSelection({ selectedId: this.selectedId, linkModeForId: this.linkModeForId });
      this.panel.renderList(Array.from(this.annotations.values()));
      this.panel.renderDetail(this.selectedId ? this.annotations.get(this.selectedId) : null);
    }

    handlePanelSelect(id) {
      if (this.linkModeForId && this.linkModeForId !== id) {
        this.toggleLink(this.linkModeForId, id);
        return;
      }
      this.selectAnnotation(id, { openPanel: true });
      this.focusAnnotation(id);
    }

    selectAnnotation(id, { openPanel }) {
      this.selectedId = id;
      if (openPanel) this.panel.setOpen(true);
      this.renderSelectionIndicators();
      this.renderPanel();
    }

    renderSelectionIndicators() {
      for (const [id, spans] of this.highlights.rendered.entries()) {
        spans.forEach((s) => (s.dataset.selected = id === this.selectedId ? 'true' : 'false'));
      }
      for (const [id, el] of this.notes.rendered.entries()) {
        el.dataset.selected = id === this.selectedId ? 'true' : 'false';
      }
    }

    focusAnnotation(id) {
      const ann = this.annotations.get(id);
      if (!ann) return;
      if (ann.type === 'note') {
        const el = this.notes.getElement(id);
        if (!el) return;
        el.classList.remove('stickey-flash');
        el.getBoundingClientRect();
        el.classList.add('stickey-flash');
        el.scrollIntoView?.({ block: 'center', inline: 'nearest' });
        return;
      }
      const first = this.highlights.getFirstSpan(id);
      if (!first) return;
      first.classList.remove('stickey-flash');
      first.getBoundingClientRect();
      first.classList.add('stickey-flash');
      first.scrollIntoView?.({ block: 'center', inline: 'nearest' });
    }

    maybeShowToolbar() {
      if (!this.settings.toolbarOnSelection) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return this.toolbar.hide();
      if (utils.isEditableTarget(sel.anchorNode)) return this.toolbar.hide();
      const range = sel.rangeCount ? sel.getRangeAt(0) : null;
      if (!range || range.collapsed) return this.toolbar.hide();

      const text = sel.toString().trim();
      if (!text) return this.toolbar.hide();

      const rect = range.getBoundingClientRect();
      if (!rect || rect.width < 1 || rect.height < 1) return this.toolbar.hide();

      const left = Math.max(8, rect.left + window.scrollX);
      const top = Math.max(8, rect.top + window.scrollY - 44);
      this.toolbar.showAt({ left, top });
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
      const selectors = this.highlights.serializeRange(range);

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
      await this._upsertNow(highlight);
      this.highlights.renderHighlight(highlight);
      this.selectAnnotation(highlightId, { openPanel: true });

      if (alsoNote) {
        const note = this.createNoteFromHighlight(highlight);
        await this._upsertNow(note);
        await this.setLink(highlightId, note.id, true);
        if (startLinkMode) this.startLinkMode(highlightId);
      }

      selection.removeAllRanges?.();
      this.toolbar.hide();
      this.renderPanel();
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
      this._saveDebounced(note);
      this.notes.renderNote(note);
      this.selectAnnotation(id, { openPanel: true });
      this.focusAnnotation(id);
      this.renderPanel();
      return note;
    }

    createNoteFromHighlight(highlightAnn) {
      const rect = this.highlights.getFirstSpan(highlightAnn.id)?.getBoundingClientRect();
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
      this.notes.renderNote(note);
      return note;
    }

    onAnnotationChanged(annotation) {
      this.updateTags(annotation);
      this._saveDebounced(annotation);
      this.renderPanel();
    }

    updateTags(annotation) {
      if (annotation.type === 'note') {
        annotation.tags = utils.extractTags(`${annotation.note?.title || ''} ${annotation.note?.content || ''}`);
      } else if (annotation.type === 'highlight') {
        annotation.tags = utils.extractTags(`${annotation.highlight?.exactText || ''} ${annotation.highlight?.comment || ''}`);
      }
      annotation.updatedAt = utils.nowIso();
    }

    async _upsertNow(annotation) {
      this.updateTags(annotation);
      await storage.upsertAnnotation(annotation);
    }

    updateSelectedHighlightComment(text) {
      const id = this.selectedId;
      const ann = id ? this.annotations.get(id) : null;
      if (!ann || ann.type !== 'highlight') return;
      ann.highlight.comment = String(text || '');
      this.onAnnotationChanged(ann);
    }

    async attachNoteToSelectedHighlight() {
      const id = this.selectedId;
      const ann = id ? this.annotations.get(id) : null;
      if (!ann || ann.type !== 'highlight') return;
      const note = this.createNoteFromHighlight(ann);
      await this._upsertNow(note);
      await this.setLink(ann.id, note.id, true);
      this.selectAnnotation(note.id, { openPanel: true });
      this.focusAnnotation(note.id);
      this.renderPanel();
    }

    startLinkMode(forId) {
      const id = forId || this.selectedId;
      if (!id) return;
      this.linkModeForId = id;
      this.panel.setOpen(true);
      this.renderPanel();
    }

    stopLinkMode() {
      this.linkModeForId = null;
      this.renderPanel();
    }

    async toggleLink(a, b) {
      const annA = this.annotations.get(a);
      const linked = Boolean(annA?.linkedIds?.includes?.(b));
      await this.setLink(a, b, !linked);
      this.linkModeForId = null;
      this.renderPanel();
    }

    async setLink(idA, idB, linked) {
      await storage.setLink(idA, idB, linked);
      const a = this.annotations.get(idA);
      const b = this.annotations.get(idB);
      if (a) {
        a.linkedIds = Array.isArray(a.linkedIds) ? a.linkedIds : [];
        if (linked && !a.linkedIds.includes(idB)) a.linkedIds.push(idB);
        if (!linked) a.linkedIds = a.linkedIds.filter((x) => x !== idB);
        a.updatedAt = utils.nowIso();
        this._saveDebounced(a);
      }
      if (b) {
        b.linkedIds = Array.isArray(b.linkedIds) ? b.linkedIds : [];
        if (linked && !b.linkedIds.includes(idA)) b.linkedIds.push(idA);
        if (!linked) b.linkedIds = b.linkedIds.filter((x) => x !== idA);
        b.updatedAt = utils.nowIso();
        this._saveDebounced(b);
      }
    }

    async convertSelectedHighlightToNote() {
      const id = this.selectedId;
      const ann = id ? this.annotations.get(id) : null;
      if (!ann || ann.type !== 'highlight') return;
      const note = this.createNoteFromHighlight(ann);
      await this._upsertNow(note);
      await this.setLink(ann.id, note.id, true);
      await this.deleteAnnotation(ann.id);
      this.selectAnnotation(note.id, { openPanel: true });
      this.focusAnnotation(note.id);
      this.renderPanel();
    }

    async deleteSelected() {
      if (!this.selectedId) return;
      await this.deleteAnnotation(this.selectedId);
    }

    async deleteAnnotation(id) {
      const ann = this.annotations.get(id);
      if (!ann) return;

      this.annotations.delete(id);
      for (const other of this.annotations.values()) {
        if (!Array.isArray(other.linkedIds)) continue;
        other.linkedIds = other.linkedIds.filter((x) => x !== id);
      }

      if (ann.type === 'highlight') this.highlights.removeRendered(id);
      if (ann.type === 'note') this.notes.removeRendered(id);

      if (this.selectedId === id) this.selectedId = null;
      if (this.linkModeForId === id) this.linkModeForId = null;
      this.renderPanel();

      await storage.deleteAnnotation(id);
    }
  }

  Stickey.core ||= {};
  Stickey.core.AnnotationEngine = AnnotationEngine;
})();

