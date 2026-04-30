/* global Stickey */

(() => {
  const { el, svgIcon } = Stickey.dom;

  class PanelUI {
    constructor({
      onToggle,
      onNewNote,
      onSelect,
      onDeleteSelected,
      onConvertSelected,
      onStartLinkMode,
      onAttachNote,
      onUpdateHighlightComment
    }) {
      this.onToggle = onToggle;
      this.onNewNote = onNewNote;
      this.onSelect = onSelect;
      this.onDeleteSelected = onDeleteSelected;
      this.onConvertSelected = onConvertSelected;
      this.onStartLinkMode = onStartLinkMode;
      this.onAttachNote = onAttachNote;
      this.onUpdateHighlightComment = onUpdateHighlightComment;

      this.selectedId = null;
      this.filterType = 'all';
      this.searchQuery = '';
      this.linkModeForId = null;

      this.root = el('div', { id: 'stickey-root', class: 'stickey-ui', dataset: { stickeyRoot: 'true' } });
      this.fab = el('button', { class: 'stickey-fab', type: 'button', title: 'Open Stickey panel', onclick: () => this.onToggle?.() }, [svgIcon('panel')]);

      this.panel = el('div', { class: 'stickey-panel', dataset: { open: 'false' } });
      const header = el('div', { class: 'stickey-panel-header' }, [
        el('div', { class: 'stickey-panel-title', text: 'Stickey' }),
        el('button', { class: 'stickey-icon-btn', type: 'button', title: 'New note', onclick: () => this.onNewNote?.() }, [svgIcon('note')]),
        el('button', { class: 'stickey-icon-btn', type: 'button', title: 'Close panel', onclick: () => this.setOpen(false) }, [svgIcon('close')])
      ]);

      const searchRow = el('div', { class: 'stickey-panel-search' }, [
        el('input', {
          class: 'stickey-input',
          type: 'text',
          placeholder: 'Search this page…',
          autocomplete: 'off',
          oninput: (e) => {
            this.searchQuery = e.target.value;
            this.onSearchChanged?.();
          }
        })
      ]);
      this.searchInput = searchRow.firstChild;

      const filters = el('div', { class: 'stickey-filters' }, [
        this._chip('All', 'all', true),
        this._chip('Notes', 'note', false),
        this._chip('Highlights', 'highlight', false)
      ]);

      this.detail = el('div', { class: 'stickey-detail', dataset: { open: 'false' } }, [
        el('div', { class: 'stickey-detail-title', text: '' }),
        el('div', { class: 'stickey-detail-sub', text: '' }),
        el('textarea', { class: 'stickey-textarea', placeholder: 'Add comment…', oninput: (e) => this.onUpdateHighlightComment?.(e.target.value) }),
        el('button', { class: 'stickey-btn', type: 'button', text: 'Attach note', onclick: () => this.onAttachNote?.() })
      ]);
      this.detailTitle = this.detail.children[0];
      this.detailSub = this.detail.children[1];
      this.detailComment = this.detail.children[2];
      this.detailAttach = this.detail.children[3];

      this.list = el('div', { class: 'stickey-list' });

      const footer = el('div', { class: 'stickey-panel-footer' }, [
        el('button', { class: 'stickey-btn', type: 'button', text: 'Link', onclick: () => this.onStartLinkMode?.() }),
        el('button', { class: 'stickey-btn', type: 'button', text: 'Convert', onclick: () => this.onConvertSelected?.() }),
        el('button', { class: 'stickey-btn stickey-btn-primary', type: 'button', text: 'Delete', onclick: () => this.onDeleteSelected?.() })
      ]);

      this.panel.appendChild(header);
      this.panel.appendChild(searchRow);
      this.panel.appendChild(filters);
      this.panel.appendChild(this.detail);
      this.panel.appendChild(this.list);
      this.panel.appendChild(footer);

      this.root.appendChild(this.fab);
      this.root.appendChild(this.panel);
    }

    mount() {
      document.documentElement.appendChild(this.root);
    }

    _chip(label, value, active) {
      const chip = el('button', { type: 'button', class: 'stickey-chip', dataset: { value, active: active ? 'true' : 'false' }, text: label });
      chip.addEventListener('click', () => {
        this.filterType = value;
        const chips = this.panel.querySelectorAll('.stickey-chip');
        chips.forEach((c) => (c.dataset.active = c.dataset.value === value ? 'true' : 'false'));
        this.onFilterChanged?.();
      });
      return chip;
    }

    isOpen() {
      return this.panel.dataset.open === 'true';
    }

    setOpen(open) {
      this.panel.dataset.open = open ? 'true' : 'false';
    }

    setSelection({ selectedId, linkModeForId }) {
      this.selectedId = selectedId;
      this.linkModeForId = linkModeForId;
    }

    renderList(annotations) {
      const q = String(this.searchQuery || '').trim().toLowerCase();
      this.list.textContent = '';

      const filtered = annotations
        .filter((ann) => (this.filterType === 'all' ? true : ann.type === this.filterType))
        .filter((ann) => {
          if (!q) return true;
          const hay = this._searchText(ann);
          return hay.includes(q);
        })
        .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));

      filtered.forEach((ann) => this.list.appendChild(this._item(ann)));

      const nodes = this.list.querySelectorAll('.stickey-item');
      nodes.forEach((n) => (n.dataset.selected = n.dataset.id === this.selectedId ? 'true' : 'false'));
    }

    _searchText(ann) {
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

    _item(ann) {
      const item = el('div', { class: 'stickey-item', dataset: { id: ann.id, selected: 'false' } });
      const row = el('div', { class: 'stickey-item-title' }, [
        el('span', { class: 'stickey-badge', text: ann.type === 'note' ? 'Note' : 'Highlight' }),
        el('span', { text: ann.type === 'note' ? (ann.note?.title || 'Untitled') : (ann.highlight?.exactText || 'Highlight').slice(0, 48) })
      ]);
      const snippet = el('div', {
        class: 'stickey-item-snippet',
        text:
          ann.type === 'note'
            ? String(ann.note?.content || '').slice(0, 140)
            : String(ann.highlight?.comment || ann.highlight?.exactText || '').slice(0, 140)
      });

      item.appendChild(row);
      item.appendChild(snippet);
      item.addEventListener('click', () => this.onSelect?.(ann.id));
      return item;
    }

    renderDetail(ann) {
      if (!ann) {
        this.detail.dataset.open = 'false';
        return;
      }
      this.detail.dataset.open = 'true';
      const linkCount = Array.isArray(ann.linkedIds) ? ann.linkedIds.length : 0;
      const tagsText = (ann.tags || []).slice(0, 6).map((t) => `#${t}`).join(' ') || 'none';

      if (ann.type === 'highlight') {
        this.detailTitle.textContent = 'Highlight';
        this.detailSub.textContent = `Links: ${linkCount} · Tags: ${tagsText}`;
        this.detailComment.disabled = false;
        this.detailComment.value = ann.highlight?.comment || '';
        this.detailAttach.style.display = 'inline-block';
        this.detailAttach.disabled = false;
      } else {
        this.detailTitle.textContent = 'Note';
        this.detailSub.textContent = `Links: ${linkCount} · Tags: ${tagsText}`;
        this.detailComment.value = '';
        this.detailComment.disabled = true;
        this.detailAttach.style.display = 'none';
        this.detailAttach.disabled = true;
      }
    }
  }

  Stickey.ui ||= {};
  Stickey.ui.PanelUI = PanelUI;
})();

