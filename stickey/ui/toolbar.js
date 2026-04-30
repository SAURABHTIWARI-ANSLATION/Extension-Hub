/* global Stickey */

(() => {
  const { el } = Stickey.dom;

  class SelectionToolbarUI {
    constructor({ onHighlight, onNote, onLink }) {
      this.onHighlight = onHighlight;
      this.onNote = onNote;
      this.onLink = onLink;
      this.root = el('div', { class: 'stickey-toolbar', dataset: { open: 'false', stickeyRoot: 'true' } }, [
        this._btn('Highlight', () => this.onHighlight?.()),
        this._btn('Note', () => this.onNote?.()),
        this._btn('Link', () => this.onLink?.())
      ]);
      this.root.setAttribute('aria-hidden', 'true');
    }

    _btn(label, onClick) {
      return el('button', { type: 'button', class: 'stickey-btn', text: label, onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }});
    }

    mount(container) {
      container.appendChild(this.root);
    }

    showAt({ left, top }) {
      this.root.style.left = `${left}px`;
      this.root.style.top = `${top}px`;
      this.root.dataset.open = 'true';
      this.root.setAttribute('aria-hidden', 'false');
    }

    hide() {
      this.root.dataset.open = 'false';
      this.root.setAttribute('aria-hidden', 'true');
    }
  }

  Stickey.ui ||= {};
  Stickey.ui.SelectionToolbarUI = SelectionToolbarUI;
})();

