/* global Stickey */

(() => {
  const { el, svgIcon } = Stickey.dom;

  class NotesModule {
    constructor({ onDelete, onChange }) {
      this.onDelete = onDelete;
      this.onChange = onChange;
      this.rendered = new Map(); // id -> element
      this.drag = { id: null, startX: 0, startY: 0, originX: 0, originY: 0 };
    }

    installDragListeners(getAnnotationById) {
      document.addEventListener(
        'mousedown',
        (e) => {
          const header = e.target?.closest?.('.stickey-note-header');
          const note = e.target?.closest?.('.stickey-note');
          if (!note || !header) return;
          const id = note.dataset.id;
          const ann = getAnnotationById(id);
          if (!ann?.note) return;
          this.drag.id = id;
          this.drag.startX = e.clientX;
          this.drag.startY = e.clientY;
          this.drag.originX = ann.note.position.x;
          this.drag.originY = ann.note.position.y;
          e.preventDefault();
        },
        true
      );

      document.addEventListener(
        'mousemove',
        (e) => {
          if (!this.drag.id) return;
          const ann = getAnnotationById(this.drag.id);
          const elNote = this.rendered.get(this.drag.id);
          if (!ann?.note || !elNote) return;
          const dx = e.clientX - this.drag.startX;
          const dy = e.clientY - this.drag.startY;
          ann.note.position.x = this.drag.originX + dx;
          ann.note.position.y = this.drag.originY + dy;
          this.position(elNote, ann.note);
        },
        true
      );

      document.addEventListener(
        'mouseup',
        () => {
          if (!this.drag.id) return;
          const ann = getAnnotationById(this.drag.id);
          if (ann) this.onChange?.(ann);
          this.drag.id = null;
        },
        true
      );
    }

    renderNote(annotation) {
      if (!annotation?.note) return;
      if (this.rendered.has(annotation.id)) return;

      const root = el('div', { class: 'stickey-note stickey-ui', dataset: { id: annotation.id, stickeyRoot: 'true' } });
      root.style.width = `${annotation.note.size?.w || 320}px`;

      const titleInput = el('input', {
        class: 'stickey-note-title',
        type: 'text',
        placeholder: 'Untitled'
      });
      titleInput.value = annotation.note.title || '';
      titleInput.addEventListener('input', () => {
        annotation.note.title = titleInput.value;
        this.onChange?.(annotation);
      });

      const closeBtn = el('button', { class: 'stickey-icon-btn', type: 'button', title: 'Delete note' }, [svgIcon('close')]);
      closeBtn.addEventListener('click', () => this.onDelete?.(annotation.id));

      const header = el('div', { class: 'stickey-note-header' }, [
        el('div', { class: 'stickey-note-handle' }),
        titleInput,
        closeBtn
      ]);

      const textarea = el('textarea', { class: 'stickey-note-text', placeholder: 'Write… use #tags' });
      textarea.value = annotation.note.content || '';
      textarea.addEventListener('input', () => {
        annotation.note.content = textarea.value;
        this.onChange?.(annotation);
      });

      const body = el('div', { class: 'stickey-note-body' }, [textarea]);
      root.appendChild(header);
      root.appendChild(body);

      this.position(root, annotation.note);
      document.body.appendChild(root);
      this.rendered.set(annotation.id, root);
    }

    position(element, note) {
      element.style.left = `${note.position.x}px`;
      element.style.top = `${note.position.y}px`;
    }

    removeRendered(id) {
      const elNote = this.rendered.get(id);
      if (elNote) elNote.remove();
      this.rendered.delete(id);
    }

    getElement(id) {
      return this.rendered.get(id) || null;
    }
  }

  Stickey.modules ||= {};
  Stickey.modules.NotesModule = NotesModule;
})();

