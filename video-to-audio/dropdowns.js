/**
 * dropdowns.js - ConvertAll Premium Dropdown System v2
 * CSP-safe, no eval, MV3 compliant.
 * Styles live in popup.html's stylesheet.
 */
(function () {
  'use strict';

  var WRAP = 'ca-dropdown';
  var MENU = 'ca-menu';
  var ITEM = 'ca-item';
  var OPEN = 'ca-open';
  var ACT = 'ca-active';

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

  function selText(select) {
    var option = select.options[select.selectedIndex];
    return option ? option.text : '';
  }

  function createIcon(name) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    if (name === 'caret') {
      svg.setAttribute('width', '16');
      svg.setAttribute('height', '16');
      svg.setAttribute('stroke-width', '2');
      var caret = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      caret.setAttribute('points', '6 9 12 15 18 9');
      svg.appendChild(caret);
      return svg;
    }

    if (name === 'search') {
      svg.setAttribute('width', '13');
      svg.setAttribute('height', '13');
      svg.setAttribute('stroke-width', '2.5');
      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '11');
      circle.setAttribute('cy', '11');
      circle.setAttribute('r', '8');
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'm21 21-4.35-4.35');
      svg.appendChild(circle);
      svg.appendChild(path);
      return svg;
    }

    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    svg.setAttribute('stroke-width', '2.5');
    var check = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    check.setAttribute('points', '20 6 9 17 4 12');
    svg.appendChild(check);
    return svg;
  }

  function closeOtherMenus(currentMenu) {
    document.querySelectorAll('.' + MENU + '.ca-vis').forEach(function (menu) {
      if (menu !== currentMenu) {
        if (typeof menu._close === 'function') menu._close();
      }
    });
  }

  function buildDropdown(select) {
    if (!select || select._caBuilt) return null;
    select._caBuilt = true;

    var useSearch = select.options.length >= 8;
    var wrap = document.createElement('div');
    wrap.className = WRAP;

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'ca-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    var tText = document.createElement('span');
    tText.className = 'ca-trigger-text';
    tText.textContent = selText(select);

    var tCaret = document.createElement('span');
    tCaret.className = 'ca-caret';
    tCaret.appendChild(createIcon('caret'));

    trigger.appendChild(tText);
    trigger.appendChild(tCaret);

    var menu = document.createElement('div');
    menu.className = MENU;
    menu.setAttribute('role', 'listbox');
    document.body.appendChild(menu);
    menu._ownerWrap = wrap;

    var searchInput = null;
    if (useSearch) {
      var sw = document.createElement('div');
      sw.className = 'ca-sw';

      var si = document.createElement('span');
      si.className = 'ca-si';
      si.appendChild(createIcon('search'));

      searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.className = 'ca-search';
      searchInput.placeholder = 'Search...';
      searchInput.autocomplete = 'off';
      searchInput.spellcheck = false;

      sw.appendChild(si);
      sw.appendChild(searchInput);
      menu.appendChild(sw);
    }

    var listWrap = document.createElement('div');
    listWrap.className = 'ca-list';
    menu.appendChild(listWrap);

    function populate(filter) {
      listWrap.textContent = '';
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
        lbl.className = 'ca-lbl';
        lbl.textContent = opt.text;

        var chk = document.createElement('span');
        chk.className = 'ca-chk';
        chk.appendChild(createIcon('check'));

        btn.appendChild(lbl);
        btn.appendChild(chk);

        if (opt.value === select.value) btn.classList.add(ACT);

        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          select.value = opt.value;
          tText.textContent = opt.text;
          listWrap.querySelectorAll('.' + ITEM).forEach(function (item) {
            item.classList.remove(ACT);
            item.setAttribute('aria-selected', 'false');
          });
          btn.classList.add(ACT);
          btn.setAttribute('aria-selected', 'true');
          closeMenu();
          select.dispatchEvent(new Event('change', { bubbles: true }));
        });

        listWrap.appendChild(btn);
        count++;
      });

      if (count === 0) {
        var empty = document.createElement('div');
        empty.className = 'ca-empty';
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
      closeOtherMenus(menu);

      isOpen = true;
      positionMenu(trigger, menu);
      menu.classList.add('ca-vis');
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
        populate();
        setTimeout(function () {
          searchInput.focus();
        }, 30);
      }
    }

    function closeMenu() {
      isOpen = false;
      menu.classList.remove('ca-vis');
      wrap.classList.remove(OPEN);
      trigger.setAttribute('aria-expanded', 'false');
    }
    menu._close = closeMenu;

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

    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
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

    var obs = new MutationObserver(function () {
      populate(searchInput ? searchInput.value : '');
      tText.textContent = selText(select);
    });
    obs.observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['value', 'selected'] });

    wrap._sync = function () {
      tText.textContent = selText(select);
      populate();
    };

    wrap.appendChild(trigger);
    select.style.display = 'none';
    select.parentNode.insertBefore(wrap, select.nextSibling);

    return wrap;
  }

  function init() {
    document.querySelectorAll('select').forEach(function (select) {
      buildDropdown(select);
    });
  }

  window.CADropdowns = {
    init: init,
    build: buildDropdown,
    sync: function (id) {
      var select = document.getElementById(id);
      if (!select) return;
      var wrap = select.nextSibling;
      if (wrap && typeof wrap._sync === 'function') wrap._sync();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
