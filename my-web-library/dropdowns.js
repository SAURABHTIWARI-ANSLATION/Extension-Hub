(function () {
  'use strict';

  var WRAP = 'ca-dropdown';
  var MENU = 'ca-menu';
  var ITEM = 'ca-item';
  var OPEN = 'ca-open';
  var ACT = 'ca-active';
  var VIS = 'ca-vis';
  var READY = 'ca-dropdown-ready';
  var SEARCH_THRESHOLD = 8;
  var MENU_OFFSET = 6;
  var MENU_SAFE_GAP = 8;

  function createIcon(markup) {
    var span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = markup;
    return span;
  }

  function selectedText(select) {
    var option = select.options[select.selectedIndex];
    return option ? option.text : '';
  }

  function getMenuHeight(menu) {
    var visible = menu.classList.contains(VIS);
    var previousVisibility = menu.style.visibility;
    var previousDisplay = menu.style.display;

    if (!visible) {
      menu.style.visibility = 'hidden';
      menu.style.display = 'block';
    }

    var height = menu.offsetHeight || 242;

    if (!visible) {
      menu.style.visibility = previousVisibility;
      menu.style.display = previousDisplay;
    }

    return height;
  }

  function positionMenu(trigger, menu) {
    var rect = trigger.getBoundingClientRect();
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    var viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    var menuHeight = getMenuHeight(menu);
    var maxWidth = Math.max(0, viewportWidth - MENU_SAFE_GAP * 2);
    var width = Math.min(rect.width, maxWidth);
    var left = Math.min(rect.left, viewportWidth - width - MENU_SAFE_GAP);

    menu.style.width = width + 'px';
    menu.style.left = Math.max(MENU_SAFE_GAP, left) + 'px';

    if (rect.bottom + menuHeight + MENU_SAFE_GAP <= viewportHeight) {
      menu.style.top = rect.bottom + MENU_OFFSET + 'px';
      menu.style.bottom = 'auto';
    } else {
      menu.style.bottom = viewportHeight - rect.top + MENU_OFFSET + 'px';
      menu.style.top = 'auto';
    }
  }

  function buildDropdown(select) {
    if (!select || select._caBuilt) {
      return select && select._caWrap ? select._caWrap : null;
    }

    select._caBuilt = true;

    var useSearch = select.options.length >= SEARCH_THRESHOLD;
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

    var triggerCaret = createIcon(
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'
    );
    triggerCaret.className = 'ca-caret';

    trigger.appendChild(triggerText);
    trigger.appendChild(triggerCaret);

    var menu = document.createElement('div');
    menu.className = MENU;
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('tabindex', '-1');
    menu._ownerWrap = wrap;
    document.body.appendChild(menu);

    var searchInput = null;

    if (useSearch) {
      var searchWrap = document.createElement('div');
      searchWrap.className = 'ca-sw';

      var searchIcon = createIcon(
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
      );
      searchIcon.className = 'ca-si';

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

    var isOpen = false;

    function closeMenu() {
      if (!isOpen) {
        return;
      }

      isOpen = false;
      menu.classList.remove(VIS);
      wrap.classList.remove(OPEN);
      trigger.setAttribute('aria-expanded', 'false');
    }

    function populate(filter) {
      listWrap.innerHTML = '';

      var query = (filter || '').toLowerCase().trim();
      var count = 0;

      Array.from(select.options).forEach(function (opt) {
        if (query && opt.text.toLowerCase().indexOf(query) === -1) {
          return;
        }

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = ITEM;
        btn.dataset.val = opt.value;
        btn.setAttribute('role', 'option');
        btn.setAttribute('aria-selected', opt.value === select.value ? 'true' : 'false');

        var label = document.createElement('span');
        label.className = 'ca-lbl';
        label.textContent = opt.text;

        var check = createIcon(
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
        );
        check.className = 'ca-chk';

        btn.appendChild(label);
        btn.appendChild(check);

        if (opt.value === select.value) {
          btn.classList.add(ACT);
        }

        btn.addEventListener('click', function (event) {
          event.stopPropagation();
          select.value = opt.value;
          triggerText.textContent = opt.text;

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
        count += 1;
      });

      if (count === 0) {
        var empty = document.createElement('div');
        empty.className = 'ca-empty';
        empty.textContent = 'No results';
        listWrap.appendChild(empty);
      }
    }

    function openMenu() {
      document.querySelectorAll('.' + MENU + '.' + VIS).forEach(function (otherMenu) {
        if (otherMenu !== menu) {
          otherMenu.classList.remove(VIS);
          if (otherMenu._ownerWrap) {
            otherMenu._ownerWrap.classList.remove(OPEN);
            var ownerTrigger = otherMenu._ownerWrap.querySelector('.ca-trigger');
            if (ownerTrigger) {
              ownerTrigger.setAttribute('aria-expanded', 'false');
            }
          }
        }
      });

      isOpen = true;

      if (searchInput) {
        searchInput.value = '';
        populate('');
      } else {
        populate();
      }

      positionMenu(trigger, menu);
      menu.classList.add(VIS);
      wrap.classList.add(OPEN);
      trigger.setAttribute('aria-expanded', 'true');

      var active = listWrap.querySelector('.' + ITEM + '.' + ACT);
      if (active) {
        window.setTimeout(function () {
          active.scrollIntoView({ block: 'nearest' });
        }, 20);
      }

      if (searchInput) {
        window.setTimeout(function () {
          searchInput.focus();
        }, 30);
      }
    }

    function syncDropdown() {
      triggerText.textContent = selectedText(select);
      trigger.disabled = !!select.disabled;
      trigger.setAttribute('aria-disabled', select.disabled ? 'true' : 'false');
      populate(searchInput ? searchInput.value : '');
    }

    syncDropdown();

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        populate(searchInput.value);
      });
    }

    trigger.addEventListener('click', function (event) {
      event.stopPropagation();
      if (select.disabled) {
        return;
      }

      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('click', function (event) {
      if (isOpen && !wrap.contains(event.target) && !menu.contains(event.target)) {
        closeMenu();
      }
    });

    trigger.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!isOpen) {
          openMenu();
        }
      } else if (event.key === 'Escape') {
        closeMenu();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (isOpen && event.key === 'Escape') {
        closeMenu();
      }
    });

    window.addEventListener(
      'scroll',
      function () {
        if (isOpen) {
          positionMenu(trigger, menu);
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'resize',
      function () {
        if (isOpen) {
          positionMenu(trigger, menu);
        }
      },
      { passive: true }
    );

    var observer = new MutationObserver(function () {
      syncDropdown();
    });

    observer.observe(select, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['value', 'disabled']
    });

    select.addEventListener('change', syncDropdown);

    wrap._sync = syncDropdown;
    wrap._menu = menu;
    select._caWrap = wrap;

    wrap.appendChild(trigger);
    select.classList.add(READY);
    select.setAttribute('aria-hidden', 'true');
    select.parentNode.insertBefore(wrap, select.nextSibling);

    return wrap;
  }

  function init(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('select').forEach(function (select) {
      buildDropdown(select);
    });
  }

  window.CADropdowns = {
    init: init,
    build: buildDropdown,
    sync: function (id) {
      var select = document.getElementById(id);
      if (select && select._caWrap && typeof select._caWrap._sync === 'function') {
        select._caWrap._sync();
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
    });
  } else {
    init();
  }
})();
