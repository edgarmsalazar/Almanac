/*
 * The site's navigation, its behaviour: the template draws it from mkdocs.yml's
 * nav, as a navbar across the top or a sidebar down the left.
 *
 * Navbar: one section's menu open at a time, the whole menu behind the toggler
 * on a narrow window, and a click elsewhere or Escape closes what is open.
 * Sidebar: each section opens in place and stays open.
 *
 * Also, on every page: a site icon drawn inline takes the page's colours, so
 * the tab's icon is made from it too, again whenever the theme changes; and a
 * button with data-open="id" opens that <dialog>, a [data-close] inside one
 * closes it, a click on a .modal's backdrop closes it, and a [data-close]
 * inside an alert takes the alert away.
 */
(function () {
  'use strict';

  var bar = document.getElementById('navbar') || document.getElementById('sidebar');
  var vertical = bar && bar.id === 'sidebar';

  function toggles() {
    return Array.prototype.slice.call(bar.querySelectorAll('.dropdown-toggle'));
  }

  function setOpen(toggle, open) {
    toggle.setAttribute('aria-expanded', String(open));
    document.getElementById(toggle.getAttribute('aria-controls')).hidden = !open;
  }

  if (bar) {
    bar.addEventListener('click', function (event) {
      var toggle = event.target.closest('.dropdown-toggle, .navbar-toggler');
      if (!toggle) return;
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      if (toggle.classList.contains('navbar-toggler')) {
        toggle.setAttribute('aria-expanded', String(open));
        document.getElementById(toggle.getAttribute('aria-controls')).classList.toggle('show', open);
        return;
      }
      if (!vertical) toggles().forEach(function (other) { if (other !== toggle) setOpen(other, false); });
      setOpen(toggle, open);
    });
  }

  if (bar && !vertical) {
    document.addEventListener('click', function (event) {
      if (bar.contains(event.target)) return;
      toggles().forEach(function (toggle) { setOpen(toggle, false); });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      toggles().forEach(function (toggle) {
        if (toggle.getAttribute('aria-expanded') === 'true') { setOpen(toggle, false); toggle.focus(); }
      });
    });
  }

  /* The tab's icon: the inline icon with every colour the page resolved for it
     written in, since a favicon cannot read the page's CSS. */
  function favicon() {
    var svg = document.querySelector('[data-almanac-icon] svg');
    if (!svg) return;
    var copy = svg.cloneNode(true);
    var drawn = svg.querySelectorAll('*');
    Array.prototype.forEach.call(copy.querySelectorAll('*'), function (part, i) {
      var style = getComputedStyle(drawn[i]);
      part.setAttribute('style', 'fill:' + style.fill + ';stroke:' + style.stroke);
    });
    copy.setAttribute('style', 'color:' + getComputedStyle(svg).color);
    var link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = 'data:image/svg+xml,' + encodeURIComponent(new XMLSerializer().serializeToString(copy));
  }

  document.addEventListener('click', function (event) {
    var opener = event.target.closest('[data-open]');
    if (opener) {
      var dialog = document.getElementById(opener.getAttribute('data-open'));
      if (dialog && dialog.showModal) dialog.showModal();
      return;
    }
    var closer = event.target.closest('dialog [data-close]');
    if (closer) {
      closer.closest('dialog').close();
      return;
    }
    var dismiss = event.target.closest('.alert [data-close]');
    if (dismiss) dismiss.closest('.alert').remove();
  });

  /* The backdrop is the dialog itself as far as a click can tell: a press and a
     release both on it, not a drag out of a field inside, is a click outside. */
  var pressed = null;
  document.addEventListener('mousedown', function (event) { pressed = event.target; });
  document.addEventListener('click', function (event) {
    var dialog = event.target;
    if (dialog === pressed && dialog.matches && dialog.matches('dialog.modal[open]')) dialog.close();
  });

  document.addEventListener('DOMContentLoaded', function () {
    favicon();
    new MutationObserver(favicon).observe(document.documentElement, { attributes: true });
  });
})();
