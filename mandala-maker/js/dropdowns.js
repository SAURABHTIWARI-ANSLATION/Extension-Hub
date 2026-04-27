/**
 * Mandala Maker Dropdown System
 * CSP-safe · no eval · no dynamic style tags · MV3 compliant
 */
(function () {
  'use strict';

  var WRAP = 'mm-dropdown';
  var MENU = 'mm-menu';
  var ITEM = 'mm-item';
  var OPEN = 'mm-open';
  var ACT = 'mm-active';
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  function iconCaret() {
    var svg = svgEl('svg', { width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    svg.appendChild(svgEl('polyline', { points: '6 9 12 15 18 9' }));
    return svg;
  }

  function iconSearch() {
    var svg = svgEl('svg', { width: '13', height: '13', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    svg.appendChild(svgEl('circle', { cx: '11', cy: '11', r: '8' }));
    svg.appendChild(svgEl('path', { d: 'm21 21-4.35-4.35' }));
    return svg;
  }

  function iconCheck() {
    var svg = svgEl('svg', { width: '14', height: '14', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    svg.appendChild(svgEl('polyline', { points: '20 6 9 17 4 12' }));
    return svg;
  }

  function positionMenu(trigger, menu) {
    var rect = trigger.getBoundingClientRect();
    var vp = window.innerHeight || document.documentElement.clientHeight;
    var mH = 242;

    menu.style.width = rect.width + 'px';
    menu.style.left = rect.left + 'px';

    if (rect.bottom + mH + 8 <= vp) {
      menu.style.top = (rect.bottom + 6) + 'px';
      menu.style.bottom = 'auto';
    } else {
      menu.style.bottom = (vp - rect.top + 6) + 'px';
      menu.style.top = 'auto';
    }
  }

  function selectedText(select) {
    var opt = select.options[select.selectedIndex];
    return opt ? opt.text : '';
  }

  function buildDropdown(select) {
    if (!select || select._mmBuilt) return null;
    select._mmBuilt = true;

    var useSearch = select.options.length >= 8;

    var wrap = document.createElement('div');
    wrap.className = WRAP;

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'mm-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    var text = document.createElement('span');
    text.className = 'mm-trigger-text';
    text.textContent = selectedText(select);

    var caret = document.createElement('span');
    caret.className = 'mm-caret';
    caret.appendChild(iconCaret());

    trigger.appendChild(text);
    trigger.appendChild(caret);

    var menu = document.createElement('div');
    menu.className = MENU;
    menu.setAttribute('role', 'listbox');
    document.body.appendChild(menu);
    menu._ownerWrap = wrap;

    var searchInput = null;
    if (useSearch) {
      var sw = document.createElement('div');
      sw.className = 'mm-sw';

      var si = document.createElement('span');
      si.className = 'mm-si';
      si.appendChild(iconSearch());

      searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.className = 'mm-search';
      searchInput.placeholder = 'Search...';
      searchInput.autocomplete = 'off';
      searchInput.spellcheck = false;

      sw.appendChild(si);
      sw.appendChild(searchInput);
      menu.appendChild(sw);
    }

    var listWrap = document.createElement('div');
    menu.appendChild(listWrap);

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

        var lbl = document.createElement('span');
        lbl.className = 'mm-lbl';
        lbl.textContent = opt.text;

        var chk = document.createElement('span');
        chk.className = 'mm-chk';
        chk.appendChild(iconCheck());

        btn.appendChild(lbl);
        btn.appendChild(chk);

        if (opt.value === select.value) btn.classList.add(ACT);

        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          select.value = opt.value;
          text.textContent = opt.text;
          listWrap.querySelectorAll('.' + ITEM).forEach(function (i) { i.classList.remove(ACT); });
          btn.classList.add(ACT);
          closeMenu();
          select.dispatchEvent(new Event('change', { bubbles: true }));
        });

        listWrap.appendChild(btn);
        count++;
      });

      if (count === 0) {
        var empty = document.createElement('div');
        empty.className = 'mm-empty';
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

    var isOpen = false;

    function openMenu() {
      document.querySelectorAll('.' + MENU + '.mm-vis').forEach(function (m) {
        if (m !== menu) {
          m.classList.remove('mm-vis');
          if (m._ownerWrap) m._ownerWrap.classList.remove(OPEN);
        }
      });

      isOpen = true;
      positionMenu(trigger, menu);
      menu.classList.add('mm-vis');
      wrap.classList.add(OPEN);
      trigger.setAttribute('aria-expanded', 'true');

      var active = listWrap.querySelector('.' + ITEM + '.' + ACT);
      if (active) {
        setTimeout(function () {
          active.scrollIntoView({ block: 'nearest' });
        }, 20);
      }

      if (searchInput) {
        searchInput.value = '';
        populate('');
        setTimeout(function () { searchInput.focus(); }, 30);
      }
    }

    function closeMenu() {
      isOpen = false;
      menu.classList.remove('mm-vis');
      wrap.classList.remove(OPEN);
      trigger.setAttribute('aria-expanded', 'false');
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (isOpen) closeMenu();
      else openMenu();
    });

    document.addEventListener('click', function (e) {
      if (isOpen && !wrap.contains(e.target) && !menu.contains(e.target)) closeMenu();
    });

    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isOpen) openMenu();
      } else if (e.key === 'Escape') {
        closeMenu();
      }
    });

    window.addEventListener('scroll', function () {
      if (isOpen) positionMenu(trigger, menu);
    }, { passive: true });

    window.addEventListener('resize', function () {
      if (isOpen) positionMenu(trigger, menu);
    }, { passive: true });

    // Keep trigger text synchronized when the native select changes from app logic.
    select.addEventListener('change', function () {
      text.textContent = selectedText(select);
      populate(searchInput ? searchInput.value : '');
    });

    var obs = new MutationObserver(function () {
      populate(searchInput ? searchInput.value : '');
      text.textContent = selectedText(select);
    });

    obs.observe(select, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['value']
    });

    wrap._sync = function () {
      text.textContent = selectedText(select);
      populate(searchInput ? searchInput.value : '');
    };

    wrap.appendChild(trigger);
    select.style.display = 'none';
    select.parentNode.insertBefore(wrap, select.nextSibling);

    return wrap;
  }

  function init() {
    document.querySelectorAll('select').forEach(function (s) {
      if (!s.dataset.nativeSelect) buildDropdown(s);
    });
  }

  window.MMDropdowns = {
    init: init,
    build: buildDropdown,
    sync: function (id) {
      var s = document.getElementById(id);
      if (!s) return;
      var w = s.nextSibling;
      if (w && typeof w._sync === 'function') w._sync();
    },
    syncAll: function () {
      document.querySelectorAll('select').forEach(function (s) {
        var w = s.nextSibling;
        if (w && typeof w._sync === 'function') w._sync();
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
