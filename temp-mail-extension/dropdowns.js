/**
 * dropdowns.js — ConvertAll Premium Dropdown System v2
 * CSP-safe · no eval · no dynamic styles · MV3 compliant
 * Styles are in popup.css (not injected via JS)
 */
(function () {
  'use strict';

  var WRAP  = 'ca-dropdown';
  var MENU  = 'ca-menu';
  var ITEM  = 'ca-item';
  var OPEN  = 'ca-open';
  var ACT   = 'ca-active';

  /* ── 1. Position menu with fixed coords ─────────────────── */
  function positionMenu(trigger, menu) {
    var rect = trigger.getBoundingClientRect();
    var vp   = window.innerHeight || document.documentElement.clientHeight;
    var mH   = 242;

    menu.style.width = rect.width + 'px';
    menu.style.left  = rect.left  + 'px';

    if (rect.bottom + mH + 8 <= vp) {
      menu.style.top    = (rect.bottom + 6) + 'px';
      menu.style.bottom = 'auto';
    } else {
      menu.style.bottom = (vp - rect.top + 6) + 'px';
      menu.style.top    = 'auto';
    }
  }

  /* ── 2. Helper ───────────────────────────────────────────── */
  function selText(select) {
    var o = select.options[select.selectedIndex];
    return o ? o.text : '';
  }

  /* ── 3. Build one dropdown ───────────────────────────────── */
  function buildDropdown(select) {
    if (!select || select._caBuilt) return null;
    select._caBuilt = true;

    var useSearch = select.options.length >= 8;

    /* wrapper */
    var wrap = document.createElement('div');
    wrap.className = WRAP;

    /* trigger */
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'ca-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded',  'false');

    var tText = document.createElement('span');
    tText.className   = 'ca-trigger-text';
    tText.textContent = selText(select);

    var tCaret = document.createElement('span');
    tCaret.className = 'ca-caret';
    tCaret.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

    trigger.appendChild(tText);
    trigger.appendChild(tCaret);

    /* menu — goes to body */
    var menu = document.createElement('div');
    menu.className = MENU;
    menu.setAttribute('role', 'listbox');
    document.body.appendChild(menu);
    menu._ownerWrap = wrap;

    /* search */
    var searchInput = null;
    if (useSearch) {
      var sw = document.createElement('div');
      sw.className = 'ca-sw';

      var si = document.createElement('span');
      si.className = 'ca-si';
      si.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>';

      searchInput = document.createElement('input');
      searchInput.type        = 'text';
      searchInput.className   = 'ca-search';
      searchInput.placeholder = 'Search…';
      searchInput.autocomplete = 'off';
      searchInput.spellcheck  = false;

      sw.appendChild(si);
      sw.appendChild(searchInput);
      menu.appendChild(sw);
    }

    var listWrap = document.createElement('div');
    menu.appendChild(listWrap);

    /* populate */
    function populate(filter) {
      listWrap.innerHTML = '';
      var q = (filter || '').toLowerCase().trim();
      var count = 0;

      Array.from(select.options).forEach(function(opt) {
        if (q && opt.text.toLowerCase().indexOf(q) === -1) return;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = ITEM;
        btn.dataset.val = opt.value;
        btn.setAttribute('role', 'option');

        var lbl = document.createElement('span');
        lbl.className   = 'ca-lbl';
        lbl.textContent = opt.text;

        var chk = document.createElement('span');
        chk.className = 'ca-chk';
        chk.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

        btn.appendChild(lbl);
        btn.appendChild(chk);

        if (opt.value === select.value) btn.classList.add(ACT);

        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          select.value  = opt.value;
          tText.textContent = opt.text;
          listWrap.querySelectorAll('.' + ITEM).forEach(function(i) { i.classList.remove(ACT); });
          btn.classList.add(ACT);
          closeMenu();
          select.dispatchEvent(new Event('change', { bubbles: true }));
        });

        listWrap.appendChild(btn);
        count++;
      });

      if (count === 0) {
        var empty = document.createElement('div');
        empty.className   = 'ca-empty';
        empty.textContent = 'No results';
        listWrap.appendChild(empty);
      }
    }

    populate();

    if (searchInput) {
      searchInput.addEventListener('input', function() { populate(searchInput.value); });
    }

    /* open / close */
    var isOpen = false;

    function openMenu() {
      document.querySelectorAll('.' + MENU + '.ca-vis').forEach(function(m) {
        if (m !== menu) {
          m.classList.remove('ca-vis');
          if (m._ownerWrap) m._ownerWrap.classList.remove(OPEN);
        }
      });

      isOpen = true;
      positionMenu(trigger, menu);
      menu.classList.add('ca-vis');
      wrap.classList.add(OPEN);
      trigger.setAttribute('aria-expanded', 'true');

      var active = listWrap.querySelector('.' + ITEM + '.' + ACT);
      if (active) setTimeout(function() { active.scrollIntoView({ block: 'nearest' }); }, 20);

      if (searchInput) {
        searchInput.value = '';
        populate();
        setTimeout(function() { searchInput.focus(); }, 30);
      }
    }

    function closeMenu() {
      isOpen = false;
      menu.classList.remove('ca-vis');
      wrap.classList.remove(OPEN);
      trigger.setAttribute('aria-expanded', 'false');
    }

    /* events */
    trigger.addEventListener('click', function(e) {
      e.stopPropagation();
      isOpen ? closeMenu() : openMenu();
    });

    document.addEventListener('click', function(e) {
      if (isOpen && !wrap.contains(e.target) && !menu.contains(e.target)) closeMenu();
    });

    trigger.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!isOpen) openMenu(); }
      else if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('scroll',  function() { if (isOpen) positionMenu(trigger, menu); }, { passive: true });
    window.addEventListener('resize',  function() { if (isOpen) positionMenu(trigger, menu); }, { passive: true });

    /* observe external select mutations */
    var obs = new MutationObserver(function() {
      populate(searchInput ? searchInput.value : '');
      tText.textContent = selText(select);
    });
    obs.observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] });

    /* public sync */
    wrap._sync = function() {
      tText.textContent = selText(select);
      populate();
    };

    /* insert wrapper in DOM */
    wrap.appendChild(trigger);
    select.style.display = 'none';
    select.parentNode.insertBefore(wrap, select.nextSibling);

    return wrap;
  }

  /* ── 4. Init all selects ─────────────────────────────────── */
  function init() {
    document.querySelectorAll('select').forEach(function(s) { buildDropdown(s); });
  }

  /* ── 5. Public API ───────────────────────────────────────── */
  window.CADropdowns = {
    init:  init,
    build: buildDropdown,
    sync:  function(id) {
      var s = document.getElementById(id);
      if (!s) return;
      var w = s.nextSibling;
      if (w && typeof w._sync === 'function') w._sync();
    }
  };

  /* ── 6. Auto-run ─────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
