/*
 * Menus under any toggle outside the navbar (navbar.js keeps the navbar's): a
 * row's "more" button, a card's actions, a split button. The markup, which
 * app.css describes:
 *
 *   <div class="dropdown">
 *     <button class="btn dropdown-toggle" type="button" aria-expanded="false" aria-controls="m1">Export</button>
 *     <div class="dropdown-menu" id="m1" hidden>
 *       <button class="dropdown-item" type="button">CSV</button>
 *     </div>
 *   </div>
 *
 * One menu open at a time. It opens below its toggle, or above it when the
 * window has no room below, lined up with the toggle's left edge, or its right
 * with .dropdown-menu-end; it is fixed to the window, so a scrolling table does
 * not clip it, and follows its toggle as the page scrolls. A click on an item,
 * a click elsewhere, Escape or Tab closes it. The arrow keys, Home and End move
 * between its items.
 *
 * An item's own work is the page's: a click listener on it, or a link. A menu
 * opening or closing fires "almanac:dropdown" on the toggle, detail.open.
 */
(function () {
  'use strict';

  var open = null; /* { toggle, menu } */
  var GAP = 4;

  function menuOf(toggle) {
    return document.getElementById(toggle.getAttribute('aria-controls'));
  }

  function items(menu) {
    return Array.prototype.filter.call(
      menu.querySelectorAll('.dropdown-item'),
      function (item) { return !item.disabled && !item.classList.contains('disabled'); }
    );
  }

  function place() {
    if (!open) return;
    var menu = open.menu;
    var at = open.toggle.getBoundingClientRect();
    menu.style.top = '0px';
    menu.style.left = '0px';
    var width = menu.offsetWidth;
    var height = menu.offsetHeight;
    var below = window.innerHeight - at.bottom - GAP;
    var top = below >= height || below >= at.top ? at.bottom + GAP : at.top - GAP - height;
    var left = menu.classList.contains('dropdown-menu-end') ? at.right - width : at.left;
    left = Math.max(GAP, Math.min(left, document.documentElement.clientWidth - width - GAP));
    menu.style.top = Math.max(GAP, top) + 'px';
    menu.style.left = left + 'px';
  }

  function close(focusToggle) {
    if (!open) return;
    var was = open;
    open = null;
    was.menu.hidden = true;
    was.toggle.setAttribute('aria-expanded', 'false');
    if (focusToggle) was.toggle.focus();
    was.toggle.dispatchEvent(new CustomEvent('almanac:dropdown', { bubbles: true, detail: { open: false } }));
  }

  function show(toggle, focusItem) {
    var menu = menuOf(toggle);
    if (!menu) return;
    close(false);
    open = { toggle: toggle, menu: menu };
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    place();
    if (focusItem) {
      var list = items(menu);
      if (list.length) list[focusItem === 'last' ? list.length - 1 : 0].focus();
    }
    toggle.dispatchEvent(new CustomEvent('almanac:dropdown', { bubbles: true, detail: { open: true } }));
  }

  function ours(toggle) {
    return toggle && !toggle.closest('.navbar') && toggle.hasAttribute('aria-controls');
  }

  document.addEventListener('click', function (event) {
    var toggle = event.target.closest('.dropdown-toggle');
    if (ours(toggle)) {
      if (open && open.toggle === toggle) close(false);
      else show(toggle, event.detail === 0 ? 'first' : null);
      return;
    }
    if (!open) return;
    if (open.menu.contains(event.target)) {
      if (event.target.closest('.dropdown-item')) close(true);
      return;
    }
    close(false);
  });

  document.addEventListener('keydown', function (event) {
    var toggle = event.target.closest && event.target.closest('.dropdown-toggle');
    if (ours(toggle) && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      show(toggle, event.key === 'ArrowUp' ? 'last' : 'first');
      return;
    }
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key === 'Tab') {
      close(false);
      return;
    }
    if (!open.menu.contains(event.target)) return;
    var list = items(open.menu);
    var at = list.indexOf(event.target);
    var next = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: list.length - 1 }[event.key];
    if (next === undefined || !list.length) return;
    event.preventDefault();
    list[(next + list.length) % list.length].focus();
  });

  window.addEventListener('resize', place);
  window.addEventListener('scroll', place, true);

  window.Almanac = window.Almanac || {};
  window.Almanac.dropdown = { close: function () { close(false); } };
})();
