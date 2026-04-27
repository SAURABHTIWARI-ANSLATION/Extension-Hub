/**
 * dropdowns.js — Custom dropdown system
 * CSP-safe · no eval · MV3 compliant
 * Styles are in sidebar.css
 */
(function () {
  'use strict';

  var WRAP = 'ca-dropdown';
  var MENU = 'ca-menu';
  var ITEM = 'ca-item';
  var OPEN = 'ca-open';
  var ACT = 'ca-active';
  var NEXT_ID = 1;

  function clearNode(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function svgEl(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs || {}).forEach(function (k) {
      el.setAttribute(k, attrs[k]);
    });
    return el;
  }

  function iconCaret() {
    var svg = svgEl('svg', {
      width: '16', height: '16', viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', 'stroke-width': '2',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    });
    svg.appendChild(svgEl('polyline', { points: '6 9 12 15 18 9' }));
    return svg;
  }

  function iconSearch() {
    var svg = svgEl('svg', {
      width: '13', height: '13', viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', 'stroke-width': '2.5',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    });
    svg.appendChild(svgEl('circle', { cx: '11', cy: '11', r: '8' }));
    svg.appendChild(svgEl('path', { d: 'm21 21-4.35-4.35' }));
    return svg;
  }

  function iconCheck() {
    var svg = svgEl('svg', {
      width: '14', height: '14', viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', 'stroke-width': '2.5',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    });
    svg.appendChild(svgEl('polyline', { points: '20 6 9 17 4 12' }));
    return svg;
  }

  function positionMenu(trigger, menu) {
    var rect = trigger.getBoundingClientRect();
    var vpHeight = window.innerHeight || document.documentElement.clientHeight;
    var estimatedHeight = 260;

    menu.style.width = rect.width + 'px';
    menu.style.left = rect.left + 'px';

    if (rect.bottom + estimatedHeight + 8 <= vpHeight) {
      menu.style.top = rect.bottom + 8 + 'px';
      menu.style.bottom = 'auto';
    } else {
      menu.style.bottom = vpHeight - rect.top + 8 + 'px';
      menu.style.top = 'auto';
    }
  }

  function selectedText(select) {
    var o = select.options[select.selectedIndex];
    return o ? o.text : '';
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

    var triggerText = document.createElement('span');
    triggerText.className = 'ca-trigger-text';
    triggerText.textContent = selectedText(select);

    var triggerCaret = document.createElement('span');
    triggerCaret.className = 'ca-caret';
    triggerCaret.appendChild(iconCaret());

    trigger.appendChild(triggerText);
    trigger.appendChild(triggerCaret);

    var menu = document.createElement('div');
    menu.className = MENU;
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-hidden', 'true');
    var menuId = 'ca-menu-' + (NEXT_ID++);
    menu.id = menuId;
    trigger.setAttribute('aria-controls', menuId);
    document.body.appendChild(menu);
    menu._ownerWrap = wrap;

    var searchInput = null;
    if (useSearch) {
      var searchWrap = document.createElement('div');
      searchWrap.className = 'ca-sw';

      var searchIcon = document.createElement('span');
      searchIcon.className = 'ca-si';
      searchIcon.appendChild(iconSearch());

      searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.className = 'ca-search';
      searchInput.placeholder = 'Search...';
      searchInput.autocomplete = 'off';
      searchInput.spellcheck = false;

      searchWrap.appendChild(searchIcon);
      searchWrap.appendChild(searchInput);
      menu.appendChild(searchWrap);
    }

    var listWrap = document.createElement('div');
    listWrap.className = 'ca-list';
    menu.appendChild(listWrap);

    function closeOtherMenus() {
      document.querySelectorAll('.' + MENU + '.ca-vis').forEach(function (m) {
        if (m !== menu) {
          m.classList.remove('ca-vis');
          m.setAttribute('aria-hidden', 'true');
          if (m._ownerWrap) {
            m._ownerWrap.classList.remove(OPEN);
            var otherTrigger = m._ownerWrap.querySelector('.ca-trigger');
            if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
          }
        }
      });
    }

    function populate(filterText) {
      clearNode(listWrap);
      var q = (filterText || '').toLowerCase().trim();
      var count = 0;

      Array.prototype.forEach.call(select.options, function (opt) {
        if (q && opt.text.toLowerCase().indexOf(q) === -1) return;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = ITEM;
        btn.dataset.val = opt.value;
        btn.setAttribute('role', 'option');

        var label = document.createElement('span');
        label.className = 'ca-lbl';
        label.textContent = opt.text;

        var check = document.createElement('span');
        check.className = 'ca-chk';
        check.appendChild(iconCheck());

        btn.appendChild(label);
        btn.appendChild(check);

        if (opt.value === select.value) btn.classList.add(ACT);

        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          select.value = opt.value;
          triggerText.textContent = opt.text;
          listWrap.querySelectorAll('.' + ITEM).forEach(function (i) { i.classList.remove(ACT); });
          btn.classList.add(ACT);
          closeMenu();
          select.dispatchEvent(new Event('change', { bubbles: true }));
        });

        listWrap.appendChild(btn);
        count += 1;
      });

      if (count === 0) {
        var empty = document.createElement('div');
        empty.className = 'ca-empty';
        empty.textContent = 'No results';
        listWrap.appendChild(empty);
      }
    }

    var isOpen = false;

    function openMenu() {
      closeOtherMenus();
      isOpen = true;
      positionMenu(trigger, menu);
      menu.classList.add('ca-vis');
      menu.setAttribute('aria-hidden', 'false');
      wrap.classList.add(OPEN);
      trigger.setAttribute('aria-expanded', 'true');

      var active = listWrap.querySelector('.' + ITEM + '.' + ACT);
      if (active) {
        setTimeout(function () {
          active.scrollIntoView({ block: 'nearest' });
        }, 10);
      }

      if (searchInput) {
        searchInput.value = '';
        populate('');
        setTimeout(function () { searchInput.focus(); }, 30);
      }
    }

    function closeMenu() {
      isOpen = false;
      menu.classList.remove('ca-vis');
      menu.setAttribute('aria-hidden', 'true');
      wrap.classList.remove(OPEN);
      trigger.setAttribute('aria-expanded', 'false');
    }

    function syncFromSelect() {
      triggerText.textContent = selectedText(select);
      populate(searchInput ? searchInput.value : '');
    }

    populate('');

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        populate(searchInput.value);
      });
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (isOpen) closeMenu();
      else openMenu();
    });

    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isOpen) openMenu();
      } else if (e.key === 'Escape') {
        closeMenu();
      }
    });

    document.addEventListener('click', function (e) {
      if (isOpen && !wrap.contains(e.target) && !menu.contains(e.target)) {
        closeMenu();
      }
    });

    window.addEventListener('scroll', function () {
      if (isOpen) positionMenu(trigger, menu);
    }, { passive: true });

    window.addEventListener('resize', function () {
      if (isOpen) positionMenu(trigger, menu);
    }, { passive: true });

    select.addEventListener('change', syncFromSelect);

    var obs = new MutationObserver(function () {
      syncFromSelect();
    });
    obs.observe(select, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['value']
    });

    wrap._sync = syncFromSelect;

    wrap.appendChild(trigger);
    select.classList.add('ca-native-hidden');
    select.parentNode.insertBefore(wrap, select.nextSibling);

    return wrap;
  }

  function init() {
    document.querySelectorAll('select:not([data-ca-skip])').forEach(function (s) {
      buildDropdown(s);
    });
  }

  function sync(id) {
    var select = document.getElementById(id);
    if (!select) return;
    var next = select.nextElementSibling;
    if (next && typeof next._sync === 'function') next._sync();
  }

  function syncAll() {
    document.querySelectorAll('.' + WRAP).forEach(function (wrap) {
      if (typeof wrap._sync === 'function') wrap._sync();
    });
  }

  window.CADropdowns = {
    init: init,
    build: buildDropdown,
    sync: sync,
    syncAll: syncAll
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
