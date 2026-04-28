/**
 * dropdowns.js — URLBurst Custom Dropdown System
 * CSP-safe · no eval · no innerHTML except SVG icons · MV3 compliant
 * Fully aligned with URLBurst design tokens (popup.css :root vars)
 */
(function () {
  'use strict';

  /* ── Class name constants ──────────────────────────────────── */
  var CLS_WRAP    = 'ub-dropdown';
  var CLS_TRIGGER = 'ub-trigger';
  var CLS_TTEXT   = 'ub-trigger-text';
  var CLS_CARET   = 'ub-caret';
  var CLS_MENU    = 'ub-menu';
  var CLS_MENU_VIS= 'ub-menu-vis';
  var CLS_SW      = 'ub-search-wrap';
  var CLS_SI      = 'ub-search-icon';
  var CLS_SEARCH  = 'ub-search';
  var CLS_LIST    = 'ub-list';
  var CLS_ITEM    = 'ub-item';
  var CLS_ACTIVE  = 'ub-active';
  var CLS_EMPTY   = 'ub-empty';
  var CLS_OPEN    = 'ub-open';

  /* ── SVG helpers (no innerHTML on host elements) ─────────────── */
  function makeSVG(pathData, w, h) {
    var ns  = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', String(w || 14));
    svg.setAttribute('height', String(h || 14));
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    // pathData can be an array of { tag, attrs }
    pathData.forEach(function(el) {
      var node = document.createElementNS(ns, el.tag);
      Object.keys(el.attrs).forEach(function(k) { node.setAttribute(k, el.attrs[k]); });
      svg.appendChild(node);
    });
    return svg;
  }

  var CARET_SVG = [{ tag: 'polyline', attrs: { points: '6 9 12 15 18 9' } }];
  var CHECK_SVG = [{ tag: 'polyline', attrs: { points: '20 6 9 17 4 12' } }];
  var SEARCH_SVG = [
    { tag: 'circle', attrs: { cx: '11', cy: '11', r: '8' } },
    { tag: 'path',   attrs: { d: 'm21 21-4.35-4.35' } }
  ];

  /* ── Get display text for current option ─────────────────────── */
  function selText(select) {
    var o = select.options[select.selectedIndex];
    return o ? o.text : '';
  }

  /* ── Smart menu positioning ──────────────────────────────────── */
  function positionMenu(trigger, menu) {
    var rect = trigger.getBoundingClientRect();
    var vp   = window.innerHeight || document.documentElement.clientHeight;
    var menuH = Math.min(menu.scrollHeight || 260, 260);

    menu.style.width = rect.width + 'px';
    menu.style.left  = Math.max(0, rect.left) + 'px';

    var spaceBelow = vp - rect.bottom;
    var spaceAbove = rect.top;

    if (spaceBelow >= menuH + 10 || spaceBelow >= spaceAbove) {
      menu.style.top    = (rect.bottom + 4) + 'px';
      menu.style.bottom = 'auto';
      menu.classList.remove('ub-menu-up');
    } else {
      menu.style.top    = 'auto';
      menu.style.bottom = (vp - rect.top + 4) + 'px';
      menu.classList.add('ub-menu-up');
    }
  }

  /* ── Build a single dropdown from a <select> ─────────────────── */
  function buildDropdown(select) {
    if (!select || select._ubBuilt) return null;
    select._ubBuilt = true;

    var useSearch = select.options.length >= 8;

    /* ── Wrapper ── */
    var wrap = document.createElement('div');
    wrap.className = CLS_WRAP;

    /* ── Trigger button ── */
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = CLS_TRIGGER;
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    var tText = document.createElement('span');
    tText.className   = CLS_TTEXT;
    tText.textContent = selText(select);

    var tCaret = document.createElement('span');
    tCaret.className = CLS_CARET;
    tCaret.appendChild(makeSVG(CARET_SVG, 14, 14));

    trigger.appendChild(tText);
    trigger.appendChild(tCaret);
    wrap.appendChild(trigger);

    /* ── Menu panel (appended to body so it floats above overflow) ── */
    var menu = document.createElement('div');
    menu.className = CLS_MENU;
    menu.setAttribute('role', 'listbox');
    menu._ownerWrap = wrap;
    document.body.appendChild(menu);

    /* ── Optional search bar ── */
    var searchInput = null;
    if (useSearch) {
      var sw = document.createElement('div');
      sw.className = CLS_SW;

      var si = document.createElement('span');
      si.className = CLS_SI;
      si.appendChild(makeSVG(SEARCH_SVG, 13, 13));

      searchInput = document.createElement('input');
      searchInput.type         = 'text';
      searchInput.className    = CLS_SEARCH;
      searchInput.placeholder  = 'Search…';
      searchInput.autocomplete = 'off';
      searchInput.spellcheck   = false;

      sw.appendChild(si);
      sw.appendChild(searchInput);
      menu.appendChild(sw);
    }

    /* ── Scrollable list container ── */
    var listWrap = document.createElement('div');
    listWrap.className = CLS_LIST;
    menu.appendChild(listWrap);

    /* ── Populate items ── */
    function populate(filter) {
      /* Clear without innerHTML */
      while (listWrap.firstChild) listWrap.removeChild(listWrap.firstChild);

      var q     = (filter || '').toLowerCase().trim();
      var count = 0;

      Array.from(select.options).forEach(function (opt) {
        if (q && opt.text.toLowerCase().indexOf(q) === -1) return;

        var btn = document.createElement('button');
        btn.type      = 'button';
        btn.className = CLS_ITEM;
        btn.dataset.val = opt.value;
        btn.setAttribute('role', 'option');
        btn.setAttribute('aria-selected', opt.value === select.value ? 'true' : 'false');

        var lbl = document.createElement('span');
        lbl.className   = 'ub-lbl';
        lbl.textContent = opt.text;

        var chk = document.createElement('span');
        chk.className = 'ub-chk';
        chk.appendChild(makeSVG(CHECK_SVG, 13, 13));

        btn.appendChild(lbl);
        btn.appendChild(chk);

        if (opt.value === select.value) {
          btn.classList.add(CLS_ACTIVE);
        }

        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          select.value      = opt.value;
          tText.textContent = opt.text;
          /* update active states */
          listWrap.querySelectorAll('.' + CLS_ITEM).forEach(function (i) {
            i.classList.remove(CLS_ACTIVE);
            i.setAttribute('aria-selected', 'false');
          });
          btn.classList.add(CLS_ACTIVE);
          btn.setAttribute('aria-selected', 'true');
          closeMenu();
          select.dispatchEvent(new Event('change', { bubbles: true }));
        });

        listWrap.appendChild(btn);
        count++;
      });

      /* Empty state */
      if (count === 0) {
        var empty = document.createElement('div');
        empty.className   = CLS_EMPTY;
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

    /* ── Open / Close ── */
    var isOpen = false;

    function openMenu() {
      /* Close any other open menus */
      document.querySelectorAll('.' + CLS_MENU + '.' + CLS_MENU_VIS).forEach(function (m) {
        if (m !== menu) {
          m.classList.remove(CLS_MENU_VIS);
          if (m._ownerWrap) m._ownerWrap.classList.remove(CLS_OPEN);
          var t = m._ownerWrap && m._ownerWrap.querySelector('.' + CLS_TRIGGER);
          if (t) t.setAttribute('aria-expanded', 'false');
        }
      });

      isOpen = true;
      positionMenu(trigger, menu);
      menu.classList.add(CLS_MENU_VIS);
      wrap.classList.add(CLS_OPEN);
      trigger.setAttribute('aria-expanded', 'true');

      /* Scroll active item into view */
      var active = listWrap.querySelector('.' + CLS_ITEM + '.' + CLS_ACTIVE);
      if (active) {
        setTimeout(function () { active.scrollIntoView({ block: 'nearest' }); }, 20);
      }

      if (searchInput) {
        searchInput.value = '';
        populate();
        setTimeout(function () { searchInput.focus(); }, 30);
      }
    }

    function closeMenu() {
      isOpen = false;
      menu.classList.remove(CLS_MENU_VIS);
      wrap.classList.remove(CLS_OPEN);
      trigger.setAttribute('aria-expanded', 'false');
    }

    /* ── Event listeners ── */
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      isOpen ? closeMenu() : openMenu();
    });

    /* Close on outside click */
    document.addEventListener('click', function (e) {
      if (isOpen && !wrap.contains(e.target) && !menu.contains(e.target)) {
        closeMenu();
      }
    });

    /* Keyboard navigation */
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isOpen) openMenu();
        else {
          var first = listWrap.querySelector('.' + CLS_ITEM);
          if (first) first.focus();
        }
      } else if (e.key === 'Escape') {
        closeMenu();
        trigger.focus();
      }
    });

    listWrap.addEventListener('keydown', function (e) {
      var items = Array.from(listWrap.querySelectorAll('.' + CLS_ITEM));
      var idx   = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (idx < items.length - 1) items[idx + 1].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (idx > 0) items[idx - 1].focus();
        else if (searchInput) searchInput.focus();
        else trigger.focus();
      } else if (e.key === 'Escape') {
        closeMenu();
        trigger.focus();
      } else if (e.key === 'Tab') {
        closeMenu();
      }
    });

    /* Reposition on scroll/resize */
    window.addEventListener('scroll', function () { if (isOpen) positionMenu(trigger, menu); }, { passive: true });
    window.addEventListener('resize', function () { if (isOpen) positionMenu(trigger, menu); }, { passive: true });

    /* Observe external changes to <select> */
    var obs = new MutationObserver(function () {
      populate(searchInput ? searchInput.value : '');
      tText.textContent = selText(select);
    });
    obs.observe(select, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ['value', 'selected']
    });

    /* Public sync method */
    wrap._sync = function () {
      tText.textContent = selText(select);
      populate();
    };

    /* Hide the native select */
    select.style.display = 'none';
    select.parentNode.insertBefore(wrap, select.nextSibling);

    return wrap;
  }

  /* ── Init all selects on the page ── */
  function init() {
    document.querySelectorAll('select').forEach(function (s) {
      buildDropdown(s);
    });
  }

  /* ── Public API ── */
  window.UBDropdowns = {
    init:  init,
    build: buildDropdown,
    sync: function (id) {
      var s = document.getElementById(id);
      if (!s) return;
      var w = s.nextSibling;
      if (w && typeof w._sync === 'function') w._sync();
    }
  };

  /* ── Auto-run ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
