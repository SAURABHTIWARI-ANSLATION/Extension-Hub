
(function () {
  'use strict';

  /* ─── Class name constants ───────────────────────────────── */
  var WRAP    = 'bg-dropdown';
  var MENU    = 'bg-menu';
  var ITEM    = 'bg-item';
  var OPEN    = 'bg-open';
  var ACTIVE  = 'bg-active';
  var VISIBLE = 'bg-vis';

  /* ─── 1. Position menu (geometry only — not design styles) ── */
  function positionMenu(trigger, menu) {
    var rect = trigger.getBoundingClientRect();
    var vp   = window.innerHeight || document.documentElement.clientHeight;
    var mH   = 220;

    menu.style.width = rect.width + 'px';
    menu.style.left  = rect.left  + 'px';

    if (rect.bottom + mH + 8 <= vp) {
      menu.style.top    = (rect.bottom + 4) + 'px';
      menu.style.bottom = 'auto';
    } else {
      menu.style.bottom = (vp - rect.top + 4) + 'px';
      menu.style.top    = 'auto';
    }
  }

  /* ─── 2. Get display text for selected option ────────────── */
  function getSelectedText(select) {
    var opt = select.options[select.selectedIndex];
    return opt ? opt.text : '';
  }

  /* ─── 3. Build one custom dropdown ──────────────────────── */
  function buildDropdown(select) {
    if (!select || select._bgBuilt) return null;
    select._bgBuilt = true;

    /* ── Wrapper ── */
    var wrap = document.createElement('div');
    wrap.className = WRAP;

    /* ── Trigger button ── */
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'bg-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    var triggerText = document.createElement('span');
    triggerText.className   = 'bg-trigger-text';
    triggerText.textContent = getSelectedText(select);

    var caret = document.createElement('span');
    caret.className = 'bg-caret';

    var caretSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    caretSvg.setAttribute('width',  '14');
    caretSvg.setAttribute('height', '14');
    caretSvg.setAttribute('viewBox', '0 0 24 24');
    caretSvg.setAttribute('fill', 'none');
    caretSvg.setAttribute('stroke', 'currentColor');
    caretSvg.setAttribute('stroke-width', '2.5');
    caretSvg.setAttribute('stroke-linecap', 'round');
    caretSvg.setAttribute('stroke-linejoin', 'round');
    var polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', '6 9 12 15 18 9');
    caretSvg.appendChild(polyline);
    caret.appendChild(caretSvg);

    trigger.appendChild(triggerText);
    trigger.appendChild(caret);

    /* ── Menu (appended to body for proper z-index layering) ── */
    var menu = document.createElement('div');
    menu.className = MENU;
    menu.setAttribute('role', 'listbox');
    document.body.appendChild(menu);
    menu._ownerWrap = wrap;

    /* ── Search input (shown for 5+ options) ── */
    var searchInput = null;
    if (select.options.length >= 5) {
      var searchWrap = document.createElement('div');
      searchWrap.className = 'bg-search-wrap';

      var searchIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      searchIcon.setAttribute('class', 'bg-search-icon');
      searchIcon.setAttribute('width', '12');
      searchIcon.setAttribute('height', '12');
      searchIcon.setAttribute('viewBox', '0 0 24 24');
      searchIcon.setAttribute('fill', 'none');
      searchIcon.setAttribute('stroke', 'currentColor');
      searchIcon.setAttribute('stroke-width', '2.5');
      searchIcon.setAttribute('stroke-linecap', 'round');
      searchIcon.setAttribute('stroke-linejoin', 'round');
      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '11');
      circle.setAttribute('cy', '11');
      circle.setAttribute('r', '8');
      var searchLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      searchLine.setAttribute('d', 'm21 21-4.35-4.35');
      searchIcon.appendChild(circle);
      searchIcon.appendChild(searchLine);

      searchInput = document.createElement('input');
      searchInput.type         = 'text';
      searchInput.className    = 'bg-search';
      searchInput.placeholder  = 'Search…';
      searchInput.autocomplete = 'off';
      searchInput.spellcheck   = false;

      searchWrap.appendChild(searchIcon);
      searchWrap.appendChild(searchInput);
      menu.appendChild(searchWrap);
    }

    /* ── List container ── */
    var listWrap = document.createElement('div');
    listWrap.className = 'bg-list';
    menu.appendChild(listWrap);

    /* ── Populate items ── */
    function populate(filter) {
      listWrap.replaceChildren();
      var q = (filter || '').toLowerCase().trim();
      var count = 0;

      Array.from(select.options).forEach(function (opt) {
        if (q && opt.text.toLowerCase().indexOf(q) === -1) return;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = ITEM;
        btn.dataset.val = opt.value;
        btn.setAttribute('role', 'option');
        btn.setAttribute('aria-selected', opt.value === select.value ? 'true' : 'false');

        var lbl = document.createElement('span');
        lbl.className   = 'bg-item-label';
        lbl.textContent = opt.text;

        var chk = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        chk.setAttribute('class', 'bg-item-check');
        chk.setAttribute('width', '13');
        chk.setAttribute('height', '13');
        chk.setAttribute('viewBox', '0 0 24 24');
        chk.setAttribute('fill', 'none');
        chk.setAttribute('stroke', 'currentColor');
        chk.setAttribute('stroke-width', '2.5');
        chk.setAttribute('stroke-linecap', 'round');
        chk.setAttribute('stroke-linejoin', 'round');
        var tick = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        tick.setAttribute('points', '20 6 9 17 4 12');
        chk.appendChild(tick);

        btn.appendChild(lbl);
        btn.appendChild(chk);

        if (opt.value === select.value) btn.classList.add(ACTIVE);

        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          select.value = opt.value;
          triggerText.textContent = opt.text;
          listWrap.querySelectorAll('.' + ITEM).forEach(function (i) {
            i.classList.remove(ACTIVE);
            i.setAttribute('aria-selected', 'false');
          });
          btn.classList.add(ACTIVE);
          btn.setAttribute('aria-selected', 'true');
          closeMenu();
          select.dispatchEvent(new Event('change', { bubbles: true }));
        });

        listWrap.appendChild(btn);
        count++;
      });

      if (count === 0) {
        var empty = document.createElement('div');
        empty.className   = 'bg-empty';
        empty.textContent = 'No results';
        listWrap.appendChild(empty);
      }
    }

    populate();

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        populate(searchInput.value);
      });
    }

    /* ─── Open / Close ─── */
    var isOpen = false;

    function openMenu() {
      /* Close any other open dropdown first */
      document.querySelectorAll('.' + MENU + '.' + VISIBLE).forEach(function (m) {
        if (m !== menu) {
          m.classList.remove(VISIBLE);
          if (m._ownerWrap) m._ownerWrap.classList.remove(OPEN);
        }
      });

      isOpen = true;
      positionMenu(trigger, menu);
      menu.classList.add(VISIBLE);
      wrap.classList.add(OPEN);
      trigger.setAttribute('aria-expanded', 'true');

      /* Scroll active item into view */
      var activeItem = listWrap.querySelector('.' + ITEM + '.' + ACTIVE);
      if (activeItem) {
        setTimeout(function () {
          activeItem.scrollIntoView({ block: 'nearest' });
        }, 20);
      }

      /* Focus search or first item */
      if (searchInput) {
        searchInput.value = '';
        populate();
        setTimeout(function () { searchInput.focus(); }, 30);
      } else {
        var first = listWrap.querySelector('.' + ITEM);
        if (first) setTimeout(function () { first.focus(); }, 20);
      }
    }

    function closeMenu() {
      isOpen = false;
      menu.classList.remove(VISIBLE);
      wrap.classList.remove(OPEN);
      trigger.setAttribute('aria-expanded', 'false');
    }

    /* ─── Events ─── */
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      isOpen ? closeMenu() : openMenu();
    });

    document.addEventListener('click', function (e) {
      if (isOpen && !wrap.contains(e.target) && !menu.contains(e.target)) {
        closeMenu();
      }
    });

    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isOpen) openMenu();
      } else if (e.key === 'Escape') {
        closeMenu();
        trigger.focus();
      }
    });

    menu.addEventListener('keydown', function (e) {
      var items = Array.from(listWrap.querySelectorAll('.' + ITEM));
      var focused = document.activeElement;
      var idx = items.indexOf(focused);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (idx < items.length - 1) items[idx + 1].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (idx > 0) items[idx - 1].focus();
        else if (searchInput) searchInput.focus();
      } else if (e.key === 'Escape') {
        closeMenu();
        trigger.focus();
      }
    });

    window.addEventListener('scroll', function () {
      if (isOpen) positionMenu(trigger, menu);
    }, { passive: true });

    window.addEventListener('resize', function () {
      if (isOpen) positionMenu(trigger, menu);
    }, { passive: true });

    /* ─── Observe external changes to <select> ─── */
    var observer = new MutationObserver(function () {
      populate(searchInput ? searchInput.value : '');
      triggerText.textContent = getSelectedText(select);
    });
    observer.observe(select, {
      childList:       true,
      subtree:         true,
      attributes:      true,
      attributeFilter: ['value'],
    });

    /* ─── Public sync method ─── */
    wrap._sync = function () {
      triggerText.textContent = getSelectedText(select);
      populate();
    };

    /* ─── Insert wrapper into DOM ─── */
    wrap.appendChild(trigger);
    select.classList.add('bg-select-hidden');
    select.parentNode.insertBefore(wrap, select.nextSibling);

    return wrap;
  }

  /* ─── 4. Init all <select> elements ─────────────────────── */
  function init() {
    document.querySelectorAll('select').forEach(function (s) {
      buildDropdown(s);
    });
  }

  /* ─── 5. Public API ──────────────────────────────────────── */
  window.BGDropdowns = {
    init:  init,
    build: buildDropdown,
    sync:  function (id) {
      var s = document.getElementById(id);
      if (!s) return;
      var w = s.nextSibling;
      if (w && typeof w._sync === 'function') w._sync();
    },
  };

  /* ─── 6. Auto-run ────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());