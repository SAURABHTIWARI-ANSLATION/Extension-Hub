/* global Stickey */

(() => {
  const { el } = Stickey.dom;

  class HovercardUI {
    constructor() {
      this.root = el('div', { class: 'stickey-hovercard', dataset: { stickeyRoot: 'true' } }, [
        el('div', { class: 'stickey-hovercard-title', text: 'Highlight' }),
        el('div', { class: 'stickey-hovercard-text', text: '' })
      ]);
      this.titleEl = this.root.firstChild;
      this.textEl = this.root.lastChild;
      this.root.style.display = 'none';
    }

    mount(container) {
      container.appendChild(this.root);
    }

    showAt({ left, top }, { title, text }) {
      this.titleEl.textContent = title || '';
      this.textEl.textContent = text || '';
      this.root.style.left = `${left}px`;
      this.root.style.top = `${top}px`;
      this.root.style.display = 'block';
    }

    hide() {
      this.root.style.display = 'none';
    }
  }

  Stickey.ui ||= {};
  Stickey.ui.HovercardUI = HovercardUI;
})();

