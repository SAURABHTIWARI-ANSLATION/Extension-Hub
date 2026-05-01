/* global Stickey */

(() => {
  const utils = Stickey.utils;

  class HighlightsModule {
    constructor({ isInStickeyUI, hovercard, onSelectHighlight }) {
      this.isInStickeyUI = isInStickeyUI;
      this.hovercard = hovercard;
      this.onSelectHighlight = onSelectHighlight;

      this.rendered = new Map(); // id -> span[]
    }

    serializeRange(range) {
      return {
        startXPath: utils.xpathForNode(range.startContainer),
        startOffset: range.startOffset,
        endXPath: utils.xpathForNode(range.endContainer),
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

    renderHighlight(annotation) {
      if (!annotation?.highlight) return;
      if (this.rendered.has(annotation.id)) return;
      const range = this.buildRangeFromSelectors(annotation.highlight.selectors);
      const wrapped = range ? this._wrapRange(range, annotation) : this._wrapBySearchingText(annotation);
      if (!wrapped || wrapped.length === 0) return;
      this.rendered.set(annotation.id, wrapped);
    }

    restoreMissing(annotations) {
      for (const ann of annotations.values()) {
        if (ann.type !== 'highlight') continue;
        if (this.rendered.has(ann.id)) continue;
        this.renderHighlight(ann);
      }
    }

    removeRendered(id) {
      const spans = this.rendered.get(id);
      if (!spans || spans.length === 0) return;
      spans.forEach((span) => {
        const parent = span.parentNode;
        if (!parent) return;
        parent.replaceChild(document.createTextNode(span.textContent), span);
        parent.normalize?.();
      });
      this.rendered.delete(id);
    }

    getFirstSpan(id) {
      return this.rendered.get(id)?.[0] || null;
    }

    _wrapBySearchingText(annotation) {
      const text = String(annotation.highlight?.exactText || '').trim();
      if (!text || text.length < 3) return [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walker.nextNode())) {
        if (this.isInStickeyUI(node)) continue;
        const idx = node.textContent.indexOf(text);
        if (idx !== -1) {
          const range = document.createRange();
          range.setStart(node, idx);
          range.setEnd(node, idx + text.length);
          const wrapped = this._wrapRange(range, annotation);
          if (wrapped.length > 0) return wrapped;
        }
      }
      return [];
    }

    _wrapRange(range, annotation) {
      const spans = [];
      const color = annotation.highlight?.color || 'yellow';

      const common =
        range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
          ? range.commonAncestorContainer
          : range.commonAncestorContainer.parentElement;
      if (!common) return [];

      const walker = document.createTreeWalker(common, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (!node || !node.textContent) return NodeFilter.FILTER_REJECT;
          if (this.isInStickeyUI(node)) return NodeFilter.FILTER_REJECT;
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
        span.dataset.id = annotation.id;
        span.dataset.color = color;
        span.textContent = target.textContent;

        span.addEventListener('mouseenter', () => {
          const rect = span.getBoundingClientRect();
          const left = Math.max(8, rect.left + window.scrollX);
          const top = Math.max(8, rect.bottom + window.scrollY + 8);
          const comment = String(annotation.highlight?.comment || '').trim();
          this.hovercard?.showAt({ left, top }, { title: 'Highlight', text: comment || String(annotation.highlight?.exactText || '').slice(0, 160) });
        });
        span.addEventListener('mouseleave', () => this.hovercard?.hide());
        span.addEventListener(
          'click',
          (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.onSelectHighlight?.(annotation.id);
          },
          true
        );

        const parent = target.parentNode;
        parent.replaceChild(span, target);
        spans.push(span);
      }
      return spans;
    }
  }

  Stickey.modules ||= {};
  Stickey.modules.HighlightsModule = HighlightsModule;
})();

